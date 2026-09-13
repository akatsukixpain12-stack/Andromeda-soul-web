"""
KV Cache Management for Andromeda Inference Engine
"""

import torch
from typing import List, Tuple, Optional

class KVCacheManager:
    def __init__(self, num_layers: int, batch_size: int, max_seq_len: int, num_kv_heads: int, head_dim: int, device: str = "cpu"):
        self.num_layers = num_layers
        self.caches: List[Optional[Tuple[torch.Tensor, torch.Tensor]]] = [None] * num_layers

    def reset(self):
        self.caches = [None] * self.num_layers

    def update(self, layer_idx: int, k: torch.Tensor, v: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        if self.caches[layer_idx] is None:
            self.caches[layer_idx] = (k, v)
        else:
            prev_k, prev_v = self.caches[layer_idx]
            self.caches[layer_idx] = (torch.cat([prev_k, k], dim=2), torch.cat([prev_v, v], dim=2))
        return self.caches[layer_idx]
