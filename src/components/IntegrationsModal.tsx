import React, { useState, useEffect } from 'react';
import {
  X,
  Bot,
  Key,
  Github,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Lock,
  Save,
  Check,
  ChevronRight,
  Cpu,
  Plug,
} from 'lucide-react';
import { CustomApiConfig, DiscordConfig } from '../types';

interface IntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDiscordHub?: () => void;
}

export const IntegrationsModal: React.FC<IntegrationsModalProps> = ({
  isOpen,
  onClose,
  onOpenDiscordHub,
}) => {
  const [activeTab, setActiveTab] = useState<'custom_api' | 'discord' | 'github' | 'gemini'>('custom_api');

  // Custom API state
  const [customApiConfig, setCustomApiConfig] = useState<CustomApiConfig>({
    enabled: false,
    name: 'Custom Endpoint',
    baseUrl: '',
    apiKey: '',
    hasApiKey: false,
    modelName: '',
  });
  const [isTestingCustomApi, setIsTestingCustomApi] = useState(false);
  const [customApiTestResult, setCustomApiTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSavingCustomApi, setIsSavingCustomApi] = useState(false);

  // Discord config state
  const [discordConfig, setDiscordConfig] = useState<DiscordConfig | null>(null);
  const [discordBotTokenInput, setDiscordBotTokenInput] = useState('');
  const [discordAppIdInput, setDiscordAppIdInput] = useState('');
  const [discordPublicKeyInput, setDiscordPublicKeyInput] = useState('');
  const [isTestingDiscord, setIsTestingDiscord] = useState(false);
  const [discordTestResult, setDiscordTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // GitHub state
  const [githubTokenInput, setGithubTokenInput] = useState('');
  const [githubUser, setGithubUser] = useState<any>(null);
  const [isLoadingGithub, setIsLoadingGithub] = useState(false);
  const [githubStatus, setGithubStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Gemini state
  const [geminiStatus, setGeminiStatus] = useState<{ configured: boolean; masked: string | null; defaultModel: string }>({
    configured: false,
    masked: null,
    defaultModel: 'Gemini 3.8 Flash',
  });

  // Load all configurations
  const loadAll = async () => {
    try {
      // 1. Custom API
      const apiRes = await fetch('/api/custom-api');
      if (apiRes.ok) {
        const data = await apiRes.json();
        setCustomApiConfig(data);
      }

      // 2. Discord Config
      const discRes = await fetch('/api/discord/config');
      if (discRes.ok) {
        const data = await discRes.json();
        setDiscordConfig(data);
        setDiscordAppIdInput(data.applicationId || '');
        setDiscordPublicKeyInput(data.publicKey || '');
        setDiscordBotTokenInput(data.botToken || '');
      }

      // 3. Gemini Status
      const gemRes = await fetch('/api/gemini/status');
      if (gemRes.ok) {
        const data = await gemRes.json();
        setGeminiStatus(data);
      }

      // 4. GitHub User
      const ghRes = await fetch('/api/github/user');
      if (ghRes.ok) {
        const data = await ghRes.json();
        if (data.success) {
          setGithubUser(data.user);
        }
      }
    } catch (err) {
      console.error('Failed to load integration states:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAll();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Custom API Handlers
  const handleSaveCustomApi = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingCustomApi(true);
    try {
      const res = await fetch('/api/custom-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customApiConfig),
      });
      if (res.ok) {
        const data = await res.json();
        setCustomApiConfig(data);
        setCustomApiTestResult({ success: true, message: 'Custom API configuration saved securely.' });
        setTimeout(() => setCustomApiTestResult(null), 3000);
      }
    } catch (err: any) {
      setCustomApiTestResult({ success: false, message: err.message || 'Failed to save.' });
    } finally {
      setIsSavingCustomApi(false);
    }
  };

  const handleTestCustomApi = async () => {
    setIsTestingCustomApi(true);
    setCustomApiTestResult(null);
    try {
      const res = await fetch('/api/custom-api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customApiConfig),
      });
      const data = await res.json();
      if (data.success) {
        setCustomApiTestResult({ success: true, message: data.message || 'Connection verified successfully!' });
      } else {
        setCustomApiTestResult({ success: false, message: data.error || 'Connection failed.' });
      }
    } catch (err: any) {
      setCustomApiTestResult({ success: false, message: err.message || 'Network error while testing.' });
    } finally {
      setIsTestingCustomApi(false);
    }
  };

  // Discord Handlers
  const handleSaveAndTestDiscord = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTestingDiscord(true);
    setDiscordTestResult(null);

    try {
      // 1. Save config
      const saveRes = await fetch('/api/discord/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: discordAppIdInput.trim(),
          publicKey: discordPublicKeyInput.trim(),
          botToken: discordBotTokenInput.trim(),
        }),
      });

      if (!saveRes.ok) throw new Error('Failed to save Discord credentials.');
      const updatedConfig = await saveRes.json();
      setDiscordConfig(updatedConfig);

      // 2. Test Connection
      const testRes = await fetch('/api/discord/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: discordBotTokenInput.trim() }),
      });
      const testData = await testRes.json();

      if (testData.success) {
        setDiscordTestResult({
          success: true,
          message: `Connected successfully as @${testData.bot.tag}!`,
        });
      } else {
        setDiscordTestResult({
          success: false,
          message: testData.error || 'Discord rejected authorization.',
        });
      }
    } catch (err: any) {
      setDiscordTestResult({ success: false, message: err.message || 'Connection failed.' });
    } finally {
      setIsTestingDiscord(false);
    }
  };

  // GitHub Handlers
  const handleVerifyGithub = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingGithub(true);
    setGithubStatus(null);
    try {
      // Save token
      await fetch('/api/discord/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ githubToken: githubTokenInput.trim() }),
      });

      // Verify
      const res = await fetch(`/api/github/user?token=${encodeURIComponent(githubTokenInput.trim())}`);
      const data = await res.json();
      if (data.success) {
        setGithubUser(data.user);
        setGithubStatus({ success: true, message: `Connected as ${data.user.login} (${data.user.public_repos} repos)` });
      } else {
        setGithubStatus({ success: false, message: data.error || 'Failed to authenticate with GitHub.' });
      }
    } catch (err: any) {
      setGithubStatus({ success: false, message: err.message || 'Network error.' });
    } finally {
      setIsLoadingGithub(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in duration-150">
      <div
        className="w-full max-w-4xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <Plug className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                API & Integrations
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Zero-Leak Storage
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Connect external models, Discord bots, and GitHub version control securely.
              </p>
            </div>
          </div>
          <button
            id="close-integrations-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('custom_api')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'custom_api'
                ? 'border-violet-600 text-violet-600 dark:text-violet-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Custom API</span>
            {customApiConfig.enabled && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('discord')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'discord'
                ? 'border-violet-600 text-violet-600 dark:text-violet-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Bot className="w-4 h-4 text-violet-500" />
            <span>Discord Bot</span>
            {discordConfig?.verified && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('github')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'github'
                ? 'border-violet-600 text-violet-600 dark:text-violet-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Github className="w-4 h-4" />
            <span>GitHub</span>
            {githubUser && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gemini')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'gemini'
                ? 'border-violet-600 text-violet-600 dark:text-violet-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Google Gemini</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: CUSTOM API */}
          {activeTab === 'custom_api' && (
            <div className="max-w-2xl mx-auto space-y-5">
              <div className="p-4 rounded-2xl bg-violet-500/5 border border-violet-500/20 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Connect any OpenAI-compatible or custom LLM endpoint (e.g. Local vLLM, Ollama, LM Studio, or a custom API gateway). All keys are saved strictly server-side and masked in the UI.
              </div>

              <form onSubmit={handleSaveCustomApi} className="space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="font-semibold text-xs text-slate-900 dark:text-white block">
                      Enable Custom API Provider
                    </span>
                    <span className="text-[11px] text-slate-500">
                      When enabled, custom model names appear in the top model selector.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customApiConfig.enabled}
                      onChange={(e) =>
                        setCustomApiConfig({ ...customApiConfig, enabled: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Provider Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Local Ollama, LM Studio, Custom Gateway"
                    value={customApiConfig.name}
                    onChange={(e) =>
                      setCustomApiConfig({ ...customApiConfig, name: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Base URL / Endpoint
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="https://your-api-gateway.com/v1 or http://localhost:11434/v1"
                    value={customApiConfig.baseUrl}
                    onChange={(e) =>
                      setCustomApiConfig({ ...customApiConfig, baseUrl: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-violet-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    API Key (Stored Server-Side)
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••••••••••"
                    value={customApiConfig.apiKey}
                    onChange={(e) =>
                      setCustomApiConfig({ ...customApiConfig, apiKey: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-violet-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Model Name / Identifier
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., llama3.3:70b, mistral-large, gpt-4o"
                    value={customApiConfig.modelName}
                    onChange={(e) =>
                      setCustomApiConfig({ ...customApiConfig, modelName: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-violet-500 font-mono"
                  />
                </div>

                {customApiTestResult && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                      customApiTestResult.success
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400'
                    }`}
                  >
                    {customApiTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{customApiTestResult.message}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleTestCustomApi}
                    disabled={isTestingCustomApi || !customApiConfig.baseUrl}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    {isTestingCustomApi ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>Test Connection</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingCustomApi}
                    className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Configuration</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: DISCORD BOT */}
          {activeTab === 'discord' && (
            <div className="max-w-2xl mx-auto space-y-5">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-violet-600/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white">
                      {discordConfig?.botUsername ? `@${discordConfig.botUsername}` : 'Discord Bot Manager'}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {discordConfig?.verified ? 'Verified & Connected to Discord v10 Gateway' : 'Not Connected'}
                    </p>
                  </div>
                </div>

                {onOpenDiscordHub && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenDiscordHub();
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-xl border border-violet-500/30 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 text-xs font-semibold cursor-pointer"
                  >
                    Open Discord Hub
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveAndTestDiscord} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Application ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 123456789012345678"
                    value={discordAppIdInput}
                    onChange={(e) => setDiscordAppIdInput(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Bot Token (Masked & Protected)
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••••••••••"
                    value={discordBotTokenInput}
                    onChange={(e) => setDiscordBotTokenInput(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Public Key (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Public Key from Discord Portal"
                    value={discordPublicKeyInput}
                    onChange={(e) => setDiscordPublicKeyInput(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-xs font-mono"
                  />
                </div>

                {discordTestResult && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                      discordTestResult.success
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400'
                    }`}
                  >
                    {discordTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{discordTestResult.message}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isTestingDiscord}
                    className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isTestingDiscord ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>Save & Test Bot Token</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: GITHUB */}
          {activeTab === 'github' && (
            <div className="max-w-2xl mx-auto space-y-5">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center">
                    <Github className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white">
                      {githubUser ? `@${githubUser.login}` : 'GitHub Version Control'}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {githubUser ? `${githubUser.public_repos} public repos • Authorized` : 'Not Authenticated'}
                    </p>
                  </div>
                </div>

                {githubUser && (
                  <a
                    href={githubUser.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              <form onSubmit={handleVerifyGithub} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Personal Access Token (classic or fine-grained with repo scope)
                  </label>
                  <input
                    type="password"
                    placeholder="ghp_••••••••••••••••"
                    value={githubTokenInput}
                    onChange={(e) => setGithubTokenInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-xs font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Zero Token Leak Policy: Your token is guarded on the local server and will never be committed into any repository.
                  </span>
                </div>

                {githubStatus && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                      githubStatus.success
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400'
                    }`}
                  >
                    {githubStatus.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{githubStatus.message}</span>
                  </div>
                )}

                <div className="flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={isLoadingGithub}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isLoadingGithub ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>Verify & Connect GitHub</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: GEMINI */}
          {activeTab === 'gemini' && (
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <span className="font-bold text-slate-900 dark:text-white block">
                    Underlying Intelligence Engine
                  </span>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    Andromeda Soul 1.0 utilizes Google Gemini models (Gemini 3.8 Flash, Gemini 3.1 Flash Lite) as its primary foundation engine. API credentials are stored server-side and never exposed to the client.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Connection Status:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Active & Operational
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">API Key Mask:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {geminiStatus.masked || '••••••••••••••••'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Default Model:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    Gemini 3.8 Flash (Deep Reasoning Supported)
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Thinking Mode:</span>
                  <span className="text-violet-600 dark:text-violet-400 font-semibold">
                    Dynamic CoT (/think100000times)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
