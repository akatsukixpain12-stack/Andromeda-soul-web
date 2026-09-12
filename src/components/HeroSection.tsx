import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle,
  Terminal,
  ChevronRight,
} from 'lucide-react';
import { DashboardMockup } from './DashboardMockup';

interface HeroSectionProps {
  onExecutePrompt: (prompt: string) => void;
  onOpenWaitlist: (email?: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExecutePrompt,
  onOpenWaitlist,
}) => {
  const [promptInput, setPromptInput] = useState('');
  const [submittedFeedback, setSubmittedFeedback] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;

    if (promptInput.includes('@')) {
      onOpenWaitlist(promptInput.trim());
    } else {
      onExecutePrompt(promptInput.trim());
    }
    setSubmittedFeedback(true);
    setTimeout(() => setSubmittedFeedback(false), 3500);
  };

  const samplePrompts = [
    'Build a Discord bot in Discord.js with slash commands',
    'Write a native PyTorch model with RoPE from scratch',
    'Audit workspace files for zero-token secret leakage',
  ];

  return (
    <section className="relative pt-28 sm:pt-36 pb-20 sm:pb-28 overflow-hidden bg-[#000000]">
      {/* Soft radial background glows behind main sections */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[900px] h-[400px] sm:h-[550px] bg-gradient-to-br from-indigo-600/15 via-purple-600/15 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-12 left-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-40 right-10 w-80 h-80 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Grid line background overlay with subtle mask */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Hero Content & Input */}
          <div className="lg:col-span-6 flex flex-col items-start text-left z-10">
            {/* Top Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/80 border border-white/10 backdrop-blur-md mb-6 hover:border-indigo-500/40 transition-colors shadow-xs">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
              </span>
              <span className="text-xs font-medium text-zinc-300">
                Frontier Cognitive Architecture
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-xs font-mono text-purple-400 font-semibold">
                Gemini 3.8 Flash
              </span>
            </div>

            {/* Massive Bold Headline with Bold Gradient Text Fill */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] font-display text-white mb-6">
              AI-powered{' '}
              <span className="bg-gradient-to-r from-white via-indigo-200 to-purple-400 bg-clip-text text-transparent drop-shadow-sm">
                Andromeda
              </span>{' '}
              Cognitive Engine.
            </h1>

            {/* Short High-Impact Value Proposition */}
            <p className="text-base sm:text-lg text-zinc-400 max-w-xl mb-8 leading-relaxed font-normal">
              Execute uncapped multi-step reasoning, build zero-token-leak Discord bots, and deploy native PyTorch transformers at sub-20ms edge latency.
            </p>

            {/* Input Field with Glowing Primary CTA Button */}
            <form
              onSubmit={handleSubmit}
              className="w-full max-w-xl mb-4 relative group"
            >
              <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center p-1.5 rounded-2xl bg-[#09090b]/90 border border-white/15 backdrop-blur-xl shadow-2xl focus-within:border-indigo-500/70 focus-within:shadow-[0_0_35px_-5px_rgba(79,70,229,0.45)] transition-all duration-300">
                <div className="flex items-center flex-1 px-3 py-2 sm:py-0">
                  <Terminal className="w-4 h-4 text-indigo-400 mr-2.5 shrink-0" />
                  <input
                    type="text"
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    placeholder="Enter prompt or work email to start..."
                    className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden font-mono tracking-tight"
                  />
                </div>

                {/* Glowing Primary CTA Button */}
                <button
                  type="submit"
                  className="relative inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-xs tracking-wider uppercase text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 shadow-[0_0_25px_rgba(79,70,229,0.5)] hover:shadow-[0_0_40px_rgba(192,132,252,0.6)] hover:brightness-110 active:scale-[0.98] transition-all duration-200 cursor-pointer shrink-0 mt-2 sm:mt-0"
                >
                  <span>Deploy Model</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </div>

              {submittedFeedback && (
                <div className="absolute -bottom-7 left-2 flex items-center gap-1.5 text-xs font-mono text-emerald-400 animate-in fade-in duration-200">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Prompt dispatched to Andromeda inference kernel!</span>
                </div>
              )}
            </form>

            {/* Quick Interactive Prompt Starters */}
            <div className="flex flex-wrap items-center gap-2 mt-2 mb-8">
              <span className="text-[11px] font-mono text-zinc-500 mr-1">Quick Try:</span>
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPromptInput(p)}
                  className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-zinc-900/60 border border-white/[0.06] text-zinc-400 hover:text-indigo-300 hover:border-indigo-500/30 transition-colors cursor-pointer truncate max-w-[210px]"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Micro-Trust Badges */}
            <div className="flex flex-wrap items-center gap-6 text-xs text-zinc-400 pt-2 border-t border-white/[0.06] w-full max-w-xl">
              <div className="flex items-center gap-2 font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Zero Token Leakage</span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <Zap className="w-4 h-4 text-indigo-400" />
                <span>1.05M Context Window</span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <span>Open Export (JSZip & PyTorch)</span>
              </div>
            </div>
          </div>

          {/* Right Column: High-Fidelity Interactive Dashboard Mockup */}
          <div className="lg:col-span-6 z-10">
            <DashboardMockup />
          </div>
        </div>
      </div>
    </section>
  );
};
