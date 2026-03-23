"""
Verifier — LangChain 4-step chain with:
  - Claim-type-aware targeted search queries
  - Wikipedia as a guaranteed high-trust source
  - Embedding re-ranking (top 5 most relevant snippets)
  - 4-step CoT chain: summarise → compare → verdict → self-check
"""
import asyncio
import json
import os
import time
from typing import Literal

from app.services.query_generator  import generate_queries, detect_claim_type
from app.services.search_client    import search_multi
from app.services.wikipedia_source import enrich_with_wikipedia

Verdict = Literal["TRUE", "FALSE", "PARTIALLY_TRUE", "UNVERIFIABLE"]

MOCK_VERDICTS = [
    {"verdict": "FALSE",           "confidence": 0.97},
    {"verdict": "FALSE",           "confidence": 0.95},
    {"verdict": "TRUE",            "confidence": 0.94},
    {"verdict": "PARTIALLY_TRUE",  "confidence": 0.74},
    {"verdict": "UNVERIFIABLE",    "confidence": 0.50},
]


# ── Embedding re-ranker ───────────────────────────────────────────────────────

def _rerank_by_similarity(
    claim_text: str,
    snippets: list[dict],
    top_k: int = 5,
) -> list[dict]:
    """
    Re-rank evidence snippets by cosine similarity to the claim.
    Falls back to trust-score ordering if sentence-transformers unavailable.
    """
    if not snippets:
        return snippets
    try:
        from sentence_transformers import SentenceTransformer, util
        model  = SentenceTransformer("all-MiniLM-L6-v2")
        texts  = [s.get("snippet", s.get("title", "")) for s in snippets]
        c_emb  = model.encode(claim_text,  convert_to_tensor=True)
        s_embs = model.encode(texts,       convert_to_tensor=True)
        scores = util.cos_sim(c_emb, s_embs)[0].tolist()
        ranked = sorted(
            zip(snippets, scores),
            key=lambda x: (x[1] * 0.7 + x[0].get("trust", 0.5) * 0.3),
            reverse=True,
        )
        return [s for s, _ in ranked[:top_k]]
    except Exception:
        # Fallback: trust score only
        return sorted(snippets, key=lambda s: s.get("trust", 0.5), reverse=True)[:top_k]


# ── Evidence block builder ────────────────────────────────────────────────────

def _build_evidence_block(snippets: list[dict]) -> str:
    lines = []
    for i, s in enumerate(snippets[:6], 1):
        trust_label = "HIGH" if s.get("trust", 0) >= 0.85 else "MED"
        source_tag  = " [WIKIPEDIA]" if s.get("source") == "wikipedia" else ""
        lines.append(
            f"[{i}] {s.get('title', '')} — Trust:{trust_label}{source_tag}\n"
            f"    URL: {s.get('url', '')}\n"
            f"    {s.get('snippet', '')}"
        )
    return "\n\n".join(lines) if lines else "No evidence found."


# ── Confidence calibration ────────────────────────────────────────────────────

def _calibrate(
    raw: float,
    evidence_count: int,
    has_wiki: bool,
    has_trusted: bool,
    verdict: str,
) -> float:
    score = raw
    if evidence_count < 3:   score -= 0.10
    if has_wiki:             score += 0.05
    if has_trusted:          score += 0.05
    if verdict == "UNVERIFIABLE": score = min(score, 0.55)
    return round(max(0.10, min(0.99, score)), 3)


# ── LangChain 4-step chain ────────────────────────────────────────────────────

async def _langchain_verify(
    claim_text: str,
    evidence_snippets: list[dict],
    claim_type: str,
) -> dict:
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_core.output_parsers import JsonOutputParser, StrOutputParser
    from app.services.llm_provider import get_chat_llm, get_provider

    if get_provider() == "none":
        return {}

    llm = get_chat_llm(temperature=0, max_retries=3)
    ev    = _build_evidence_block(evidence_snippets)

    # ── Step 1: Summarise evidence ────────────────────────────────────────────
    summary = await (
        ChatPromptTemplate.from_messages([
            ("system", "You are a research analyst. Summarise what these sources say in 3-4 factual sentences. Cite source numbers [1], [2] etc. Prioritise HIGH-trust and WIKIPEDIA sources."),
            ("human",  "Claim type: {claim_type}\n\nSources:\n{evidence}\n\nSummarise key facts relevant to verifying this claim."),
        ])
        | llm | StrOutputParser()
    ).ainvoke({"evidence": ev, "claim_type": claim_type})

    # ── Step 2: Compare claim vs summary ─────────────────────────────────────
    comparison = await (
        ChatPromptTemplate.from_messages([
            ("system", "You are a fact-checker. Compare the claim to the evidence summary. List specific agreements and contradictions with direct quotes where possible."),
            ("human",  "Claim: {claim}\n\nEvidence summary: {summary}\n\nList specific agreements and contradictions."),
        ])
        | llm | StrOutputParser()
    ).ainvoke({"claim": claim_text, "summary": summary})

    # ── Step 3: Verdict ───────────────────────────────────────────────────────
    verdict = await (
        ChatPromptTemplate.from_messages([
            ("system", """You are a fact-checking judge. Based on the comparison, produce a verdict.
Claim type hint: {claim_type}
Verdicts: TRUE | FALSE | PARTIALLY_TRUE | UNVERIFIABLE
Output ONLY valid JSON:
{{"verdict":"...","confidence":0.0,"reasoning":"1-2 sentences citing sources","citations":["url1","url2"]}}"""),
            ("human", "Claim: {claim}\n\nComparison: {comparison}\n\nAll evidence:\n{evidence}\n\nOutput JSON verdict."),
        ])
        | llm | JsonOutputParser()
    ).ainvoke({"claim": claim_text, "comparison": comparison, "evidence": ev, "claim_type": claim_type})

    # ── Step 4: Self-check ────────────────────────────────────────────────────
    final = await (
        ChatPromptTemplate.from_messages([
            ("system", """You are a quality reviewer. Check if this verdict is overconfident or ignores contradicting evidence.
If issues found, reduce confidence by 0.05–0.15 and update reasoning.
Output ONLY valid JSON — same schema as input."""),
            ("human", "Verdict to review:\n{verdict_json}\n\nClaim: {claim}\n\nEvidence summary: {summary}\n\nOutput final reviewed JSON."),
        ])
        | llm | JsonOutputParser()
    ).ainvoke({"verdict_json": json.dumps(verdict), "claim": claim_text, "summary": summary})

    final["verdict"] = final.get("verdict", "UNVERIFIABLE").upper().replace(" ", "_")
    final["confidence"] = float(final.get("confidence", 0.5))
    return final


# ── Public API ────────────────────────────────────────────────────────────────

async def verify_claim(
    claim_id:   str,
    claim_text: str,
    index:      int = 0,
) -> dict:
    """
    Full pipeline for one claim:
      1. Detect claim type
      2. Generate type-specific queries (4 queries)
      3. Web search (parallel across all queries)
      4. Wikipedia direct fetch (parallel with web search)
      5. Embedding re-rank → top 5 most relevant snippets
      6. LangChain 4-step CoT chain
      7. Calibrate confidence
    """
    t0 = time.time()

    # 1. Claim type
    claim_type = detect_claim_type(claim_text)

    # 2. Queries
    queries = await generate_queries(claim_text)

    # 3+4. Web search AND Wikipedia in parallel
    web_task  = search_multi(queries, num_per_query=5)
    wiki_task = enrich_with_wikipedia(claim_text, [])
    web_results, wiki_results = await asyncio.gather(web_task, wiki_task)

    # Merge: Wikipedia first (higher trust), then web, deduplicate
    seen_urls: set[str] = set()
    merged: list[dict] = []
    for s in wiki_results + web_results:
        url = s.get("url", "")
        if url not in seen_urls:
            seen_urls.add(url)
            merged.append(s)

    # 5. Re-rank by similarity to claim
    top_snippets = _rerank_by_similarity(claim_text, merged, top_k=6)

    # 6. LangChain verify
    result = await _langchain_verify(claim_text, top_snippets, claim_type)
    if not result:
        result = MOCK_VERDICTS[index % len(MOCK_VERDICTS)] | {
            "reasoning": "Mock mode — no API key. Deterministic demo verdict.",
            "citations": [],
        }

    # 7. Calibrate confidence
    has_wiki    = any(s.get("source") == "wikipedia" for s in top_snippets)
    has_trusted = any(s.get("trust", 0) >= 0.85 for s in top_snippets)
    confidence  = _calibrate(
        float(result.get("confidence", 0.5)),
        len(top_snippets),
        has_wiki,
        has_trusted,
        result.get("verdict", "UNVERIFIABLE"),
    )

    # Build evidence output
    cited_urls = set(result.get("citations", []))
    evidence_out = [
        {
            "title":   s.get("title",   ""),
            "url":     s.get("url",     ""),
            "snippet": s.get("snippet", ""),
            "date":    s.get("date",    ""),
            "trust":   round(s.get("trust", 0.5), 2),
            "label":   (
                "wikipedia" if s.get("source") == "wikipedia"
                else "cited"     if s.get("url", "") in cited_urls
                else "retrieved"
            ),
        }
        for s in top_snippets
    ]

    return {
        "claim_id":   claim_id,
        "claim_type": claim_type,
        "verdict":    result.get("verdict",   "UNVERIFIABLE"),
        "confidence": confidence,
        "reasoning":  result.get("reasoning", ""),
        "citations":  result.get("citations", []),
        "evidence":   evidence_out,
        "runtime_ms": int((time.time() - t0) * 1000),
        "has_wikipedia": has_wiki,
    }


async def verify_claims(claims: list[dict]) -> list[dict]:
    """Verify all claims concurrently (max 4 at a time)."""
    sem = asyncio.Semaphore(4)

    async def _bounded(i: int, c: dict) -> dict:
        async with sem:
            return await verify_claim(c["id"], c["text"], index=i)

    return await asyncio.gather(*[_bounded(i, c) for i, c in enumerate(claims)])
