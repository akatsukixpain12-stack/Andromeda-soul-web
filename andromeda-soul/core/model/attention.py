"""
Grouped Query Attention (GQA) with KV Cache for Andromeda Soul
"""

import math
import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Optional, Tuple
from .embeddings import apply_rotary_pos_emb

class GroupedQueryAttention(nn.Module):
    def __init__(
        self,
        hidden_dim: int,
        num_heads: int,
        num_kv_heads: Optional[int] = None,
        dropout: float = 0.0,
        bias: bool = False,
    ):
        super().__init__()
        self.hidden_dim = hidden_dim
        self.num_heads = num_heads
        self.num_kv_heads = num_kv_heads if num_kv_heads is not None else num_heads
        self.num_kv_groups = self.num_heads // self.num_kv_heads
        self.head_dim = hidden_dim // num_heads
        self.dropout = dropout

        self.q_proj = nn.Linear(hidden_dim, self.num_heads * self.head_dim, bias=bias)
        self.k_proj = nn.Linear(hidden_dim, self.num_kv_heads * self.head_dim, bias=bias)
        self.v_proj = nn.Linear(hidden_dim, self.num_kv_heads * self.head_dim, bias=bias)
        self.out_proj = nn.Linear(self.num_heads * self.head_dim, hidden_dim, bias=bias)

    def forward(
        self,
        x: torch.Tensor,
        cos: torch.Tensor,
        sin: torch.Tensor,
        kv_cache: Optional[Tuple[torch.Tensor, torch.Tensor]] = None,
        mask: Optional[torch.Tensor] = None,
    ) -> Tuple[torch.Tensor, Optional[Tuple[torch.Tensor, torch.Tensor]]]:
        batch_size, seq_len, _ = x.shape

        q = self.q_proj(x).view(batch_size, seq_len, self.num_heads, self.head_dim).transpose(1, 2)
        k = self.k_proj(x).view(batch_size, seq_len, self.num_kv_heads, self.head_dim).transpose(1, 2)
        v = self.v_proj(x).view(batch_size, seq_len, self.num_kv_heads, self.head_dim).transpose(1, 2)

        # Apply Rotary Positional Embeddings (RoPE)
        q, k = apply_rotary_pos_emb(q, k, cos, sin)

        # Handle KV cache for sequential inference
        if kv_cache is not None:
            prev_k, prev_v = kv_cache
            k = torch.cat([prev_k, k], dim=2)
            v = torch.cat([prev_v, v], dim=2)

        new_kv_cache = (k, v)
        total_seq_len = k.shape[2]

        # Expand Key and Value heads for Grouped Query Attention (GQA)
        if self.num_kv_groups > 1:
            k = k.repeat_interleave(self.num_kv_groups, dim=1)
            v = v.repeat_interleave(self.num_kv_groups, dim=1)

        # Scaled dot-product attention computation
        scores = torch.matmul(q, k.transpose(-2, -1)) / math.sqrt(self.head_dim)

        if mask is not None:
            scores = scores + mask

        attn_weights = F.softmax(scores, dim=-1)
        if self.dropout > 0.0 and self.training:
            attn_weights = F.dropout(attn_weights, p=self.dropout)

        output = torch.matmul(attn_weights, v)
        output = output.transpose(1, 2).contiguous().view(batch_size, seq_len, self.hidden_dim)

        return self.out_proj(output), new_kv_cache
