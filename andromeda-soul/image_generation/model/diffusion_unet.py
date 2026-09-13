"""
Andromeda Vision Latent Diffusion UNet & Noise Estimator Architecture
Original generative image model architecture.
"""

import math
import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Optional, Tuple

class ResidualBlock(nn.Module):
    def __init__(self, in_channels: int, out_channels: int, time_emb_dim: int):
        super().__init__()
        self.time_mlp = nn.Linear(time_emb_dim, out_channels)
        self.conv1 = nn.Conv2d(in_channels, out_channels, 3, padding=1)
        self.conv2 = nn.Conv2d(out_channels, out_channels, 3, padding=1)
        self.shortcut = nn.Conv2d(in_channels, out_channels, 1) if in_channels != out_channels else nn.Identity()

    def forward(self, x: torch.Tensor, time_emb: torch.Tensor) -> torch.Tensor:
        h = F.silu(self.conv1(x))
        h = h + self.time_mlp(F.silu(time_emb))[:, :, None, None]
        h = F.silu(self.conv2(h))
        return h + self.shortcut(x)


class AndromedaVisionUNet(nn.Module):
    """Native UNet Noise Predictor for Andromeda Vision Image Generation"""
    def __init__(self, in_channels: int = 4, out_channels: int = 4, hidden_dim: int = 64):
        super().__init__()
        self.time_dim = hidden_dim * 4

        self.time_mlp = nn.Sequential(
            nn.Linear(hidden_dim, self.time_dim),
            nn.SiLU(),
            nn.Linear(self.time_dim, self.time_dim)
        )

        self.init_conv = nn.Conv2d(in_channels, hidden_dim, 3, padding=1)
        self.down1 = ResidualBlock(hidden_dim, hidden_dim * 2, self.time_dim)
        self.down2 = ResidualBlock(hidden_dim * 2, hidden_dim * 4, self.time_dim)

        self.mid = ResidualBlock(hidden_dim * 4, hidden_dim * 4, self.time_dim)

        self.up2 = ResidualBlock(hidden_dim * 8, hidden_dim * 2, self.time_dim)
        self.up1 = ResidualBlock(hidden_dim * 4, hidden_dim, self.time_dim)
        self.final_conv = nn.Conv2d(hidden_dim, out_channels, 3, padding=1)

    def get_time_embedding(self, timesteps: torch.Tensor) -> torch.Tensor:
        half_dim = self.init_conv.out_channels // 2
        emb = math.log(10000) / (half_dim - 1)
        emb = torch.exp(torch.arange(half_dim, device=timesteps.device) * -emb)
        emb = timesteps[:, None] * emb[None, :]
        emb = torch.cat([torch.sin(emb), torch.cos(emb)], dim=-1)
        return emb

    def forward(self, x: torch.Tensor, timesteps: torch.Tensor) -> torch.Tensor:
        t_emb = self.time_mlp(self.get_time_embedding(timesteps))

        h1 = self.init_conv(x)
        h2 = self.down1(h1, t_emb)
        h3 = self.down2(h2, t_emb)

        m = self.mid(h3, t_emb)

        u2 = self.up2(torch.cat([m, h3], dim=1), t_emb)
        u1 = self.up1(torch.cat([u2, h2], dim=1), t_emb)
        return self.final_conv(u1)
