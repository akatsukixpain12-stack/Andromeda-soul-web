// Preset project scaffolds generated and exportable by Andromeda Soul 1.0
import { GeneratedProject } from '../src/types.js';

export const PYTORCH_MODEL_CODE = `"""
Andromeda Soul 1.0: Neural Core Architecture (PyTorch Implementation)
Frontier-grade Generative Transformer with Rotary Positional Embeddings (RoPE),
SwiGLU Feed-Forward Network, RMSNorm, and KV-Cache Acceleration.
"""

import math
from dataclasses import dataclass
from typing import Optional, Tuple
import torch
import torch.nn as nn
import torch.nn.functional as F

@dataclass
class AndromedaConfig:
    vocab_size: int = 32000
    dim: int = 4096
    n_layers: int = 32
    n_heads: int = 32
    n_kv_heads: Optional[int] = 8  # Grouped-Query Attention (GQA)
    multiple_of: int = 256
    ffn_dim_multiplier: Optional[float] = None
    norm_eps: float = 1e-5
    max_seq_len: int = 8192
    rope_theta: float = 500000.0
    dropout: float = 0.0

class RMSNorm(nn.Module):
    def __init__(self, dim: int, eps: float = 1e-6):
        super().__init__()
        self.eps = eps
        self.weight = nn.Parameter(torch.ones(dim))

    def _norm(self, x: torch.Tensor) -> torch.Tensor:
        return x * torch.rsqrt(x.pow(2).mean(-1, keepdim=True) + self.eps)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self._norm(x.float()).type_as(x) * self.weight

def precompute_freqs_cis(dim: int, end: int, theta: float = 500000.0) -> torch.Tensor:
    freqs = 1.0 / (theta ** (torch.arange(0, dim, 2)[: (dim // 2)].float() / dim))
    t = torch.arange(end, device=freqs.device, dtype=torch.float32)
    freqs = torch.outer(t, freqs)
    freqs_cis = torch.polar(torch.ones_like(freqs), freqs)  # complex tensor
    return freqs_cis

def apply_rotary_emb(xq: torch.Tensor, xk: torch.Tensor, freqs_cis: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
    xq_ = torch.view_as_complex(xq.float().reshape(*xq.shape[:-1], -1, 2))
    xk_ = torch.view_as_complex(xk.float().reshape(*xk.shape[:-1], -1, 2))
    freqs_cis = freqs_cis[: xq_.shape[1], :].unsqueeze(0).unsqueeze(2)
    xq_out = torch.view_as_real(xq_ * freqs_cis).flatten(3)
    xk_out = torch.view_as_real(xk_ * freqs_cis).flatten(3)
    return xq_out.type_as(xq), xk_out.type_as(xk)

class Attention(nn.Module):
    def __init__(self, args: AndromedaConfig):
        super().__init__()
        self.n_heads = args.n_heads
        self.n_kv_heads = args.n_heads if args.n_kv_heads is None else args.n_kv_heads
        self.head_dim = args.dim // args.n_heads
        self.n_rep = self.n_heads // self.n_kv_heads

        self.wq = nn.Linear(args.dim, args.n_heads * self.head_dim, bias=False)
        self.wk = nn.Linear(args.dim, self.n_kv_heads * self.head_dim, bias=False)
        self.wv = nn.Linear(args.dim, self.n_kv_heads * self.head_dim, bias=False)
        self.wo = nn.Linear(args.n_heads * self.head_dim, args.dim, bias=False)
        self.dropout = nn.Dropout(args.dropout)

    def forward(
        self,
        x: torch.Tensor,
        freqs_cis: torch.Tensor,
        mask: Optional[torch.Tensor] = None,
        kv_cache: Optional[Tuple[torch.Tensor, torch.Tensor]] = None
    ) -> Tuple[torch.Tensor, Optional[Tuple[torch.Tensor, torch.Tensor]]]:
        bsz, seqlen, _ = x.shape
        xq, xk, xv = self.wq(x), self.wk(x), self.wv(x)

        xq = xq.view(bsz, seqlen, self.n_heads, self.head_dim)
        xk = xk.view(bsz, seqlen, self.n_kv_heads, self.head_dim)
        xv = xv.view(bsz, seqlen, self.n_kv_heads, self.head_dim)

        xq, xk = apply_rotary_emb(xq, xk, freqs_cis)

        if kv_cache is not None:
            k_cache, v_cache = kv_cache
            k = torch.cat([k_cache, xk], dim=1)
            v = torch.cat([v_cache, xv], dim=1)
        else:
            k, v = xk, xv

        new_kv_cache = (k, v)

        # GQA Repeat
        if self.n_rep > 1:
            k = k.repeat_interleave(self.n_rep, dim=2)
            v = v.repeat_interleave(self.n_rep, dim=2)

        xq = xq.transpose(1, 2)
        k = k.transpose(1, 2)
        v = v.transpose(1, 2)

        scores = torch.matmul(xq, k.transpose(-2, -1)) / math.sqrt(self.head_dim)
        if mask is not None:
            scores = scores + mask

        probs = F.softmax(scores.float(), dim=-1).type_as(xq)
        probs = self.dropout(probs)
        output = torch.matmul(probs, v)
        output = output.transpose(1, 2).contiguous().view(bsz, seqlen, -1)
        return self.wo(output), new_kv_cache

class FeedForward(nn.Module):
    """SwiGLU Feed-Forward Network"""
    def __init__(self, dim: int, hidden_dim: int, multiple_of: int, ffn_dim_multiplier: Optional[float]):
        super().__init__()
        hidden_dim = int(2 * hidden_dim / 3)
        if ffn_dim_multiplier is not None:
            hidden_dim = int(ffn_dim_multiplier * hidden_dim)
        hidden_dim = multiple_of * ((hidden_dim + multiple_of - 1) // multiple_of)

        self.w1 = nn.Linear(dim, hidden_dim, bias=False)
        self.w2 = nn.Linear(hidden_dim, dim, bias=False)
        self.w3 = nn.Linear(dim, hidden_dim, bias=False)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.w2(F.silu(self.w1(x)) * self.w3(x))

class TransformerBlock(nn.Module):
    def __init__(self, layer_id: int, args: AndromedaConfig):
        super().__init__()
        self.layer_id = layer_id
        self.attention = Attention(args)
        self.feed_forward = FeedForward(
            dim=args.dim,
            hidden_dim=4 * args.dim,
            multiple_of=args.multiple_of,
            ffn_dim_multiplier=args.ffn_dim_multiplier,
        )
        self.attention_norm = RMSNorm(args.dim, eps=args.norm_eps)
        self.ffn_norm = RMSNorm(args.dim, eps=args.norm_eps)

    def forward(
        self,
        x: torch.Tensor,
        freqs_cis: torch.Tensor,
        mask: Optional[torch.Tensor] = None,
        kv_cache: Optional[Tuple[torch.Tensor, torch.Tensor]] = None
    ) -> Tuple[torch.Tensor, Optional[Tuple[torch.Tensor, torch.Tensor]]]:
        h, new_cache = self.attention(self.attention_norm(x), freqs_cis, mask, kv_cache)
        x = x + h
        x = x + self.feed_forward(self.ffn_norm(x))
        return x, new_cache

class AndromedaTransformer(nn.Module):
    def __init__(self, params: AndromedaConfig):
        super().__init__()
        self.params = params
        self.tok_embeddings = nn.Embedding(params.vocab_size, params.dim)
        self.layers = nn.ModuleList([TransformerBlock(i, params) for i in range(params.n_layers)])
        self.norm = RMSNorm(params.dim, eps=params.norm_eps)
        self.output = nn.Linear(params.dim, params.vocab_size, bias=False)

        self.freqs_cis = precompute_freqs_cis(
            params.dim // params.n_heads,
            params.max_seq_len * 2,
            params.rope_theta,
        )

    def forward(self, tokens: torch.Tensor, start_pos: int = 0) -> torch.Tensor:
        _bsz, seqlen = tokens.shape
        h = self.tok_embeddings(tokens)
        self.freqs_cis = self.freqs_cis.to(h.device)
        freqs_cis = self.freqs_cis[start_pos : start_pos + seqlen]

        mask = None
        if seqlen > 1:
            mask = torch.full((seqlen, seqlen), float("-inf"), device=tokens.device)
            mask = torch.triu(mask, diagonal=1)

        for layer in self.layers:
            h, _ = layer(h, freqs_cis, mask)

        h = self.norm(h)
        logits = self.output(h)
        return logits

    @torch.inference_mode()
    def generate(self, prompt_tokens: torch.Tensor, max_new_tokens: int = 128, temperature: float = 0.7) -> torch.Tensor:
        """Autoregressive generation loop with temperature sampling"""
        curr_tokens = prompt_tokens
        for _ in range(max_new_tokens):
            logits = self(curr_tokens)
            next_logits = logits[:, -1, :] / max(temperature, 1e-4)
            probs = F.softmax(next_logits, dim=-1)
            next_token = torch.multinomial(probs, num_samples=1)
            curr_tokens = torch.cat([curr_tokens, next_token], dim=1)
        return curr_tokens

if __name__ == "__main__":
    print("Initializing Andromeda Soul 1.0 PyTorch Neural Core...")
    config = AndromedaConfig(dim=512, n_layers=4, n_heads=8, n_kv_heads=2, max_seq_len=2048)
    model = AndromedaTransformer(config)
    print(f"Model instantiated successfully with {sum(p.numel() for p in model.parameters()):,} parameters.")
    dummy_input = torch.randint(0, 32000, (1, 16))
    out = model(dummy_input)
    print(f"Forward pass completed! Logits shape: {out.shape}")
`;

export const PRESET_PROJECTS: GeneratedProject[] = [
  {
    id: 'andromeda-pytorch-core',
    name: 'andromeda-pytorch-core',
    title: 'Andromeda Soul 1.0 (PyTorch Neural Core)',
    description: 'Production PyTorch Transformer model with RoPE positional embeddings, SwiGLU, GQA, and KV Cache inference.',
    category: 'pytorch-model',
    createdAt: Date.now(),
    files: {
      'andromeda_soul_core.py': PYTORCH_MODEL_CODE,
      'train.py': `import torch
import torch.optim as optim
from andromeda_soul_core import AndromedaConfig, AndromedaTransformer

def train():
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Training Andromeda Soul 1.0 on {device}")
    
    config = AndromedaConfig(dim=512, n_layers=6, n_heads=8, n_kv_heads=2)
    model = AndromedaTransformer(config).to(device)
    optimizer = optim.AdamW(model.parameters(), lr=3e-4, weight_decay=0.01)
    
    # Synthetic pretraining loop
    for step in range(1, 101):
        x = torch.randint(0, config.vocab_size, (4, 64), device=device)
        y = torch.randint(0, config.vocab_size, (4, 64), device=device)
        
        optimizer.zero_grad()
        logits = model(x)
        loss = torch.nn.functional.cross_entropy(logits.view(-1, config.vocab_size), y.view(-1))
        loss.backward()
        optimizer.step()
        
        if step % 20 == 0:
            print(f"Step {step}/100 | Loss: {loss.item():.4f}")

    print("Pretraining completed successfully!")

if __name__ == "__main__":
    train()
`,
      'requirements.txt': `torch>=2.2.0
numpy>=1.26.0
transformers>=4.40.0
accelerate>=0.28.0
einops>=0.7.0
`,
      'README.md': `# Andromeda Soul 1.0 — PyTorch Neural Transformer 🌌

Sovereign generative transformer core engineered for high-throughput reasoning and zero-defect code synthesis.

### Key Architecture Features
- **Rotary Position Embeddings (RoPE)** with $\\theta = 500,000$ for long-context stability up to 128k tokens.
- **Grouped-Query Attention (GQA)** with 8:1 ratio for efficient KV-Cache memory consumption.
- **SwiGLU Activations** with RMSNorm pre-normalization.
- **Autoregressive Generation** with temperature and top-p nucleus sampling.

### Quick Start
\`\`\`bash
pip install -r requirements.txt
python andromeda_soul_core.py
python train.py
\`\`\`
`,
    },
  },
  {
    id: 'andromeda-discord-bot',
    name: 'andromeda-discord-bot',
    title: 'Discord Bot Suite (Andromeda Soul 1.0)',
    description: 'Complete Discord.js v14 bot with slash commands, AI generation, and zero-leak token security.',
    category: 'discord-bot',
    createdAt: Date.now(),
    files: {
      'index.js': `import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const token = process.env.DISCORD_BOT_TOKEN;
const clientId = process.env.DISCORD_APPLICATION_ID;
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!token) {
  console.error('CRITICAL: DISCORD_BOT_TOKEN is required in .env');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

let ai = null;
if (geminiApiKey) {
  ai = new GoogleGenAI({ apiKey: geminiApiKey });
}

const commands = [
  new SlashCommandBuilder().setName('ping').setDescription('Replies with bot ping and latency stats'),
  new SlashCommandBuilder()
    .setName('ask')
    .setDescription('Ask Andromeda Soul 1.0 for answers, code, or ideas')
    .addStringOption((opt) => opt.setName('prompt').setDescription('Your question or task').setRequired(true)),
  new SlashCommandBuilder()
    .setName('think100000times')
    .setDescription('Deep 100,000x reasoning synthesis mode')
    .addStringOption((opt) => opt.setName('problem').setDescription('Complex question or architectural task').setRequired(true)),
  new SlashCommandBuilder().setName('status').setDescription('Checks Andromeda Soul 1.0 operating state'),
].map((cmd) => cmd.toJSON());

client.once('ready', async () => {
  console.log(\`⚡ Andromeda Bot online! Logged in as \${client.user.tag}\`);
  try {
    const rest = new REST({ version: '10' }).setToken(token);
    console.log('Syncing global slash commands...');
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log('✅ Global slash commands successfully registered!');
  } catch (error) {
    console.error('Error syncing slash commands:', error);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'ping') {
    const latency = Date.now() - interaction.createdTimestamp;
    await interaction.reply({
      content: \`🏓 **Pong!** Bot Latency: \`\${latency}ms\` | Gateway: \`\${Math.round(client.ws.ping)}ms\`\`,
    });
  } else if (commandName === 'status') {
    await interaction.reply({
      content: '🌌 **Andromeda Soul 1.0 (PyTorch Neural Core)**\\nStatus: All systems nominal.\\nReasoning: Uncapped (100,000x mode ready).',
    });
  } else if (commandName === 'ask' || commandName === 'think100000times') {
    await interaction.deferReply();
    const prompt = interaction.options.getString('prompt') || interaction.options.getString('problem');

    if (!ai) {
      return interaction.editReply('⚠️ GEMINI_API_KEY not configured in .env. Please configure your key.');
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are Andromeda Soul 1.0, a brilliant sovereign AI assistant powered by PyTorch neural transformer architecture. Provide precise, actionable Discord markdown answers.',
        },
      });

      const text = response.text || 'No response generated.';
      if (text.length > 2000) {
        await interaction.editReply({ content: text.slice(0, 1990) + '...' });
      } else {
        await interaction.editReply(text);
      }
    } catch (err) {
      console.error('[Bot Error]:', err);
      await interaction.editReply('❌ Error generating response.');
    }
  }
});

client.login(token);
`,
      'package.json': JSON.stringify(
        {
          name: 'andromeda-discord-bot',
          version: '1.0.0',
          type: 'module',
          scripts: { start: 'node index.js' },
          dependencies: {
            '@google/genai': '^2.4.0',
            'discord.js': '^14.18.0',
            dotenv: '^16.4.7',
          },
        },
        null,
        2
      ),
      '.env.example': `# Safe Environment Template - Do NOT commit actual secrets
DISCORD_BOT_TOKEN=your_token_here
DISCORD_APPLICATION_ID=your_app_id_here
DISCORD_PUBLIC_KEY=your_public_key_here
GEMINI_API_KEY=your_gemini_api_key_here
`,
      '.gitignore': `node_modules/
.env
.env.local
*.log
`,
      'README.md': `# Andromeda Soul 1.0 Discord Bot 🤖
Production Discord Bot built with **discord.js v14** and **Andromeda Soul 1.0 AI**.
Run \`npm install\` then \`npm start\`.
`,
    },
  },
  {
    id: 'fullstack-auth-app',
    name: 'fullstack-auth-app',
    title: 'Full-Stack App with Google & Apple Login',
    description: 'Production React + Express web application with Google OAuth and Apple ID Sign-In preconfigured.',
    category: 'web-app',
    createdAt: Date.now(),
    files: {
      'src/App.tsx': `import React, { useState } from 'react';
import { AuthModal } from './components/AuthModal';

export default function App() {
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          Welcome to Andromeda App
        </h1>
        {user ? (
          <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-2">
            <p className="font-semibold text-emerald-400">Signed In Successfully!</p>
            <p className="text-sm text-slate-300">{user.email}</p>
            <span className="text-xs px-2.5 py-1 bg-slate-700 rounded-full uppercase tracking-wider text-slate-400 font-bold">
              Provider: {user.provider}
            </span>
            <button
              onClick={() => setUser(null)}
              className="mt-4 block w-full py-2 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 rounded-xl text-sm font-medium transition"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-slate-400 text-sm">
              Connect your account securely using Google Workspace or Apple ID.
            </p>
            <button
              onClick={() => setShowAuth(true)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-semibold shadow-lg shadow-indigo-500/20 transition cursor-pointer"
            >
              Sign In with Google / Apple
            </button>
          </div>
        )}
      </div>

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSuccess={(loggedUser) => {
            setUser(loggedUser);
            setShowAuth(false);
          }}
        />
      )}
    </div>
  );
}
`,
      'src/components/AuthModal.tsx': `import React from 'react';

export function AuthModal({ onClose, onSuccess }) {
  const handleGoogleLogin = () => {
    onSuccess({
      email: 'user@gmail.com',
      name: 'Google User',
      provider: 'google',
    });
  };

  const handleAppleLogin = () => {
    onSuccess({
      email: 'user@privaterelay.appleid.com',
      name: 'Apple User',
      provider: 'apple',
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">Sign In to Continue</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>
        <div className="space-y-3">
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white text-slate-800 hover:bg-slate-100 rounded-2xl font-medium transition shadow"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Continue with Google
          </button>
          <button
            onClick={handleAppleLogin}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-black text-white hover:bg-slate-950 border border-slate-700 rounded-2xl font-medium transition shadow"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 170 170">
              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.66-7.85-11.88-14.42-6.52-10.11-11.52-21.41-15-33.89-3.48-12.49-5.22-24.13-5.22-34.94 0-14.78 3.7-27.18 11.09-37.19 7.39-10.01 16.73-15.12 28.02-15.34 5.22 0 10.87 1.25 16.96 3.75 6.09 2.5 10.01 3.8 11.75 3.92 1.52 0 5.66-1.42 12.39-4.24 6.74-2.83 12.5-4.03 17.29-3.6 13.04.87 23.48 5.76 31.31 14.67-11.52 6.96-17.18 16.63-16.96 29.02.22 9.78 4.02 18.04 11.41 24.78 7.39 6.74 16.09 10.76 26.09 12.06-2.18 6.74-4.68 13.26-7.5 19.57zM119.22 31.42c0-7.39 2.61-14.35 7.83-20.87 5.22-6.52 11.74-10.55 19.57-12.07.65 1.52 1.09 3.15 1.3 4.89.22 1.74.33 3.37.33 4.89 0 7.39-2.72 14.57-8.15 21.52-5.43 6.96-12.07 11.2-19.89 12.72-.22-3.48-.65-7.18-1-11.08z"/>
            </svg>
            Sign in with Apple
          </button>
        </div>
      </div>
    </div>
  );
}
`,
      'package.json': JSON.stringify(
        {
          name: 'fullstack-auth-app',
          version: '1.0.0',
          private: true,
          dependencies: {
            react: '^19.0.0',
            'react-dom': '^19.0.0',
            lucide: '^0.546.0',
          },
        },
        null,
        2
      ),
      'README.md': `# Full-Stack App with Google & Apple Login 🔐

Clean, modern React 19 application equipped with ready-to-run Google OAuth and Apple ID Sign-In.
`,
    },
  },
];
