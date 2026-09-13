import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  Check,
  Zap,
  Sparkles,
  Cpu,
  Flame,
  HardDrive,
  Sliders,
  Plus,
  Server,
  Layers,
} from 'lucide-react';
import { GeminiModel, AIModelOption } from '../types';

interface ModelSelectorProps {
  models: (GeminiModel | AIModelOption)[];
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  onOpenProvidersModal?: () => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModelId,
  onSelectModel,
  onOpenProvidersModal,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedModel =
    models.find((m) => m.id === selectedModelId) ||
    models[0] || {
      id: 'andromeda-soul-1',
      name: 'Andromeda Soul 1.0',
      description: 'Built-in sovereign intelligence with uncapped reasoning and Discord bot engineering',
      badge: 'Soul 1',
    };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getModelIcon = (id: string, provider?: string) => {
    if (id.includes('andromeda') || id.includes('soul')) {
      return <Flame className="w-4 h-4 text-amber-500" />;
    }
    if (provider === 'ollama' || id.includes('ollama')) {
      return <Cpu className="w-4 h-4 text-emerald-500" />;
    }
    if (provider === 'lmstudio' || id.includes('lmstudio')) {
      return <HardDrive className="w-4 h-4 text-purple-500" />;
    }
    if (provider === 'groq') {
      return <Zap className="w-4 h-4 text-orange-500" />;
    }
    if (provider === 'deepseek' || id.includes('deepseek')) {
      return <Cpu className="w-4 h-4 text-cyan-500" />;
    }
    if (id.includes('pro')) {
      return <Layers className="w-4 h-4 text-indigo-500" />;
    }
    return <Sparkles className="w-4 h-4 text-blue-500" />;
  };

  const getBadgeStyle = (id: string, isCustom?: boolean) => {
    if (isCustom) {
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-semibold';
    }
    if (id.includes('andromeda') || id.includes('soul')) {
      return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-semibold';
    }
    return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700';
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        id="model-selector-button"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/80 dark:border-slate-800 cursor-pointer"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-1.5">
          {getModelIcon(selectedModel.id, 'provider' in selectedModel ? (selectedModel as any).provider : undefined)}
          <span className="font-semibold">{selectedModel.name}</span>
        </span>
        {selectedModel.badge && (
          <span className={`text-[11px] font-normal px-1.5 py-0.5 rounded-md ${getBadgeStyle(selectedModel.id, 'isCustom' in selectedModel ? (selectedModel as any).isCustom : false)}`}>
            {selectedModel.badge}
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-84 max-h-[75vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
            <span>AI Models & Engines</span>
            <span className="text-[10px] lowercase font-normal text-slate-400">{models.length} available</span>
          </div>

          <div className="space-y-1 p-1">
            {models.map((model) => {
              const isSelected = model.id === selectedModelId;
              const isSoul = model.id.includes('soul') || model.id.includes('andromeda');
              return (
                <button
                  key={model.id}
                  id={`select-model-${model.id}`}
                  onClick={() => {
                    onSelectModel(model.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl flex items-start justify-between gap-2 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/10 dark:bg-amber-500/20 text-slate-900 dark:text-white border border-amber-500/30'
                      : isSoul
                      ? 'hover:bg-amber-500/10 text-slate-800 dark:text-slate-200'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className={`mt-0.5 p-1 rounded-lg shrink-0 ${isSoul ? 'bg-amber-500/10' : 'bg-slate-100 dark:bg-slate-800'}`}>
                      {getModelIcon(model.id, model.provider)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">{model.name}</span>
                        {model.badge && (
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${getBadgeStyle(model.id, model.isCustom)}`}
                          >
                            {model.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {model.description}
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-emerald-500 mt-1 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Direct Configure Providers Button */}
          {onOpenProvidersModal && (
            <div className="pt-1.5 mt-1 border-t border-slate-100 dark:border-slate-800 px-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenProvidersModal();
                }}
                className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-amber-500/10 text-slate-700 dark:text-slate-200 hover:text-amber-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>+ Add / Manage Model APIs & Keys</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
