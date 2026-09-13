"""
Andromeda Soul Pretraining Loop Engine
Supports mixed precision (AMP), gradient accumulation, gradient clipping, checkpointing, evaluation, and scheduler.
"""

import os
import time
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from typing import Optional, Dict, Any

class AndromedaTrainer:
    def __init__(
        self,
        model: nn.Module,
        train_dataloader: DataLoader,
        val_dataloader: Optional[DataLoader] = None,
        lr: float = 3e-4,
        gradient_accumulation_steps: int = 4,
        max_grad_norm: float = 1.0,
        checkpoint_dir: str = "andromeda-soul/checkpoints",
        device: str = "cuda" if torch.cuda.is_available() else "cpu",
    ):
        self.model = model.to(device)
        self.train_dataloader = train_dataloader
        self.val_dataloader = val_dataloader
        self.gradient_accumulation_steps = gradient_accumulation_steps
        self.max_grad_norm = max_grad_norm
        self.checkpoint_dir = checkpoint_dir
        self.device = device

        self.optimizer = torch.optim.AdamW(self.model.parameters(), lr=lr, weight_decay=0.1)
        self.scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(self.optimizer, T_max=10000)
        self.scaler = torch.cuda.amp.GradScaler(enabled=(device == "cuda"))

        os.makedirs(checkpoint_dir, exist_ok=True)

    def train_epoch(self, epoch: int) -> float:
        self.model.train()
        total_loss = 0.0
        self.optimizer.zero_grad()

        start_time = time.time()
        for step, batch in enumerate(self.train_dataloader):
            input_ids = batch["input_ids"].to(self.device)
            targets = batch["targets"].to(self.device)

            with torch.cuda.amp.autocast(enabled=(self.device == "cuda")):
                _, loss, _ = self.model(input_ids, targets=targets)
                loss = loss / self.gradient_accumulation_steps

            self.scaler.scale(loss).backward()
            total_loss += loss.item() * self.gradient_accumulation_steps

            if (step + 1) % self.gradient_accumulation_steps == 0:
                self.scaler.unscale_(self.optimizer)
                torch.nn.utils.clip_grad_norm_(self.model.parameters(), self.max_grad_norm)
                self.scaler.step(self.optimizer)
                self.scaler.update()
                self.optimizer.zero_grad()
                self.scheduler.step()

            if step % 10 == 0:
                avg_loss = total_loss / (step + 1)
                print(f"[Epoch {epoch} | Step {step}/{len(self.train_dataloader)}] Train Loss: {avg_loss:.4f}")

        self.save_checkpoint(f"checkpoint_epoch_{epoch}.pt")
        return total_loss / len(self.train_dataloader)

    def save_checkpoint(self, filename: str):
        path = os.path.join(self.checkpoint_dir, filename)
        torch.save(self.model.state_dict(), path)
        print(f"[Trainer] Checkpoint saved successfully -> {path}")
