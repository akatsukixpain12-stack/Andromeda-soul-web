import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Bot,
  Send,
  Code2,
  RefreshCw,
  Check,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Terminal,
  Shield,
  Copy,
  Hash,
  Activity,
  Layers,
  CheckCircle2,
} from 'lucide-react';

interface DiscordMessage {
  id: string;
  author: string;
  avatar: string;
  isBot: boolean;
  content: string;
  timestamp: number;
  tag?: string;
}

interface DiscordLiveChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  botCode?: string;
  onUpdateBotCode?: (newCode: string) => Promise<boolean> | void;
}

export const DiscordLiveChatModal: React.FC<DiscordLiveChatModalProps> = ({
  isOpen,
  onClose,
  botCode = '',
  onUpdateBotCode,
}) => {
  const [messages, setMessages] = useState<DiscordMessage[]>([
    {
      id: 'msg-1',
      author: 'Andromeda Bot',
      avatar: '🤖',
      isBot: true,
      tag: 'BOT',
      content: '🌌 **Andromeda Sovereign Bot is online!** Ready in `#general`. Try `/ping`, `/status`, `/code [task]`, or `!andromeda [query]`.',
      timestamp: Date.now() - 30000,
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [isCodePanelOpen, setIsCodePanelOpen] = useState(true);
  const [currentCode, setCurrentCode] = useState(botCode);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (botCode) {
      setCurrentCode(botCode);
    }
  }, [botCode]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages, isBotTyping]);

  if (!isOpen) return null;

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const prompt = inputMessage.trim();
    if (!prompt || isBotTyping) return;

    const userMsg: DiscordMessage = {
      id: `usr-${Date.now()}`,
      author: 'You (Developer)',
      avatar: '👤',
      isBot: false,
      content: prompt,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsBotTyping(true);

    try {
      const res = await fetch('/api/discord/simulate-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, command: prompt.startsWith('/') || prompt.startsWith('!') ? prompt : undefined }),
      });

      const data = await res.json();

      const botReply: DiscordMessage = {
        id: `bot-${Date.now()}`,
        author: data.author || 'Andromeda Bot',
        avatar: '🤖',
        isBot: true,
        tag: 'BOT',
        content: data.content || 'Command processed.',
        timestamp: data.timestamp || Date.now(),
      };

      setMessages((prev) => [...prev, botReply]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          author: 'Andromeda Bot',
          avatar: '🤖',
          isBot: true,
          tag: 'BOT',
          content: '❌ Simulated Discord gateway connection error.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsBotTyping(false);
    }
  };

  const handleUpdateBot = async () => {
    setIsUpdating(true);
    setUpdateSuccess(false);
    try {
      // 1. Send update to server endpoint
      const res = await fetch('/api/discord/update-bot-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: currentCode, filename: 'index.js' }),
      });
      if (onUpdateBotCode) {
        await onUpdateBotCode(currentCode);
      }

      setUpdateSuccess(true);
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          author: 'System',
          avatar: '⚡',
          isBot: true,
          tag: 'SYSTEM',
          content: '⚡ **Bot Script Updated!** Hot-reloaded new logic into live Discord gateway.',
          timestamp: Date.now(),
        },
      ]);
      setTimeout(() => setUpdateSuccess(false), 3500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-5xl h-[90dvh] max-h-[850px] bg-[#1e1f22] border border-[#5865F2]/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Discord Top Window Bar */}
        <div className="h-12 bg-[#2b2d31] border-b border-[#1e1f22] px-4 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#5865F2] flex items-center justify-center text-white shadow-md">
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-slate-400" />
              <span className="font-bold text-sm text-white">andromeda-bot-live</span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                🟢 Live Gateway
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCodePanelOpen(!isCodePanelOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                isCodePanelOpen
                  ? 'bg-[#5865F2] text-white'
                  : 'bg-[#313338] text-slate-300 hover:bg-[#383a40]'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bot Source Code</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Content: Split Chat & Code View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Discord Interactive Chat Channel */}
          <div className="flex-1 flex flex-col bg-[#313338] overflow-hidden">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m) => (
                <div key={m.id} className="flex items-start gap-3 group hover:bg-[#2e3035]/50 -mx-2 px-2 py-1 rounded-lg">
                  <div className="w-9 h-9 rounded-full bg-[#5865F2] flex items-center justify-center text-base shrink-0 select-none shadow-sm">
                    {m.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-white hover:underline cursor-pointer">
                        {m.author}
                      </span>
                      {m.tag && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#5865F2] text-white tracking-wider">
                          {m.tag}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 mt-0.5 whitespace-pre-wrap leading-relaxed">
                      {m.content}
                    </div>
                  </div>
                </div>
              ))}

              {isBotTyping && (
                <div className="flex items-center gap-2 text-xs text-slate-400 italic px-2 animate-pulse">
                  <Bot className="w-3.5 h-3.5 text-[#5865F2]" />
                  <span>Andromeda Bot is typing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Command Suggestions */}
            <div className="px-4 py-1.5 bg-[#2b2d31] border-t border-[#1e1f22] flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono shrink-0">
              <span className="text-slate-400 text-[10px] uppercase font-semibold mr-1">Quick:</span>
              {[
                '/ping',
                '/status',
                '/ask explain quantum entanglement in 2 sentences',
                '/code create a TypeScript REST API router',
              ].map((cmd, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputMessage(cmd);
                  }}
                  className="px-2.5 py-1 rounded-md bg-[#383a40] hover:bg-[#5865F2] text-slate-300 hover:text-white transition-colors whitespace-nowrap cursor-pointer"
                >
                  {cmd.slice(0, 24)}...
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 bg-[#2b2d31] border-t border-[#1e1f22] flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Message #andromeda-bot-live or type /ask, /code..."
                className="flex-1 bg-[#383a40] border-none rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#5865F2]"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isBotTyping}
                className="px-3.5 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white disabled:opacity-50 transition-colors cursor-pointer flex items-center justify-center shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Right: Bot Code Editor Panel with Side "Update Bot" Action */}
          {isCodePanelOpen && (
            <div className="w-full sm:w-96 md:w-[420px] bg-[#1e1f22] border-l border-[#2b2d31] flex flex-col shrink-0 animate-in slide-in-from-right duration-200">
              {/* Code Panel Header */}
              <div className="p-3 bg-[#2b2d31] border-b border-[#1e1f22] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-[#5865F2]" />
                  <span className="text-xs font-bold text-white font-mono">index.js (Bot Core)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopyCode}
                    className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1"
                    title="Copy code"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Side Update Action Banner */}
              <div className="p-3 bg-[#2b2d31]/70 border-b border-[#1e1f22] flex items-center justify-between gap-2">
                <div className="text-[11px] text-slate-300">
                  <span className="font-semibold text-white">Live Sync:</span> Apply edits & reload bot
                </div>
                <button
                  id="side-update-bot-btn"
                  onClick={handleUpdateBot}
                  disabled={isUpdating}
                  className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    updateSuccess
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#5865F2] hover:bg-[#4752C4] text-white'
                  }`}
                >
                  {isUpdating ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : updateSuccess ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  <span>{isUpdating ? 'Updating...' : updateSuccess ? 'Updated!' : 'Update Bot'}</span>
                </button>
              </div>

              {/* Code Textarea / View */}
              <div className="flex-1 p-2 overflow-hidden flex flex-col">
                <textarea
                  value={currentCode}
                  onChange={(e) => setCurrentCode(e.target.value)}
                  placeholder="// Paste or edit your Discord bot script here..."
                  className="flex-1 w-full p-3 rounded-xl bg-[#111214] border border-[#2b2d31] font-mono text-[11px] text-emerald-400 leading-relaxed resize-none focus:outline-hidden focus:border-[#5865F2]"
                  spellCheck={false}
                />
              </div>

              {/* Footer */}
              <div className="p-2.5 bg-[#2b2d31] border-t border-[#1e1f22] flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Discord.js v14 Gateway</span>
                <span className="text-emerald-400">● Synced with Andromeda</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
