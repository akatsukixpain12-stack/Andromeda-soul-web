from typing import List, Dict, Any, Optional
import json
from andromeda.backend.planner import intent_planner
from andromeda.backend.memory import memory_manager
from andromeda.backend.safety import safety_engine
from andromeda.backend.model import model_engine
from andromeda.backend.tools.web import search_web
from andromeda.backend.tools.calculator import calculate
from andromeda.backend.tools.code import execute_code

class AndromedaOrchestrator:
    """
    Core Multi-Step Intelligent Orchestration Pipeline:
    1. Understand request (Intent extraction)
    2. Load conversation context (Working memory)
    3. Decide & execute required tools (Web, Calculator, Code, Files)
    4. Build model input (Prompt synthesis)
    5. Call Language Model (Gemini, Claude, Ollama, etc.)
    6. Safety validation & sanitization
    7. Response formatting (Markdown, citations, cards)
    """

    async def process_pipeline(
        self,
        user_message: str,
        session_id: str = "default_session",
        model_id: str = "gemini-2.5-flash",
        attachments: Optional[List[Any]] = None,
        custom_key: Optional[str] = None
    ) -> Dict[str, Any]:
        
        # --- 1. Understand Request & Safety Check ---
        safety_input = safety_engine.validate_input(user_message)
        if not safety_input["safe"]:
            return {
                "success": False,
                "error": safety_input["reason"],
                "content": "Request blocked by Andromeda Safety Sandbox.",
                "tools_used": []
            }

        plan = intent_planner.analyze_request(user_message, attachments)
        
        # --- 2. Load Conversation Context ---
        context_history = memory_manager.get_context(session_id)
        
        # --- 3. Decide and Execute Required Tools ---
        tool_results = []
        for tool_name in plan["tools_needed"]:
            if tool_name == "web_search":
                search_res = search_web(user_message)
                tool_results.append({
                    "tool": "web_search",
                    "title": f"Web Search Grounding for '{user_message[:35]}...'",
                    "output": json.dumps(search_res["results"][:3], indent=2),
                    "success": search_res.get("success", True)
                })

            elif tool_name == "calculator":
                calc_res = calculate(user_message)
                if calc_res["success"]:
                    tool_results.append({
                        "tool": "calculator",
                        "title": "Deterministic Math Engine",
                        "output": calc_res["formatted"],
                        "success": True
                    })

            elif tool_name == "code_execution":
                # Check for code snippet in message
                exec_res = execute_code(user_message, language="bash")
                tool_results.append({
                    "tool": "code_execution",
                    "title": "Terminal Shell Runner",
                    "output": exec_res.get("stdout") or exec_res.get("error") or "(executed)",
                    "success": exec_res.get("success", True)
                })

        # --- 4. Build Model Input ---
        augmented_prompt_parts = []
        if tool_results:
            augmented_prompt_parts.append("### Grounding Context & Tool Outputs:")
            for res in tool_results:
                augmented_prompt_parts.append(f"**[{res['title']}]:**\n```\n{res['output']}\n```")
            augmented_prompt_parts.append("---")
        
        augmented_prompt_parts.append(f"User Query:\n{user_message}")
        augmented_prompt = "\n\n".join(augmented_prompt_parts)

        # --- 5. Call Language Model ---
        raw_completion = await model_engine.generate(
            prompt=augmented_prompt,
            system_instruction="You are Andromeda, an uncapped frontier AI sovereign orchestrator. Synthesize facts cleanly with rich markdown and citations.",
            model_id=model_id,
            custom_key=custom_key
        )

        # --- 6. Safety & Validation ---
        safety_output = safety_engine.validate_output(raw_completion)
        sanitized_content = safety_output["text"]

        # --- 7. Response Formatter & Memory Update ---
        memory_manager.append_message(session_id, "user", user_message)
        memory_manager.append_message(session_id, "assistant", sanitized_content, tool_calls=tool_results)

        return {
            "success": True,
            "content": sanitized_content,
            "tools_used": tool_results,
            "plan": plan,
            "session_id": session_id,
            "model_id": model_id
        }

orchestrator_engine = AndromedaOrchestrator()
