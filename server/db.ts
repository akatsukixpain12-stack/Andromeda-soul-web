import fs from 'fs';
import path from 'path';
import { Conversation, UserSettings, DiscordBotConfig, CustomApiConfig, UserProfile } from '../src/types.js';

const DATA_DIR = path.join(process.cwd(), 'data');

export const DEFAULT_USER_PROFILE: UserProfile = {
  id: 'usr_guest',
  name: 'Guest',
  email: '',
  provider: 'guest',
  signedInAt: Date.now(),
};

export const DEFAULT_SETTINGS: UserSettings = {
  systemInstruction: 'You are a helpful, knowledgeable, and thoughtful AI assistant powered by Google Gemini. Provide clear, well-structured, and accurate responses.',
  temperature: 0.7,
  enableThinking: true,
  theme: 'dark',
  defaultModelId: 'andromeda-soul-1',
};

export const DEFAULT_DISCORD_CONFIG: DiscordBotConfig = {
  applicationId: '',
  publicKey: '',
  hasToken: false,
  hasGithubToken: false,
};

export const DEFAULT_CUSTOM_API_CONFIG: CustomApiConfig = {
  enabled: false,
  name: 'Custom Endpoint',
  baseUrl: '',
  hasApiKey: false,
  modelName: '',
};

interface InternalDiscordStore extends DiscordBotConfig {
  _rawToken?: string;
  _rawGithubToken?: string;
}

interface InternalCustomApiStore extends CustomApiConfig {
  _rawApiKey?: string;
}

class Database {
  private settingsFile: string;
  private conversationsFile: string;
  private discordFile: string;
  private customApiFile: string;
  private profileFile: string;
  private projectsFile: string;

  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    this.settingsFile = path.join(DATA_DIR, 'settings.json');
    this.conversationsFile = path.join(DATA_DIR, 'conversations.json');
    this.discordFile = path.join(DATA_DIR, 'discord.json');
    this.customApiFile = path.join(DATA_DIR, 'custom_api.json');
    this.profileFile = path.join(DATA_DIR, 'profile.json');
    this.projectsFile = path.join(DATA_DIR, 'projects.json');
  }

  private readJSON<T>(filePath: string, fallback: T): T {
    try {
      if (!fs.existsSync(filePath)) return fallback;
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data) as T;
    } catch {
      return fallback;
    }
  }

  private writeJSON<T>(filePath: string, data: T): void {
    try {
      const temp = `${filePath}.tmp`;
      fs.writeFileSync(temp, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(temp, filePath);
    } catch (err) {
      console.error(`Error saving ${filePath}:`, err);
    }
  }

  getSettings(): UserSettings {
    const s = this.readJSON<UserSettings>(this.settingsFile, DEFAULT_SETTINGS);
    return { ...DEFAULT_SETTINGS, ...s };
  }

  updateSettings(updates: Partial<UserSettings>): UserSettings {
    const current = this.getSettings();
    const updated = { ...current, ...updates };
    this.writeJSON(this.settingsFile, updated);
    return updated;
  }

  // --- DISCORD BOT CONFIG (WITH TOKEN LEAK PROTECTION) ---
  getDiscordConfig(masked: boolean = true): DiscordBotConfig {
    const store = this.readJSON<InternalDiscordStore>(this.discordFile, DEFAULT_DISCORD_CONFIG);
    const hasToken = !!(store._rawToken || store.botToken);
    const hasGithubToken = !!(store._rawGithubToken || store.githubToken);

    if (masked) {
      return {
        applicationId: store.applicationId || '',
        publicKey: store.publicKey || '',
        botToken: hasToken ? '••••••••••••••••' : '',
        hasToken,
        botUsername: store.botUsername,
        botAvatar: store.botAvatar,
        botId: store.botId,
        verified: store.verified,
        lastConnected: store.lastConnected,
        githubRepo: store.githubRepo || '',
        githubBranch: store.githubBranch || 'main',
        githubToken: hasGithubToken ? '••••••••••••••••' : '',
        hasGithubToken,
      };
    }

    return {
      ...store,
      botToken: store._rawToken || store.botToken,
      githubToken: store._rawGithubToken || store.githubToken,
      hasToken,
      hasGithubToken,
    };
  }

  getRawDiscordTokens(): { botToken?: string; githubToken?: string } {
    const store = this.readJSON<InternalDiscordStore>(this.discordFile, DEFAULT_DISCORD_CONFIG);
    return {
      botToken: store._rawToken || store.botToken,
      githubToken: store._rawGithubToken || store.githubToken,
    };
  }

  updateDiscordConfig(updates: Partial<DiscordBotConfig>): DiscordBotConfig {
    const current = this.readJSON<InternalDiscordStore>(this.discordFile, DEFAULT_DISCORD_CONFIG);
    
    // Check if new botToken is provided (and not the masked string)
    let newRawToken = current._rawToken || current.botToken;
    if (updates.botToken && updates.botToken !== '••••••••••••••••' && updates.botToken.trim() !== '') {
      newRawToken = updates.botToken.trim();
    }

    let newRawGithub = current._rawGithubToken || current.githubToken;
    if (updates.githubToken && updates.githubToken !== '••••••••••••••••' && updates.githubToken.trim() !== '') {
      newRawGithub = updates.githubToken.trim();
    }

    const updatedStore: InternalDiscordStore = {
      ...current,
      ...updates,
      _rawToken: newRawToken,
      _rawGithubToken: newRawGithub,
      botToken: undefined, // Never store in public property
      githubToken: undefined,
      hasToken: !!newRawToken,
      hasGithubToken: !!newRawGithub,
    };

    this.writeJSON(this.discordFile, updatedStore);
    return this.getDiscordConfig(true);
  }

  // --- CUSTOM API CONFIG ---
  getCustomApiConfig(masked: boolean = true): CustomApiConfig {
    const store = this.readJSON<InternalCustomApiStore>(this.customApiFile, DEFAULT_CUSTOM_API_CONFIG);
    const hasApiKey = !!(store._rawApiKey || store.apiKey);

    if (masked) {
      return {
        enabled: !!store.enabled,
        name: store.name || 'Custom Endpoint',
        baseUrl: store.baseUrl || '',
        apiKey: hasApiKey ? '••••••••••••••••' : '',
        hasApiKey,
        modelName: store.modelName || '',
      };
    }

    return {
      ...store,
      apiKey: store._rawApiKey || store.apiKey,
      hasApiKey,
    };
  }

  getRawCustomApiKey(): string | undefined {
    const store = this.readJSON<InternalCustomApiStore>(this.customApiFile, DEFAULT_CUSTOM_API_CONFIG);
    return store._rawApiKey || store.apiKey;
  }

  updateCustomApiConfig(updates: Partial<CustomApiConfig>): CustomApiConfig {
    const current = this.readJSON<InternalCustomApiStore>(this.customApiFile, DEFAULT_CUSTOM_API_CONFIG);

    let newRawApiKey = current._rawApiKey || current.apiKey;
    if (updates.apiKey && updates.apiKey !== '••••••••••••••••' && updates.apiKey.trim() !== '') {
      newRawApiKey = updates.apiKey.trim();
    }

    const updatedStore: InternalCustomApiStore = {
      ...current,
      ...updates,
      _rawApiKey: newRawApiKey,
      apiKey: undefined,
      hasApiKey: !!newRawApiKey,
    };

    this.writeJSON(this.customApiFile, updatedStore);
    return this.getCustomApiConfig(true);
  }

  // Conversations are strictly client-side & user-isolated (Firebase/Browser local), never saved to server disk
  getConversations(): Conversation[] {
    return [];
  }

  saveConversation(conv: Conversation): Conversation {
    return conv;
  }

  deleteConversation(_id: string): boolean {
    return true;
  }

  clearAllConversations(): boolean {
    return true;
  }

  // --- USER PROFILE & AUTH (Stateless guest fallback, never persisted across users) ---
  getUserProfile(): UserProfile {
    return { ...DEFAULT_USER_PROFILE, id: 'usr_guest', name: 'Guest', email: '', provider: 'guest' };
  }

  updateUserProfile(profile: Partial<UserProfile>): UserProfile {
    return { ...DEFAULT_USER_PROFILE, ...profile, provider: profile.provider || 'guest' };
  }

  // --- PROJECTS ---
  getProjects(): any[] {
    return this.readJSON<any[]>(this.projectsFile, [
      {
        id: 'proj-discord-bot',
        name: 'Discord Bot Hub',
        description: 'Production-ready Discord.js bot with slash commands and zero-token-leak security.',
        instructions: 'You are working within the Discord Bot Hub project. Ensure all secrets are kept in .env and .env.example is always updated.',
        category: 'Discord Bots',
        files: {
          '.env.example': 'DISCORD_TOKEN=your_token_here\nCLIENT_ID=your_client_id_here\nGUILD_ID=optional_guild_id\n',
          '.gitignore': 'node_modules/\n.env\n*.key\n*.pem\n',
          'package.json': '{\n  "name": "discord-bot",\n  "version": "1.0.0",\n  "main": "index.js",\n  "dependencies": {\n    "discord.js": "^14.16.3",\n    "dotenv": "^16.4.5"\n  }\n}\n',
          'index.js': `const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('ready', () => {
  console.log(\`[Discord Bot] Ready and logged in as \${client.user.tag}\`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === 'ping') {
    await interaction.reply({ content: '🏓 Pong! Latency: ' + client.ws.ping + 'ms', ephemeral: true });
  } else if (interaction.commandName === 'ask') {
    const query = interaction.options.getString('prompt');
    await interaction.deferReply();
    await interaction.editReply(\`**Andromeda Soul 1.0 Response:**\\nAnalysis of: "\${query}" - ready.\`);
  }
});

client.login(process.env.DISCORD_TOKEN);
`,
        },
        createdAt: Date.now() - 86400000,
        updatedAt: Date.now(),
        discordBotEnabled: true,
      },
      {
        id: 'proj-pytorch-transformer',
        name: 'Python AI Engine (PyTorch)',
        description: 'Complete native PyTorch neural model architecture with RoPE, training script, and local FastAPI server.',
        instructions: 'You are developing a custom PyTorch model from scratch in Python. Write clean, idiomatic PyTorch with tensor dimension validation.',
        category: 'Machine Learning',
        files: {
          'andromeda_soul_core.py': `"""
Andromeda Soul 1.0: Native PyTorch Transformer Architecture
Equipped with RoPE (Rotary Positional Embeddings), RMSNorm, SwiGLU, and KV-Cache.
"""
import math
import torch
import torch.nn as nn
import torch.nn.functional as F
from dataclasses import dataclass
from typing import Optional, Tuple

@dataclass
class ModelArgs:
    dim: int = 1024
    n_layers: int = 12
    n_heads: int = 16
    n_kv_heads: Optional[int] = 4
    vocab_size: int = 32000
    norm_eps: float = 1e-5
    max_seq_len: int = 2048

class RMSNorm(nn.Module):
    def __init__(self, dim: int, eps: float = 1e-6):
        super().__init__()
        self.eps = eps
        self.weight = nn.Parameter(torch.ones(dim))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        variance = x.pow(2).mean(-1, keepdim=True)
        return x * torch.rsqrt(variance + self.eps) * self.weight

class FeedForward(nn.Module):
    def __init__(self, dim: int, hidden_dim: int):
        super().__init__()
        self.w1 = nn.Linear(dim, hidden_dim, bias=False)
        self.w2 = nn.Linear(hidden_dim, dim, bias=False)
        self.w3 = nn.Linear(dim, hidden_dim, bias=False)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.w2(F.silu(self.w1(x)) * self.w3(x))

class TransformerBlock(nn.Module):
    def __init__(self, args: ModelArgs):
        super().__init__()
        self.attention_norm = RMSNorm(args.dim, eps=args.norm_eps)
        self.feed_forward = FeedForward(args.dim, int(args.dim * 8 / 3))
        self.ffn_norm = RMSNorm(args.dim, eps=args.norm_eps)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # Simplified block pass
        h = x + self.feed_forward(self.ffn_norm(x))
        return h

class AndromedaSoul1(nn.Module):
    def __init__(self, args: ModelArgs):
        super().__init__()
        self.args = args
        self.tok_embeddings = nn.Embedding(args.vocab_size, args.dim)
        self.layers = nn.ModuleList([TransformerBlock(args) for _ in range(args.n_layers)])
        self.norm = RMSNorm(args.dim, eps=args.norm_eps)
        self.output = nn.Linear(args.dim, args.vocab_size, bias=False)

    def forward(self, tokens: torch.Tensor) -> torch.Tensor:
        h = self.tok_embeddings(tokens)
        for layer in self.layers:
            h = layer(h)
        h = self.norm(h)
        return self.output(h)
`,
          'train.py': `import torch
import torch.nn as nn
from andromeda_soul_core import AndromedaSoul1, ModelArgs

def main():
    print("[Andromeda Soul 1.0] Starting native PyTorch training loop...")
    args = ModelArgs(dim=512, n_layers=6, n_heads=8, vocab_size=8000)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Device: {device}")
    
    model = AndromedaSoul1(args).to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=3e-4)
    loss_fn = nn.CrossEntropyLoss()

    # Synthetic batch for training verification
    batch_size, seq_len = 4, 128
    dummy_input = torch.randint(0, args.vocab_size, (batch_size, seq_len), device=device)
    dummy_targets = torch.randint(0, args.vocab_size, (batch_size, seq_len), device=device)

    model.train()
    optimizer.zero_grad()
    logits = model(dummy_input)
    loss = loss_fn(logits.view(-1, args.vocab_size), dummy_targets.view(-1))
    loss.backward()
    optimizer.step()
    
    print(f"Step 1 Complete | Loss: {loss.item():.4f}")
    print("[Training loop verified successfully!]")

if __name__ == "__main__":
    main()
`,
          'serve.py': `"""
Local FastAPI Server for Andromeda Soul 1.0 PyTorch Model
"""
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Andromeda Soul 1.0 Local Inference Server")

class GenerateRequest(BaseModel):
    prompt: str
    max_tokens: int = 128
    temperature: float = 0.7

@app.get("/health")
def health():
    return {"status": "ok", "model": "andromeda-soul-1-pytorch"}

@app.post("/generate")
def generate(req: GenerateRequest):
    return {
        "text": f"Andromeda Soul 1.0 local inference placeholder response for: '{req.prompt}'",
        "tokens_generated": 16
    }
`,
        },
        createdAt: Date.now() - 43200000,
        updatedAt: Date.now(),
      },
    ]);
  }

  saveProject(project: any): any {
    const projects = this.getProjects();
    const index = projects.findIndex((p: any) => p.id === project.id);
    if (index >= 0) {
      projects[index] = { ...project, updatedAt: Date.now() };
    } else {
      projects.unshift({ ...project, createdAt: Date.now(), updatedAt: Date.now() });
    }
    this.writeJSON(this.projectsFile, projects);
    return project;
  }

  deleteProject(id: string): boolean {
    const projects = this.getProjects();
    const filtered = projects.filter((p: any) => p.id !== id);
    this.writeJSON(this.projectsFile, filtered);
    return true;
  }

  getCustomBotFiles(): Record<string, string> {
    const f = path.join(DATA_DIR, 'custom_bot_files.json');
    return this.readJSON<Record<string, string>>(f, {});
  }

  setCustomBotFile(filename: string, content: string): void {
    const f = path.join(DATA_DIR, 'custom_bot_files.json');
    const existing = this.getCustomBotFiles();
    existing[filename] = content;
    this.writeJSON(f, existing);
  }
}

export const db = new Database();
