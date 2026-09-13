from typing import List, Dict, Any, Optional

class ConversationMemory:
    """
    Manages short-term conversation context, persistent chat session records,
    and semantic working memory for multi-agent reasoning.
    """
    def __init__(self, max_messages: int = 20):
        self.max_messages = max_messages
        self.sessions: Dict[str, List[Dict[str, Any]]] = {}

    def get_context(self, session_id: str, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        history = self.sessions.get(session_id, [])
        num = limit or self.max_messages
        return history[-num:]

    def append_message(self, session_id: str, role: str, content: str, tool_calls: Optional[List[Any]] = None):
        if session_id not in self.sessions:
            self.sessions[session_id] = []
        
        msg = {
            "role": role,
            "content": content,
            "tool_calls": tool_calls or []
        }
        self.sessions[session_id].append(msg)

    def clear_session(self, session_id: str):
        if session_id in self.sessions:
            del self.sessions[session_id]

    def format_history_for_prompt(self, session_id: str) -> str:
        history = self.get_context(session_id)
        if not history:
            return ""
        
        lines = []
        for msg in history:
            role_title = "User" if msg["role"] == "user" else "Assistant"
            lines.append(f"{role_title}: {msg['content']}")
        return "\n\n".join(lines)

memory_manager = ConversationMemory()
