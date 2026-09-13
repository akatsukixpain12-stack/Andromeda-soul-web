import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from andromeda.api.routes import router as api_router
from andromeda.config.settings import settings

app = FastAPI(
    title="Andromeda AI Sovereign Orchestrator Backend",
    description="Full Python pipeline implementing Intent Planning, Context Memory, Tool Execution, and Multi-Provider LLMs.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

@app.get("/")
def root():
    return {
        "engine": "Andromeda Sovereign AI",
        "status": "online",
        "version": "2.0.0",
        "pipeline": [
            "1. Understand Request",
            "2. Load Context",
            "3. Tool Selection (Web, Calculator, Code, Files)",
            "4. Build Model Input",
            "5. LLM Synthesis",
            "6. Safety Sanitization",
            "7. Response Formatter"
        ]
    }

if __name__ == "__main__":
    uvicorn.run("andromeda.backend.main:app", host="0.0.0.0", port=8000, reload=True)
