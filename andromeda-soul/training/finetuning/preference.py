"""
Preference Optimization (DPO / RLHF Architecture) for Andromeda Soul
"""

import torch
import torch.nn as nn
import torch.nn.functional as F

class DirectPreferenceOptimization(nn.Module):
    def __init__(self, policy_model: nn.Module, reference_model: nn.Module, beta: float = 0.1):
        super().__init__()
        self.policy_model = policy_model
        self.reference_model = reference_model
        self.beta = beta

    def compute_dpo_loss(
        self,
        chosen_ids: torch.Tensor,
        rejected_ids: torch.Tensor,
    ) -> torch.Tensor:
        # Compute log probabilities under policy and reference models
        policy_chosen_logits, _, _ = self.policy_model(chosen_ids)
        ref_chosen_logits, _, _ = self.reference_model(chosen_ids)

        policy_rejected_logits, _, _ = self.policy_model(rejected_ids)
        ref_rejected_logits, _, _ = self.reference_model(rejected_ids)

        policy_logratios = F.log_softmax(policy_chosen_logits, dim=-1) - F.log_softmax(policy_rejected_logits, dim=-1)
        ref_logratios = F.log_softmax(ref_chosen_logits, dim=-1) - F.log_softmax(ref_rejected_logits, dim=-1)

        logits = self.beta * (policy_logratios - ref_logratios)
        loss = -F.logsigmoid(logits).mean()
        return loss
