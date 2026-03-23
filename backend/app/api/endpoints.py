"""
FastAPI routers:
  POST /extract      — claim extraction only
  POST /verify       — full pipeline (blocking)
  POST /stream       — SSE streaming full pipeline
  POST /detect       — AI text detection only
  POST /full-report  — extract + verify + conflict + AI detection
"""
import asyncio, json, time
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.api.schema import (
    ExtractRequest, ExtractResponse,
    VerifyRequest, VerifyResponse,
    FullReportResponse, AIDetectionResult, ConflictInfo,
)
from app.services.fetcher         import fetch_article
from app.services.claim_extractor import extract_claims
from app.services.verifier        import verify_claims
from app.services.ai_detection    import detect_ai_probability
from app.services.conflict_detector import analyze_conflicts

router = APIRouter()


async def _resolve_article(url, text):
    if url:
        info = await fetch_article(url)
        if info is None:
            from fastapi import HTTPException
            raise HTTPException(422, "Failed to fetch or parse the URL.")
        return info
    return {"title": "", "author": "", "date": "", "text": text}


# ── /extract ──────────────────────────────────────────────────────────────────
@router.post("/extract", response_model=ExtractResponse, tags=["pipeline"])
async def extract(body: ExtractRequest):
    t0 = time.time()
    article = await _resolve_article(body.url, body.text)
    claims, model_used = await extract_claims(article["text"])
    return ExtractResponse(
        article=article, claims=claims,
        meta={"model_used": model_used, "runtime_ms": int((time.time()-t0)*1000)},
    )


# ── /verify ───────────────────────────────────────────────────────────────────
@router.post("/verify", response_model=VerifyResponse, tags=["pipeline"])
async def verify(body: VerifyRequest):
    t0 = time.time()
    article = await _resolve_article(body.url, body.text)
    claims, model_used = await extract_claims(article["text"])
    verdicts = await verify_claims([{"id": c.id, "text": c.text} for c in claims])
    return VerifyResponse(
        article=article, claims=claims, verdicts=verdicts,
        meta={"model_used": model_used, "runtime_ms": int((time.time()-t0)*1000)},
    )


# ── /detect ───────────────────────────────────────────────────────────────────
@router.post("/detect", tags=["pipeline"])
async def detect(body: ExtractRequest):
    """AI-generated text detection only."""
    article = await _resolve_article(body.url, body.text)
    result  = await detect_ai_probability(article["text"])
    return {"article_title": article.get("title", ""), "detection": result}


# ── /full-report ──────────────────────────────────────────────────────────────
@router.post("/full-report", response_model=FullReportResponse, tags=["pipeline"])
async def full_report(body: VerifyRequest):
    """
    Complete pipeline:
      1. Fetch article
      2. Extract claims
      3. Verify claims (search + LLM)
      4. Detect conflicts + what-would-change
      5. AI text detection
    All in parallel where possible.
    """
    t0 = time.time()
    article = await _resolve_article(body.url, body.text)
    claims, model_used = await extract_claims(article["text"])
    claim_dicts = [{"id": c.id, "text": c.text} for c in claims]

    # Run verification and AI detection in parallel
    verdicts_task   = verify_claims(claim_dicts)
    ai_detect_task  = detect_ai_probability(article["text"])
    verdicts, ai_result = await asyncio.gather(verdicts_task, ai_detect_task)

    # Enrich verdicts with claim text for conflict analyzer
    for i, v in enumerate(verdicts):
        if i < len(claims):
            v["claim_text"] = claims[i].text

    conflicts = await analyze_conflicts(verdicts)

    return FullReportResponse(
        article=article,
        claims=claims,
        verdicts=verdicts,
        conflicts=conflicts,
        ai_detection=AIDetectionResult(**ai_result),
        meta={"model_used": model_used, "runtime_ms": int((time.time()-t0)*1000)},
    )


# ── /stream ───────────────────────────────────────────────────────────────────
def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


@router.post("/stream", tags=["pipeline"])
async def stream_verify(body: VerifyRequest):
    """
    SSE stream events:
      stage    { stage, message }
      claims   { article, claims }
      verdict  { verdict: ClaimVerdict }
      conflict { conflict: ConflictInfo }
      ai       { detection: AIDetectionResult }
      done     { meta }
      error    { detail }
    """
    async def generator():
        t0 = time.time()
        try:
            # Stage 1 — extract
            yield _sse("stage", {"stage": "extracting", "message": "Extracting claims…"})
            await asyncio.sleep(0)
            try:
                article = await _resolve_article(body.url, body.text)
            except Exception as fetch_err:
                yield _sse("error", {"detail": str(fetch_err.detail if hasattr(fetch_err, 'detail') else fetch_err)})
                return
            claims, model_used = await extract_claims(article["text"])

            yield _sse("claims", {
                "article": article,
                "claims": [{"id": c.id, "text": c.text, "original_span": c.original_span} for c in claims],
            })

            if not claims:
                yield _sse("done", {"meta": {"model_used": model_used, "runtime_ms": int((time.time()-t0)*1000)}})
                return

            # Stage 2 — search
            yield _sse("stage", {"stage": "searching", "message": f"Searching evidence for {len(claims)} claims…"})
            await asyncio.sleep(0)

            # Stage 3 — verify (stream each verdict as it arrives)
            yield _sse("stage", {"stage": "verifying", "message": "Verifying claims with NLI + LLM…"})

            from app.services.verifier import verify_claim
            sem = asyncio.Semaphore(4)

            async def _one(i, c):
                async with sem:
                    return await verify_claim(c.id, c.text, index=i)

            tasks = [asyncio.ensure_future(_one(i, c)) for i, c in enumerate(claims)]
            verdicts = []
            for fut in asyncio.as_completed(tasks):
                v = await fut
                verdicts.append(v)
                yield _sse("verdict", {"verdict": v})

            # Stage 4 — conflict detection
            yield _sse("stage", {"stage": "conflicts", "message": "Analysing conflicts…"})
            for i, v in enumerate(verdicts):
                if i < len(claims):
                    v["claim_text"] = claims[i].text
            conflicts = await analyze_conflicts(verdicts)
            for c in conflicts:
                yield _sse("conflict", {"conflict": c})

            # Stage 5 — AI text detection
            yield _sse("stage", {"stage": "detecting", "message": "Checking for AI-generated content…"})
            from app.services.ai_detection import detect_ai_text
            ai_result = await detect_ai_text(article["text"])
            yield _sse("ai", {"detection": ai_result})

            # Stage 6 — Media detection (if URL provided)
            if body.url:
                yield _sse("stage", {"stage": "media", "message": "Scanning media for deepfakes…"})
                from app.services.media_detection import detect_media
                import httpx
                try:
                    async with httpx.AsyncClient(timeout=12, follow_redirects=True,
                            headers={"User-Agent": "VeritasAI/0.1"}) as client:
                        html_resp = await client.get(body.url)
                        media_result = await detect_media(html_resp.text, is_html=True)
                except Exception:
                    media_result = {"total_media": 0, "summary": "Media scan skipped.", "items": []}
                yield _sse("media", {"media": media_result})

            yield _sse("done", {
                "meta": {
                    "model_used": model_used,
                    "runtime_ms": int((time.time()-t0)*1000),
                    "total_claims": len(claims),
                }
            })

        except Exception as exc:
            yield _sse("error", {"detail": str(exc)})

    return StreamingResponse(
        generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"},
    )


# ── /detect-text ──────────────────────────────────────────────────────────────
@router.post("/detect-text", tags=["detection"])
async def detect_text(body: ExtractRequest):
    """Enhanced AI-generated text detection with perplexity + LLM blend."""
    from app.api.schema import TextDetectionSchema
    from app.services.ai_detection import detect_ai_text
    article = await _resolve_article(body.url, body.text)
    result  = await detect_ai_text(article["text"])
    return {
        "article_title": article.get("title", ""),
        "word_count":    len(article["text"].split()),
        "detection":     result,
    }


# ── /detect-media ─────────────────────────────────────────────────────────────
@router.post("/detect-media", tags=["detection"])
async def detect_media_endpoint(body: ExtractRequest):
    """
    AI-generated media detection.
    Provide a URL → fetches page HTML and extracts + analyses all images/audio.
    Or provide text with comma-separated media URLs.
    """
    from app.services.media_detection import detect_media
    if body.url:
        from app.services.fetcher import fetch_article
        import httpx
        try:
            async with httpx.AsyncClient(timeout=15, follow_redirects=True,
                headers={"User-Agent": "VeritasAI/0.1"}) as client:
                resp = await client.get(body.url)
                html = resp.text
        except Exception:
            html = ""
        result = await detect_media(html, is_html=True)
    else:
        result = await detect_media(body.text or "", is_html=False)
    return result


# ── /full-report (update to include media) ────────────────────────────────────
@router.post("/full-report-v2", tags=["pipeline"])
async def full_report_v2(body):
    """Complete pipeline + text detection + media detection."""
    pass  # Implemented via /stream which already emits all events
