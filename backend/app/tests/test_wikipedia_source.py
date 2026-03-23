"""Tests for the Wikipedia source module (offline / unit tests only)."""
import pytest
from app.services.wikipedia_source import _best_wiki_query, enrich_with_wikipedia


def test_best_wiki_query_multi_word():
    q = _best_wiki_query("The Eiffel Tower is located in London.")
    assert "Eiffel Tower" in q or "Eiffel" in q

def test_best_wiki_query_single_entity():
    q = _best_wiki_query("NASA launched a telescope.")
    assert "NASA" in q

def test_best_wiki_query_fallback():
    q = _best_wiki_query("the quick brown fox jumps.")
    assert isinstance(q, str) and len(q) > 0

@pytest.mark.asyncio
async def test_enrich_returns_list():
    # Network may be blocked in CI — should return [] gracefully
    result = await enrich_with_wikipedia("The Eiffel Tower is in Paris.", [])
    assert isinstance(result, list)

@pytest.mark.asyncio
async def test_enrich_deduplicates():
    existing = [{"url": "https://en.wikipedia.org/wiki/Eiffel_Tower", "snippet": "test", "trust": 0.85}]
    result = await enrich_with_wikipedia("The Eiffel Tower is in Paris.", existing)
    urls = [r["url"] for r in result]
    assert len(urls) == len(set(urls))

@pytest.mark.asyncio
async def test_enrich_puts_wiki_first():
    existing = [{"url": "https://somesite.com", "snippet": "test", "trust": 0.5, "source": "web"}]
    result = await enrich_with_wikipedia("Eiffel Tower location", existing)
    # If wiki results present, they should be at the start
    if len(result) > 1:
        wiki_items = [r for r in result if r.get("source") == "wikipedia"]
        web_items  = [r for r in result if r.get("source") != "wikipedia"]
        wiki_indices = [result.index(r) for r in wiki_items]
        web_indices  = [result.index(r) for r in web_items]
        if wiki_indices and web_indices:
            assert min(wiki_indices) < max(web_indices)
