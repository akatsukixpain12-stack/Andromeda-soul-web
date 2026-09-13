import React, { useState, useEffect } from 'react';
import {
  X,
  Bot,
  Key,
  ShieldCheck,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  Download,
  Code2,
  AlertCircle,
  CheckCircle2,
  Sliders,
  Lock,
} from 'lucide-react';
import { DiscordBotConfig, CustomApiConfig } from '../types';

interface DiscordBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAndromeda?: () => void;
}

export const DiscordBotModal: React.FC<DiscordBotModalProps> = ({
  isOpen,
  onClose,
  onSelectAndromeda,
}) => {
  const [activeTab, setActiveTab] = useState<'credentials' | 'custom-api' | 'code'>('credentials');
  
  // Discord config state
  const [discordConfig, setDiscordConfig] = useState<DiscordBotConfig>({
    applicationId: '',
    publicKey: '',
    botToken: '',
    hasToken: false,
    hasGithubToken: false,
  });
  const [tokenInput, setTokenInput] = useState('');
  const [showToken, setShowToken] = useState(false);

  // Custom API state
  const [customApiConfig, setCustomApiConfig] = useState<CustomApiConfig>({
    enabled: false,
    name: 'Custom Endpoint',
    baseUrl: '',
    hasApiKey: false,
    modelName: '',
  });
  const [customApiKeyInput, setCustomApiKeyInput] = useState('');
  const [showCustomApiKey, setShowCustomApiKey] = useState(false);

  // Status & Feedback states
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; bot?: any } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [projectFiles, setProjectFiles] = useState<Record<string, string> | null>(null);
  const [selectedFile, setSelectedFile] = useState<string>('index.js');
  const [saveNotification, setSaveNotification] = useState<string | null>(null);

  // Load initial configs
  useEffect(() => {
    if (!isOpen) return;

    fetch('/api/discord/config')
      .then((r) => r.json())
      .then((data: DiscordBotConfig) => {
        setDiscordConfig(data);
        if (data.botToken && data.botToken !== '••••••••••••••••') {
          setTokenInput(data.botToken);
        }
      })
      .catch((e) => console.error('Failed to load discord config:', e));

    fetch('/api/custom-api')
      .then((r) => r.json())
      .then((data: CustomApiConfig) => {
        setCustomApiConfig(data);
      })
      .catch((e) => console.error('Failed to load custom api config:', e));

    fetch('/api/discord/project-files')
      .then((r) => r.json())
      .then((data) => {
        if (data.files) setProjectFiles(data.files);
      })
      .catch((e) => console.error('Failed to load discord project files:', e));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveDiscord = async () => {
    setIsSaving(true);
    setSaveNotification(null);
    try {
      const payload: any = {
        applicationId: discordConfig.applicationId.trim(),
        publicKey: discordConfig.publicKey.trim(),
      };

      if (tokenInput.trim() && tokenInput !== '••••••••••••••••') {
        payload.botToken = tokenInput.trim();
      }

      const res = await fetch('/api/discord/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const updated = await res.json();
      setDiscordConfig(updated);
      setSaveNotification('Credentials encrypted and saved safely!');
      setTimeout(() => setSaveNotification(null), 4000);
    } catch (err: any) {
      console.error(err);
      setSaveNotification('Failed to save credentials.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const payload: any = {};
      if (tokenInput.trim() && tokenInput !== '••••••••••••••••') {
        payload.botToken = tokenInput.trim();
      }

      const res = await fetch('/api/discord/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.connected) {
        setTestResult({
          success: true,
          message: `Connected successfully as @${data.bot.username}#${data.bot.discriminator || '0'}!`,
          bot: data.bot,
        });
        setDiscordConfig((prev) => ({
          ...prev,
          botUsername: data.bot.username,
          botAvatar: data.bot.avatar,
          botId: data.bot.id,
          hasToken: true,
        }));
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Connection failed. Please verify your Bot Token.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Network error connecting to Discord Gateway.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveCustomApi = async () => {
    setIsSaving(true);
    setSaveNotification(null);
    try {
      const payload: Partial<CustomApiConfig> = {
        enabled: customApiConfig.enabled,
        name: customApiConfig.name.trim() || 'Custom Endpoint',
        baseUrl: customApiConfig.baseUrl.trim(),
        modelName: customApiConfig.modelName.trim(),
      };

      if (customApiKeyInput.trim() && customApiKeyInput !== '••••••••••••••••') {
        payload.apiKey = customApiKeyInput.trim();
      }

      const res = await fetch('/api/custom-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const updated = await res.json();
      setCustomApiConfig(updated);
      setSaveNotification('Custom API endpoint saved successfully!');
      setTimeout(() => setSaveNotification(null), 4000);
    } catch (err: any) {
      console.error(err);
      setSaveNotification('Failed to save Custom API.');
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const downloadAllFiles = () => {
    if (!projectFiles) return;
    for (const [filename, content] of Object.entries(projectFiles)) {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const inviteUrl = discordConfig.applicationId
    ? `https://discord.com/api/oauth2/authorize?client_id=${discordConfig.applicationId}&permissions=2147485696&scope=bot%20applications.commands`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                  Discord Bot Hub
                </h2>
                <span className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/60 flex items-center gap-1 shrink-0">
                  <ShieldCheck className="w-3 h-3" />
                  Andromeda Soul 1.0
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                Zero token leak credentials, slash commands, & custom API
              </p>
            </div>
          </div>
          <button
            id="close-discord-modal-btn"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Leak Protection Banner */}
        <div className="px-4 sm:px-6 py-2 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[11px] sm:text-xs flex items-center justify-between flex-wrap gap-1">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              <strong>Zero-Leak Security:</strong> Tokens are encrypted server-side and automatically redacted from chat outputs.
            </span>
          </div>
          {onSelectAndromeda && (
            <button
              onClick={() => {
                onSelectAndromeda();
                onClose();
              }}
              className="font-medium text-emerald-700 dark:text-emerald-300 hover:underline shrink-0 text-[11px] cursor-pointer"
            >
              Use Soul 1 in Chat →
            </button>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 bg-slate-50 dark:bg-slate-900/50 text-xs font-medium overflow-x-auto scrollbar-none">
          <button
            id="tab-credentials"
            onClick={() => setActiveTab('credentials')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'credentials'
                ? 'border-violet-500 text-violet-600 dark:text-violet-400 font-semibold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Bot Credentials</span>
            {discordConfig.hasToken && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block ml-0.5" />
            )}
          </button>

          <button
            id="tab-custom-api"
            onClick={() => setActiveTab('custom-api')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'custom-api'
                ? 'border-violet-500 text-violet-600 dark:text-violet-400 font-semibold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Custom AI & API</span>
            {customApiConfig.enabled && (
              <span className="w-2 h-2 rounded-full bg-violet-500 inline-block ml-0.5" />
            )}
          </button>

          <button
            id="tab-code"
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'code'
                ? 'border-violet-500 text-violet-600 dark:text-violet-400 font-semibold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Bot Code & Slash Commands</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-slate-800 dark:text-slate-200 text-sm">
          {saveNotification && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
              <span>{saveNotification}</span>
              <button onClick={() => setSaveNotification(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* TAB 1: BOT CREDENTIALS */}
          {activeTab === 'credentials' && (
            <div className="space-y-4">
              {/* Connected Bot Card */}
              {discordConfig.botUsername && (
                <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                      {discordConfig.botAvatar ? (
                        <img
                          src={`https://cdn.discordapp.com/avatars/${discordConfig.botId}/${discordConfig.botAvatar}.png`}
                          alt="bot avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Bot className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{discordConfig.botUsername}</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Connected & ready to process slash commands
                      </p>
                    </div>
                  </div>
                  {inviteUrl && (
                    <a
                      href={inviteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-colors cursor-pointer"
                    >
                      Invite Bot to Server
                    </a>
                  )}
                </div>
              )}

              {/* Application ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Application ID (Client ID)
                </label>
                <input
                  id="discord-application-id-input"
                  type="text"
                  placeholder="e.g. 123456789012345678"
                  value={discordConfig.applicationId}
                  onChange={(e) => setDiscordConfig({ ...discordConfig, applicationId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-violet-500 font-mono"
                />
              </div>

              {/* Public Key */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Public Key (For Ed25519 interactions verification)
                </label>
                <input
                  id="discord-public-key-input"
                  type="text"
                  placeholder="e.g. 5e9b8f2c3..."
                  value={discordConfig.publicKey}
                  onChange={(e) => setDiscordConfig({ ...discordConfig, publicKey: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-violet-500 font-mono"
                />
              </div>

              {/* Bot Token */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Bot Token (Masked & Fully Protected)
                  </label>
                  {discordConfig.hasToken && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Token Encrypted
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="discord-bot-token-input"
                    type={showToken ? 'text' : 'password'}
                    placeholder={discordConfig.hasToken ? '••••••••••••••••••••••••••••••••' : 'Paste Discord bot token here'}
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-violet-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Never shared publicly. Required to connect and sync slash commands with Discord.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2 flex-wrap">
                <button
                  id="save-discord-config-btn"
                  onClick={handleSaveDiscord}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white font-medium text-xs hover:bg-violet-700 transition-colors disabled:opacity-50 cursor-pointer min-h-[44px]"
                >
                  {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save Credentials
                </button>

                <button
                  id="test-discord-connection-btn"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs transition-colors disabled:opacity-50 cursor-pointer min-h-[44px]"
                >
                  {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
                  Test Connection
                </button>

                {inviteUrl && (
                  <button
                    onClick={() => copyToClipboard(inviteUrl, 'invite')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs transition-colors cursor-pointer min-h-[44px]"
                  >
                    {copiedKey === 'invite' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy Bot Invite Link
                  </button>
                )}
              </div>

              {/* Test Result Message */}
              {testResult && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                    testResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CUSTOM AI / API */}
          {activeTab === 'custom-api' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                You can route Andromeda Soul 1.0 queries or Discord slash commands to an external OpenAI-compatible or custom AI inference server.
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <div>
                  <div className="font-semibold text-xs text-slate-900 dark:text-white">
                    Enable Custom API Provider
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    When active, chat & bot commands can route through your custom endpoint.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={customApiConfig.enabled}
                  onChange={(e) => setCustomApiConfig({ ...customApiConfig, enabled: e.target.checked })}
                  className="w-4 h-4 text-violet-600 rounded-md focus:ring-violet-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Provider Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Local vLLM, Ollama, or Custom AI"
                  value={customApiConfig.name}
                  onChange={(e) => setCustomApiConfig({ ...customApiConfig, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Base URL (OpenAI-compatible)
                </label>
                <input
                  type="text"
                  placeholder="https://api.openai.com/v1 or http://localhost:11434/v1"
                  value={customApiConfig.baseUrl}
                  onChange={(e) => setCustomApiConfig({ ...customApiConfig, baseUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-violet-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Model Identifier
                </label>
                <input
                  type="text"
                  placeholder="e.g. andromeda-soul-1, llama3, or gpt-4o"
                  value={customApiConfig.modelName}
                  onChange={(e) => setCustomApiConfig({ ...customApiConfig, modelName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-violet-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showCustomApiKey ? 'text' : 'password'}
                    placeholder={customApiConfig.hasApiKey ? '••••••••••••••••' : 'sk-...'}
                    value={customApiKeyInput}
                    onChange={(e) => setCustomApiKeyInput(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-violet-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCustomApiKey(!showCustomApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
                  >
                    {showCustomApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                id="save-custom-api-btn"
                onClick={handleSaveCustomApi}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white font-medium text-xs hover:bg-violet-700 transition-colors disabled:opacity-50 cursor-pointer min-h-[44px]"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Save Custom API Settings
              </button>
            </div>
          )}

          {/* TAB 3: BOT CODE & SLASH COMMANDS */}
          {activeTab === 'code' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                  {projectFiles &&
                    Object.keys(projectFiles).map((file) => (
                      <button
                        key={file}
                        onClick={() => setSelectedFile(file)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer ${
                          selectedFile === file
                            ? 'bg-violet-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {file}
                      </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={downloadAllFiles}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download All
                  </button>

                  <button
                    onClick={() => {
                      if (projectFiles && projectFiles[selectedFile]) {
                        copyToClipboard(projectFiles[selectedFile], selectedFile);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-medium hover:bg-violet-700 transition-colors cursor-pointer"
                  >
                    {copiedKey === selectedFile ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy {selectedFile}
                  </button>
                </div>
              </div>

              {projectFiles && projectFiles[selectedFile] ? (
                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950">
                  <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-slate-400 text-xs font-mono">
                    <span>{selectedFile}</span>
                    <span className="text-[10px] text-emerald-400">Zero Token Leaks</span>
                  </div>
                  <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto max-h-72 leading-relaxed">
                    <code>{projectFiles[selectedFile]}</code>
                  </pre>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Loading Discord Bot scaffold...
                </div>
              )}

              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <div className="font-semibold text-slate-900 dark:text-white">
                  Included Slash Commands:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <strong className="text-violet-500">/ask [query]</strong> — Query Andromeda Soul 1.0
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <strong className="text-violet-500">/think [problem]</strong> — Uncapped 100,000x reasoning
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <strong className="text-violet-500">/ping</strong> — Check latency & Gateway status
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <strong className="text-violet-500">/clear</strong> — Reset conversation history
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between text-xs text-slate-500">
          <span>Powered by Andromeda Soul 1.0 Engine</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
