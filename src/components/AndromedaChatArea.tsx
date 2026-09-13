import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Sparkles,
  Send,
  Square,
  Paperclip,
  X,
  Copy,
  Check,
  RotateCcw,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronRight,
  Brain,
  FileText,
  Zap,
  Flame,
  Cpu,
  HardDrive,
  Edit2,
  Share2,
} from 'lucide-react';
import { ChatMessage, ChatAttachment, AIModelOption, UserProfile } from '../types';
import { AI_MODELS } from '../data/models';
import { UserAvatar } from './UserAvatar';

interface AndromedaChatAreaProps {
  messages: ChatMessage[];
  streamingMessage: string;
  streamingThought?: string;
  isStreaming: boolean;
  onSendMessage: (prompt: string, attachments?: ChatAttachment[], enableThinking?: boolean) => void;
  onStopStreaming: () => void;
  onRegenerate: () => void;
  onClearChat: () => void;
  onNewChat: () => void;
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  userName?: string;
  currentUser?: UserProfile | null;
  onEditMessage?: (content: string) => void;
  onOpenProvidersModal: () => void;
}

export const AndromedaChatArea: React.FC<AndromedaChatAreaProps> = ({
  messages,
  streamingMessage,
  streamingThought,
  isStreaming,
  onSendMessage,
  onStopStreaming,
  onRegenerate,
  selectedModelId,
  onSelectModel,
  userName = 'User',
  currentUser,
  onOpenProvidersModal,
}) => {
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isThinkingEnabled, setIsThinkingEnabled] = useState(true);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [copiedCodeKey, setCopiedCodeKey] = useState<string | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentModel = AI_MODELS.find((m) => m.id === selectedModelId) || AI_MODELS[0];

  // Auto-scroll as text streams
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage, streamingThought]);

  // Auto-resize input textarea with safe minimum height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.max(48, Math.min(textareaRef.current.scrollHeight, 220));
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [inputText]);

  // Handle Form Submit
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && attachments.length === 0) || isStreaming) return;

    onSendMessage(inputText.trim(), attachments, isThinkingEnabled);
    setInputText('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = '48px';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // File Upload Handling
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = reader.result as string;
        const newAttachment: ChatAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          data: base64Data,
          previewUrl: file.type.startsWith('image/') ? base64Data : undefined,
        };
        setAttachments((prev) => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Copy helper
  const handleCopyMessage = (id: string, text: string) => {
    const cleanText = text.replace(/<thought>[\s\S]*?<\/thought>/gi, '').trim();
    navigator.clipboard.writeText(cleanText);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleCopyCode = (key: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeKey(key);
    setTimeout(() => setCopiedCodeKey(null), 2000);
  };

  // Text-To-Speech
  const handleToggleSpeak = (msgId: string, text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
    } else {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/<thought>[\s\S]*?<\/thought>/gi, '').trim();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.onend = () => setSpeakingMsgId(null);
      utterance.onerror = () => setSpeakingMsgId(null);
      window.speechSynthesis.speak(utterance);
      setSpeakingMsgId(msgId);
    }
  };

  const toggleThought = (msgId: string) => {
    setExpandedThoughts((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getProviderIcon = (provider?: string) => {
    switch (provider) {
      case 'andromeda':
        return <Flame className="w-4 h-4 text-amber-600" />;
      case 'ollama':
        return <Cpu className="w-4 h-4 text-emerald-600" />;
      case 'lmstudio':
        return <HardDrive className="w-4 h-4 text-purple-600" />;
      case 'groq':
        return <Zap className="w-4 h-4 text-orange-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-blue-600" />;
    }
  };

  // Extract <thought> tags from stored message content if present
  const parseThoughtAndContent = (text: string) => {
    const match = text.match(/<thought>([\s\S]*?)(?:<\/thought>|$)/i);
    if (match) {
      const thought = match[1].trim();
      const content = text.replace(/<thought>[\s\S]*?(?:<\/thought>|$)/i, '').trim();
      return { thought, content };
    }
    return { thought: null, content: text };
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-53px)] overflow-hidden bg-[#FAF9F5]">
      {/* Scrollable conversation thread */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Empty State: Andromeda Sovereign Studio greeting */}
          {messages.length === 0 && !isStreaming && (
            <div className="pt-8 pb-12 text-center max-w-xl mx-auto space-y-6 animate-in fade-in duration-300">
              {/* Andromeda Brand Glyph */}
              <div className="flex items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 via-orange-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-lg border border-white/20">
                  A
                </div>
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-semibold text-[#1C1917] tracking-tight font-display">
                  {getGreeting()}, {userName}
                </h1>
                <p className="text-sm text-[#78716C] leading-relaxed">
                  Welcome to <strong>Andromeda Sovereign AI Studio</strong>. Equipped with{' '}
                  <strong>Andromeda Soul 1</strong> (Frontier Uncapped), Google Gemini 2.5 Flash, Andromeda reasoning, and 100% free local models with Ollama & LM Studio.
                </p>
              </div>

              {/* Free Provider Badges */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900 shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Andromeda Soul 1 (Uncapped)
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E2E0D8] text-xs font-medium text-[#44403C] shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Gemini 2.5 Flash (Free Tier)
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E2E0D8] text-xs font-medium text-[#44403C] shadow-2xs">
                  <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                  Ollama (100% Free Local)
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E2E0D8] text-xs font-medium text-[#44403C] shadow-2xs">
                  <Brain className="w-3.5 h-3.5 text-amber-600" />
                  Extended Thinking
                </span>
              </div>

              {/* 4 Interactive Starter Prompt Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-left">
                {[
                  {
                    icon: <Sparkles className="w-4 h-4 text-amber-600" />,
                    title: 'Andromeda Soul 1 Deep Reason',
                    desc: 'Frontier uncapped architectural reasoning and high-level strategy.',
                    prompt:
                      'Analyze how modern sovereign AI systems orchestrate multi-provider fallback between local Ollama and cloud frontier models.',
                  },
                  {
                    icon: <FileText className="w-4 h-4 text-blue-600" />,
                    title: 'Code Synthesis & Refactor',
                    desc: 'Write clean, production-grade TypeScript, Python, or PyTorch models.',
                    prompt:
                      'Write a clean, robust TypeScript HTTP client with exponential backoff, rate limiting, and typed custom errors.',
                  },
                  {
                    icon: <Cpu className="w-4 h-4 text-emerald-600" />,
                    title: 'Local Ollama Setup & Run',
                    desc: 'Zero token cost running offline on your own machine.',
                    prompt:
                      'Hello from local Ollama! Give me a creative and precise explanation of quantum computing in 3 paragraphs.',
                  },
                  {
                    icon: <HardDrive className="w-4 h-4 text-purple-600" />,
                    title: 'Compare Models & APIs',
                    desc: 'Evaluate differences between Andromeda, Gemini, and local weights.',
                    prompt:
                      'Compare the strengths and latency profiles between Andromeda Soul 1, Gemini 2.5 Flash, and DeepSeek-R1 local.',
                  },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    id={`starter-prompt-${idx}`}
                    onClick={() => {
                      setInputText(item.prompt);
                      textareaRef.current?.focus();
                    }}
                    className="p-3.5 rounded-2xl bg-white hover:bg-[#F9F8F5] border border-[#E5E3DB] hover:border-[#D97706]/50 text-left transition-all shadow-2xs group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="p-1 rounded-md bg-[#FAF9F5] border border-[#EAE8E2] group-hover:bg-white">
                        {item.icon}
                      </div>
                      <span className="text-xs font-semibold text-[#1C1917]">{item.title}</span>
                    </div>
                    <p className="text-xs text-[#78716C] leading-snug line-clamp-2">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Render historical messages */}
          {messages.map((message) => {
            const isUser = message.role === 'user';
            const { thought, content } = parseThoughtAndContent(message.content);
            const effectiveThought = message.thought || thought;
            const isThoughtOpen = expandedThoughts[message.id] !== false; // open by default

            if (isUser) {
              return (
                <div key={message.id} className="flex justify-end items-start gap-2.5 animate-in fade-in duration-150">
                  <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 bg-[#F4F3EE] text-[#1C1917] border border-[#E5E3DC] shadow-2xs space-y-2">
                    {/* Attachments preview */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-0.5">
                        {message.attachments.map((att) => (
                          <div
                            key={att.id}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white border border-[#E0DED7] text-xs text-[#44403C]"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#8C887B]" />
                            <span className="truncate max-w-[140px] font-medium">{att.name}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="text-sm whitespace-pre-wrap leading-relaxed">{content}</div>
                  </div>

                  <UserAvatar
                    name={currentUser?.name || userName}
                    email={currentUser?.email}
                    avatar={currentUser?.avatar}
                    size="sm"
                    className="mt-1 shrink-0"
                  />
                </div>
              );
            }

            // Assistant message
            return (
              <div key={message.id} className="space-y-3 animate-in fade-in duration-150">
                {/* Assistant Header Avatar */}
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-white border border-[#E2E0D8] flex items-center justify-center shadow-2xs">
                    {getProviderIcon(currentModel.provider)}
                  </div>
                  <span className="text-xs font-semibold text-[#1C1917]">
                    {message.model || currentModel.name}
                  </span>
                  <span className="text-[11px] text-[#8C887B]">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Collapsible Thinking Accordion (Andromeda / Gemini Thinking) */}
                {effectiveThought && (
                  <div className="thought-container overflow-hidden border border-[#E5E3DB] rounded-xl shadow-2xs">
                    <button
                      id={`toggle-thought-${message.id}`}
                      onClick={() => toggleThought(message.id)}
                      className="w-full px-3.5 py-2 flex items-center justify-between text-xs font-medium text-[#78716C] hover:text-[#1C1917] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Brain className="w-3.5 h-3.5 text-[#D97706]" />
                        <span>Thinking process (reasoning trace)</span>
                      </div>
                      {isThoughtOpen ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {isThoughtOpen && (
                      <div className="px-4 py-3 border-t border-[#EAE7DE] text-xs font-mono text-[#57534E] whitespace-pre-wrap leading-relaxed bg-[#FAF9F5]/70 max-h-72 overflow-y-auto">
                        {effectiveThought}
                      </div>
                    )}
                  </div>
                )}

                {/* Assistant Markdown Content */}
                <div className="prose prose-sm max-w-none text-[#1C1917] leading-relaxed">
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        const codeString = String(children).replace(/\n$/, '');

                        if (!inline && match) {
                          const lang = match[1];
                          const codeKey = `code-${message.id}-${codeString.slice(0, 16)}`;
                          const isCopied = copiedCodeKey === codeKey;

                          return (
                            <div className="relative my-3 rounded-xl overflow-hidden border border-zinc-800 bg-[#18181B] text-zinc-100 shadow-sm">
                              <div className="flex items-center justify-between px-3.5 py-1.5 bg-zinc-900/90 border-b border-zinc-800 text-xs text-zinc-400">
                                <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-300">
                                  {lang}
                                </span>
                                <button
                                  onClick={() => handleCopyCode(codeKey, codeString)}
                                  className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-100 cursor-pointer"
                                >
                                  {isCopied ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                      <span className="text-emerald-400">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5" />
                                      <span>Copy code</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              <pre className="p-3.5 text-xs font-mono overflow-x-auto leading-relaxed">
                                <code>{children}</code>
                              </pre>
                            </div>
                          );
                        }

                        return (
                          <code className="px-1.5 py-0.5 rounded-md bg-[#F2F0E8] text-[#292524] text-xs font-mono font-medium">
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {content}
                  </ReactMarkdown>
                </div>

                {/* Smart Action for Ollama Connection helper */}
                {content.includes('Could Not Connect to Local Ollama') && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
                    <div className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      Switch Model Immediately (No local setup required)
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => onSelectModel('andromeda-soul-1')}
                        className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                      >
                        🚀 Switch to Andromeda Soul 1 (Frontier Uncapped)
                      </button>
                      <button
                        onClick={() => onSelectModel('gemini-3.6-flash')}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                      >
                        ⚡ Switch to Google Gemini 3.6 Flash (Free Tier)
                      </button>
                    </div>
                  </div>
                )}

                {/* Bottom Action Bar */}
                <div className="flex items-center gap-1 pt-1 text-xs text-[#78716C]">
                  <button
                    onClick={() => handleCopyMessage(message.id, content)}
                    className="p-1.5 rounded-lg hover:bg-[#F0EEE6] hover:text-[#1C1917] transition-colors cursor-pointer"
                    title="Copy response"
                  >
                    {copiedMsgId === message.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={() => handleToggleSpeak(message.id, content)}
                    className="p-1.5 rounded-lg hover:bg-[#F0EEE6] hover:text-[#1C1917] transition-colors cursor-pointer"
                    title={speakingMsgId === message.id ? 'Stop audio' : 'Read aloud'}
                  >
                    {speakingMsgId === message.id ? (
                      <VolumeX className="w-3.5 h-3.5 text-[#D97706]" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={onRegenerate}
                    className="p-1.5 rounded-lg hover:bg-[#F0EEE6] hover:text-[#1C1917] transition-colors cursor-pointer"
                    title="Regenerate"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Active Streaming Message */}
          {isStreaming && (
            <div className="space-y-3 animate-in fade-in duration-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-white border border-[#E2E0D8] flex items-center justify-center shadow-2xs">
                  {getProviderIcon(currentModel.provider)}
                </div>
                <span className="text-xs font-semibold text-[#1C1917]">{currentModel.name}</span>
                <span className="text-[11px] text-[#D97706] flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] animate-ping" />
                  Streaming...
                </span>
              </div>

              {/* Streaming Thought accordion */}
              {streamingThought && (
                <div className="thought-container overflow-hidden border border-[#E5E3DB] rounded-xl shadow-2xs">
                  <div className="px-3.5 py-2 flex items-center gap-2 text-xs font-medium text-[#78716C] bg-[#F7F6F1]">
                    <Brain className="w-3.5 h-3.5 text-[#D97706] animate-pulse" />
                    <span>Thinking...</span>
                  </div>
                  <div className="px-4 py-2 text-xs font-mono text-[#57534E] whitespace-pre-wrap leading-relaxed bg-[#FAF9F5]/70 max-h-56 overflow-y-auto">
                    {streamingThought}
                  </div>
                </div>
              )}

              {/* Streaming Token Text */}
              <div className="prose prose-sm max-w-none text-[#1C1917] leading-relaxed">
                <ReactMarkdown>{streamingMessage}</ReactMarkdown>
                <span className="inline-block w-1.5 h-4 bg-[#D97706] ml-1 animate-blink align-middle" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Floating Andromeda Input Box */}
      <div className="p-2.5 sm:p-4 bg-gradient-to-t from-[#FAF9F5] via-[#FAF9F5] to-transparent shrink-0">
        <div className="max-w-3xl mx-auto">
          <div
            onClick={() => textareaRef.current?.focus()}
            className="andromeda-input-pill rounded-2xl p-2.5 sm:p-3 transition-all cursor-text focus-within:ring-2 focus-within:ring-amber-500/20"
          >
            {/* Attachment preview chips */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2 p-1 border-b border-[#F0EEE6]">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F5F3EC] border border-[#E5E3DB] text-xs text-[#292524]"
                  >
                    {att.previewUrl ? (
                      <img src={att.previewUrl} alt={att.name} className="w-4 h-4 rounded object-cover" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-[#78716C]" />
                    )}
                    <span className="truncate max-w-[140px] font-medium">{att.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveAttachment(att.id);
                      }}
                      className="p-0.5 text-[#78716C] hover:text-rose-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input Textarea - always spacious and tap-friendly on mobile */}
            <textarea
              ref={textareaRef}
              id="andromeda-chat-textarea"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${currentModel.name} (Gemini, Andromeda, Ollama)...`}
              rows={2}
              className="w-full bg-transparent resize-none border-none outline-none text-[15px] sm:text-sm text-[#1C1917] placeholder:text-[#8C887B] placeholder:opacity-100 leading-relaxed min-h-[48px] max-h-48 px-2 py-1 block cursor-text font-sans"
            />

            {/* Bottom Controls Bar inside Pill */}
            <div
              className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-[#F5F3EC]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left Actions: Attachments & Thinking Toggle */}
              <div className="flex items-center gap-1 sm:gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  className="hidden"
                  accept="image/*,text/*,.js,.jsx,.ts,.tsx,.py,.json,.md,.html,.css"
                />

                <button
                  id="attach-file-button"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 sm:p-1.5 rounded-lg text-[#78716C] hover:text-[#1C1917] hover:bg-[#F2F0E8] transition-colors cursor-pointer"
                  title="Attach images, documents, or code"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {/* Extended Thinking Toggle (Claude 3.7 / Gemini Thinking) */}
                <button
                  id="toggle-thinking-button"
                  type="button"
                  onClick={() => setIsThinkingEnabled(!isThinkingEnabled)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 sm:px-2 sm:py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isThinkingEnabled
                      ? 'bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs'
                      : 'text-[#78716C] hover:bg-[#F2F0E8] hover:text-[#1C1917]'
                  }`}
                  title="Toggle Extended Thinking (Chain of Thought)"
                >
                  <Brain className={`w-3.5 h-3.5 ${isThinkingEnabled ? 'text-amber-600' : 'text-[#8C887B]'}`} />
                  <span className="text-xs">
                    {isThinkingEnabled ? 'Thinking on' : 'Thinking off'}
                  </span>
                </button>

                {/* Model badge quick link */}
                <button
                  onClick={onOpenProvidersModal}
                  className="hidden md:flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-[#78716C] hover:bg-[#F2F0E8] hover:text-[#1C1917] transition-colors cursor-pointer"
                  title="Click to configure providers"
                >
                  {getProviderIcon(currentModel.provider)}
                  <span className="font-medium truncate max-w-[120px]">{currentModel.name}</span>
                </button>
              </div>

              {/* Right Action: Send / Stop button */}
              <div className="flex items-center gap-2">
                {isStreaming ? (
                  <button
                    id="stop-streaming-button"
                    onClick={onStopStreaming}
                    className="flex items-center justify-center w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-[#1C1917] hover:bg-rose-600 text-white transition-colors cursor-pointer shadow-xs"
                    title="Stop generation"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                  </button>
                ) : (
                  <button
                    id="send-message-button"
                    onClick={() => handleSubmit()}
                    disabled={!inputText.trim() && attachments.length === 0}
                    className={`flex items-center justify-center w-9 h-9 sm:w-8 sm:h-8 rounded-full transition-all cursor-pointer shadow-xs ${
                      inputText.trim() || attachments.length > 0
                        ? 'bg-[#1C1917] hover:bg-[#D97706] text-white'
                        : 'bg-[#E5E3DB] text-[#A8A29E] cursor-not-allowed'
                    }`}
                    title="Send message"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-1.5 text-center text-[10px] sm:text-[11px] text-[#8C887B]">
            Free tier & local models can make mistakes. Verify important code & calculations.
          </div>
        </div>
      </div>
    </div>
  );
};
