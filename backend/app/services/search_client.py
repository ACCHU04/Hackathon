"""
Search Client — LangChain-powered with automatic fallback chain.

Provider priority:
  1. SerpAPI       (best quality,  needs SERPAPI_KEY)
  2. Tavily        (great quality, needs TAVILY_API_KEY)
  3. DuckDuckGo    (free,          no key needed)

LangChain handles:
  - Automatic provider switching when a key is missing
  - Structured result objects
  - Rate limit handling
"""
import os
from typing import Optional

TRUSTED_DOMAINS = {
    ".gov", ".edu", "reuters.com", "apnews.com", "bbc.com", "bbc.co.uk",
    "nytimes.com", "theguardian.com", "washingtonpost.com", "bloomberg.com",
    "nature.com", "science.org", "who.int", "cdc.gov", "nasa.gov",
    "britannica.com", "wikipedia.org", "snopes.com", "factcheck.org",
    "politifact.com",
}


def _trust_score(url: str) -> float:
    url_lower = url.lower()
    for domain in TRUSTED_DOMAINS:
        if domain in url_lower:
            return 1.0
    return 0.5


def _deduplicate(results: list[dict]) -> list[dict]:
    seen: set[str] = set()
    out: list[dict] = []
    for r in results:
        url = r.get("url", "")
        if url and url not in seen:
            seen.add(url)
            out.append(r)
    return out


def _make_tool():
    """
    Build the best available LangChain search tool based on available API keys.
    Priority: SerpAPI → Tavily → DuckDuckGo
    """
    serpapi_key = os.getenv("SERPAPI_KEY", "").strip()
    tavily_key  = os.getenv("TAVILY_API_KEY", "").strip()

    if serpapi_key:
        try:
            from langchain_community.utilities import SerpAPIWrapper
            print("[search_client] Using SerpAPI")
            return "serpapi", SerpAPIWrapper(serpapi_api_key=serpapi_key)
        except Exception as e:
            print(f"[search_client] SerpAPI init failed: {e}")

    if tavily_key:
        try:
            from langchain_community.tools.tavily_search import TavilySearchResults
            print("[search_client] Using Tavily")
            return "tavily", TavilySearchResults(
                api_key=tavily_key, max_results=8
            )
        except Exception as e:
            print(f"[search_client] Tavily init failed: {e}")

    try:
        from langchain_community.tools import DuckDuckGoSearchResults
        print("[search_client] Using DuckDuckGo (free fallback)")
        return "duckduckgo", DuckDuckGoSearchResults(num_results=8)
    except Exception as e:
        print(f"[search_client] DuckDuckGo init failed: {e}")

    return "none", None


_TOOL_CACHE: tuple | None = None


def _get_tool():
    global _TOOL_CACHE
    if _TOOL_CACHE is None:
        _TOOL_CACHE = _make_tool()
    return _TOOL_CACHE


def _parse_results(raw, provider: str) -> list[dict]:
    """Normalise results from any provider into our standard format."""
    results = []

    if provider == "serpapi":
        # SerpAPIWrapper returns a string — parse it
        if isinstance(raw, str):
            import json
            try:
                items = json.loads(raw)
                if isinstance(items, list):
                    for item in items:
                        url = item.get("link", "")
                        results.append({
                            "title":   item.get("title", ""),
                            "url":     url,
                            "snippet": item.get("snippet", ""),
                            "date":    item.get("date", ""),
                            "trust":   _trust_score(url),
                        })
            except Exception:
                # Plain text fallback
                results.append({"title": "", "url": "", "snippet": str(raw), "date": "", "trust": 0.3})
        return results

    if provider == "tavily":
        # TavilySearchResults returns a list of dicts
        if isinstance(raw, list):
            for item in raw:
                if isinstance(item, dict):
                    url = item.get("url", "")
                    results.append({
                        "title":   item.get("title", ""),
                        "url":     url,
                        "snippet": item.get("content", item.get("snippet", "")),
                        "date":    "",
                        "trust":   _trust_score(url),
                    })
        return results

    if provider == "duckduckgo":
        # DuckDuckGoSearchResults returns a string of JSON
        import json, re
        raw_str = raw if isinstance(raw, str) else str(raw)
        try:
            items = json.loads(raw_str)
            if isinstance(items, list):
                for item in items:
                    url = item.get("link", "")
                    results.append({
                        "title":   item.get("title", ""),
                        "url":     url,
                        "snippet": item.get("snippet", ""),
                        "date":    "",
                        "trust":   _trust_score(url),
                    })
        except Exception:
            # Regex fallback
            links = re.findall(r'"link":\s*"([^"]+)"', raw_str)
            snippets = re.findall(r'"snippet":\s*"([^"]+)"', raw_str)
            for i, link in enumerate(links):
                results.append({
                    "title": "", "url": link,
                    "snippet": snippets[i] if i < len(snippets) else "",
                    "date": "", "trust": _trust_score(link),
                })
        return results

    return results


async def search(query: str, num_results: int = 8) -> list[dict]:
    """
    Search using best available LangChain tool.
    Returns sorted list (trust score desc).
    """
    provider, tool = _get_tool()

    if tool is None:
        print("[search_client] No search tool available.")
        return []

    try:
        import asyncio
        # LangChain tools are sync — run in thread pool
        raw = await asyncio.to_thread(tool.run, query)
        results = _parse_results(raw, provider)
        results = _deduplicate(results)
        results.sort(key=lambda r: r.get("trust", 0), reverse=True)
        return results[:num_results]
    except Exception as exc:
        print(f"[search_client] Search failed ({exc})")
        return []


async def search_multi(queries: list[str], num_per_query: int = 5) -> list[dict]:
    """Run multiple queries concurrently and merge results."""
    import asyncio
    all_results = await asyncio.gather(*[search(q, num_per_query) for q in queries])
    merged: list[dict] = []
    for results in all_results:
        merged.extend(results)
    merged = _deduplicate(merged)
    merged.sort(key=lambda r: r.get("trust", 0), reverse=True)
    return merged
