"""
Andromeda Persistent Long-Term Memory & User Privacy Controls
"""

import time
import json
import os
from typing import List, Dict, Any
from .vector_store import VectorStore

class LongTermMemory:
    def __init__(self, user_id: str = "default_user", storage_dir: str = "data/memory"):
        self.user_id = user_id
        self.storage_dir = storage_dir
        self.vector_store = VectorStore()
        os.makedirs(storage_dir, exist_ok=True)
        self.filepath = os.path.join(storage_dir, f"{user_id}_memory.json")
        self.load_memories()

    def load_memories(self):
        if os.path.exists(self.filepath):
            with open(self.filepath, "r", encoding="utf-8") as f:
                memories = json.load(f)
                for mem in memories:
                    self.vector_store.add(mem["content"], mem)

    def save_memory(self, content: str, category: str = "general"):
        mem = {
            "id": f"mem_{int(time.time() * 1000)}",
            "content": content,
            "category": category,
            "timestamp": time.time()
        }
        self.vector_store.add(content, mem)
        
        memories = [m[1] for m in self.vector_store.vectors]
        with open(self.filepath, "w", encoding="utf-8") as f:
            json.dump(memories, f, indent=2)

    def retrieve_relevant(self, query: str, top_k: int = 3) -> List[str]:
        results = self.vector_store.search(query, top_k=top_k)
        return [r["text"] for r in results]
