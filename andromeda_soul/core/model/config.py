"""
Andromeda Soul Model Configurations
Defines model variants: Nano, Small, Medium, Large
"""

from dataclasses import dataclass, field
from typing import Optional, List

@dataclass
class ModelConfig:
    name: str = "andromeda-nano"
    vocab_size: int = 32000
    hidden_dim: int = 512
    num_layers: int = 8
    num_heads: int = 8
    num_kv_heads: Optional[int] = 4  # Grouped Query Attention (GQA)
    intermediate_dim: int = 1536
    max_seq_len: int = 4096
    dropout: float = 0.0
    bias: bool = False
    norm_eps: float = 1e-6
    rope_theta: float = 10000.0
    use_flash_attn: bool = False
    initializer_range: float = 0.02
    bos_token_id: int = 1
    eos_token_id: int = 2
    pad_token_id: int = 0

# Predefined Model Size Presets
CONFIG_PRESETS = {
    "andromeda-nano": ModelConfig(
        name="andromeda-nano",
        vocab_size=32000,
        hidden_dim=256,
        num_layers=6,
        num_heads=4,
        num_kv_heads=2,
        intermediate_dim=768,
        max_seq_len=2048,
    ),
    "andromeda-small": ModelConfig(
        name="andromeda-small",
        vocab_size=32000,
        hidden_dim=512,
        num_layers=12,
        num_heads=8,
        num_kv_heads=4,
        intermediate_dim=1536,
        max_seq_len=4096,
    ),
    "andromeda-medium": ModelConfig(
        name="andromeda-medium",
        vocab_size=32000,
        hidden_dim=1024,
        num_layers=16,
        num_heads=16,
        num_kv_heads=4,
        intermediate_dim=3072,
        max_seq_len=8192,
    ),
    "andromeda-large": ModelConfig(
        name="andromeda-large",
        vocab_size=32000,
        hidden_dim=2048,
        num_layers=24,
        num_heads=32,
        num_kv_heads=8,
        intermediate_dim=6144,
        max_seq_len=16384,
    ),
}

def get_config(name: str = "andromeda-nano") -> ModelConfig:
    return CONFIG_PRESETS.get(name, CONFIG_PRESETS["andromeda-nano"])
