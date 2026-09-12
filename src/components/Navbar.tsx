import React, { useState, useEffect } from 'react';
import { Sparkles, Menu, X, ArrowUpRight, Cpu } from 'lucide-react';

interface NavbarProps {
  onOpenLivePlayground: () => void;
  onOpenWaitlist: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenLivePlayground,
  onOpenWaitlist,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Architecture', href: '#architecture' },
    { label: 'Bento Features', href: '#features' },
    { label: 'Benchmarks', href: '#benchmarks' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#000000]/80 backdrop-blur-xl border-b border-white/[0.08] shadow-2xl py-3.5'
          : 'bg-transparent border-b border-white/[0.04] py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left: Clean Logo Placeholder */}
        <a
          href="#"
          className="flex items-center gap-2.5 group cursor-pointer"
        >
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-500 shadow-md shadow-indigo-500/20 transition-transform duration-300 group-hover:scale-105">
            <Cpu className="w-4 h-4 text-white" />
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg blur-xs opacity-40 group-hover:opacity-80 transition-opacity" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base sm:text-lg font-bold tracking-tight text-white font-display">
              ANDROMEDA
            </span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              v3.8
            </span>
          </div>
        </a>

        {/* Center: 3 Minimalist Nav Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-zinc-400 hover:text-white transition-colors duration-200 tracking-wide font-medium relative group"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-gradient-to-r from-indigo-500 to-purple-400 transition-all duration-300 group-hover:w-full rounded-full" />
            </a>
          ))}
        </nav>

        {/* Right: Sharp Outline CTA Button */}
        <div className="hidden md:flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenLivePlayground}
            className="text-xs font-mono text-zinc-400 hover:text-zinc-200 px-3 py-2 transition-colors cursor-pointer"
          >
            Live Console
          </button>
          <button
            type="button"
            onClick={onOpenWaitlist}
            className="relative inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide text-zinc-100 bg-black border border-white/15 hover:border-indigo-500/80 hover:text-white transition-all duration-300 shadow-sm group cursor-pointer hover:shadow-[0_0_20px_-3px_rgba(79,70,229,0.5)]"
          >
            <span>Get Started</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-indigo-400" />
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            onClick={onOpenWaitlist}
            className="px-3 py-1.5 rounded-md text-xs font-semibold text-zinc-100 bg-zinc-900 border border-white/10"
          >
            Start
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Glass Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-3 pb-6 bg-[#09090b]/95 backdrop-blur-2xl border-b border-white/[0.08] shadow-2xl transition-all">
          <div className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors font-medium"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-2 border-t border-white/5 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLivePlayground();
                }}
                className="w-full text-center px-4 py-2.5 rounded-lg text-xs font-mono text-zinc-300 bg-zinc-900/80 border border-white/10 hover:bg-zinc-800"
              >
                Launch Live Console
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenWaitlist();
                }}
                className="w-full text-center px-4 py-2.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-indigo-600/30"
              >
                Get API Keys & Access
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
