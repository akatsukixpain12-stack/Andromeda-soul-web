import React, { useState } from 'react';
import { Sparkles, ArrowRight, Shield, Terminal, CheckCircle2, Lock } from 'lucide-react';

interface FooterCTAProps {
  onOpenWaitlist: (email?: string) => void;
  onOpenLivePlayground: () => void;
}

export const FooterCTA: React.FC<FooterCTAProps> = ({
  onOpenWaitlist,
  onOpenLivePlayground,
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    onOpenWaitlist(emailInput.trim());
    setIsSubscribed(true);
    setTimeout(() => setIsSubscribed(false), 4000);
  };

  return (
    <footer className="relative bg-[#000000] border-t border-white/[0.08] pt-20 pb-12 overflow-hidden">
      {/* Soft Radial Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-indigo-600/20 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Call to Action Glass Card */}
        <div className="relative rounded-3xl p-8 sm:p-14 bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 border border-white/15 backdrop-blur-2xl text-center shadow-[0_0_80px_-20px_rgba(79,70,229,0.3)] max-w-4xl mx-auto mb-16 overflow-hidden">
          {/* Subtle inner grid lines */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
              backgroundSize: '32px 32px',
            }}
          />

          <div className="relative z-10 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-mono text-indigo-400 mb-6 shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>START ACCELERATING YOUR INFERENCE TODAY</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight font-display text-white mb-4 leading-tight">
              Ready to deploy{' '}
              <span className="bg-gradient-to-r from-white via-indigo-200 to-purple-400 bg-clip-text text-transparent">
                Frontier Intelligence
              </span>
              ?
            </h2>

            <p className="text-sm sm:text-base text-zinc-400 max-w-xl mb-8 leading-relaxed">
              Zero token leak guarantee, full PyTorch adapter exports, and native Discord bot integration. Build in minutes, not weeks.
            </p>

            {/* Email form with glowing button */}
            <form
              onSubmit={handleSubmit}
              className="w-full max-w-md relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-1.5 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md focus-within:border-indigo-500/80 focus-within:shadow-[0_0_30px_rgba(79,70,229,0.4)] transition-all mb-4"
            >
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Enter work email for instant access..."
                required
                className="w-full bg-transparent px-4 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden font-mono"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl font-semibold text-xs tracking-wider uppercase text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow-[0_0_20px_rgba(79,70,229,0.5)] hover:shadow-[0_0_30px_rgba(192,132,252,0.6)] hover:brightness-110 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <span>Get API Keys</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {isSubscribed && (
              <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 animate-in fade-in duration-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Access credential generated! Opening console...</span>
              </div>
            )}

            <div className="flex items-center gap-4 text-xs text-zinc-500 font-mono mt-3">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-zinc-400" /> Free Tier Available
              </span>
              <span>•</span>
              <span>No Credit Card Required</span>
              <span>•</span>
              <span>Cancel Anytime</span>
            </div>
          </div>
        </div>

        {/* Minimalist Bottom Footer */}
        <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-zinc-400">All Systems Operational</span>
            <span className="text-zinc-600">•</span>
            <span>Cluster: Asia-East-1</span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="#features"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              Architecture
            </a>
            <a
              href="#benchmarks"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              Benchmarks
            </a>
            <button
              type="button"
              onClick={onOpenLivePlayground}
              className="text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
            >
              Live Chat Console
            </button>
          </div>

          <div>
            &copy; {new Date().getFullYear()} Andromeda OS Inc. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
