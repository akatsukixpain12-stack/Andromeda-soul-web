import React from 'react';

export const SocialProof: React.FC = () => {
  const logos = [
    { name: 'ANTHROPIC', subtitle: 'Safety Research' },
    { name: 'DEEPMIND', subtitle: 'Alpha Architecture' },
    { name: 'VERCEL', subtitle: 'Edge Runtime' },
    { name: 'SUPABASE', subtitle: 'Distributed Vector' },
    { name: 'CLOUDFLARE', subtitle: 'Workers AI' },
    { name: 'LINEAR', subtitle: 'Sync Protocol' },
    { name: 'STRIPE', subtitle: 'Billing & Tokenomics' },
    { name: 'HUGGING FACE', subtitle: 'Weight Hub' },
    { name: 'SCALE AI', subtitle: 'RLHF Tuning' },
    { name: 'CURSOR', subtitle: 'IDE Native' },
  ];

  return (
    <section className="relative py-14 sm:py-18 bg-[#000000] border-y border-white/[0.06] overflow-hidden">
      {/* Subtle background ambient line */}
      <div className="max-w-7xl mx-auto px-4 mb-8 text-center">
        <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-zinc-500 font-semibold">
          TRUSTED BY PIONEERING ENGINEERS &amp; RESEARCH ARCHITECTS
        </p>
      </div>

      {/* Marquee Container with edge gradients for seamless fade */}
      <div className="relative w-full overflow-hidden flex items-center">
        {/* Left Fade Mask */}
        <div className="absolute left-0 top-0 bottom-0 w-24 sm:w-44 bg-gradient-to-r from-[#000000] via-[#000000]/90 to-transparent z-10 pointer-events-none" />

        {/* Right Fade Mask */}
        <div className="absolute right-0 top-0 bottom-0 w-24 sm:w-44 bg-gradient-to-l from-[#000000] via-[#000000]/90 to-transparent z-10 pointer-events-none" />

        {/* Scrolling Marquee Row */}
        <div className="animate-marquee flex items-center gap-12 sm:gap-16 py-2">
          {/* First set of logos */}
          {logos.map((logo, idx) => (
            <div
              key={`logo-1-${idx}`}
              className="flex items-center gap-2.5 opacity-40 hover:opacity-90 transition-opacity duration-300 group cursor-default select-none"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 group-hover:bg-indigo-400 transition-colors" />
              <div className="flex flex-col text-left">
                <span className="text-sm sm:text-base font-black tracking-widest text-zinc-300 group-hover:text-white font-display uppercase">
                  {logo.name}
                </span>
                <span className="text-[9px] font-mono tracking-wider text-zinc-600 group-hover:text-zinc-400 uppercase">
                  {logo.subtitle}
                </span>
              </div>
            </div>
          ))}

          {/* Duplicate set of logos for seamless infinite loop */}
          {logos.map((logo, idx) => (
            <div
              key={`logo-2-${idx}`}
              className="flex items-center gap-2.5 opacity-40 hover:opacity-90 transition-opacity duration-300 group cursor-default select-none"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 group-hover:bg-indigo-400 transition-colors" />
              <div className="flex flex-col text-left">
                <span className="text-sm sm:text-base font-black tracking-widest text-zinc-300 group-hover:text-white font-display uppercase">
                  {logo.name}
                </span>
                <span className="text-[9px] font-mono tracking-wider text-zinc-600 group-hover:text-zinc-400 uppercase">
                  {logo.subtitle}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
