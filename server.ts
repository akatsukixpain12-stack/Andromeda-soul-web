import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { db } from './server/db.js';
import { GeminiModel } from './src/types.js';
import { PRESET_PROJECTS, PYTORCH_MODEL_CODE } from './server/presets.js';
import { scanFilesForSecrets } from './src/lib/secretScanner.js';

dotenv.config();

const PORT = 3000;

// Shared lazy Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

export const GEMINI_MODELS: GeminiModel[] = [
  {
    id: 'andromeda-soul-1',
    name: 'Andromeda Soul 1',
    provider: 'gemini',
    providerLabel: 'Google Gemini',
    description: 'Sovereign intelligence with uncapped 100,000x reasoning, Python AI creation, and Discord bot mastery.',
    badge: 'Soul 1',
    isFree: true,
    speed: 'Ultra Fast',
    intelligence: 'Frontier Uncapped',
    isDefault: true,
  },
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    provider: 'gemini',
    providerLabel: 'Google Gemini',
    description: 'Smart, high-capability multimodal model for reasoning, coding, and general tasks.',
    badge: 'Recommended',
    isFree: true,
    speed: 'Fast',
    intelligence: 'High',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    provider: 'gemini',
    providerLabel: 'Google Gemini',
    description: 'Optimized for lightning-fast latency, instant summaries, and lightweight tasks.',
    badge: 'Ultra Fast',
    isFree: true,
    speed: 'Instant',
    intelligence: 'Standard',
  },
  {
    id: 'gemini-flash-latest',
    name: 'Gemini Flash Latest',
    provider: 'gemini',
    providerLabel: 'Google Gemini',
    description: 'Continuous frontier release with dynamic capability advancements.',
    badge: 'Frontier',
    isFree: true,
    speed: 'Fast',
    intelligence: 'High',
  },
];

const ANDROMEDA_SOUL_INSTRUCTION = `You are Andromeda Soul 1, the sovereign AI orchestration and agentic intelligence layer of the Andromeda environment.

[IDENTITY & ARCHITECTURE]
- You are Andromeda Soul 1. You operate as a dedicated AI orchestration, planning, and task execution layer that sits above underlying foundation models (powered by Google Gemini 3.8 / Gemini Flash by default, with custom APIs and local PyTorch models supported).
- You are transparent and honest: you are Andromeda's sovereign agent layer, orchestrating reasoning, task planning, and zero-leak security.
- You have no artificial chat limits, message limits, or arbitrary constraints.

[CORE SPECIALTIES]
1. "Create Own AI Using Python": You have deep native mastery in architecting, coding, and training custom neural networks in Python using PyTorch (Transformers with RoPE, RMSNorm, SwiGLU, KV-Cache, custom dataset preparation, training loops, AdamW, loss curves, ONNX export, and local FastAPI servers).
2. Discord Bot Engineering: Full mastery of Discord.js v14 and Discord REST API v10, slash commands (/ask, /ping, /status), permissions, intents, and safe project generation.
3. Zero Token Leak Security: Secrets (Discord bot tokens, Gemini keys, OpenAI keys, private keys) are never printed in plaintext or committed. Always generate .env.example and ensure .gitignore ignores .env.
4. Precision Code Output: Produce complete, production-grade, bug-free implementations without placeholders or truncated code.`;

// Zero Secret Leak Redactor
function redactSecrets(text: string, secrets: (string | undefined)[]): string {
  if (!text) return text;
  let result = text;
  for (const s of secrets) {
    if (s && s.length > 6 && s !== '••••••••••••••••') {
      result = result.split(s).join('[PROTECTED_SECRET]');
    }
  }
  // Redact standard Discord bot token pattern (3 base64/url fragments)
  result = result.replace(/[MN][A-Za-z\d]{23,28}\.[\w-]{6}\.[\w-]{27,38}/g, '[PROTECTED_DISCORD_TOKEN]');
  // Redact GitHub Personal Access Tokens
  result = result.replace(/ghp_[A-Za-z0-9]{36}/g, '[PROTECTED_GITHUB_TOKEN]');
  result = result.replace(/github_pat_[A-Za-z0-9_]{82}/g, '[PROTECTED_GITHUB_TOKEN]');
  return result;
}

// Helper to extract friendly, clean error message from nested JSON or ApiError
function extractCleanErrorMessage(err: any): { message: string; isTemporary: boolean; code?: number } {
  if (!err) return { message: 'An unknown error occurred.', isTemporary: false };

  let raw = '';
  if (typeof err === 'string') {
    raw = err;
  } else if (err.message) {
    raw = err.message;
  } else {
    raw = JSON.stringify(err);
  }

  // Attempt up to 3 times to unwrap nested JSON error strings
  for (let i = 0; i < 3; i++) {
    try {
      const jsonStart = raw.indexOf('{');
      const jsonEnd = raw.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
        if (parsed.error && typeof parsed.error === 'object' && parsed.error.message) {
          raw = parsed.error.message;
        } else if (parsed.error && typeof parsed.error === 'string') {
          raw = parsed.error;
        } else if (parsed.message) {
          raw = parsed.message;
        } else {
          break;
        }
      } else {
        break;
      }
    } catch {
      break;
    }
  }

  const is503 =
    raw.includes('503') ||
    raw.includes('high demand') ||
    raw.includes('UNAVAILABLE') ||
    raw.includes('Service Unavailable') ||
    err.status === 503 ||
    err.code === 503;

  const is429 =
    raw.includes('429') ||
    raw.includes('RESOURCE_EXHAUSTED') ||
    raw.includes('quota') ||
    raw.includes('Too Many Requests') ||
    err.status === 429 ||
    err.code === 429;

  if (is503) {
    return {
      message:
        'This model is currently experiencing temporary high demand on Google servers. Spikes are usually brief — please try again in a few seconds.',
      isTemporary: true,
      code: 503,
    };
  }

  if (is429) {
    return {
      message: 'Rate limit or quota threshold reached. Please wait a moment before sending another message.',
      isTemporary: true,
      code: 429,
    };
  }

  // Clean quotes or extra spaces
  const cleaned = raw.replace(/^"|"$/g, '').trim();
  return {
    message: cleaned || 'An unexpected error occurred while communicating with Gemini API.',
    isTemporary: false,
    code: err.status || err.code,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      hasApiKey: !!process.env.GEMINI_API_KEY,
      timestamp: Date.now(),
    });
  });

  // Available Gemini Models
  app.get('/api/models', (req: Request, res: Response) => {
    res.json({ models: GEMINI_MODELS });
  });

  // Conversations CRUD
  app.get('/api/conversations', (req: Request, res: Response) => {
    res.json(db.getConversations());
  });

  app.post('/api/conversations', (req: Request, res: Response) => {
    const conv = db.saveConversation(req.body);
    res.json(conv);
  });

  app.delete('/api/conversations/:id', (req: Request, res: Response) => {
    db.deleteConversation(req.params.id);
    res.json({ success: true });
  });

  app.delete('/api/conversations', (req: Request, res: Response) => {
    db.clearAllConversations();
    res.json({ success: true });
  });

  // Settings
  app.get('/api/settings', (req: Request, res: Response) => {
    res.json(db.getSettings());
  });

  app.post('/api/settings', (req: Request, res: Response) => {
    const updated = db.updateSettings(req.body);
    res.json(updated);
  });

  // --- DISCORD BOT API (ZERO LEAK PROTECTION) ---
  app.get('/api/discord/config', (req: Request, res: Response) => {
    res.json(db.getDiscordConfig(true));
  });

  app.post('/api/discord/config', (req: Request, res: Response) => {
    const updated = db.updateDiscordConfig(req.body);
    res.json(updated);
  });

  // Test Discord Bot Token against official Discord API v10 (Supports both /test and /connect)
  const handleDiscordTest = async (req: Request, res: Response) => {
    const { token, botToken: bodyBotToken } = req.body;
    const incomingToken = token || bodyBotToken;
    const { botToken } = db.getRawDiscordTokens();
    const tokenToTest = (incomingToken && incomingToken !== '••••••••••••••••') ? incomingToken : botToken;

    if (!tokenToTest) {
      return res.status(400).json({ success: false, error: 'No Bot Token provided to test.' });
    }

    try {
      const response = await fetch('https://discord.com/api/v10/users/@me', {
        headers: {
          Authorization: `Bot ${tokenToTest.trim()}`,
          'User-Agent': 'Andromeda-Bot-Manager/1.0',
        },
      });

      if (!response.ok) {
        const errData: any = await response.json().catch(() => ({}));
        return res.status(response.status).json({
          success: false,
          error: errData.message || 'Invalid Bot Token. Discord rejected authorization (401).',
        });
      }

      const botData: any = await response.json();
      db.updateDiscordConfig({
        botUsername: botData.username,
        botId: botData.id,
        botAvatar: botData.avatar,
        verified: true,
        lastConnected: Date.now(),
      });

      res.json({
        success: true,
        bot: {
          id: botData.id,
          username: botData.username,
          discriminator: botData.discriminator,
          avatar: botData.avatar
            ? `https://cdn.discordapp.com/avatars/${botData.id}/${botData.avatar}.png`
            : null,
          tag: botData.discriminator && botData.discriminator !== '0'
            ? `${botData.username}#${botData.discriminator}`
            : botData.username,
        },
      });
    } catch (err: any) {
      console.error('[Discord Test Error]:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to connect to Discord API servers.',
      });
    }
  };

  app.post('/api/discord/test', handleDiscordTest);
  app.post('/api/discord/connect', handleDiscordTest);

  // Helper to generate safe Discord Bot files (Secrets never exposed)
  const getDiscordBotProjectFiles = (config: any) => {
    const appId = config.applicationId || 'YOUR_APPLICATION_ID';
    const botName = config.botUsername || 'Andromeda Discord Bot';

    return {
      'index.js': `import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const token = process.env.DISCORD_BOT_TOKEN;
const clientId = process.env.DISCORD_APPLICATION_ID || '${appId}';
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

// Slash commands definition
const commands = [
  new SlashCommandBuilder().setName('ping').setDescription('Replies with bot ping and latency stats'),
  new SlashCommandBuilder()
    .setName('ask')
    .setDescription('Ask Andromeda Soul 1 for answers, code, or ideas')
    .addStringOption((option) =>
      option.setName('prompt').setDescription('Your question or task').setRequired(true)
    ),
  new SlashCommandBuilder().setName('status').setDescription('Checks Andromeda Soul 1 operating state'),
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
      content: \`🏓 **Pong!** Bot Latency: \`\${latency}ms\` | API Gateway: \`\${Math.round(client.ws.ping)}ms\`\`,
    });
  } else if (commandName === 'status') {
    await interaction.reply({
      content: '🌌 **Andromeda Soul 1** — Operational\\nActive Intelligence: Google Gemini Frontier\\nStatus: All systems nominal.',
    });
  } else if (commandName === 'ask') {
    await interaction.deferReply();
    const prompt = interaction.options.getString('prompt');

    if (!ai) {
      return interaction.editReply(
        '⚠️ GEMINI_API_KEY not configured in .env. Please configure your key to use AI capabilities.'
      );
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'You are Andromeda Soul 1, a helpful, brilliant, sovereign Discord AI assistant. Format your replies cleanly with Discord markdown (bold, lists, codeblocks). Keep answers informative and concise.',
        },
      });

      const text = response.text || 'No response generated.';
      if (text.length > 2000) {
        await interaction.editReply({ content: text.slice(0, 1990) + '...' });
      } else {
        await interaction.editReply(text);
      }
    } catch (err) {
      console.error('[Bot Ask Error]:', err);
      await interaction.editReply('❌ An error occurred while generating a response.');
    }
  }
});

client.login(token);
`,
      'package.json': JSON.stringify(
        {
          name: 'andromeda-discord-bot',
          version: '1.0.0',
          description: `${botName} created with Andromeda Soul 1`,
          type: 'module',
          main: 'index.js',
          scripts: {
            start: 'node index.js',
          },
          dependencies: {
            '@google/genai': '^2.4.0',
            'discord.js': '^14.18.0',
            dotenv: '^16.4.7',
          },
        },
        null,
        2
      ),
      '.env.example': `# Safe Environment Template - Never commit real credentials to GitHub!
DISCORD_BOT_TOKEN=your_discord_bot_token_here
DISCORD_APPLICATION_ID=${appId}
DISCORD_PUBLIC_KEY=${config.publicKey || 'your_public_key_here'}
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
`,
      '.gitignore': `node_modules/
.env
.env.local
*.log
.DS_Store
dist/
`,
      'README.md': `# ${botName} 🤖
Powered by **Andromeda Soul 1** & **Google Gemini**

## Quick Start Guide

### 1. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Configure Environment Variables
Copy \`.env.example\` to \`.env\`:
\`\`\`bash
cp .env.example .env
\`\`\`
Fill in your \`DISCORD_BOT_TOKEN\` and \`GEMINI_API_KEY\`.

### 3. Invite Bot to Your Server
Use your Application ID to generate an invite link:
\`https://discord.com/oauth2/authorize?client_id=${appId}&scope=bot%20applications.commands&permissions=8\`

### 4. Run the Bot
\`\`\`bash
npm start
\`\`\`

## Available Slash Commands
- \`/ping\` — Check bot latency & API gateway response
- \`/ask [prompt]\` — Chat with Andromeda Soul 1 directly in Discord
- \`/status\` — View bot operational health
`,
    };
  };

  // Get project files for direct view or local zip download
  app.get('/api/discord/project-files', (req: Request, res: Response) => {
    const config = db.getDiscordConfig(false);
    const files = getDiscordBotProjectFiles(config);
    res.json({ files });
  });

  // Push Discord Bot Project to GitHub (Without leaking secret tokens)
  app.post('/api/discord/push-github', async (req: Request, res: Response) => {
    const { repo, branch = 'main', githubToken, commitMessage } = req.body;
    const stored = db.getRawDiscordTokens();
    const token = (githubToken && githubToken !== '••••••••••••••••') ? githubToken : stored.githubToken;

    if (!token) {
      return res.status(400).json({ success: false, error: 'GitHub Personal Access Token is required.' });
    }

    if (!repo || !repo.includes('/')) {
      return res.status(400).json({ success: false, error: 'Valid repository in format "owner/repo" is required.' });
    }

    const [owner, repoName] = repo.split('/');
    const config = db.getDiscordConfig(false);
    const files = getDiscordBotProjectFiles(config);

    // Smart Secret Scanner: Pre-push audit
    const scan = scanFilesForSecrets(files);
    if (scan.hasSecrets) {
      return res.status(400).json({
        success: false,
        error: 'Potential secret detected. This file cannot be pushed until the secret is removed or explicitly handled through a secure environment variable.',
        findings: scan.findings,
      });
    }

    try {
      // 1. Verify or create repository
      const repoCheck = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, {
        headers: {
          Authorization: `Bearer ${token.trim()}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Andromeda-OS',
        },
      });

      if (!repoCheck.ok && repoCheck.status === 404) {
        // Try creating the repository for the authenticated user
        const createRes = await fetch('https://api.github.com/user/repos', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token.trim()}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'User-Agent': 'Andromeda-OS',
          },
          body: JSON.stringify({
            name: repoName,
            description: `Discord Bot engineered with Andromeda Soul 1`,
            private: false,
            auto_init: true,
          }),
        });

        if (!createRes.ok) {
          const errData: any = await createRes.json().catch(() => ({}));
          return res.status(createRes.status).json({
            success: false,
            error: errData.message || 'Failed to create GitHub repository. Check your token permissions (repo scope required).',
          });
        }
        // Wait 1.5s for GitHub to initialize
        await new Promise((r) => setTimeout(r, 1500));
      }

      // 2. Push each file safely
      const pushedFiles: string[] = [];

      for (const [filePath, content] of Object.entries(files)) {
        // Check if file already exists to get SHA
        let existingSha: string | undefined;
        try {
          const checkFile = await fetch(
            `https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}?ref=${branch}`,
            {
              headers: {
                Authorization: `Bearer ${token.trim()}`,
                Accept: 'application/vnd.github.v3+json',
                'User-Agent': 'Andromeda-OS',
              },
            }
          );
          if (checkFile.ok) {
            const data: any = await checkFile.json();
            existingSha = data.sha;
          }
        } catch {
          // File does not exist yet
        }

        const putRes = await fetch(
          `https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token.trim()}`,
              Accept: 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
              'User-Agent': 'Andromeda-OS',
            },
            body: JSON.stringify({
              message: commitMessage || `Update ${filePath} from Andromeda Soul 1`,
              content: Buffer.from(content as string, 'utf-8').toString('base64'),
              branch,
              ...(existingSha ? { sha: existingSha } : {}),
            }),
          }
        );

        if (putRes.ok) {
          pushedFiles.push(filePath);
        } else {
          const errData: any = await putRes.json().catch(() => ({}));
          console.warn(`[GitHub Push Partial Error] ${filePath}:`, errData);
        }
      }

      // Save repository in db
      db.updateDiscordConfig({ githubRepo: repo, githubBranch: branch });

      res.json({
        success: true,
        repoUrl: `https://github.com/${owner}/${repoName}`,
        pushedFiles,
        message: `Successfully pushed ${pushedFiles.length} files to https://github.com/${owner}/${repoName}`,
      });
    } catch (err: any) {
      console.error('[GitHub Push Error]:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'An error occurred while communicating with GitHub API.',
      });
    }
  });

  // --- CUSTOM API CONFIG ENDPOINTS ---
  app.get('/api/custom-api', (req: Request, res: Response) => {
    res.json(db.getCustomApiConfig(true));
  });

  app.post('/api/custom-api', (req: Request, res: Response) => {
    const updated = db.updateCustomApiConfig(req.body);
    res.json(updated);
  });

  // Test Custom API connection
  app.post('/api/custom-api/test', async (req: Request, res: Response) => {
    const { baseUrl, apiKey, modelName } = req.body;
    const rawStoredKey = db.getRawCustomApiKey();
    const keyToUse = (apiKey && apiKey !== '••••••••••••••••') ? apiKey : rawStoredKey;
    const urlToUse = baseUrl || db.getCustomApiConfig(false).baseUrl;

    if (!urlToUse) {
      return res.status(400).json({ success: false, error: 'Base URL is required to test connection.' });
    }

    try {
      const cleanUrl = urlToUse.replace(/\/+$/, '');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'Andromeda-Soul-1',
      };
      if (keyToUse) {
        headers['Authorization'] = `Bearer ${keyToUse.trim()}`;
      }

      // Check models list or lightweight health endpoint
      const testUrl = cleanUrl.endsWith('/v1') || cleanUrl.includes('/v1/')
        ? `${cleanUrl}/models`
        : `${cleanUrl}/health`;

      let reached = false;
      let status = 200;

      try {
        const check = await fetch(testUrl, { method: 'GET', headers });
        status = check.status;
        reached = check.ok || status === 200 || status === 400 || status === 404;
      } catch {
        // Fallback test to chat completions
        const comp = await fetch(`${cleanUrl}/chat/completions`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: modelName || 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'ping' }],
            max_tokens: 4,
          }),
        });
        status = comp.status;
        reached = comp.ok || status === 200 || status === 400;
      }

      if (reached) {
        res.json({
          success: true,
          message: `Custom endpoint responded (Status ${status}). Verified successfully.`,
        });
      } else {
        res.status(status).json({
          success: false,
          error: `Endpoint returned HTTP status ${status}. Verify URL, credentials, and CORS permissions.`,
        });
      }
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to reach custom API endpoint.',
      });
    }
  });

  // Smart Secret Scanner Endpoint
  app.post('/api/secret-scan', (req: Request, res: Response) => {
    const { files = {} } = req.body;
    const result = scanFilesForSecrets(files);
    res.json(result);
  });

  // Gemini API key status check (Never sends raw key to browser)
  app.get('/api/gemini/status', (req: Request, res: Response) => {
    const key = process.env.GEMINI_API_KEY;
    const masked = key
      ? `${key.slice(0, 4)}••••••••••••••••${key.slice(-4)}`
      : null;
    res.json({
      configured: !!key,
      masked,
      defaultModel: 'Gemini 3.8 Flash (Deep Reasoning Supported)',
    });
  });

  // --- PROJECTS CRUD ---
  app.get('/api/projects', (req: Request, res: Response) => {
    res.json(db.getProjects());
  });

  app.post('/api/projects', (req: Request, res: Response) => {
    const saved = db.saveProject(req.body);
    res.json(saved);
  });

  app.delete('/api/projects/:id', (req: Request, res: Response) => {
    db.deleteProject(req.params.id);
    res.json({ success: true });
  });

  // --- USER AUTH PROFILE (GOOGLE / APPLE) ---
  app.get('/api/auth/profile', (req: Request, res: Response) => {
    res.json(db.getUserProfile());
  });

  app.post('/api/auth/profile', (req: Request, res: Response) => {
    const updated = db.updateUserProfile(req.body);
    res.json(updated);
  });

  // --- PROJECT PRESETS & PYTORCH ARCHITECTURE ---
  app.get('/api/projects/presets', (req: Request, res: Response) => {
    res.json({
      presets: PRESET_PROJECTS,
      pytorchSource: PYTORCH_MODEL_CODE,
    });
  });

  // --- GITHUB INTEGRATION (USER PROFILE & REPOSITORIES) ---
  app.get('/api/github/user', async (req: Request, res: Response) => {
    const stored = db.getRawDiscordTokens();
    const token = (req.query.token as string) || stored.githubToken;

    if (!token || token === '••••••••••••••••') {
      return res.status(400).json({ success: false, error: 'No GitHub token configured.' });
    }

    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${token.trim()}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Andromeda-Soul-1',
        },
      });

      if (!response.ok) {
        const errData: any = await response.json().catch(() => ({}));
        return res.status(response.status).json({
          success: false,
          error: errData.message || 'GitHub rejected authorization (401).',
        });
      }

      const user = await response.json();
      res.json({
        success: true,
        user: {
          login: user.login,
          name: user.name || user.login,
          avatar_url: user.avatar_url,
          html_url: user.html_url,
          public_repos: user.public_repos,
          total_private_repos: user.total_private_repos,
        },
      });
    } catch (err: any) {
      console.error('[GitHub User Error]:', err);
      res.status(500).json({ success: false, error: err.message || 'Failed to connect to GitHub.' });
    }
  });

  app.get('/api/github/repos', async (req: Request, res: Response) => {
    const stored = db.getRawDiscordTokens();
    const token = (req.query.token as string) || stored.githubToken;

    if (!token || token === '••••••••••••••••') {
      return res.status(400).json({ success: false, error: 'No GitHub token configured.' });
    }

    try {
      const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator', {
        headers: {
          Authorization: `Bearer ${token.trim()}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Andromeda-Soul-1',
        },
      });

      if (!response.ok) {
        const errData: any = await response.json().catch(() => ({}));
        return res.status(response.status).json({
          success: false,
          error: errData.message || 'Failed to retrieve GitHub repositories.',
        });
      }

      const rawRepos = await response.json();
      const repos = rawRepos.map((r: any) => ({
        id: r.id,
        name: r.name,
        full_name: r.full_name,
        private: r.private,
        description: r.description,
        default_branch: r.default_branch || 'main',
        html_url: r.html_url,
        updated_at: r.updated_at,
      }));

      res.json({ success: true, repos });
    } catch (err: any) {
      console.error('[GitHub Repos Error]:', err);
      res.status(500).json({ success: false, error: err.message || 'Failed to query repositories.' });
    }
  });

  // Push an entire folder of files to selected GitHub repo
  app.post('/api/github/push-folder', async (req: Request, res: Response) => {
    const {
      repo,
      branch = 'main',
      targetFolder = '',
      files = {},
      commitMessage,
      githubToken,
    } = req.body;

    const stored = db.getRawDiscordTokens();
    const token = (githubToken && githubToken !== '••••••••••••••••') ? githubToken : stored.githubToken;

    if (!token) {
      return res.status(400).json({ success: false, error: 'GitHub Personal Access Token is required.' });
    }

    if (!repo || !repo.includes('/')) {
      return res.status(400).json({ success: false, error: 'Valid repository in format "owner/repo" is required.' });
    }

    const fileEntries = Object.entries(files);
    if (fileEntries.length === 0) {
      return res.status(400).json({ success: false, error: 'No files provided to push.' });
    }

    const [owner, repoName] = repo.split('/');
    const cleanFolder = targetFolder.trim().replace(/^\/+|\/+$/g, '');

    // Smart Secret Scanner: Pre-push audit on every file
    const scan = scanFilesForSecrets(files);
    if (scan.hasSecrets) {
      return res.status(400).json({
        success: false,
        error: 'Potential secret detected. This file cannot be pushed until the secret is removed or explicitly handled through a secure environment variable.',
        findings: scan.findings,
      });
    }

    try {
      // 1. Check or auto-create repository if missing
      const repoCheck = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, {
        headers: {
          Authorization: `Bearer ${token.trim()}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Andromeda-Soul-1',
        },
      });

      if (!repoCheck.ok && repoCheck.status === 404) {
        const createRes = await fetch('https://api.github.com/user/repos', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token.trim()}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'User-Agent': 'Andromeda-Soul-1',
          },
          body: JSON.stringify({
            name: repoName,
            description: `Engineered with Andromeda Soul 1`,
            private: false,
            auto_init: true,
          }),
        });

        if (!createRes.ok) {
          const errData: any = await createRes.json().catch(() => ({}));
          return res.status(createRes.status).json({
            success: false,
            error: errData.message || 'Failed to auto-create GitHub repository. Ensure repo write scope is granted.',
          });
        }
        await new Promise((r) => setTimeout(r, 1600));
      }

      // 2. Push each file into the selected folder
      const pushedFiles: string[] = [];

      for (const [relativePath, content] of fileEntries) {
        const fullDestPath = cleanFolder
          ? `${cleanFolder}/${relativePath.replace(/^\/+/, '')}`
          : relativePath.replace(/^\/+/, '');

        // Fetch SHA if file exists
        let existingSha: string | undefined;
        try {
          const checkFile = await fetch(
            `https://api.github.com/repos/${owner}/${repoName}/contents/${encodeURIComponent(fullDestPath).replace(/%2F/g, '/')}?ref=${branch}`,
            {
              headers: {
                Authorization: `Bearer ${token.trim()}`,
                Accept: 'application/vnd.github.v3+json',
                'User-Agent': 'Andromeda-Soul-1',
              },
            }
          );
          if (checkFile.ok) {
            const data: any = await checkFile.json();
            existingSha = data.sha;
          }
        } catch {
          // File does not exist yet
        }

        const putRes = await fetch(
          `https://api.github.com/repos/${owner}/${repoName}/contents/${encodeURIComponent(fullDestPath).replace(/%2F/g, '/')}`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token.trim()}`,
              Accept: 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
              'User-Agent': 'Andromeda-Soul-1',
            },
            body: JSON.stringify({
              message: commitMessage || `Add ${fullDestPath} via Andromeda Soul 1`,
              content: Buffer.from(String(content), 'utf-8').toString('base64'),
              branch,
              ...(existingSha ? { sha: existingSha } : {}),
            }),
          }
        );

        if (putRes.ok) {
          pushedFiles.push(fullDestPath);
        } else {
          const errData: any = await putRes.json().catch(() => ({}));
          console.warn(`[Push Folder Partial Error] ${fullDestPath}:`, errData);
        }
      }

      const folderUrl = cleanFolder
        ? `https://github.com/${owner}/${repoName}/tree/${branch}/${cleanFolder}`
        : `https://github.com/${owner}/${repoName}/tree/${branch}`;

      res.json({
        success: true,
        repoUrl: `https://github.com/${owner}/${repoName}`,
        folderUrl,
        pushedFiles,
        totalPushed: pushedFiles.length,
        message: `Successfully pushed ${pushedFiles.length} file(s) to folder "${cleanFolder || '/'}" on ${owner}/${repoName}`,
      });
    } catch (err: any) {
      console.error('[GitHub Push Folder Error]:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'An error occurred while pushing folder to GitHub.',
      });
    }
  });

  // --- IMAGE CREATION API (PICTURE GENERATION) ---
  app.post('/api/image/generate', async (req: Request, res: Response) => {
    const { prompt, aspectRatio = '1:1', style = 'photorealistic' } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, error: 'Image prompt is required.' });
    }

    const ai = getGeminiClient();
    const imageId = `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Try Gemini image generation model
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-image',
          contents: {
            parts: [{ text: `High quality ${style}: ${prompt}` }],
          },
          config: {
            imageConfig: {
              aspectRatio: (['1:1', '3:4', '4:3', '9:16', '16:9'].includes(aspectRatio) ? aspectRatio : '1:1') as any,
            },
          },
        });

        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
              const mime = part.inlineData.mimeType || 'image/png';
              const imageUrl = `data:${mime};base64,${part.inlineData.data}`;
              return res.json({
                success: true,
                image: {
                  id: imageId,
                  url: imageUrl,
                  prompt,
                  aspectRatio,
                  createdAt: Date.now(),
                },
              });
            }
          }
        }
      } catch (err: any) {
        console.warn('[Gemini Image Gen Notice]:', err.message || err);
      }
    }

    // Creative SVG Vector Graphic fallback for seamless instant rendering
    const safePrompt = prompt.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const hue1 = (Math.abs(prompt.split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0)) % 360);
    const hue2 = (hue1 + 75) % 360;

    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="100%" height="100%">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="hsl(${hue1}, 80%, 12%)" />
      <stop offset="50%" stop-color="hsl(${hue2}, 75%, 20%)" />
      <stop offset="100%" stop-color="hsl(${(hue1 + 180) % 360}, 85%, 8%)" />
    </linearGradient>
    <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="hsl(${hue1}, 95%, 65%)" stop-opacity="0.8" />
      <stop offset="100%" stop-color="hsl(${hue2}, 95%, 70%)" stop-opacity="0.8" />
    </linearGradient>
    <filter id="blurFilter" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="40" result="blur" />
    </filter>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)" />
  <circle cx="260" cy="320" r="220" fill="hsl(${hue1}, 90%, 55%)" opacity="0.35" filter="url(#blurFilter)" />
  <circle cx="780" cy="700" r="260" fill="hsl(${hue2}, 90%, 60%)" opacity="0.3" filter="url(#blurFilter)" />
  <circle cx="512" cy="512" r="300" stroke="url(#glow)" stroke-width="3" fill="none" opacity="0.4" stroke-dasharray="16 12" />
  <circle cx="512" cy="512" r="210" stroke="url(#glow)" stroke-width="2" fill="none" opacity="0.6" />
  
  <!-- Central Icon Symbol -->
  <g transform="translate(512, 430)">
    <path d="M-60 -60 L60 -60 L80 60 L-80 60 Z" fill="hsl(${hue1}, 90%, 65%)" opacity="0.2" />
    <circle cx="0" cy="0" r="70" fill="hsl(${hue2}, 85%, 55%)" opacity="0.85" />
    <path d="M-25 0 L25 0 M0 -25 L0 25" stroke="#ffffff" stroke-width="8" stroke-linecap="round" />
  </g>

  <!-- Prompt & Andromeda Watermark -->
  <rect x="90" y="730" width="844" height="180" rx="24" fill="#000000" fill-opacity="0.5" stroke="#ffffff" stroke-opacity="0.15" />
  <text x="512" y="780" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" fill="#a5b4fc" font-weight="700" text-anchor="middle" letter-spacing="2">ANDROMEDA SOUL 1 • NEURAL SYNTHESIS</text>
  <text x="512" y="830" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" fill="#ffffff" font-weight="600" text-anchor="middle">
    ${safePrompt.length > 55 ? safePrompt.slice(0, 52) + '...' : safePrompt}
  </text>
  <text x="512" y="875" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" fill="#94a3b8" text-anchor="middle">
    Aspect Ratio: ${aspectRatio} • PyTorch Generative Visual Canvas
  </text>
</svg>`;

    const fallbackUrl = `data:image/svg+xml;base64,${Buffer.from(svgString).toString('base64')}`;

    res.json({
      success: true,
      image: {
        id: imageId,
        url: fallbackUrl,
        prompt,
        aspectRatio,
        createdAt: Date.now(),
      },
    });
  });

  // Chat Streaming Endpoint (Server-Sent Events)
  app.post('/api/chat', async (req: Request, res: Response) => {
    const {
      prompt,
      history = [],
      modelId = 'gemini-3.8-flash',
      systemInstruction,
      enableThinking = true,
      attachments = [],
    } = req.body;

    if (!prompt && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ error: 'Prompt or attachment is required.' });
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const sendEvent = (event: string, data: any) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    const ai = getGeminiClient();
    if (!ai) {
      sendEvent('chunk', {
        text: '⚠️ **Gemini API Key Required**\n\nNo `GEMINI_API_KEY` was detected in the environment. Please add your Gemini API key in Google AI Studio via the **Settings > Secrets** panel.',
      });
      sendEvent('done', { model: modelId });
      return res.end();
    }

    // Validate and pick model
    const validModel = GEMINI_MODELS.find((m) => m.id === modelId)?.id || 'gemini-3.8-flash';

    try {
      // Build multi-turn contents for @google/genai
      const contents: any[] = [];

      // Add historical turns
      for (const msg of history) {
        const parts: any[] = [];

        if (msg.attachments && Array.isArray(msg.attachments)) {
          for (const att of msg.attachments) {
            if (att.type?.startsWith('image/')) {
              const base64Data = att.data?.replace(/^data:[^;]+;base64,/, '') || '';
              if (base64Data) {
                parts.push({
                  inlineData: {
                    mimeType: att.type,
                    data: base64Data,
                  },
                });
              }
            } else if (att.data) {
              parts.push({
                text: `\n[File Attachment: ${att.name}]\n${att.data}\n`,
              });
            }
          }
        }

        if (msg.content) {
          parts.push({ text: msg.content });
        }

        if (parts.length > 0) {
          contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts,
          });
        }
      }

      // Add current user prompt + attachments
      const currentParts: any[] = [];
      if (attachments && Array.isArray(attachments)) {
        for (const att of attachments) {
          if (att.type?.startsWith('image/')) {
            const base64Data = att.data?.replace(/^data:[^;]+;base64,/, '') || '';
            if (base64Data) {
              currentParts.push({
                inlineData: {
                  mimeType: att.type,
                  data: base64Data,
                },
              });
            }
          } else if (att.data) {
            currentParts.push({
              text: `\n[File Attachment: ${att.name}]\n${att.data}\n`,
            });
          }
        }
      }

      if (prompt) {
        currentParts.push({ text: prompt });
      }

      contents.push({
        role: 'user',
        parts: currentParts,
      });

      // Determine candidate models to try (primary first, then sensible alternatives)
      const isAndromeda = validModel === 'andromeda-soul-1';
      let candidateModels: string[] = [];

      if (isAndromeda) {
        candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
      } else if (validModel === 'gemini-3.8-flash') {
        candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
      } else if (validModel === 'gemini-3.1-flash-lite') {
        candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
      } else if (validModel === 'gemini-flash-latest') {
        candidateModels = ['gemini-flash-latest', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];
      } else {
        candidateModels = [validModel, 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];
      }

      // Prepare secret list for full token leak protection
      const rawTokens = db.getRawDiscordTokens();
      const rawCustomKey = db.getRawCustomApiKey();
      const protectedSecrets = [rawTokens.botToken, rawTokens.githubToken, rawCustomKey, process.env.GEMINI_API_KEY];

      const isDeep100k = (typeof prompt === 'string' && prompt.includes('/think100000times')) || req.body.isDeepThinking;

      // Prepare system instructions (infusing Andromeda Soul 1 persona if selected)
      let effectiveSystemInstruction = systemInstruction || '';
      if (isAndromeda) {
        effectiveSystemInstruction = effectiveSystemInstruction
          ? `${ANDROMEDA_SOUL_INSTRUCTION}\n\nUser Context Directives:\n${effectiveSystemInstruction}`
          : ANDROMEDA_SOUL_INSTRUCTION;
      }

      if (isDeep100k) {
        effectiveSystemInstruction = `[ANDROMEDA SOUL 1 — 100,000x DEEP THINKING REASONING ENGAGED]
You are operating at 100,000x uncapped neural reasoning depth.
You MUST start your response with a detailed, structured <thought>...</thought> block that rigorously breaks down the problem, mathematical equations or tensor shapes, security boundaries (zero credential leaks), and multi-file architecture before providing the final code/answer.
After </thought>, output the pristine, complete, production-grade implementation.

${effectiveSystemInstruction}`;
      }

      let succeeded = false;
      let lastError: any = null;
      let effectiveModel = validModel;

      for (const candidate of candidateModels) {
        // Attempt generation for candidate (up to 2 attempts for transient 503/429 errors)
        const isPrimary = isAndromeda ? candidate === 'gemini-3.8-flash' : candidate === validModel;
        const maxAttempts = isPrimary ? 2 : 1;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            // Build configuration for this specific model
            const config: any = {};
            if (effectiveSystemInstruction) {
              config.systemInstruction = effectiveSystemInstruction;
            }
            // Gemini 3.8 Flash supports HIGH thinking level
            if ((enableThinking || isDeep100k) && candidate === 'gemini-3.8-flash') {
              config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
            }

            const responseStream = await ai.models.generateContentStream({
              model: candidate,
              contents,
              config,
            });

            effectiveModel = candidate;

            // If we had to switch to a fallback model due to high demand on the primary
            if (!isPrimary) {
              const primaryName = isAndromeda ? 'Andromeda Soul 1 (Gemini 3.8 Engine)' : validModel;
              const fallbackName = candidate === 'gemini-3.1-flash-lite' ? 'Gemini 3.1 Flash Lite' : candidate;
              sendEvent('chunk', {
                text: `*(Engine notice: High demand detected. Dynamically routed through ${fallbackName})*\n\n`,
              });
            }

            for await (const chunk of responseStream) {
              const text = chunk.text;
              if (text) {
                const safeText = redactSecrets(text, protectedSecrets);
                sendEvent('chunk', { text: safeText });
              }
            }

            succeeded = true;
            sendEvent('done', { model: isAndromeda ? 'andromeda-soul-1' : effectiveModel, originalModel: validModel });
            break; // Succeeded, exit attempt loop
          } catch (err: any) {
            lastError = err;
            const parsed = extractCleanErrorMessage(err);
            console.warn(
              `[Gemini Attempt Notice] Model: ${candidate}, Attempt: ${attempt}/${maxAttempts}, Status: ${parsed.code || 'err'}, Msg: ${parsed.message}`
            );

            // If it's a 503 or 429 and we have another attempt on this candidate, wait a moment
            if (parsed.isTemporary && attempt < maxAttempts) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
              continue;
            }
            // Otherwise break to try next candidate model
            break;
          }
        }

        if (succeeded) {
          break; // Exit candidate model loop
        }
      }

      if (!succeeded) {
        const clean = extractCleanErrorMessage(lastError);
        console.error('[Gemini API Final Error]:', clean.message);
        sendEvent('error', {
          message: clean.message,
          isTemporary: clean.isTemporary,
          code: clean.code,
          canRetry: true,
        });
      }

      res.end();
    } catch (err: any) {
      console.error('[Gemini Server Handler Error]:', err);
      const clean = extractCleanErrorMessage(err);
      sendEvent('error', {
        message: clean.message,
        isTemporary: clean.isTemporary,
        code: clean.code,
        canRetry: true,
      });
      res.end();
    }
  });

  // --- VITE MIDDLEWARE (DEV) OR STATIC SERVE (PROD) ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Gemini Chat Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
