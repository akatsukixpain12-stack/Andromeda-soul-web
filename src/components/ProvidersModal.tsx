import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Cpu,
  HardDrive,
  Zap,
  Sliders,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  Flame,
} from 'lucide-react';
import { UserSettings } from '../types';
import { testOllamaConnection, testLMStudioConnection } from '../lib/aiClient';

interface ProvidersModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSaveSettings: (newSettings: UserSettings) => void;
}

export const ProvidersModal: React.FC<ProvidersModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'gemini' | 'ollama' | 'lmstudio' | 'groq' | 'general'>('gemini');

  // Local state for settings
  const [geminiApiKey, setGeminiApiKey] = useState(settings.geminiApiKey || '');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [ollamaHost, setOllamaHost] = useState(settings.ollamaHost || 'http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState(settings.ollamaModel || 'deepseek-r1:8b');
  const [lmStudioHost, setLmStudioHost] = useState(settings.lmStudioHost || 'http://localhost:1234/v1');
  const [lmStudioModel, setLmStudioModel] = useState(settings.lmStudioModel || 'default');
  const [groqApiKey, setGroqApiKey] = useState(settings.groqApiKey || '');
  const [openRouterApiKey, setOpenRouterApiKey] = useState(settings.openRouterApiKey || '');
  const [systemInstruction, setSystemInstruction] = useState(settings.systemInstruction || '');
  const [temperature, setTemperature] = useState(settings.temperature ?? 0.7);
  const [userName, setUserName] = useState(settings.userName || 'User');

  // Test states
  const [ollamaTesting, setOllamaTesting] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<{ ok: boolean; models: string[]; message?: string } | null>(null);

  const [lmStudioTesting, setLmStudioTesting] = useState(false);
  const [lmStudioStatus, setLmStudioStatus] = useState<{ ok: boolean; models: string[]; message?: string } | null>(null);

  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setGeminiApiKey(settings.geminiApiKey || '');
      setOllamaHost(settings.ollamaHost || 'http://localhost:11434');
      setOllamaModel(settings.ollamaModel || 'deepseek-r1:8b');
      setLmStudioHost(settings.lmStudioHost || 'http://localhost:1234/v1');
      setLmStudioModel(settings.lmStudioModel || 'default');
      setGroqApiKey(settings.groqApiKey || '');
      setOpenRouterApiKey(settings.openRouterApiKey || '');
      setSystemInstruction(settings.systemInstruction || '');
      setTemperature(settings.temperature ?? 0.7);
      setUserName(settings.userName || 'User');
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings({
      ...settings,
      geminiApiKey: geminiApiKey.trim() || undefined,
      ollamaHost: ollamaHost.trim(),
      ollamaModel: ollamaModel.trim(),
      lmStudioHost: lmStudioHost.trim(),
      lmStudioModel: lmStudioModel.trim(),
      groqApiKey: groqApiKey.trim() || undefined,
      openRouterApiKey: openRouterApiKey.trim() || undefined,
      systemInstruction: systemInstruction.trim(),
      temperature,
      userName: userName.trim(),
    });
    onClose();
  };

  const handleTestOllama = async () => {
    setOllamaTesting(true);
    setOllamaStatus(null);
    const result = await testOllamaConnection(ollamaHost);
    setOllamaTesting(false);
    setOllamaStatus({
      ok: result.ok,
      models: result.models,
      message: result.ok
        ? `Successfully connected! Found ${result.models.length} model(s).`
        : `Could not reach ${ollamaHost}: ${result.error}`,
    });
  };

  const handleTestLMStudio = async () => {
    setLmStudioTesting(true);
    setLmStudioStatus(null);
    const result = await testLMStudioConnection(lmStudioHost);
    setLmStudioTesting(false);
    setLmStudioStatus({
      ok: result.ok,
      models: result.models,
      message: result.ok
        ? `Successfully connected to LM Studio! Found ${result.models.length} loaded model(s).`
        : `Could not reach ${lmStudioHost}: ${result.error}`,
    });
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(key);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white border border-[#E5E3DB] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0EEE6]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#FAF9F5] border border-[#EAE8E2]">
              <Sliders className="w-5 h-5 text-[#D97706]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#1C1917]">Providers & Settings</h2>
              <p className="text-xs text-[#78716C]">
                Configure Google Gemini, local Ollama, LM Studio, and free community APIs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#78716C] hover:text-[#1C1917] hover:bg-[#F2F0E8] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#F0EEE6] px-5 bg-[#FAF9F5]/70 gap-2 overflow-x-auto">
          {[
            { id: 'gemini', label: 'Google Gemini', icon: <Sparkles className="w-3.5 h-3.5 text-blue-600" /> },
            { id: 'ollama', label: 'Ollama (Local)', icon: <Cpu className="w-3.5 h-3.5 text-emerald-600" /> },
            { id: 'lmstudio', label: 'LM Studio', icon: <HardDrive className="w-3.5 h-3.5 text-purple-600" /> },
            { id: 'groq', label: 'Free Cloud APIs', icon: <Zap className="w-3.5 h-3.5 text-orange-600" /> },
            { id: 'general', label: 'General & Prompt', icon: <Flame className="w-3.5 h-3.5 text-amber-600" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'border-[#D97706] text-[#1C1917]'
                  : 'border-transparent text-[#78716C] hover:text-[#292524]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: GEMINI */}
          {activeTab === 'gemini' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold block">Google Gemini API (Free Tier Included)</span>
                  <p className="text-blue-800/90 leading-relaxed">
                    Google AI Studio provides generous free tier quotas for Gemini 2.5 Flash and Pro.
                    The app is already configured to work via server proxy, or you can supply your own API key below.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                  Custom Gemini API Key (Optional)
                </label>
                <div className="relative">
                  <input
                    id="gemini-api-key-input"
                    type={showGeminiKey ? 'text' : 'password'}
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full pl-3 pr-10 py-2 text-xs bg-white border border-[#E5E3DB] rounded-xl text-[#1C1917] focus:border-[#D97706] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                    className="absolute right-2.5 top-2.5 text-[#78716C] hover:text-[#1C1917]"
                  >
                    {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-[#8C887B] mt-1 flex items-center justify-between">
                  <span>Never shared externally. Saved only in your browser storage.</span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                  >
                    Get Free Gemini Key <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: OLLAMA */}
          {activeTab === 'ollama' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2.5">
                <Cpu className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold block">100% Free & Local with Ollama</span>
                  <p className="text-emerald-800 leading-relaxed">
                    Ollama lets you run DeepSeek-R1, Llama 3.2, Qwen 2.5, and Mistral completely offline on your own machine.
                    No subscriptions, zero token fees, completely private.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                    Ollama Host URL
                  </label>
                  <input
                    id="ollama-host-input"
                    type="text"
                    value={ollamaHost}
                    onChange={(e) => setOllamaHost(e.target.value)}
                    placeholder="http://localhost:11434"
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E5E3DB] rounded-xl text-[#1C1917] focus:border-[#D97706] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                    Check Connection
                  </label>
                  <button
                    id="test-ollama-button"
                    type="button"
                    onClick={handleTestOllama}
                    disabled={ollamaTesting}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#FAF9F5] hover:bg-[#F2F0E8] border border-[#E5E3DB] text-xs font-semibold text-[#1C1917] transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${ollamaTesting ? 'animate-spin' : ''}`} />
                    <span>{ollamaTesting ? 'Testing...' : 'Test Connection'}</span>
                  </button>
                </div>
              </div>

              {/* Status Alert */}
              {ollamaStatus && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                    ollamaStatus.ok
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  {ollamaStatus.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-semibold block">{ollamaStatus.message}</span>
                    {ollamaStatus.models.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {ollamaStatus.models.map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setOllamaModel(m)}
                            className="px-2 py-0.5 rounded-md bg-white border border-emerald-300 text-[11px] font-mono text-emerald-800 hover:bg-emerald-100 cursor-pointer"
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                  Default Ollama Model Tag
                </label>
                <input
                  id="ollama-model-input"
                  type="text"
                  value={ollamaModel}
                  onChange={(e) => setOllamaModel(e.target.value)}
                  placeholder="deepseek-r1:8b"
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E5E3DB] rounded-xl text-[#1C1917] focus:border-[#D97706] focus:outline-none"
                />
              </div>

              {/* Quick CLI Snippets */}
              <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#EAE8E2] space-y-2">
                <span className="text-xs font-semibold text-[#44403C] block">
                  Quick Ollama Terminal Commands
                </span>
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#E5E3DB]">
                    <span>OLLAMA_ORIGINS="*" ollama serve</span>
                    <button
                      onClick={() => handleCopy('OLLAMA_ORIGINS="*" ollama serve', 'serve')}
                      className="text-[#78716C] hover:text-[#1C1917] p-1"
                    >
                      {copiedCmd === 'serve' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#E5E3DB]">
                    <span>ollama run deepseek-r1:8b</span>
                    <button
                      onClick={() => handleCopy('ollama run deepseek-r1:8b', 'run')}
                      className="text-[#78716C] hover:text-[#1C1917] p-1"
                    >
                      {copiedCmd === 'run' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LM STUDIO */}
          {activeTab === 'lmstudio' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200 text-xs text-purple-950 flex items-start gap-2.5">
                <HardDrive className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold block">LM Studio Local Server (100% Free & Offline)</span>
                  <p className="text-purple-800 leading-relaxed">
                    LM Studio runs local models (Llama, Mistral, Qwen, DeepSeek) through an OpenAI-compatible local server.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                    LM Studio Host
                  </label>
                  <input
                    id="lmstudio-host-input"
                    type="text"
                    value={lmStudioHost}
                    onChange={(e) => setLmStudioHost(e.target.value)}
                    placeholder="http://localhost:1234/v1"
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E5E3DB] rounded-xl text-[#1C1917] focus:border-[#D97706] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                    Check Server
                  </label>
                  <button
                    id="test-lmstudio-button"
                    type="button"
                    onClick={handleTestLMStudio}
                    disabled={lmStudioTesting}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#FAF9F5] hover:bg-[#F2F0E8] border border-[#E5E3DB] text-xs font-semibold text-[#1C1917] transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${lmStudioTesting ? 'animate-spin' : ''}`} />
                    <span>{lmStudioTesting ? 'Testing...' : 'Test Server'}</span>
                  </button>
                </div>
              </div>

              {lmStudioStatus && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                    lmStudioStatus.ok
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  {lmStudioStatus.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-semibold block">{lmStudioStatus.message}</span>
                  </div>
                </div>
              )}

              <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#EAE8E2] text-xs text-[#57534E] space-y-1">
                <span className="font-semibold block text-[#1C1917]">How to start LM Studio local server:</span>
                <p>1. Open LM Studio on your computer.</p>
                <p>2. Select the "Local Server" tab on the left sidebar.</p>
                <p>3. Choose your downloaded model and click "Start Server" on port 1234.</p>
                <p>4. Ensure the "Enable CORS" checkbox is turned ON.</p>
              </div>
            </div>
          )}

          {/* TAB 4: GROQ & OPENROUTER */}
          {activeTab === 'groq' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-orange-50/60 border border-orange-200 text-xs text-orange-950 flex items-start gap-2.5">
                <Zap className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold block">Free Cloud Inference Tiers</span>
                  <p className="text-orange-800 leading-relaxed">
                    Groq offers blazing fast (300+ tokens/s) free API keys for open models. OpenRouter also offers free community models.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                  Groq Free API Key (Optional)
                </label>
                <input
                  id="groq-api-key-input"
                  type="password"
                  value={groqApiKey}
                  onChange={(e) => setGroqApiKey(e.target.value)}
                  placeholder="gsk_..."
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E5E3DB] rounded-xl text-[#1C1917] focus:border-[#D97706] focus:outline-none"
                />
                <p className="text-[11px] text-[#8C887B] mt-1">
                  Get a free instant key at <a href="https://console.groq.com" target="_blank" rel="noreferrer" className="text-orange-600 hover:underline">console.groq.com</a>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                  OpenRouter Free Key (Optional)
                </label>
                <input
                  id="openrouter-api-key-input"
                  type="password"
                  value={openRouterApiKey}
                  onChange={(e) => setOpenRouterApiKey(e.target.value)}
                  placeholder="sk-or-..."
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E5E3DB] rounded-xl text-[#1C1917] focus:border-[#D97706] focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB 5: GENERAL & SYSTEM PROMPT */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                  Your Display Name
                </label>
                <input
                  id="user-name-input"
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="User"
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E5E3DB] rounded-xl text-[#1C1917] focus:border-[#D97706] focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#1C1917]">Temperature: {temperature}</label>
                  <span className="text-[11px] text-[#8C887B]">
                    {temperature < 0.4 ? 'Precise & Analytical' : temperature > 0.8 ? 'Creative & Expressive' : 'Balanced'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.2"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-[#D97706] cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                  System Instructions (Personality & Core Directive)
                </label>
                <textarea
                  id="system-instruction-input"
                  rows={4}
                  value={systemInstruction}
                  onChange={(e) => setSystemInstruction(e.target.value)}
                  placeholder="You are a thoughtful, articulate assistant..."
                  className="w-full p-3 text-xs bg-white border border-[#E5E3DB] rounded-xl text-[#1C1917] focus:border-[#D97706] focus:outline-none leading-relaxed"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#F0EEE6] bg-[#FAF9F5]">
          <span className="text-xs text-[#78716C]">
            All configs saved locally in client state
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-[#57534E] hover:bg-[#EAE8E2] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="save-providers-button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded-xl bg-[#1C1917] hover:bg-[#292524] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Save & Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
