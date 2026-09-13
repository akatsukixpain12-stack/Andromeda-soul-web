# Andromeda Training Pipeline

## Data Pipeline
Raw Data -> Clean -> Normalize -> Quality Filter -> MinHash Deduplication -> Tokenize -> Shard -> Train -> Checkpoint -> Evaluate

## Features
- Mixed Precision Training (`torch.cuda.amp`)
- Cosine Annealing Learning Rate Scheduler
- Gradient Accumulation & Clipping (`max_norm=1.0`)
- Checkpoint Save & Resume capabilities
- Supervised Fine-Tuning (SFT) & Direct Preference Optimization (DPO)
