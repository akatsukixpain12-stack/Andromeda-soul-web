"""
Andromeda Soul Custom BPE / WordPiece Tokenizer Implementation
"""

import json
import os
import re
from typing import List, Dict, Union, Optional

class AndromedaTokenizer:
    def __init__(self, vocab_path: Optional[str] = None):
        self.pad_token = "<pad>"
        self.bos_token = "<bos>"
        self.eos_token = "<eos>"
        self.unk_token = "<unk>"
        
        self.pad_id = 0
        self.bos_id = 1
        self.eos_id = 2
        self.unk_id = 3

        self.special_tokens = {
            self.pad_token: self.pad_id,
            self.bos_token: self.bos_id,
            self.eos_token: self.eos_id,
            self.unk_token: self.unk_id,
            "<tool_call>": 4,
            "</tool_call>": 5,
            "<thought>": 6,
            "</thought>": 7,
        }

        self.vocab: Dict[str, int] = dict(self.special_tokens)
        self.id_to_token: Dict[int, str] = {v: k for k, v in self.vocab.items()}
        
        # Default fallback character-byte vocabulary initialization
        curr_id = len(self.vocab)
        for i in range(256):
            char = chr(i) if 32 <= i < 127 else f"<byte_{i}>"
            if char not in self.vocab:
                self.vocab[char] = curr_id
                self.id_to_token[curr_id] = char
                curr_id += 1

        if vocab_path and os.path.exists(vocab_path):
            self.load_vocab(vocab_path)

    def load_vocab(self, vocab_path: str):
        with open(vocab_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            self.vocab = data.get("vocab", self.vocab)
            self.id_to_token = {int(v): k for k, v in data.get("id_to_token", {}).items()}

    def save_vocab(self, vocab_path: str):
        os.makedirs(os.path.dirname(vocab_path), exist_ok=True)
        with open(vocab_path, "w", encoding="utf-8") as f:
            json.dump({
                "vocab": self.vocab,
                "id_to_token": self.id_to_token,
            }, f, indent=2, ensure_ascii=False)

    def encode(self, text: str, add_special_tokens: bool = True) -> List[int]:
        tokens: List[int] = []
        if add_special_tokens:
            tokens.append(self.bos_id)

        # Basic word and symbol splitting
        words = re.findall(r'\s+|\w+|[^\w\s]', text, re.UNICODE)
        for word in words:
            if word in self.vocab:
                tokens.append(self.vocab[word])
            else:
                for char in word:
                    tokens.append(self.vocab.get(char, self.unk_id))

        if add_special_tokens:
            tokens.append(self.eos_id)
        return tokens

    def decode(self, token_ids: List[int], skip_special_tokens: bool = True) -> str:
        tokens = []
        for tid in token_ids:
            if skip_special_tokens and tid in [self.pad_id, self.bos_id, self.eos_id]:
                continue
            token_str = self.id_to_token.get(tid, self.unk_token)
            tokens.append(token_str)
        return "".join(tokens)

    def batch_encode(self, texts: List[str], max_length: Optional[int] = None) -> List[List[int]]:
        encoded_batch = [self.encode(t) for t in texts]
        if max_length is not None:
            padded_batch = []
            for enc in encoded_batch:
                if len(enc) > max_length:
                    padded = enc[:max_length]
                else:
                    padded = enc + [self.pad_id] * (max_length - len(enc))
                padded_batch.append(padded)
            return padded_batch
        return encoded_batch
