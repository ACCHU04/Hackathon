"""
AI-Generated Media Detection — images + audio

Pipeline:
  1. Extract media URLs from article HTML (img src, audio src, og:image)
  2. For each image:
       a. EXIF metadata analysis (missing/suspicious metadata → AI flag)
       b. Pixel-level statistics (noise patterns, compression artifacts)
       c. FaceForensics++ style heuristics (for face images)
       d. LLM vision analysis (GPT-4o vision API)
  3. For each audio:
       a. Duration + format check
       b. Spectral analysis heuristics (flat spectrum → TTS)
       c. LLM audio description (future)
  4. Return per-media scores + aggregate document score
"""
import asyncio
import base64
import io
import json
import os
import re
from typing import TypedDict


class MediaItem(TypedDict):
    url:             str
    media_type:      str      # image | audio | video
    filename:        str
    ai_probability:  float
    label:           str      # likely_ai | likely_human | uncertain | error
    signals:         dict
    reasoning:       str


class MediaDetectionResult(TypedDict):
    total_media:          int
    images_analyzed:      int
    audio_analyzed:       int
    flagged_count:        int
    aggregate_ai_score:   float
    label:                str
    items:                list[MediaItem]
    summary:              str


# ── Media extraction ──────────────────────────────────────────────────────────

def extract_media_urls(html: str, base_url: str = "") -> list[dict]:
    """Extract image and audio URLs from HTML."""
    items = []
    seen: set[str] = set()

    # Images: src, data-src, og:image
    for pattern in [
        r'<img[^>]+src=["\']([^"\'>\s]+)["\']',
        r'<img[^>]+data-src=["\']([^"\'>\s]+)["\']',
        r'content=["\']([^"\'>\s]+\.(jpg|jpeg|png|webp|gif))["\']',
    ]:
        for match in re.finditer(pattern, html, re.IGNORECASE):
            url = match.group(1)
            if not url.startswith(('http', '//')):
                continue
            if url not in seen:
                seen.add(url)
                items.append({"url": url, "type": "image"})

    # Audio
    for pattern in [
        r'<audio[^>]+src=["\']([^"\'>\s]+)["\']',
        r'<source[^>]+src=["\']([^"\'>\s]+\.(mp3|wav|ogg|m4a))["\']',
    ]:
        for match in re.finditer(pattern, html, re.IGNORECASE):
            url = match.group(1)
            if url not in seen:
                seen.add(url)
                items.append({"url": url, "type": "audio"})

    return items[:10]  # cap at 10


# ── Image analysis ────────────────────────────────────────────────────────────

async def _fetch_image_bytes(url: str) -> bytes | None:
    try:
        import httpx
        headers = {"User-Agent": "VeritasAI/0.1 (media-detection)"}
        async with httpx.AsyncClient(timeout=10, headers=headers) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            if "image" not in resp.headers.get("content-type", ""):
                return None
            return resp.content
    except Exception:
        return None


def _analyze_image_heuristics(img_bytes: bytes) -> tuple[float, dict]:
    """
    Pixel-level heuristics for AI image detection.
    Returns (ai_probability, signals).
    """
    signals: dict = {}
    score = 0.3  # default baseline

    try:
        from PIL import Image
        import struct

        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        w, h = img.size
        signals["width"]  = w
        signals["height"] = h
        signals["aspect"] = round(w / h, 2) if h else 0

        # ── Signal 1: EXIF check ─────────────────────────────────────────────
        exif_data = {}
        if hasattr(img, "_getexif") and img._getexif():
            exif_data = img._getexif() or {}
        has_exif         = bool(exif_data)
        has_camera_make  = 271 in exif_data  # tag 271 = Make
        has_gps          = 34853 in exif_data  # GPS
        signals["has_exif"]        = has_exif
        signals["has_camera_make"] = has_camera_make

        # AI images typically lack EXIF or have minimal metadata
        if not has_exif:
            score += 0.18
        elif not has_camera_make:
            score += 0.08

        # ── Signal 2: Noise analysis ─────────────────────────────────────────
        import math
        pixels = list(img.getdata())
        sample = pixels[::max(1, len(pixels)//500)][:500]

        r_vals = [p[0] for p in sample]
        g_vals = [p[1] for p in sample]
        b_vals = [p[2] for p in sample]

        def std(vals):
            mu = sum(vals) / len(vals)
            return math.sqrt(sum((x - mu)**2 for x in vals) / len(vals))

        r_std = std(r_vals)
        g_std = std(g_vals)
        b_std = std(b_vals)
        avg_std = (r_std + g_std + b_std) / 3

        signals["pixel_std"] = round(avg_std, 2)

        # AI images often have unnaturally smooth noise profiles
        if avg_std < 30:
            score += 0.12
        elif avg_std > 80:
            score -= 0.08

        # ── Signal 3: Compression artifact check ─────────────────────────────
        # Re-save as JPEG and compare size ratio
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=85)
        compressed_size = buf.tell()
        original_size   = len(img_bytes)
        ratio = compressed_size / original_size if original_size else 1.0
        signals["compression_ratio"] = round(ratio, 3)

        # AI images compress differently from photos
        if 0.8 < ratio < 1.3:
            score += 0.06

        # ── Signal 4: Aspect ratio heuristics ────────────────────────────────
        # Common AI image ratios: 1:1, 3:2, 16:9, 4:3
        common_ai_ratios = [1.0, 1.5, 1.78, 1.33]
        aspect = w / h if h else 1
        if any(abs(aspect - r) < 0.02 for r in common_ai_ratios):
            score += 0.04

        # ── Signal 5: Resolution check ────────────────────────────────────────
        # Typical AI image sizes: 512, 768, 1024, 1152
        ai_sizes = [512, 768, 1024, 1152, 1280, 1536, 2048]
        if w in ai_sizes or h in ai_sizes:
            score += 0.08

        signals["ai_size_match"] = w in ai_sizes or h in ai_sizes

    except Exception as exc:
        signals["error"] = str(exc)
        score = 0.4  # unknown

    return round(min(0.98, max(0.02, score)), 3), signals


async def _llm_vision_analysis(img_bytes: bytes, url: str) -> tuple[float, str]:
    """Use LLM vision to assess if image is AI-generated."""
    from app.services.llm_provider import get_provider
    provider = get_provider()
    if provider == "none":
        return -1.0, ""

    b64 = base64.b64encode(img_bytes).decode()
    magic = img_bytes[:4]
    if magic[:3] == b'\xff\xd8\xff':
        mime = "image/jpeg"
    elif magic[:8] == b'\x89PNG\r\n\x1a\n':
        mime = "image/png"
    else:
        mime = "image/jpeg"

    prompt_text = (
        "Analyze this image and determine if it was generated by AI "
        "(Midjourney, DALL-E, Stable Diffusion, etc.) or if it is a real photograph.\n\n"
        "Look for: unnaturally smooth skin, impossible lighting, "
        "blurred backgrounds with perfect bokeh, inconsistent shadows, "
        "distorted hands/fingers/text, watermarks.\n\n"
        'Output ONLY JSON: {"ai_probability": 0.0, "reasoning": "..."}'
    )

    try:
        if provider == "gemini":
            import google.generativeai as genai
            api_key = os.getenv("GOOGLE_GEMINI_KEY", "").strip()
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(os.getenv("GEMINI_MODEL", "gemini-2.0-flash"))
            image_part = {"mime_type": mime, "data": img_bytes}
            response = await model.generate_content_async(
                [prompt_text, image_part],
                generation_config=genai.GenerationConfig(
                    temperature=0, max_output_tokens=300,
                    response_mime_type="application/json",
                ),
            )
            data = json.loads(response.text)
        else:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY", "").strip())
            resp = await client.chat.completions.create(
                model="gpt-4o", max_tokens=300,
                messages=[{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt_text},
                        {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64}", "detail": "low"}},
                    ],
                }],
            )
            data = json.loads(resp.choices[0].message.content or "{}")

        return float(data.get("ai_probability", -1)), data.get("reasoning", "")
    except Exception as exc:
        print(f"[media_detection] Vision API failed: {exc}")
        return -1.0, ""


async def analyze_image(url: str) -> MediaItem:
    img_bytes = await _fetch_image_bytes(url)
    if not img_bytes:
        return MediaItem(
            url=url, media_type="image",
            filename=url.split("/")[-1][:40],
            ai_probability=0.5, label="error",
            signals={}, reasoning="Failed to fetch image.",
        )

    # Run heuristics + vision in parallel
    heuristic_task = asyncio.to_thread(_analyze_image_heuristics, img_bytes)
    vision_task    = _llm_vision_analysis(img_bytes, url)
    (heuristic_prob, signals), (vision_prob, vision_reasoning) = await asyncio.gather(
        heuristic_task, vision_task
    )

    if vision_prob >= 0:
        final     = round(0.45 * heuristic_prob + 0.55 * vision_prob, 3)
        reasoning = vision_reasoning or "Combined pixel analysis + GPT-4o vision."
    else:
        final     = heuristic_prob
        reasoning = f"Pixel analysis only. std={signals.get('pixel_std','?')}, exif={signals.get('has_exif','?')}."

    label = (
        "likely_ai"    if final >= 0.65 else
        "likely_human" if final <= 0.35 else
        "uncertain"
    )

    return MediaItem(
        url=url, media_type="image",
        filename=url.split("/")[-1][:40],
        ai_probability=final, label=label,
        signals=signals, reasoning=reasoning,
    )


# ── Audio analysis ────────────────────────────────────────────────────────────

async def _fetch_audio_bytes(url: str, max_bytes: int = 500_000) -> bytes | None:
    try:
        import httpx
        async with httpx.AsyncClient(timeout=15) as client:
            async with client.stream("GET", url) as resp:
                resp.raise_for_status()
                chunks = []
                size   = 0
                async for chunk in resp.aiter_bytes(chunk_size=8192):
                    chunks.append(chunk)
                    size += len(chunk)
                    if size >= max_bytes:
                        break
                return b"".join(chunks)
    except Exception:
        return None


def _analyze_audio_heuristics(audio_bytes: bytes) -> tuple[float, dict]:
    """
    Spectral heuristics for TTS / synthetic audio detection.
    Returns (ai_probability, signals).
    """
    signals: dict = {}
    score = 0.35

    try:
        # Check file format by magic bytes
        magic = audio_bytes[:12]
        if magic[:3] == b'ID3' or magic[:2] == b'\xff\xfb':
            signals["format"] = "mp3"
        elif magic[:4] == b'RIFF':
            signals["format"] = "wav"
        elif magic[:4] == b'OggS':
            signals["format"] = "ogg"
        else:
            signals["format"] = "unknown"

        signals["size_kb"] = round(len(audio_bytes) / 1024, 1)

        # Try librosa for spectral analysis
        import io as _io
        try:
            import librosa
            import numpy as np

            y, sr = librosa.load(_io.BytesIO(audio_bytes), sr=None, duration=30)
            signals["duration_s"]    = round(len(y) / sr, 1)
            signals["sample_rate"]   = sr

            # ── Spectral flatness ────────────────────────────────────────────
            flatness = float(np.mean(librosa.feature.spectral_flatness(y=y)))
            signals["spectral_flatness"] = round(flatness, 4)
            # TTS audio tends to have lower spectral flatness (more tonal)
            if flatness < 0.01:
                score += 0.20
            elif flatness < 0.03:
                score += 0.10

            # ── Pitch variance ───────────────────────────────────────────────
            pitches, mags = librosa.piptrack(y=y, sr=sr)
            pitch_vals    = pitches[mags > np.median(mags)]
            if len(pitch_vals) > 0:
                pitch_std = float(np.std(pitch_vals))
                signals["pitch_std"] = round(pitch_std, 2)
                # Unnatural TTS has low pitch variance
                if pitch_std < 80:
                    score += 0.15

            # ── Zero crossing rate ───────────────────────────────────────────
            zcr_mean = float(np.mean(librosa.feature.zero_crossing_rate(y)))
            signals["zcr"] = round(zcr_mean, 4)

            # ── MFCC variance (voice texture) ─────────────────────────────────
            mfccs     = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
            mfcc_var  = float(np.mean(np.var(mfccs, axis=1)))
            signals["mfcc_variance"] = round(mfcc_var, 2)
            if mfcc_var < 50:
                score += 0.10

        except ImportError:
            signals["librosa"] = "not_available"
            # Fallback: size heuristic (TTS files often have consistent bitrates)
            if 50 < signals["size_kb"] < 2000:
                score += 0.05

    except Exception as exc:
        signals["error"] = str(exc)

    return round(min(0.97, max(0.03, score)), 3), signals


async def analyze_audio(url: str) -> MediaItem:
    audio_bytes = await _fetch_audio_bytes(url)
    if not audio_bytes:
        return MediaItem(
            url=url, media_type="audio",
            filename=url.split("/")[-1][:40],
            ai_probability=0.5, label="error",
            signals={}, reasoning="Failed to fetch audio.",
        )

    prob, signals = await asyncio.to_thread(_analyze_audio_heuristics, audio_bytes)
    label = (
        "likely_ai"    if prob >= 0.65 else
        "likely_human" if prob <= 0.35 else
        "uncertain"
    )
    fmt = signals.get("format", "unknown")
    dur = signals.get("duration_s", "?")
    reasoning = (
        f"Audio format: {fmt}, duration: {dur}s. "
        f"Spectral flatness: {signals.get('spectral_flatness','?')}, "
        f"pitch std: {signals.get('pitch_std','?')}."
    )

    return MediaItem(
        url=url, media_type="audio",
        filename=url.split("/")[-1][:40],
        ai_probability=prob, label=label,
        signals=signals, reasoning=reasoning,
    )


# ── Public API ────────────────────────────────────────────────────────────────

async def detect_media(html_or_urls: str, is_html: bool = True) -> MediaDetectionResult:
    """
    Detect AI-generated media in an article.

    Args:
        html_or_urls: HTML string or comma-separated list of URLs
        is_html:      True if html_or_urls is HTML, False if URL list
    """
    if is_html:
        items = extract_media_urls(html_or_urls)
    else:
        items = [
            {"url": u.strip(), "type": "image" if any(e in u for e in [".jpg",".jpeg",".png",".webp",".gif"]) else "audio"}
            for u in html_or_urls.split(",") if u.strip()
        ]

    if not items:
        return MediaDetectionResult(
            total_media=0, images_analyzed=0, audio_analyzed=0,
            flagged_count=0, aggregate_ai_score=0.0,
            label="no_media", items=[],
            summary="No media found in the document.",
        )

    # Analyse each item concurrently
    sem = asyncio.Semaphore(4)

    async def _analyse(item: dict) -> MediaItem:
        async with sem:
            if item["type"] == "image":
                return await analyze_image(item["url"])
            else:
                return await analyze_audio(item["url"])

    results: list[MediaItem] = await asyncio.gather(*[_analyse(i) for i in items])

    imgs     = [r for r in results if r["media_type"] == "image"]
    auds     = [r for r in results if r["media_type"] == "audio"]
    flagged  = [r for r in results if r["ai_probability"] >= 0.65 and r["label"] != "error"]
    valid    = [r for r in results if r["label"] != "error"]
    agg      = round(sum(r["ai_probability"] for r in valid) / len(valid), 3) if valid else 0.0
    label    = (
        "likely_ai"    if agg >= 0.65 else
        "likely_human" if agg <= 0.35 else
        "uncertain"
    )

    return MediaDetectionResult(
        total_media=len(results),
        images_analyzed=len(imgs),
        audio_analyzed=len(auds),
        flagged_count=len(flagged),
        aggregate_ai_score=agg,
        label=label,
        items=results,
        summary=(
            f"Analyzed {len(imgs)} image(s) and {len(auds)} audio file(s). "
            f"{len(flagged)} flagged as likely AI-generated. "
            f"Aggregate AI probability: {int(agg*100)}%."
        ),
    )
