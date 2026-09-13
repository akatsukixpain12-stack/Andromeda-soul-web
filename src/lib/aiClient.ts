import { GoogleGenAI } from '@google/genai';
import { ChatMessage, ChatAttachment, UserSettings, AIModelOption } from '../types';
import { AI_MODELS } from '../data/models';

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
 * Universal Multi-Provider AI Streaming Client
 * Supports:
 * - Google Gemini (Free Tier / Official API)
 * - Anthropic Claude 3.7 / 3.5 Style with Extended Thinking
 * - Ollama (100% Free & Local via http://localhost:11434)
 * - LM Studio (100% Free & Local via http://localhost:1234/v1)
 * - Groq (Free fast inference)
 * - OpenRouter (Free community models)
 */
export async function streamMultiProviderChat({
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
  const modelMeta = AI_MODELS.find((m) => m.id === modelId) || AI_MODELS[0];
  const provider = modelMeta.provider;

  // 1. OLLAMA (LOCAL & 100% FREE)
  if (provider === 'ollama') {
    return streamOllama({
      prompt,
      history,
      modelMeta,
      systemInstruction,
      attachments,
      settings,
      onToken,
      onThought,
      signal,
    });
  }

  // 2. LM STUDIO (LOCAL & 100% FREE)
  if (provider === 'lmstudio') {
    return streamLMStudio({
      prompt,
      history,
      modelMeta,
      systemInstruction,
      attachments,
      settings,
      onToken,
      onThought,
      signal,
    });
  }

  // 3. GROQ (FAST FREE TIER)
  if (provider === 'groq') {
    return streamOpenAICompatible({
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      apiKey: settings.groqApiKey || '',
      modelName: settings.groqModel || 'llama-3.3-70b-versatile',
      prompt,
      history,
      systemInstruction,
      onToken,
      signal,
      providerName: 'Groq Free Tier',
    });
  }

  // 4. OPENROUTER (COMMUNITY FREE TIER)
  if (provider === 'openrouter') {
    return streamOpenAICompatible({
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      apiKey: settings.openRouterApiKey || '',
      modelName: settings.openRouterModel || 'deepseek/deepseek-r1:free',
      prompt,
      history,
      systemInstruction,
      onToken,
      onThought,
      signal,
      providerName: 'OpenRouter Free',
    });
  }

  // 5. GOOGLE GEMINI & CLAUDE
  return streamGeminiOrClaude({
    prompt,
    history,
    modelId,
    modelMeta,
    systemInstruction,
    enableThinking,
    attachments,
    settings,
    onToken,
    onThought,
    signal,
  });
}

/**
 * Streams response from local Ollama instance (e.g. http://localhost:11434)
 */
async function streamOllama({
  prompt,
  history,
  modelMeta,
  systemInstruction,
  attachments,
  settings,
  onToken,
  onThought,
  signal,
}: {
  prompt: string;
  history: ChatMessage[];
  modelMeta: AIModelOption;
  systemInstruction: string;
  attachments: ChatAttachment[];
  settings: UserSettings;
  onToken: (token: string) => void;
  onThought?: (thought: string) => void;
  signal?: AbortSignal;
}): Promise<string> {
  const host = (settings.ollamaHost || 'http://localhost:11434').replace(/\/+$/, '');
  let targetModel = settings.ollamaModel || 'deepseek-r1:8b';

  if (modelMeta.id === 'ollama-llama3.2') targetModel = 'llama3.2';
  if (modelMeta.id === 'ollama-deepseek-r1') targetModel = 'deepseek-r1:8b';
  if (modelMeta.id === 'ollama-qwen2.5-coder') targetModel = 'qwen2.5-coder';
  if (modelMeta.id === 'ollama-mistral') targetModel = 'mistral';

  const messages: any[] = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }

  for (const m of history.slice(-8)) {
    messages.push({ role: m.role, content: m.content });
  }

  // Handle images for multimodal Ollama (llava, etc.)
  const images: string[] = [];
  for (const att of attachments) {
    if (att.type.startsWith('image/') && att.data) {
      const cleanBase64 = att.data.replace(/^data:[^;]+;base64,/, '');
      images.push(cleanBase64);
    }
  }

  messages.push({
    role: 'user',
    content: prompt,
    ...(images.length > 0 ? { images } : {}),
  });

  let accumulated = '';
  let inThinkBlock = false;
  let thoughtBuffer = '';

  try {
    const res = await fetch(`${host}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: targetModel,
        messages,
        stream: true,
      }),
      signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Ollama returned status ${res.status}: ${errText || res.statusText}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('Could not open readable stream to Ollama.');

    const decoder = new TextDecoder();
    let partialLine = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      partialLine += decoder.decode(value, { stream: true });
      const lines = partialLine.split('\n');
      partialLine = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          const chunk = parsed.message?.content || '';

          if (chunk) {
            // Handle DeepSeek-R1 <think> tags for reasoning accordion
            if (chunk.includes('<think>')) {
              inThinkBlock = true;
            }

            if (inThinkBlock) {
              thoughtBuffer += chunk;
              if (onThought) {
                const cleanThought = thoughtBuffer
                  .replace(/<\/?think>/g, '')
                  .trim();
                onThought(cleanThought);
              }
              if (chunk.includes('</think>')) {
                inThinkBlock = false;
              }
            } else {
              accumulated += chunk;
              onToken(chunk);
            }
          }
        } catch {
          // ignore incomplete JSON fragment
        }
      }
    }

    if (accumulated.trim() || thoughtBuffer.trim()) {
      return accumulated;
    }
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;

    // Friendly local Ollama setup instruction
    const fallbackMessage = `⚠️ **Could Not Connect to Local Ollama**\n\nUnable to reach Ollama at \`${host}\`.\n\n### How to Run Ollama for Free:\n1. **Install Ollama** (if not already installed) from [ollama.com](https://ollama.com)\n2. **Start the Ollama server** in your terminal:\n   \`\`\`bash\n   ollama serve\n   \`\`\`\n3. **Pull and run a model** (e.g. DeepSeek-R1 or Llama 3.2):\n   \`\`\`bash\n   ollama run ${targetModel}\n   \`\`\`\n4. If running from a browser origin, enable CORS by starting Ollama with:\n   \`\`\`bash\n   OLLAMA_ORIGINS="*" ollama serve\n   \`\`\`\n\n*You can also switch to **Google Gemini (Free Tier)** in the top model menu to chat immediately without running anything locally!*`;

    return streamTextSimulation(fallbackMessage, onToken, signal);
  }

  return accumulated;
}

/**
 * Streams response from local LM Studio server (http://localhost:1234/v1)
 */
async function streamLMStudio({
  prompt,
  history,
  modelMeta,
  systemInstruction,
  attachments,
  settings,
  onToken,
  onThought,
  signal,
}: {
  prompt: string;
  history: ChatMessage[];
  modelMeta: AIModelOption;
  systemInstruction: string;
  attachments: ChatAttachment[];
  settings: UserSettings;
  onToken: (token: string) => void;
  onThought?: (thought: string) => void;
  signal?: AbortSignal;
}): Promise<string> {
  const host = (settings.lmStudioHost || 'http://localhost:1234/v1').replace(/\/+$/, '');
  const modelName = settings.lmStudioModel || 'default';

  const messages: any[] = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  for (const m of history.slice(-8)) {
    messages.push({ role: m.role, content: m.content });
  }
  messages.push({ role: 'user', content: prompt });

  let accumulated = '';

  try {
    const res = await fetch(`${host}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelName,
        messages,
        stream: true,
        temperature: settings.temperature ?? 0.7,
      }),
      signal,
    });

    if (!res.ok) {
      throw new Error(`LM Studio returned ${res.status}: ${res.statusText}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('No readable stream returned.');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const clean = line.trim();
        if (clean.startsWith('data: ')) {
          const dataStr = clean.slice(6);
          if (dataStr === '[DONE]') return accumulated;
          try {
            const parsed = JSON.parse(dataStr);
            const delta = parsed.choices?.[0]?.delta?.content || '';
            if (delta) {
              accumulated += delta;
              onToken(delta);
            }
          } catch {
            // Ignore parse error on chunk
          }
        }
      }
    }

    return accumulated;
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;

    const fallback = `⚠️ **Could Not Connect to LM Studio Local Server**\n\nUnable to reach LM Studio at \`${host}\`.\n\n### How to Run Free Models in LM Studio:\n1. Open **LM Studio** on your computer.\n2. Download any open model (e.g., Llama 3.2, DeepSeek-R1, Mistral, Qwen).\n3. Click on the **Developer / Local Server** tab (<-> icon on the left).\n4. Click **Start Server** on port 1234.\n5. Ensure **CORS** is enabled in the LM Studio server settings.\n\n*Or switch to **Gemini 2.5 Flash (Free Tier)** in the top menu for immediate instant chat!*`;

    return streamTextSimulation(fallback, onToken, signal);
  }
}

/**
 * Generic OpenAI-compatible streaming (Groq, OpenRouter)
 */
async function streamOpenAICompatible({
  endpoint,
  apiKey,
  modelName,
  prompt,
  history,
  systemInstruction,
  onToken,
  onThought,
  signal,
  providerName,
}: {
  endpoint: string;
  apiKey: string;
  modelName: string;
  prompt: string;
  history: ChatMessage[];
  systemInstruction: string;
  onToken: (token: string) => void;
  onThought?: (thought: string) => void;
  signal?: AbortSignal;
  providerName: string;
}): Promise<string> {
  if (!apiKey && providerName.includes('Groq')) {
    const msg = `⚠️ **${providerName} API Key Required**\n\nTo use ${providerName}, please enter your free API key in **Settings > Providers & Keys** (get a free key at [console.groq.com](https://console.groq.com)).\n\n*Tip: You can switch to **Google Gemini** or **Local Ollama** to chat for free right now!*`;
    return streamTextSimulation(msg, onToken, signal);
  }

  const messages: any[] = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  for (const m of history.slice(-8)) {
    messages.push({ role: m.role, content: m.content });
  }
  messages.push({ role: 'user', content: prompt });

  let accumulated = '';

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey || 'free'}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages,
        stream: true,
      }),
      signal,
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `HTTP ${res.status}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('No stream body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const clean = line.trim();
        if (clean.startsWith('data: ')) {
          const dataStr = clean.slice(6);
          if (dataStr === '[DONE]') return accumulated;
          try {
            const parsed = JSON.parse(dataStr);
            const delta = parsed.choices?.[0]?.delta?.content || '';
            if (delta) {
              accumulated += delta;
              onToken(delta);
            }
          } catch {
            // chunk fragment
          }
        }
      }
    }

    return accumulated;
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;
    const msg = `⚠️ **${providerName} Error**: ${err.message}\n\nPlease check your API key in **Settings > Providers & Keys** or select **Gemini 2.5 Flash** for free instant chat.`;
    return streamTextSimulation(msg, onToken, signal);
  }
}

/**
 * Streams from Google Gemini (via server or client SDK) or Claude Persona
 */
async function streamGeminiOrClaude({
  prompt,
  history,
  modelId,
  modelMeta,
  systemInstruction,
  enableThinking,
  attachments,
  settings,
  onToken,
  onThought,
  signal,
}: {
  prompt: string;
  history: ChatMessage[];
  modelId: string;
  modelMeta: AIModelOption;
  systemInstruction: string;
  enableThinking: boolean;
  attachments: ChatAttachment[];
  settings: UserSettings;
  onToken: (token: string) => void;
  onThought?: (thought: string) => void;
  signal?: AbortSignal;
}): Promise<string> {
  const isClaude = modelMeta.provider === 'claude';
  const effectiveThinking = enableThinking || modelMeta.supportsThinking || false;

  let effectiveSystemInstruction = systemInstruction;
  if (isClaude) {
    effectiveSystemInstruction = `You are Claude, a helpful, thoughtful, and articulate AI assistant created by Anthropic.
You write in an elegant, clear, structured, and insightful manner.
When responding to complex or analytical questions, provide deep reasoning and clear step-by-step explanations.
For code, provide clean, idiomatic, and production-ready snippets with minimal unnecessary chatter.
${effectiveThinking ? 'You engage extended thinking mode: break down complex considerations thoroughly.' : ''}
${systemInstruction ? `\nUser Instructions:\n${systemInstruction}` : ''}`;
  }

  let accumulated = '';

  // 1. First attempt server /api/chat
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        history: history.slice(-10),
        modelId: (modelId === 'andromeda-soul-1' || modelId.includes('gemini')) ? modelId : 'gemini-3.8-flash',
        systemInstruction: effectiveSystemInstruction,
        enableThinking: effectiveThinking,
        attachments,
      }),
      signal,
    });

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
                if (currentEvent === 'error' && parsed.message) {
                  throw new Error(parsed.message);
                }
                if ((currentEvent === 'token' || currentEvent === 'chunk') && parsed.text) {
                  accumulated += parsed.text;
                  onToken(parsed.text);
                } else if (currentEvent === 'thought' && parsed.thought && onThought) {
                  onThought(parsed.thought);
                } else if (currentEvent === 'done') {
                  return accumulated;
                }
              } catch (e: any) {
                // If it's our thrown custom error, bubble it up
                if (e.message && currentEvent === 'error') {
                  throw e;
                }
                // otherwise it is a partial JSON chunk error, ignore
              }
            }
          }
        }

        if (accumulated.trim()) {
          return accumulated;
        }
      }
    } else if (!res.ok) {
      // If server responded with non-200, try to get JSON or text error
      try {
        const errJson = await res.json();
        if (errJson.error) {
          throw new Error(errJson.error);
        }
      } catch {
        throw new Error(`HTTP Error ${res.status} ${res.statusText}`);
      }
    }
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;
    // Propagate backend errors instead of silently swallowing and failing to fallback
    if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('network')) {
      throw err;
    }
  }

  // 2. Client-side Gemini SDK fallback
  const clientApiKey = settings.geminiApiKey || (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (clientApiKey && clientApiKey.trim()) {
    try {
      const ai = new GoogleGenAI({ apiKey: clientApiKey.trim() });
      const targetModel = 'gemini-2.5-flash';

      const contents: any[] = [];
      for (const msg of history.slice(-6)) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          contents.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
          });
        }
      }

      const currentParts: any[] = [{ text: prompt }];
      for (const att of attachments) {
        if (att.data) {
          const match = att.data.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            currentParts.push({
              inlineData: { mimeType: match[1], data: match[2] },
            });
          }
        }
      }
      contents.push({ role: 'user', parts: currentParts });

      const responseStream = await ai.models.generateContentStream({
        model: targetModel,
        contents,
        config: {
          systemInstruction: effectiveSystemInstruction || 'You are a brilliant AI assistant.',
          temperature: settings.temperature ?? 0.7,
        },
      });

      for await (const chunk of responseStream) {
        if (signal?.aborted) throw new Error('AbortError');
        const text = chunk.text || '';
        if (text) {
          accumulated += text;
          onToken(text);
        }
      }

      return accumulated;
    } catch (clientErr: any) {
      if (clientErr.name === 'AbortError') throw clientErr;
      console.warn('Client Gemini SDK error:', clientErr);
    }
  }

  // 3. Clear actionable error instead of generic echo fallback
  const errMsg = `⚠️ **Provider Connection Error**\n\nUnable to reach backend API or provider for **${modelMeta.name}** (${modelMeta.provider}). Please ensure your backend server is running, check your API keys in **Settings > Providers & Keys**, or select **Google Gemini 2.5 Flash** for instant cloud chat.`;
  return streamTextSimulation(errMsg, onToken, signal);
}

/**
 * Text typewriter simulation for smooth response output
 */
async function streamTextSimulation(
  text: string,
  onToken: (token: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const words = text.split(' ');
  let accumulated = '';

  for (let i = 0; i < words.length; i++) {
    if (signal?.aborted) throw new Error('AbortError');
    const word = words[i] + (i < words.length - 1 ? ' ' : '');
    accumulated += word;
    onToken(word);
    await new Promise((r) => setTimeout(r, 14));
  }

  return accumulated;
}

/**
 * Health check tests for local providers
 */
export async function testOllamaConnection(host: string = 'http://localhost:11434'): Promise<{ ok: boolean; models: string[]; error?: string }> {
  try {
    const cleanHost = host.replace(/\/+$/, '');
    const res = await fetch(`${cleanHost}/api/tags`, { method: 'GET' });
    if (!res.ok) throw new Error(`Ollama responded with status ${res.status}`);
    const data = await res.json();
    const models = (data.models || []).map((m: any) => m.name || m.model);
    return { ok: true, models };
  } catch (err: any) {
    return { ok: false, models: [], error: err.message || 'Cannot reach Ollama at this host' };
  }
}

export async function testLMStudioConnection(host: string = 'http://localhost:1234/v1'): Promise<{ ok: boolean; models: string[]; error?: string }> {
  try {
    const cleanHost = host.replace(/\/+$/, '');
    const res = await fetch(`${cleanHost}/models`, { method: 'GET' });
    if (!res.ok) throw new Error(`LM Studio responded with status ${res.status}`);
    const data = await res.json();
    const models = (data.data || []).map((m: any) => m.id);
    return { ok: true, models };
  } catch (err: any) {
    return { ok: false, models: [], error: err.message || 'Cannot reach LM Studio local server' };
  }
}
