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
 * Universal multi-provider streaming client.
 *
 * Important native-engine rule:
 * Andromeda Soul is served by the dedicated FastAPI service at /v1/chat when
 * the selected model is an Andromeda model. It must never be routed through
 * the Gemini fallback path merely because the UI provider label is changed.
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

  const plan = understandRequest(prompt, attachments);
  const toolResults = await executeTools(plan, prompt, attachments, settings);

  if (plan.intent === 'math_calculation' && toolResults.length > 0 && toolResults[0].success) {
    const directMath = `🧮 **Andromeda Math Engine Result**\n\n${toolResults[0].output}\n\n*Calculated with exact deterministic floating-point precision.*`;
    if (!prompt.toLowerCase().includes('explain') && !prompt.toLowerCase().includes('how')) {
      return streamTextSimulation(directMath, onToken, signal);
    }
  }

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

  if (provider === 'andromeda') {
    rawResponse = await streamNativeAndromeda({
      prompt: orchestrated.augmentedPrompt,
      history,
      modelId,
      maxTokens: Math.min(settings.maxTokens || 512, 1024),
      temperature: settings.temperature ?? 0.7,
      onToken,
      signal,
    });
  } else if (provider === 'ollama') {
    rawResponse = await streamOllama({ prompt: orchestrated.augmentedPrompt, history, modelMeta, systemInstruction: orchestrated.systemPrompt, attachments, settings, onToken, onThought, signal });
  } else if (provider === 'lmstudio') {
    rawResponse = await streamLMStudio({ prompt: orchestrated.augmentedPrompt, history, modelMeta, systemInstruction: orchestrated.systemPrompt, attachments, settings, onToken, onThought, signal });
  } else if (provider === 'openai') {
    const targetModel = modelMeta.customModelTag || (modelId === 'openai-o3-mini' ? 'o3-mini' : modelId === 'openai-gpt-4o-mini' ? 'gpt-4o-mini' : 'gpt-4o');
    rawResponse = await streamOpenAICompatible({ endpoint: modelMeta.customBaseUrl || 'https://api.openai.com/v1/chat/completions', apiKey: modelMeta.customApiKey || settings.openaiApiKey || '', modelName: targetModel, prompt: orchestrated.augmentedPrompt, history, systemInstruction: orchestrated.systemPrompt, onToken, onThought, signal, providerName: 'OpenAI' });
  } else if (provider === 'anthropic') {
    const targetModel = modelMeta.customModelTag || (modelId === 'anthropic-claude-3-5-haiku' ? 'claude-3-5-haiku-20241022' : 'claude-3-7-sonnet-20250219');
    rawResponse = await streamAnthropic({ apiKey: modelMeta.customApiKey || settings.anthropicApiKey || '', modelName: targetModel, prompt: orchestrated.augmentedPrompt, history, systemInstruction: orchestrated.systemPrompt, enableThinking: enableThinking || modelMeta.supportsThinking || false, onToken, onThought, signal });
  } else if (provider === 'deepseek') {
    const targetModel = modelMeta.customModelTag || (modelId === 'deepseek-reasoner' ? 'deepseek-reasoner' : 'deepseek-chat');
    rawResponse = await streamOpenAICompatible({ endpoint: modelMeta.customBaseUrl || 'https://api.deepseek.com/chat/completions', apiKey: modelMeta.customApiKey || settings.deepseekApiKey || '', modelName: targetModel, prompt: orchestrated.augmentedPrompt, history, systemInstruction: orchestrated.systemPrompt, onToken, onThought, signal, providerName: 'DeepSeek Official' });
  } else if (provider === 'groq') {
    const targetModel = modelMeta.customModelTag || (modelId === 'groq-deepseek-r1-distill' ? 'deepseek-r1-distill-llama-70b' : 'llama-3.3-70b-versatile');
    rawResponse = await streamOpenAICompatible({ endpoint: 'https://api.groq.com/openai/v1/chat/completions', apiKey: modelMeta.customApiKey || settings.groqApiKey || '', modelName: targetModel, prompt: orchestrated.augmentedPrompt, history, systemInstruction: orchestrated.systemPrompt, onToken, onThought, signal, providerName: 'Groq Cloud' });
  } else if (provider === 'openrouter') {
    const targetModel = modelMeta.customModelTag || (modelId === 'openrouter-deepseek-r1-free' ? 'deepseek/deepseek-r1:free' : 'openai/gpt-4o-mini');
    rawResponse = await streamOpenAICompatible({ endpoint: 'https://openrouter.ai/api/v1/chat/completions', apiKey: modelMeta.customApiKey || settings.openRouterApiKey || '', modelName: targetModel, prompt: orchestrated.augmentedPrompt, history, systemInstruction: orchestrated.systemPrompt, onToken, onThought, signal, providerName: 'OpenRouter' });
  } else if (provider === 'mistral') {
    rawResponse = await streamOpenAICompatible({ endpoint: 'https://api.mistral.ai/v1/chat/completions', apiKey: modelMeta.customApiKey || settings.mistralApiKey || '', modelName: modelMeta.customModelTag || 'mistral-large-latest', prompt: orchestrated.augmentedPrompt, history, systemInstruction: orchestrated.systemPrompt, onToken, onThought, signal, providerName: 'Mistral AI' });
  } else if (provider === 'custom') {
    rawResponse = await streamOpenAICompatible({ endpoint: modelMeta.customBaseUrl || settings.customApiBaseUrl || 'http://localhost:8000/v1/chat/completions', apiKey: modelMeta.customApiKey || settings.customApiKey || '', modelName: modelMeta.customModelTag || settings.customApiModel || 'custom-model', prompt: orchestrated.augmentedPrompt, history, systemInstruction: orchestrated.systemPrompt, onToken, onThought, signal, providerName: modelMeta.name || 'Custom AI Model' });
  } else {
    rawResponse = await streamGeminiOrClaude({ prompt: orchestrated.augmentedPrompt, history, modelId, modelMeta, systemInstruction: orchestrated.systemPrompt, enableThinking: enableThinking || modelMeta.supportsThinking || false, attachments, settings, onToken, onThought, signal });
  }

  const validated = safetyCheck(rawResponse);
  storeSessionMemory(prompt, validated);
  return validated;
}

/**
 * Native Andromeda FastAPI streaming client.
 * The native engine is a separate Python service and therefore has its own
 * /v1/chat contract; do not send this traffic to the Gemini /api/chat route.
 */
async function streamNativeAndromeda({
  prompt,
  history,
  modelId,
  maxTokens,
  temperature,
  onToken,
  signal,
}: {
  prompt: string;
  history: ChatMessage[];
  modelId: string;
  maxTokens: number;
  temperature: number;
  onToken: (token: string) => void;
  signal?: AbortSignal;
}): Promise<string> {
  const baseUrl = ((import.meta as any).env?.VITE_ANDROMEDA_API_URL || '/api/andromeda').replace(/\/+$/, '');
  const endpoint = `${baseUrl}/v1/chat`;
  let accumulated = '';

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify({
        message: prompt,
        conversation_id: 'web_default',
        model: modelId === 'andromeda-soul-1' ? 'andromeda-nano' : modelId,
        temperature,
        max_tokens: maxTokens,
        stream: true,
      }),
      signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Andromeda API ${res.status}: ${text || res.statusText}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('Andromeda API returned no response stream.');

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
        if (!clean.startsWith('data: ')) continue;
        const payload = clean.slice(6);
        if (payload === '[DONE]') return accumulated;
        try {
          const parsed = JSON.parse(payload);
          if (parsed.token) {
            accumulated += parsed.token;
            onToken(parsed.token);
          }
          if (parsed.error) throw new Error(parsed.error);
        } catch (err: any) {
          if (err.message && !String(err.message).includes('Unexpected token')) throw err;
        }
      }
    }

    if (!accumulated.trim()) throw new Error('Andromeda API completed without generating any text.');
    return accumulated;
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;
    const message = `⚠️ **Andromeda Soul connection error**\n\n${err.message}\n\nStart the native Andromeda FastAPI service or configure **VITE_ANDROMEDA_API_URL** to its public URL.`;
    return streamTextSimulation(message, onToken, signal);
  }
}

async function streamOllama({ prompt, history, modelMeta, systemInstruction, attachments, settings, onToken, onThought, signal }: any): Promise<string> {
  const host = (settings.ollamaHost || 'http://localhost:11434').replace(/\/+$/, '');
  let targetModel = modelMeta.customModelTag || settings.ollamaModel || 'deepseek-r1:8b';
  if (modelMeta.id === 'ollama-llama3.2') targetModel = 'llama3.2';
  if (modelMeta.id === 'ollama-deepseek-r1') targetModel = 'deepseek-r1:8b';
  if (modelMeta.id === 'ollama-qwen2.5-coder') targetModel = 'qwen2.5-coder';
  if (modelMeta.id === 'ollama-mistral') targetModel = 'mistral';
  const messages: any[] = [];
  if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
  for (const m of history.slice(-8)) messages.push({ role: m.role, content: m.content });
  const images = attachments.filter((a: any) => a.type?.startsWith('image/') && a.data).map((a: any) => a.data.replace(/^data:[^;]+;base64,/, ''));
  messages.push({ role: 'user', content: prompt, ...(images.length ? { images } : {}) });
  let accumulated = '';
  try {
    const res = await fetch(`${host}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: targetModel, messages, stream: true }), signal });
    if (!res.ok) throw new Error(`Ollama returned ${res.status}`);
    const reader = res.body?.getReader();
    if (!reader) throw new Error('Could not open Ollama stream.');
    const decoder = new TextDecoder(); let partial = '';
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      partial += decoder.decode(value, { stream: true }); const lines = partial.split('\n'); partial = lines.pop() || '';
      for (const line of lines) { if (!line.trim()) continue; try { const parsed = JSON.parse(line); const chunk = parsed.message?.content || ''; if (chunk) { accumulated += chunk; onToken(chunk); } } catch {} }
    }
    return accumulated;
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;
    return streamTextSimulation(`⚠️ **Could Not Connect to Local Ollama**\n\n${err.message}`, onToken, signal);
  }
}

async function streamLMStudio({ prompt, history, modelMeta, systemInstruction, settings, onToken, signal }: any): Promise<string> {
  const host = (settings.lmStudioHost || 'http://localhost:1234/v1').replace(/\/+$/, '');
  const messages: any[] = []; if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
  for (const m of history.slice(-8)) messages.push({ role: m.role, content: m.content });
  messages.push({ role: 'user', content: prompt });
  try {
    const res = await fetch(`${host}/chat/completions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: modelMeta.customModelTag || settings.lmStudioModel || 'default', messages, stream: true, temperature: settings.temperature ?? 0.7 }), signal });
    if (!res.ok) throw new Error(`LM Studio returned ${res.status}`);
    const reader = res.body?.getReader(); if (!reader) throw new Error('No LM Studio stream.');
    const decoder = new TextDecoder(); let buffer = ''; let accumulated = '';
    while (true) { const { done, value } = await reader.read(); if (done) break; buffer += decoder.decode(value, { stream: true }); const lines = buffer.split('\n'); buffer = lines.pop() || ''; for (const line of lines) { const clean = line.trim(); if (!clean.startsWith('data: ')) continue; const data = clean.slice(6); if (data === '[DONE]') return accumulated; try { const parsed = JSON.parse(data); const delta = parsed.choices?.[0]?.delta?.content || ''; if (delta) { accumulated += delta; onToken(delta); } } catch {} } }
    return accumulated;
  } catch (err: any) { if (err.name === 'AbortError') throw err; return streamTextSimulation(`⚠️ **Could Not Connect to LM Studio**\n\n${err.message}`, onToken, signal); }
}

async function streamOpenAICompatible({ endpoint, apiKey, modelName, prompt, history, systemInstruction, onToken, signal, providerName }: any): Promise<string> {
  if (!apiKey && /api\.openai\.com|api\.deepseek\.com|openrouter\.ai|api\.groq\.com|api\.mistral\.ai/.test(endpoint)) return streamTextSimulation(`⚠️ **${providerName} API Key Required**`, onToken, signal);
  const messages: any[] = []; if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
  for (const m of history.slice(-8)) messages.push({ role: m.role, content: m.content }); messages.push({ role: 'user', content: prompt });
  try {
    const direct = /api\.openai\.com|api\.deepseek\.com|openrouter\.ai|api\.groq\.com|api\.mistral\.ai/.test(endpoint);
    const res = await fetch(direct ? '/api/proxy/chat' : endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(direct ? { endpoint, apiKey, body: { model: modelName, messages, stream: true } } : { model: modelName, messages, stream: true }), signal });
    if (!res.ok) throw new Error(`Upstream ${res.status}: ${await res.text().catch(() => res.statusText)}`);
    const reader = res.body?.getReader(); if (!reader) throw new Error('No provider stream.');
    const decoder = new TextDecoder(); let buffer = ''; let accumulated = '';
    while (true) { const { done, value } = await reader.read(); if (done) break; buffer += decoder.decode(value, { stream: true }); const lines = buffer.split('\n'); buffer = lines.pop() || ''; for (const line of lines) { const clean = line.trim(); if (!clean.startsWith('data: ')) continue; const data = clean.slice(6); if (data === '[DONE]') return accumulated; try { const parsed = JSON.parse(data); const delta = parsed.choices?.[0]?.delta?.content || ''; if (delta) { accumulated += delta; onToken(delta); } } catch {} } }
    return accumulated;
  } catch (err: any) { if (err.name === 'AbortError') throw err; return streamTextSimulation(`⚠️ **${providerName} Error**: ${err.message}`, onToken, signal); }
}

async function streamAnthropic({ apiKey, modelName, prompt, history, systemInstruction, onToken, signal }: any): Promise<string> {
  if (!apiKey) return streamTextSimulation(`⚠️ **Anthropic Claude API Key Required**`, onToken, signal);
  const messages = [...history.slice(-8).map((m: any) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })), { role: 'user', content: prompt }];
  try {
    const res = await fetch('/api/proxy/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: 'https://api.anthropic.com/v1/messages', apiKey, isAnthropic: true, body: { model: modelName, messages, max_tokens: 4096, stream: true, ...(systemInstruction ? { system: systemInstruction } : {}) } }), signal });
    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text().catch(() => res.statusText)}`);
    const reader = res.body?.getReader(); if (!reader) throw new Error('No Anthropic stream.');
    const decoder = new TextDecoder(); let buffer = ''; let accumulated = '';
    while (true) { const { done, value } = await reader.read(); if (done) break; buffer += decoder.decode(value, { stream: true }); const lines = buffer.split('\n'); buffer = lines.pop() || ''; for (const line of lines) { const clean = line.trim(); if (!clean.startsWith('data: ')) continue; try { const parsed = JSON.parse(clean.slice(6)); const text = parsed.delta?.text || ''; if (text) { accumulated += text; onToken(text); } } catch {} } }
    return accumulated;
  } catch (err: any) { if (err.name === 'AbortError') throw err; return streamTextSimulation(`⚠️ **Anthropic Error**: ${err.message}`, onToken, signal); }
}

async function streamGeminiOrClaude({ prompt, history, modelId, modelMeta, systemInstruction, attachments, settings, onToken, signal }: any): Promise<string> {
  let accumulated = '';
  try {
    const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, history: history.slice(-10), modelId, systemInstruction, attachments }), signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const reader = res.body?.getReader(); if (!reader) throw new Error('No server stream.');
    const decoder = new TextDecoder(); let buffer = '';
    while (true) { const { done, value } = await reader.read(); if (done) break; buffer += decoder.decode(value, { stream: true }); const lines = buffer.split('\n'); buffer = lines.pop() || ''; let event = ''; for (const line of lines) { if (line.startsWith('event: ')) event = line.slice(7).trim(); else if (line.startsWith('data: ')) { try { const data = JSON.parse(line.slice(6)); if ((event === 'token' || event === 'chunk') && data.text) { accumulated += data.text; onToken(data.text); } else if (event === 'thought' && data.thought) {} else if (event === 'error') throw new Error(data.message); else if (event === 'done') return accumulated; } catch (e: any) { if (event === 'error') throw e; } } } }
    return accumulated;
  } catch (err: any) { if (err.name === 'AbortError') throw err; return streamTextSimulation(`⚠️ **Provider Connection Error**\n\n${err.message}`, onToken, signal); }
}

async function streamTextSimulation(text: string, onToken: (token: string) => void, signal?: AbortSignal): Promise<string> {
  const words = text.split(' '); let accumulated = '';
  for (let i = 0; i < words.length; i++) { if (signal?.aborted) throw new Error('AbortError'); const word = words[i] + (i < words.length - 1 ? ' ' : ''); accumulated += word; onToken(word); await new Promise((r) => setTimeout(r, 14)); }
  return accumulated;
}

export async function testOllamaConnection(host = 'http://localhost:11434') {
  try { const res = await fetch(`${host.replace(/\/+$/, '')}/api/tags`); if (!res.ok) throw new Error(`Ollama responded with status ${res.status}`); const data = await res.json(); return { ok: true, models: (data.models || []).map((m: any) => m.name || m.model) }; } catch (err: any) { return { ok: false, models: [], error: err.message || 'Cannot reach Ollama' }; }
}

export async function testLMStudioConnection(host = 'http://localhost:1234/v1') {
  try { const res = await fetch(`${host.replace(/\/+$/, '')}/models`); if (!res.ok) throw new Error(`LM Studio responded with status ${res.status}`); const data = await res.json(); return { ok: true, models: (data.data || []).map((m: any) => m.id) }; } catch (err: any) { return { ok: false, models: [], error: err.message || 'Cannot reach LM Studio' }; }
}
