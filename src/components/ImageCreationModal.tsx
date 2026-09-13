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
  Sliders,
  ExternalLink,
  Video,
  Upload,
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
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [style, setStyle] = useState('photorealistic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Video State (Veo)
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
      alert('Video generation failed. Please verify your Gemini API configuration and keys.');
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
      if (!videoPrompt) {
        setVideoPrompt(`Animate: ${selectedImage.prompt}`);
      }
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

  const handleDownloadVideo = (vid: any) => {
    const link = document.createElement('a');
    link.href = vid.url;
    link.download = `andromeda-veo-${vid.id}.mp4`;
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
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-amber-500 text-white flex items-center justify-center shadow-md">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Andromeda Creative Media Engine
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  Google Veo & PyTorch
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Generate stunning high-definition imagery and animate them into cinematic videos with Veo 3.1
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

        {/* Tab Selection */}
        <div className="px-6 pt-4 flex border-b border-slate-100 dark:border-slate-800 gap-4 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={() => setActiveTab('image')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'image'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-bold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Creative Picture Studio</span>
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'video'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-bold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Veo Video Generator (Image-to-Video)</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* TAB 1: IMAGE STUDIO CONTROLS */}
          {activeTab === 'image' ? (
            <>
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
                      className="w-full px-3.5 py-2.5 text-xs rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-purple-500 resize-none leading-relaxed"
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
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md hover:scale-[1.01] active:scale-[0.99]'
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

              {/* Preview Column */}
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
                          onClick={handleUseGeneratedImageForVideo}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold border border-amber-500/20 transition-all cursor-pointer"
                          title="Animate this image into video"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Animate (Veo)</span>
                        </button>
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
            </>
          ) : (
            /* TAB 2: VEO VIDEO CONTROLS */
            <>
              <div className="md:col-span-5 space-y-4">
                <form onSubmit={handleGenerateVideo} className="space-y-4">
                  {/* Video Prompt */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Describe the motion & scene
                    </label>
                    <textarea
                      value={videoPrompt}
                      onChange={(e) => setVideoPrompt(e.target.value)}
                      placeholder="e.g. Cherry blossom petals gently falling in a serene Japanese garden pond with soft wind ripples, cinematic 4k, natural depth..."
                      rows={4}
                      className="w-full px-3.5 py-2.5 text-xs rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-purple-500 resize-none leading-relaxed"
                    />
                  </div>

                  {/* Image Source (Animation) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Source Image to Animate (Optional Image-to-Video)
                    </label>

                    {videoSourceImage ? (
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={videoSourceImage}
                            alt="source"
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                              {videoSourceImageName || 'Custom Source Image'}
                            </p>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Source selected</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setVideoSourceImage(null);
                            setVideoSourceImageName(null);
                          }}
                          className="p-1 rounded-full text-slate-400 hover:text-rose-600 transition-colors"
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
                          className="w-full p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-purple-500/50 flex flex-col items-center justify-center gap-1.5 text-center text-slate-500 hover:text-slate-700 dark:text-slate-400 transition-all cursor-pointer"
                        >
                          <Upload className="w-5 h-5 text-purple-500" />
                          <span className="text-xs font-bold">Upload a photo to animate</span>
                          <span className="text-[10px] text-slate-400">Supports JPEG, PNG</span>
                        </button>

                        {selectedImage && (
                          <button
                            type="button"
                            onClick={() => {
                              setVideoSourceImage(selectedImage.url);
                              setVideoSourceImageName(`Andromeda-Canvas-${selectedImage.id}.png`);
                            }}
                            className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                          >
                            <ImageIcon className="w-3.5 h-3.5 text-purple-500" />
                            <span>Use selected image: {selectedImage.prompt.slice(0, 20)}...</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Video Aspect Ratio */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Video Dimensions
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: '16:9', label: '16:9 Cinematic' },
                        { id: '9:16', label: '9:16 TikTok/Shorts' },
                        { id: '1:1', label: '1:1 Square' },
                      ].map((ar) => (
                        <button
                          key={ar.id}
                          type="button"
                          onClick={() => setVideoAspectRatio(ar.id)}
                          className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors cursor-pointer ${
                            videoAspectRatio === ar.id
                              ? 'bg-purple-500/15 border-purple-500 text-purple-700 dark:text-purple-300'
                              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
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
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 hover:from-purple-500 hover:to-pink-500 text-white shadow-md hover:scale-[1.01] active:scale-[0.99]'
                    }`}
                  >
                    {isGeneratingVideo ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Rendering Cinematic Video (Veo)...</span>
                      </>
                    ) : (
                      <>
                        <Video className="w-4 h-4" />
                        <span>Generate Video (Veo 3.1)</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Video Preview Column */}
              <div className="md:col-span-7 flex flex-col space-y-4">
                {selectedVideo ? (
                  <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-850 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
                    <div className="relative flex-1 min-h-[280px] max-h-[380px] flex items-center justify-center rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                      <video
                        src={selectedVideo.url}
                        controls
                        autoPlay
                        loop
                        playsInline
                        className="max-h-full max-w-full object-contain rounded-lg"
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {selectedVideo.prompt}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          Format: MP4 • Aspect: {selectedVideo.aspectRatio}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleDownloadVideo(selectedVideo)}
                          className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                          title="Download Video File"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 min-h-[300px] rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-6 text-center text-slate-400">
                    <Video className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-700" />
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                      No video rendered yet
                    </p>
                    <p className="text-xs text-slate-400 max-w-xs mt-1">
                      Type your motion instructions, optionally upload a photo as the initial frame, and click "Generate Video" to invoke Google Veo.
                    </p>
                  </div>
                )}

                {/* Video Gallery Strip */}
                {generatedVideos.length > 1 && (
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                      Video History
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {generatedVideos.map((vid) => (
                        <button
                          key={vid.id}
                          onClick={() => setSelectedVideo(vid)}
                          className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-transform cursor-pointer bg-slate-950 flex items-center justify-center ${
                            selectedVideo?.id === vid.id
                              ? 'border-purple-500 scale-105'
                              : 'border-transparent opacity-75 hover:opacity-100'
                          }`}
                        >
                          <Video className="w-6 h-6 text-white" />
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
