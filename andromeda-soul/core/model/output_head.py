"""
Andromeda Soul Language Model Output Head & LM Loss
"""

import torch
import torch.nn as nn
from typing import Optional

class LanguageModelHead(nn.Module):
    def __init__(self, hidden_dim: int, vocab_size: int, bias: bool = False):
        super().__init__()
        self.output_projection = nn.Linear(hidden_dim, vocab_size, bias=bias)

    def forward(self, x: torch.Tensor, targets: Optional[torch.Tensor] = None):
        logits = self.output_projection(x)
        loss = None
        if targets is not None:
            # Shift for autoregressive target loss computation
            shift_logits = logits[..., :-1, :].contiguous().view(-1, logits.size(-1))
            shift_targets = targets[..., 1:].contiguous().view(-1)
            loss = nn.functional.cross_entropy(shift_logits, shift_targets, ignore_index=-100)
        return logits, loss
