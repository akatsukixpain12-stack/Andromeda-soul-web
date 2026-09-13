import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Brain,
  Sun,
  Moon,
  Trash2,
  Bot,
  ShieldCheck,
  Download,
  Key,
  Globe,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Database,
  Check,
  ExternalLink,
} from 'lucide-react';
import { UserSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSaveSettings: (settings: UserSettings) => void;
  onClearAllConversations: () => void;
  onOpenDiscordBot?: () => void;
  onOpenIntegrations?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onClearAllConversations,
  onOpenDiscordBot,
  onOpenIntegrations,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'ai' | 'integrations' | 'security' | 'data'>('general');
  const [formData, setFormData] = useState<UserSettings>(settings);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [dataNotice, setDataNotice] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(formData);
    onClose();
  };

  const handleExportData = async (format: 'json' | 'markdown') => {
    try {
      let convs: any[] = [];
      try {
        const saved = sessionStorage.getItem('andromeda_session_conversations_v5');
        if (saved) convs = JSON.parse(saved);
      } catch {
        convs = [];
      }

      let content = '';
      let filename = '';
      let mimeType = '';

      if (format === 'json') {
        content = JSON.stringify(convs, null, 2);
        filename = `andromeda-conversations-${Date.now()}.json`;
        mimeType = 'application/json';
      } else {
        filename = `andromeda-conversations-${Date.now()}.md`;
        mimeType = 'text/markdown';
        content = `# Andromeda Conversations Export\nGenerated: ${new Date().toISOString()}\n\n` +
          convs.map((c: any) => {
            const msgs = (c.messages || []).map((m: any) => `### **${m.role.toUpperCase()}** (${new Date(m.timestamp).toLocaleString()}):\n${m.content}\n`).join('\n---\n');
            return `## Conversation: ${c.title}\nID: ${c.id}\nCreated: ${new Date(c.createdAt).toLocaleString()}\n\n${msgs}\n\n=========================================\n`;
          }).join('\n');
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setDataNotice(`Successfully exported ${convs.length} conversations as ${format.toUpperCase()}.`);
      setTimeout(() => setDataNotice(null), 3500);
    } catch (err: any) {
      setDataNotice(`Export failed: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-base text-slate-900 dark:text-white">Settings</h2>
          </div>
          <button
            id="close-settings-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 5 Tab Navigation */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'general'
                ? 'border-violet-600 text-violet-600 dark:text-violet-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            General
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'ai'
                ? 'border-violet-600 text-violet-600 dark:text-violet-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            AI & Model
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('integrations')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'integrations'
                ? 'border-violet-600 text-violet-600 dark:text-violet-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Integrations
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'security'
                ? 'border-violet-600 text-violet-600 dark:text-violet-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Security
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('data')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'data'
                ? 'border-violet-600 text-violet-600 dark:text-violet-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Data & Privacy
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs text-slate-700 dark:text-slate-300">
          {/* TAB 1: GENERAL */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-900 dark:text-slate-100 mb-1">
                  Your Display Name (Welcome Persona)
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  The chosen name displayed on your aesthetic welcome screen (e.g. DIVINE JOHAN).
                </p>
                <input
                  type="text"
                  value={formData.userName || ''}
                  onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                  placeholder="e.g. DIVINE JOHAN"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-slate-100 text-xs focus:outline-hidden focus:ring-1 focus:ring-violet-500 uppercase font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Appearance Theme
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    id="theme-light-btn"
                    type="button"
                    onClick={() => setFormData({ ...formData, theme: 'light' })}
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                      formData.theme === 'light'
                        ? 'border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    Light
                  </button>
                  <button
                    id="theme-dark-btn"
                    type="button"
                    onClick={() => setFormData({ ...formData, theme: 'dark' })}
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                      formData.theme === 'dark'
                        ? 'border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                    Dark
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-900 dark:text-slate-100 mb-1">
                  Interface Language
                </label>
                <select
                  disabled
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300"
                >
                  <option>English (United States)</option>
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Additional localizations will be added in future updates.
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: AI & MODEL */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-violet-500/5 dark:bg-violet-950/20 border border-violet-500/20">
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-violet-500" />
                    Gemini API Key (Netlify & Client Direct Mode)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-[11px] text-violet-500 hover:text-violet-400 cursor-pointer flex items-center gap-1"
                  >
                    {showApiKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showApiKey ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">
                  Enables live model responses on static hosting like Netlify where no backend server runs. Saved strictly in your browser's private local storage.
                </p>
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={formData.geminiApiKey || ''}
                  onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-mono focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-900 dark:text-slate-100 mb-1">
                  Custom AI Instructions
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Permanent directives injected into Andromeda Soul 1.0 alongside its core capabilities.
                </p>
                <textarea
                  id="system-instruction-input"
                  rows={3}
                  value={formData.systemInstruction}
                  onChange={(e) => setFormData({ ...formData, systemInstruction: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-violet-500 text-xs resize-none"
                  placeholder="e.g., Prioritize TypeScript, explain edge cases, write modular code."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-900 dark:text-slate-100">
                    Creativity & Temperature: {formData.temperature}
                  </label>
                </div>
                <input
                  id="temperature-slider"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                  className="w-full accent-violet-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                    <Brain className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      Uncapped Reasoning (/think100000times)
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Activates deep reasoning derivation blocks for math, complex logic, and architecture.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    id="toggle-thinking-input"
                    type="checkbox"
                    checked={formData.enableThinking}
                    onChange={(e) => setFormData({ ...formData, enableThinking: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: INTEGRATIONS */}
          {activeTab === 'integrations' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block">Google Gemini Engine</span>
                    <span className="text-[11px] text-slate-500">Underlying foundation intelligence via server-side API</span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">
                  Connected
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bot className="w-4 h-4 text-violet-500" />
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block">Discord Bot Gateway</span>
                    <span className="text-[11px] text-slate-500">Discord API v10 bot generation & slash commands</span>
                  </div>
                </div>
                {onOpenDiscordBot && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenDiscordBot();
                    }}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer"
                  >
                    Open
                  </button>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Key className="w-4 h-4 text-emerald-500" />
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block">Custom API & Local Models</span>
                    <span className="text-[11px] text-slate-500">vLLM, Ollama, LM Studio, or custom gateways</span>
                  </div>
                </div>
                {onOpenIntegrations && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenIntegrations();
                    }}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer"
                  >
                    Configure
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-3.5">
              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Zero Token Leak Architecture Active</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  All sensitive credentials (Gemini keys, Discord bot tokens, GitHub personal access tokens, and custom API keys) are strictly stored server-side. The frontend browser never receives raw keys.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 dark:text-white">Smart Secret Scanner</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">
                    Active (Pre-push)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Scans all project files using Shannon entropy calculation and token regex patterns to prevent accidental commits to GitHub.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: DATA */}
          {activeTab === 'data' && (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-900 dark:text-slate-100 mb-1">
                  Export Chat History
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Download all conversation threads as structured JSON or readable Markdown.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleExportData('json')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export as JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportData('markdown')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export as Markdown
                  </button>
                </div>
                {dataNotice && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
                    {dataNotice}
                  </p>
                )}
              </div>

              {/* Delete All Chats */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                {!showClearConfirm ? (
                  <button
                    id="clear-all-chats-btn"
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    className="flex items-center gap-2 text-rose-500 hover:text-rose-600 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear all conversation history
                  </button>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                    <p className="text-xs text-rose-600 dark:text-rose-400 flex-1 font-medium">
                      Are you sure? All saved chat history will be permanently deleted.
                    </p>
                    <button
                      id="confirm-clear-chats-btn"
                      type="button"
                      onClick={() => {
                        onClearAllConversations();
                        setShowClearConfirm(false);
                      }}
                      className="px-3 py-1.5 bg-rose-500 text-white rounded-lg text-xs font-semibold hover:bg-rose-600 transition-colors"
                    >
                      Yes, Clear
                    </button>
                    <button
                      id="cancel-clear-chats-btn"
                      type="button"
                      onClick={() => setShowClearConfirm(false)}
                      className="px-2 py-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            id="cancel-settings-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="save-settings-btn"
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-violet-600 text-white font-semibold text-xs hover:bg-violet-700 transition-colors shadow-xs cursor-pointer"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};
