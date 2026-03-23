"""
Unit tests for claim_extractor.py — always runs in mock mode (no API key needed).
"""
import asyncio
import os

import pytest

# Ensure mock mode is active for tests
os.environ.pop("OPENAI_API_KEY", None)

from app.services.claim_extractor import extract_claims  # noqa: E402


SAMPLE_ARTICLE = """
NASA's James Webb Space Telescope, launched on December 25, 2021, has captured images
of galaxies formed just 300 million years after the Big Bang. The telescope cost
approximately $10 billion to develop and operates at –233 °C. Scientists believe it
will reshape our understanding of the early universe.
"""


@pytest.mark.asyncio
async def test_extract_claims_returns_list():
    claims, model_used = await extract_claims(SAMPLE_ARTICLE)
    assert isinstance(claims, list), "extract_claims should return a list"


@pytest.mark.asyncio
async def test_extract_claims_at_least_one():
    claims, model_used = await extract_claims(SAMPLE_ARTICLE)
    assert len(claims) >= 1, "At least one claim should be extracted"


@pytest.mark.asyncio
async def test_claim_has_required_keys():
    claims, model_used = await extract_claims(SAMPLE_ARTICLE)
    for claim in claims:
        assert hasattr(claim, "id"), "Claim must have 'id'"
        assert hasattr(claim, "text"), "Claim must have 'text'"
        assert hasattr(claim, "original_span"), "Claim must have 'original_span'"


@pytest.mark.asyncio
async def test_claim_id_is_string():
    claims, _ = await extract_claims(SAMPLE_ARTICLE)
    for claim in claims:
        assert isinstance(claim.id, str), "Claim id must be a string"


@pytest.mark.asyncio
async def test_claim_text_is_non_empty():
    claims, _ = await extract_claims(SAMPLE_ARTICLE)
    for claim in claims:
        assert claim.text.strip(), "Claim text must not be empty"


@pytest.mark.asyncio
async def test_claim_span_is_list_of_two_ints():
    claims, _ = await extract_claims(SAMPLE_ARTICLE)
    for claim in claims:
        span = claim.original_span
        assert isinstance(span, list) and len(span) == 2, (
            "original_span must be a list of two integers"
        )
        assert all(isinstance(v, int) for v in span), (
            "original_span values must be integers"
        )


@pytest.mark.asyncio
async def test_mock_mode_label_in_model_used():
    _, model_used = await extract_claims(SAMPLE_ARTICLE)
    assert "mock" in model_used.lower(), (
        f"Expected mock mode, got: {model_used}"
    )


@pytest.mark.asyncio
async def test_empty_text_still_returns_mock():
    claims, model_used = await extract_claims("")
    assert isinstance(claims, list)
    assert "mock" in model_used.lower()
