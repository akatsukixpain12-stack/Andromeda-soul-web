"""
Andromeda Pretraining Dataset & Tokenized Data Sharding
"""

import torch
from torch.utils.data import Dataset
from typing import List, Dict, Any

class PretrainingDataset(Dataset):
    def __init__(self, data_samples: List[str], tokenizer, max_seq_len: int = 2048):
        self.tokenizer = tokenizer
        self.max_seq_len = max_seq_len
        self.samples = []

        for text in data_samples:
            encoded = self.tokenizer.encode(text, add_special_tokens=True)
            for i in range(0, len(encoded), max_seq_len):
                chunk = encoded[i : i + max_seq_len]
                if len(chunk) > 8:  # Min length requirement
                    self.samples.append(chunk)

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> Dict[str, torch.Tensor]:
        tokens = self.samples[idx]
        if len(tokens) < self.max_seq_len:
            tokens = tokens + [self.tokenizer.pad_id] * (self.max_seq_len - len(tokens))

        input_ids = torch.tensor(tokens[:-1], dtype=torch.long)
        targets = torch.tensor(tokens[1:], dtype=torch.long)
        targets[targets == self.tokenizer.pad_id] = -100

        return {"input_ids": input_ids, "targets": targets}
