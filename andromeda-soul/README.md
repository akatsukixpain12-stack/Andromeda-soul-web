# ANDROMEDA SOUL

> **"An intelligence with a soul."**

Andromeda Soul is an independent, native AI model framework and architecture built from the ground up without relying on external third-party hosted LLM wrapper APIs.

## Key Features

- **Native Autoregressive Language Model**: Standard PyTorch Transformer with Rotary Positional Embeddings (RoPE), SwiGLU activation, and Grouped Query Attention (GQA).
- **Custom Tokenizer**: Native BPE & WordPiece vocabulary pipeline with special token handling.
- **Dedicated Inference Engine**: High-performance KV Caching, temperature/top-p/top-k sampling, and token streaming.
- **Multi-Layer Memory System**: Short-term active context buffer combined with persistent vector similarity storage.
- **Independent Tool System**: Calculator, code sandbox execution, file analyzer, and tool routing engine.
- **Andromeda Vision**: Independent generative diffusion image synthesis model architecture.
- **Google Cloud Compute Infrastructure**: Utilizes Google Cloud for raw compute, persistence, and hosting.

## Project Structure

```
andromeda-soul/
├── core/
│   ├── model/           # Transformer architecture, RoPE, RMSNorm, Attention, LM Head
│   ├── tokenizer/       # BPE Tokenizer, Vocabulary generation
│   ├── inference/       # Inference engine, KV Cache, Sampler, Streaming
│   └── context/         # Context manager & Window assembly
├── training/
│   ├── pretraining/     # Pretraining dataset, DataLoader & AMP Trainer
│   ├── finetuning/      # SFT and DPO Preference Optimization
│   └── configs/         # Training hyperparameters
├── data/                # Data cleaning, deduplication (MinHash), and quality filtering
├── memory/              # Short-term, Long-term, and Vector Store
├── tools/               # Calculator, Code execution sandbox, Tool router
├── vision/              # Multimodal vision encoders
├── image_generation/    # Andromeda Vision diffusion UNet, prompt encoder & sampler
├── api/                 # FastAPI server (/v1/chat, /v1/images/generate, /v1/health)
├── evaluation/          # Reasoning, Coding, Math, and Benchmark framework
└── docs/                # Architecture & System documentation
```

## Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run API Server
```bash
python -m andromeda-soul.api.main
```

### 3. Run Pretraining Test
```bash
python -m andromeda-soul.training.pretraining.train
```
