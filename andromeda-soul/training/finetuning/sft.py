"""
Supervised Fine-Tuning (SFT) for Andromeda Soul Instruction Tuning
"""

import torch
from torch.utils.data import Dataset
from typing import List, Dict, Any

class SFTDataset(Dataset):
    def __init__(self, conversations: List[Dict[str, str]], tokenizer, max_seq_len: int = 1024):
        self.tokenizer = tokenizer
        self.max_seq_len = max_seq_len
        self.samples = []

        for conv in conversations:
            text = f"<user>\n{conv['user']}\n</user>\n<assistant>\n{conv['assistant']}\n</assistant>"
            tokens = self.tokenizer.encode(text, add_special_tokens=True)
            if len(tokens) <= max_seq_len:
                self.samples.append(tokens)

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> Dict[str, torch.Tensor]:
        tokens = self.samples[idx]
        padding_len = self.max_seq_len - len(tokens)
        input_ids = torch.tensor(tokens + [self.tokenizer.pad_id] * padding_len, dtype=torch.long)
        targets = input_ids.clone()
        targets[targets == self.tokenizer.pad_id] = -100
        return {"input_ids": input_ids, "targets": targets}
