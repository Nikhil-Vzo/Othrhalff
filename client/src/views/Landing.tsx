"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Ghost, Heart, ArrowRight, Instagram, Twitter, MapPin, Clock, MessageSquare, ShieldCheck, Video } from 'lucide-react';
import { useRouter as useNavigate } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";

const CherryBlossomPetals: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const petals: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      angle: number;
      spin: number;
      opacity: number;
    }> = [];

    for (let i = 0; i < 20; i++) {
      petals.push({
        x: Math.random() * width,
        y: Math.random() * height - height,
        size: Math.random() * 5 + 3,
        speedX: Math.random() * 1.0 - 0.3,
        speedY: Math.random() * 0.8 + 0.6,
        angle: Math.random() * Math.PI * 2,
        spin: Math.random() * 0.015 - 0.0075,
        opacity: Math.random() * 0.35 + 0.15,
      });
    }

    const drawPetal = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      angle: number,
      opacity: number
    ) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-size, -size / 2, -size, size, 0, size * 1.4);
      ctx.bezierCurveTo(size, size, size, -size / 2, 0, 0);
      ctx.fillStyle = `rgba(255, 150, 180, ${opacity})`;
      ctx.fill();
      ctx.restore();
    };

    const update = () => {
      ctx.clearRect(0, 0, width, height);

      petals.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.angle += p.spin;

        if (p.y > height) {
          p.y = -20;
          p.x = Math.random() * width;
          p.speedY = Math.random() * 0.8 + 0.6;
          p.speedX = Math.random() * 1.0 - 0.3;
        }

        drawPetal(ctx, p.x, p.y, p.size, p.angle, p.opacity);
      });

      animationFrameId = requestAnimationFrame(update);
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    update();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[2]" />;
};

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const onEnter = () => navigate.push('/login');

  // Redirect authenticated users to home
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate.push('/home');
    }
  }, [isAuthenticated, isLoading, navigate]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Features", link: "#features" },
    { name: "Stories", link: "/blog" },
    { name: "Community", link: "/developers" },
    { name: "Safety", link: "/safety" },
  ];

  const [textRevealed, setTextRevealed] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTextRevealed(true), 100);
    const loaderTimer = setTimeout(() => setPageLoaded(true), 1600);
    return () => { clearTimeout(timer); clearTimeout(loaderTimer); };
  }, []);

  // Enable document scrolling on Landing page, restore overflow hidden on unmount
  useEffect(() => {
    const origHtmlOverflow = document.documentElement.style.overflow;
    const origBodyOverflow = document.body.style.overflow;
    const origHtmlHeight = document.documentElement.style.height;
    const origBodyHeight = document.body.style.height;

    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';
    document.documentElement.style.height = 'auto';
    document.body.style.height = 'auto';

    return () => {
      document.documentElement.style.overflow = origHtmlOverflow;
      document.body.style.overflow = origBodyOverflow;
      document.documentElement.style.height = origHtmlHeight;
      document.body.style.height = origBodyHeight;
    };
  }, []);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Letter-by-letter animation component
  const AnimatedText = ({ text, delay = 0, className = '', isGradient = false }: { text: string; delay?: number; className?: string; isGradient?: boolean }) => (
    <span className={className}>
      {text.split('').map((char, i) => (
        <span
          key={i}
          className={`inline-block transition-all duration-500 ${isGradient
            ? 'text-transparent bg-clip-text bg-gradient-to-r from-neon via-purple-500 to-blue-500'
            : ''
            }`}
          style={{
            opacity: textRevealed ? 1 : 0,
            transform: textRevealed ? 'translateY(0) rotateX(0)' : 'translateY(40px) rotateX(-90deg)',
            transitionDelay: `${delay + i * 40}ms`,
            backgroundSize: isGradient ? '200% 200%' : undefined,
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );

  return (
    <div className="min-h-screen bg-[#07030d] text-white font-sans selection:bg-[#F45D9B] selection:text-white relative overflow-x-hidden flex flex-col">
      {/* Branded Loader */}
      <div 
        className={`fixed inset-0 z-[9999] bg-[#05000a] flex flex-col items-center justify-center transition-all duration-700 ${
          pageLoaded ? 'opacity-0 pointer-events-none scale-110' : 'opacity-100'
        }`}
      >
        <div className="flex items-center gap-2 mb-6">
          <Ghost className="w-6 h-6 text-[#F45D9B] animate-pulse" />
          <span className="font-bold tracking-tight text-2xl text-white/95">
            OtherHalff
          </span>
        </div>
        <div className="w-48 h-[2px] bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-[#F45D9B] rounded-full animate-[loading_1.4s_ease-in-out_infinite]" />
        </div>
        <style>{`
          @keyframes loading {
            0% { width: 0%; transform: translateX(0); }
            50% { width: 100%; transform: translateX(0); }
            100% { width: 100%; transform: translateX(100%); }
          }
        `}</style>
      </div>

      {/* Subtle noise overlay */}
      <div className="absolute inset-0 opacity-5 mix-blend-overlay pointer-events-none z-[1]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }}></div>

      {/* Full-Bleed Hero Background Image */}
      <div 
        className="absolute top-0 left-0 w-full h-[100vh] min-h-[750px] max-h-[1050px] z-[0] overflow-hidden pointer-events-none transition-transform duration-1000 ease-out"
        style={{
          transform: `translate3d(${mousePos.x * -10}px, ${mousePos.y * -10}px, 0) scale(1.02)`,
        }}
      >
        <img 
          src="/landing_hero-bg.png?v=3" 
          alt="Hero Background" 
          className="w-full h-full object-cover object-bottom"
          style={{ imageRendering: '-webkit-optimize-contrast' }}
        />
        {/* Soft sky-matching mist gradient instead of dark overlay */}
        <div 
          className="absolute inset-0 z-10" 
          style={{
            background: 'linear-gradient(to bottom, rgba(7,3,13,0.02) 0%, rgba(7,3,13,0.12) 60%, rgba(7,3,13,0.92) 100%)'
          }}
        />
      </div>

      {/* Top Navigation Scrim for Contrast */}
      <div 
        className="absolute top-0 left-0 right-0 h-[140px] z-[1] pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 100%)'
        }}
      />

      {/* Atmospheric Fog/Mist Layer behind text */}
      <div 
        className="absolute top-0 left-0 w-full h-[100vh] min-h-[750px] max-h-[1050px] z-[1] overflow-hidden pointer-events-none opacity-40 mix-blend-screen"
        style={{
          background: 'radial-gradient(circle at 50% 45%, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 50%, transparent 100%)'
        }}
      />

      {/* Cherry Blossom falling petals animation */}
      <CherryBlossomPetals />

      <Navbar>
        {/* Desktop Navigation */}
        <NavBody>
          <NavbarLogo />
          <NavItems items={navItems} />
          <div className="flex items-center gap-4">
            <NavbarButton variant="secondary" onClick={onEnter}>Log In</NavbarButton>
            <NavbarButton variant="primary" onClick={onEnter}>Join Campus</NavbarButton>
          </div>
        </NavBody>

        {/* Mobile Navigation */}
        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            <div className="flex flex-col">
              {navItems.map((item, idx) => (
                <a
                  key={`mobile-link-${idx}`}
                  href={item.link}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="group relative text-white/90 hover:text-white active:text-[#F45D9B] transition-colors py-3.5 text-base font-semibold border-b border-white/5 last:border-0 flex items-center justify-between"
                >
                  <span>{item.name}</span>
                  <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-[#F45D9B] group-hover:translate-x-1 transition-all duration-300" />
                </a>
              ))}
            </div>
            <div className="flex w-full flex-col gap-3 mt-2">
              <NavbarButton
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onEnter();
                }}
                variant="secondary"
                className="w-full text-center py-3.5 text-sm"
              >
                Log In
              </NavbarButton>
              <NavbarButton
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onEnter();
                }}
                variant="primary"
                className="w-full text-center py-3.5 text-sm"
              >
                Join Campus
              </NavbarButton>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      {/* 1. HERO SECTION */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 py-24 sm:py-36 max-w-7xl mx-auto w-full">
        <div className="relative z-10 max-w-3xl flex flex-col items-center">
          {/* Soft radial scrim behind text block */}
          <div 
            className="absolute inset-[-40px_-60px] pointer-events-none z-[-1]"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.35) 0%, transparent 70%)'
            }}
          />

          <h1 className="text-5xl sm:text-7xl font-semibold tracking-tight text-white mb-6 leading-[1.1] font-display max-w-2xl">
            <AnimatedText text="Find your people." delay={200} />
          </h1>

          <p
            className="text-base sm:text-lg text-white/95 max-w-xl mb-10 leading-relaxed font-medium"
            style={{
              opacity: textRevealed ? 1 : 0,
              transform: textRevealed ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.8s ease-out 0.8s',
              textShadow: '0 2px 6px rgba(0,0,0,0.6)'
            }}
          >
            Meet students you'll naturally cross paths with every day.
          </p>

          <div
            style={{
              opacity: textRevealed ? 1 : 0,
              transform: textRevealed ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.9)',
              transition: 'all 0.6s ease-out 1.2s',
            }}
          >
            <button
              onClick={onEnter}
              className="px-8 py-3.5 bg-white text-black font-semibold text-sm rounded-full hover:bg-white/95 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-[0_10px_25px_rgba(255,255,255,0.08)]"
            >
              Join Your Campus
            </button>
          </div>
        </div>

        {/* 2. BEYOND DATING: PINTEREST ASYMMETRIC MASONRY SECTION */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-32 relative z-10 text-left">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-24">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-[#F45D9B]/30 mb-6 backdrop-blur-md shadow-[0_0_20px_rgba(244,93,155,0.15)]">
              <span className="w-2 h-2 rounded-full bg-[#F45D9B] animate-pulse" />
              <span className="text-xs font-semibold text-white/90 uppercase tracking-widest">
                Beyond Dating • Campus Synergy
              </span>
            </div>
            
            <h2 className="text-4xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-white mb-6 leading-[1.1] font-display">
              Beyond Dating.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F45D9B] via-pink-400 to-purple-400">
                Built For Campus Life.
              </span>
            </h2>
            
            <p className="text-base sm:text-xl text-white/70 font-normal leading-relaxed">
              Traditional apps put you on a 20-mile wild goose chase. Othrhalff connects you with the people in your actual lecture halls, gym sessions, and campus spots.
            </p>
          </div>

          {/* Pinterest Asymmetric Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-start">
            {/* COLUMN 1: Traditional Dating Apps (The Problem) */}
            <div className="flex flex-col gap-6 sm:gap-8">
              {/* Card 1: Swipe Fatigue */}
              <div className="bg-red-950/10 border border-red-500/20 p-6 sm:p-8 rounded-3xl backdrop-blur-xl hover:border-red-500/40 transition-all duration-500 group">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono uppercase tracking-wider text-red-400/80 font-bold">Traditional Apps</span>
                  <Clock className="w-4 h-4 text-red-400/60" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Swipe Fatigue & Distance</h3>
                <p className="text-xs sm:text-sm text-white/60 mb-6 leading-relaxed">
                  Trapped in endless swiping loops with profiles located 20 miles away. Zero campus relevance.
                </p>
                <div className="bg-black/40 border border-red-500/20 p-4 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3 opacity-50 blur-[0.5px]">
                    <div className="w-10 h-10 rounded-full bg-red-950/40 border border-red-500/20" />
                    <div>
                      <div className="text-xs font-semibold text-white">Stranger #482</div>
                      <div className="text-[10px] text-red-400">22 Miles Away</div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-300 font-medium">
                    No Vibes
                  </span>
                </div>
              </div>

              {/* Card 2: Awkward Small Talk */}
              <div className="bg-red-950/10 border border-red-500/20 p-6 sm:p-8 rounded-3xl backdrop-blur-xl hover:border-red-500/40 transition-all duration-500">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono uppercase tracking-wider text-red-400/80 font-bold">The Friction</span>
                  <MessageSquare className="w-4 h-4 text-red-400/60" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Dry Small Talk</h3>
                <p className="text-xs sm:text-sm text-white/60 mb-4 leading-relaxed">
                  Shallow greetings that lead nowhere. No common college context.
                </p>
                <div className="space-y-2">
                  <div className="bg-red-950/30 border border-red-500/15 p-2.5 rounded-xl text-xs text-red-200/70 max-w-[70%]">
                    "hey"
                  </div>
                  <div className="bg-red-950/30 border border-red-500/15 p-2.5 rounded-xl text-xs text-red-200/70 max-w-[70%] ml-auto text-right">
                    "wyd"
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMN 2: The Othrhalff Way (The Solution) */}
            <div className="flex flex-col gap-6 sm:gap-8 md:mt-12">
              {/* Card 1: Row 2 Lecture Partner */}
              <div className="bg-white/[0.03] border border-[#F45D9B]/30 p-6 sm:p-8 rounded-3xl backdrop-blur-xl hover:border-[#F45D9B]/60 hover:scale-[1.01] transition-all duration-500 shadow-[0_0_40px_rgba(244,93,155,0.1)] group">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#F45D9B] font-bold">The Othrhalff Way</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#F45D9B]/10 border border-[#F45D9B]/30 text-[10px] font-bold text-[#F45D9B]">
                    98% Vibe Match
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">Row 2 Lecture Partner</h3>
                <p className="text-xs sm:text-sm text-white/70 mb-6 leading-relaxed">
                  "Looking for someone to argue about Christopher Nolan movies with after class."
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/80">Cinema</span>
                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/80">Indie Rock</span>
                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/80">Late Night</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <MapPin className="w-3.5 h-3.5 text-[#F45D9B]" />
                  <span>Delhi University Campus • Active Now</span>
                </div>
              </div>

              {/* Card 2: Ghost Mode Privacy */}
              <div className="bg-white/[0.03] border border-purple-500/30 p-6 sm:p-8 rounded-3xl backdrop-blur-xl hover:border-purple-500/60 hover:scale-[1.01] transition-all duration-500 shadow-[0_0_40px_rgba(168,85,247,0.1)]">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono uppercase tracking-wider text-purple-400 font-bold">Privacy First</span>
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Ghost Mode Protection</h3>
                <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                  Chemistry first, identity second. Reveal visuals only when the vibe is verified.
                </p>
              </div>

              {/* Card 3: Synchronized Hangouts */}
              <div className="bg-white/[0.03] border border-cyan-500/30 p-6 sm:p-8 rounded-3xl backdrop-blur-xl hover:border-cyan-500/60 hover:scale-[1.01] transition-all duration-500 shadow-[0_0_40px_rgba(6,182,212,0.1)]">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">Virtual Auditorium</span>
                  <Video className="w-4 h-4 text-cyan-400" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Synchronized Dates</h3>
                <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                  Watch movies side-by-side or stream music tracks with dynamic live overlay chat.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* PAGE FLOW CONTAINER */}
        <div className="mt-16 sm:mt-24 w-full relative z-10 flex flex-col pb-16 md:pb-24">
          {/* Marquees */}
          <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] pb-12 overflow-hidden flex flex-col items-center">
            <style>{`
              @keyframes marquee-left {
                0% { transform: translateX(0%); }
                100% { transform: translateX(-50%); }
              }
              @keyframes marquee-right {
                0% { transform: translateX(-50%); }
                100% { transform: translateX(0%); }
              }
              .animate-marquee-left {
                animation: marquee-left 40s linear infinite;
                display: inline-flex;
              }
              .animate-marquee-right {
                animation: marquee-right 40s linear infinite;
                display: inline-flex;
              }
            `}</style>
            
            <div className="w-[110vw] transform -rotate-2 bg-[#F45D9B]/5 backdrop-blur-md border-y border-[#F45D9B]/30 py-6 sm:py-10 shadow-[0_0_80px_rgba(244,93,155,0.1)] z-10">
              <div className="flex whitespace-nowrap overflow-hidden py-2 border-y border-[#F45D9B]/10">
                <div className="animate-marquee-left text-white/90 font-black text-5xl sm:text-7xl md:text-9xl uppercase tracking-tighter block">
                  <span className="mx-8 drop-shadow-[0_0_15px_rgba(244,93,155,0.8)]">FIND YOUR GYM SPOTTER • <span className="text-[#F45D9B]/70">ROW 2</span> LECTURE PARTNER • LATE NIGHT STUDY BUDDY •</span>
                  <span className="mx-8 drop-shadow-[0_0_15px_rgba(244,93,155,0.8)]">FIND YOUR GYM SPOTTER • <span className="text-[#F45D9B]/70">ROW 2</span> LECTURE PARTNER • LATE NIGHT STUDY BUDDY •</span>
                </div>
              </div>
            </div>

            <div className="w-[110vw] transform rotate-1 -mt-8 sm:-mt-12 bg-blue-900/10 backdrop-blur-lg border-y border-blue-500/30 py-4 sm:py-8 shadow-[0_0_80px_rgba(59,130,246,0.1)] z-0 mix-blend-screen">
              <div className="flex whitespace-nowrap overflow-hidden py-2 border-y border-blue-500/10">
                <div className="animate-marquee-right text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 font-light italic text-4xl sm:text-6xl md:text-8xl uppercase tracking-widest block">
                  <span className="mx-12">THE MICROSCOPIC GEOGRAPHY OF COLLEGE •</span>
                  <span className="mx-12">THE MICROSCOPIC GEGeography OF COLLEGE •</span>
                  <span className="mx-12">THE MICROSCOPIC GEOGRAPHY OF COLLEGE •</span>
                  <span className="mx-12">THE MICROSCOPIC GEOGRAPHY OF COLLEGE •</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Section */}
      <footer className="relative z-10 border-t border-gray-900 bg-black/80 backdrop-blur-xl pt-10 sm:pt-16 pb-6 sm:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 mb-8 sm:mb-12">
            <div className="col-span-2 md:col-span-2">
              <div className="flex items-center gap-2 mb-3 sm:mb-4 cursor-pointer group" onClick={() => navigate.push('/')}>
                <Ghost className="w-5 h-5 text-[#F45D9B] group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
                <span className="font-bold tracking-tight text-lg text-white/90">
                  OtherHalff
                </span>
              </div>
              <p className="text-gray-500 text-xs sm:text-sm leading-relaxed max-w-sm mb-4 sm:mb-6">
                The safest way to meet people on campus. Built for students, by students.
                Find your vibe without the pressure.
              </p>
              <div className="flex gap-3 sm:gap-4">
                <a href="https://www.instagram.com/othrhalff/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-900 flex items-center justify-center text-gray-400 hover:bg-[#F45D9B] hover:text-white hover:scale-110 hover:rotate-6 transition-all duration-300">
                  <Instagram className="w-4 h-4 sm:w-5 sm:h-5" />
                </a>
                <a href="#" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-900 flex items-center justify-center text-gray-400 hover:bg-[#F45D9B] hover:text-white hover:scale-110 hover:-rotate-6 transition-all duration-300">
                  <Twitter className="w-4 h-4 sm:w-5 sm:h-5" />
                </a>
                <Link href="/about" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-900 flex items-center justify-center text-gray-400 hover:bg-[#F45D9B] hover:text-white hover:scale-110 hover:rotate-6 transition-all duration-300">
                  <Ghost className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              </div>
            </div>
 
            <div>
              <h4 className="text-white font-bold uppercase tracking-widest text-xs sm:text-sm mb-4 sm:mb-6">Company</h4>
              <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-500">
                <li><Link href="/about" className="hover:text-[#F45D9B] hover:translate-x-1 inline-block transition-all">About Us</Link></li>
                <li><Link href="/developers" className="hover:text-[#F45D9B] hover:translate-x-1 inline-block transition-all">Developers</Link></li>
                <li><Link href="/careers" className="hover:text-[#F45D9B] hover:translate-x-1 inline-block transition-all">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-[#F45D9B] hover:translate-x-1 inline-block transition-all">Contact</Link></li>
              </ul>
            </div>
 
            <div>
              <h4 className="text-white font-bold uppercase tracking-widest text-xs sm:text-sm mb-4 sm:mb-6">Legal</h4>
              <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-500">
                <li><Link href="/privacy" className="hover:text-[#F45D9B] hover:translate-x-1 inline-block transition-all">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-[#F45D9B] hover:translate-x-1 inline-block transition-all">Terms</Link></li>
                <li><Link href="/safety" className="hover:text-[#F45D9B] hover:translate-x-1 inline-block transition-all">Safety</Link></li>
                <li><Link href="/guidelines" className="hover:text-[#F45D9B] hover:translate-x-1 inline-block transition-all">Guidelines</Link></li>
              </ul>
            </div>
          </div>
 
          <div className="border-t border-gray-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 text-xs">&copy; {new Date().getFullYear()} Othrhalff Inc. All rights reserved.</p>
            <p className="text-gray-500 text-xs font-medium flex items-center gap-1">
              Built with <Heart className="w-3 h-3 text-[#F45D9B] fill-current animate-pulse" /> to help find what you'd love
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
