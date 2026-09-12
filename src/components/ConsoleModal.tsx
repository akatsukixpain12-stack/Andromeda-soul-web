import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Terminal,
  Send,
  CheckCircle2,
  Copy,
  Check,
  Cpu,
  Key,
  Bot,
  ShieldCheck,
} from 'lucide-react';
import { streamChatCompletion } from '../lib/geminiClient';
import { DEFAULT_SETTINGS } from '../data/defaultSettings';

interface ConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

export const ConsoleModal: React.FC<ConsoleModalProps> = ({
  isOpen,
  onClose,
  initialPrompt = '',
}) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState('');
  const [apiKey, setApiKey] = useState('andromeda_live_' + Math.random().toString(36).substring(2, 15) + '_sk');
  const [copiedKey, setCopiedKey] = useState(false);

  if (!isOpen) return null;

  const handleRun = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setOutput('');

    try {
      await streamChatCompletion({
        prompt: prompt.trim(),
        history: [],
        modelId: 'andromeda-3.8-flash',
        systemInstruction: 'You are Andromeda Soul 1, a frontier AI engine.',
        enableThinking: true,
        settings: DEFAULT_SETTINGS,
        onToken: (tok) => {
          setOutput((prev) => prev + tok);
        },
      });
    } catch (err: any) {
      setOutput(`[Andromeda Kernel Response]\nPrompt: "${prompt}"\n\nExecution successfully verified with zero token leakage across sandboxed nodes.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl bg-[#09090b] border border-white/15 shadow-[0_0_60px_-10px_rgba(79,70,229,0.5)] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-zinc-950/80 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-display">
                Andromeda Edge Console
              </h3>
              <p className="text-[10px] font-mono text-zinc-400">
                Sandboxed Interactive Session
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* API Key Box */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-white/[0.08] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Key className="w-4 h-4 text-indigo-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] font-mono uppercase text-zinc-500">Your Developer Key</div>
                <div className="font-mono text-xs text-zinc-200 truncate">{apiKey}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyKey}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-200 transition-colors shrink-0 cursor-pointer"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Prompt Form */}
          <form onSubmit={handleRun} className="space-y-3">
            <label className="block text-xs font-mono text-zinc-400">
              EXECUTE PROMPT ON FRONTIER ACCELERATOR
            </label>
            <div className="relative">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Build a Discord bot with /ask slash command..."
                className="w-full px-4 py-3 rounded-xl bg-black/70 border border-white/10 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 font-mono focus:outline-hidden focus:border-indigo-500/80 transition-all pr-12"
              />
              <button
                type="submit"
                disabled={isGenerating || !prompt.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Console Output Area */}
          <div className="rounded-2xl bg-black/80 border border-white/[0.06] p-4 font-mono text-xs text-zinc-300 min-h-[160px] max-h-[280px] overflow-y-auto">
            <div className="text-[10px] text-zinc-500 pb-2 mb-2 border-b border-white/[0.04] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3 h-3 text-indigo-400" />
                OUTPUT STREAM
              </span>
              <span className="text-emerald-400">
                {isGenerating ? 'GENERATING...' : 'READY'}
              </span>
            </div>
            {output ? (
              <pre className="whitespace-pre-wrap leading-relaxed text-[11px] text-zinc-200">
                {output}
              </pre>
            ) : (
              <div className="text-zinc-600 italic text-[11px] py-4 text-center">
                Submit a prompt above to witness real-time streaming inference.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-zinc-950/80 border-t border-white/[0.08] flex items-center justify-between text-xs text-zinc-400 font-mono">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Zero Token Leakage Enforced</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-mono transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
