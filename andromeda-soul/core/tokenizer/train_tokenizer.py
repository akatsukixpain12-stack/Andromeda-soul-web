"""
Andromeda Tokenizer Training Script
"""

import os
import json
from collections import Counter
from .tokenizer import AndromedaTokenizer

def train_bpe_tokenizer(
    data_corpus: list,
    vocab_size: int = 32000,
    output_path: str = "andromeda-soul/core/tokenizer/vocabulary/vocab.json"
) -> AndromedaTokenizer:
    tokenizer = AndromedaTokenizer()
    word_freqs = Counter()

    for text in data_corpus:
        words = text.split()
        for w in words:
            word_freqs[w] += 1

    curr_id = len(tokenizer.vocab)
    most_common = word_freqs.most_common(vocab_size - curr_id)
    
    for word, _ in most_common:
        if word not in tokenizer.vocab:
            tokenizer.vocab[word] = curr_id
            tokenizer.id_to_token[curr_id] = word
            curr_id += 1

    tokenizer.save_vocab(output_path)
    print(f"[Andromeda Tokenizer] Successfully trained tokenizer with {len(tokenizer.vocab)} tokens -> Saved to {output_path}")
    return tokenizer

if __name__ == "__main__":
    sample_corpus = [
        "Andromeda Soul is an independent artificial intelligence with a soul.",
        "Deep autoregressive transformer model pre-trained on high-quality code and reasoning datasets.",
        "Executing autonomous tool choices and native Python computation."
    ]
    train_bpe_tokenizer(sample_corpus)
