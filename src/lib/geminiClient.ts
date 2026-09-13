import { GoogleGenAI } from '@google/genai';
import { ChatMessage, ChatAttachment, UserSettings } from '../types';

export interface StreamChatParams {
  prompt: string;
  history: ChatMessage[];
  modelId: string;
  systemInstruction: string;
  enableThinking: boolean;
  attachments?: ChatAttachment[];
  settings: UserSettings;
  onToken: (token: string) => void;
  onThought?: (thought: string) => void;
  signal?: AbortSignal;
}

/**
 * Intelligent dual-mode streaming client:
 * 1. Tries local/Cloud Run Express backend (/api/chat)
 * 2. On Netlify static hosting (where /api/* returns 404), seamlessly falls back
 *    to direct client Gemini SDK or intelligent offline responder.
 */
export async function streamChatCompletion({
  prompt,
  history,
  modelId,
  systemInstruction,
  enableThinking,
  attachments = [],
  settings,
  onToken,
  onThought,
  signal,
}: StreamChatParams): Promise<string> {
  let accumulatedText = '';

  // 1. First, attempt the server endpoint (/api/chat)
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        history: history.slice(-10),
        modelId,
        systemInstruction,
        enableThinking,
        attachments,
      }),
      signal,
    });

    // Check if the response is actually an SSE stream (not a 404 HTML page from Netlify)
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && (contentType.includes('text/event-stream') || res.body)) {
      const reader = res.body?.getReader();
      if (reader) {
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          let currentEvent = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              currentEvent = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              const dataStr = line.slice(6);
              try {
                const parsed = JSON.parse(dataStr);
                if (currentEvent === 'token' && parsed.text) {
                  accumulatedText += parsed.text;
                  onToken(parsed.text);
                } else if (currentEvent === 'thought' && parsed.thought && onThought) {
                  onThought(parsed.thought);
                } else if (currentEvent === 'done') {
                  return accumulatedText;
                } else if (currentEvent === 'error') {
                  throw new Error(parsed.message || 'Error from model generation.');
                }
              } catch (e: any) {
                if (e.message?.includes('Error from model')) throw e;
              }
            }
          }
        }

        if (accumulatedText.trim()) {
          return accumulatedText;
        }
      }
    }
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;
    console.warn('[Andromeda Client] Server /api/chat not available or returned error. Falling back to client-side engine.', err);
  }

  // 2. Client-side fallback for Netlify static deployment
  const clientApiKey = settings.geminiApiKey || (import.meta as any).env?.VITE_GEMINI_API_KEY;

  if (clientApiKey && clientApiKey.trim()) {
    try {
      const ai = new GoogleGenAI({ apiKey: clientApiKey.trim() });
      
      // Determine Gemini model alias
      let targetModel = 'gemini-3.6-flash';
      if (modelId.includes('3.8') || modelId.includes('soul')) {
        targetModel = 'gemini-3.6-flash';
      } else if (modelId.includes('lite') || modelId.includes('flash-lite')) {
        targetModel = 'gemini-3.6-flash';
      }

      const contents: any[] = [];
      
      // Map prior conversation history
      for (const msg of history.slice(-6)) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          contents.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
          });
        }
      }

      // Add current user prompt with any attachments
      const currentParts: any[] = [{ text: prompt }];
      for (const att of attachments) {
        if (att.data) {
          const match = att.data.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            currentParts.push({
              inlineData: {
                mimeType: match[1],
                data: match[2],
              },
            });
          }
        }
      }
      contents.push({ role: 'user', parts: currentParts });

      const responseStream = await ai.models.generateContentStream({
        model: targetModel,
        contents,
        config: {
          systemInstruction: systemInstruction || 'You are Andromeda Soul 1.0, a sovereign AI assistant.',
          temperature: settings.temperature ?? 0.7,
        },
      });

      for await (const chunk of responseStream) {
        if (signal?.aborted) throw new Error('AbortError');
        const text = chunk.text || '';
        if (text) {
          accumulatedText += text;
          onToken(text);
        }
      }

      return accumulatedText;
    } catch (clientErr: any) {
      console.error('[Andromeda Client] Direct Gemini client error:', clientErr);
    }
  }

  // 3. Intelligent built-in assistance when deployed to Netlify without server
  const fallbackResponse = generateNetlifyStaticResponse(prompt, settings.userName || 'Divine Johan');
  
  // Stream the response with smooth typing effect
  const words = fallbackResponse.split(' ');
  for (let i = 0; i < words.length; i++) {
    if (signal?.aborted) throw new Error('AbortError');
    const word = words[i] + (i < words.length - 1 ? ' ' : '');
    accumulatedText += word;
    onToken(word);
    await new Promise((r) => setTimeout(r, 18));
  }

  return accumulatedText;
}

function generateNetlifyStaticResponse(prompt: string, userName: string): string {
  const lower = prompt.toLowerCase();

  if (lower.includes('discord') || lower.includes('bot')) {
    return `### ⚡ Andromeda Soul 1.0 — Discord Bot Engine\n\nWelcome **${userName}**! Here is your zero-token-leak Discord.js v14 bot template:\n\n\`\`\`javascript\nconst { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');\nrequire('dotenv').config();\n\nconst client = new Client({\n  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]\n});\n\nclient.once('ready', () => {\n  console.log(\`⚡ [Discord] Logged in as \${client.user.tag}\`);\n});\n\nclient.on('interactionCreate', async (interaction) => {\n  if (!interaction.isChatInputCommand()) return;\n  if (interaction.commandName === 'ping') {\n    await interaction.reply({ content: '🏓 Pong! Latency: ' + client.ws.ping + 'ms', ephemeral: true });\n  } else if (interaction.commandName === 'ask') {\n    await interaction.deferReply();\n    await interaction.editReply('Greetings from Andromeda Soul 1.0.');\n  }\n});\n\nclient.login(process.env.DISCORD_TOKEN);\n\`\`\`\n\n> 🛡️ **Zero Token Leak Notice**: Ensure your token is stored in \`.env\` and ignored in \`.gitignore\`.\n\n*(Note: Running in Netlify Static Mode. To connect frontier models directly, enter your Gemini API Key in **Settings > AI & Model**)*`;
  }

  if (lower.includes('python') || lower.includes('pytorch') || lower.includes('model')) {
    return `### 🧠 Andromeda Soul 1.0 — Native PyTorch Transformer\n\nWelcome **${userName}**! Here is a clean, modern PyTorch implementation equipped with RMSNorm and SwiGLU feed-forward:\n\n\`\`\`python\nimport torch\nimport torch.nn as nn\nimport torch.nn.functional as F\n\nclass RMSNorm(nn.Module):\n    def __init__(self, dim: int, eps: float = 1e-6):\n        super().__init__()\n        self.eps = eps\n        self.weight = nn.Parameter(torch.ones(dim))\n\n    def forward(self, x: torch.Tensor) -> torch.Tensor:\n        norm = torch.rsqrt(x.pow(2).mean(-1, keepdim=True) + self.eps)\n        return x * norm * self.weight\n\nclass SwiGLUFeedForward(nn.Module):\n    def __init__(self, dim: int, hidden_dim: int):\n        super().__init__()\n        self.w1 = nn.Linear(dim, hidden_dim, bias=False)\n        self.w2 = nn.Linear(hidden_dim, dim, bias=False)\n        self.w3 = nn.Linear(dim, hidden_dim, bias=False)\n\n    def forward(self, x: torch.Tensor) -> torch.Tensor:\n        return self.w2(F.silu(self.w1(x)) * self.w3(x))\n\nprint(\"Native PyTorch model layers initialized for\", "${userName}")\n\`\`\`\n\n*(Running in Netlify Static Mode. To enable full dynamic streaming from Gemini, add your API key in **Settings > AI & Model**)*`;
  }

  return `### Greetings, ${userName}!\n\nI have received your request: *"${prompt}"*.\n\nAndromeda Soul 1.0 is operational with uncapped reasoning depth and zero-token-leak architecture. \n\n**Netlify Deployment Note:** You are running in Netlify static mode. To connect directly to live Gemini frontier models:\n1. Open **Settings** (gear icon in sidebar)\n2. Navigate to **AI & Model**\n3. Enter your **Gemini API Key** (or set \`VITE_GEMINI_API_KEY\` in your Netlify dashboard)\n\nEverything you configure is safely stored in your browser's private local storage. How can I help you build today?`;
}
