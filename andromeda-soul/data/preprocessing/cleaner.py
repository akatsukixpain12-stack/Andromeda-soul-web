"""
Andromeda Dataset Text Cleaning & Filtering Pipeline
"""

import re
import html
from typing import List, Dict, Any

class DataCleaner:
    @staticmethod
    def clean_text(text: str) -> str:
        text = html.unescape(text)
        text = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    @staticmethod
    def filter_quality(text: str, min_chars: int = 20, max_rep_ratio: float = 0.5) -> bool:
        if len(text) < min_chars:
            return False
        words = text.split()
        if not words:
            return False
        unique_words = set(words)
        if len(unique_words) / len(words) < (1.0 - max_rep_ratio):
            return False
        return True
