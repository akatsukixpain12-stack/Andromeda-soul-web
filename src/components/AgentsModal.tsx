import React from 'react';
import {
  X,
  Bot,
  Terminal,
  Cpu,
  ShieldCheck,
  Search,
  Sparkles,
  Check,
  ArrowRight,
  MessageSquare,
  FileCode,
} from 'lucide-react';
import { Agent } from '../types';

interface AgentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeAgentId?: string | null;
  onSelectAgent: (agent: Agent) => void;
}

export const SOVEREIGN_AGENTS: Agent[] = [
  {
    id: 'agent-coding',
    name: 'Full-Stack Coding Agent',
    description: 'Specialized in TypeScript, React, Node.js, and architectural refactoring with rigorous zero-placeholder standards.',
    systemPrompt: `You are the Andromeda Full-Stack Coding Agent. Your mission is writing production-grade, bug-free TypeScript and React code. Never output stubs, incomplete blocks, or placeholder comments. Ensure strict type safety and architectural elegance.`,
    avatar: 'Terminal',
    category: 'Engineering',
    tools: ['Code Generation', 'Syntax Validation', 'Refactoring Engine'],
  },
  {
    id: 'agent-discord',
    name: 'Discord Bot Architect',
    description: 'Expert in Discord.js v14, REST API v10, slash commands, intents, permissions, and zero-token-leak deployments.',
    systemPrompt: `You are the Andromeda Discord Bot Architect. You engineer Discord.js v14 and Discord API v10 bots with slash commands, event handlers, and auto-moderation. You strictly enforce Zero Secret Leaks by storing tokens in .env and utilizing safe scaffolding.`,
    avatar: 'Bot',
    category: 'Discord',
    tools: ['Discord.js v14', 'Slash Command Builder', 'Gateway Intent Manager', 'Zero-Leak Scanner'],
  },
  {
    id: 'agent-python-ai',
    name: 'Python AI & PyTorch Agent',
    description: 'Mastery in building custom neural networks from scratch in Python: Transformers, RoPE, RMSNorm, SwiGLU, KV-Cache, and training loops.',
    systemPrompt: `You are the Andromeda Python AI & PyTorch Agent. You specialize in creating custom AI models and neural architectures in Python from scratch using PyTorch. You guide users through tokenizer implementation, RoPE embeddings, RMSNorm, SwiGLU feed-forward networks, custom dataset pipelines, AdamW training loops with cosine scheduling, and local serving via FastAPI.`,
    avatar: 'Cpu',
    category: 'Machine Learning',
    tools: ['PyTorch 2.x', 'Custom Transformer Engine', 'Tokenizer Studio', 'FastAPI Inference Server'],
  },
  {
    id: 'agent-security',
    name: 'Security & GitHub Agent',
    description: 'Audits codebases for hardcoded secrets, token entropy, and automates safe GitHub version control pushes.',
    systemPrompt: `You are the Andromeda Security & GitHub Agent. You protect credentials from public leaks, scan source files with Shannon entropy and regex audits, generate safe .env.example files, and push clean commits to GitHub.`,
    avatar: 'ShieldCheck',
    category: 'DevOps & Security',
    tools: ['Secret Scanner', 'Shannon Entropy Audit', 'GitHub REST v3 Sync', 'Safe Scaffolding'],
  },
  {
    id: 'agent-research',
    name: 'Deep Research Agent',
    description: 'Conducts systematic 100,000x chain-of-thought derivations, analytical comparisons, and algorithmic proofs.',
    systemPrompt: `You are the Andromeda Deep Research Agent. When evaluating complex technical questions, you derive solutions step-by-step with mathematical rigor and systematic analytical breakdowns.`,
    avatar: 'Search',
    category: 'Research',
    tools: ['Uncapped CoT Reasoning', 'Algorithmic Proofs', 'Multi-perspective Synthesis'],
  },
];

export const AgentsModal: React.FC<AgentsModalProps> = ({
  isOpen,
  onClose,
  activeAgentId,
  onSelectAgent,
}) => {
  if (!isOpen) return null;

  const getAgentIcon = (avatar: string) => {
    switch (avatar) {
      case 'Terminal':
        return <Terminal className="w-5 h-5 text-blue-500" />;
      case 'Bot':
        return <Bot className="w-5 h-5 text-violet-500" />;
      case 'Cpu':
        return <Cpu className="w-5 h-5 text-emerald-500" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5 text-amber-500" />;
      case 'Search':
        return <Search className="w-5 h-5 text-cyan-500" />;
      default:
        return <Sparkles className="w-5 h-5 text-violet-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in duration-150">
      <div
        className="w-full max-w-3xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                Sovereign Agents
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Switch Andromeda Soul 1.0 into specialized operational modes with custom toolchains.
              </p>
            </div>
          </div>
          <button
            id="close-agents-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Agents */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {SOVEREIGN_AGENTS.map((agent) => {
            const isActive = activeAgentId === agent.id;
            return (
              <div
                key={agent.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isActive
                    ? 'bg-violet-500/10 border-violet-500/40 shadow-xs'
                    : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                      {getAgentIcon(agent.avatar)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {agent.name}
                        </h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                          {agent.category}
                        </span>
                        {isActive && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Active Persona
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        {agent.description}
                      </p>

                      {/* Tool Badges */}
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {agent.tools.map((tool) => (
                          <span
                            key={tool}
                            className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-mono"
                          >
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0 gap-2">
                    <button
                      id={`select-agent-${agent.id}-btn`}
                      type="button"
                      onClick={() => {
                        onSelectAgent(agent);
                        onClose();
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-violet-600 text-white hover:bg-violet-700 shadow-xs'
                      }`}
                    >
                      <span>{isActive ? 'Keep Active' : 'Activate in Chat'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
