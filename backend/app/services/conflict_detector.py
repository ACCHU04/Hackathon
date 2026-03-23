"""
Conflict Detector

Given a list of verified claims (with evidence), identifies:
  1. Claims where high-trust sources disagree on verdict
  2. Claims marked PARTIALLY_TRUE with evidence from both sides
  3. "What would change this verdict" suggestions per claim
"""
import os
import json
from typing import TypedDict


class ConflictInfo(TypedDict):
    claim_id:         str
    has_conflict:     bool
    conflict_reason:  str
    supporting_count: int
    refuting_count:   int
    what_would_change: list[str]


# ── What-would-change heuristics ─────────────────────────────────────────────

_CHANGE_TEMPLATES: dict[str, list[str]] = {
    "TRUE": [
        "A peer-reviewed study or official report contradicting this claim",
        "A government or authoritative body issuing a correction",
        "More recent data showing the statistic has changed",
    ],
    "FALSE": [
        "An official statement or primary source confirming the claim",
        "Peer-reviewed research supporting the claim",
        "A correction or retraction from the source that contradicted it",
    ],
    "PARTIALLY_TRUE": [
        "A definitive authoritative source clarifying the full context",
        "The exact figure or date confirmed by an official body",
        "Resolution of conflicting sources by an independent fact-checker",
    ],
    "UNVERIFIABLE": [
        "A primary source (official document, government data) confirming or denying the claim",
        "A major news outlet investigation covering this specific claim",
        "Expert testimony or academic research on this topic",
    ],
}


async def _llm_what_would_change(claim_text: str, verdict: str, reasoning: str) -> list[str]:
    """Ask LLM for context-specific what-would-change suggestions."""
    from app.services.llm_provider import get_provider, llm_chat_json
    if get_provider() == "none":
        return []
    try:
        prompt = (
            f'Claim: "{claim_text}"\n'
            f'Current verdict: {verdict}\n'
            f'Reasoning: {reasoning}\n\n'
            "List 2-3 specific types of evidence that would change this verdict. "
            "Be concrete and specific to this claim. "
            'Output ONLY JSON: {"suggestions": ["...", "...", "..."]}'
        )
        data = await llm_chat_json(prompt, max_tokens=200)
        return (data or {}).get("suggestions", [])[:3]
    except Exception:
        return []


# ── Conflict detection ────────────────────────────────────────────────────────

def _count_evidence_sides(evidence: list[dict]) -> tuple[int, int]:
    """Count how many evidence items support vs refute."""
    supporting = sum(1 for e in evidence if e.get("label") in ("cited", "supports"))
    refuting   = sum(1 for e in evidence if e.get("label") == "refutes")
    return supporting, refuting


def _has_conflict(verdict: str, evidence: list[dict], confidence: float) -> tuple[bool, str]:
    """Detect conflict signals."""
    supporting, refuting = _count_evidence_sides(evidence)

    if verdict == "PARTIALLY_TRUE":
        return True, "Multiple sources provide mixed or contradictory evidence."

    if refuting > 0 and supporting > 0 and confidence < 0.85:
        return True, f"{supporting} source(s) support and {refuting} refute this claim."

    if verdict in ("TRUE", "FALSE") and confidence < 0.65:
        return True, "Low confidence — evidence quality or consistency is weak."

    if verdict == "UNVERIFIABLE" and len(evidence) >= 3:
        return True, "Sources retrieved but evidence is insufficient or contradictory."

    return False, ""


# ── Public API ────────────────────────────────────────────────────────────────

async def analyze_conflicts(verdicts: list[dict]) -> list[ConflictInfo]:
    """
    For each verified claim, detect conflicts and generate
    what-would-change suggestions.
    """
    import asyncio
    results: list[ConflictInfo] = []

    async def _process(v: dict) -> ConflictInfo:
        claim_id  = v.get("claim_id", "")
        verdict   = v.get("verdict", "UNVERIFIABLE")
        reasoning = v.get("reasoning", "")
        evidence  = v.get("evidence", [])
        confidence = float(v.get("confidence", 0.5))

        has_conflict, conflict_reason = _has_conflict(verdict, evidence, confidence)
        supporting, refuting          = _count_evidence_sides(evidence)

        # Get what-would-change: try LLM first, fall back to templates
        llm_suggestions = await _llm_what_would_change(
            v.get("claim_text", ""), verdict, reasoning
        )
        what_would_change = llm_suggestions or _CHANGE_TEMPLATES.get(verdict, [])

        return ConflictInfo(
            claim_id=claim_id,
            has_conflict=has_conflict,
            conflict_reason=conflict_reason,
            supporting_count=supporting,
            refuting_count=refuting,
            what_would_change=what_would_change[:3],
        )

    results = await asyncio.gather(*[_process(v) for v in verdicts])
    return list(results)
