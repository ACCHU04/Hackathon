"""
Evidence Index — FAISS-based vector store for retrieved evidence passages.

STUB: indexing and ANN search logic to be implemented.
"""


class EvidenceIndex:
    """Wraps a FAISS index for fast approximate nearest-neighbour retrieval."""

    def __init__(self, index_path: str | None = None):
        self.index_path = index_path
        self._index = None  # faiss.IndexFlatL2 will go here

    def add(self, passages: list[str], metadata: list[dict]) -> None:
        """Encode passages and add to the FAISS index. (stub)"""
        raise NotImplementedError("Evidence indexing not yet implemented.")

    def search(self, query: str, top_k: int = 5) -> list[dict]:
        """Return the top-k most relevant passages for *query*. (stub)"""
        return []

    def save(self) -> None:
        """Persist the index to disk. (stub)"""
        pass

    def load(self) -> None:
        """Load the index from disk. (stub)"""
        pass
