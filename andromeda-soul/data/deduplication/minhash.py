"""
MinHash Deduplication for Andromeda Datasets
"""

import hashlib
from typing import List, Set

class MinHashDeduplicator:
    def __init__(self, num_perm: int = 64):
        self.num_perm = num_perm

    def compute_signature(self, text: str) -> List[int]:
        shingles = set(text.lower().split())
        signature = []
        for i in range(self.num_perm):
            min_hash = float("inf")
            for shingle in shingles:
                h = int(hashlib.md5(f"{i}_{shingle}".encode("utf-8")).hexdigest(), 16)
                if h < min_hash:
                    min_hash = h
            signature.append(min_hash if min_hash != float("inf") else 0)
        return signature

    def is_duplicate(self, sig1: List[int], sig2: List[int], threshold: float = 0.8) -> bool:
        matches = sum(1 for a, b in zip(sig1, sig2) if a == b)
        similarity = matches / self.num_perm
        return similarity >= threshold
