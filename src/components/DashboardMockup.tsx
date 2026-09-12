import React, { useState, useEffect } from 'react';
import {
  Activity,
  Zap,
  ShieldCheck,
  Cpu,
  Terminal,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const DashboardMockup: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'trace' | 'metrics' | 'stream'>('trace');
  const [isSimulating, setIsSimulating] = useState(true);
  const [activeStep, setActiveStep] = useState(2);
  const [tokensCount, setTokensCount] = useState(842);

  // Auto-increment live tokens to give a real-time heartbeat feeling
  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      setTokensCount((prev) => prev + Math.floor(Math.random() * 8 + 3));
    }, 400);
    return () => clearInterval(interval);
  }, [isSimulating]);

  // Subtle step progression loop for reasoning trace
  useEffect(() => {
    if (!isSimulating) return;
    const stepInterval = setInterval(() => {
      setActiveStep((prev) => (prev % 4) + 1);
    }, 2800);
    return () => clearInterval(stepInterval);
  }, [isSimulating]);

  const reasoningSteps = [
    {
      num: 1,
      title: 'Graph Decomposition & AST Parse',
      detail: 'Extracted 14 sub-intents across 28 workspace files in 2.1ms',
      status: 'complete',
      badge: 'AST 0.8ms',
    },
    {
      num: 2,
      title: 'Neural Cross-Attention & Memory Lookup',
      detail: 'Queried 1.05M tokens KV-cache with zero attention degradation',
      status: activeStep >= 2 ? 'complete' : 'pending',
      badge: '142 GB/s',
    },
    {
      num: 3,
      title: 'Zero-Token-Leak Sandboxed Execution',
      detail: 'Shannon entropy scan verified. 0 private credentials exposed',
      status: activeStep >= 3 ? 'active' : 'pending',
      badge: 'Protected',
    },
    {
      num: 4,
      title: 'Self-Correction Verification Loop',
      detail: 'Unit tests passed with 100% boundary assertion parity',
      status: activeStep >= 4 ? 'complete' : 'pending',
      badge: 'Optimal',
    },
  ];

  return (
    <div className="relative w-full max-w-2xl mx-auto lg:max-w-none">
      {/* Ambient background glow behind the dashboard */}
      <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-indigo-500/20 rounded-3xl blur-2xl opacity-75 pointer-events-none" />

      {/* Main Glass Dashboard Card */}
      <div className="relative rounded-2xl bg-[#09090b]/90 backdrop-blur-2xl border border-white/[0.1] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden">
        {/* Top Window Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-black/40 border-b border-white/[0.06]">
          {/* macOS window control dots */}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/70 border border-red-400/30 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70 border border-amber-400/30 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70 border border-emerald-400/30 inline-block" />
            <span className="ml-2 text-[11px] font-mono text-zinc-500 hidden sm:inline-block">
              andromeda-kernel://v3.8-edge
            </span>
          </div>

          {/* Interactive view tabs */}
          <div className="flex items-center bg-zinc-900/80 p-0.5 rounded-lg border border-white/[0.06]">
            <button
              type="button"
              onClick={() => setActiveTab('trace')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                activeTab === 'trace'
                  ? 'bg-indigo-600/90 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Reasoning Trace
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('metrics')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                activeTab === 'metrics'
                  ? 'bg-indigo-600/90 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Telemetry Chart
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('stream')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                activeTab === 'stream'
                  ? 'bg-indigo-600/90 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Token Stream
            </button>
          </div>

          {/* Live heartbeat indicator */}
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider hidden sm:inline-block">
              LIVE
            </span>
          </div>
        </div>

        {/* Top Metric Strip */}
        <div className="grid grid-cols-3 divide-x divide-white/[0.06] border-b border-white/[0.06] bg-zinc-950/40">
          <div className="p-3 sm:p-4 flex flex-col">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              TTFT Latency
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-bold font-mono text-white tracking-tight">
                14.2<span className="text-xs text-zinc-400 font-normal ml-0.5">ms</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-semibold">-42% vs p90</span>
            </div>
          </div>

          <div className="p-3 sm:p-4 flex flex-col">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 flex items-center gap-1">
              <Activity className="w-3 h-3 text-indigo-400" />
              Throughput
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-bold font-mono text-white tracking-tight">
                148.4<span className="text-xs text-zinc-400 font-normal ml-0.5">tok/s</span>
              </span>
              <span className="text-[10px] text-indigo-400 font-mono font-semibold">Peak 192</span>
            </div>
          </div>

          <div className="p-3 sm:p-4 flex flex-col">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-purple-400" />
              Zero Token Leak
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-bold font-mono text-emerald-400 tracking-tight">
                100%
              </span>
              <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline-block">AES-256 Guard</span>
            </div>
          </div>
        </div>

        {/* Tab 1: Reasoning Trace View */}
        {activeTab === 'trace' && (
          <div className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span className="font-mono text-[11px] text-zinc-500">AUTONOMOUS REASONING GRAPH</span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-indigo-400">Tokens: {tokensCount}</span>
                <button
                  type="button"
                  onClick={() => setIsSimulating(!isSimulating)}
                  className="p-1 rounded bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  title="Toggle simulation"
                >
                  {isSimulating ? <RotateCcw className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {reasoningSteps.map((step) => {
                const isCurrent = activeStep === step.num;
                const isDone = activeStep > step.num;

                return (
                  <div
                    key={step.num}
                    className={`p-3 rounded-xl border transition-all duration-300 ${
                      isCurrent
                        ? 'bg-indigo-950/20 border-indigo-500/40 shadow-xs shadow-indigo-500/10'
                        : isDone
                        ? 'bg-zinc-900/40 border-white/[0.04]'
                        : 'bg-zinc-950/30 border-white/[0.02] opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                            isDone
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : isCurrent
                              ? 'bg-indigo-500 text-white animate-pulse'
                              : 'bg-zinc-800 text-zinc-500'
                          }`}
                        >
                          {isDone ? <CheckCircle2 className="w-3 h-3" /> : step.num}
                        </div>
                        <span
                          className={`text-xs font-semibold ${
                            isCurrent ? 'text-indigo-200' : 'text-zinc-300'
                          }`}
                        >
                          {step.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800/80 text-zinc-400 border border-white/[0.05]">
                        {step.badge}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[11px] text-zinc-400 pl-7 leading-relaxed font-sans">
                      {step.detail}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Clean SVG Telemetry Chart View */}
        {activeTab === 'metrics' && (
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-mono text-[11px] text-zinc-400">LATENCY PROFILE OVER 24H (ms)</span>
              <div className="flex items-center gap-3 font-mono text-[10px]">
                <span className="flex items-center gap-1 text-indigo-400">
                  <span className="w-2 h-0.5 bg-indigo-500 inline-block rounded-full" /> P50 (8.1ms)
                </span>
                <span className="flex items-center gap-1 text-purple-400">
                  <span className="w-2 h-0.5 bg-purple-500 inline-block rounded-full" /> P99 (14.2ms)
                </span>
              </div>
            </div>

            {/* Custom High-Fidelity SVG Chart */}
            <div className="relative h-44 w-full pt-2">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 160">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c084fc" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#c084fc" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Subtle horizontal grid lines */}
                <line x1="0" y1="30" x2="500" y2="30" stroke="#ffffff" strokeOpacity="0.05" strokeDasharray="3 3" />
                <line x1="0" y1="70" x2="500" y2="70" stroke="#ffffff" strokeOpacity="0.05" strokeDasharray="3 3" />
                <line x1="0" y1="110" x2="500" y2="110" stroke="#ffffff" strokeOpacity="0.05" strokeDasharray="3 3" />
                <line x1="0" y1="150" x2="500" y2="150" stroke="#ffffff" strokeOpacity="0.08" />

                {/* P99 Area & Path (Purple) */}
                <path
                  d="M 0 90 Q 60 75, 120 85 T 240 60 T 360 70 T 500 50 L 500 150 L 0 150 Z"
                  fill="url(#purpleGradient)"
                />
                <path
                  d="M 0 90 Q 60 75, 120 85 T 240 60 T 360 70 T 500 50"
                  fill="none"
                  stroke="#c084fc"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                {/* P50 Area & Path (Indigo) */}
                <path
                  d="M 0 120 Q 60 110, 120 125 T 240 100 T 360 115 T 500 95 L 500 150 L 0 150 Z"
                  fill="url(#chartGradient)"
                />
                <path
                  d="M 0 120 Q 60 110, 120 125 T 240 100 T 360 115 T 500 95"
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Animated pulse point at endpoint */}
                <circle cx="500" cy="95" r="4" fill="#4f46e5" />
                <circle cx="500" cy="95" r="8" fill="#4f46e5" opacity="0.3" className="animate-ping" />
              </svg>
            </div>

            <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-zinc-500">
              <span>00:00 UTC</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span className="text-emerald-400 font-semibold">NOW (99.99% Uptime)</span>
            </div>
          </div>
        )}

        {/* Tab 3: Token Streamer Live Code Pane */}
        {activeTab === 'stream' && (
          <div className="p-4 sm:p-5 font-mono text-xs text-zinc-300 bg-black/60 space-y-2">
            <div className="flex items-center justify-between text-zinc-500 pb-2 border-b border-white/[0.06]">
              <span className="flex items-center gap-1.5 text-[11px]">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                kernel_runner.py
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Active JIT Compilation
              </span>
            </div>
            <pre className="text-[11px] leading-relaxed overflow-x-auto text-zinc-300 py-1">
              <span className="text-purple-400">from</span> andromeda.core <span className="text-purple-400">import</span> SovereignEngine{'\n'}
              <span className="text-indigo-400">engine</span> = SovereignEngine(model=<span className="text-emerald-300">"andromeda-3.8-flash"</span>){'\n'}
              {'\n'}
              <span className="text-zinc-500"># Autonomous self-healing execution pipeline</span>{'\n'}
              <span className="text-purple-400">async def</span> <span className="text-blue-300">solve_intent</span>(prompt: <span className="text-amber-300">str</span>):{'\n'}
              {'    '}result = <span className="text-purple-400">await</span> engine.reason(prompt, think_depth=<span className="text-amber-300">100_000</span>){'\n'}
              {'    '}<span className="text-purple-400">return</span> result.verified_solution{'\n'}
              {'\n'}
              <span className="text-emerald-400">&gt;&gt;&gt; Ready. Awaiting user input signal...</span>
            </pre>
          </div>
        )}

        {/* Bottom Status Footer */}
        <div className="px-4 py-2.5 bg-black/50 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-500 font-mono">
          <div className="flex items-center gap-2">
            <Lock className="w-3 h-3 text-zinc-400" />
            <span className="text-zinc-400">SOC2 Type II • Zero Retraining on User Data</span>
          </div>
          <span className="text-indigo-400">Cluster: Asia-East-1 (Primary)</span>
        </div>
      </div>
    </div>
  );
};
