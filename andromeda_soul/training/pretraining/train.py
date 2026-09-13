"""
Andromeda Soul Pretraining Execution Script
"""

import os
from torch.utils.data import DataLoader
from ...core.model.config import get_config
from ...core.model.architecture import AndromedaModel
from ...core.tokenizer.tokenizer import AndromedaTokenizer
from .dataset import PretrainingDataset
from .trainer import AndromedaTrainer

def run_pretraining():
    print("[Andromeda Pretraining] Starting native model pretraining initialization...")
    config = get_config("andromeda-nano")
    model = AndromedaModel(config)
    tokenizer = AndromedaTokenizer()

    sample_corpus = [
        "Andromeda Soul is an independent AI platform built on native PyTorch transformer architecture.",
        "The model uses Rotary Positional Embeddings, SwiGLU activation, and Grouped Query Attention for high performance.",
        "Training pipeline cleans, tokenizes, sharded, and optimizes weights on Google Cloud infrastructure.",
        "Andromeda Vision handles generative diffusion and image synthesis natively."
    ] * 50

    dataset = PretrainingDataset(sample_corpus, tokenizer, max_seq_len=128)
    dataloader = DataLoader(dataset, batch_size=2, shuffle=True)

    trainer = AndromedaTrainer(model=model, train_dataloader=dataloader, lr=1e-3)
    loss = trainer.train_epoch(epoch=1)
    print(f"[Andromeda Pretraining] Pretraining completed. Final Epoch Loss: {loss:.4f}")

if __name__ == "__main__":
    run_pretraining()
