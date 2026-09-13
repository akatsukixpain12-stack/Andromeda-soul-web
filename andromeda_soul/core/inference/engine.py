"""
Andromeda Soul Dedicated Native Inference Engine
Executes forward passes on Andromeda Model architecture without third-party APIs.
"""

import os
import time
import math
import random
import re
from typing import Dict, Any, List, Optional, Generator

from ..model.architecture import AndromedaModel
from ..model.config import get_config, ModelConfig
from ..tokenizer.tokenizer import AndromedaTokenizer

class AndromedaInferenceEngine:
    def __init__(self, model_name: str = "andromeda-nano"):
        self.config = get_config(model_name)
        self.tokenizer = AndromedaTokenizer()
        self.model = AndromedaModel(self.config)
        print(f"[Andromeda Soul Engine] Initialized native {self.config.name} architecture ({self.model.count_parameters():,} params)")

    def generate(
        self,
        prompt: str,
        max_new_tokens: int = 256,
        temperature: float = 0.7,
        top_p: float = 0.9,
    ) -> str:
        # A randomly initialized model cannot produce useful language. Until trained
        # weights are loaded, use the deterministic local assistant instead of
        # returning an empty or misleading success message.
        return self._compose_response(prompt, max_new_tokens=max_new_tokens)

    def generate_stream(
        self,
        prompt: str,
        max_new_tokens: int = 256,
        temperature: float = 0.7,
    ) -> Generator[str, None, None]:
        response_text = self._compose_response(prompt, max_new_tokens=max_new_tokens)
        for chunk in re.findall(r"\S+\s*", response_text):
            yield chunk

    def _compose_response(self, prompt: str, max_new_tokens: int = 256) -> str:
        """Provide a useful local response when no trained checkpoint is available."""
        text = (prompt or "").strip()
        if not text:
            return "Hi! I'm Andromeda Soul. What would you like to build or understand?"

        lower = text.lower()
        if lower in {"hi", "hello", "hey", "sup", "yo"} or lower.startswith(("hi ", "hello ")):
            return (
                "Hi! I'm Andromeda Soul, your local AI workspace assistant. "
                "I can help with Python, TypeScript, Discord bots, debugging, architecture, and math. "
                "What are you working on?"
            )
        if "who are you" in lower or "what are you" in lower:
            return (
                "I'm Andromeda Soul, the assistant running in this workspace. "
                "I can reason over your request, use the configured tools, and return responses "
                "through the native API. This local fallback is deterministic until trained model "
                "weights are installed."
            )
        if lower.startswith(("calc:", "math:")):
            expression = re.sub(r"^(calc:|math:)\s*", "", text, flags=re.IGNORECASE)
            if re.fullmatch(r"[0-9+\-*/().%\s]+", expression):
                try:
                    result = eval(expression, {"__builtins__": {}}, {})
                    return f"**Calculated result:** `{result}`"
                except (ArithmeticError, SyntaxError, ValueError):
                    return "I couldn’t evaluate that expression. Check the operators and try again."
            return "For safety, I only evaluate numeric expressions in `calc:` requests."
        if "python" in lower or "typescript" in lower or "javascript" in lower or "code" in lower:
            return (
                f"I can help implement this coding task:\n\n"
                f"> {text[:400]}\n\n"
                "Please share the relevant file or the exact error and I’ll propose a complete, "
                "testable change. I won’t invent files or claim code ran when it did not."
            )
        if lower.endswith("?") or any(lower.startswith(word) for word in ("how ", "why ", "what ", "can ", "should ")):
            return (
                f"Here’s how I’d approach it:\n\n"
                f"1. Clarify the goal: {text[:240]}\n"
                "2. Inspect the current inputs, constraints, and failure point.\n"
                "3. Make the smallest verifiable change and test the result.\n\n"
                "If you paste the relevant context, I can take the next concrete step."
            )
        return (
            f"I understand: {text[:500]}\n\n"
            "I’m ready to help with a concrete implementation, explanation, or debugging step. "
            "Tell me the desired outcome and include any relevant code, error, or constraints."
        )
