"""
NLI Model wrapper — cross-encoder for natural language inference.

STUB: will use cross-encoder/nli-deberta-v3-small for entailment scoring.
"""
from typing import Literal

NLILabel = Literal["entailment", "neutral", "contradiction"]


class NLIModel:
    """Lazy-loaded cross-encoder NLI model."""

    _instance = None
    _model = None

    @classmethod
    def get(cls) -> "NLIModel":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def predict(self, premise: str, hypothesis: str) -> dict:
        """
        Predict the NLI relationship between *premise* (evidence) and
        *hypothesis* (claim).

        Returns: { label, scores: {entailment, neutral, contradiction} }
        STUB — returns neutral until implemented.
        """
        return {
            "label": "neutral",
            "scores": {
                "entailment": 0.33,
                "neutral": 0.34,
                "contradiction": 0.33,
            },
        }

    def _load_model(self):
        """Load the cross-encoder from HuggingFace Hub. (stub)"""
        raise NotImplementedError
