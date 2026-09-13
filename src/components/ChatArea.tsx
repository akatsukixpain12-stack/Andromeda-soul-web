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
  Plus,
  Share2,
  Trash2,
  PanelLeft,
  ChevronDown,
  ChevronRight,
  Brain,
  FileText,
  AlertCircle,
  Zap,
  Bot,
  Edit2,
  ShieldCheck,
  Menu,
} from 'lucide-react';
import { ChatMessage, ChatAttachment, GeminiModel } from '../types';
import { ModelSelector } from './ModelSelector';
import { AestheticHero } from './AestheticHero';

interface ChatAreaProps {
  messages: ChatMessage[];
  streamingMessage: string;
  isStreaming: boolean;
  onSendMessage: (prompt: string, attachments?: ChatAttachment[]) => void;
  onStopStreaming: () => void;
  onRegenerate: () => void;
  onClearChat: () => void;
  onNewChat: () => void;
  models: GeminiModel[];
  selectedModelId: string;
  onSelectModelId: (modelId: string) => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onEditMessage: (content: string) => void;
  onOpenDiscordBot?: () => void;
  activeConversationTitle?: string;
  onRenameActiveConversation?: (newTitle: string) => void;
  userName?: string;
  onUpdateUserName?: (name: string) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  streamingMessage,
  isStreaming,
  onSendMessage,
  onStopStreaming,
  onRegenerate,
  onClearChat,
  onNewChat,
  models,
  selectedModelId,
  onSelectModelId,
  isSidebarCollapsed,
  onToggleSidebar,
  onEditMessage,
  onOpenDiscordBot,
  activeConversationTitle,
  onRenameActiveConversation,
  userName,
  onUpdateUserName,
}) => {
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [copiedCodeKey, setCopiedCodeKey] = useState<string | null>(null);
  const [isSpeakingId, setIsSpeakingId] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showThoughtMap, setShowThoughtMap] = useState<Record<string, boolean>>({});
  
  // Header title editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');

  const parseMessageContent = (text: string) => {
    const match = text.match(/<thought>([\s\S]*?)(?:<\/thought>|$)/i);
    if (match) {
      const thought = match[1].trim();
      const content = text.replace(/<thought>[\s\S]*?(?:<\/thought>|$)/i, '').trim();
      return { thought, content };
    }
    return { thought: null, content: text };
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom as new messages or tokens arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  // Auto-resize textarea as text grows
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputText]);

  // Handle Form Submit
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && attachments.length === 0) || isStreaming) return;

    onSendMessage(inputText.trim(), attachments);
    setInputText('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
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

  // Copy helpers
  const handleCopyMessage = (id: string, text: string) => {
    const { content } = parseMessageContent(text);
    navigator.clipboard.writeText(content);
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

    if (isSpeakingId === msgId) {
      window.speechSynthesis.cancel();
      setIsSpeakingId(null);
    } else {
      window.speechSynthesis.cancel();
      const { content } = parseMessageContent(text);
      const utterance = new SpeechSynthesisUtterance(content);
      utterance.onend = () => setIsSpeakingId(null);
      utterance.onerror = () => setIsSpeakingId(null);
      window.speechSynthesis.speak(utterance);
      setIsSpeakingId(msgId);
    }
  };

  // Export helpers
  const handleExportMarkdown = () => {
    const md = messages
      .map(
        (m) =>
          `### ${m.role === 'user' ? 'User' : 'Andromeda Soul 1.0'}\n\n${m.content}\n\n---\n`
      )
      .join('\n');
    navigator.clipboard.writeText(md);
    setShowExportMenu(false);
  };

  const handleDownloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(messages, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `andromeda-soul1-chat-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setShowExportMenu(false);
  };

  const handleStartHeaderRename = () => {
    setTitleInput(activeConversationTitle || 'New chat');
    setIsEditingTitle(true);
  };

  const handleSaveHeaderRename = () => {
    if (titleInput.trim() && onRenameActiveConversation) {
      onRenameActiveConversation(titleInput.trim());
    }
    setIsEditingTitle(false);
  };

  // Prompt suggestions for empty state
  const suggestions = [
    {
      icon: <Bot className="w-4 h-4 text-violet-500" />,
      title: 'Discord Bot with Soul 1',
      prompt: 'Build a Discord Bot in discord.js with /ask slash command and zero token leak architecture.',
    },
    {
      icon: <Zap className="w-4 h-4 text-amber-500" />,
      title: 'Create Own AI with Python',
      prompt: 'Write a complete Python implementation of an LLM transformer from scratch using PyTorch with RoPE embeddings and a FastAPI local inference server.',
    },
    {
      icon: <Brain className="w-4 h-4 text-purple-500" />,
      title: 'Deep Reasoning 100,000x',
      prompt: '/think100000times Analyze multi-query attention, KV cache compression, and flash attention in frontier architectures.',
    },
    {
      icon: <ShieldCheck className="w-4 h-4 text-emerald-500" />,
      title: 'Discord Moderation & Auto-Role',
      prompt: 'Code a Discord bot that handles automatic member welcomes, auto-role assignments, and message rule verification.',
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#09090b] text-zinc-100 overflow-hidden relative">
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-xl z-20 shrink-0 min-h-[52px]">
        {/* Left: Sidebar Toggle & Conversation Title */}
        <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
          <button
            id="open-sidebar-btn"
            onClick={onToggleSidebar}
            title="Toggle sidebar"
            className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            {isSidebarCollapsed ? <Menu className="w-5 h-5" /> : <PanelLeft className="w-4 h-4 hidden md:block" />}
            <span className="md:hidden">
              <Menu className="w-5 h-5" />
            </span>
          </button>

          {/* Conversation Title (Editable) */}
          <div className="min-w-0 flex items-center gap-1.5">
            {isEditingTitle ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveHeaderRename();
                }}
                className="flex items-center gap-1"
              >
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onBlur={handleSaveHeaderRename}
                  autoFocus
                  className="px-2 py-1 rounded-lg text-xs sm:text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-violet-500 focus:outline-hidden"
                />
                <button
                  type="submit"
                  className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <div
                onClick={handleStartHeaderRename}
                className="group flex items-center gap-1.5 cursor-pointer rounded-lg px-1.5 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors max-w-[130px] xs:max-w-[180px] sm:max-w-[280px] md:max-w-[360px]"
                title="Click to rename conversation"
              >
                <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                  {activeConversationTitle || 'Andromeda Soul 1.0'}
                </span>
                <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
            )}
          </div>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <ModelSelector
            models={models}
            selectedModelId={selectedModelId}
            onSelectModel={onSelectModelId}
          />

          {onOpenDiscordBot && (
            <button
              id="header-discord-hub-btn"
              onClick={onOpenDiscordBot}
              title="Discord Bot Hub"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-500/20 transition-all text-xs font-semibold cursor-pointer min-h-[40px]"
            >
              <Bot className="w-4 h-4 text-violet-500 shrink-0" />
              <span className="hidden sm:inline">Discord Bot</span>
            </button>
          )}

          <button
            id="header-new-chat-btn"
            onClick={onNewChat}
            title="New Chat"
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Export / Actions Dropdown */}
          <div className="relative">
            <button
              id="export-menu-btn"
              onClick={() => setShowExportMenu(!showExportMenu)}
              title="Share / Export"
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 text-xs">
                <button
                  id="copy-markdown-btn"
                  onClick={handleExportMarkdown}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  Copy as Markdown
                </button>
                <button
                  id="download-json-btn"
                  onClick={handleDownloadJSON}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Export JSON History
                </button>
                {messages.length > 0 && (
                  <button
                    onClick={() => {
                      onClearChat();
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center gap-2 cursor-pointer border-t border-slate-100 dark:border-slate-800 mt-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear Chat
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Messages Feed */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 && !isStreaming ? (
          /* Aesthetic Hero Welcome (Matching user image with custom name) */
          <AestheticHero
            userName={userName || 'DIVINE JOHAN'}
            onUpdateUserName={onUpdateUserName || (() => {})}
            onSelectPrompt={(p) => onSendMessage(p)}
            onScrollToChat={() => textareaRef.current?.focus()}
          />
        ) : (
          /* Active Chat Thread */
          <div className="max-w-3xl mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-5">
            {/* Session Welcome Pill */}
            <div className="flex items-center justify-center pb-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800/90 text-xs text-zinc-400 shadow-sm font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Connected as</span>
                <span className="text-zinc-100 font-bold uppercase">{userName || 'DIVINE JOHAN'}</span>
              </div>
            </div>
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              const isSpeaking = isSpeakingId === msg.id;

              return (
                <div
                  key={msg.id}
                  id={`message-${msg.id}`}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group`}
                >
                  {/* Message Bubble Container */}
                  <div
                    className={`flex items-start gap-2.5 max-w-[96%] sm:max-w-[88%] ${
                      isUser ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    {/* Assistant Avatar */}
                    {!isUser && (
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0 mt-0.5 border border-violet-500/20">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      {/* Attached media for user messages */}
                      {isUser && msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2 justify-end">
                          {msg.attachments.map((att) => (
                            <div key={att.id} className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                              {att.type.startsWith('image/') ? (
                                <img
                                  src={att.previewUrl || att.data}
                                  alt={att.name}
                                  className="w-24 h-24 sm:w-28 sm:h-28 object-cover"
                                />
                              ) : (
                                <div className="flex items-center gap-1.5 p-2 bg-slate-100 dark:bg-slate-800 text-xs font-mono">
                                  <FileText className="w-4 h-4 text-slate-400" />
                                  <span className="truncate max-w-[120px]">{att.name}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Bubble styling */}
                      <div
                        className={`rounded-2xl text-xs sm:text-sm leading-relaxed ${
                          msg.error
                            ? 'w-full'
                            : isUser
                            ? 'px-4 py-2.5 sm:py-3 bg-violet-600 text-white shadow-xs rounded-tr-xs'
                            : 'px-1 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {msg.error ? (
                          <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-950 dark:text-amber-100">
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                                <AlertCircle className="w-5 h-5" />
                              </div>
                              <div className="flex-1 space-y-2">
                                <div className="font-semibold text-xs tracking-wide uppercase text-amber-800 dark:text-amber-300">
                                  Request Notice
                                </div>
                                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                                  {msg.content}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 pt-1.5">
                                  <button
                                    type="button"
                                    onClick={onRegenerate}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    Retry
                                  </button>
                                  {selectedModelId !== 'gemini-3.1-flash-lite' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onSelectModelId('gemini-3.1-flash-lite');
                                        setTimeout(() => {
                                          onRegenerate();
                                        }, 50);
                                      }}
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium transition-colors cursor-pointer"
                                    >
                                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                                      Try Flash Lite
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : isUser ? (
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        ) : (
                          <div className="space-y-3">
                            {/* Andromeda Soul 1.0 100,000x Deep Thinking Trace */}
                            {(() => {
                              const { thought, content } = parseMessageContent(msg.content);
                              const isThoughtOpen = showThoughtMap[msg.id] ?? false;
                              return (
                                <>
                                  {thought && (
                                    <div className="mb-3 rounded-2xl border border-violet-500/30 bg-violet-500/5 dark:bg-violet-950/20 overflow-hidden">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setShowThoughtMap((prev) => ({
                                            ...prev,
                                            [msg.id]: !isThoughtOpen,
                                          }))
                                        }
                                        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-violet-700 dark:text-violet-300 hover:bg-violet-500/10 transition-colors cursor-pointer"
                                      >
                                        <div className="flex items-center gap-2">
                                          <Brain className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                                          <span className="truncate">Andromeda 100,000x Reasoning Trace</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-[11px] text-violet-600/80 dark:text-violet-400/80 shrink-0">
                                          <span>{isThoughtOpen ? 'Hide' : 'Show'}</span>
                                          {isThoughtOpen ? (
                                            <ChevronDown className="w-3.5 h-3.5" />
                                          ) : (
                                            <ChevronRight className="w-3.5 h-3.5" />
                                          )}
                                        </div>
                                      </button>
                                      {isThoughtOpen && (
                                        <div className="p-3 border-t border-violet-500/20 bg-slate-900/70 text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto overflow-x-auto break-words">
                                          {thought}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  <div className="markdown-content prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed space-y-3">
                                    <ReactMarkdown
                                      components={{
                                        code(props) {
                                          const { children, className, ...rest } = props;
                                          const match = /language-(\w+)/.exec(className || '');
                                          const codeString = String(children).replace(/\n$/, '');
                                          const isInline = !match && !codeString.includes('\n');

                                          if (isInline) {
                                            return (
                                              <code
                                                className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-violet-300 font-mono text-xs"
                                                {...rest}
                                              >
                                                {children}
                                              </code>
                                            );
                                          }

                                          const codeKey = `${msg.id}-${codeString.slice(0, 16)}`;
                                          const isCopied = copiedCodeKey === codeKey;

                                          return (
                                            <div className="my-2.5 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-100 font-mono text-xs">
                                              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-slate-400">
                                                <span className="text-[11px] font-semibold uppercase tracking-wider">
                                                  {match ? match[1] : 'code'}
                                                </span>
                                                <button
                                                  type="button"
                                                  onClick={() => handleCopyCode(codeKey, codeString)}
                                                  className="flex items-center gap-1 text-[11px] hover:text-white transition-colors cursor-pointer"
                                                >
                                                  {isCopied ? (
                                                    <>
                                                      <Check className="w-3 h-3 text-emerald-400" />
                                                      <span className="text-emerald-400">Copied!</span>
                                                    </>
                                                  ) : (
                                                    <>
                                                      <Copy className="w-3 h-3" />
                                                      <span>Copy code</span>
                                                    </>
                                                  )}
                                                </button>
                                              </div>
                                              <pre className="p-3 overflow-x-auto text-xs leading-5">
                                                <code>{children}</code>
                                              </pre>
                                            </div>
                                          );
                                        },
                                      }}
                                    >
                                      {content}
                                    </ReactMarkdown>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        )}
                      </div>

                      {/* Action toolbar below message */}
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg.id, msg.content)}
                          title="Copy text"
                          className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          {copiedMsgId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {!isUser && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleToggleSpeak(msg.id, msg.content)}
                              title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
                              className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              {isSpeaking ? (
                                <VolumeX className="w-3.5 h-3.5 text-amber-500" />
                              ) : (
                                <Volume2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={onRegenerate}
                              title="Regenerate response"
                              className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {isUser && (
                          <button
                            type="button"
                            onClick={() => onEditMessage(msg.content)}
                            title="Edit message"
                            className="text-[11px] hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer px-1"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Active Streaming Block */}
            {isStreaming && (
              <div className="flex items-start gap-2.5 max-w-[95%] sm:max-w-[88%] animate-in fade-in duration-150">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0 mt-0.5 border border-violet-500/20">
                  <Bot className="w-4 h-4 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0 px-1 text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-relaxed space-y-2">
                  {streamingMessage ? (
                    (() => {
                      const { thought, content } = parseMessageContent(streamingMessage);
                      return (
                        <>
                          {thought && (
                            <div className="p-2.5 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-xs font-mono text-violet-300 space-y-1">
                              <div className="flex items-center gap-1.5 font-bold text-violet-400">
                                <Brain className="w-3.5 h-3.5 animate-pulse" />
                                <span>Soul 1 Reasoning Active...</span>
                              </div>
                              <p className="line-clamp-2 text-slate-400">{thought}</p>
                            </div>
                          )}
                          <div className="markdown-content prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed">
                            <ReactMarkdown>{content || 'Synthesizing response...'}</ReactMarkdown>
                            <span className="inline-block w-1.5 h-4 bg-violet-500 ml-1 animate-pulse" />
                          </div>
                        </>
                      );
                    })()
                  ) : (
                    <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
                      <span className="w-2 h-2 rounded-full bg-violet-500 animate-ping" />
                      <span>Andromeda Soul 1.0 Reasoning Active...</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Section & Chips */}
      <div className="p-3 sm:p-4 bg-white/95 dark:bg-slate-900/95 border-t border-slate-100 dark:border-slate-800/80 shrink-0">
        <div className="max-w-3xl mx-auto space-y-2">
          {/* Quick Action Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            {onOpenDiscordBot && (
              <button
                type="button"
                onClick={onOpenDiscordBot}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/10 hover:bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-500/20 text-xs font-semibold transition-all cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5 text-violet-500" />
                <span>Discord Bot Hub</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (!inputText.includes('/think100000times')) {
                  setInputText((prev) => `/think100000times ${prev}`);
                }
              }}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/20 text-xs font-semibold transition-all cursor-pointer"
            >
              <Brain className="w-3.5 h-3.5 text-purple-500" />
              <span>/think100000times</span>
            </button>
          </div>

          {/* Attached Files Preview Bar */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800"
                >
                  {att.type.startsWith('image/') ? (
                    <img
                      src={att.previewUrl || att.data}
                      alt={att.name}
                      className="w-4 h-4 object-cover rounded"
                    />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span className="truncate max-w-[120px] font-medium">{att.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(att.id)}
                    className="text-slate-400 hover:text-rose-500 ml-1 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input Box Card */}
          <form
            onSubmit={handleSubmit}
            className="relative flex flex-col rounded-2xl sm:rounded-3xl border border-zinc-800 bg-zinc-900/90 shadow-2xl backdrop-blur-md focus-within:border-violet-500/50 focus-within:ring-2 focus-within:ring-violet-500/20 transition-all overflow-hidden"
          >
            {/* Multiline auto-expanding textarea */}
            <textarea
              id="prompt-textarea"
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask Andromeda Soul 1.0 anything, ${userName || 'Divine Johan'}...`}
              className="w-full px-4 pt-3 pb-2 max-h-44 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 bg-transparent resize-none focus:outline-hidden leading-relaxed"
            />

            {/* Bottom tools row */}
            <div className="flex items-center justify-between px-3 py-1.5 border-t border-zinc-800/80">
              <div className="flex items-center gap-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  accept="image/*,text/*,.pdf,.json,.ts,.tsx,.js,.py,.md"
                  className="hidden"
                />
                <button
                  id="attach-file-btn"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach images or documents"
                  className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
              </div>

              {/* Submit / Stop Button */}
              <div className="flex items-center gap-2">
                {isStreaming ? (
                  <button
                    id="stop-generating-btn"
                    type="button"
                    onClick={onStopStreaming}
                    title="Stop generating"
                    className="p-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-xs cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                  </button>
                ) : (
                  <button
                    id="send-message-btn"
                    type="submit"
                    disabled={!inputText.trim() && attachments.length === 0}
                    title="Send message"
                    className={`p-2 rounded-full transition-all cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center ${
                      inputText.trim() || attachments.length > 0
                        ? 'bg-violet-600 text-white shadow-xs hover:bg-violet-700'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </form>

          {/* Footer Disclaimer */}
          <p className="text-center text-[10px] text-slate-400 dark:text-slate-500">
            Andromeda Soul 1.0 • Zero token leak protection active.
          </p>
        </div>
      </div>
    </div>
  );
};
