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
vision_pipeline = AndromedaVisionPipeline()
long_term_memory = LongTermMemory(user_id="cloud_user")

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = "conv_default"
    model: Optional[str] = "andromeda-nano"
    temperature: Optional[float] = 0.7
    top_p: Optional[float] = 0.9
    max_tokens: Optional[int] = 512
    stream: Optional[bool] = True

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

@app.post("/v1/images/generate")
def generate_image(request: ImageGenRequest):
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
