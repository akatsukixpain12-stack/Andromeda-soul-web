import React, { useState } from 'react';
import { Sparkles, Zap, TrendingUp, Cpu, Check, Shield } from 'lucide-react';

export const BenchmarkSection: React.FC = () => {
  const [selectedMetric, setSelectedMetric] = useState<'latency' | 'throughput' | 'context'>('latency');

  const benchmarks = [
    {
      label: 'Time-to-First-Token (TTFT)',
      andromeda: '14.2 ms',
      andromedaScore: 98,
      competitor1: '380 ms',
      competitor1Score: 35,
      gpt4o: '420 ms',
      gptScore: 30,
      note: 'Ultra-low latency edge compilation',
    },
    {
      label: 'Sustained Throughput',
      andromeda: '148.4 tok/s',
      andromedaScore: 94,
      competitor1: '72.0 tok/s',
      competitor1Score: 48,
      gpt4o: '68.5 tok/s',
      gptScore: 44,
      note: 'KV-cache streaming optimization',
    },
    {
      label: 'Context Retention (1M Tokens)',
      andromeda: '99.8% Needle',
      andromedaScore: 99,
      competitor1: '92.4% Needle',
      competitor1Score: 82,
      gpt4o: '88.1% Needle',
      gptScore: 78,
      note: 'Zero needle-in-a-haystack decay',
    },
    {
      label: 'Token Leakage Prevention',
      andromeda: '100% Guarded',
      andromedaScore: 100,
      competitor1: 'Unmonitored',
      competitor1Score: 15,
      gpt4o: 'Unmonitored',
      gptScore: 15,
      note: 'Hardware isolated entropy scanner',
    },
  ];

  return (
    <section id="benchmarks" className="relative py-20 sm:py-28 bg-[#09090b] border-t border-white/[0.06] overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-t from-indigo-950/20 via-purple-950/20 to-transparent rounded-full blur-[140px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-white/10 text-xs font-mono text-purple-400 mb-4 shadow-xs">
            <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
            <span>EMPIRICAL BENCHMARKS</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-display text-white mb-4">
            Unrivaled Speed.{' '}
            <span className="bg-gradient-to-r from-white via-indigo-200 to-purple-400 bg-clip-text text-transparent">
              Zero Compromise.
            </span>
          </h2>

          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl font-normal leading-relaxed">
            Benchmarked against industry standards across distributed cloud clusters. Andromeda consistently outpaces legacy token pipelines.
          </p>
        </div>

        {/* Benchmark Table / Cards */}
        <div className="max-w-4xl mx-auto space-y-4">
          {benchmarks.map((item, idx) => (
            <div
              key={idx}
              className="p-5 sm:p-6 rounded-2xl bg-[#09090b]/90 backdrop-blur-xl border border-white/[0.08] hover:border-indigo-500/40 transition-all duration-300 shadow-lg"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-semibold text-white font-display">
                    {item.label}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-white/5">
                    {item.note}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-indigo-400 font-bold">
                    Andromeda: {item.andromeda}
                  </span>
                </div>
              </div>

              {/* Visual Relative Progress Bars */}
              <div className="space-y-2 pt-1 font-mono text-[11px]">
                {/* Andromeda */}
                <div className="flex items-center gap-3">
                  <span className="w-24 text-zinc-300 font-bold truncate">Andromeda 3.8</span>
                  <div className="flex-1 h-3 rounded-full bg-zinc-900 overflow-hidden p-0.5 border border-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-purple-400 transition-all duration-1000 shadow-[0_0_12px_rgba(79,70,229,0.8)]"
                      style={{ width: `${item.andromedaScore}%` }}
                    />
                  </div>
                  <span className="w-20 text-right text-indigo-300 font-bold">{item.andromeda}</span>
                </div>

                {/* Standard Model 2 */}
                <div className="flex items-center gap-3 opacity-60">
                  <span className="w-24 text-zinc-400 truncate">Standard Sonnet</span>
                  <div className="flex-1 h-2 rounded-full bg-zinc-900 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-zinc-600 transition-all duration-1000"
                      style={{ width: `${item.competitor1Score}%` }}
                    />
                  </div>
                  <span className="w-20 text-right text-zinc-500">{item.competitor1}</span>
                </div>

                {/* GPT-4o */}
                <div className="flex items-center gap-3 opacity-60">
                  <span className="w-24 text-zinc-400 truncate">GPT-4o</span>
                  <div className="flex-1 h-2 rounded-full bg-zinc-900 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-zinc-600 transition-all duration-1000"
                      style={{ width: `${item.gptScore}%` }}
                    />
                  </div>
                  <span className="w-20 text-right text-zinc-500">{item.gpt4o}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
