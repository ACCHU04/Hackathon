"""Tests for ai_detection.py — runs offline (no API key needed)."""
import asyncio
import os
import pytest

os.environ.pop("OPENAI_API_KEY", None)

from app.services.ai_detection import detect_ai_text, _heuristic_score

HUMAN_TEXT = """
Yesterday I walked through the old neighbourhood where I grew up. The smell of
fresh bread from the corner bakery hit me immediately — it always does. Mrs Chen
still runs the place, though her hair is white now. She waved when she saw me.
I sat on the bench near the old oak tree and just watched people walk by for a while.
There's something about familiar streets that makes time feel strange.
"""

AI_TEXT = """
Artificial intelligence has emerged as one of the most transformative technologies
of the twenty-first century. It is important to note that AI systems leverage
sophisticated algorithms to process vast quantities of data. Furthermore, these
systems demonstrate remarkable capabilities across diverse domains including natural
language processing, computer vision, and predictive analytics. It is worth
emphasizing that responsible deployment of AI requires careful consideration of
ethical implications and societal impacts.
"""

@pytest.mark.asyncio
async def test_returns_result():
    result = await detect_ai_text(HUMAN_TEXT)
    assert isinstance(result, dict)

@pytest.mark.asyncio
async def test_has_required_keys():
    result = await detect_ai_text(HUMAN_TEXT)
    for key in ("ai_probability","human_probability","label","confidence","signals","reasoning","method"):
        assert key in result, f"Missing key: {key}"

@pytest.mark.asyncio
async def test_probabilities_sum_to_one():
    result = await detect_ai_text(HUMAN_TEXT)
    total = result["ai_probability"] + result["human_probability"]
    assert abs(total - 1.0) < 0.01

@pytest.mark.asyncio
async def test_short_text_returns_uncertain():
    result = await detect_ai_text("Too short.")
    assert result["label"] == "uncertain"
    assert result["ai_probability"] == 0.0

@pytest.mark.asyncio
async def test_human_text_lower_score():
    h = await detect_ai_text(HUMAN_TEXT)
    a = await detect_ai_text(AI_TEXT)
    # AI text should score higher than clearly personal human text
    assert a["ai_probability"] > h["ai_probability"]

def test_heuristic_signals_present():
    _, signals = _heuristic_score(HUMAN_TEXT)
    assert "burstiness" in signals
    assert "type_token_ratio" in signals
    assert "repetition" in signals

@pytest.mark.asyncio
async def test_label_is_valid():
    result = await detect_ai_text(AI_TEXT)
    assert result["label"] in ("likely_ai", "likely_human", "uncertain")
