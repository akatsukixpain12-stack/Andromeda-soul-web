from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Any
from andromeda.backend.orchestrator import orchestrator_engine
from andromeda.backend.tools.web import search_web
from andromeda.backend.tools.calculator import calculate
from andromeda.backend.tools.code import execute_code
from andromeda.backend.memory import memory_manager

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "default_session"
    model_id: Optional[str] = "gemini-2.5-flash"
    attachments: Optional[List[Any]] = []
    api_key: Optional[str] = None

class CodeExecRequest(BaseModel):
    code: str
    language: Optional[str] = "python"
    timeout: Optional[int] = 10

class CalcRequest(BaseModel):
    expression: str

class SearchRequest(BaseModel):
    query: str
    max_results: Optional[int] = 5

@router.post("/chat")
async def chat_endpoint(payload: ChatRequest):
    """
    Main Andromeda Orchestrator gateway:
    1. Understand request -> 2. Context -> 3. Tools -> 4. Model Input -> 5. LLM -> 6. Safety -> 7. Response
    """
    try:
        result = await orchestrator_engine.process_pipeline(
            user_message=payload.message,
            session_id=payload.session_id,
            model_id=payload.model_id,
            attachments=payload.attachments,
            custom_key=payload.api_key
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tools/web")
def web_tool_endpoint(payload: SearchRequest):
    return search_web(payload.query, payload.max_results)

@router.post("/tools/calculator")
def calc_tool_endpoint(payload: CalcRequest):
    return calculate(payload.expression)

@router.post("/tools/code")
def code_tool_endpoint(payload: CodeExecRequest):
    return execute_code(payload.code, payload.language, payload.timeout)

@router.get("/memory/{session_id}")
def get_session_memory(session_id: str):
    return {"session_id": session_id, "messages": memory_manager.get_context(session_id)}
