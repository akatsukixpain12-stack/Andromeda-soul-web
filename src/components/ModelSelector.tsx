import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Zap, Sparkles, Cpu, Flame } from 'lucide-react';
import { GeminiModel } from '../types';

interface ModelSelectorProps {
  models: GeminiModel[];
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModelId,
  onSelectModel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedModel =
    models.find((m) => m.id === selectedModelId) ||
    models[0] || {
      id: 'andromeda-soul-1',
      name: 'Andromeda Soul 1',
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

  const getModelIcon = (id: string) => {
    if (id.includes('andromeda') || id.includes('soul')) {
      return <Flame className="w-4 h-4 text-violet-500" />;
    }
    if (id.includes('lite')) {
      return <Zap className="w-4 h-4 text-amber-500" />;
    }
    if (id.includes('latest')) {
      return <Cpu className="w-4 h-4 text-blue-500" />;
    }
    return <Sparkles className="w-4 h-4 text-emerald-500" />;
  };

  const getBadgeStyle = (id: string) => {
    if (id.includes('andromeda') || id.includes('soul')) {
      return 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30 font-semibold';
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
          {getModelIcon(selectedModel.id)}
          <span className="font-semibold">{selectedModel.name}</span>
        </span>
        {selectedModel.badge && (
          <span className={`text-[11px] font-normal px-1.5 py-0.5 rounded-md ${getBadgeStyle(selectedModel.id)}`}>
            {selectedModel.badge}
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            AI Models & Engines
          </div>
          <div className="space-y-1 px-1">
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
                  className={`w-full text-left px-3 py-2.5 rounded-xl flex items-start justify-between gap-2 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                      : isSoul
                      ? 'hover:bg-violet-500/10 text-slate-800 dark:text-slate-200'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`mt-0.5 p-1 rounded-lg ${isSoul ? 'bg-violet-500/10' : 'bg-slate-100 dark:bg-slate-800'}`}>
                      {getModelIcon(model.id)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-sm">{model.name}</span>
                        {model.badge && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${getBadgeStyle(model.id)}`}
                          >
                            {model.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
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
        </div>
      )}
    </div>
  );
};
