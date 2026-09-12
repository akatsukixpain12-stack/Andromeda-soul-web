import React, { useState } from 'react';
import {
  X,
  Brain,
  Code2,
  Cpu,
  Layers,
  Sparkles,
  Download,
  Copy,
  Check,
  Zap,
  ArrowRight,
  GitBranch,
} from 'lucide-react';
import { PYTORCH_MODEL_CODE } from '../../server/presets';
import JSZip from 'jszip';

interface PyTorchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAppFactory?: (presetId?: string) => void;
}

export const PyTorchModal: React.FC<PyTorchModalProps> = ({
  isOpen,
  onClose,
  onOpenAppFactory,
}) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'code'>('architecture');
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(PYTORCH_MODEL_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadZip = async () => {
    const zip = new JSZip();
    zip.file('andromeda_soul_core.py', PYTORCH_MODEL_CODE);
    zip.file(
      'train.py',
      `import torch
import torch.nn as nn
from andromeda_soul_core import AndromedaSoul1, ModelArgs

def train():
    args = ModelArgs(dim=2048, n_layers=16, n_heads=16, n_kv_heads=4, vocab_size=32000)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"[Andromeda Soul 1] Training initialized on {device}...")
    model = AndromedaSoul1(args).to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=3e-4, weight_decay=0.1)
    
    # Synthetic batch demo
    x = torch.randint(0, args.vocab_size, (2, 512), device=device)
    y = torch.randint(0, args.vocab_size, (2, 512), device=device)
    
    logits = model(x)
    loss = nn.functional.cross_entropy(logits.view(-1, args.vocab_size), y.view(-1))
    loss.backward()
    optimizer.step()
    print(f"Initial Step Loss: {loss.item():.4f}")

if __name__ == "__main__":
    train()
`
    );
    zip.file(
      'requirements.txt',
      `torch>=2.2.0\ntorchvision\ntransformer-engine\neinops\nnumpy\naccelerate\n`
    );
    zip.file(
      'README.md',
      `# Andromeda Soul 1 — PyTorch Neural Transformer Architecture

Built-in sovereign intelligence with uncapped reasoning, RoPE rotary embeddings, Grouped-Query Attention (GQA), and SwiGLU activations.

## Quick Start
\`\`\`bash
pip install -r requirements.txt
python train.py
\`\`\`
`
    );

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'andromeda-soul-pytorch-core.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-violet-600 via-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Andromeda Soul 1 (PyTorch Core)
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                  Neural Architecture
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sovereign Deep Neural Transformer with uncapped 100,000x reasoning & GQA attention
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tabs */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('architecture')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'architecture'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Architecture
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'code'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                PyTorch Source
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'architecture' ? (
            <div className="space-y-6">
              {/* Architecture Blueprint Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                  <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center mb-3">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                    Rotary Embeddings (RoPE)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Applies continuous complex frequency rotations directly to query and key states, preserving relative geometric distance across 128,000+ token context windows.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-3">
                    <Zap className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                    Grouped-Query Attention (GQA)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Pairs 32 query heads with 8 key-value heads. Reduces KV cache memory footprints by 4x while sustaining state-of-the-art multi-head attention fidelity.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                  <div className="w-8 h-8 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center mb-3">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                    SwiGLU Activation Gate
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Replaces legacy ReLU/GELU with element-wise gated bilinear Swish units, maximizing gradient propagation stability through 32 deep transformer layers.
                  </p>
                </div>
              </div>

              {/* Specification Table */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-4 py-3 bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                  Hyperparameter & Model Dimensions
                </div>
                <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                  <div className="grid grid-cols-2 px-4 py-2.5">
                    <span className="text-slate-500">Hidden Dimension (d_model)</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">4,096</span>
                  </div>
                  <div className="grid grid-cols-2 px-4 py-2.5">
                    <span className="text-slate-500">Transformer Layers (n_layers)</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">32</span>
                  </div>
                  <div className="grid grid-cols-2 px-4 py-2.5">
                    <span className="text-slate-500">Attention Heads (Query / KV)</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">32 Query / 8 KV (GQA 4:1)</span>
                  </div>
                  <div className="grid grid-cols-2 px-4 py-2.5">
                    <span className="text-slate-500">Vocabulary Size</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">32,000 (Byte-Pair Encoding)</span>
                  </div>
                  <div className="grid grid-cols-2 px-4 py-2.5">
                    <span className="text-slate-500">Max Sequence Context</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">131,072 tokens (128k)</span>
                  </div>
                  <div className="grid grid-cols-2 px-4 py-2.5">
                    <span className="text-slate-500">Reasoning Depth</span>
                    <span className="font-mono font-semibold text-violet-600 dark:text-violet-400">100,000x Uncapped (/think100000times)</span>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handleDownloadZip}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PyTorch Project (ZIP)</span>
                </button>

                {onOpenAppFactory && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAppFactory('pytorch-andromeda');
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors shadow-md cursor-pointer"
                  >
                    <span>Deploy PyTorch Project to GitHub</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">andromeda_soul_core.py (PyTorch 2.x)</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                  </button>
                  <button
                    onClick={handleDownloadZip}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-medium text-white transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download ZIP</span>
                  </button>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 overflow-x-auto">
                <pre className="font-mono text-xs text-slate-200 leading-relaxed select-text">
                  {PYTORCH_MODEL_CODE}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
