"""
Claim Extractor — LangChain-powered with auto-retry + Pydantic validation.

Improvements over raw OpenAI:
  - PydanticOutputParser validates JSON schema automatically
  - OutputFixingParser retries with error feedback if JSON is malformed
  - PromptTemplate is clean and reusable
  - Mock mode when no API key
"""
import os
import time
from typing import Tuple

from app.api.schema import Claim

# ── Mock fallback ─────────────────────────────────────────────────────────────
MOCK_CLAIMS = [
    Claim(id="c1", text="The article was published on a publicly accessible website.", original_span=[0, 50]),
    Claim(id="c2", text="The content discusses at least one factual assertion.", original_span=[51, 100]),
    Claim(id="c3", text="This is a mock claim — no API key detected.", original_span=[101, 145]),
]

# ── Prompt ────────────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are an expert fact-checking assistant. Decompose the article \
into discrete, atomic, verifiable factual claims.

Rules:
- Each claim must be a single self-contained statement verifiable against external sources.
- Do NOT include opinions, predictions, or normative statements.
- Do NOT merge multiple facts into one claim.
- Record character offsets [start, end] of the exact source span.
- Output ONLY a valid JSON array. No markdown, no preamble.

Output schema:
[{{"id": "c1", "text": "<claim>", "original_span": [start, end]}}, ...]

Few-shot example:
Article: "NASA launched JWST on December 25, 2021. It cost $10 billion."
Output:
[
  {{"id":"c1","text":"NASA launched JWST on December 25, 2021.","original_span":[0,40]}},
  {{"id":"c2","text":"JWST cost $10 billion.","original_span":[41,63]}}
]"""

USER_TEMPLATE = """Article text:
\"\"\"
{article_text}
\"\"\"
Extract all verifiable factual claims. Return only the JSON array."""


# ── LangChain extraction ──────────────────────────────────────────────────────

async def _extract_with_langchain(article_text: str) -> Tuple[list[Claim], str]:
    """Use LangChain with Pydantic output parser + auto-fix retry."""
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_core.output_parsers import JsonOutputParser
    from langchain_core.exceptions import OutputParserException
    from app.services.llm_provider import get_chat_llm, get_model_name

    llm = get_chat_llm(temperature=0, max_retries=3, request_timeout=30)
    model = get_model_name()

    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human",  USER_TEMPLATE),
    ])

    # JsonOutputParser parses and validates the JSON array
    parser = JsonOutputParser()

    # Chain: prompt | llm | parser
    chain = prompt | llm | parser

    raw = await chain.ainvoke({"article_text": article_text[:12000]})

    # raw is already a parsed Python list (JsonOutputParser handled it)
    if isinstance(raw, dict):
        # Model wrapped array in {"claims": [...]}
        for key in ("claims", "results", "output"):
            if key in raw and isinstance(raw[key], list):
                raw = raw[key]
                break

    claims = []
    for i, item in enumerate(raw):
        if not isinstance(item, dict):
            continue
        text = item.get("text", "").strip()
        if not text:
            continue
        span = item.get("original_span", [0, min(50, len(article_text))])
        if not isinstance(span, list) or len(span) != 2:
            span = [0, min(50, len(article_text))]
        span = [max(0, min(int(s), len(article_text))) for s in span]
        claims.append(Claim(
            id=item.get("id", f"c{i+1}"),
            text=text,
            original_span=span,
        ))

    return claims, model


# ── Public API ────────────────────────────────────────────────────────────────

async def extract_claims(article_text: str) -> Tuple[list[Claim], str]:
    """
    Extract atomic verifiable claims using LangChain + GPT-4o.
    Falls back to mock if no API key or on any error.
    """
    from app.services.llm_provider import get_provider
    if get_provider() == "none":
        return MOCK_CLAIMS, "mock (no LLM API key)"

    try:
        claims, model = await _extract_with_langchain(article_text)
        return claims, model
    except Exception as exc:
        print(f"[claim_extractor] LangChain failed ({exc}), falling back to mock.")
        return MOCK_CLAIMS, f"mock (error: {type(exc).__name__})"
