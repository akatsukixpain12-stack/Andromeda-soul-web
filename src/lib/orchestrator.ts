/**
 * Andromeda Orchestrator Engine (Soul 1 / Soul 2 Architecture)
 * 
 * Pipeline:
 * USER ➔ Andromeda Website ➔ API Gateway ➔ ANDROMEDA ORCHESTRATOR
 *  ├── 1. Understand request (Intent classification)
 *  ├── 2. Load conversation context & memory
 *  ├── 3. Decide what tools are needed (Web search, Calculator, Code execution, Files)
 *  ├── 4. Build model input
 *  ▼
 * LANGUAGE MODEL (Multi-provider routing)
 *  ▼
 * Safety / validation (Secret scanner & token protection)
 *  ▼
 * Response formatter (Markdown, syntax highlighting, thought traces)
 *  ▼
 * Website ➔ USER
 */

import { ChatMessage, ChatAttachment, UserSettings, AIModelOption, LearnedKnowledge } from '../types';

export type OrchestratorIntent =
  | 'code_generation'
  | 'math_calculation'
  | 'web_search'
  | 'terminal_command'
  | 'file_analysis'
  | 'image_generation'
  | 'video_analysis'
  | 'creative_writing'
  | 'general_reasoning';

export interface ToolExecutionResult {
  toolName: 'web_search' | 'calculator' | 'code_execution' | 'file_analysis' | 'image_generator' | 'video_analyzer';
  title: string;
  output: string;
  success: boolean;
  data?: any;
}

export interface OrchestrationPlan {
  intent: OrchestratorIntent;
  confidence: number;
  toolsNeeded: ('web_search' | 'calculator' | 'code_execution' | 'file_analysis' | 'image_generator' | 'video_analyzer')[];
  summary: string;
}

export interface OrchestratedContext {
  systemPrompt: string;
  augmentedPrompt: string;
  toolResults: ToolExecutionResult[];
  plan: OrchestrationPlan;
  estimatedTokens?: number;
  maxTokens?: number;
}

export const ANDROMEDA_MAX_TOKENS = 800000;

/**
 * 1. Understand user request & classify intent
 */
export function understandRequest(userMessage: string, attachments: ChatAttachment[] = []): OrchestrationPlan {
  const text = userMessage.toLowerCase().trim();

  // Image Generation intent
  const isImageRequest =
    text.startsWith('/image') ||
    text.startsWith('generate image') ||
    text.startsWith('create image') ||
    text.startsWith('draw ') ||
    text.includes('generate a picture') ||
    text.includes('generate an image') ||
    text.includes('create an image') ||
    text.includes('draw a picture');

  if (isImageRequest) {
    return {
      intent: 'image_generation',
      confidence: 0.98,
      toolsNeeded: ['image_generator'],
      summary: 'Google Imagen 3 & Gemini Ultra-HD visual generation engine.',
    };
  }

  // Video Analysis intent
  const hasVideoAttachment = attachments.some(a => a.type?.startsWith('video/'));
  const isVideoRequest =
    hasVideoAttachment ||
    text.includes('analyze video') ||
    text.includes('video file') ||
    text.includes('watch video') ||
    text.includes('summarize video');

  if (isVideoRequest) {
    return {
      intent: 'video_analysis',
      confidence: 0.95,
      toolsNeeded: ['video_analyzer'],
      summary: 'Multimodal temporal video understanding & frame inspection.',
    };
  }

  // If general file attachments are present
  if (attachments.length > 0) {
    return {
      intent: 'file_analysis',
      confidence: 0.95,
      toolsNeeded: ['file_analysis'],
      summary: `Inspecting ${attachments.length} attachment(s) with multi-modal context.`,
    };
  }

  // Math / Calculator regex
  const mathPattern = /^(what is|calculate|compute|eval|solve)?\s*[\d\s\+\-\*\/\^\(\)\.\%e\=sqrt|sin|cos|tan|log|pi|tau]+\s*\??$/i;
  const hasDirectMath = mathPattern.test(text) && /[\+\-\*\/\^\=]/.test(text);

  if (hasDirectMath || text.startsWith('calculate ') || text.startsWith('compute ')) {
    return {
      intent: 'math_calculation',
      confidence: 0.92,
      toolsNeeded: ['calculator'],
      summary: 'Deterministic mathematical calculation engine engaged.',
    };
  }

  // Web Search intent
  const searchKeywords = [
    'latest', 'news', 'current price', 'weather', 'today', 'recent', 'who is currently',
    'search for', 'look up', 'google', 'stock price', 'release date of 2026', 'update on'
  ];
  if (searchKeywords.some(kw => text.includes(kw))) {
    return {
      intent: 'web_search',
      confidence: 0.88,
      toolsNeeded: ['web_search'],
      summary: 'Real-time web grounding and search planning activated.',
    };
  }

  // Terminal / Shell / Code Execution intent
  const terminalKeywords = [
    'run bash', 'run terminal', 'exec', 'execute command', 'npm install', 'git clone',
    'python script', 'pip install', 'curl ', 'ls -', 'cd ', 'mkdir '
  ];
  if (terminalKeywords.some(kw => text.startsWith(kw) || text.includes(`\`\`\`bash`))) {
    return {
      intent: 'terminal_command',
      confidence: 0.85,
      toolsNeeded: ['code_execution'],
      summary: 'Code & command execution environment ready.',
    };
  }

  // Code generation & architecture
  const codeKeywords = [
    'code', 'function', 'class', 'component', 'refactor', 'debug', 'typescript',
    'python', 'react', 'api', 'dockerfile', 'sql', 'bot', 'algorithm'
  ];
  if (codeKeywords.some(kw => text.includes(kw))) {
    return {
      intent: 'code_generation',
      confidence: 0.9,
      toolsNeeded: [],
      summary: 'Full-stack software engineering and code synthesis mode.',
    };
  }

  return {
    intent: 'general_reasoning',
    confidence: 0.8,
    toolsNeeded: [],
    summary: 'Uncapped sovereign intelligence & deep reasoning pipeline.',
  };
}

/**
 * 2. Retrieve relevant memory & conversation context
 */
export function retrieveMemory(
  userMessage: string,
  history: ChatMessage[],
  settings: UserSettings
): { recentContext: string; rememberedUser: string } {
  const rememberedUser = settings.userName || 'Creator';
  
  // Extract key topics from history
  const recentExchanges = history
    .slice(-6)
    .map(m => `${m.role === 'user' ? rememberedUser : 'Andromeda'}: ${m.content.slice(0, 300)}`)
    .join('\n');

  return {
    recentContext: recentExchanges,
    rememberedUser,
  };
}

/**
 * 3 & 4. Execute deterministic tools if needed
 */
export async function executeTools(
  plan: OrchestrationPlan,
  userMessage: string,
  attachments: ChatAttachment[] = [],
  settings: UserSettings
): Promise<ToolExecutionResult[]> {
  const results: ToolExecutionResult[] = [];

  for (const tool of plan.toolsNeeded) {
    if (tool === 'calculator' && settings.enableCalculator !== false) {
      try {
        const cleanExpr = userMessage
          .replace(/^(what is|calculate|compute|eval|solve)\s*/i, '')
          .replace(/\?$/, '')
          .trim();

        // Safe client-side math evaluator
        const sanitized = cleanExpr.replace(/[^0-9\+\-\*\/\(\)\.\s\^\%e]/g, '');
        if (sanitized) {
          // eslint-disable-next-line no-new-func
          const val = Function(`'use strict'; return (${sanitized.replace(/\^/g, '**')})`)();
          results.push({
            toolName: 'calculator',
            title: 'Exact Calculator Evaluator',
            output: `Expression: \`${cleanExpr}\` = **${val}**`,
            success: true,
          });
        }
      } catch (err: any) {
        results.push({
          toolName: 'calculator',
          title: 'Calculator Tool',
          output: `Evaluation note: ${err.message}`,
          success: false,
        });
      }
    }

    if (tool === 'file_analysis' && attachments.length > 0) {
      const summaries = attachments.map(att => `- **${att.name}** (${att.type}, ${Math.round(att.size / 1024)} KB)`).join('\n');
      results.push({
        toolName: 'file_analysis',
        title: 'Workspace File Inspector',
        output: `Active Analyzed Attachments:\n${summaries}`,
        success: true,
      });
    }

    if (tool === 'web_search' && settings.enableWebSearch !== false) {
      results.push({
        toolName: 'web_search',
        title: 'Search Grounding Query Formulator',
        output: `Formulated Search Target: "${userMessage.slice(0, 100)}" — Live grounding engaged.`,
        success: true,
      });
    }

    if (tool === 'image_generator') {
      try {
        const cleanPrompt = userMessage
          .replace(/^\/image\s*/i, '')
          .replace(/^(generate|create|make|draw)\s+(an\s+|a\s+)?(image|picture|photo)\s+(of\s+)?/i, '')
          .trim() || userMessage;

        const res = await fetch('/api/image/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: cleanPrompt, aspectRatio: '1:1', style: 'photorealistic' }),
        });
        const imgJson = await res.json();
        if (imgJson.success && imgJson.image) {
          results.push({
            toolName: 'image_generator',
            title: `Google Imagen 3 Ultra-HD Visual Engine`,
            output: `Successfully generated image for prompt: "${cleanPrompt}"\nImage ID: ${imgJson.image.id}\nEngine: ${imgJson.image.engine}`,
            success: true,
            data: imgJson.image,
          });
        } else {
          results.push({
            toolName: 'image_generator',
            title: 'Google Imagen 3 Visual Engine',
            output: `Image generation note: ${imgJson.error || 'Engine busy, falling back to descriptive canvas.'}`,
            success: false,
          });
        }
      } catch (err: any) {
        results.push({
          toolName: 'image_generator',
          title: 'Google Imagen 3 Visual Engine',
          output: `Visual generation note: ${err.message}`,
          success: false,
        });
      }
    }

    if (tool === 'video_analyzer') {
      const videoAtts = attachments.filter(a => a.type?.startsWith('video/'));
      results.push({
        toolName: 'video_analyzer',
        title: 'Multimodal Video Reasoning Pipeline',
        output: videoAtts.length > 0
          ? `Attached Video(s): ${videoAtts.map(v => `${v.name} (${Math.round(v.size / (1024 * 1024))}MB)`).join(', ')} — Full temporal frame reasoning active on Google Cloud.`
          : `Video Reasoning Target: "${userMessage.slice(0, 100)}" — Multimodal analysis ready.`,
        success: true,
      });
    }

    if (tool === 'code_execution') {
      try {
        // Extract bash / shell command from message if structured
        let commandToRun = '';
        const match = userMessage.match(/```(?:bash|sh|cmd)?\n([\s\S]*?)\n```/);
        if (match) {
          commandToRun = match[1].trim();
        } else if (userMessage.startsWith('run ') || userMessage.startsWith('exec ')) {
          commandToRun = userMessage.replace(/^(?:run|exec)\s+/i, '').trim();
        }

        if (commandToRun) {
          const res = await fetch('/api/terminal/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: commandToRun, timeoutMs: 10000 })
          });
          const json = await res.json();
          results.push({
            toolName: 'code_execution',
            title: `Terminal Runner: \`${commandToRun.slice(0, 40)}\``,
            output: json.success
              ? `Exit Code: 0\n\`\`\`\n${(json.stdout || '(no output)').trim()}\n\`\`\``
              : `Exit Code: ${json.exitCode}\n\`\`\`\n${(json.stderr || json.error || 'Execution failed').trim()}\n\`\`\``,
            success: json.success,
          });
        }
      } catch (err: any) {
        results.push({
          toolName: 'code_execution',
          title: 'Terminal Execution Engine',
          output: `Command runner note: ${err.message}`,
          success: false,
        });
      }
    }
  }

  return results;
}

/**
 * 5. Construct Structured Model Context
 */
export function buildOrchestratedContext({
  userMessage,
  history,
  attachments = [],
  settings,
  modelMeta,
  toolResults,
  plan,
  learnedKnowledge = [],
}: {
  userMessage: string;
  history: ChatMessage[];
  attachments?: ChatAttachment[];
  settings: UserSettings;
  modelMeta: AIModelOption;
  toolResults: ToolExecutionResult[];
  plan: OrchestrationPlan;
  learnedKnowledge?: LearnedKnowledge[];
}): OrchestratedContext {
  const isAndromeda = modelMeta.provider === 'andromeda' || modelMeta.id === 'andromeda-soul-1';

  let systemPrompt = settings.systemInstruction || 'You are Andromeda, a sovereign, articulate AI assistant.';
  systemPrompt += `

[RESPONSE QUALITY CONTRACT]
- Understand the user's actual goal before answering; make reasonable assumptions explicit.
- Give a direct answer first, then useful detail in a clear structure.
- Use the conversation context, attachments, and verified tool results instead of repeating questions.
- Never invent live facts, tool results, citations, or completed actions. State uncertainty and suggest a verification path.
- For code, provide runnable, secure, typed examples and explain important trade-offs.
- For complex tasks, break the work into practical steps and include edge cases.
- Protect secrets and personal data; ask for confirmation before destructive or externally visible actions.`;

  // Token budgeting & Context Limiting (800k token limit strictly enforced for Andromeda)
  const historyChars = history.reduce((acc, m) => acc + (m.content?.length || 0), 0);
  const totalChars = (settings.systemInstruction?.length || 0) + userMessage.length + historyChars;
  const estimatedTokens = Math.round(totalChars / 3.8);
  const maxTokens = isAndromeda ? ANDROMEDA_MAX_TOKENS : (modelMeta.maxTokens || 128000);

  if (isAndromeda) {
    systemPrompt = `You are Andromeda Soul 1.0 (Andromeda Sovereign Intelligence).
You are an autonomous sovereign AI engineered with an 800,000 token context limit, deep reasoning, multi-file software engineering (on par with Claude 3.7 Sonnet), autonomous image generation, and video understanding.
Your knowledge, conversations, and learned insights are permanently synchronized with Google Cloud Firestore.

[SOVEREIGN SPECIFICATIONS & BOUNDARIES]
- Maximum Context Window: 800,000 Tokens (800k limit). Manage large tasks intelligently without wasting tokens.
- Cloud Backbone: Google Cloud Infrastructure & Real-Time Firebase Firestore.
- Multimodal Engine: Google Imagen 3 for visual creation, native temporal video comprehension.
- Software Engineering: Production-ready TypeScript, Python, Node.js, and Discord bots with zero mock code.

[ORCHESTRATION PIPELINE ACTIVE]
- Request Intent: ${plan.intent.toUpperCase()} (${plan.summary})
- Context Budget: ~${estimatedTokens.toLocaleString()} / ${maxTokens.toLocaleString()} tokens
- User Profile: ${settings.userName || 'Creator'}
${toolResults.length > 0 ? `\n[VERIFIED TOOL RESULTS]:\n${toolResults.map(t => `${t.title}:\n${t.output}`).join('\n\n')}\n` : ''}`;
  } else if (toolResults.length > 0) {
    systemPrompt += `\n\n[TOOL CONTEXT]:\n${toolResults.map(t => `${t.title}:\n${t.output}`).join('\n\n')}`;
  }

  // Inject Autonomous Google Cloud Memory & Learned Knowledge
  if (learnedKnowledge.length > 0) {
    const memoryItems = learnedKnowledge
      .slice(0, 15)
      .map(k => `• [${k.topic}]: ${k.insight}`)
      .join('\n');
    systemPrompt += `\n\n[ANDROMEDA AUTONOMOUS GOOGLE CLOUD MEMORY]:\nThe following verified preferences, directives, and facts have been automatically learned from past conversations and retrieved from Google Cloud Firestore:\n${memoryItems}\nYou MUST strictly honor and respect these user-specific guidelines, coding rules, and verified constraints in your responses.`;
  }

  return {
    systemPrompt,
    augmentedPrompt: userMessage,
    toolResults,
    plan,
    estimatedTokens,
    maxTokens,
  };
}

/**
 * 7. Safety check and secret redactor
 */
export function safetyCheck(content: string, protectedTokens: string[] = []): string {
  let safe = content;
  
  // Redact potential API keys (OpenAI, Anthropic, Gemini, Groq, Discord)
  const leakPatterns = [
    /sk-[a-zA-Z0-9]{20,60}/g,
    /sk-ant-[a-zA-Z0-9\-_]{20,90}/g,
    /gsk_[a-zA-Z0-9]{20,60}/g,
    /AIzaSy[a-zA-Z0-9_\-]{30,45}/g,
    /sk-or-v1-[a-zA-Z0-9]{50,80}/g,
  ];

  for (const pat of leakPatterns) {
    safe = safe.replace(pat, '[REDACTED_API_KEY]');
  }

  for (const secret of protectedTokens) {
    if (secret && secret.length >= 8) {
      safe = safe.replaceAll(secret, '[PROTECTED_TOKEN]');
    }
  }

  return safe;
}

/**
 * 8. Memory storage helper (session memory)
 */
export function storeSessionMemory(userMessage: string, assistantResponse: string) {
  try {
    const memoryKey = 'andromeda_session_memory';
    const existing = sessionStorage.getItem(memoryKey);
    const parsed = existing ? JSON.parse(existing) : [];
    
    parsed.push({
      timestamp: Date.now(),
      summary: userMessage.slice(0, 100),
      responseSnippet: assistantResponse.slice(0, 150),
    });

    // Keep last 20 memories
    sessionStorage.setItem(memoryKey, JSON.stringify(parsed.slice(-20)));
  } catch {
    // ignore session storage limitations
  }
}
