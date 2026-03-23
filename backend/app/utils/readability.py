"""
Readability utilities — helpers for cleaning and truncating article text.
"""
import re


def clean_text(text: str) -> str:
    """Remove excessive whitespace and non-printable characters."""
    text = re.sub(r"\r\n|\r", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]+", " ", text)
    return text.strip()


def truncate_text(text: str, max_chars: int = 12000) -> str:
    """Truncate *text* to *max_chars* on a sentence boundary where possible."""
    if len(text) <= max_chars:
        return text
    truncated = text[:max_chars]
    # Try to end on a sentence boundary
    last_period = truncated.rfind(". ")
    if last_period > max_chars * 0.8:
        truncated = truncated[: last_period + 1]
    return truncated + " [truncated]"


def word_count(text: str) -> int:
    return len(text.split())
