"""
Query Generator — produces CLAIM-SPECIFIC search queries.

Strategy per claim type:
  1. exact     — verbatim key phrase from the claim
  2. targeted  — entity + fact type (location / date / number / person)
  3. factcheck — claim keywords + "fact check" or site:snopes.com etc.

This is the #1 accuracy improvement:
  BAD  → search("Eiffel Tower article")
  GOOD → search("Eiffel Tower location city")
         search("where is Eiffel Tower located")
         search("Eiffel Tower Paris fact check")
"""
import os
import re
from typing import Literal

ClaimType = Literal["numeric", "temporal", "location", "entity", "superlative", "general"]


# ── Claim type detection ──────────────────────────────────────────────────────

PATTERNS: dict[ClaimType, str] = {
    "numeric":     r"\b\d+[\.,]?\d*\s*(billion|million|trillion|thousand|%|percent|km|m|kg|mph|lb|ft|metres?|meters?|feet|inches?|dollars?|\$)\b",
    "temporal":    r"\b(in|since|as of|by|until|launched?|founded?|born|died|built|established)\s+\d{4}\b|\b(current|currently|now|today|latest|recent|first|last)\b",
    "location":    r"\b(located|location|based|headquartered|situated|found|lives?|resides?|capital|city|country|region|continent)\b",
    "superlative": r"\b(largest|smallest|tallest|shortest|first|last|only|best|worst|most|least|highest|lowest|oldest|newest|richest|poorest)\b",
    "entity":      r"\b(is|was|are|were|has|have|had)\s+(a|an|the)\b|\b(ceo|president|founder|director|author|inventor|designer|owner)\b",
}


def detect_claim_type(text: str) -> ClaimType:
    text_lower = text.lower()
    for ctype, pattern in PATTERNS.items():
        if re.search(pattern, text_lower):
            return ctype
    return "general"


# ── Keyword extraction ────────────────────────────────────────────────────────

STOPWORDS = {
    "the","a","an","is","are","was","were","be","been","has","have","had",
    "it","its","in","on","at","of","to","for","and","or","but","that","this",
    "with","by","from","as","not","no","so","if","than","then","into","also",
    "which","who","what","where","when","how","their","they","them","its",
    "been","will","would","could","should","may","might","can","does","did",
}


def _keywords(text: str, n: int = 8) -> list[str]:
    words = re.findall(r"[A-Za-z0-9']+", text)
    return [w for w in words if w.lower() not in STOPWORDS and len(w) > 2][:n]


def _extract_entities(text: str) -> list[str]:
    """Extract capitalised multi-word entities (names, places, orgs)."""
    entities = re.findall(r"[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*", text)
    return [e for e in entities if len(e) > 3]


def _extract_numbers(text: str) -> list[str]:
    return re.findall(r"\$?[\d,\.]+\s*(?:billion|million|trillion|%|km|m|kg|metres?)?", text)


# ── Query builders per claim type ─────────────────────────────────────────────

def _build_queries(claim_text: str, claim_type: ClaimType) -> list[str]:
    keywords  = _keywords(claim_text)
    entities  = _extract_entities(claim_text)
    numbers   = _extract_numbers(claim_text)
    kw_str    = " ".join(keywords[:6])
    entity_str= " ".join(entities[:3]) if entities else kw_str

    if claim_type == "numeric":
        # Focus on verifying the specific number
        num = numbers[0] if numbers else ""
        return [
            f"{entity_str} {num}".strip(),
            f"{kw_str} statistics data",
            f"{entity_str} fact check {num}",
        ]

    elif claim_type == "temporal":
        # Extract year and verify date
        years = re.findall(r"\b(19|20)\d{2}\b", claim_text)
        year  = years[0] if years else ""
        return [
            f"{entity_str} {year} date".strip(),
            f"when {kw_str}",
            f"{entity_str} history timeline {year}",
        ]

    elif claim_type == "location":
        # Verify where something is
        return [
            f"where is {entity_str} located",
            f"{entity_str} location country city",
            f"{entity_str} geography site:wikipedia.org",
        ]

    elif claim_type == "superlative":
        # Verify ranking or record
        return [
            f"{entity_str} record ranking {kw_str}",
            f"is {entity_str} really {kw_str}",
            f"{entity_str} comparison data fact check",
        ]

    elif claim_type == "entity":
        # Verify who/what something is
        return [
            f"{entity_str} biography facts",
            f"who is {entity_str}",
            f"{entity_str} fact check",
        ]

    else:  # general
        return [
            " ".join(keywords[:8]),
            f"{entity_str} facts evidence",
            f"{kw_str} fact check verify",
        ]


def _add_factcheck_query(claim_text: str, queries: list[str]) -> list[str]:
    """Always add one factcheck-site-specific query."""
    keywords = _keywords(claim_text, 5)
    kw_str   = " ".join(keywords)
    factcheck = f"{kw_str} site:snopes.com OR site:factcheck.org OR site:politifact.com"
    return queries + [factcheck]


# ── LLM paraphrase (optional, best quality) ───────────────────────────────────

async def _llm_paraphrase(claim_text: str) -> str | None:
    from app.services.llm_provider import get_provider, llm_chat_text
    if get_provider() == "none":
        return None
    try:
        return await llm_chat_text(
            prompt=claim_text,
            system="Rewrite as a 6-8 word web search query. Output ONLY the query.",
            max_tokens=40,
        )
    except Exception:
        return None


# ── Public API ────────────────────────────────────────────────────────────────

async def generate_queries(claim_text: str) -> list[str]:
    """
    Generate 4 targeted search queries for a claim.

    Returns:
      [type-specific query, factcheck query, paraphrase, entity query]
    """
    claim_type = detect_claim_type(claim_text)
    base       = _build_queries(claim_text, claim_type)
    with_fc    = _add_factcheck_query(claim_text, base)

    # Try LLM paraphrase as a bonus query
    paraphrase = await _llm_paraphrase(claim_text)
    if paraphrase and paraphrase not in with_fc:
        with_fc.append(paraphrase)

    # Deduplicate while preserving order
    seen: set[str] = set()
    final: list[str] = []
    for q in with_fc:
        key = q.lower().strip()
        if key not in seen and key:
            seen.add(key)
            final.append(q)

    return final[:4]
