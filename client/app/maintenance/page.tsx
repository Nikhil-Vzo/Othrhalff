"use client";

import React, { useState, useEffect } from 'react';
import { StarField } from '../../src/components/StarField';
import { Ghost, Sparkles, Heart } from 'lucide-react';

const ghostFrames = [
  // Frame 0: Happy / Cute look
  `    .---.
   /     \\
  |  o o  |
  |   v   |
  \\  \\ /  /
   \`--'--'`,
  
  // Frame 1: Winking and puckering (blowing kiss)
  `    .---.
   /     \\
  |  o -  |
  |   *   |
  \\  \\ /  /
   \`--'--'`,
   
  // Frame 2: Kiss blown!
  `    .---.
   /     \\
  |  o -  |
  |   O   |
  \\  \\ /  /
   \`--'--'`
];

interface FloatingHeart {
  id: number;
  drift: string;
}

export default function MaintenancePage() {
  const [frame, setFrame] = useState(0);
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((prev) => {
        const next = (prev + 1) % ghostFrames.length;
        if (next === 2) {
          // Spawn a new heart
          const newHeart = {
            id: Date.now(),
            drift: `${(Math.random() - 0.5) * 80}px`, // drift horizontal spacing
          };
          setHearts((prevHearts) => [...prevHearts, newHeart]);

          // Cleanup heart after its 2s animation ends
          setTimeout(() => {
            setHearts((prevHearts) => prevHearts.filter((h) => h.id !== newHeart.id));
          }, 2000);
        }
        return next;
      });
    }, 600);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col justify-between items-center px-4 overflow-hidden selection:bg-neon selection:text-white font-sans">
      {/* Background StarField */}
      <StarField />

      {/* Embedded CSS for custom float animations */}
      <style>{`
        @keyframes heartFloat {
          0% {
            transform: translateY(10px) translateX(0) scale(0.6) rotate(0deg);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          100% {
            transform: translateY(-160px) translateX(var(--drift)) scale(1.4) rotate(15deg);
            opacity: 0;
          }
        }
        .floating-heart {
          animation: heartFloat 2.0s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }

        @keyframes cardFloat {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-card-float {
          animation: cardFloat 6s ease-in-out infinite;
        }
      `}</style>

      {/* Spacer for vertical layout */}
      <div className="h-6" />

      {/* Main Glassmorphic Card */}
      <main className="w-full max-w-xl bg-neutral-950/40 border border-neutral-900/80 backdrop-blur-xl rounded-3xl p-8 sm:p-12 shadow-[0_0_50px_rgba(255,0,127,0.1)] relative z-10 animate-card-float my-auto">
        {/* Pulsing Status Badge */}
        <div className="flex justify-center mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neon/10 border border-neon/30 text-xs font-black tracking-widest text-[#ff007f] uppercase animate-pulse-slow">
            <span className="w-2 h-2 rounded-full bg-neon animate-ping" />
            Renovation In Progress
          </span>
        </div>

        {/* Brand Name Header */}
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-3 justify-center select-none mb-2">
            <div className="relative">
              <Ghost className="w-8 h-8 text-neon drop-shadow-[0_0_8px_rgba(255,0,127,0.5)] rotate-6" />
              <Sparkles className="w-3.5 h-3.5 text-white absolute -top-1 -right-1 animate-pulse" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter uppercase leading-none">
              Othr<span className="text-neon">Halff</span>
            </h1>
          </div>
          <p className="text-[10px] font-bold text-neutral-500 tracking-[0.4em] uppercase">
            Campus Dating
          </p>
        </header>

        {/* Dynamic ASCII Ghostblowing Kiss Area */}
        <div className="flex flex-col items-center justify-center py-6 mb-8">
          <div className="relative inline-block font-mono text-neon select-none h-[110px] w-[140px] flex items-center justify-center">
            <pre className="text-2xl leading-none text-[#ff007f] filter drop-shadow-[0_0_10px_rgba(255,0,127,0.6)]">
              {ghostFrames[frame]}
            </pre>
            
            {/* Absolute container located around the ghost's mouth */}
            <div className="absolute top-[38%] left-[62%] pointer-events-none">
              {hearts.map((heart) => (
                <span
                  key={heart.id}
                  className="absolute floating-heart text-[#ff007f] text-2xl filter drop-shadow-[0_0_6px_rgba(255,0,127,0.8)]"
                  style={{
                    '--drift': heart.drift,
                  } as React.CSSProperties}
                >
                  ♥
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Maintenance Message */}
        <div className="text-center space-y-4">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-snug">
            Othrhalff is under renovation...
          </h2>
          <p className="text-base sm:text-lg text-neutral-400 font-medium italic tracking-wide">
            a chapter of love begins soon
          </p>
        </div>

        {/* Early Access Notification Mock Input */}
        <div className="flex flex-col sm:flex-row gap-2.5 max-w-md w-full mx-auto mt-10">
          <input
            type="email"
            placeholder="Enter email for early access..."
            className="flex-1 bg-black/60 border border-neutral-800 rounded-2xl px-5 py-3.5 text-sm text-white focus:outline-none focus:border-neon transition-colors placeholder:text-neutral-600 font-sans"
            disabled
          />
          <button className="bg-neon hover:bg-neon/90 text-white font-black text-sm px-6 py-3.5 rounded-2xl transition-all duration-300 shadow-[0_0_15px_rgba(255,0,127,0.3)] hover:shadow-[0_0_25px_rgba(255,0,127,0.5)] cursor-not-allowed whitespace-nowrap uppercase tracking-wider">
            Notify Me
          </button>
        </div>
      </main>

      {/* Footer Branding Info */}
      <footer className="w-full text-center py-8 z-10">
        <p className="text-[11px] font-bold text-neutral-600 tracking-widest uppercase">
          © {new Date().getFullYear()} OTHRHALFF. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
