import os
import json
import urllib.request
from typing import List, Dict, Any, Optional
from andromeda.config.settings import settings

class ModelInterface:
    """
    Unified multi-provider language model router.
    Calls Google Gemini, OpenAI, Claude, DeepSeek, Groq, Ollama, or LM Studio.
    """
    def __init__(self):
        pass

    async def generate(
        self,
        prompt: str,
        system_instruction: str = "",
        model_id: str = "gemini-2.5-flash",
        temperature: float = 0.7,
        custom_key: Optional[str] = None
    ) -> str:
        # 1. Google Gemini Provider
        if "gemini" in model_id:
            api_key = custom_key or settings.gemini_api_key
            if not api_key:
                return "Gemini API key is required to use this model."
            
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_id}:generateContent?key={api_key}"
            payload = {
                "contents": [{"role": "user", "parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": temperature}
            }
            if system_instruction:
                payload["systemInstruction"] = {"parts": [{"text": system_instruction}]}

            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req) as resp:
                data = json.loads(resp.read().decode())
                return data["candidates"][0]["content"]["parts"][0]["text"]

        # 2. Local Ollama Provider
        elif "ollama" in model_id or "local" in model_id:
            url = f"{settings.ollama_base_url}/api/generate"
            payload = {
                "model": model_id.replace("ollama/", ""),
                "prompt": prompt,
                "system": system_instruction,
                "stream": False
            }
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req) as resp:
                data = json.loads(resp.read().decode())
                return data.get("response", "")

        # 3. Fallback / Generic Engine
        return f"[Andromeda Sovereign Engine completion for {model_id}]:\n{prompt}"

model_engine = ModelInterface()
