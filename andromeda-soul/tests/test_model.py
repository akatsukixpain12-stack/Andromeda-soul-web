"""
Andromeda Core Architecture Unit Tests
"""

import torch
from andromeda_soul.core.model.config import get_config
from andromeda_soul.core.model.architecture import AndromedaModel

def test_model_forward():
    config = get_config("andromeda-nano")
    model = AndromedaModel(config)
    
    dummy_input = torch.tensor([[1, 4, 15, 8, 2]], dtype=torch.long)
    logits, loss, _ = model(dummy_input)
    
    assert logits.shape == (1, 5, config.vocab_size)
    print(f"[TEST PASSED] Model Forward Pass OK - Params: {model.count_parameters():,}")

if __name__ == "__main__":
    test_model_forward()
