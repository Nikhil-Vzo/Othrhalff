"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Ghost, Heart, ArrowRight, Instagram, Twitter, Zap, Lock, Compass, Sparkles, Radio, Users, Flame, ArrowUpRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
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

const Scene2PhoneReveal: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const totalHeight = rect.height - windowHeight;
      if (totalHeight <= 0) return;
      
      const progress = Math.max(0, Math.min(1, -rect.top / totalHeight));

      if (progress < 0.22) {
        setActiveStep(0);
      } else if (progress < 0.48) {
        setActiveStep(1);
      } else if (progress < 0.74) {
        setActiveStep(2);
      } else {
        setActiveStep(3);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Asset mapping — Step 1: Discover, Step 2: Confessions, Step 3: Notifications
  const phoneScreens = [
    {
      img: '/mockups/phone-off.png',
      scale: 'scale-95',
      tag: '00 / STANDBY',
      badge: 'POWER OFF',
      title: 'Your phone can help you find your vibe.',
      subtitle: 'Without Othrhalff, it\'s just a dark screen. Scroll down to power on.',
    },
    {
      img: '/mockups/phone-discover.png',
      scale: 'scale-100',
      tag: '01 / DISCOVER',
      badge: 'LIVE RADAR',
      title: 'Micro-Local Campus Radar',
      subtitle: 'Connect dynamically with verified students active in your immediate campus circles.',
    },
    {
      img: '/mockups/phone-confession.png',
      scale: 'scale-100',
      tag: '02 / CONFESSIONS',
      badge: 'RAW VIBES',
      title: 'Chemistry First, Identity Second',
      subtitle: 'Locked profiles. Connect strictly through raw conversation and shared interests.',
    },
    {
      img: '/mockups/phone-notification.png',
      scale: 'scale-100',
      tag: '03 / NOTIFICATIONS',
      badge: 'INSTANT MATCH',
      title: 'Instant Campus Synergy',
      subtitle: 'Match on class schedules, cinema taste & study routines.',
    },
  ];

  const activeTheme = phoneScreens[activeStep];

  return (
    <div ref={containerRef} className="relative h-[340vh] w-full bg-[#07030d] overflow-x-clip">
      
      {/* Sticky Viewport Frame */}
      <div className="sticky top-0 h-screen w-full flex flex-col justify-between py-6 sm:py-10 relative overflow-clip">
        
        {/* DIAGONAL SPLIT BACKGROUND: Architectural Matte & White Panel */}
        <div className="absolute inset-0 z-0 flex pointer-events-none">
          {/* Left Dark Matte Base */}
          <div className="w-full md:w-1/2 h-full bg-[#07030d] relative border-r border-white/5" />
          {/* Right Diagonal White Architectural Cut (MD+ Screens) */}
          <div 
            className="hidden md:block w-1/2 h-full bg-[#faf8fb] transition-all duration-700 relative shadow-[-30px_0_90px_rgba(0,0,0,0.6)]"
            style={{
              clipPath: 'polygon(12% 0, 100% 0, 100% 100%, 0% 100%)'
            }}
          />
        </div>

        {/* 2. MAIN CONTENT GRID (Standardized Hero 3D Phone + Refined Typography) */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 md:px-12 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-12 items-center relative z-10 my-auto">

          {/* LEFT COLUMN (6 Cols MD, 7 Cols LG): Hero Scaled 3D Phone Mockup (Positioned Lower) */}
          <div className="md:col-span-6 lg:col-span-7 flex flex-col items-center justify-center relative order-2 md:order-1 translate-y-8 md:translate-y-12">
            
            {/* Master Phone Render Stack */}
            <div className="relative z-10 w-[300px] sm:w-[400px] md:w-[440px] lg:w-[480px] h-[400px] sm:h-[570px] md:h-[620px] lg:h-[660px] flex items-center justify-center">
              
              {/* CINEMATIC POWER-ON LIGHT REVEAL BEHIND PHONE */}
              <div 
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] sm:w-[350px] md:w-[420px] h-[330px] sm:h-[490px] md:h-[570px] rounded-[50px] bg-gradient-to-tr from-[#F45D9B] via-[#9333EA] to-[#3B82F6] transition-all duration-1000 ease-out pointer-events-none ${
                  activeStep > 0
                    ? 'opacity-85 scale-110 blur-[60px] md:blur-[80px]'
                    : 'opacity-0 scale-50 blur-[120px]'
                }`}
              />

              {/* Radiant Ambient Core Light */}
              <div 
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] sm:w-[260px] h-[240px] sm:h-[360px] rounded-full bg-[#F45D9B] transition-all duration-1000 ease-out pointer-events-none ${
                  activeStep > 0
                    ? 'opacity-90 scale-100 blur-[40px]'
                    : 'opacity-0 scale-30 blur-[100px]'
                }`}
              />

              {phoneScreens.map((screen, idx) => (
                <div
                  key={`phone-state-${idx}`}
                  className={`absolute inset-0 w-full h-full flex items-center justify-center transition-all duration-700 ease-out ${
                    activeStep === idx
                      ? 'opacity-100 scale-100 translate-y-0 z-20 filter drop-shadow-[0_25px_50px_rgba(0,0,0,0.9)] md:drop-shadow-[0_35px_70px_rgba(0,0,0,0.95)]'
                      : 'opacity-0 scale-[0.95] translate-y-4 z-10 pointer-events-none'
                  }`}
                >
                  <img
                    src={screen.img}
                    alt={screen.tag}
                    className={`max-w-full max-h-full object-contain transition-all duration-700 hover:scale-[1.02] ${screen.scale || 'scale-100'}`}
                    style={{ imageRendering: '-webkit-optimize-contrast' }}
                  />
                </div>
              ))}
            </div>

          </div>

          {/* RIGHT COLUMN (6 Cols MD, 5 Cols LG): Editorial Typography */}
          <div className="md:col-span-6 lg:col-span-5 flex flex-col items-center md:items-start text-center md:text-left z-20 order-1 md:order-2 gap-4 md:pl-6">
            
            {/* Step Counter Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#F45D9B]/15 md:bg-[#F45D9B]/10 border border-[#F45D9B]/30 text-[#F45D9B] text-[11px] font-mono tracking-widest uppercase">
              <span>{activeTheme.tag}</span>
            </div>

            {/* Headline */}
            <h2 key={`title-${activeStep}`} className="text-xl sm:text-2xl md:text-3xl lg:text-[2.2rem] font-bold tracking-tight text-white md:text-gray-950 leading-[1.2] font-display transition-all duration-500 animate-fadeIn">
              {activeTheme.title}
            </h2>

            {/* Subtitle */}
            <p key={`sub-${activeStep}`} className="text-xs sm:text-sm md:text-[15px] text-white/80 md:text-gray-500 leading-relaxed max-w-sm transition-all duration-500 animate-fadeIn font-medium">
              {activeTheme.subtitle}
            </p>

          </div>

        </div>

        {/* 3. BOTTOM FOOTER: Step Navigation Dots & Scroll Guide */}
        <div className="relative z-30 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2.5">
            {phoneScreens.map((_, idx) => (
              <button
                key={`dot-${idx}`}
                onClick={() => setActiveStep(idx)}
                className={`h-2 rounded-full transition-all duration-500 ${
                  activeStep === idx ? 'w-8 bg-[#F45D9B]' : 'w-2 bg-white/40 md:bg-gray-400 hover:bg-gray-500'
                }`}
              />
            ))}
          </div>
          {activeStep === 0 && (
            <p className="text-xs text-white/60 md:text-gray-500 tracking-widest uppercase animate-pulse flex items-center gap-1.5 font-mono">
              <span>↓</span> Scroll down to power on
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

/* VIRTUAL MEETUP GROUNDS SECTION WITH GAME CONSOLE MP4 */
const VirtualMeetupSection: React.FC = () => {
  return (
    <section className="relative z-10 w-full bg-[#FAF7EF] text-gray-900 py-24 sm:py-36 px-6 sm:px-12 overflow-hidden border-t border-b border-gray-300/40">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@700;800;900&family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&display=swap');
        .font-unbounded {
          font-family: 'Unbounded', sans-serif;
        }
        .font-bricolage {
          font-family: 'Bricolage Grotesque', sans-serif;
        }
      `}</style>
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        
        {/* LEFT COLUMN: Clean Copy Hierarchy with Generous Spacing */}
        <div className="lg:col-span-6 flex flex-col items-start text-left space-y-8 sm:space-y-10">
          
          {/* Headline */}
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-gray-950 font-unbounded leading-[1.1]">
            College <br />
            Just Got <br />
            <span className="text-[#F45D9B]">Multiplayer.</span>
          </h2>

          {/* Human Paragraph */}
          <p className="text-base sm:text-xl text-gray-600 font-medium max-w-md leading-relaxed">
            Explore a shared virtual campus, hang out between classes, and bump into people naturally.
          </p>

          {/* CTA Button */}
          <div>
            <button className="px-7 py-3.5 rounded-full bg-[#07030d] text-white font-bold text-sm tracking-wide shadow-lg hover:bg-[#F45D9B] hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2.5 group">
              <span>Watch Preview</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: Game Boy Console + Screen Glow */}
        <div className="lg:col-span-6 flex items-center justify-center relative">
          
          {/* Subtle Pink Screen Glow Emitting Underneath Console */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-[#F45D9B]/15 blur-3xl pointer-events-none" />

          {/* Video — Seamless #FAF7EF Matched Console */}
          <video 
            src="/game.mp4" 
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-full max-w-[460px] h-auto object-contain relative z-10"
          />

        </div>

      </div>
    </section>
  );
};

const MarqueeBar: React.FC = () => {
  return (
    <div className="relative w-full overflow-hidden flex flex-col items-center bg-[#07030d] py-0">
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

      {/* Top Band — tilted -2°, hot pink, scrolls left */}
      <div className="w-[110vw] transform -rotate-2 bg-[#F45D9B]/5 backdrop-blur-md border-y border-[#F45D9B]/30 py-6 sm:py-10 shadow-[0_0_80px_rgba(244,93,155,0.1)] z-10">
        <div className="flex whitespace-nowrap overflow-hidden py-2 border-y border-[#F45D9B]/10">
          <div className="animate-marquee-left text-white/90 font-black text-5xl sm:text-7xl md:text-9xl uppercase tracking-tighter block">
            <span className="mx-8 drop-shadow-[0_0_15px_rgba(244,93,155,0.8)]">FIND YOUR GYM SPOTTER • <span className="text-[#F45D9B]/70">ROW 2</span> LECTURE PARTNER • LATE NIGHT STUDY BUDDY •</span>
            <span className="mx-8 drop-shadow-[0_0_15px_rgba(244,93,155,0.8)]">FIND YOUR GYM SPOTTER • <span className="text-[#F45D9B]/70">ROW 2</span> LECTURE PARTNER • LATE NIGHT STUDY BUDDY •</span>
          </div>
        </div>
      </div>

      {/* Bottom Band — tilted +1°, blue/cyan, scrolls right, overlaps */}
      <div className="w-[110vw] transform rotate-1 -mt-8 sm:-mt-12 bg-blue-900/10 backdrop-blur-lg border-y border-blue-500/30 py-4 sm:py-8 shadow-[0_0_80px_rgba(59,130,246,0.1)] z-0 mix-blend-screen">
        <div className="flex whitespace-nowrap overflow-hidden py-2 border-y border-blue-500/10">
          <div className="animate-marquee-right text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 font-light italic text-4xl sm:text-6xl md:text-8xl uppercase tracking-widest block">
            <span className="mx-12">THE MICROSCOPIC GEOGRAPHY OF COLLEGE •</span>
            <span className="mx-12">THE MICROSCOPIC GEOGRAPHY OF COLLEGE •</span>
            <span className="mx-12">THE MICROSCOPIC GEOGRAPHY OF COLLEGE •</span>
          </div>
        </div>
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

  // Enable document scrolling on Landing page, restore default overflow on unmount
  useEffect(() => {
    const origHtmlOverflow = document.documentElement.style.overflow;
    const origBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = 'unset';
    document.body.style.overflow = 'unset';

    return () => {
      document.documentElement.style.overflow = origHtmlOverflow;
      document.body.style.overflow = origBodyOverflow;
    };
  }, []);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) - 0.5;
      setMousePos({ x, y: (e.clientY / window.innerHeight) - 0.5 });
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);





  return (
    <div className="min-h-screen bg-[#07030d] text-white font-sans selection:bg-[#F45D9B] selection:text-white relative overflow-x-clip flex flex-col">
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
        {/* Desktop Hero Image (Landscape 1536x1024) */}
        <img 
          src="/landing_hero-bg.png?v=10" 
          alt="Hero Background Desktop" 
          className="hidden md:block w-full h-full object-cover object-center"
          style={{ imageRendering: '-webkit-optimize-contrast' }}
        />
        {/* Mobile Hero Image (Portrait 853x1844) */}
        <img 
          src="/landing_hero-mobile-bg.png?v=10" 
          alt="Hero Background Mobile" 
          className="block md:hidden w-full h-full object-cover object-center"
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
      <main className="relative z-10 min-h-[90vh] sm:min-h-screen flex flex-col items-center justify-center text-center px-4 pt-28 pb-16 max-w-7xl mx-auto w-full">
        <div className="relative z-10 max-w-3xl flex flex-col items-center">
          {/* Soft radial scrim behind text block */}
          <div 
            className="absolute inset-[-40px_-60px] pointer-events-none z-[-1]"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.35) 0%, transparent 70%)'
            }}
          />

          <h1 className="text-5xl sm:text-7xl font-semibold tracking-tight text-white mb-6 leading-[1.1] font-display max-w-2xl">
            {"Find your people.".split(' ').map((word, i) => (
              <span
                key={i}
                className="inline-block whitespace-nowrap transition-all duration-500 mr-[0.25em]"
                style={{
                  opacity: textRevealed ? 1 : 0,
                  transform: textRevealed ? 'translateY(0) rotateX(0)' : 'translateY(40px) rotateX(-90deg)',
                  transitionDelay: `${200 + i * 120}ms`,
                }}
              >
                {word}
              </span>
            ))}
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
      </main>

      {/* 2. PRODUCT REVEAL SCENERY: STICKY 3D PHONE SCROLLYTELLING */}
      <section className="relative z-10 w-full bg-[#07030d] pt-12">
        <Scene2PhoneReveal />
      </section>

      {/* 3. VIRTUAL MEETUP GROUNDS SECTION (GAME CONSOLE MP4 & #FAF7EE BG) */}
      <VirtualMeetupSection />

      {/* 4. MARQUEE TICKER BAR */}
      <MarqueeBar />

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
