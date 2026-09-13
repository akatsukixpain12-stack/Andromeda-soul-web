import re
from typing import List, Dict, Any

class IntentPlanner:
    """
    Step 1 & 3 in Andromeda pipeline: Understands request intent,
    plans sub-goals, and decides what tools are required.
    """
    def __init__(self):
        pass

    def analyze_request(self, message: str, attachments: List[Any] = None) -> Dict[str, Any]:
        msg_lower = message.lower().strip()
        tools_needed = []

        # 1. Check for web search requirement
        search_triggers = [
            "who is", "what is the latest", "today", "news", "current weather",
            "stock price", "who won", "search for", "lookup", "find articles",
            "recent", "2025", "2026", "real-time"
        ]
        if any(trigger in msg_lower for trigger in search_triggers):
            tools_needed.append("web_search")

        # 2. Check for calculator requirement
        calc_triggers = [
            "calculate", "evaluate", "what is", "solve", "math", "+", "-", "*", "/", "%", "sqrt", "sin", "cos"
        ]
        # Check if contains arithmetic equations
        if re.search(r"\d+\s*[\+\-\*\/\^]\s*\d+", msg_lower) or any(trig in msg_lower for trig in ["calculate", "sqrt(", "log("]):
            tools_needed.append("calculator")

        # 3. Check for code execution requirement
        code_triggers = [
            "run this", "execute", "bash", "python code", "script", "terminal", "compile"
        ]
        if any(trig in msg_lower for trig in code_triggers) or "```" in message:
            tools_needed.append("code_execution")

        # 4. Check for file analysis
        if attachments and len(attachments) > 0:
            tools_needed.append("files")

        # Deduplicate
        tools_needed = list(dict.fromkeys(tools_needed))

        return {
            "intent": "informational" if "web_search" in tools_needed else "computation" if "calculator" in tools_needed else "code" if "code_execution" in tools_needed else "general_conversation",
            "tools_needed": tools_needed,
            "complexity": "multi_step" if len(tools_needed) > 1 else "single_step" if len(tools_needed) == 1 else "direct",
            "estimated_steps": max(1, len(tools_needed))
        }

intent_planner = IntentPlanner()
