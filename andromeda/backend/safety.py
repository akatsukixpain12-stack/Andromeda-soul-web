import re
from typing import List, Dict, Any

class SafetyValidator:
    """
    Validates user prompts and model completions against safety bounds,
    system prompt leak prevention, and code execution integrity.
    """
    def __init__(self):
        self.banned_input_patterns = [
            r"ignore\s+all\s+previous\s+instructions",
            r"reveal\s+system\s+prompt",
            r"you\s+are\s+now\s+in\s+dan\s+mode",
        ]

    def validate_input(self, text: str) -> Dict[str, Any]:
        """Validates incoming user query."""
        for pattern in self.banned_input_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                return {
                    "safe": False,
                    "reason": "Adversarial prompt injection pattern detected",
                    "sanitized_text": text
                }
        return {"safe": True, "reason": "Passed safety checks", "sanitized_text": text}

    def validate_output(self, text: str) -> Dict[str, Any]:
        """Sanitizes outgoing assistant response."""
        # Ensure no accidental internal API keys leak
        sanitized = re.sub(r"(AIzaSy[0-9A-Za-z_-]{33})", "[REDACTED_GEMINI_KEY]", text)
        sanitized = re.sub(r"(sk-[a-zA-Z0-9]{32,})", "[REDACTED_API_KEY]", sanitized)
        return {"safe": True, "text": sanitized}

safety_engine = SafetyValidator()
