"""
Andromeda Logits Sampling Engine (Temperature, Top-K, Top-P, Repetition Penalty)
"""

import torch
import torch.nn.functional as F

class AndromedaSampler:
    @staticmethod
    def sample_logits(
        logits: torch.Tensor,
        temperature: float = 0.7,
        top_k: int = 40,
        top_p: float = 0.9,
        repetition_penalty: float = 1.1,
        generated_tokens: list = None,
    ) -> int:
        logits = logits.squeeze().clone()

        # Apply repetition penalty
        if generated_tokens and repetition_penalty != 1.0:
            for token_id in set(generated_tokens):
                if logits[token_id] < 0:
                    logits[token_id] *= repetition_penalty
                else:
                    logits[token_id] /= repetition_penalty

        if temperature == 0.0 or temperature < 1e-5:
            return torch.argmax(logits).item()

        logits = logits / temperature

        # Top-K Filtering
        if top_k > 0:
            indices_to_remove = logits < torch.topk(logits, top_k)[0][..., -1, None]
            logits[indices_to_remove] = float("-inf")

        # Top-P (Nucleus) Filtering
        if top_p < 1.0:
            sorted_logits, sorted_indices = torch.sort(logits, descending=True)
            cumulative_probs = torch.cumsum(F.softmax(sorted_logits, dim=-1), dim=-1)

            sorted_indices_to_remove = cumulative_probs > top_p
            sorted_indices_to_remove[..., 1:] = sorted_indices_to_remove[..., :-1].clone()
            sorted_indices_to_remove[..., 0] = 0

            indices_to_remove = sorted_indices[sorted_indices_to_remove]
            logits[indices_to_remove] = float("-inf")

        probs = F.softmax(logits, dim=-1)
        next_token = torch.multinomial(probs, num_samples=1).item()
        return next_token
