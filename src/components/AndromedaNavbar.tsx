import React, { useState, useRef, useEffect } from 'react';
import {
  PanelLeft,
  Plus,
  Sliders,
  Sparkles,
  Cpu,
  ChevronDown,
  Check,
  CheckCircle2,
  Edit2,
  HardDrive,
  Flame,
  Zap,
  Bot,
  Globe,
  Layers,
  Server,
  Terminal,
} from 'lucide-react';
import { AIModelOption, ProviderConnectionStatus, UserProfile } from '../types';
import { getAllModels, findModelById } from '../data/models';
import { UserAvatar } from './UserAvatar';

interface AndromedaNavbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onNewChat: () => void;
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  onOpenProvidersModal: () => void;
  onOpenAuth?: () => void;
  onOpenKnowledgeModal?: () => void;
  knowledgeCount?: number;
  currentUser?: UserProfile | null;
  activeConversationTitle?: string;
  onRenameActiveConversation?: (newTitle: string) => void;
  connectionStatus?: ProviderConnectionStatus;
  customModels?: AIModelOption[];
}

export const AndromedaNavbar: React.FC<AndromedaNavbarProps> = ({
  isSidebarOpen,
  onToggleSidebar,
  onNewChat,
  selectedModelId,
  onSelectModel,
  onOpenProvidersModal,
  onOpenAuth,
  onOpenKnowledgeModal,
  knowledgeCount = 0,
  currentUser,
  activeConversationTitle,
  onRenameActiveConversation,
  customModels = [],
}) => {
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const allModels = getAllModels(customModels);
  const currentModel = findModelById(selectedModelId, customModels);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStartEditing = () => {
    setTitleInput(activeConversationTitle || 'New Conversation');
    setIsEditingTitle(true);
  };

  const handleSaveTitle = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (titleInput.trim() && onRenameActiveConversation) {
      onRenameActiveConversation(titleInput.trim());
    }
    setIsEditingTitle(false);
  };

  const getProviderIcon = (provider?: string) => {
    switch (provider) {
      case 'gemini':
        return <Sparkles className="w-4 h-4 text-blue-600" />;
      case 'andromeda':
        return <Flame className="w-4 h-4 text-amber-600" />;
      case 'openai':
        return <Globe className="w-4 h-4 text-emerald-600" />;
      case 'anthropic':
        return <Layers className="w-4 h-4 text-purple-600" />;
      case 'deepseek':
        return <Server className="w-4 h-4 text-sky-600" />;
      case 'groq':
        return <Zap className="w-4 h-4 text-orange-600" />;
      case 'openrouter':
        return <Globe className="w-4 h-4 text-indigo-600" />;
      case 'ollama':
        return <Cpu className="w-4 h-4 text-emerald-600" />;
      case 'lmstudio':
        return <HardDrive className="w-4 h-4 text-purple-600" />;
      case 'custom':
        return <Terminal className="w-4 h-4 text-neutral-600" />;
      default:
        return <Bot className="w-4 h-4 text-amber-600" />;
    }
  };

  const modelGroups = [
    { key: 'andromeda', title: 'Andromeda Frontier & Extended Thinking', filter: (m: AIModelOption) => m.provider === 'andromeda' },
    { key: 'custom', title: `Custom Configured Models (${customModels.length})`, filter: (m: AIModelOption) => m.isCustom === true },
    { key: 'gemini', title: 'Google Gemini (Multimodal & Fast)', filter: (m: AIModelOption) => m.provider === 'gemini' && !m.isCustom },
    { key: 'openai', title: 'OpenAI (GPT-4o, o3-mini)', filter: (m: AIModelOption) => m.provider === 'openai' && !m.isCustom },
    { key: 'anthropic', title: 'Anthropic Claude (3.7 Sonnet, 3.5 Haiku)', filter: (m: AIModelOption) => m.provider === 'anthropic' && !m.isCustom },
    { key: 'deepseek', title: 'DeepSeek Direct (V3 & R1)', filter: (m: AIModelOption) => m.provider === 'deepseek' && !m.isCustom },
    { key: 'groq', title: 'Groq Cloud (Ultra-Fast 300+ tok/s)', filter: (m: AIModelOption) => m.provider === 'groq' && !m.isCustom },
    { key: 'openrouter', title: 'OpenRouter & Mistral AI', filter: (m: AIModelOption) => (m.provider === 'openrouter' || m.provider === 'mistral') && !m.isCustom },
    { key: 'local', title: 'Local Offline (Ollama & LM Studio)', filter: (m: AIModelOption) => (m.provider === 'ollama' || m.provider === 'lmstudio') && !m.isCustom },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 px-3 sm:px-6 py-2.5 sm:py-3 shrink-0">
      <div className="w-full max-w-[1440px] mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Sidebar Toggle & Brand / Title */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          <button
            id="toggle-sidebar-button"
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer shrink-0"
            title={isSidebarOpen ? 'Collapse sidebar' : 'Open sidebar'}
          >
            <PanelLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 px-2 py-1 rounded-xl bg-slate-50 border border-slate-200 shrink-0">
            <img
              src="/andromeda-logo.png"
              alt="Andromeda Soul Logo"
              className="w-5 h-5 rounded-md object-cover shadow-2xs border border-blue-200/50"
              referrerPolicy="no-referrer"
            />
            <span className="hidden sm:inline text-xs font-bold text-[#1C1917] tracking-tight">Andromeda Soul</span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" title="Online" />
          </div>

          {/* Active conversation title (Editable) */}
          <div className="min-w-0 max-w-[100px] sm:max-w-[150px] md:max-w-xs truncate">
            {isEditingTitle ? (
              <form onSubmit={handleSaveTitle} className="flex items-center gap-1">
                <input
                  id="chat-title-input"
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onBlur={() => handleSaveTitle()}
                  autoFocus
                  className="px-2 py-0.5 text-xs sm:text-sm font-medium bg-white border border-indigo-300 rounded-md text-slate-900 outline-none"
                />
              </form>
            ) : (
              <button
                onClick={handleStartEditing}
                className="group flex items-center gap-1 text-xs sm:text-sm font-semibold text-slate-800 truncate hover:text-indigo-600"
                title="Click to rename"
              >
                <span className="truncate">{activeConversationTitle || 'New Conversation'}</span>
                <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 text-[#78716C] transition-opacity shrink-0" />
              </button>
            )}
          </div>
        </div>

        {/* Center: Model & Provider Selector Pill */}
        <div className="relative" ref={dropdownRef}>
          <button
            id="model-selector-pill"
            onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-full bg-white hover:bg-indigo-50 border border-slate-200 text-slate-800 shadow-sm cursor-pointer hover:border-indigo-200 max-w-[150px] sm:max-w-none"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              {getProviderIcon(currentModel.provider)}
              <span className="text-xs sm:text-sm font-medium text-[#1C1917] truncate max-w-[75px] sm:max-w-none">{currentModel.name}</span>
            </div>

            {currentModel.badge && (
              <span className="hidden sm:inline-block text-[11px] font-semibold px-1.5 py-0.2 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                {currentModel.badge}
              </span>
            )}

            <ChevronDown
              className={`w-3.5 h-3.5 text-[#78716C] transition-transform duration-200 shrink-0 ${
                isModelDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {isModelDropdownOpen && (
            <div className="fixed inset-x-2 top-14 sm:inset-x-auto sm:top-auto sm:absolute sm:left-1/2 sm:-translate-x-1/2 sm:mt-2 w-auto sm:w-104 max-h-[80dvh] rounded-2xl bg-white border border-[#E5E3DB] shadow-2xl p-2 z-50 animate-in fade-in duration-150 flex flex-col">
              <div className="px-3 py-2 border-b border-[#F0EEE6] flex items-center justify-between shrink-0">
                <span className="text-xs font-bold text-[#1C1917] uppercase tracking-wider">Select AI Model</span>
                <button
                  onClick={() => {
                    setIsModelDropdownOpen(false);
                    onOpenProvidersModal();
                  }}
                  className="text-xs font-semibold text-[#D97706] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add / Manage Models</span>
                </button>
              </div>

              <div className="max-h-[55dvh] sm:max-h-96 overflow-y-auto divide-y divide-[#F5F3ED] py-1">
                {modelGroups.map((group) => {
                  const groupModels = allModels.filter(group.filter);
                  if (groupModels.length === 0) return null;

                  return (
                    <div key={group.key} className="py-1.5">
                      <div className="px-3 py-1 text-[11px] font-bold text-[#8C887B] uppercase tracking-wider">
                        {group.title}
                      </div>
                      <div className="space-y-0.5">
                        {groupModels.map((model) => {
                          const isSelected = model.id === selectedModelId;
                          return (
                            <button
                              key={model.id}
                              id={`select-model-${model.id}`}
                              onClick={() => {
                                onSelectModel(model.id);
                                setIsModelDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl flex items-start justify-between gap-2 transition-colors cursor-pointer ${
                                isSelected ? 'bg-[#F5F3EC] text-[#1C1917]' : 'hover:bg-[#FAF9F5] text-[#292524]'
                              }`}
                            >
                              <div className="flex items-start gap-2.5 min-w-0">
                                <div className="mt-0.5 p-1 rounded-md bg-white border border-[#E5E3DB]">
                                  {getProviderIcon(model.provider)}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-sm font-medium text-[#1C1917] truncate">{model.name}</span>
                                    {model.badge && (
                                      <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-[#F2F0E8] text-[#57534E] font-medium">
                                        {model.badge}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-[#78716C] line-clamp-1 mt-0.5">{model.description}</p>
                                </div>
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-[#D97706] shrink-0 mt-1" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer info in dropdown */}
              <div className="mt-1 pt-2 border-t border-[#F0EEE6] px-3 py-1.5 flex items-center justify-between text-xs text-[#78716C] bg-[#FAF9F5] rounded-xl">
                <span>All cloud & local models enabled</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsModelDropdownOpen(false);
                    onOpenProvidersModal();
                  }}
                  className="font-semibold text-amber-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" /> Configure Keys
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Cloud Status, Providers config, Google Auth & New Chat */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Google Cloud Server Status Pill */}
          <button
            onClick={onOpenKnowledgeModal}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-emerald-50 text-emerald-900 border border-emerald-200/90 hover:bg-emerald-100/80 transition-all cursor-pointer shadow-2xs"
            title="Google Cloud Firestore: Real-time Cloud Persistence & Autonomous Memory Active. Click to inspect memory."
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-emerald-950">Google Cloud</span>
            <span className="text-[10px] text-emerald-800 bg-emerald-200/60 font-mono px-1.5 py-0.5 rounded-md">
              {knowledgeCount > 0 ? `${knowledgeCount} Memories` : 'Connected'}
            </span>
          </button>

          <button
            id="open-providers-modal-button"
            onClick={onOpenProvidersModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-[#44403C] hover:text-[#1C1917] hover:bg-[#F0EEE6] border border-transparent hover:border-[#E2E0D8] transition-all cursor-pointer"
            title="Configure API Keys & Add Custom Models"
          >
            <Sliders className="w-4 h-4 text-amber-600" />
            <span className="hidden md:inline">Providers & Fleet</span>
          </button>

          {/* Google Auth / User Identity button */}
          <button
            id="navbar-google-auth-button"
            onClick={onOpenAuth}
            className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
              currentUser && currentUser.provider === 'google'
                ? 'bg-emerald-50/90 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                : 'bg-white hover:bg-[#F0EEE6] text-[#44403C] hover:text-[#1C1917] border-[#E2E0D8]'
            }`}
            title={currentUser && currentUser.provider === 'google' ? `Signed in as ${currentUser.name || currentUser.email}` : 'Sign in with Google'}
          >
            {currentUser && currentUser.provider === 'google' ? (
              <>
                <UserAvatar
                  name={currentUser.name}
                  email={currentUser.email}
                  avatar={currentUser.avatar}
                  size="xs"
                />
                <span className="hidden sm:inline max-w-[100px] truncate font-semibold text-[#1C1917]">
                  {currentUser.name || 'Master Architect'}
                </span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="hidden sm:inline">Google Auth</span>
              </>
            )}
          </button>

          <button
            id="navbar-new-chat-button"
            onClick={onNewChat}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm shadow-indigo-200 cursor-pointer shrink-0"
            title="Start new conversation"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New chat</span>
          </button>
        </div>
      </div>
    </header>
  );
};
