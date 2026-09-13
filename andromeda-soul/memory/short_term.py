"""
Andromeda Short-Term Active Memory Engine
"""

from typing import List, Dict, Any

class ShortTermMemory:
    def __init__(self, capacity: int = 20):
        self.capacity = capacity
        self.buffer: List[Dict[str, Any]] = []

    def add(self, role: str, content: str):
        self.buffer.append({"role": role, "content": content})
        if len(self.buffer) > self.capacity:
            self.buffer.pop(0)

    def get_context(self) -> List[Dict[str, Any]]:
        return self.buffer

    def clear(self):
        self.buffer.clear()
