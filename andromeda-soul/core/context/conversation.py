"""
Andromeda Conversation Data Structure
"""

import time
import uuid
from typing import List, Dict, Any, Optional

class Conversation:
    def __init__(self, conversation_id: Optional[str] = None, user_id: str = "default_user"):
        self.conversation_id = conversation_id or str(uuid.uuid4())
        self.user_id = user_id
        self.created_at = time.time()
        self.updated_at = time.time()
        self.messages: List[Dict[str, Any]] = []

    def add_message(self, role: str, content: str, metadata: Optional[Dict[str, Any]] = None):
        self.messages.append({
            "id": str(uuid.uuid4()),
            "role": role,
            "content": content,
            "timestamp": time.time(),
            "metadata": metadata or {},
        })
        self.updated_at = time.time()

    def to_dict((self)) -> Dict[str, Any]:
        return {
            "conversation_id": self.conversation_id,
            "user_id": self.user_id,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "messages": self.messages,
        }
