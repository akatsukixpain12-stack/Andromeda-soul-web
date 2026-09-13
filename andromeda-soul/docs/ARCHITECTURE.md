# Andromeda Soul Architecture Specification

## Overview

Andromeda Soul is built as an independent, scalable neural system:

```
USER
 ↓
Andromeda API Gateway
 ↓
Conversation Manager
 ↓
Andromeda Core Model (Transformer + RoPE + GQA + SwiGLU)
 ↓
Context / Multi-Layer Memory
 ↓
Tool Router (Calculator, Code Sandbox, File Analyzer)
 ↓
Response Generator / Token Streamer
 ↓
USER
```

## Subsystems

1. **Andromeda Nano**: 256 hidden dim, 6 layers, 4 heads (GQA with 2 KV heads), 2048 max seq len.
2. **Andromeda Small**: 512 hidden dim, 12 layers, 8 heads, 4096 max seq len.
3. **Andromeda Medium**: 1024 hidden dim, 16 layers, 16 heads, 8192 max seq len.
4. **Andromeda Vision**: Generative latent diffusion model for text-to-image synthesis.
