import React, { useState, useRef } from 'react';
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
  Video,
  Upload,
  Cpu,
  Layers,
  Zap,
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

const IMAGE_ENGINES = [
  { id: 'imagen', name: 'Google Imagen 3 / Gemini Image', badge: 'Ultra HD', desc: 'Frontier high-resolution generative rendering' },
  { id: 'flux', name: 'Flux.1 High-Res Neural Diffusion', badge: 'Fast & Rich', desc: 'Direct neural synthesis' },
];

const VIDEO_ENGINES = [
  { id: 'neural', name: 'Andromeda Neural Motion (Cinematic)', badge: 'Instant Render', desc: 'High dynamic motion synthesis' },
  { id: 'veo', name: 'Google Veo Cinema (Pro)', badge: 'Google Veo', desc: 'Requires Veo access' },
];

export const ImageCreationModal: React.FC<ImageCreationModalProps> = ({
  isOpen,
  onClose,
  onSendToChat,
}) => {
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [style, setStyle] = useState('photorealistic');
  const [selectedImageEngine, setSelectedImageEngine] = useState('imagen');
  const [selectedVideoEngine, setSelectedVideoEngine] = useState('neural');

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Video State
  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoAspectRatio, setVideoAspectRatio] = useState('16:9');
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoSourceImage, setVideoSourceImage] = useState<string | null>(null);
  const [videoSourceImageName, setVideoSourceImageName] = useState<string | null>(null);
  const [generatedVideos, setGeneratedVideos] = useState<any[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);

  const videoFileInputRef = useRef<HTMLInputElement>(null);

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
          engine: selectedImageEngine,
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

  const handleGenerateVideo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!videoPrompt.trim() || isGeneratingVideo) return;

    setIsGeneratingVideo(true);
    try {
      const res = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: videoPrompt.trim(),
          base64Image: videoSourceImage || undefined,
          aspectRatio: videoAspectRatio,
          engine: selectedVideoEngine,
        }),
      });

      const data = await res.json();
      if (data.success && data.video) {
        setGeneratedVideos((prev) => [data.video, ...prev]);
        setSelectedVideo(data.video);
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err: any) {
      console.error('Video generation error:', err);
      alert('Video generation failed. Please check network connection.');
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleVideoImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setVideoSourceImage(reader.result as string);
      setVideoSourceImageName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleUseGeneratedImageForVideo = () => {
    if (selectedImage) {
      setVideoSourceImage(selectedImage.url);
      setVideoSourceImageName(`Andromeda-Canvas-${selectedImage.id}.png`);
      setActiveTab('video');
    }
  };

  const handleDownload = (img: GeneratedImage) => {
    const link = document.createElement('a');
    link.href = img.url;
    link.download = `andromeda-${img.id}.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadVideo = (vid: any) => {
    const link = document.createElement('a');
    link.href = vid.url;
    link.download = `andromeda-media-${vid.id}.mp4`;
    link.target = '_blank';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92dvh] bg-[#0d1117] border border-amber-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-[#0a0e14]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-600 to-indigo-600 text-white flex items-center justify-center shadow-lg">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white font-display">
                  Andromeda Creative Media Engine
                </h2>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Multi-Modal Neural
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Generate high-resolution photos and animated video motions (Open Neural & Google Veo supported)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-4 sm:px-6 pt-3 flex border-b border-slate-800 gap-4 bg-[#0a0e14]/60">
          <button
            onClick={() => setActiveTab('image')}
            className={`pb-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'image'
                ? 'border-amber-500 text-amber-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Creative Photo Studio</span>
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`pb-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'video'
                ? 'border-amber-500 text-amber-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Motion Video Generator</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* TAB 1: IMAGE STUDIO */}
          {activeTab === 'image' ? (
            <>
              <div className="md:col-span-5 space-y-4">
                <form onSubmit={handleGenerate} className="space-y-4">
                  {/* Engine Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5 font-mono">
                      <Cpu className="w-3.5 h-3.5 text-amber-400" />
                      Neural Engine
                    </label>
                    <div className="space-y-1.5">
                      {IMAGE_ENGINES.map((eng) => (
                        <button
                          key={eng.id}
                          type="button"
                          onClick={() => setSelectedImageEngine(eng.id)}
                          className={`w-full p-2 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                            selectedImageEngine === eng.id
                              ? 'bg-amber-500/15 border-amber-500/60 text-white'
                              : 'border-slate-800 bg-[#0a0e14] text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-medium text-slate-200">{eng.name}</div>
                            <div className="text-[10px] text-slate-500">{eng.desc}</div>
                          </div>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-amber-300">
                            {eng.badge}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Prompt Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                      Visual Prompt Description
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="e.g. Cybernetic quantum core floating in deep space, hyper-realistic volumetric neon lighting, 8k..."
                      rows={3}
                      className="w-full px-3.5 py-2.5 text-xs rounded-2xl bg-[#0a0e14] border border-slate-800 text-white outline-none focus:border-amber-500 resize-none leading-relaxed"
                    />
                  </div>

                  {/* Style Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
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
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                              : 'border-slate-800 bg-[#0a0e14] text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {st.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Aspect Ratio */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                      Dimensions
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {ASPECT_RATIOS.map((ar) => (
                        <button
                          key={ar.id}
                          type="button"
                          onClick={() => setAspectRatio(ar.id)}
                          className={`px-2.5 py-1.5 text-xs rounded-lg border font-mono transition-colors cursor-pointer ${
                            aspectRatio === ar.id
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                              : 'border-slate-800 bg-[#0a0e14] text-slate-400 hover:text-slate-200'
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
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold shadow-lg active:scale-98'
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                        <span>Synthesizing Photo Canvas...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Create Picture</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Preview Column */}
              <div className="md:col-span-7 flex flex-col space-y-4">
                {selectedImage ? (
                  <div className="flex-1 flex flex-col bg-[#0a0e14] rounded-2xl p-4 border border-slate-800">
                    <div className="relative flex-1 min-h-[260px] max-h-[380px] flex items-center justify-center rounded-xl overflow-hidden bg-black border border-slate-900">
                      <img
                        src={selectedImage.url}
                        alt={selectedImage.prompt}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-200 truncate">
                          {selectedImage.prompt}
                        </p>
                        <span className="text-[10px] text-amber-400 font-mono">
                          {selectedImage.aspectRatio || '1:1'} • {selectedImage.engine || 'Neural Model'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={handleUseGeneratedImageForVideo}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold border border-amber-500/30 transition-all cursor-pointer"
                          title="Animate this photo"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Animate</span>
                        </button>
                        <button
                          onClick={() => handleCopy(selectedImage)}
                          className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          title="Copy Image URL"
                        >
                          {copiedId === selectedImage.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDownload(selectedImage)}
                          className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
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
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Send to Chat</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 min-h-[280px] rounded-2xl border-2 border-dashed border-slate-800 flex flex-col items-center justify-center p-6 text-center text-slate-500">
                    <ImageIcon className="w-12 h-12 mb-3 text-slate-700" />
                    <p className="text-sm font-semibold text-slate-300 font-mono">
                      No picture generated yet
                    </p>
                    <p className="text-xs text-slate-500 max-w-xs mt-1">
                      Type your prompt on the left and click "Create Picture" to synthesize high-resolution imagery.
                    </p>
                  </div>
                )}

                {/* History Strip */}
                {generatedImages.length > 1 && (
                  <div>
                    <span className="text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                      Session History
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {generatedImages.map((img) => (
                        <button
                          key={img.id}
                          onClick={() => setSelectedImage(img)}
                          className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-transform cursor-pointer ${
                            selectedImage?.id === img.id
                              ? 'border-amber-500 scale-105'
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
            </>
          ) : (
            /* TAB 2: VIDEO STUDIO */
            <>
              <div className="md:col-span-5 space-y-4">
                <form onSubmit={handleGenerateVideo} className="space-y-4">
                  {/* Video Engine Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5 font-mono">
                      <Cpu className="w-3.5 h-3.5 text-amber-400" />
                      Motion Generator Engine
                    </label>
                    <div className="space-y-1.5">
                      {VIDEO_ENGINES.map((eng) => (
                        <button
                          key={eng.id}
                          type="button"
                          onClick={() => setSelectedVideoEngine(eng.id)}
                          className={`w-full p-2 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                            selectedVideoEngine === eng.id
                              ? 'bg-amber-500/15 border-amber-500/60 text-white'
                              : 'border-slate-800 bg-[#0a0e14] text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-medium text-slate-200">{eng.name}</div>
                            <div className="text-[10px] text-slate-500">{eng.desc}</div>
                          </div>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-amber-300">
                            {eng.badge}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Video Prompt */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                      Describe Scene & Motion
                    </label>
                    <textarea
                      value={videoPrompt}
                      onChange={(e) => setVideoPrompt(e.target.value)}
                      placeholder="e.g. Glowing neon hypercar accelerating down a rainy Tokyo expressway at night, dynamic camera motion..."
                      rows={3}
                      className="w-full px-3.5 py-2.5 text-xs rounded-2xl bg-[#0a0e14] border border-slate-800 text-white outline-none focus:border-amber-500 resize-none leading-relaxed"
                    />
                  </div>

                  {/* Image Source */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                      Initial Frame (Optional Image-to-Video)
                    </label>

                    {videoSourceImage ? (
                      <div className="p-3 bg-[#0a0e14] rounded-2xl border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={videoSourceImage}
                            alt="source"
                            className="w-10 h-10 rounded-lg object-cover border border-slate-800 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-white truncate max-w-[150px]">
                              {videoSourceImageName || 'Frame Selected'}
                            </p>
                            <span className="text-[10px] text-emerald-400 font-mono">Frame ready</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setVideoSourceImage(null);
                            setVideoSourceImageName(null);
                          }}
                          className="p-1 rounded-full text-slate-400 hover:text-rose-400 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="file"
                          ref={videoFileInputRef}
                          onChange={handleVideoImageUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => videoFileInputRef.current?.click()}
                          className="w-full p-3 rounded-2xl border-2 border-dashed border-slate-800 hover:border-amber-500/50 flex flex-col items-center justify-center gap-1 text-center text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                        >
                          <Upload className="w-4 h-4 text-amber-400" />
                          <span className="text-xs font-bold">Upload a photo to animate</span>
                          <span className="text-[10px] text-slate-500">Supports JPEG, PNG</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Video Aspect Ratio */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                      Aspect Ratio
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: '16:9', label: '16:9 Cinematic' },
                        { id: '9:16', label: '9:16 Portrait' },
                        { id: '1:1', label: '1:1 Square' },
                      ].map((ar) => (
                        <button
                          key={ar.id}
                          type="button"
                          onClick={() => setVideoAspectRatio(ar.id)}
                          className={`px-3 py-1.5 text-xs rounded-lg border font-mono transition-colors cursor-pointer ${
                            videoAspectRatio === ar.id
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                              : 'border-slate-800 bg-[#0a0e14] text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {ar.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Submit Video Button */}
                  <button
                    type="submit"
                    disabled={!videoPrompt.trim() || isGeneratingVideo}
                    className={`w-full py-3 px-4 rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm transition-all cursor-pointer ${
                      !videoPrompt.trim() || isGeneratingVideo
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold shadow-lg active:scale-98'
                    }`}
                  >
                    {isGeneratingVideo ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                        <span>Synthesizing Video Motion...</span>
                      </>
                    ) : (
                      <>
                        <Video className="w-4 h-4" />
                        <span>Generate Video</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Video Preview Column */}
              <div className="md:col-span-7 flex flex-col space-y-4">
                {selectedVideo ? (
                  <div className="flex-1 flex flex-col bg-[#0a0e14] rounded-2xl p-4 border border-slate-800">
                    <div className="relative flex-1 min-h-[260px] max-h-[380px] flex items-center justify-center rounded-xl overflow-hidden bg-black border border-slate-900">
                      {selectedVideo.url.endsWith('.mp4') || selectedVideo.url.startsWith('data:video') ? (
                        <video
                          src={selectedVideo.url}
                          controls
                          autoPlay
                          loop
                          playsInline
                          className="max-h-full max-w-full object-contain rounded-lg"
                        />
                      ) : (
                        <img
                          src={selectedVideo.previewUrl || selectedVideo.url}
                          alt={selectedVideo.prompt}
                          className="max-h-full max-w-full object-contain rounded-lg"
                        />
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-white truncate">
                          {selectedVideo.prompt}
                        </p>
                        <span className="text-[10px] text-amber-400 font-mono">
                          {selectedVideo.aspectRatio} • {selectedVideo.engine || 'Neural Motion'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleDownloadVideo(selectedVideo)}
                          className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          title="Download Video File"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 min-h-[280px] rounded-2xl border-2 border-dashed border-slate-800 flex flex-col items-center justify-center p-6 text-center text-slate-500">
                    <Video className="w-12 h-12 mb-3 text-slate-700" />
                    <p className="text-sm font-semibold text-slate-300 font-mono">
                      No video rendered yet
                    </p>
                    <p className="text-xs text-slate-500 max-w-xs mt-1">
                      Type your motion instructions, optionally upload a photo as the initial frame, and click "Generate Video".
                    </p>
                  </div>
                )}

                {/* Video History Strip */}
                {generatedVideos.length > 1 && (
                  <div>
                    <span className="text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                      Video History
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {generatedVideos.map((vid) => (
                        <button
                          key={vid.id}
                          onClick={() => setSelectedVideo(vid)}
                          className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-transform cursor-pointer bg-black flex items-center justify-center ${
                            selectedVideo?.id === vid.id
                              ? 'border-amber-500 scale-105'
                              : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                        >
                          <Video className="w-6 h-6 text-amber-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
