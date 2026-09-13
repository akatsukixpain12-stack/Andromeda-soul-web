"""
Andromeda Context Window Truncation & Token Budgeting
"""

from typing import List, Dict, Any

class ContextWindow:
    def __init__(self, max_context_length: int = 4096):
        self.max_context_length = max_context_length

    def truncate_history(self, messages: List[Dict[str, Any]], max_tokens: int = 3000) -> List[Dict[str, Any]]:
        # Approximate token calculation (1 token ~= 4 chars)
        current_len = 0
        truncated = []
        for msg in reversed(messages):
            msg_len = len(msg.get("content", "")) // 4
            if current_len + msg_len > max_tokens:
                break
            truncated.insert(0, msg)
            current_len += msg_len
        return truncated
