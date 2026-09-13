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
  Plus,
  Trash2,
  Globe,
  Bot,
  Layers,
  Terminal,
  Server,
  ShieldCheck,
} from 'lucide-react';
import { UserSettings, AIModelOption, AIProvider } from '../types';
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
  const [activeTab, setActiveTab] = useState<
    'models' | 'gemini' | 'openai' | 'anthropic' | 'deepseek' | 'groq' | 'openrouter' | 'ollama' | 'lmstudio' | 'custom' | 'general'
  >('models');

  // Form states for providers
  const [geminiApiKey, setGeminiApiKey] = useState(settings.geminiApiKey || '');
  const [showGeminiKey, setShowGeminiKey] = useState(false);

  const [openaiApiKey, setOpenaiApiKey] = useState(settings.openaiApiKey || '');
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);

  const [anthropicApiKey, setAnthropicApiKey] = useState(settings.anthropicApiKey || '');
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);

  const [deepseekApiKey, setDeepseekApiKey] = useState(settings.deepseekApiKey || '');
  const [showDeepseekKey, setShowDeepseekKey] = useState(false);

  const [groqApiKey, setGroqApiKey] = useState(settings.groqApiKey || '');
  const [showGroqKey, setShowGroqKey] = useState(false);

  const [openRouterApiKey, setOpenRouterApiKey] = useState(settings.openRouterApiKey || '');
  const [showOpenRouterKey, setShowOpenRouterKey] = useState(false);

  const [mistralApiKey, setMistralApiKey] = useState(settings.mistralApiKey || '');

  // Local hosts
  const [ollamaHost, setOllamaHost] = useState(settings.ollamaHost || 'http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState(settings.ollamaModel || 'deepseek-r1:8b');

  const [lmStudioHost, setLmStudioHost] = useState(settings.lmStudioHost || 'http://localhost:1234/v1');
  const [lmStudioModel, setLmStudioModel] = useState(settings.lmStudioModel || 'default');

  // Custom API endpoint
  const [customApiBaseUrl, setCustomApiBaseUrl] = useState(settings.customApiBaseUrl || '');
  const [customApiKey, setCustomApiKey] = useState(settings.customApiKey || '');
  const [customApiModel, setCustomApiModel] = useState(settings.customApiModel || '');

  // Custom Models List
  const [customModels, setCustomModels] = useState<AIModelOption[]>(settings.customModels || []);

  // New Custom Model Input form
  const [newModelName, setNewModelName] = useState('');
  const [newModelTag, setNewModelTag] = useState('');
  const [newModelProvider, setNewModelProvider] = useState<AIProvider>('openai');
  const [newModelBaseUrl, setNewModelBaseUrl] = useState('');
  const [newModelApiKey, setNewModelApiKey] = useState('');
  const [newModelBadge, setNewModelBadge] = useState('Custom');
  const [newModelSupportsThinking, setNewModelSupportsThinking] = useState(false);
  const [newModelDescription, setNewModelDescription] = useState('');

  // General settings
  const [systemInstruction, setSystemInstruction] = useState(settings.systemInstruction || '');
  const [temperature, setTemperature] = useState(settings.temperature ?? 0.7);
  const [userName, setUserName] = useState(settings.userName || 'User');
  const [enableWebSearch, setEnableWebSearch] = useState(settings.enableWebSearch !== false);
  const [enableCalculator, setEnableCalculator] = useState(settings.enableCalculator !== false);

  // Testing states
  const [ollamaTesting, setOllamaTesting] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<{ ok: boolean; models: string[]; message?: string } | null>(null);

  const [lmStudioTesting, setLmStudioTesting] = useState(false);
  const [lmStudioStatus, setLmStudioStatus] = useState<{ ok: boolean; models: string[]; message?: string } | null>(null);

  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setGeminiApiKey(settings.geminiApiKey || '');
      setOpenaiApiKey(settings.openaiApiKey || '');
      setAnthropicApiKey(settings.anthropicApiKey || '');
      setDeepseekApiKey(settings.deepseekApiKey || '');
      setGroqApiKey(settings.groqApiKey || '');
      setOpenRouterApiKey(settings.openRouterApiKey || '');
      setMistralApiKey(settings.mistralApiKey || '');
      setOllamaHost(settings.ollamaHost || 'http://localhost:11434');
      setOllamaModel(settings.ollamaModel || 'deepseek-r1:8b');
      setLmStudioHost(settings.lmStudioHost || 'http://localhost:1234/v1');
      setLmStudioModel(settings.lmStudioModel || 'default');
      setCustomApiBaseUrl(settings.customApiBaseUrl || '');
      setCustomApiKey(settings.customApiKey || '');
      setCustomApiModel(settings.customApiModel || '');
      setCustomModels(settings.customModels || []);
      setSystemInstruction(settings.systemInstruction || '');
      setTemperature(settings.temperature ?? 0.7);
      setUserName(settings.userName || 'User');
      setEnableWebSearch(settings.enableWebSearch !== false);
      setEnableCalculator(settings.enableCalculator !== false);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    const updated: UserSettings = {
      ...settings,
      geminiApiKey: geminiApiKey.trim() || undefined,
      openaiApiKey: openaiApiKey.trim() || undefined,
      anthropicApiKey: anthropicApiKey.trim() || undefined,
      deepseekApiKey: deepseekApiKey.trim() || undefined,
      groqApiKey: groqApiKey.trim() || undefined,
      openRouterApiKey: openRouterApiKey.trim() || undefined,
      mistralApiKey: mistralApiKey.trim() || undefined,
      ollamaHost: ollamaHost.trim(),
      ollamaModel: ollamaModel.trim(),
      lmStudioHost: lmStudioHost.trim(),
      lmStudioModel: lmStudioModel.trim(),
      customApiBaseUrl: customApiBaseUrl.trim() || undefined,
      customApiKey: customApiKey.trim() || undefined,
      customApiModel: customApiModel.trim() || undefined,
      customModels,
      systemInstruction: systemInstruction.trim(),
      temperature,
      userName: userName.trim(),
      enableWebSearch,
      enableCalculator,
    };
    onSaveSettings(updated);
    onClose();
  };

  const handleAddCustomModel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModelName.trim() || !newModelTag.trim()) {
      alert('Please provide a Model Name and Model Identifier/Tag.');
      return;
    }

    const newOption: AIModelOption = {
      id: `custom-${Date.now()}-${newModelTag.replace(/[^a-zA-Z0-9_-]/g, '')}`,
      name: newModelName.trim(),
      provider: newModelProvider,
      providerLabel: `${newModelProvider.toUpperCase()} (Custom)`,
      customModelTag: newModelTag.trim(),
      customBaseUrl: newModelBaseUrl.trim() || undefined,
      customApiKey: newModelApiKey.trim() || undefined,
      description: newModelDescription.trim() || `User-configured ${newModelName} model running via ${newModelProvider}.`,
      badge: newModelBadge.trim() || 'Custom',
      isFree: newModelProvider === 'ollama' || newModelProvider === 'lmstudio',
      speed: 'Fast',
      intelligence: 'Custom',
      supportsThinking: newModelSupportsThinking,
      isCustom: true,
      createdAt: Date.now(),
    };

    const updated = [...customModels, newOption];
    setCustomModels(updated);

    // Reset inputs
    setNewModelName('');
    setNewModelTag('');
    setNewModelBaseUrl('');
    setNewModelApiKey('');
    setNewModelBadge('Custom');
    setNewModelDescription('');
    setNewModelSupportsThinking(false);
  };

  const handleDeleteCustomModel = (id: string) => {
    setCustomModels(customModels.filter((m) => m.id !== id));
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

  const handleAddOllamaModelToCustom = (tag: string) => {
    if (customModels.some((m) => m.customModelTag === tag)) {
      alert(`Model ${tag} is already in your model list!`);
      return;
    }
    const option: AIModelOption = {
      id: `custom-ollama-${Date.now()}-${tag.replace(/[^a-zA-Z0-9_-]/g, '')}`,
      name: `Ollama ${tag}`,
      provider: 'ollama',
      providerLabel: 'Ollama (Local)',
      customModelTag: tag,
      description: `Locally hosted Ollama model: ${tag}`,
      badge: 'Local Offline',
      isFree: true,
      speed: 'Local GPU/CPU',
      intelligence: 'Custom Local',
      supportsThinking: tag.includes('r1') || tag.includes('reason'),
      isCustom: true,
    };
    setCustomModels([...customModels, option]);
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

  const handleAddLMStudioModelToCustom = (tag: string) => {
    if (customModels.some((m) => m.customModelTag === tag)) {
      alert(`Model ${tag} is already in your model list!`);
      return;
    }
    const option: AIModelOption = {
      id: `custom-lmstudio-${Date.now()}-${tag.replace(/[^a-zA-Z0-9_-]/g, '')}`,
      name: `LM Studio ${tag}`,
      provider: 'lmstudio',
      providerLabel: 'LM Studio',
      customModelTag: tag,
      description: `LM Studio server loaded model: ${tag}`,
      badge: 'Local Offline',
      isFree: true,
      speed: 'Local GPU/CPU',
      intelligence: 'Custom Local',
      supportsThinking: true,
      isCustom: true,
    };
    setCustomModels([...customModels, option]);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(key);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-white border border-[#E5E3DB] rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0EEE6] bg-[#FAF9F5]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 border border-amber-200">
              <Sliders className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1C1917]">AI Providers & Model Fleet Manager</h2>
              <p className="text-xs text-[#78716C]">
                Configure API keys, add custom models from any provider, or run 100% offline local models.
              </p>
            </div>
          </div>
          <button
            id="close-providers-modal"
            onClick={onClose}
            className="p-2 rounded-xl text-[#78716C] hover:text-[#1C1917] hover:bg-[#EAE8E2] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#F0EEE6] px-6 bg-[#FAF9F5]/70 gap-1 overflow-x-auto py-2">
          {[
            { id: 'models', label: 'Custom Models Fleet', icon: <Bot className="w-3.5 h-3.5 text-amber-600" /> },
            { id: 'gemini', label: 'Google Gemini', icon: <Sparkles className="w-3.5 h-3.5 text-blue-600" /> },
            { id: 'openai', label: 'OpenAI', icon: <Globe className="w-3.5 h-3.5 text-emerald-600" /> },
            { id: 'anthropic', label: 'Anthropic Claude', icon: <Layers className="w-3.5 h-3.5 text-purple-600" /> },
            { id: 'deepseek', label: 'DeepSeek', icon: <Server className="w-3.5 h-3.5 text-sky-600" /> },
            { id: 'groq', label: 'Groq Cloud', icon: <Zap className="w-3.5 h-3.5 text-orange-600" /> },
            { id: 'openrouter', label: 'OpenRouter', icon: <Globe className="w-3.5 h-3.5 text-indigo-600" /> },
            { id: 'ollama', label: 'Ollama (Local)', icon: <Cpu className="w-3.5 h-3.5 text-emerald-600" /> },
            { id: 'lmstudio', label: 'LM Studio', icon: <HardDrive className="w-3.5 h-3.5 text-purple-600" /> },
            { id: 'custom', label: 'Generic API', icon: <Terminal className="w-3.5 h-3.5 text-neutral-600" /> },
            { id: 'general', label: 'Orchestrator Settings', icon: <Flame className="w-3.5 h-3.5 text-amber-600" /> },
          ].map((tab) => (
            <button
              id={`provider-tab-${tab.id}`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white shadow-xs text-[#1C1917] border border-[#E5E3DB]'
                  : 'text-[#78716C] hover:text-[#1C1917] hover:bg-white/60'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.id === 'models' && customModels.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-bold">
                  {customModels.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-white">
          {/* TAB: CUSTOM MODELS FLEET */}
          {activeTab === 'models' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 flex items-start gap-3">
                <Bot className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-sm block">Add Any AI Model to Andromeda</span>
                  <p className="text-amber-900/90 leading-relaxed">
                    You can add any AI model from OpenAI, Anthropic, DeepSeek, Groq, OpenRouter, Mistral, Ollama, LM Studio, or your own self-hosted inference server.
                    Every model added here immediately appears across all dropdowns, the navigation header, and sidebar!
                  </p>
                </div>
              </div>

              {/* Add Custom Model Form */}
              <div className="p-4 border border-[#E5E3DB] rounded-xl bg-[#FAF9F5] space-y-4">
                <div className="flex items-center justify-between border-b border-[#EAE8E2] pb-2">
                  <h3 className="text-xs font-bold text-[#1C1917] uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-amber-600" />
                    <span>Add New AI Model</span>
                  </h3>
                  <span className="text-[11px] text-[#78716C]">Shows up instantly in Model Selector</span>
                </div>

                <form onSubmit={handleAddCustomModel} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                        Model Display Name *
                      </label>
                      <input
                        id="new-model-name-input"
                        type="text"
                        value={newModelName}
                        onChange={(e) => setNewModelName(e.target.value)}
                        placeholder="e.g. Claude 3.7 Sonnet, Llama 3.3 70B, GPT-4o"
                        required
                        className="w-full px-3 py-2 text-xs bg-white border border-[#E5E3DB] rounded-xl text-[#1C1917] focus:border-[#D97706] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                        Model Identifier / Tag *
                      </label>
                      <input
                        id="new-model-tag-input"
                        type="text"
                        value={newModelTag}
                        onChange={(e) => setNewModelTag(e.target.value)}
                        placeholder="e.g. claude-3-7-sonnet-20250219, gpt-4o, deepseek-r1:8b"
                        required
                        className="w-full px-3 py-2 text-xs bg-white border border-[#E5E3DB] rounded-xl text-[#1C1917] focus:border-[#D97706] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                        Provider Architecture
                      </label>
                      <select
                        id="new-model-provider-select"
                        value={newModelProvider}
                        onChange={(e) => setNewModelProvider(e.target.value as AIProvider)}
                        className="w-full px-3 py-2 text-xs bg-white border border-[#E5E3DB] rounded-xl text-[#1C1917] focus:border-[#D97706] focus:outline-none"
                      >
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic Claude</option>
                        <option value="deepseek">DeepSeek Direct</option>
                        <option value="groq">Groq Cloud (Fast)</option>
                        <option value="openrouter">OpenRouter</option>
                        <option value="mistral">Mistral AI</option>
                        <option value="ollama">Ollama (Localhost:11434)</option>
                        <option value="lmstudio">LM Studio (Localhost:1234)</option>
                        <option value="gemini">Google Gemini</option>
                        <option value="custom">Custom OpenAI-Compatible</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                        Badge Label
                      </label>
                      <input
                        id="new-model-badge-input"
                        type="text"
                        value={newModelBadge}
                        onChange={(e) => setNewModelBadge(e.target.value)}
                        placeholder="e.g. Frontier, Custom, Fast"
                        className="w-full px-3 py-2 text-xs bg-white border border-[#E5E3DB] rounded-xl text-[#1C1917] focus:border-[#D97706] focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          id="new-model-thinking-checkbox"
                          type="checkbox"
                          checked={newModelSupportsThinking}
                          onChange={(e) => setNewModelSupportsThinking(e.target.checked)}
                          className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-gray-300"
                        />
                        <span className="text-xs font-semibold text-[#1C1917]">Supports Extended Thinking</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                        Custom Endpoint / Base URL (Optional)
                      </label>
                      <input
                        id="new-model-url-input"
                        type="text"
                        value={newModelBaseUrl}
                        onChange={(e) => setNewModelBaseUrl(e.target.value)}
                        placeholder="Defaults to standard provider URL"
                        className="w-full px-3 py-2 text-xs bg-white border border-[#E5E3DB] rounded-xl text-[#1C1917] focus:border-[#D97706] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                        Custom Model API Key (Optional)
                      </label>
                      <input
                        id="new-model-key-input"
                        type="password"
                        value={newModelApiKey}
                        onChange={(e) => setNewModelApiKey(e.target.value)}
                        placeholder="Leave blank to use provider key"
                        className="w-full px-3 py-2 text-xs bg-white border border-[#E5E3DB] rounded-xl text-[#1C1917] focus:border-[#D97706] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      id="submit-add-custom-model"
                      type="submit"
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Model to AI List</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Active Custom Models Fleet */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-[#1C1917] uppercase tracking-wider">
                  Configured Custom Models ({customModels.length})
                </h3>

                {customModels.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-[#E5E3DB] rounded-xl text-xs text-[#78716C] space-y-1">
                    <Bot className="w-8 h-8 text-[#A8A29E] mx-auto mb-2 opacity-50" />
                    <p className="font-semibold text-[#44403C]">No custom models added yet.</p>
                    <p>Use the form above or test local Ollama/LM Studio to add models with one click.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {customModels.map((model) => (
                      <div
                        key={model.id}
                        className="p-3.5 bg-white border border-[#E5E3DB] hover:border-amber-400 rounded-xl shadow-xs flex items-start justify-between gap-3 transition-colors"
                      >
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#1C1917] truncate">{model.name}</span>
                            <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-md text-[10px] font-semibold whitespace-nowrap">
                              {model.badge}
                            </span>
                          </div>
                          <p className="text-[11px] font-mono text-[#78716C] truncate">
                            Tag: {model.customModelTag || model.id} • {model.provider?.toUpperCase()}
                          </p>
                          {model.customBaseUrl && (
                            <p className="text-[10px] text-[#A8A29E] truncate">URL: {model.customBaseUrl}</p>
                          )}
                        </div>
                        <button
                          id={`delete-model-${model.id}`}
                          onClick={() => handleDeleteCustomModel(model.id)}
                          className="p-1.5 text-[#78716C] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove Model"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: GOOGLE GEMINI */}
          {activeTab === 'gemini' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block text-sm">Google Gemini API (Free Cloud Tier)</span>
                  <p className="text-blue-800/90 leading-relaxed">
                    High speed, 1M multimodal context, and real-time Search Grounding. The app comes pre-configured, or you can provide your own personal key.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                  Gemini API Key
                </label>
                <div className="relative">
                  <input
                    id="gemini-api-key-input"
                    type={showGeminiKey ? 'text' : 'password'}
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full pl-3 pr-10 py-2.5 text-xs bg-white border border-[#E5E3DB] rounded-xl text-[#1C1917] focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                    className="absolute right-3 top-3 text-[#78716C] hover:text-[#1C1917]"
                  >
                    {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-[#78716C]">
                  <span>Supports Gemini 3.6 Flash, Gemini 3.6 Pro, and Search Grounding.</span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    Get Free Gemini Key <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB: OPENAI */}
          {activeTab === 'openai' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-3">
                <Globe className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block text-sm">OpenAI Platform (GPT-4o, o3-mini, o1)</span>
                  <p className="text-emerald-800 leading-relaxed">
                    Connect directly to OpenAI’s API. Enter your API key below to unlock GPT-4o, GPT-4o Mini, and o3-mini reasoning.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                  OpenAI API Key
                </label>
                <div className="relative">
                  <input
                    id="openai-api-key-input"
                    type={showOpenaiKey ? 'text' : 'password'}
                    value={openaiApiKey}
                    onChange={(e) => setOpenaiApiKey(e.target.value)}
                    placeholder="sk-proj-..."
                    className="w-full pl-3 pr-10 py-2.5 text-xs bg-white border border-[#E5E3DB] rounded-xl text-[#1C1917] focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                    className="absolute right-3 top-3 text-[#78716C] hover:text-[#1C1917]"
                  >
                    {showOpenaiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-[#78716C]">
                  <span>Never sent to external third parties. Proxied securely through backend.</span>
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    Get OpenAI Key <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ANTHROPIC CLAUDE */}
          {activeTab === 'anthropic' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 text-xs text-purple-950 flex items-start gap-3">
                <Layers className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block text-sm">Anthropic Claude (3.7 Sonnet, 3.5 Haiku)</span>
                  <p className="text-purple-800 leading-relaxed">
                    Enables native Claude 3.7 Sonnet with extended thinking mode and high-fidelity code generation.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                  Anthropic API Key
                </label>
                <div className="relative">
                  <input
                    id="anthropic-api-key-input"
                    type={showAnthropicKey ? 'text' : 'password'}
                    value={anthropicApiKey}
                    onChange={(e) => setAnthropicApiKey(e.target.value)}
                    placeholder="sk-ant-api..."
                    className="w-full pl-3 pr-10 py-2.5 text-xs bg-white border border-[#E5E3DB] rounded-xl text-[#1C1917] focus:border-purple-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                    className="absolute right-3 top-3 text-[#78716C] hover:text-[#1C1917]"
                  >
                    {showAnthropicKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-[#78716C]">
                  <span>Supports Claude 3.7 Sonnet extended thinking and tokens.</span>
                  <a
                    href="https://console.anthropic.com/settings/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    Get Anthropic Key <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB: DEEPSEEK */}
          {activeTab === 'deepseek' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200 text-xs text-sky-950 flex items-start gap-3">
                <Server className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block text-sm">DeepSeek Official API (V3 & R1)</span>
                  <p className="text-sky-800 leading-relaxed">
                    Direct access to DeepSeek-V3 671B Mixture-of-Experts and DeepSeek-R1 full frontier reasoning engine.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                  DeepSeek API Key
                </label>
                <div className="relative">
                  <input
                    id="deepseek-api-key-input"
                    type={showDeepseekKey ? 'text' : 'password'}
                    value={deepseekApiKey}
                    onChange={(e) => setDeepseekApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full pl-3 pr-10 py-2.5 text-xs bg-white border border-[#E5E3DB] rounded-xl text-[#1C1917] focus:border-sky-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeepseekKey(!showDeepseekKey)}
                    className="absolute right-3 top-3 text-[#78716C] hover:text-[#1C1917]"
                  >
                    {showDeepseekKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-[#78716C]">
                  <span>Fast inference on api.deepseek.com.</span>
                  <a
                    href="https://platform.deepseek.com/api_keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    Get DeepSeek Key <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB: GROQ */}
          {activeTab === 'groq' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-200 text-xs text-orange-950 flex items-start gap-3">
                <Zap className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block text-sm">Groq LPUs (Ultra-Fast 300+ tok/s)</span>
                  <p className="text-orange-800 leading-relaxed">
                    Near instantaneous token streaming for Llama 3.3 70B and DeepSeek R1 Distill. Free tier available at Groq Console.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                  Groq API Key
                </label>
                <div className="relative">
                  <input
                    id="groq-api-key-input"
                    type={showGroqKey ? 'text' : 'password'}
                    value={groqApiKey}
                    onChange={(e) => setGroqApiKey(e.target.value)}
                    placeholder="gsk_..."
                    className="w-full pl-3 pr-10 py-2.5 text-xs bg-white border border-[#E5E3DB] rounded-xl text-[#1C1917] focus:border-orange-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGroqKey(!showGroqKey)}
                    className="absolute right-3 top-3 text-[#78716C] hover:text-[#1C1917]"
                  >
                    {showGroqKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-[#78716C]">
                  <span>Instant streaming directly accelerated on Groq LPUs.</span>
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-orange-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    Get Free Groq Key <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB: OPENROUTER */}
          {activeTab === 'openrouter' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-950 flex items-start gap-3">
                <Globe className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block text-sm">OpenRouter Unified Gateway</span>
                  <p className="text-indigo-800 leading-relaxed">
                    Access hundreds of models via a single API key, including DeepSeek R1 Free, Claude 3.7, GPT-4o, and Qwen.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                  OpenRouter API Key
                </label>
                <div className="relative">
                  <input
                    id="openrouter-api-key-input"
                    type={showOpenRouterKey ? 'text' : 'password'}
                    value={openRouterApiKey}
                    onChange={(e) => setOpenRouterApiKey(e.target.value)}
                    placeholder="sk-or-v1-..."
                    className="w-full pl-3 pr-10 py-2.5 text-xs bg-white border border-[#E5E3DB] rounded-xl text-[#1C1917] focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOpenRouterKey(!showOpenRouterKey)}
                    className="absolute right-3 top-3 text-[#78716C] hover:text-[#1C1917]"
                  >
                    {showOpenRouterKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-[#78716C]">
                  <span>Supports free community tiers (`deepseek/deepseek-r1:free`).</span>
                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    Get OpenRouter Key <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB: OLLAMA */}
          {activeTab === 'ollama' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-3">
                <Cpu className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block text-sm">100% Free & Local with Ollama</span>
                  <p className="text-emerald-800 leading-relaxed">
                    Run models completely offline on your own GPU/CPU. Zero API keys, 100% data privacy.
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
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E5E3DB] rounded-xl text-[#1C1917] focus:border-emerald-500 focus:outline-none"
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
                    <span>{ollamaTesting ? 'Testing...' : 'Discover Models'}</span>
                  </button>
                </div>
              </div>

              {ollamaStatus && (
                <div
                  className={`p-3 rounded-xl border text-xs flex flex-col gap-2 ${
                    ollamaStatus.ok
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {ollamaStatus.ok ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span className="font-semibold">{ollamaStatus.message}</span>
                  </div>

                  {ollamaStatus.models.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold text-emerald-800">
                        Click any model below to add it directly to your Andromeda AI Fleet:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {ollamaStatus.models.map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => handleAddOllamaModelToCustom(m)}
                            className="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-xs font-mono text-emerald-800 hover:bg-emerald-100 flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Plus className="w-3 h-3 text-emerald-600" />
                            <span>{m}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB: LM STUDIO */}
          {activeTab === 'lmstudio' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 text-xs text-purple-950 flex items-start gap-3">
                <HardDrive className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block text-sm">LM Studio Local Server</span>
                  <p className="text-purple-800 leading-relaxed">
                    Connects directly to LM Studio on port 1234. Load any model inside LM Studio and Andromeda will stream from it.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                    LM Studio Base URL
                  </label>
                  <input
                    id="lmstudio-host-input"
                    type="text"
                    value={lmStudioHost}
                    onChange={(e) => setLmStudioHost(e.target.value)}
                    placeholder="http://localhost:1234/v1"
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E5E3DB] rounded-xl text-[#1C1917] focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                    Test Connection
                  </label>
                  <button
                    id="test-lmstudio-button"
                    type="button"
                    onClick={handleTestLMStudio}
                    disabled={lmStudioTesting}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#FAF9F5] hover:bg-[#F2F0E8] border border-[#E5E3DB] text-xs font-semibold text-[#1C1917] transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${lmStudioTesting ? 'animate-spin' : ''}`} />
                    <span>{lmStudioTesting ? 'Testing...' : 'Discover Models'}</span>
                  </button>
                </div>
              </div>

              {lmStudioStatus && (
                <div
                  className={`p-3 rounded-xl border text-xs flex flex-col gap-2 ${
                    lmStudioStatus.ok
                      ? 'bg-purple-50 border-purple-200 text-purple-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {lmStudioStatus.ok ? (
                      <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span className="font-semibold">{lmStudioStatus.message}</span>
                  </div>

                  {lmStudioStatus.models.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold text-purple-800">
                        Click loaded model to add to AI Fleet:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {lmStudioStatus.models.map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => handleAddLMStudioModelToCustom(m)}
                            className="px-2.5 py-1 rounded-lg bg-white border border-purple-300 text-xs font-mono text-purple-800 hover:bg-purple-100 flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Plus className="w-3 h-3 text-purple-600" />
                            <span>{m}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB: CUSTOM GENERIC API */}
          {activeTab === 'custom' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 flex items-start gap-3">
                <Terminal className="w-5 h-5 text-neutral-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block text-sm">Self-Hosted / OpenAI Compatible Endpoint</span>
                  <p className="text-neutral-700 leading-relaxed">
                    Connect to vLLM, Ollama, FastChat, TGI, or custom OpenAI-compatible reverse proxies.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                    API Base URL
                  </label>
                  <input
                    type="text"
                    value={customApiBaseUrl}
                    onChange={(e) => setCustomApiBaseUrl(e.target.value)}
                    placeholder="https://api.together.xyz/v1/chat/completions"
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E5E3DB] rounded-xl text-[#1C1917] focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                    API Key (Optional)
                  </label>
                  <input
                    type="password"
                    value={customApiKey}
                    onChange={(e) => setCustomApiKey(e.target.value)}
                    placeholder="Bearer token or API Key"
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E5E3DB] rounded-xl text-[#1C1917] focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB: ORCHESTRATOR SETTINGS */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block text-sm">Andromeda Orchestrator Autonomous Tools</span>
                  <p className="text-amber-800 leading-relaxed">
                    Configure real-time tool planning, math solver, search grounding, and system persona directives.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 border border-[#E5E3DB] rounded-xl bg-[#FAF9F5] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#1C1917] block">Google Search Grounding</span>
                    <span className="text-[11px] text-[#78716C]">Queries live web data when required</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableWebSearch}
                    onChange={(e) => setEnableWebSearch(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                </div>

                <div className="p-3 border border-[#E5E3DB] rounded-xl bg-[#FAF9F5] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#1C1917] block">Exact Calculator Engine</span>
                    <span className="text-[11px] text-[#78716C]">Deterministic mathematical solver</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableCalculator}
                    onChange={(e) => setEnableCalculator(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                  System Instruction / Prompt Directives
                </label>
                <textarea
                  value={systemInstruction}
                  onChange={(e) => setSystemInstruction(e.target.value)}
                  rows={4}
                  placeholder="You are a helpful, senior full-stack software engineer and research architect..."
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E5E3DB] rounded-xl text-[#1C1917] focus:border-amber-500 focus:outline-none resize-y"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                    Your Name / Persona Reference
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Creator"
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E5E3DB] rounded-xl text-[#1C1917] focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#1C1917]">Temperature: {temperature}</label>
                    <span className="text-[11px] text-[#78716C]">{temperature < 0.4 ? 'Precise' : temperature > 0.8 ? 'Creative' : 'Balanced'}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.05"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full accent-amber-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#F0EEE6] bg-[#FAF9F5]">
          <div className="flex items-center gap-2 text-xs text-[#78716C]">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Settings saved automatically to local storage & Firestore.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#78716C] hover:text-[#1C1917] hover:bg-[#EAE8E2] rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="save-providers-settings-button"
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Save & Apply Fleet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
