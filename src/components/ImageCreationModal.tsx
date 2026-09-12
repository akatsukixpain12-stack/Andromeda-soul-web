import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Download,
  Copy,
  Check,
  Send,
  Image as ImageIcon,
  Wand2,
  RefreshCw,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { GeneratedImage } from '../types';

interface ImageCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat?: (imageUrl: string, prompt: string) => void;
}

const PRESET_STYLES = [
  { id: 'photorealistic', name: 'Photorealistic' },
  { id: 'digital-art', name: 'Digital Art' },
  { id: 'cyberpunk', name: 'Cyberpunk' },
  { id: '3d-render', name: '3D Render' },
  { id: 'anime', name: 'Anime Studio' },
  { id: 'minimalist', name: 'Minimalist Vector' },
];

const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1 Square' },
  { id: '16:9', label: '16:9 Landscape' },
  { id: '4:3', label: '4:3 Classic' },
  { id: '9:16', label: '9:16 Portrait' },
  { id: '3:4', label: '3:4 Tall' },
];

export const ImageCreationModal: React.FC<ImageCreationModalProps> = ({
  isOpen,
  onClose,
  onSendToChat,
}) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [style, setStyle] = useState('photorealistic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const res = await fetch('/api/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          aspectRatio,
          style,
        }),
      });

      const data = await res.json();
      if (data.success && data.image) {
        setGeneratedImages((prev) => [data.image, ...prev]);
        setSelectedImage(data.image);
      }
    } catch (err) {
      console.error('Image generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (img: GeneratedImage) => {
    const link = document.createElement('a');
    link.href = img.url;
    link.download = `andromeda-${img.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = (img: GeneratedImage) => {
    navigator.clipboard.writeText(img.url);
    setCopiedId(img.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-pink-500 via-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Andromeda Creative Picture Studio
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  PyTorch Generative Canvas
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Transform any prompt or concept into high-resolution visuals and mockups
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Controls Column (Left) */}
          <div className="md:col-span-5 space-y-4">
            <form onSubmit={handleGenerate} className="space-y-4">
              {/* Prompt Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Describe what you want to create
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Futuristic neural network core glowing inside a sleek cyberpunk workstation, vibrant purple and cyan lighting, hyperdetailed..."
                  rows={4}
                  className="w-full px-3.5 py-2.5 text-xs rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden focus:border-purple-500 resize-none leading-relaxed"
                />
              </div>

              {/* Style Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Visual Archetype
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {PRESET_STYLES.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setStyle(st.id)}
                      className={`px-3 py-2 text-xs rounded-xl border text-left font-medium transition-colors cursor-pointer ${
                        style === st.id
                          ? 'bg-purple-500/15 border-purple-500 text-purple-700 dark:text-purple-300'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {st.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Aspect Ratio
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ASPECT_RATIOS.map((ar) => (
                    <button
                      key={ar.id}
                      type="button"
                      onClick={() => setAspectRatio(ar.id)}
                      className={`px-2.5 py-1.5 text-xs rounded-lg border font-medium transition-colors cursor-pointer ${
                        aspectRatio === ar.id
                          ? 'bg-purple-500/15 border-purple-500 text-purple-700 dark:text-purple-300'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {ar.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                type="submit"
                disabled={!prompt.trim() || isGenerating}
                className={`w-full py-3 px-4 rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm transition-all cursor-pointer ${
                  !prompt.trim() || isGenerating
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    : 'bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md hover:scale-[1.01] active:scale-[0.99]'
                }`}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Synthesizing Canvas...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Create Picture</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Prompt Ideas */}
            <div className="pt-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Quick Inspiration
              </span>
              <div className="space-y-1.5">
                {[
                  'A majestic Andromeda galaxy portal swirling with violet neon stardust and quantum rings',
                  'Discord Bot mascot with glowing cybernetic visor and emerald power core',
                  'High-tech PyTorch tensor computational graph rendered as a floating holographic crystal',
                ].map((idea, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(idea)}
                    className="w-full text-left p-2 rounded-xl text-[11px] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                  >
                    "{idea}"
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview & Gallery Column (Right) */}
          <div className="md:col-span-7 flex flex-col space-y-4">
            {selectedImage ? (
              <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-850 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
                <div className="relative flex-1 min-h-[280px] max-h-[380px] flex items-center justify-center rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                  <img
                    src={selectedImage.url}
                    alt={selectedImage.prompt}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {selectedImage.prompt}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      Ratio: {selectedImage.aspectRatio || '1:1'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleCopy(selectedImage)}
                      className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                      title="Copy Image URL / Data"
                    >
                      {copiedId === selectedImage.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDownload(selectedImage)}
                      className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                      title="Download Image"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    {onSendToChat && (
                      <button
                        onClick={() => {
                          onSendToChat(selectedImage.url, selectedImage.prompt);
                          onClose();
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send to Chat</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 min-h-[300px] rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-6 text-center text-slate-400">
                <ImageIcon className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-700" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  No picture generated yet
                </p>
                <p className="text-xs text-slate-400 max-w-xs mt-1">
                  Type your prompt on the left and click "Create Picture" to generate high-resolution imagery.
                </p>
              </div>
            )}

            {/* Gallery Strip */}
            {generatedImages.length > 1 && (
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Session History
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {generatedImages.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImage(img)}
                      className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-transform cursor-pointer ${
                        selectedImage?.id === img.id
                          ? 'border-purple-500 scale-105'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
