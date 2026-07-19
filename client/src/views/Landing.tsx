"use client";

import React, { useEffect, useRef, useState } from 'react';
import { 
  Ghost, Heart, Shield, ArrowRight, Instagram, Twitter, 
  Sparkles, MessageSquarePlus, Zap, MapPin, Users, PlaySquare, Music, Video, Star 
} from 'lucide-react';
import { NeonButton } from '../components/Common';
import { useRouter as useNavigate } from 'next/navigation';
import Link from 'next/link';
import { LiquidBackground } from '../components/LiquidBackground';
import { ChromaKeyVideo } from '../components/ChromaKeyVideo';
import { HeartCursor } from '../components/HeartCursor';
import { useAuth } from '../context/AuthContext';

const ScrollReveal = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, { threshold: 0.2 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className={`transition-all duration-[1200ms] transform ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'} ${className}`}>
      {children}
    </div>
  );
};

/* Asymmetric 3D Tilted Smartphone Mockup Component */
const TiltedPhone = ({ 
  children, 
  tiltDirection = 'left', 
  title 
}: { 
  children: React.ReactNode; 
  tiltDirection?: 'left' | 'right'; 
  title: string;
}) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 15, y: -y * 15 });
  };
  
  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const initialY = tiltDirection === 'left' ? 12 : -12;
  const transformStyle = `rotateY(${initialY + tilt.x}deg) rotateX(${6 + tilt.y}deg) scale(${tilt.x !== 0 ? 1.03 : 1})`;

  return (
    <div 
      className="group relative transition-all duration-500 ease-out flex flex-col items-center z-10" 
      style={{ perspective: '1000px' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div 
        className="relative w-[280px] h-[520px] bg-black/90 rounded-[45px] border-2 border-white/10 p-3 shadow-2xl transition-all duration-300 ease-out"
        style={{
          transformStyle: 'preserve-3d',
          transform: transformStyle,
          boxShadow: tiltDirection === 'left' 
            ? '0 20px 40px rgba(0,0,0,0.6), 0 0 35px rgba(255,0,127,0.2)' 
            : '0 20px 40px rgba(0,0,0,0.6), 0 0 35px rgba(168,85,247,0.2)'
        }}
      >
        {/* Notch */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-50 flex items-center justify-center border border-white/5">
          <div className="w-8 h-1 bg-gray-800 rounded-full" />
        </div>
        
        {/* Screen */}
        <div className="w-full h-full bg-[#05000a] rounded-[36px] overflow-hidden border border-white/5 relative flex flex-col justify-center items-center">
          {children}
        </div>
      </div>
      {/* Label */}
      <div className="mt-4 text-center">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">{title}</span>
      </div>
    </div>
  );
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

  // Load ASCII art text
  const [asciiArt, setAsciiArt] = useState('');
  useEffect(() => {
    fetch('/ascii-art.txt')
      .then(res => res.text())
      .then(data => setAsciiArt(data))
      .catch(err => console.error('Failed to load ASCII art:', err));
  }, []);

  const [textRevealed, setTextRevealed] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTextRevealed(true), 100);
    const loaderTimer = setTimeout(() => setPageLoaded(true), 1600);
    return () => { clearTimeout(timer); clearTimeout(loaderTimer); };
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
    <div className="h-screen bg-[#07030d] text-white font-sans selection:bg-neon selection:text-white relative overflow-y-auto overflow-x-hidden flex flex-col">
      {/* WebGL Liquid Background */}
      <LiquidBackground />

      {/* Heart Cursor */}
      <HeartCursor />

      {/* Branded Loader */}
      <div 
        className={`fixed inset-0 z-[9999] bg-[#05000a] flex flex-col items-center justify-center transition-all duration-700 ${
          pageLoaded ? 'opacity-0 pointer-events-none scale-110' : 'opacity-100'
        }`}
      >
        <div className="flex items-center gap-2 mb-6">
          <Ghost className="w-8 h-8 text-neon animate-pulse" />
          <span className="font-black tracking-tighter text-3xl text-white">
            <span>OTHR</span><span className="text-neon">HALFF</span>
          </span>
        </div>
        <div className="w-48 h-[2px] bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-neon to-purple-500 rounded-full animate-[loading_1.4s_ease-in-out_infinite]" />
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
      <div className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none z-[1]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }}></div>
      
      {/* Premium Cinematic Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-[0] overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-neon/10 blur-[150px] rounded-full mix-blend-screen animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-purple-600/10 blur-[150px] rounded-full mix-blend-screen" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[40%] left-[20%] w-[40vw] h-[40vw] bg-blue-600/5 blur-[150px] rounded-full mix-blend-screen animate-pulse-slow" style={{ animationDelay: '4s' }} />
      </div>

      <nav className="relative z-20 px-4 sm:px-6 py-4 sm:py-8 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate.push('/')}>
          <Ghost className="w-6 h-6 sm:w-8 sm:h-8 text-neon group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
          <span className="text-xl sm:text-2xl font-black tracking-tighter">
            <span className="group-hover:text-neon transition-colors">OTHR</span>
            <span className="text-neon group-hover:text-white transition-colors">HALFF</span>
          </span>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-bold text-gray-400 uppercase tracking-widest">
          <a href="#features" className="hover:text-neon transition-colors relative group">
            Features
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-neon group-hover:w-full transition-all duration-300" />
          </a>
          <Link href="/blog" className="hover:text-neon transition-colors relative group">
            Blog
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-neon group-hover:w-full transition-all duration-300" />
          </Link>
          <Link href="/developers" className="hover:text-neon transition-colors relative group">
            Meet the Developers
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-neon group-hover:w-full transition-all duration-300" />
          </Link>
          <Link href="/safety" className="hover:text-neon transition-colors relative group">
            Safety
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-neon group-hover:w-full transition-all duration-300" />
          </Link>
        </div>
        <NeonButton onClick={onEnter} variant="secondary" className="text-xs px-4 sm:px-6 hover:shadow-[0_0_20px_rgba(255,0,127,0.5)] transition-shadow">
          Log In
        </NeonButton>
      </nav>

      {/* 1. HERO SECTION */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 py-12 sm:py-20 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full text-left">
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900/80 border border-neon/30 mb-8 hover:border-neon/60 hover:bg-gray-900 transition-all duration-300 cursor-default group max-w-max"
              style={{
                opacity: textRevealed ? 1 : 0,
                transform: textRevealed ? 'translateY(0)' : 'translateY(-20px)',
                transition: 'all 0.5s ease-out',
              }}
            >
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wider group-hover:text-white transition-colors">
                Exclusively for University Students
              </span>
              <Sparkles className="w-3 h-3 text-neon opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black mb-4 sm:mb-6 tracking-tighter leading-none font-display text-white">
              <AnimatedText text="FIND YOUR" delay={200} />
              <br />
              <span className="drop-shadow-[0_0_30px_rgba(255,0,127,0.5)]">
                <AnimatedText text="OTHRHALFF" delay={600} isGradient />
              </span>
            </h1>

            <p
              className="text-base sm:text-lg md:text-xl text-gray-400 max-w-xl mb-8 sm:mb-12 leading-relaxed"
              style={{
                opacity: textRevealed ? 1 : 0,
                transform: textRevealed ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.8s ease-out 1.2s',
              }}
            >
              The exclusive network mapped to your exact campus.
              <span className="text-gray-300"> Connect with the people who pass you every day. No randoms. Just chemistry.</span>
            </p>

            <div
              style={{
                opacity: textRevealed ? 1 : 0,
                transform: textRevealed ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.9)',
                transition: 'all 0.6s ease-out 1.5s',
              }}
            >
              <button
                onClick={onEnter}
                className="group px-6 py-4 md:px-12 md:py-6 bg-neon text-white font-black text-sm sm:text-base md:text-xl uppercase tracking-wider rounded-full hover:scale-105 active:scale-95 transition-all duration-300 shadow-[0_0_40px_rgba(255,0,127,0.6)] hover:shadow-[0_0_80px_rgba(255,0,127,0.9)] max-w-max"
              >
                <span className="flex items-center gap-2 sm:gap-3">
                  <span>Find Your Othrhalff</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-2 transition-transform duration-300" />
                </span>
              </button>
            </div>
          </div>

          {/* Hero Mascot Visual Centerpiece */}
          <div className="lg:col-span-5 flex justify-center">
            <ScrollReveal className="w-full max-w-md">
              <div className="relative rounded-[32px] overflow-hidden border border-neon/30 shadow-[0_0_50px_rgba(255,0,127,0.25)] bg-[#0b0714] p-2 hover:border-neon/60 transition-all duration-500">
                <img 
                  src="/hero_mascot_valley.png" 
                  alt="Mascot Valley Hero" 
                  className="w-full h-auto rounded-[24px] object-cover"
                />
              </div>
            </ScrollReveal>
          </div>
        </div>

        {/* PAGE FLOW CONTAINER */}
        <div className="mt-16 sm:mt-32 md:mt-48 w-full relative z-10 flex flex-col gap-24 sm:gap-32 md:gap-48 pb-16 md:pb-32">
          
          {/* Main Video Reveal */}
          <ScrollReveal>
            <div className="max-w-[100rem] mx-auto px-4 sm:px-6 w-full relative">
              <div className="relative w-full aspect-[4/5] sm:aspect-video lg:aspect-[2.5/1] group">
                <video 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  preload="none"
                  src="/blog/go-beyond-dating.mp4" 
                  style={{ borderRadius: '40px' }}
                  className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-90 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-[1.5s] ease-[cubic-bezier(0.25,1,0.5,1)]" 
                />
              </div>
            </div>
          </ScrollReveal>

          {/* 2. TAGLINE & STATS SECTION (Who We Are) */}
          <div id="features" className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col text-left">
              <span className="text-neon block text-lg sm:text-2xl mb-4 font-bold tracking-widest uppercase">01 / Connection</span>
              <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight font-display mb-6">
                "Find the right<br/>that fits right."
              </h2>
              <h3 className="text-2xl sm:text-3.5xl font-bold leading-normal font-display text-transparent bg-clip-text bg-gradient-to-r from-neon to-purple-500 mb-6" style={{ fontFamily: 'Teko, sans-serif', letterSpacing: '0.05em' }}>
                जो फिट बैठे, वही सही।
              </h3>
              <p className="text-xl text-gray-400 font-light leading-relaxed max-w-md">
                No awkward bios or endless questionnaire pages. We simplify peer networking by matching you with college mates based on immediate vibes, schedules, and active student channels.
              </p>
            </div>
            
            <div className="flex justify-center">
              <ScrollReveal className="w-full max-w-md">
                <div className="relative bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10 p-8 rounded-3xl backdrop-blur-2xl shadow-[0_0_80px_rgba(255,0,127,0.05)] text-center overflow-hidden group">
                  {/* Floating mascot space placeholder */}
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-neon/5 rounded-full blur-xl pointer-events-none" />
                  
                  <div className="font-display font-black text-7xl text-white tracking-tighter mb-2 group-hover:scale-105 transition-transform duration-500">
                    300+
                  </div>
                  <div className="text-neon font-black tracking-widest uppercase text-xs sm:text-sm mb-4">
                    Active Campus Peers
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed mb-6">
                    Connect dynamically in real-time with students currently active in local campus circles.
                  </p>
                  
                  {/* Glowing line pulse */}
                  <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-neon/40 to-transparent relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400 to-transparent w-1/3 animate-[shimmer_2s_infinite]" />
                  </div>
                  <style>{`
                    @keyframes shimmer {
                      0% { transform: translateX(-100%); }
                      100% { transform: translateX(300%); }
                    }
                  `}</style>
                </div>
              </ScrollReveal>
            </div>
          </div>

          {/* 3. GHOST MODE & INTERACTIVE SWIPING (Asymmetric Left Phone) */}
          <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-24 grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
            {/* 3D phone mockup */}
            <div className="md:col-span-5 flex justify-center order-last md:order-first">
              <ScrollReveal>
                <TiltedPhone tiltDirection="left" title="Swipe & Match Screen">
                  <div className="w-full h-full p-4 flex flex-col justify-between relative bg-dots-pattern pt-12">
                    <div className="flex justify-between items-center w-full px-2">
                      <div className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Delhi University</div>
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    </div>
                    
                    <div className="flex-1 my-4 bg-gray-950/80 rounded-2xl border border-neon/30 p-4 flex flex-col justify-between shadow-[0_0_20px_rgba(255,0,127,0.15)] relative overflow-hidden">
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-neon/10 border border-neon/30 text-[9px] font-bold text-neon">
                        98% Vibe Match
                      </div>
                      
                      <div className="flex flex-col gap-2 mt-4">
                        <div className="w-8 h-8 rounded-full bg-gray-900 border border-white/10 flex items-center justify-center">
                          <Ghost className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="text-[11px] font-medium text-gray-300">"Looking for someone to argue about Christopher Nolan movies with."</div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="px-2 py-0.5 rounded bg-gray-900 border border-white/5 text-[9px] text-gray-400">Cinema</span>
                        <span className="px-2 py-0.5 rounded bg-gray-900 border border-white/5 text-[9px] text-gray-400">Indie Rock</span>
                        <span className="px-2 py-0.5 rounded bg-gray-900 border border-white/5 text-[9px] text-gray-400">Late Night</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-center gap-4 pb-2">
                      <div className="w-10 h-10 rounded-full bg-gray-900 border border-white/10 flex items-center justify-center cursor-pointer hover:border-red-500/50 hover:bg-red-950/15 transition-all">
                        <Heart className="w-4 h-4 text-red-500" />
                      </div>
                      <div className="w-10 h-10 rounded-full bg-neon border border-neon/30 flex items-center justify-center cursor-pointer hover:scale-105 transition-all">
                        <ArrowRight className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </div>
                </TiltedPhone>
              </ScrollReveal>
            </div>
            
            <div className="md:col-span-7 flex flex-col text-left justify-center">
              <span className="text-purple-400 block text-lg sm:text-2xl mb-4 font-bold tracking-widest uppercase">02 / Ghost Mode</span>
              <h3 className="text-4xl sm:text-5xl font-black text-white leading-tight font-display mb-6">
                Chemistry First,<br/>Identity Second.
              </h3>
              <p className="text-xl text-gray-400 font-light leading-relaxed mb-6">
                Identity is locked. Visuals are hidden. Connect strictly through shared aesthetics, interests, and raw conversation. Choose to reveal your face only when the vibe is fully verified.
              </p>
              <ul className="space-y-3 text-gray-400 font-light text-base">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-neon"></span>
                  Interactive campus radar matching.
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-neon"></span>
                  Direct, fluid text matching.
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-neon"></span>
                  Strict university credential checks.
                </li>
              </ul>
            </div>
          </div>

          {/* 4. VIRTUAL DATE AUDITORIUMS (Asymmetric Right Phone) */}
          <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-24 grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
            <div className="md:col-span-7 flex flex-col text-left justify-center">
              <span className="text-neon block text-lg sm:text-2xl mb-4 font-bold tracking-widest uppercase">03 / Experience</span>
              <h3 className="text-4xl sm:text-5xl font-black text-white leading-tight font-display mb-6">
                Synchronized<br/>Virtual Dates.
              </h3>
              <p className="text-xl text-gray-400 font-light leading-relaxed mb-6">
                Don't just text into the void. Step into synchronized virtual auditoriums. Share a cinematic movie watch party or stream audio tracks side-by-side with dynamic, floating live chat.
              </p>
              <ul className="space-y-3 text-gray-400 font-light text-base">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                  Synchronous cinema playback.
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                  Shared music playlists.
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                  Floating live overlay chat.
                </li>
              </ul>
            </div>
            
            {/* 3D phone mockup 2 */}
            <div className="md:col-span-5 flex justify-center">
              <ScrollReveal>
                <TiltedPhone tiltDirection="right" title="Cinema Watch Party">
                  <div className="w-full h-full flex flex-col justify-between relative bg-black pt-12">
                    <div className="h-[45%] w-full bg-gray-950 border-b border-white/5 relative flex items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-950/50 to-transparent z-0" />
                      <PlaySquare className="w-12 h-12 text-purple-400 relative z-10 animate-pulse" />
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-[8px] text-white">
                        Interstellar watch party
                      </div>
                    </div>
                    
                    <div className="flex-1 p-3 flex flex-col justify-between overflow-hidden bg-gray-950/50">
                      <div className="flex flex-col gap-2 overflow-y-auto max-h-[140px] pt-2 text-left">
                        <div className="bg-gray-900/80 border border-white/5 p-2 rounded-xl rounded-tl-none self-start max-w-[85%]">
                          <div className="text-[8px] text-purple-400 font-bold mb-0.5">DU Peer</div>
                          <p className="text-[10px] text-gray-300">this movie is mindbending</p>
                        </div>
                        <div className="bg-neon/10 border border-neon/20 p-2 rounded-xl rounded-tr-none self-end max-w-[85%]">
                          <div className="text-[8px] text-neon font-bold mb-0.5">You</div>
                          <p className="text-[10px] text-gray-300">the black hole scene is legendary</p>
                        </div>
                      </div>
                      
                      <div className="w-full mt-2">
                        <div className="flex justify-between items-center text-[8px] text-gray-500 mb-1">
                          <span>01:42:15</span>
                          <span>02:49:00</span>
                        </div>
                        <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-neon to-purple-500 rounded-full" style={{ width: '60%' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </TiltedPhone>
              </ScrollReveal>
            </div>
          </div>

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
            
            <div className="w-[110vw] transform -rotate-2 bg-[#ff007f]/5 backdrop-blur-md border-y border-neon/30 py-6 sm:py-10 shadow-[0_0_80px_rgba(255,0,127,0.1)] z-10">
              <div className="flex whitespace-nowrap overflow-hidden py-2 border-y border-neon/10">
                <div className="animate-marquee-left text-white/90 font-black text-5xl sm:text-7xl md:text-9xl uppercase tracking-tighter block">
                  <span className="mx-8 drop-shadow-[0_0_15px_rgba(255,0,127,0.8)]">FIND YOUR GYM SPOTTER • <span className="text-neon/70">ROW 2</span> LECTURE PARTNER • LATE NIGHT STUDY BUDDY •</span>
                  <span className="mx-8 drop-shadow-[0_0_15px_rgba(255,0,127,0.8)]">FIND YOUR GYM SPOTTER • <span className="text-neon/70">ROW 2</span> LECTURE PARTNER • LATE NIGHT STUDY BUDDY •</span>
                </div>
              </div>
            </div>

            <div className="w-[110vw] transform rotate-1 -mt-8 sm:-mt-12 bg-blue-900/10 backdrop-blur-lg border-y border-blue-500/30 py-4 sm:py-8 shadow-[0_0_80px_rgba(59,130,246,0.1)] z-0 mix-blend-screen">
              <div className="flex whitespace-nowrap overflow-hidden py-2 border-y border-blue-500/10">
                <div className="animate-marquee-right text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 font-light italic text-4xl sm:text-6xl md:text-8xl uppercase tracking-widest block">
                  <span className="mx-12">THE MICROSCOPIC GEOGRAPHY OF COLLEGE •</span>
                  <span className="mx-12">THE MICROSCOPIC GEOGRAPHY OF COLLEGE •</span>
                  <span className="mx-12">THE MICROSCOPIC GEOGRAPHY OF COLLEGE •</span>
                  <span className="mx-12">THE MICROSCOPIC GEOGRAPHY OF COLLEGE •</span>
                </div>
              </div>
            </div>
            
            <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 mt-16 sm:mt-24 relative z-20 text-center">
              <ScrollReveal>
                <div className="w-24 h-24 rounded-3xl mx-auto bg-[#05000a] border border-neon/30 flex items-center justify-center mb-8 shadow-[0_20px_60px_rgba(255,0,127,0.2)] rotate-3">
                  <Users className="w-10 h-10 text-neon drop-shadow-[0_0_20px_rgba(255,0,127,0.8)]" />
                </div>
                <h3 className="text-[clamp(2.5rem,5vw,4.5rem)] font-black text-white tracking-tighter leading-none mb-8">
                  Hyper-Local <br className="sm:hidden" /><span className="text-transparent bg-clip-text bg-gradient-to-r from-neon to-purple-500">Synergy.</span>
                </h3>
                <p className="text-gray-400 text-xl md:text-3xl font-light max-w-3xl mx-auto leading-relaxed">
                  We meticulously map the microscopic geography of your daily college life. We don't ask for generic profiles—we look at the spaces you inhabit. The perfect connection isn't oceans away. It's right in your lecture hall.
                </p>
              </ScrollReveal>
            </div>
          </div>

          {/* 5. ASCII ART BRAND BRANDING SECTION */}
          {asciiArt && (
            <ScrollReveal className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-24 text-center">
              <div className="bg-black/80 border border-white/5 p-6 sm:p-10 rounded-3xl shadow-[0_0_100px_rgba(255,0,127,0.05)] relative overflow-hidden group">
                <div className="absolute top-4 left-4 flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/40" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/40" />
                  <span className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/40" />
                </div>
                <div className="text-right text-[10px] text-neon font-mono select-none tracking-widest opacity-60 mb-6 uppercase">
                  Console Viewer // Mascot ASCII
                </div>
                
                <pre className="font-mono text-[7px] sm:text-[9px] md:text-[11px] text-neon text-left overflow-x-auto leading-tight bg-[#040108] p-6 rounded-2xl border border-neon/15 shadow-inner drop-shadow-neon select-all whitespace-pre">
                  {asciiArt}
                </pre>
                
                <div className="mt-6 text-xs text-gray-500 font-mono tracking-wider">
                  Rooted in old-school internet heritage. Redefined for campus synergy.
                </div>
              </div>
            </ScrollReveal>
          )}

          {/* 6. FINAL CALL TO ACTION & CONVERSION */}
          <ScrollReveal className="mt-4">
            <div className="max-w-3xl mx-auto px-4 w-full flex flex-col items-center justify-center pb-16">
              
              {/* Custom Winking Ghost Mascot Video */}
              <div className="relative w-40 h-40 rounded-[28px] overflow-hidden border border-neon/30 mb-8 shadow-[0_0_40px_rgba(255,0,127,0.3)] bg-black">
                <video 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  src="/ghost_wink.mp4" 
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Ticket Asset Rip */}
              <div className="relative w-full max-w-md mx-auto mb-2 z-10">
                <ChromaKeyVideo 
                  src="/blog/ticket-rip.webm" 
                  className="w-full h-auto"
                  rThreshold={100}
                />
                <div className="absolute inset-0 bg-neon/10 blur-[80px] rounded-full pointer-events-none -z-10" />
              </div>

              {/* Divider */}
              <div className="w-24 h-px bg-gradient-to-r from-transparent via-neon/60 to-transparent mb-6" />

              {/* Tagline */}
              <p className="text-gray-400 text-xs sm:text-sm font-medium tracking-[0.25em] uppercase mb-8 text-center">
                Our biggest, baddest & loveliest updates are yet to arrive.
              </p>
              
              {/* CTA Button */}
              <button
                onClick={onEnter}
                className="group relative px-10 py-4 sm:px-14 sm:py-5 bg-gradient-to-r from-neon to-purple-600 text-white font-bold text-base sm:text-lg uppercase tracking-[0.2em] rounded-full hover:scale-105 active:scale-95 transition-all duration-300 shadow-[0_0_40px_rgba(255,0,127,0.35)] hover:shadow-[0_0_60px_rgba(255,0,127,0.5)] overflow-hidden"
              >
                <div className="absolute inset-0 w-full h-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <span className="flex items-center gap-3 relative z-10">
                  Enter Othrhalff
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                </span>
              </button>
            </div>
          </ScrollReveal>
        </div>
      </main>

      {/* Footer Section */}
      <footer className="relative z-10 border-t border-gray-900 bg-black/80 backdrop-blur-xl pt-10 sm:pt-16 pb-6 sm:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 mb-8 sm:mb-12">
            <div className="col-span-2 md:col-span-2">
              <div className="flex items-center gap-2 mb-3 sm:mb-4 cursor-pointer group" onClick={() => navigate.push('/')}>
                <Ghost className="w-5 h-5 sm:w-6 sm:h-6 text-neon group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
                <span className="font-black tracking-tighter text-lg sm:text-xl text-white">
                  <span className="group-hover:text-neon transition-colors">OTHR</span>
                  <span className="text-neon group-hover:text-white transition-colors">HALFF</span>
                </span>
              </div>
              <p className="text-gray-500 text-xs sm:text-sm leading-relaxed max-w-sm mb-4 sm:mb-6">
                The safest way to meet people on campus. Built for students, by students.
                Find your vibe without the pressure.
              </p>
              <div className="flex gap-3 sm:gap-4">
                <a href="https://www.instagram.com/othrhalff/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-900 flex items-center justify-center text-gray-400 hover:bg-neon hover:text-white hover:scale-110 hover:rotate-6 transition-all duration-300">
                  <Instagram className="w-4 h-4 sm:w-5 sm:h-5" />
                </a>
                <a href="#" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-900 flex items-center justify-center text-gray-400 hover:bg-neon hover:text-white hover:scale-110 hover:-rotate-6 transition-all duration-300">
                  <Twitter className="w-4 h-4 sm:w-5 sm:h-5" />
                </a>
                <Link href="/about" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-900 flex items-center justify-center text-gray-400 hover:bg-neon hover:text-white hover:scale-110 hover:rotate-6 transition-all duration-300">
                  <Ghost className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold uppercase tracking-widest text-xs sm:text-sm mb-4 sm:mb-6">Company</h4>
              <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-500">
                <li><Link href="/about" className="hover:text-neon hover:translate-x-1 inline-block transition-all">About Us</Link></li>
                <li><Link href="/developers" className="hover:text-neon hover:translate-x-1 inline-block transition-all">Developers</Link></li>
                <li><Link href="/careers" className="hover:text-neon hover:translate-x-1 inline-block transition-all">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-neon hover:translate-x-1 inline-block transition-all">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold uppercase tracking-widest text-xs sm:text-sm mb-4 sm:mb-6">Legal</h4>
              <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-500">
                <li><Link href="/privacy" className="hover:text-neon hover:translate-x-1 inline-block transition-all">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-neon hover:translate-x-1 inline-block transition-all">Terms</Link></li>
                <li><Link href="/safety" className="hover:text-neon hover:translate-x-1 inline-block transition-all">Safety</Link></li>
                <li><Link href="/guidelines" className="hover:text-neon hover:translate-x-1 inline-block transition-all">Guidelines</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 text-xs">&copy; {new Date().getFullYear()} Othrhalff Inc. All rights reserved.</p>
            <p className="text-gray-500 text-xs font-medium flex items-center gap-1">
              Built with <Heart className="w-3 h-3 text-neon fill-current animate-pulse" /> to help find what you'd love
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
