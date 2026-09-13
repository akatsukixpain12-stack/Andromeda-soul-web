import { GoogleGenAI } from '@google/genai';
import { ChatMessage, ChatAttachment, UserSettings, AIModelOption, LearnedKnowledge } from '../types';
import { findModelById } from '../data/models';
import {
  understandRequest,
  executeTools,
  buildOrchestratedContext,
  safetyCheck,
  storeSessionMemory,
} from './orchestrator';

export interface StreamChatParams {
  prompt: string;
  history: ChatMessage[];
  modelId: string;
  systemInstruction: string;
  enableThinking: boolean;
  attachments?: ChatAttachment[];
  settings: UserSettings;
  learnedKnowledge?: LearnedKnowledge[];
  onToken: (token: string) => void;
  onThought?: (thought: string) => void;
  signal?: AbortSignal;
}

/**
 * Universal Multi-Provider AI Streaming Client
 * Orchestrates user intent, executes deterministic tools, routes to selected model provider,
 * performs safety validation, and streams the output with full thought-trace support.
 */
export async function streamMultiProviderChat({
  prompt,
  history,
  modelId,
  systemInstruction,
  enableThinking,
  attachments = [],
  settings,
  learnedKnowledge = [],
  onToken,
  onThought,
  signal,
}: StreamChatParams): Promise<string> {
  const modelMeta = findModelById(modelId, settings.customModels);
  const provider = modelMeta.provider || 'gemini';

  // 1. Understand request & plan tools via Andromeda Orchestrator
  const plan = understandRequest(prompt, attachments);

  // 2. Execute necessary tools (Web search grounding, Calculator, File inspector)
  const toolResults = await executeTools(plan, prompt, attachments, settings);

  // If calculator tool produced direct exact result and no attachments/complex text needed
  if (plan.intent === 'math_calculation' && toolResults.length > 0 && toolResults[0].success) {
    const directMath = `🧮 **Andromeda Math Engine Result**\n\n${toolResults[0].output}\n\n*Calculated with exact deterministic floating-point precision.*`;
    // If it's a simple calculation, stream the exact math result directly or pass to LLM
    if (!prompt.toLowerCase().includes('explain') && !prompt.toLowerCase().includes('how')) {
      return streamTextSimulation(directMath, onToken, signal);
    }
  }

  // 3. Build orchestrated context (injecting learned knowledge from Google Cloud Firestore)
  const orchestrated = buildOrchestratedContext({
    userMessage: prompt,
    history,
    attachments,
    settings,
    modelMeta,
    toolResults,
    plan,
    learnedKnowledge,
  });

  let rawResponse = '';

  // 4. Route to specific Provider Engine

  // OLLAMA (Local & Free)
  if (provider === 'ollama') {
    rawResponse = await streamOllama({
      prompt: orchestrated.augmentedPrompt,
      history,
      modelMeta,
      systemInstruction: orchestrated.systemPrompt,
      attachments,
      settings,
      onToken,
      onThought,
      signal,
    });
  }
  // LM STUDIO (Local & Free)
  else if (provider === 'lmstudio') {
    rawResponse = await streamLMStudio({
      prompt: orchestrated.augmentedPrompt,
      history,
      modelMeta,
      systemInstruction: orchestrated.systemPrompt,
      attachments,
      settings,
      onToken,
      onThought,
      signal,
    });
  }
  // OPENAI (Official or Custom)
  else if (provider === 'openai') {
    const targetModel = modelMeta.customModelTag || (modelId === 'openai-o3-mini' ? 'o3-mini' : modelId === 'openai-gpt-4o-mini' ? 'gpt-4o-mini' : 'gpt-4o');
    rawResponse = await streamOpenAICompatible({
      endpoint: modelMeta.customBaseUrl || 'https://api.openai.com/v1/chat/completions',
      apiKey: modelMeta.customApiKey || settings.openaiApiKey || '',
      modelName: targetModel,
      prompt: orchestrated.augmentedPrompt,
      history,
      systemInstruction: orchestrated.systemPrompt,
      onToken,
      onThought,
      signal,
      providerName: 'OpenAI',
    });
  }
  // ANTHROPIC CLAUDE
  else if (provider === 'anthropic') {
    const targetModel = modelMeta.customModelTag || (modelId === 'anthropic-claude-3-5-haiku' ? 'claude-3-5-haiku-20241022' : 'claude-3-7-sonnet-20250219');
    rawResponse = await streamAnthropic({
      apiKey: modelMeta.customApiKey || settings.anthropicApiKey || '',
      modelName: targetModel,
      prompt: orchestrated.augmentedPrompt,
      history,
      systemInstruction: orchestrated.systemPrompt,
      enableThinking: enableThinking || modelMeta.supportsThinking || false,
      onToken,
      onThought,
      signal,
    });
  }
  // DEEPSEEK DIRECT
  else if (provider === 'deepseek') {
    const targetModel = modelMeta.customModelTag || (modelId === 'deepseek-reasoner' ? 'deepseek-reasoner' : 'deepseek-chat');
    rawResponse = await streamOpenAICompatible({
      endpoint: modelMeta.customBaseUrl || 'https://api.deepseek.com/chat/completions',
      apiKey: modelMeta.customApiKey || settings.deepseekApiKey || '',
      modelName: targetModel,
      prompt: orchestrated.augmentedPrompt,
      history,
      systemInstruction: orchestrated.systemPrompt,
      onToken,
      onThought,
      signal,
      providerName: 'DeepSeek Official',
    });
  }
  // GROQ LPUS (Ultra Fast)
  else if (provider === 'groq') {
    const targetModel = modelMeta.customModelTag || (modelId === 'groq-deepseek-r1-distill' ? 'deepseek-r1-distill-llama-70b' : 'llama-3.3-70b-versatile');
    rawResponse = await streamOpenAICompatible({
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      apiKey: modelMeta.customApiKey || settings.groqApiKey || '',
      modelName: targetModel,
      prompt: orchestrated.augmentedPrompt,
      history,
      systemInstruction: orchestrated.systemPrompt,
      onToken,
      onThought,
      signal,
      providerName: 'Groq Cloud',
    });
  }
  // OPENROUTER
  else if (provider === 'openrouter') {
    const targetModel = modelMeta.customModelTag || (modelId === 'openrouter-deepseek-r1-free' ? 'deepseek/deepseek-r1:free' : 'openai/gpt-4o-mini');
    rawResponse = await streamOpenAICompatible({
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      apiKey: modelMeta.customApiKey || settings.openRouterApiKey || '',
      modelName: targetModel,
      prompt: orchestrated.augmentedPrompt,
      history,
      systemInstruction: orchestrated.systemPrompt,
      onToken,
      onThought,
      signal,
      providerName: 'OpenRouter',
    });
  }
  // MISTRAL AI
  else if (provider === 'mistral') {
    const targetModel = modelMeta.customModelTag || 'mistral-large-latest';
    rawResponse = await streamOpenAICompatible({
      endpoint: 'https://api.mistral.ai/v1/chat/completions',
      apiKey: modelMeta.customApiKey || settings.mistralApiKey || '',
      modelName: targetModel,
      prompt: orchestrated.augmentedPrompt,
      history,
      systemInstruction: orchestrated.systemPrompt,
      onToken,
      onThought,
      signal,
      providerName: 'Mistral AI',
    });
  }
  // CUSTOM OPENAI COMPATIBLE ENDPOINT
  else if (provider === 'custom') {
    rawResponse = await streamOpenAICompatible({
      endpoint: modelMeta.customBaseUrl || settings.customApiBaseUrl || 'http://localhost:8000/v1/chat/completions',
      apiKey: modelMeta.customApiKey || settings.customApiKey || '',
      modelName: modelMeta.customModelTag || settings.customApiModel || 'custom-model',
      prompt: orchestrated.augmentedPrompt,
      history,
      systemInstruction: orchestrated.systemPrompt,
      onToken,
      onThought,
      signal,
      providerName: modelMeta.name || 'Custom AI Model',
    });
  }
  // GEMINI & ANDROMEDA SOUL
  else {
    rawResponse = await streamGeminiOrClaude({
      prompt: orchestrated.augmentedPrompt,
      history,
      modelId,
      modelMeta,
      systemInstruction: orchestrated.systemPrompt,
      enableThinking: enableThinking || modelMeta.supportsThinking || false,
      attachments,
      settings,
      onToken,
      onThought,
      signal,
    });
  }

  // 5. Safety validation & token protection
  const validated = safetyCheck(rawResponse);

  // 6. Store in session memory
  storeSessionMemory(prompt, validated);

  return validated;
}

/**
 * Streams response from local Ollama instance
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
  let targetModel = modelMeta.customModelTag || settings.ollamaModel || 'deepseek-r1:8b';

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
            if (chunk.includes('<think>')) {
              inThinkBlock = true;
            }

            if (inThinkBlock) {
              thoughtBuffer += chunk;
              if (onThought) {
                const cleanThought = thoughtBuffer.replace(/<\/?think>/g, '').trim();
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
          // ignore chunk parse
        }
      }
    }

    if (accumulated.trim() || thoughtBuffer.trim()) {
      return accumulated;
    }
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;

    const fallbackMessage = `⚠️ **Could Not Connect to Local Ollama**\n\nUnable to reach Ollama at \`${host}\`.\n\n### How to Run Ollama for Free:\n1. **Install Ollama** from [ollama.com](https://ollama.com)\n2. **Start the server** in terminal:\n   \`\`\`bash\n   ollama serve\n   \`\`\`\n3. **Pull and run model**:\n   \`\`\`bash\n   ollama run ${targetModel}\n   \`\`\`\n4. Enable browser access:\n   \`\`\`bash\n   OLLAMA_ORIGINS="*" ollama serve\n   \`\`\`\n\n*Or switch to **Andromeda Soul 1.0** or **Google Gemini** in the top model menu to chat immediately without running anything locally!*`;

    return streamTextSimulation(fallbackMessage, onToken, signal);
  }

  return accumulated;
}

/**
 * Streams response from local LM Studio server
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
  const modelName = modelMeta.customModelTag || settings.lmStudioModel || 'default';

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
            // chunk
          }
        }
      }
    }

    return accumulated;
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;

    const fallback = `⚠️ **Could Not Connect to LM Studio Local Server**\n\nUnable to reach LM Studio at \`${host}\`.\n\n### How to Run Free Models in LM Studio:\n1. Open **LM Studio** on your computer.\n2. Download any open model (e.g., Llama 3.3, DeepSeek-R1, Mistral, Qwen).\n3. Click on the **Developer / Local Server** tab (<-> icon on the left).\n4. Click **Start Server** on port 1234.\n5. Ensure **CORS** is enabled in the LM Studio server settings.\n\n*Or switch to **Andromeda Soul 1.0** in the top menu for immediate instant chat!*`;

    return streamTextSimulation(fallback, onToken, signal);
  }
}

/**
 * Generic OpenAI-compatible streaming (OpenAI, DeepSeek, Groq, OpenRouter, Mistral, Custom APIs)
 * Automatically uses server proxy to bypass CORS restrictions if direct call encounters CORS.
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
  const isDirectThirdParty = endpoint.includes('api.openai.com') ||
    endpoint.includes('api.deepseek.com') ||
    endpoint.includes('api.anthropic.com') ||
    endpoint.includes('openrouter.ai') ||
    endpoint.includes('api.groq.com') ||
    endpoint.includes('api.mistral.ai');

  if (!apiKey && isDirectThirdParty && !endpoint.includes('free')) {
    const msg = `⚠️ **${providerName} API Key Required**\n\nTo use **${modelName}** from ${providerName}, please configure your API key in **Settings > Providers & Keys**.\n\n*You can switch to **Andromeda Soul 1.0** or **Google Gemini** to chat for free right now without an API key!*`;
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

  const bodyPayload = {
    model: modelName,
    messages,
    stream: true,
  };

  let accumulated = '';
  let inThinkBlock = false;
  let thoughtBuffer = '';

  // Use backend proxy for cloud APIs to prevent browser CORS blocks
  const targetUrl = isDirectThirdParty ? '/api/proxy/chat' : endpoint;
  const postBody = isDirectThirdParty
    ? JSON.stringify({ endpoint, apiKey, body: bodyPayload })
    : JSON.stringify(bodyPayload);

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (!isDirectThirdParty && apiKey) {
    headers['Authorization'] = `Bearer ${apiKey.trim()}`;
  }

  try {
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: postBody,
      signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Upstream ${res.status}: ${errText || res.statusText}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('No stream body returned');

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
            const reasoningDelta = parsed.choices?.[0]?.delta?.reasoning_content || '';

            if (reasoningDelta && onThought) {
              thoughtBuffer += reasoningDelta;
              onThought(thoughtBuffer);
            }

            if (delta) {
              if (delta.includes('<think>')) {
                inThinkBlock = true;
              }

              if (inThinkBlock) {
                thoughtBuffer += delta;
                if (onThought) {
                  onThought(thoughtBuffer.replace(/<\/?think>/g, '').trim());
                }
                if (delta.includes('</think>')) {
                  inThinkBlock = false;
                }
              } else {
                accumulated += delta;
                onToken(delta);
              }
            }
          } catch {
            // fragment
          }
        }
      }
    }

    return accumulated;
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;
    const msg = `⚠️ **${providerName} Error**: ${err.message}\n\nPlease check your credentials in **Settings > Providers & Keys** or select **Andromeda Soul 1.0** for instant AI chat.`;
    return streamTextSimulation(msg, onToken, signal);
  }
}

/**
 * Anthropic Messages API Streaming (via server proxy)
 */
async function streamAnthropic({
  apiKey,
  modelName,
  prompt,
  history,
  systemInstruction,
  enableThinking,
  onToken,
  onThought,
  signal,
}: {
  apiKey: string;
  modelName: string;
  prompt: string;
  history: ChatMessage[];
  systemInstruction: string;
  enableThinking: boolean;
  onToken: (token: string) => void;
  onThought?: (thought: string) => void;
  signal?: AbortSignal;
}): Promise<string> {
  if (!apiKey) {
    const msg = `⚠️ **Anthropic Claude API Key Required**\n\nTo use **${modelName}**, please provide your Anthropic API key in **Settings > Providers & Keys** (from [console.anthropic.com](https://console.anthropic.com)).\n\n*Or select **Andromeda Soul 1.0** to chat immediately for free!*`;
    return streamTextSimulation(msg, onToken, signal);
  }

  const messages: any[] = [];
  for (const m of history.slice(-8)) {
    messages.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content });
  }
  messages.push({ role: 'user', content: prompt });

  const bodyPayload: any = {
    model: modelName,
    messages,
    max_tokens: 4096,
    stream: true,
  };
  if (systemInstruction) {
    bodyPayload.system = systemInstruction;
  }
  if (enableThinking && modelName.includes('claude-3-7')) {
    bodyPayload.thinking = { type: 'enabled', budget_tokens: 2048 };
  }

  let accumulated = '';
  let thoughtBuffer = '';

  try {
    const res = await fetch('/api/proxy/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: 'https://api.anthropic.com/v1/messages',
        apiKey,
        isAnthropic: true,
        body: bodyPayload,
      }),
      signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Anthropic ${res.status}: ${errText || res.statusText}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('No stream body returned');

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
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.type === 'content_block_delta') {
              if (parsed.delta?.type === 'thinking_delta' && onThought) {
                thoughtBuffer += parsed.delta.thinking;
                onThought(thoughtBuffer);
              } else if (parsed.delta?.type === 'text_delta') {
                const text = parsed.delta.text || '';
                accumulated += text;
                onToken(text);
              }
            }
          } catch {
            // chunk
          }
        }
      }
    }

    return accumulated;
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;
    const msg = `⚠️ **Anthropic Claude Error**: ${err.message}\n\nPlease check your key in **Settings > Providers & Keys** or select **Andromeda Soul 1.0**.`;
    return streamTextSimulation(msg, onToken, signal);
  }
}

/**
 * Streams from Google Gemini (via server or client SDK) or Andromeda Persona
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
  const isAndromedaPersona = modelMeta.provider === 'andromeda' || modelId === 'andromeda-soul-1';
  const effectiveThinking = enableThinking || modelMeta.supportsThinking || false;

  let accumulated = '';

  // 1. First attempt server /api/chat
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        history: history.slice(-10),
        modelId: (modelId === 'andromeda-soul-1' || modelId.includes('gemini')) ? modelId : 'gemini-3.6-flash',
        systemInstruction,
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
                if (e.message && currentEvent === 'error') {
                  throw e;
                }
              }
            }
          }
        }

        if (accumulated.trim()) {
          return accumulated;
        }
      }
    } else if (!res.ok) {
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
    if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('network')) {
      throw err;
    }
  }

  // 2. Client-side Gemini SDK fallback
  const clientApiKey = settings.geminiApiKey || (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (clientApiKey && clientApiKey.trim()) {
    try {
      const ai = new GoogleGenAI({ apiKey: clientApiKey.trim() });
      const targetModel = 'gemini-3.6-flash';

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
          systemInstruction: systemInstruction || 'You are Andromeda, a brilliant AI assistant.',
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

  const errMsg = `⚠️ **Provider Connection Error**\n\nUnable to reach backend API or provider for **${modelMeta.name}** (${modelMeta.provider}). Please ensure your backend server is running, check your API keys in **Settings > Providers & Keys**, or select **Andromeda Soul 1.0** for instant cloud chat.`;
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
