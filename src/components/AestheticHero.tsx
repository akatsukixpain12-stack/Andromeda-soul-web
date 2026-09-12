import React, { useState, useEffect } from 'react';
import { Sparkles, Edit3, ArrowDown, Bot, Terminal, ShieldCheck, Zap, Check } from 'lucide-react';

interface AestheticHeroProps {
  userName: string;
  onUpdateUserName: (name: string) => void;
  onSelectPrompt: (prompt: string) => void;
  onScrollToChat?: () => void;
}

const ROLES = [
  'executor deve_←**',
  'discord bot architect_',
  'pytorch ai creator_',
  'zero-token sovereign_',
];

export const AestheticHero: React.FC<AestheticHeroProps> = ({
  userName,
  onUpdateUserName,
  onSelectPrompt,
  onScrollToChat,
}) => {
  const [roleIndex, setRoleIndex] = useState(0);
  const [displayedRole, setDisplayedRole] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userName);

  // Typewriter effect for role pill
  useEffect(() => {
    const currentTarget = ROLES[roleIndex];
    let timer: NodeJS.Timeout;

    if (!isDeleting && displayedRole.length < currentTarget.length) {
      timer = setTimeout(() => {
        setDisplayedRole(currentTarget.slice(0, displayedRole.length + 1));
      }, 70);
    } else if (!isDeleting && displayedRole.length === currentTarget.length) {
      timer = setTimeout(() => {
        setIsDeleting(true);
      }, 2000);
    } else if (isDeleting && displayedRole.length > 0) {
      timer = setTimeout(() => {
        setDisplayedRole(currentTarget.slice(0, displayedRole.length - 1));
      }, 35);
    } else if (isDeleting && displayedRole.length === 0) {
      setIsDeleting(false);
      setRoleIndex((prev) => (prev + 1) % ROLES.length);
    }

    return () => clearTimeout(timer);
  }, [displayedRole, isDeleting, roleIndex]);

  const handleSaveName = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = nameInput.trim();
    if (trimmed) {
      onUpdateUserName(trimmed);
    } else {
      setNameInput(userName);
    }
    setIsEditingName(false);
  };

  return (
    <div className="relative min-h-[82vh] flex flex-col justify-between items-center px-4 py-8 select-none text-center">
      {/* Background ambient subtle atmospheric gradient */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="w-[320px] sm:w-[500px] h-[320px] sm:h-[500px] bg-violet-600/10 dark:bg-violet-900/15 rounded-full blur-3xl animate-subtle-glow" />
      </div>

      {/* Floating Top Card (matching screenshot) */}
      <div className="w-full flex justify-end max-w-lg z-10">
        <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-zinc-900/90 text-zinc-100 border border-zinc-800 shadow-xl backdrop-blur-md transition-all hover:border-zinc-700">
          <div className="w-5 h-5 rounded-lg bg-gradient-to-tr from-blue-500 via-indigo-500 to-amber-400 flex items-center justify-center shadow-xs">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold tracking-tight text-white flex items-center gap-1">
              <span>Andromeda</span>
              <span className="text-zinc-500">•</span>
              <span className="text-zinc-400 font-normal">Soul 1</span>
            </div>
            <div className="text-[10px] text-zinc-400 font-mono tracking-wider">
              aistudio.google.com
            </div>
          </div>
        </div>
      </div>

      {/* Center Hero Identity Block */}
      <div className="my-auto z-10 flex flex-col items-center max-w-xl w-full py-8">
        {/* Welcome Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/80 text-zinc-400 border border-zinc-800 text-[11px] font-medium tracking-wide mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>SOVEREIGN AI WORKSPACE</span>
        </div>

        {/* Main "hi, im [NAME]" Display Heading */}
        <div className="relative group mb-4">
          {isEditingName ? (
            <form onSubmit={handleSaveName} className="flex items-center justify-center gap-2">
              <span className="text-3xl sm:text-5xl font-extrabold text-zinc-400">hi, im</span>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={() => handleSaveName()}
                autoFocus
                placeholder="Enter your name"
                className="text-3xl sm:text-5xl font-black tracking-tight text-white bg-zinc-900 border-b-2 border-violet-500 focus:outline-hidden px-2 py-1 uppercase text-center max-w-[280px] sm:max-w-md"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-violet-600 text-white hover:bg-violet-500 cursor-pointer"
              >
                <Check className="w-5 h-5" />
              </button>
            </form>
          ) : (
            <div
              onClick={() => {
                setNameInput(userName);
                setIsEditingName(true);
              }}
              className="cursor-pointer transition-transform hover:scale-[1.01]"
              title="Click to change your display name"
            >
              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
                <span className="text-zinc-400 font-bold lowercase">hi, im </span>
                <span className="uppercase text-white relative inline-block">
                  {userName || 'DIVINE JOHAN'}
                  <Edit3 className="w-4 h-4 text-zinc-500 inline-block ml-2 opacity-60 hover:opacity-100 align-middle" />
                </span>
              </h1>
            </div>
          )}
        </div>

        {/* Subtitle Role Badge: "i am [ executor deve_←** ]" */}
        <div className="flex items-center gap-2 text-zinc-400 text-sm sm:text-base font-medium mb-10">
          <span className="text-zinc-500 font-mono">i am</span>
          <div className="inline-flex items-center px-3.5 py-1.5 rounded-xl bg-zinc-900/90 text-zinc-200 border border-zinc-800 shadow-inner font-mono text-xs sm:text-sm tracking-wide">
            <span>{displayedRole}</span>
            <span className="w-1.5 h-3.5 bg-violet-400 ml-1 inline-block animate-blink" />
          </div>
        </div>

        {/* Minimalist Prompt Chips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg text-left">
          <button
            type="button"
            onClick={() => onSelectPrompt('Build a Discord Bot in discord.js with /ask slash command and zero token leak architecture.')}
            className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-zinc-700 transition-all cursor-pointer group"
          >
            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400 group-hover:bg-violet-500/20">
              <Bot className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <div className="font-semibold text-zinc-200 group-hover:text-white">Discord Bot Hub</div>
              <div className="text-zinc-500">Slash commands & auto-roles</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onSelectPrompt('Write a complete native PyTorch transformer architecture with RoPE and a local FastAPI server.')}
            className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-zinc-700 transition-all cursor-pointer group"
          >
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20">
              <Zap className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <div className="font-semibold text-zinc-200 group-hover:text-white">Create Own AI</div>
              <div className="text-zinc-500">PyTorch & RoPE from scratch</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onSelectPrompt('/think100000times Analyze multi-query attention and KV cache compression in large neural architectures.')}
            className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-zinc-700 transition-all cursor-pointer group"
          >
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20">
              <Terminal className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <div className="font-semibold text-zinc-200 group-hover:text-white">Deep Reasoning 100,000x</div>
              <div className="text-zinc-500">Uncapped thought depth</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onSelectPrompt('Audit this project for sensitive credentials, Discord bot tokens, and ensure safe .env scaffolding.')}
            className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-zinc-700 transition-all cursor-pointer group"
          >
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <div className="font-semibold text-zinc-200 group-hover:text-white">Zero Token Leak</div>
              <div className="text-zinc-500">Pre-push secret scanner</div>
            </div>
          </button>
        </div>
      </div>

      {/* "SCROLL DOWN" & Downward Arrow Indicator (matching screenshot) */}
      <div
        onClick={onScrollToChat}
        className="z-10 flex flex-col items-center gap-1.5 cursor-pointer text-zinc-500 hover:text-zinc-300 transition-colors pt-4 pb-2 group"
      >
        <span className="text-[10px] tracking-[0.25em] uppercase font-mono text-zinc-500 group-hover:text-zinc-400 transition-colors">
          SCROLL DOWN
        </span>
        <ArrowDown className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-transform group-hover:translate-y-0.5 animate-bounce" />
      </div>
    </div>
  );
};
