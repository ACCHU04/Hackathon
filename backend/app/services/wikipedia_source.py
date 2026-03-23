"""
Wikipedia Source — fetches directly from Wikipedia API.

Why Wikipedia gets special treatment:
  - Always authoritative for factual baseline
  - Structured, clean text (no ads, no paywalls)
  - Free API, no key needed
  - Trust score: 0.85 (high but below .gov/.edu)

Usage: called in parallel with web search, merged into evidence.
"""
import asyncio
import re
from typing import Optional


WIKI_API = "https://en.wikipedia.org/w/api.php"
WIKI_TRUST_SCORE = 0.85

# ── Entity extraction for search query ───────────────────────────────────────

def _best_wiki_query(claim_text: str) -> str:
    """Extract the most searchable entity from the claim."""
    # Try capitalised multi-word entities first (e.g. "Eiffel Tower", "Gustave Eiffel")
    entities = re.findall(r"[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+", claim_text)
    if entities:
        # Prefer longer entities
        return max(entities, key=len)

    # Single capitalised words (e.g. "NASA", "Paris")
    singles = re.findall(r"\b[A-Z][a-zA-Z]{2,}\b", claim_text)
    if singles:
        return singles[0]

    # Fall back to first 5 meaningful words
    stopwords = {"the","a","an","is","are","was","were","in","on","at","of","to","and","or"}
    words = [w for w in claim_text.split() if w.lower() not in stopwords]
    return " ".join(words[:5])


# ── Wikipedia API calls ───────────────────────────────────────────────────────

async def _wiki_search(query: str, limit: int = 3) -> list[str]:
    """Search Wikipedia for page titles matching the query."""
    try:
        import httpx
        headers = {"User-Agent": "VeritasAI/0.1 (https://github.com/ACCHU04/fact-claim-verifier; contact@example.com)"}
        async with httpx.AsyncClient(timeout=8, headers=headers) as client:
            resp = await client.get(WIKI_API, params={
                "action": "query",
                "list":   "search",
                "srsearch": query,
                "srlimit": limit,
                "format": "json",
                "utf8":   1,
            })
            data = resp.json()
            return [hit["title"] for hit in data.get("query", {}).get("search", [])]
    except Exception as exc:
        print(f"[wikipedia] search failed: {exc}")
        return []


async def _wiki_summary(title: str, sentences: int = 5) -> Optional[dict]:
    """Fetch the opening summary of a Wikipedia article."""
    try:
        import httpx
        headers = {"User-Agent": "VeritasAI/0.1 (https://github.com/ACCHU04/fact-claim-verifier; contact@example.com)"}
        async with httpx.AsyncClient(timeout=8, headers=headers) as client:
            resp = await client.get(WIKI_API, params={
                "action":   "query",
                "prop":     "extracts|info",
                "exintro":  True,
                "exsentences": sentences,
                "explaintext": True,
                "inprop":   "url",
                "titles":   title,
                "format":   "json",
                "redirects": 1,
            })
            data  = resp.json()
            pages = data.get("query", {}).get("pages", {})
            page  = next(iter(pages.values()))
            if page.get("pageid", -1) == -1:
                return None
            extract = page.get("extract", "").strip()
            if not extract:
                return None
            url = page.get("fullurl", f"https://en.wikipedia.org/wiki/{title.replace(' ','_')}")
            return {
                "title":   f"{title} — Wikipedia",
                "url":     url,
                "snippet": extract[:600],
                "date":    "",
                "trust":   WIKI_TRUST_SCORE,
                "label":   "wikipedia",
                "source":  "wikipedia",
            }
    except Exception as exc:
        print(f"[wikipedia] summary failed for '{title}': {exc}")
        return None


# ── Public API ────────────────────────────────────────────────────────────────

async def get_wikipedia_evidence(claim_text: str) -> list[dict]:
    """
    Fetch Wikipedia evidence for a claim.

    1. Detect the main entity in the claim
    2. Search Wikipedia for matching articles
    3. Fetch summaries of top 2 results
    4. Return as evidence dicts (same format as search_client)
    """
    query  = _best_wiki_query(claim_text)
    titles = await _wiki_search(query, limit=2)

    if not titles:
        return []

    summaries = await asyncio.gather(*[_wiki_summary(t) for t in titles])
    return [s for s in summaries if s is not None]


async def enrich_with_wikipedia(
    claim_text: str,
    existing_snippets: list[dict],
) -> list[dict]:
    """
    Add Wikipedia evidence to existing snippets if not already present.
    Wikipedia results go to the FRONT of the list (high trust).
    Deduplicates by URL.
    """
    existing_urls = {s.get("url", "") for s in existing_snippets}

    wiki_evidence = await get_wikipedia_evidence(claim_text)

    # Filter already-present URLs
    new_wiki = [w for w in wiki_evidence if w.get("url", "") not in existing_urls]

    # Wikipedia first, then web search results
    return new_wiki + existing_snippets
