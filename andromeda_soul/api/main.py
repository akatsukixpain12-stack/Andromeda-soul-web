"""
Andromeda Soul Dedicated FastAPI Server
Independent REST & Streaming API for Andromeda Models without external LLM wrappers.
"""

import os
import io
import time
import json
import base64
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel, Field

from ..core.inference.engine import AndromedaInferenceEngine
from ..memory.long_term import LongTermMemory
from ..tools.tool_router import ToolRouter
from ..image_generation.inference.generate import AndromedaVisionPipeline

app = FastAPI(
    title="Andromeda Soul API",
    description="Independent AI Platform Architecture & Inference Services. An intelligence with a soul.",
    version="1.0.0"
)

# Initialize Andromeda Core Engine & Vision Pipeline
engine = AndromedaInferenceEngine(model_name="andromeda-nano")
try:
    vision_pipeline = AndromedaVisionPipeline()
except RuntimeError:
    vision_pipeline = None
long_term_memory = LongTermMemory(user_id="cloud_user")

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = "conv_default"
    model: Optional[str] = "andromeda-nano"
    temperature: Optional[float] = 0.7
    top_p: Optional[float] = 0.9
    max_tokens: Optional[int] = 512
    stream: Optional[bool] = True

class OpenAIMessage(BaseModel):
    role: str
    content: str

class OpenAIChatRequest(BaseModel):
    model: str = "andromeda-nano"
    messages: List[OpenAIMessage] = Field(default_factory=list)
    temperature: float = 0.7
    max_tokens: int = 512
    stream: bool = False

class ImageGenRequest(BaseModel):
    prompt: str
    width: Optional[int] = 512
    height: Optional[int] = 512
    steps: Optional[int] = 20
    seed: Optional[int] = 42

@app.get("/v1/health")
def health_check():
    return {
        "status": "online",
        "system": "Andromeda Soul",
        "tagline": "An intelligence with a soul.",
        "model_architecture": engine.config.name,
        "parameters": engine.model.count_parameters(),
        "timestamp": time.time()
    }

@app.get("/v1/models")
def list_models():
    return {
        "data": [
            {"id": "andromeda-nano", "description": "Fast autoregressive Transformer for chat & reasoning"},
            {"id": "andromeda-small", "description": "512-dim Transformer model with GQA"},
            {"id": "andromeda-medium", "description": "1024-dim Transformer model with 16 heads"},
            {"id": "andromeda-vision", "description": "Native latent diffusion generative image model"},
        ]
    }

@app.post("/v1/chat")
async def chat_endpoint(request: ChatRequest):
    query = request.message
    
    # Tool call routing check
    if query.strip().startswith("calc:") or query.strip().startswith("math:"):
        expr = query.replace("calc:", "").replace("math:", "").strip()
        tool_res = ToolRouter.dispatch("calculator", {"expression": expr})
        answer = f"**Calculated Result:** {tool_res.get('result')}"
        return JSONResponse(content={"id": "msg_calc", "response": answer, "tool_used": "calculator"})

    if request.stream:
        async def event_generator():
            # Retrieve long term memory context
            memories = long_term_memory.retrieve_relevant(query, top_k=2)
            context_prompt = f"[User Memories: {', '.join(memories)}]\nUser: {query}\nAndromeda:"
            
            for token in engine.generate_stream(context_prompt, max_new_tokens=request.max_tokens, temperature=request.temperature):
                chunk_data = json.dumps({"token": token})
                yield f"data: {chunk_data}\n\n"
            yield "data: [DONE]\n\n"

        return StreamingResponse(event_generator(), media_type="text/event-stream")
    else:
        response_text = engine.generate(query, max_new_tokens=request.max_tokens, temperature=request.temperature)
        return {"response": response_text, "model": request.model}

@app.post("/v1/chat/completions")
async def openai_chat_endpoint(request: OpenAIChatRequest):
    """OpenAI-compatible endpoint for the web app and local SDK clients."""
    if not request.messages:
        raise HTTPException(status_code=400, detail="messages must contain at least one item")

    latest_user = next(
        (message.content for message in reversed(request.messages) if message.role == "user"),
        request.messages[-1].content,
    )
    history = request.messages[:-1]
    context = "\n".join(f"{message.role.title()}: {message.content}" for message in history[-10:])
    prompt = f"{context}\nUser: {latest_user}".strip()
    response_id = f"chatcmpl-{int(time.time() * 1000)}"

    if request.stream:
        async def event_generator():
            for token in engine.generate_stream(
                prompt,
                max_new_tokens=max(1, min(request.max_tokens, 4096)),
                temperature=request.temperature,
            ):
                chunk = {
                    "id": response_id,
                    "object": "chat.completion.chunk",
                    "choices": [{"index": 0, "delta": {"content": token}, "finish_reason": None}],
                }
                yield f"data: {json.dumps(chunk)}\n\n"
            yield "data: [DONE]\n\n"

        return StreamingResponse(event_generator(), media_type="text/event-stream")

    content = engine.generate(
        prompt,
        max_new_tokens=max(1, min(request.max_tokens, 4096)),
        temperature=request.temperature,
    )
    return {
        "id": response_id,
        "object": "chat.completion",
        "created": int(time.time()),
        "model": request.model,
        "choices": [{
            "index": 0,
            "message": {"role": "assistant", "content": content},
            "finish_reason": "stop",
        }],
    }

@app.post("/v1/images/generate")
def generate_image(request: ImageGenRequest):
    if vision_pipeline is None:
        raise HTTPException(status_code=503, detail="Image generation requires the optional torch dependency.")
    img = vision_pipeline.generate(
        prompt=request.prompt,
        width=request.width,
        height=request.height,
        steps=request.steps,
        seed=request.seed
    )
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_b64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
    
    return {
        "prompt": request.prompt,
        "width": request.width,
        "height": request.height,
        "seed": request.seed,
        "image_data_url": f"data:image/png;base64,{img_b64}"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
