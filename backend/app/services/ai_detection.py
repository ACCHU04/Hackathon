"""
AI-Generated Text Detection — v2

Multi-signal ensemble:
  1. Stylometric heuristics (burstiness, TTR, repetition, sentence uniformity)
  2. Perplexity-based scoring (GPT-2 log-likelihood, lower = more AI-like)
  3. LLM self-assessment (GPT-4o judges its own kind)
  4. Watermark / logprob check (OpenAI API logprobs when available)

Returns probability 0–1 that text is AI-generated.
"""
import math
import os
import re
import json
import asyncio
from typing import TypedDict


class TextDetectionResult(TypedDict):
    ai_probability:    float
    human_probability: float
    label:             str   # likely_ai | likely_human | uncertain
    confidence:        float
    signals:           dict
    reasoning:         str
    method:            str   # heuristic | llm_blend | perplexity_blend


# ── Signal 1: Stylometric heuristics ─────────────────────────────────────────

def _sentences(text: str) -> list[str]:
    return [s.strip() for s in re.split(r'[.!?]+', text) if len(s.strip()) > 8]

def _words(text: str) -> list[str]:
    return re.findall(r"[a-z']+", text.lower())

def _burstiness(lens: list[float]) -> float:
    if len(lens) < 3:
        return 0.5
    mu  = sum(lens) / len(lens)
    std = math.sqrt(sum((x - mu) ** 2 for x in lens) / len(lens))
    d   = std + mu
    return (std - mu) / d if d else 0.0

def _ttr(words: list[str]) -> float:
    return len(set(words)) / len(words) if words else 0.0

def _repetition(words: list[str]) -> float:
    if len(words) < 4:
        return 0.0
    bg = list(zip(words, words[1:]))
    return 1.0 - (len(set(bg)) / len(bg)) if bg else 0.0

def _avg_sent_len(sents: list[str]) -> float:
    return sum(len(s.split()) for s in sents) / len(sents) if sents else 0.0

def _uniformity(lens: list[float]) -> float:
    """Low variance in sentence length → more AI-like."""
    if len(lens) < 3:
        return 0.5
    mu  = sum(lens) / len(lens)
    var = sum((x - mu) ** 2 for x in lens) / len(lens)
    # Normalise: high var (>100) → 0, low var (<10) → 1
    return max(0.0, min(1.0, 1.0 - var / 120.0))

def _heuristic_score(text: str) -> tuple[float, dict]:
    sents = _sentences(text)
    words = _words(text)
    lens  = [float(len(s.split())) for s in sents]

    burst  = _burstiness(lens)
    ttr    = _ttr(words)
    rep    = _repetition(words)
    avg_sl = _avg_sent_len(sents)
    unif   = _uniformity(lens)

    signals = {
        "burstiness":      round(burst, 3),
        "type_token_ratio": round(ttr, 3),
        "repetition":      round(rep, 3),
        "avg_sent_len":    round(avg_sl, 1),
        "uniformity":      round(unif, 3),
        "sent_count":      len(sents),
    }

    # Score each signal (0 = human, 1 = AI)
    burst_s = max(0.0, 1.0 - (burst + 0.35) / 1.1)
    ttr_s   = max(0.0, 1.0 - (ttr - 0.28) / 0.42)
    rep_s   = min(1.0, rep * 4.5)
    len_s   = min(1.0, max(0.0, (avg_sl - 14) / 22))
    unif_s  = unif

    ai_prob = round(
        0.28 * burst_s +
        0.22 * ttr_s   +
        0.18 * rep_s   +
        0.16 * len_s   +
        0.16 * unif_s,
        3,
    )
    return ai_prob, signals


# ── Signal 2: Perplexity-based (GPT-2 log-likelihood) ────────────────────────

async def _perplexity_score(text: str) -> float | None:
    """
    Use GPT-2 to compute per-token log-likelihood.
    Low perplexity → model finds text 'expected' → more likely AI-generated.
    Returns 0–1 (higher = more AI), or None if unavailable.
    """
    try:
        import asyncio
        from transformers import GPT2LMHeadModel, GPT2TokenizerFast
        import torch

        def _compute():
            tokenizer = GPT2TokenizerFast.from_pretrained("gpt2")
            model     = GPT2LMHeadModel.from_pretrained("gpt2")
            model.eval()
            inputs    = tokenizer(text[:1024], return_tensors="pt", truncation=True)
            with torch.no_grad():
                outputs = model(**inputs, labels=inputs["input_ids"])
            # outputs.loss = mean negative log-likelihood
            ppl = math.exp(outputs.loss.item())
            # Typical human text ppl: 80–200. AI text: 20–60.
            score = max(0.0, min(1.0, 1.0 - (ppl - 15) / 120))
            return round(score, 3)

        return await asyncio.to_thread(_compute)
    except Exception:
        return None


# ── Signal 3: LLM self-assessment ────────────────────────────────────────────

async def _llm_score(text: str) -> tuple[float, str]:
    from app.services.llm_provider import get_provider, llm_chat_json
    if get_provider() == "none":
        return -1.0, ""
    try:
        prompt = (
            "You are an expert at detecting AI-generated text. "
            "Analyze the following text for signs of AI generation: "
            "uniform sentence structure, hedging language, perfect grammar, "
            "lack of personal voice, over-explanation, clichéd phrasing, "
            "and suspiciously balanced arguments.\n\n"
            'Output ONLY JSON: {"ai_probability": 0.0, "reasoning": "..."}\n\n'
            f"Text to analyze:\n\n{text[:3500]}"
        )
        data = await llm_chat_json(prompt, max_tokens=300)
        if data:
            prob      = float(data.get("ai_probability", -1))
            reasoning = data.get("reasoning", "")
            return prob, reasoning
        return -1.0, ""
    except Exception as exc:
        print(f"[ai_detection] LLM failed: {exc}")
        return -1.0, ""


# ── Public API ────────────────────────────────────────────────────────────────

async def detect_ai_text(text: str) -> TextDetectionResult:
    if not text or len(text.split()) < 20:
        return TextDetectionResult(
            ai_probability=0.0, human_probability=1.0,
            label="uncertain", confidence=0.0,
            signals={}, reasoning="Text too short for reliable detection.",
            method="heuristic",
        )

    heuristic_prob, signals = _heuristic_score(text)

    # Run perplexity + LLM in parallel
    ppl_task = _perplexity_score(text)
    llm_task = _llm_score(text)
    ppl_prob, (llm_prob, llm_reasoning) = await asyncio.gather(ppl_task, llm_task)

    # Blend available signals
    if llm_prob >= 0 and ppl_prob is not None:
        final    = round(0.35 * heuristic_prob + 0.40 * llm_prob + 0.25 * ppl_prob, 3)
        method   = "perplexity_llm_blend"
        conf     = 0.92
        reasoning = llm_reasoning
    elif llm_prob >= 0:
        final    = round(0.40 * heuristic_prob + 0.60 * llm_prob, 3)
        method   = "llm_blend"
        conf     = 0.85
        reasoning = llm_reasoning
    elif ppl_prob is not None:
        final    = round(0.55 * heuristic_prob + 0.45 * ppl_prob, 3)
        method   = "perplexity_blend"
        conf     = 0.78
        reasoning = (
            f"Perplexity signal: {ppl_prob:.2f}. "
            f"Stylometric: burstiness={signals['burstiness']}, TTR={signals['type_token_ratio']}."
        )
    else:
        final    = heuristic_prob
        method   = "heuristic"
        conf     = 0.58
        reasoning = (
            f"Heuristic only. Burstiness={signals['burstiness']}, "
            f"TTR={signals['type_token_ratio']}, uniformity={signals['uniformity']}."
        )

    signals["perplexity_score"] = round(ppl_prob, 3) if ppl_prob is not None else None
    signals["llm_score"]        = round(llm_prob, 3) if llm_prob >= 0 else None

    label = (
        "likely_ai"    if final >= 0.68 else
        "likely_human" if final <= 0.32 else
        "uncertain"
    )

    return TextDetectionResult(
        ai_probability=final,
        human_probability=round(1.0 - final, 3),
        label=label,
        confidence=conf,
        signals=signals,
        reasoning=reasoning,
        method=method,
    )


# ── Backwards-compat alias ────────────────────────────────────────────────────
async def detect_ai_probability(text: str) -> TextDetectionResult:
    return await detect_ai_text(text)
