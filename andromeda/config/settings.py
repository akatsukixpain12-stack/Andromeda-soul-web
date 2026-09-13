import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    app_name: str = "Andromeda Sovereign AI Engine"
    environment: str = os.getenv("ENVIRONMENT", "development")
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    anthropic_api_key: str = os.getenv("ANTHROPIC_API_KEY", "")
    deepseek_api_key: str = os.getenv("DEEPSEEK_API_KEY", "")
    groq_api_key: str = os.getenv("GROQ_API_KEY", "")
    openrouter_api_key: str = os.getenv("OPENROUTER_API_KEY", "")
    mistral_api_key: str = os.getenv("MISTRAL_API_KEY", "")
    
    # Local engine endpoints
    ollama_base_url: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    lmstudio_base_url: str = os.getenv("LMSTUDIO_BASE_URL", "http://localhost:1234/v1")
    
    # Default model parameters
    default_model: str = "gemini-2.5-flash"
    default_temperature: float = 0.7
    max_tokens: int = 4096
    
    # Orchestrator parameters
    max_tool_iterations: int = 5
    memory_window_size: int = 20

settings = Settings()
