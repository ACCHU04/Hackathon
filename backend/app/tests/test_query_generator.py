"""Tests for the claim-type-aware query generator."""
import asyncio
import pytest
from app.services.query_generator import detect_claim_type, generate_queries


def test_detect_location():
    assert detect_claim_type("The Eiffel Tower is located in London.") == "location"

def test_detect_numeric():
    assert detect_claim_type("The US GDP was $25 trillion in 2022.") == "numeric"

def test_detect_temporal():
    assert detect_claim_type("NASA launched JWST on December 25, 2021.") in ("temporal", "general")

def test_detect_superlative():
    assert detect_claim_type("The Eiffel Tower is the tallest structure in Paris.") == "superlative"

def test_detect_general():
    assert detect_claim_type("Gustave Eiffel designed the tower.") == "general"

@pytest.mark.asyncio
async def test_generate_queries_returns_list():
    queries = await generate_queries("The Eiffel Tower is located in London.")
    assert isinstance(queries, list)

@pytest.mark.asyncio
async def test_generate_queries_at_least_two():
    queries = await generate_queries("The Eiffel Tower is located in London.")
    assert len(queries) >= 2

@pytest.mark.asyncio
async def test_generate_queries_no_duplicates():
    queries = await generate_queries("The US GDP was $25 trillion.")
    assert len(queries) == len(set(q.lower().strip() for q in queries))

@pytest.mark.asyncio
async def test_location_query_contains_location_keywords():
    queries = await generate_queries("The Eiffel Tower is located in London.")
    combined = " ".join(queries).lower()
    assert any(kw in combined for kw in ["location", "located", "where", "wikipedia"])

@pytest.mark.asyncio
async def test_factcheck_query_present():
    queries = await generate_queries("The Moon is made of cheese.")
    combined = " ".join(queries).lower()
    assert any(kw in combined for kw in ["fact check", "snopes", "factcheck", "verify"])
