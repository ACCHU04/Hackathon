"""Pydantic request / response schemas."""
from typing import Optional, Literal
from pydantic import BaseModel, model_validator


# ── Requests ──────────────────────────────────────────────────────────────────

class ExtractRequest(BaseModel):
    url:  Optional[str] = None
    text: Optional[str] = None
    options: Optional[dict] = None

    @model_validator(mode="after")
    def at_least_one(self) -> "ExtractRequest":
        if not self.url and not self.text:
            raise ValueError("Provide at least one of 'url' or 'text'.")
        return self


class VerifyRequest(BaseModel):
    url:  Optional[str] = None
    text: Optional[str] = None

    @model_validator(mode="after")
    def at_least_one(self) -> "VerifyRequest":
        if not self.url and not self.text:
            raise ValueError("Provide at least one of 'url' or 'text'.")
        return self


# ── Sub-models ────────────────────────────────────────────────────────────────

class ArticleInfo(BaseModel):
    title:  str = ""
    author: str = ""
    date:   str = ""
    text:   str


class Claim(BaseModel):
    id:            str
    text:          str
    original_span: list[int]


class ExtractionMeta(BaseModel):
    model_used: str
    runtime_ms: int


class EvidenceItem(BaseModel):
    title:   str = ""
    url:     str = ""
    snippet: str = ""
    date:    str = ""
    trust:   float = 0.5
    label:   str = "retrieved"


Verdict = Literal["TRUE", "FALSE", "PARTIALLY_TRUE", "UNVERIFIABLE", "PENDING"]


class ClaimVerdict(BaseModel):
    claim_id:      str
    verdict:       Verdict = "PENDING"
    confidence:    float = 0.0
    reasoning:     str = ""
    citations:     list[str] = []
    evidence:      list[EvidenceItem] = []
    runtime_ms:    int = 0
    claim_type:    str = "general"
    has_wikipedia: bool = False


# ── Responses ─────────────────────────────────────────────────────────────────

class ExtractResponse(BaseModel):
    article: ArticleInfo
    claims:  list[Claim]
    meta:    ExtractionMeta


class VerifyResponse(BaseModel):
    article:  ArticleInfo
    claims:   list[Claim]
    verdicts: list[ClaimVerdict]
    meta:     ExtractionMeta


# ── AI Detection ──────────────────────────────────────────────────────────────

class AIDetectionResult(BaseModel):
    ai_probability:    float
    human_probability: float
    label:             str
    confidence:        float
    signals:           dict = {}
    reasoning:         str  = ""


# ── Conflict ──────────────────────────────────────────────────────────────────

class ConflictInfo(BaseModel):
    claim_id:          str
    has_conflict:      bool
    conflict_reason:   str  = ""
    supporting_count:  int  = 0
    refuting_count:    int  = 0
    what_would_change: list[str] = []


# ── Full report ───────────────────────────────────────────────────────────────

class FullReportResponse(BaseModel):
    article:      ArticleInfo
    claims:       list[Claim]
    verdicts:     list[ClaimVerdict]
    conflicts:    list[ConflictInfo]
    ai_detection: Optional[AIDetectionResult] = None
    meta:         ExtractionMeta


# ── Media Detection ───────────────────────────────────────────────────────────

class MediaSignals(BaseModel):
    width:              Optional[int]   = None
    height:             Optional[int]   = None
    has_exif:           Optional[bool]  = None
    has_camera_make:    Optional[bool]  = None
    pixel_std:          Optional[float] = None
    compression_ratio:  Optional[float] = None
    ai_size_match:      Optional[bool]  = None
    spectral_flatness:  Optional[float] = None
    pitch_std:          Optional[float] = None
    mfcc_variance:      Optional[float] = None
    duration_s:         Optional[float] = None
    format:             Optional[str]   = None


class MediaItemSchema(BaseModel):
    url:            str
    media_type:     str
    filename:       str
    ai_probability: float
    label:          str
    signals:        dict = {}
    reasoning:      str  = ""


class MediaDetectionSchema(BaseModel):
    total_media:         int
    images_analyzed:     int
    audio_analyzed:      int
    flagged_count:       int
    aggregate_ai_score:  float
    label:               str
    items:               list[MediaItemSchema] = []
    summary:             str = ""


# ── Enhanced text detection ───────────────────────────────────────────────────

class TextDetectionSchema(BaseModel):
    ai_probability:    float
    human_probability: float
    label:             str
    confidence:        float
    signals:           dict = {}
    reasoning:         str  = ""
    method:            str  = "heuristic"
