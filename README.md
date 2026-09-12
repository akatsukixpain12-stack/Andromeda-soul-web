# ANDROMEDA — LOCAL AI OPERATING SYSTEM

> **"One Soul. Hundreds of Minds."**

Andromeda is an advanced local-first AI operating environment designed for Windows and Linux workstations. It orchestrates **100+ AI models & providers** (Ollama, llama.cpp, LM Studio, GGUF, Google Gemini, OpenRouter, Anthropic, OpenAI) with a sovereign native intelligence layer called **Andromeda Soul 1**.

---

## Architecture Overview

```
USER
  ↓
ANDROMEDA SOUL 1 (Native Intelligence)
  ↓
TASK PLANNER & DECOMPOSITION
  ↓
MODEL ROUTER (Auto / Local / Cloud / Hybrid / Power / Private)
  ↓
LOCAL / CLOUD MODELS (100+ Catalog)
  ↓
MODULAR TOOLS / AGENTS (Sandboxed File System, Terminal, Math, Web, Python/VM)
  ↓
MULTI-MODEL COUNCIL VERIFICATION
  ↓
SOUL 1 SYNTHESIS
  ↓
STREAMING RESPONSE
```

---

## Key Features

1. **Andromeda Soul 1**: Native built-in orchestrator that analyzes user intent, determines if tools are required, chooses the optimal model, and coordinates multi-model synthesis.
2. **100+ Model Catalog**: Comprehensive metadata for local GGUF, Ollama models (Llama 3.3 70B, DeepSeek R1 1.5B–70B, Qwen 2.5 Coder, Phi-4, Mistral Nemo, Gemma 2), LM Studio, and cloud engines.
3. **Hardware Detection & Profiling**: Automatically detects CPU cores, system RAM, VRAM capacity, and recommends matching local model quantization.
4. **Multi-Model Council**: Run Model A (Researcher) + Model B (Reasoner) + Model C (Critic) simultaneously on complex queries and synthesize a unified conclusion.
5. **Autonomous Agents**: Custom agent studio with pre-built agents:
   - Deep Research Agent
   - Autonomous Coding Architect
   - Quantitative Analyst
   - System Operator
   - Andromeda Soul 1
6. **Sandboxed Modular Tools**:
   - Precise Math / Formula Evaluator
   - Workspace File Explorer & File Writer
   - Controlled Terminal Execution with destructive command confirmation
   - Live Web Search & Page Scraper
   - JavaScript/Node VM Execution Sandbox
   - Document & Table Parser
7. **Offline-First & Privacy Modes**:
   - 🟢 `LOCAL`: Exclusively runs local daemons or native offline brain.
   - 🔵 `CLOUD`: Utilizes configured high-context cloud providers.
   - 🟡 `HYBRID`: Best-of-both-worlds automatic routing.
   - 🔴 `OFFLINE`: Works with zero internet connection.
8. **Real Model Benchmarking**: Measures real latency (ms), tokens/second, memory consumption, and reasoning accuracy.
9. **Layered Memory Vault**: Inspect and manage short-term context, project memory, long-term preferences, and semantic records.
10. **Command Palette (`Ctrl+K` / `Cmd+K`)**: Quick actions for model switching, agent switching, diagnostics, benchmarks, and workflows.

---

## Quick Start

### Windows
Double-click `start-andromeda.bat` or run:
```bat
npm run dev
```

### Linux / macOS
Make executable and run `start-andromeda.sh`:
```bash
chmod +x start-andromeda.sh
./start-andromeda.sh
```

Open your browser at **http://localhost:3000**.

---

## Local AI Engines Setup

### 1. Ollama
Install from [ollama.com](https://ollama.com). Start Ollama:
```bash
ollama serve
```
Pull recommended models:
```bash
ollama run llama3.2:3b          # Fast edge model (3GB RAM)
ollama run deepseek-r1:7b       # Reasoning model (8GB RAM)
ollama run qwen2.5-coder:7b     # High performance coding
```
Andromeda will automatically detect Ollama at `http://127.0.0.1:11434`.

### 2. LM Studio
Install from [lmstudio.ai](https://lmstudio.ai). In LM Studio, go to the **Local Server** tab and click **Start Server** on port `1234`.

---

## Keyboard Shortcuts
- `Ctrl + K` / `Cmd + K`: Open Andromeda Command Palette
- `Enter`: Send prompt
- `Shift + Enter`: Multi-line prompt
- `Esc`: Close modals and drawers
