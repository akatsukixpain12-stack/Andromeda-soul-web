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
  FolderArchive,
  Bot,
  RefreshCw,
  CheckCircle2,
  Cloud,
} from 'lucide-react';
import { ChatMessage, ChatAttachment, AIModelOption, UserProfile, LearnedKnowledge } from '../types';
import { AI_MODELS, findModelById } from '../data/models';
import { UserAvatar } from './UserAvatar';
import { createZipFromCode, triggerDownload } from '../lib/zipExporter';
import { DiscordLiveChatModal } from './DiscordLiveChatModal';
import { LearnedKnowledgeModal } from './LearnedKnowledgeModal';
import { dbSaveLearnedKnowledge, dbSubscribeKnowledge } from '../lib/firebase';

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
  onOpenDiscord?: () => void;
  customModels?: AIModelOption[];
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
  onOpenDiscord,
  customModels = [],
}) => {
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isThinkingEnabled, setIsThinkingEnabled] = useState(true);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [copiedCodeKey, setCopiedCodeKey] = useState<string | null>(null);
  const [zippingCodeKey, setZippingCodeKey] = useState<string | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});

  // Discord Live Interactive Pop-up & Side Update State
  const [isDiscordLiveChatOpen, setIsDiscordLiveChatOpen] = useState(false);
  const [activeBotCode, setActiveBotCode] = useState('');
  const [updatingCodeKey, setUpdatingCodeKey] = useState<string | null>(null);
  const [updatedCodeKey, setUpdatedCodeKey] = useState<string | null>(null);

  // Cloud Learned Knowledge State
  const [isLearnedKnowledgeOpen, setIsLearnedKnowledgeOpen] = useState(false);
  const [learnedKnowledgeList, setLearnedKnowledgeList] = useState<LearnedKnowledge[]>([]);
  const [teachingMsgId, setTeachingMsgId] = useState<string | null>(null);
  const [taughtSuccessMsgId, setTaughtSuccessMsgId] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentModel = findModelById(selectedModelId, customModels);

  // Subscribe to Cloud Learned Knowledge for this user
  useEffect(() => {
    if (currentUser?.id) {
      const unsub = dbSubscribeKnowledge(currentUser.id, (list) => {
        setLearnedKnowledgeList(list);
      });
      return () => unsub();
    }
  }, [currentUser?.id]);

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

  // Handle Form Submit & Intercept /discord Command
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPrompt = inputText.trim();

    // Check for /discord command: opens Discord connect page directly without any extra steps
    if (cleanPrompt.toLowerCase() === '/discord' || cleanPrompt.toLowerCase().startsWith('/discord ')) {
      setInputText('');
      if (textareaRef.current) textareaRef.current.style.height = '48px';
      if (onOpenDiscord) {
        onOpenDiscord();
        return;
      }
    }

    if ((!cleanPrompt && attachments.length === 0) || isStreaming) return;

    onSendMessage(cleanPrompt, attachments, isThinkingEnabled);
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

  // ZIP Exporter Handlers
  const handleDownloadCodeZip = async (codeKey: string, code: string, lang: string) => {
    setZippingCodeKey(codeKey);
    try {
      const result = await createZipFromCode(
        `\`\`\`${lang}\n${code}\n\`\`\``,
        `andromeda_${lang}_artifact`
      );
      if (result.success && result.blob && result.filename) {
        triggerDownload(result.blob, result.filename);
      }
    } catch (err) {
      console.error('Error generating code ZIP:', err);
    } finally {
      setZippingCodeKey(null);
    }
  };

  const handleDownloadFullMessageZip = async (messageId: string, fullContent: string) => {
    setZippingCodeKey(`full-${messageId}`);
    try {
      const result = await createZipFromCode(fullContent, `andromeda_project_${messageId.slice(0, 8)}`);
      if (result.success && result.blob && result.filename) {
        triggerDownload(result.blob, result.filename);
      }
    } catch (err) {
      console.error('Error generating project ZIP:', err);
    } finally {
      setZippingCodeKey(null);
    }
  };

  // Direct Side "Update Bot" Action
  const handleDirectUpdateBot = async (codeKey: string, codeString: string) => {
    setUpdatingCodeKey(codeKey);
    try {
      await fetch('/api/discord/update-bot-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeString, filename: 'index.js' }),
      });
      setUpdatedCodeKey(codeKey);
      setTimeout(() => setUpdatedCodeKey(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingCodeKey(null);
    }
  };

  // Teach Andromeda / Save to Google Cloud Server
  const handleTeachAndromeda = async (msgId: string, content: string) => {
    setTeachingMsgId(msgId);
    try {
      const firstLine = content.split('\n')[0].replace(/[#*`_]/g, '').trim();
      const topic = firstLine.slice(0, 60) || 'AI Assistant Solution';
      const insight = content.slice(0, 450);

      const item: LearnedKnowledge = {
        id: `know-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        topic,
        insight,
        category: content.includes('discord') ? 'discord_bot' : content.includes('```') ? 'coding_style' : 'general_intelligence',
        source: 'feedback',
        userId: currentUser?.id || 'usr_local',
        userEmail: currentUser?.email,
        createdAt: Date.now(),
        tags: ['auto-learned', 'cloud-sync'],
      };

      if (currentUser?.id && currentUser.provider !== 'guest') {
        await dbSaveLearnedKnowledge(currentUser.id, item);
      }
      setLearnedKnowledgeList((prev) => [item, ...prev]);
      setTaughtSuccessMsgId(msgId);
      setTimeout(() => setTaughtSuccessMsgId(null), 3000);
    } catch (err) {
      console.error('Failed to teach Andromeda:', err);
    } finally {
      setTeachingMsgId(null);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleCopyCode = (key: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeKey(key);
    setTimeout(() => setCopiedCodeKey(null), 2000);
  };

  const handleToggleSpeak = (msgId: string, text: string) => {
    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/```[\s\S]*?```/g, 'Code block omitted.').replace(/[#*`_]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const toggleThought = (id: string) => {
    setExpandedThoughts((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

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
      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'andromeda':
        return <Flame className="w-3.5 h-3.5 text-[#D97706]" />;
      case 'google':
      case 'gemini':
        return <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />;
      case 'ollama':
        return <Cpu className="w-3.5 h-3.5 text-[#059669]" />;
      case 'lmstudio':
        return <HardDrive className="w-3.5 h-3.5 text-[#7C3AED]" />;
      default:
        return <Zap className="w-3.5 h-3.5 text-[#4F46E5]" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAF9F5] relative overflow-hidden">
      {/* Top Floating Cloud Knowledge Indicator Bar */}
      <div className="h-10 bg-white/70 backdrop-blur-xs border-b border-[#E2E0D8] px-4 sm:px-6 flex items-center justify-between shrink-0 text-xs text-[#78716C]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLearnedKnowledgeOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 font-medium border border-amber-500/20 transition-colors cursor-pointer"
            title="View insights & rules saved to Google Cloud server"
          >
            <Brain className="w-3.5 h-3.5 text-amber-600" />
            <span>Google Cloud Learned Memory ({learnedKnowledgeList.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Storage: Google Cloud Server</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Empty Chat Welcome State */}
          {messages.length === 0 && !isStreaming && (
            <div className="h-[55vh] flex flex-col items-center justify-center text-center px-4">
              <div className="relative mb-4">
                <img
                  src="/andromeda-logo.png"
                  alt="Andromeda Soul Mascot"
                  className="w-20 h-20 rounded-2xl object-cover shadow-lg border border-blue-200/60 ring-2 ring-blue-500/20"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#1C1917] tracking-tight mb-1">
                Andromeda Soul v1.0
              </h2>
              <p className="text-xs text-[#78716C] max-w-sm leading-relaxed mb-5 font-mono">
                Think • Code • Create • Together
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-md">
                {[
                  'Code a Discord bot (/discord)',
                  'Generate image of a futuristic cybernetic city',
                  'Explain quantum computing simply',
                  'Generate a full TypeScript project',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => onSendMessage(suggestion, [], isThinkingEnabled)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-[#E2E0D8] hover:border-blue-500/50 hover:bg-[#F9F8F5] text-xs text-[#44403C] transition-all cursor-pointer shadow-2xs font-sans"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => {
            const isUser = message.role === 'user';
            const content = message.content;
            const thought = message.thought;
            const isThoughtExpanded = expandedThoughts[message.id] ?? false;

            if (isUser) {
              return (
                <div key={message.id} className="flex justify-end items-start gap-3">
                  <div className="max-w-[85%] sm:max-w-[75%] space-y-2">
                    {/* User attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 justify-end">
                        {message.attachments.map((att) => (
                          <div
                            key={att.id}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#EBE8DF] border border-[#DDD9CE] text-xs text-[#1C1917]"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#78716C]" />
                            <span className="font-mono text-xs max-w-[140px] truncate">{att.name}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="px-4 py-3 rounded-2xl bg-[#1C1917] text-[#FAF9F5] text-sm leading-relaxed whitespace-pre-wrap font-sans shadow-xs selection:bg-[#D97706] selection:text-white">
                      {content}
                    </div>
                  </div>
                  <UserAvatar user={currentUser} name={userName} size="sm" />
                </div>
              );
            }

            // Assistant message
            return (
              <div key={message.id} className="flex flex-col space-y-3">
                {/* Assistant Model Tag & Thought */}
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-white border border-[#E2E0D8] flex items-center justify-center shadow-2xs">
                    {getProviderIcon(currentModel.provider)}
                  </div>
                  <span className="text-xs font-semibold text-[#1C1917]">{currentModel.name}</span>
                  {message.modelId && (
                    <span className="text-[10px] font-mono text-[#A8A29E] px-1.5 py-0.5 rounded bg-[#F0EEE6]">
                      {message.modelId}
                    </span>
                  )}
                </div>

                {/* Thought Accordion */}
                {thought && (
                  <div className="rounded-xl border border-[#E2E0D8] bg-[#F4F2EB]/60 overflow-hidden text-xs">
                    <button
                      onClick={() => toggleThought(message.id)}
                      className="w-full px-3.5 py-2 flex items-center justify-between text-[#78716C] hover:text-[#1C1917] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 font-medium">
                        <Brain className="w-3.5 h-3.5 text-amber-600" />
                        <span>Thinking Process & Reasoning</span>
                      </div>
                      {isThoughtExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {isThoughtExpanded && (
                      <div className="px-3.5 py-2.5 bg-white/70 border-t border-[#E2E0D8] text-[#44403C] font-mono text-xs leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                        {thought}
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
                          const isDiscordCode =
                            codeString.includes('discord.js') ||
                            codeString.includes('Client') ||
                            codeString.includes('GatewayIntentBits') ||
                            codeString.includes('SlashCommandBuilder') ||
                            codeString.includes('discord.py') ||
                            codeString.includes('discord.ext');

                          return (
                            <div className="relative my-3 rounded-xl overflow-hidden border border-zinc-800 bg-[#18181B] text-zinc-100 shadow-sm">
                              <div className="flex items-center justify-between px-3.5 py-1.5 bg-zinc-900/90 border-b border-zinc-800 text-xs text-zinc-400">
                                <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-300">
                                  {lang}
                                </span>
                                <div className="flex items-center gap-2">
                                  {/* Discord Live Pop-up Trigger */}
                                  {isDiscordCode && (
                                    <button
                                      onClick={() => {
                                        setActiveBotCode(codeString);
                                        setIsDiscordLiveChatOpen(true);
                                      }}
                                      className="flex items-center gap-1 text-xs text-[#5865F2] hover:text-[#7289DA] transition-colors cursor-pointer font-medium"
                                      title="Open interactive Discord chat simulator"
                                    >
                                      <Bot className="w-3.5 h-3.5" />
                                      <span>Live Discord Chat</span>
                                    </button>
                                  )}

                                  {/* Side Update Button */}
                                  {isDiscordCode && (
                                    <button
                                      id={`update-bot-btn-${codeKey}`}
                                      onClick={() => handleDirectUpdateBot(codeKey, codeString)}
                                      disabled={updatingCodeKey === codeKey}
                                      className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded font-mono font-bold transition-all cursor-pointer ${
                                        updatedCodeKey === codeKey
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-[#5865F2] hover:bg-[#4752C4] text-white'
                                      }`}
                                      title="Hot-reload and update Discord bot script"
                                    >
                                      {updatingCodeKey === codeKey ? (
                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                      ) : updatedCodeKey === codeKey ? (
                                        <CheckCircle2 className="w-3 h-3" />
                                      ) : (
                                        <RefreshCw className="w-3 h-3" />
                                      )}
                                      <span>
                                        {updatingCodeKey === codeKey
                                          ? 'Updating...'
                                          : updatedCodeKey === codeKey
                                          ? 'Bot Updated!'
                                          : 'Update Bot'}
                                      </span>
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handleDownloadCodeZip(codeKey, codeString, lang)}
                                    disabled={zippingCodeKey === codeKey}
                                    className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors cursor-pointer font-mono"
                                    title="Download as standalone code ZIP"
                                  >
                                    <FolderArchive className="w-3.5 h-3.5" />
                                    <span>{zippingCodeKey === codeKey ? 'Zipping...' : 'ZIP'}</span>
                                  </button>
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
                                        <span>Copy</span>
                                      </>
                                    )}
                                  </button>
                                </div>
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

                {/* Bottom Action Bar */}
                <div className="flex items-center justify-between pt-1 text-xs text-[#78716C]">
                  <div className="flex items-center gap-1">
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

                    {/* Teach Andromeda Button (Store to Google Cloud) */}
                    <button
                      onClick={() => handleTeachAndromeda(message.id, content)}
                      disabled={teachingMsgId === message.id}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        taughtSuccessMsgId === message.id
                          ? 'bg-emerald-500/20 text-emerald-800'
                          : 'hover:bg-[#F0EEE6] text-[#78716C] hover:text-amber-800'
                      }`}
                      title="Teach this insight to Andromeda (Saves to Google Cloud Firestore)"
                    >
                      {teachingMsgId === message.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                      ) : taughtSuccessMsgId === message.id ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Brain className="w-3.5 h-3.5 text-amber-600" />
                      )}
                      <span>
                        {teachingMsgId === message.id
                          ? 'Learning...'
                          : taughtSuccessMsgId === message.id
                          ? 'Saved to Cloud!'
                          : 'Teach Andromeda'}
                      </span>
                    </button>
                  </div>

                  {/* If the message contains code blocks, show quick project ZIP exporter */}
                  {content.includes('```') && (
                    <button
                      onClick={() => handleDownloadFullMessageZip(message.id, content)}
                      disabled={zippingCodeKey === `full-${message.id}`}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 text-xs font-semibold border border-amber-500/30 transition-all cursor-pointer font-mono"
                      title="Export all generated files as a single downloadable ZIP project"
                    >
                      <FolderArchive className="w-3.5 h-3.5 text-amber-600" />
                      <span>{zippingCodeKey === `full-${message.id}` ? 'Building ZIP...' : 'Export Code ZIP'}</span>
                    </button>
                  )}
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

              {streamingThought && (
                <div className="rounded-xl border border-[#E2E0D8] bg-[#F4F2EB]/60 p-3 text-xs font-mono text-[#78716C] leading-relaxed whitespace-pre-wrap animate-pulse">
                  <div className="flex items-center gap-1.5 font-bold text-amber-700 mb-1">
                    <Brain className="w-3.5 h-3.5" />
                    <span>Thinking...</span>
                  </div>
                  {streamingThought}
                </div>
              )}

              {streamingMessage && (
                <div className="prose prose-sm max-w-none text-[#1C1917] leading-relaxed">
                  <ReactMarkdown>{streamingMessage}</ReactMarkdown>
                </div>
              )}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Box Area */}
      <div className="p-4 sm:p-6 bg-[#FAF9F5] border-t border-[#E2E0D8] shrink-0">
        <div className="max-w-3xl mx-auto">
          {/* Active Attachments Preview */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#E2E0D8] text-xs text-[#1C1917] shadow-2xs"
                >
                  <FileText className="w-3.5 h-3.5 text-[#D97706]" />
                  <span className="font-mono text-xs max-w-[150px] truncate">{att.name}</span>
                  <button
                    onClick={() => removeAttachment(att.id)}
                    className="p-0.5 text-[#78716C] hover:text-rose-600 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Unified Input Card */}
          <div className="rounded-2xl border border-[#D9D6CC] bg-white shadow-xs focus-within:border-[#B5B0A1] focus-within:ring-2 focus-within:ring-[#EAE7DF] transition-all overflow-hidden">
            <textarea
              id="andromeda-chat-input"
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask ${currentModel.name} anything, code a Discord bot (/discord), or build projects...`}
              rows={1}
              className="w-full px-4 pt-3.5 pb-2 text-sm text-[#1C1917] placeholder-[#8C887B] focus:outline-hidden resize-none bg-transparent font-sans leading-relaxed"
            />

            {/* Bottom Actions Toolbar inside Card */}
            <div className="flex items-center justify-between px-3 py-2 bg-white border-t border-[#F2F0E8]">
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

                {/* Extended Thinking Toggle */}
                <button
                  id="toggle-thinking-button"
                  type="button"
                  onClick={() => setIsThinkingEnabled(!isThinkingEnabled)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 sm:px-2 sm:py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isThinkingEnabled
                      ? 'bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs'
                      : 'text-[#78716C] hover:bg-[#F2F0E8] hover:text-[#1C1917]'
                  }`}
                  title="Toggle Extended Thinking"
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

      {/* Live Discord Chat Modal with Side Update Bot button */}
      <DiscordLiveChatModal
        isOpen={isDiscordLiveChatOpen}
        onClose={() => setIsDiscordLiveChatOpen(false)}
        botCode={activeBotCode}
        onUpdateBotCode={async (newCode) => {
          setActiveBotCode(newCode);
          return true;
        }}
      />

      {/* Learned Knowledge Modal (Google Cloud Server) */}
      <LearnedKnowledgeModal
        isOpen={isLearnedKnowledgeOpen}
        onClose={() => setIsLearnedKnowledgeOpen(false)}
        knowledgeList={learnedKnowledgeList}
        currentUser={currentUser}
        onAddKnowledge={(item) => {
          setLearnedKnowledgeList((prev) => [item, ...prev]);
        }}
      />
    </div>
  );
};
