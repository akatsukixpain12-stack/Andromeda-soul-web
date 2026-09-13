"""
Andromeda Soul Context Manager & Window Assembly
"""

from typing import List, Dict, Any

class ContextManager:
    def __init__(self, max_tokens: int = 4096):
        self.max_tokens = max_tokens

    def assemble_prompt(
        self,
        system_prompt: str,
        history: List[Dict[str, str]],
        memory_snippets: List[str],
        user_query: str,
    ) -> str:
        prompt_parts = [f"<system>\n{system_prompt}\n</system>"]

        if memory_snippets:
            mem_text = "\n".join([f"- {m}" for m in memory_snippets])
            prompt_parts.append(f"<memory>\n{mem_text}\n</memory>")

        for msg in history[-10:]:  # Keep recent history
            role = msg.get("role", "user")
            content = msg.get("content", "")
            prompt_parts.append(f"<{role}>\n{content}\n</{role}>")

        prompt_parts.append(f"<user>\n{user_query}\n</user>\n<assistant>\n")
        return "\n\n".join(prompt_parts)
