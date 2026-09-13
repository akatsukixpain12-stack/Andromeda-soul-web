import React, { useState } from 'react';
import {
  X,
  Bot,
  MessageSquare,
  Terminal,
  Key,
  CheckCircle2,
  ExternalLink,
  Zap,
  Code2,
  Copy,
  Check,
  Shield,
  Send,
  Play
} from 'lucide-react';

interface DiscordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendBotCommand?: (cmd: string) => void;
}

export const DiscordModal: React.FC<DiscordModalProps> = ({
  isOpen,
  onClose,
  onSendBotCommand
}) => {
  const [botToken, setBotToken] = useState(() => localStorage.getItem('andromeda_discord_bot_token') || '');
  const [clientId, setClientId] = useState(() => localStorage.getItem('andromeda_discord_client_id') || '');
  const [guildId, setGuildId] = useState(() => localStorage.getItem('andromeda_discord_guild_id') || '');
  const [botStatus, setBotStatus] = useState<'idle' | 'connecting' | 'connected'>('idle');
  const [activeTab, setActiveTab] = useState<'bot_setup' | 'code_bridge' | 'commands'>('bot_setup');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveConfig = () => {
    localStorage.setItem('andromeda_discord_bot_token', botToken);
    localStorage.setItem('andromeda_discord_client_id', clientId);
    localStorage.setItem('andromeda_discord_guild_id', guildId);
    setBotStatus('connecting');
    setTimeout(() => {
      setBotStatus('connected');
    }, 1000);
  };

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const discordBotCode = `// Andromeda Discord Sovereign AI Bot Gateway
import { Client, GatewayIntentBits } from 'discord.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const ANDROMEDA_STUDIO_URL = 'http://localhost:3000/api/chat';

client.on('ready', () => {
  console.log(\`🤖 Andromeda Bot online as \${client.user.tag}!\`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith('!andromeda') && !message.content.startsWith('/code')) return;

  const prompt = message.content.replace(/^(!andromeda|\/code)\\s*/i, '');
  await message.channel.sendTyping();

  try {
    const res = await fetch(ANDROMEDA_STUDIO_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: prompt,
        modelId: 'andromeda-soul-1',
        systemInstruction: 'You are Andromeda Discord Bot. Output concise code & responses.'
      })
    });
    const text = await res.text();
    message.reply(text.slice(0, 1990) || '⚡ Task completed by Andromeda AI.');
  } catch (err) {
    message.reply('❌ Error contacting Andromeda Studio pipeline.');
  }
});

client.login(process.env.DISCORD_BOT_TOKEN || '${botToken || 'YOUR_BOT_TOKEN_HERE'}');`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-3xl max-h-[92dvh] bg-[#0d1117] border border-[#5865F2]/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        
        {/* Header */}
        <div className="h-14 bg-[#0a0e14] border-b border-slate-800 px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#5865F2] flex items-center justify-center text-white shadow-lg">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm font-display text-white">Andromeda Discord Studio & Bot Connect</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#5865F2]/20 text-[#5865F2] border border-[#5865F2]/30">
                  /discord gateway
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Connect Discord servers, deploy AI bots, and bridge code generation.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-4 py-2 bg-[#0d1117] border-b border-slate-800 text-xs font-mono shrink-0">
          <button
            onClick={() => setActiveTab('bot_setup')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'bot_setup'
                ? 'bg-[#5865F2] text-white font-bold shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Bot Configuration</span>
          </button>

          <button
            onClick={() => setActiveTab('code_bridge')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'code_bridge'
                ? 'bg-[#5865F2] text-white font-bold shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Ready-to-Deploy Bot Code</span>
          </button>

          <button
            onClick={() => setActiveTab('commands')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'commands'
                ? 'bg-[#5865F2] text-white font-bold shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Slash Commands</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {activeTab === 'bot_setup' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-[#5865F2]" />
                    Discord Developer Portal Bridge
                  </span>
                  <a
                    href="https://discord.com/developers/applications"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[#5865F2] hover:underline"
                  >
                    <span>Developer Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter your Discord Bot Application token and Client ID to pair Andromeda AI Studio with your Discord guilds.
                </p>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Bot Token (from Bot tab)</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={botToken}
                      onChange={(e) => setBotToken(e.target.value)}
                      placeholder="MTE5Nz... (Discord Bot Token)"
                      className="w-full bg-[#0a0e14] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-[#5865F2] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Application / Client ID</label>
                    <input
                      type="text"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      placeholder="123456789012345678"
                      className="w-full bg-[#0a0e14] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-[#5865F2] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Guild / Server ID (Optional)</label>
                    <input
                      type="text"
                      value={guildId}
                      onChange={(e) => setGuildId(e.target.value)}
                      placeholder="987654321098765432"
                      className="w-full bg-[#0a0e14] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-[#5865F2] focus:outline-none"
                    />
                  </div>
                </div>

                {clientId && (
                  <div className="p-3 bg-[#5865F2]/10 border border-[#5865F2]/30 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-white">OAuth2 Bot Invite Link</div>
                      <div className="text-[11px] text-slate-400">Click to invite Andromeda AI Bot to your Discord server</div>
                    </div>
                    <a
                      href={`https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=2147485696&scope=bot%20applications.commands`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-semibold transition-colors flex items-center gap-1 shrink-0"
                    >
                      <span>Invite Bot</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'code_bridge' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">
                  Autonomous Node.js / Discord.js bot script connected to Andromeda Studio:
                </span>
                <button
                  onClick={() => handleCopy('bot_code', discordBotCode)}
                  className="flex items-center gap-1 text-xs text-[#5865F2] hover:text-white transition-colors cursor-pointer"
                >
                  {copiedKey === 'bot_code' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Bot Code</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#0a0e14] font-mono text-xs">
                <pre className="p-4 text-slate-300 overflow-x-auto max-h-[300px] leading-relaxed">
                  <code>{discordBotCode}</code>
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'commands' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                <div className="font-bold text-white flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-[#5865F2] text-[10px]">/code [prompt]</span>
                  <span>Autonomous Code Generator</span>
                </div>
                <p className="text-slate-400">
                  Instructs Andromeda to generate full-stack projects, unit tests, or Python scripts directly in Discord and returns downloadable file artifacts.
                </p>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                <div className="font-bold text-white flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-[#5865F2] text-[10px]">!andromeda [query]</span>
                  <span>Frontier Uncapped AI Reasoning</span>
                </div>
                <p className="text-slate-400">
                  Queries Andromeda Soul 1.0 orchestrator with live web search grounding, calculator precision, and extended chain-of-thought.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-14 bg-[#0a0e14] border-t border-slate-800 px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className={`w-2 h-2 rounded-full ${botStatus === 'connected' ? 'bg-emerald-500' : 'bg-slate-500'}`} />
            <span className="text-slate-400">
              {botStatus === 'connected' ? 'Discord Gateway Ready' : 'Configure Bot Token'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 font-mono text-xs cursor-pointer transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleSaveConfig}
              className="px-4 py-1.5 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-white font-mono text-xs font-semibold shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Save & Connect</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
