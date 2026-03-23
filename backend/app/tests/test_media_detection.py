"""Tests for media_detection.py — unit tests, no network calls needed."""
import pytest
from app.services.media_detection import extract_media_urls, detect_media

SAMPLE_HTML = """
<html><body>
  <img src="https://example.com/photo.jpg" alt="test">
  <img src="https://cdn.site.com/image.png">
  <img data-src="https://lazy.com/img.webp">
  <audio src="https://audio.com/clip.mp3"></audio>
  <p>Some article text here.</p>
</body></html>
"""

def test_extract_images():
    items = extract_media_urls(SAMPLE_HTML)
    urls = [i["url"] for i in items]
    assert any("photo.jpg" in u for u in urls)
    assert any("image.png" in u for u in urls)

def test_extract_audio():
    items = extract_media_urls(SAMPLE_HTML)
    audio = [i for i in items if i["type"] == "audio"]
    assert len(audio) >= 1
    assert "clip.mp3" in audio[0]["url"]

def test_extract_deduplicates():
    html = '<img src="https://a.com/x.jpg"><img src="https://a.com/x.jpg">'
    items = extract_media_urls(html)
    urls = [i["url"] for i in items]
    assert len(urls) == len(set(urls))

def test_extract_skips_relative_urls():
    html = '<img src="/local/image.jpg"><img src="https://valid.com/img.png">'
    items = extract_media_urls(html)
    assert all(i["url"].startswith("http") for i in items)

@pytest.mark.asyncio
async def test_detect_media_no_media():
    result = await detect_media("No images here at all.", is_html=True)
    assert result["total_media"] == 0
    assert result["label"] == "no_media"

@pytest.mark.asyncio
async def test_detect_media_returns_structure():
    result = await detect_media("no media", is_html=False)
    for key in ("total_media","images_analyzed","audio_analyzed","flagged_count","aggregate_ai_score","label","items","summary"):
        assert key in result

@pytest.mark.asyncio
async def test_detect_media_url_list():
    # Non-reachable URLs → error items, but structure is correct
    result = await detect_media("https://fake.example.com/img.jpg", is_html=False)
    assert isinstance(result["items"], list)
