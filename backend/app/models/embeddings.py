"""
Embeddings wrapper — generates sentence embeddings for FAISS indexing.

STUB: will use sentence-transformers all-MiniLM-L6-v2.
"""
from typing import Optional
import os


class EmbeddingModel:
    """Lazy-loaded sentence-transformers wrapper."""

    _instance: Optional["EmbeddingModel"] = None
    _model = None

    @classmethod
    def get(cls) -> "EmbeddingModel":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def encode(self, texts: list[str]) -> list[list[float]]:
        """Return embeddings for *texts*. (stub — returns zeros)"""
        dim = 384  # all-MiniLM-L6-v2 dimension
        return [[0.0] * dim for _ in texts]

    def _load_model(self):
        """Load the sentence-transformer model (deferred). (stub)"""
        raise NotImplementedError
