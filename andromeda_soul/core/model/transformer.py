"""
Andromeda Soul SwiGLU Feed-Forward Network & Transformer Block Architecture
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Optional, Tuple
from .config import ModelConfig
from .normalization import RMSNorm
from .attention import GroupedQueryAttention
from .embeddings import TokenEmbedding, RotaryEmbedding

class SwiGLUFeedForward(nn.Module):
    """SwiGLU Feed-Forward Network as used in modern frontier architectures"""
    def __init__(self, hidden_dim: int, intermediate_dim: int, bias: bool = False):
        super().__init__()
        self.w1 = nn.Linear(hidden_dim, intermediate_dim, bias=bias)
        self.w2 = nn.Linear(intermediate_dim, hidden_dim, bias=bias)
        self.w3 = nn.Linear(hidden_dim, intermediate_dim, bias=bias)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # SwiGLU activation: (Swish(w1(x)) * w3(x)) -> w2
        return self.w2(F.silu(self.w1(x)) * self.w3(x))


class TransformerBlock(nn.Module):
    def __init__(self, config: ModelConfig):
        super().__init__()
        self.attn_norm = RMSNorm(config.hidden_dim, eps=config.norm_eps)
        self.attention = GroupedQueryAttention(
            hidden_dim=config.hidden_dim,
            num_heads=config.num_heads,
            num_kv_heads=config.num_kv_heads,
            dropout=config.dropout,
            bias=config.bias,
        )
        self.ffn_norm = RMSNorm(config.hidden_dim, eps=config.norm_eps)
        self.feed_forward = SwiGLUFeedForward(
            hidden_dim=config.hidden_dim,
            intermediate_dim=config.intermediate_dim,
            bias=config.bias,
        )

    def forward(
        self,
        x: torch.Tensor,
        cos: torch.Tensor,
        sin: torch.Tensor,
        kv_cache: Optional[Tuple[torch.Tensor, torch.Tensor]] = None,
        mask: Optional[torch.Tensor] = None,
    ) -> Tuple[torch.Tensor, Optional[Tuple[torch.Tensor, torch.Tensor]]]:
        norm_x = self.attn_norm(x)
        attn_out, new_kv_cache = self.attention(norm_x, cos, sin, kv_cache=kv_cache, mask=mask)
        x = x + attn_out

        ffn_out = self.feed_forward(self.ffn_norm(x))
        x = x + ffn_out
        return x, new_kv_cache
