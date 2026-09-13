"""
Andromeda Lightweight Native Cosine Vector Store
"""

import math
from typing import List, Dict, Any, Tuple

class VectorStore:
    def __init__(self):
        self.vectors: List[Tuple[List[float], Dict[str, Any]]] = []

    def _simple_embedding(self, text: str) -> List[float]:
        # Fast 64-dim n-gram feature hash embedding for similarity retrieval
        vec = [0.0] * 64
        words = text.lower().split()
        for word in words:
            for char in word:
                idx = ord(char) % 64
                vec[idx] += 1.0
        norm = math.sqrt(sum(v * v for v in vec)) or 1.0
        return [v / norm for v in vec]

    def add(self, text: str, metadata: Dict[str, Any]):
        embedding = self._simple_embedding(text)
        self.vectors.append((embedding, {"text": text, **metadata}))

    def search(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        query_vec = self._simple_embedding(query)
        results = []

        for vec, meta in self.vectors:
            score = sum(q * v for q, v in zip(query_vec, vec))
            results.append((score, meta))

        results.sort(key=lambda x: x[0], reverse=True)
        return [meta for score, meta in results[:top_k] if score > 0.2]
