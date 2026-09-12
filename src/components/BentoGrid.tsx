import React, { useState } from 'react';
import {
  Brain,
  ShieldCheck,
  Globe2,
  Bot,
  Terminal,
  Layers,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
  Lock,
  Zap,
  Code2,
  Copy,
  Check,
} from 'lucide-react';

export const BentoGrid: React.FC = () => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('tokyo');
  const [sandboxScanned, setSandboxScanned] = useState(true);

  const handleCopy = () => {
    navigator.clipboard.writeText(`import torch\nimport torch.nn as nn\n\nclass AndromedaTransformer(nn.Module):\n    def __init__(self, dim=2048, heads=16):\n        super().__init__()\n        self.norm = nn.RMSNorm(dim)\n`);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const regions: Record<string, { name: string; ping: string; status: string }> = {
    tokyo: { name: 'Asia-Northeast (Tokyo)', ping: '14.2ms', status: 'Optimal' },
    usEast: { name: 'US-East (Virginia)', ping: '7.8ms', status: 'Ultra-Low' },
    frankfurt: { name: 'Europe (Frankfurt)', ping: '11.4ms', status: 'Optimal' },
  };

  return (
    <section id="features" className="relative py-24 sm:py-32 bg-[#000000] overflow-hidden">
      {/* Soft Radial Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-indigo-900/10 via-purple-900/15 to-transparent rounded-full blur-[150px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/80 border border-white/10 text-xs font-mono text-indigo-400 mb-4 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>ASYMMETRIC CORE ARCHITECTURE</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-display text-white mb-4">
            Engineered for{' '}
            <span className="bg-gradient-to-r from-white via-indigo-200 to-purple-400 bg-clip-text text-transparent">
              Autonomous Frontier
            </span>{' '}
            Workloads.
          </h2>

          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl font-normal leading-relaxed">
            Every layer has been systematically redesigned: from Shannon entropy secret scanners to zero-overhead neural KV-caching.
          </p>
        </div>

        {/* 3-Column Dynamic Asymmetric Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
          {/* Card 1: 2-Column Span - Autonomous Reasoning Graph */}
          <div className="md:col-span-2 group relative rounded-3xl p-6 sm:p-8 bg-[#09090b]/80 backdrop-blur-xl border border-white/[0.08] hover:border-indigo-500/50 transition-all duration-300 shadow-xl overflow-hidden hover:shadow-[0_0_50px_-15px_rgba(79,70,229,0.3)]">
            {/* Ambient inner glow */}
            <div className="absolute -right-20 -top-20 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/20 transition-colors" />

            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-transform duration-300">
                  <Brain className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-mono text-purple-400 uppercase tracking-wider font-semibold">
                    100k Steps CoT
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Autonomous Multi-Step Reasoning
                  </h3>
                </div>
              </div>
              <span className="text-xs font-mono text-zinc-500 px-2.5 py-1 rounded-full bg-zinc-900 border border-white/5">
                Dynamic Graph
              </span>
            </div>

            <p className="text-sm text-zinc-400 max-w-xl mb-6 leading-relaxed">
              Expands user intentions into a self-verifying tree of thoughts. Automatically detects syntax pitfalls, cross-references dependencies, and executes boundary tests before finalizing token output.
            </p>

            {/* Interactive Visual Graph Nodes */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-2">
              {[
                { step: '01', title: 'Intent Split', status: 'Decomposed 4 ASTs', active: true },
                { step: '02', title: 'Deep Retrieval', status: '1.05M Context Hit', active: true },
                { step: '03', title: 'Boundary Test', status: 'Passed 48 Assertions', active: true },
                { step: '04', title: 'Token Polish', status: 'Sub-15ms Emit', active: true },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-zinc-950/60 border border-white/[0.06] group-hover:border-white/[0.12] transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-indigo-400 font-bold">{item.step}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <div className="text-xs font-semibold text-zinc-200">{item.title}</div>
                  <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{item.status}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: 1-Column Span - Zero Token Leak Sandbox */}
          <div className="group relative rounded-3xl p-6 sm:p-8 bg-[#09090b]/80 backdrop-blur-xl border border-white/[0.08] hover:border-purple-500/50 transition-all duration-300 shadow-xl overflow-hidden hover:shadow-[0_0_50px_-15px_rgba(192,132,252,0.3)] flex flex-col justify-between">
            <div className="absolute -left-12 -top-12 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-500/20 transition-colors" />

            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:scale-110 transition-transform duration-300">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  SECURE
                </span>
              </div>

              <span className="text-[11px] font-mono text-purple-400 uppercase tracking-wider font-semibold">
                Privacy Enforcement
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight mt-1 mb-2">
                Zero Token Leak
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Hardware-isolated entropy filters intercept API secrets, Discord bot tokens, and SSH keys before they touch frontier models or git commits.
              </p>
            </div>

            {/* Live Security Micro-Panel */}
            <div className="mt-6 p-3 rounded-2xl bg-zinc-950/80 border border-white/[0.06] font-mono text-xs">
              <div className="flex items-center justify-between text-zinc-400 mb-1.5 text-[11px]">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Lock className="w-3 h-3" /> Shannon Scan
                </span>
                <span className="text-[10px] text-zinc-500">AES-256 GCM</span>
              </div>
              <div className="text-[11px] text-zinc-300 bg-black/60 p-2 rounded-lg border border-white/[0.04]">
                <span className="text-emerald-400">PASSED:</span> 0 leaks found across .env and runtime memory buffers.
              </div>
            </div>
          </div>

          {/* Card 3: 1-Column Span - Sub-20ms Global Edge Mesh */}
          <div className="group relative rounded-3xl p-6 sm:p-8 bg-[#09090b]/80 backdrop-blur-xl border border-white/[0.08] hover:border-indigo-500/50 transition-all duration-300 shadow-xl overflow-hidden hover:shadow-[0_0_50px_-15px_rgba(79,70,229,0.3)] flex flex-col justify-between">
            <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/20 transition-colors" />

            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-transform duration-300">
                  <Globe2 className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                  34 PoPs
                </span>
              </div>

              <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-wider font-semibold">
                Edge Convergence
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight mt-1 mb-2">
                Sub-20ms Global Mesh
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Smart anycast routing directs each reasoning request to the closest bare-metal accelerator node with zero cold starts.
              </p>
            </div>

            {/* Interactive Region Ping Selector */}
            <div className="mt-6 space-y-1.5 font-mono text-xs">
              {Object.entries(regions).map(([key, reg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedRegion(key)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl transition-all text-left cursor-pointer ${
                    selectedRegion === key
                      ? 'bg-indigo-950/40 border border-indigo-500/40 text-white'
                      : 'bg-zinc-950/50 border border-white/[0.04] text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span className="text-[11px] truncate max-w-[130px]">{reg.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-emerald-400 font-bold">{reg.ping}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Card 4: 2-Column Span - Native PyTorch & Discord.js Adapters */}
          <div className="md:col-span-2 group relative rounded-3xl p-6 sm:p-8 bg-[#09090b]/80 backdrop-blur-xl border border-white/[0.08] hover:border-purple-500/50 transition-all duration-300 shadow-xl overflow-hidden hover:shadow-[0_0_50px_-15px_rgba(192,132,252,0.3)]">
            <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-500/20 transition-colors" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:scale-110 transition-transform duration-300">
                  <Code2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-mono text-purple-400 uppercase tracking-wider font-semibold">
                    Full Code Synthesizer
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Discord Bot Hub &amp; PyTorch Exporter
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-xs font-mono text-zinc-300 hover:text-white hover:border-purple-500/50 transition-all cursor-pointer w-fit"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied Snippet' : 'Copy PyTorch Code'}</span>
              </button>
            </div>

            <p className="text-sm text-zinc-400 max-w-xl mb-4 leading-relaxed">
              Export production-ready Discord.js slash-command bots with automatic ephemeral replies, or scaffold complete PyTorch neural networks with RoPE and SwiGLU layers in one click.
            </p>

            {/* Code Snippet Box */}
            <div className="rounded-2xl bg-black/70 border border-white/[0.06] p-3.5 font-mono text-xs overflow-x-auto text-zinc-300 leading-relaxed">
              <div className="text-zinc-500 text-[10px] pb-1 mb-1 border-b border-white/[0.04] flex items-center justify-between">
                <span>andromeda_scaffold.py</span>
                <span className="text-purple-400">RoPE • SwiGLU • FlashAttention</span>
              </div>
              <pre className="text-[11px]">
                <span className="text-purple-400">class</span> <span className="text-yellow-300">SwiGLU</span>(nn.Module):{'\n'}
                {'    '}<span className="text-purple-400">def</span> <span className="text-blue-300">forward</span>(self, x): <span className="text-purple-400">return</span> self.w2(F.silu(self.w1(x)) * self.w3(x)){'\n'}
                <span className="text-emerald-400"># Model initialized with zero token leakage guarantee</span>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
