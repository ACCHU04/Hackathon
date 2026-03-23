"""
Article Fetcher — downloads a URL and extracts clean article text.

Primary extractor: newspaper3k
Fallback extractor: readability-lxml
"""
import asyncio
from typing import Optional

import httpx

REQUEST_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; FactClaimVerifier/0.1; "
        "+https://github.com/ACCHU04/fact-claim-verifier)"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}

TIMEOUT_SECONDS = 15


async def fetch_article(url: str) -> Optional[dict]:
    """
    Fetch *url* and extract article text.

    Returns a dict with keys: title, author, date, text.
    Returns None if extraction fails.
    """
    try:
        async with httpx.AsyncClient(
            follow_redirects=True,
            timeout=TIMEOUT_SECONDS,
            headers=REQUEST_HEADERS,
        ) as client:
            response = await client.get(url)
            response.raise_for_status()
            html = response.text

        result = await asyncio.to_thread(_parse_with_newspaper, url, html)
        if result and result.get("text"):
            return result

        # Fallback to readability
        result = _parse_with_readability(html)
        if result and result.get("text"):
            return result

        return None

    except Exception as exc:  # noqa: BLE001
        print(f"[fetcher] Failed to fetch {url}: {exc}")
        return None


def _parse_with_newspaper(url: str, html: str) -> Optional[dict]:
    """Extract article using newspaper3k."""
    try:
        from newspaper import Article

        article = Article(url)
        article.set_html(html)
        article.parse()

        return {
            "title": article.title or "",
            "author": ", ".join(article.authors) if article.authors else "",
            "date": str(article.publish_date.date()) if article.publish_date else "",
            "text": article.text or "",
        }
    except Exception as exc:  # noqa: BLE001
        print(f"[fetcher] newspaper3k failed: {exc}")
        return None


def _parse_with_readability(html: str) -> Optional[dict]:
    """Fallback: extract article using readability-lxml."""
    try:
        from readability import Document

        doc = Document(html)
        summary_html = doc.summary()

        # Strip HTML tags naively
        import re
        text = re.sub(r"<[^>]+>", " ", summary_html)
        text = re.sub(r"\s+", " ", text).strip()

        return {
            "title": doc.title() or "",
            "author": "",
            "date": "",
            "text": text,
        }
    except Exception as exc:  # noqa: BLE001
        print(f"[fetcher] readability failed: {exc}")
        return None
