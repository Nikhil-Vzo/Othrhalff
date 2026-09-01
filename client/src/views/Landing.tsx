"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  Clock,
  Flame,
  Ghost,
  Instagram,
  Lock,
  MessageCircle,
  Phone,
  Radio,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter as useNavigate } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from '../components/LoadingState';
import { VelocityScroll } from '@/components/ui/VelocityScroll';
import { TextHoverEffect, FooterBackgroundGradient } from '@/components/ui/hover-footer';
import {
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
  NavBody,
  NavItems,
  Navbar,
  NavbarButton,
  NavbarLogo,
} from '@/components/ui/resizable-navbar';

const sceneEase = [0.16, 1, 0.3, 1] as const;

const reveal = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: sceneEase } },
};

const MagneticButton: React.FC<{ children: React.ReactNode; onClick: () => void; dark?: boolean }> = ({ children, onClick, dark = false }) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  return (
    <button
      onClick={onClick}
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setOffset({ x: (event.clientX - rect.left - rect.width / 2) * 0.18, y: (event.clientY - rect.top - rect.height / 2) * 0.18 });
      }}
      onMouseLeave={() => setOffset({ x: 0, y: 0 })}
      style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` }}
      className={`group inline-flex items-center gap-3 rounded-full px-6 py-3 text-sm font-bold transition-[transform,background,color,box-shadow] duration-300 ${dark ? 'bg-[#07030d] text-white hover:bg-[#F45D9B] hover:shadow-[0_16px_42px_rgba(244,93,155,0.3)]' : 'bg-white text-[#07030d] hover:shadow-[0_16px_42px_rgba(255,255,255,0.22)]'}`}
    >
      <span>{children}</span>
      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
    </button>
  );
};

const ArtDirectedExperience: React.FC = () => {
  const discoverRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: discoverRef, offset: ['start end', 'end start'] });
  const phoneY = useTransform(scrollYProgress, [0, 0.5, 1], [50, 0, -40]);
  const ringRotate = useTransform(scrollYProgress, [0, 1], [-8, 18]);

  const confessRef = useRef<HTMLElement>(null);
  const { scrollYProgress: confessScrollProgress } = useScroll({ target: confessRef, offset: ['start end', 'end start'] });
  const confessPhoneY = useTransform(confessScrollProgress, [0, 0.5, 1], [45, 0, -35]);
  const confessRingRotate = useTransform(confessScrollProgress, [0, 1], [15, -15]);

  const glimpseRef = useRef<HTMLElement>(null);
  const { scrollYProgress: glimpseScrollProgress } = useScroll({ target: glimpseRef, offset: ['start end', 'end start'] });
  const glimpsePhoneY = useTransform(glimpseScrollProgress, [0, 0.5, 1], [40, 0, -35]);
  const glimpseBackPhoneY = useTransform(glimpseScrollProgress, [0, 0.5, 1], [65, 10, -15]);
  const glimpseRingRotate = useTransform(glimpseScrollProgress, [0, 1], [12, -18]);

  const speedRef = useRef<HTMLElement>(null);
  const { scrollYProgress: speedScrollProgress } = useScroll({ target: speedRef, offset: ['start end', 'end start'] });
  const speedPhoneY = useTransform(speedScrollProgress, [0, 0.5, 1], [40, 0, -35]);
  const speedBackPhoneY = useTransform(speedScrollProgress, [0, 0.5, 1], [65, 10, -15]);
  const speedRingRotate = useTransform(speedScrollProgress, [0, 1], [-12, 18]);

  const chatRef = useRef<HTMLElement>(null);
  const { scrollYProgress: chatScrollProgress } = useScroll({ target: chatRef, offset: ['start end', 'end start'] });
  const chatPhoneY = useTransform(chatScrollProgress, [0, 0.5, 1], [40, 0, -35]);
  const chatLeftPhoneY = useTransform(chatScrollProgress, [0, 0.5, 1], [65, 10, -15]);
  const chatRightPhoneY = useTransform(chatScrollProgress, [0, 0.5, 1], [65, 10, -15]);
  const chatRingRotate = useTransform(chatScrollProgress, [0, 1], [14, -16]);

  return (
    <div id="experience">
      {/* 01 / DISCOVER SECTION */}
      <section ref={discoverRef} id="discover" className="relative isolate overflow-hidden bg-[#FAF7EF] px-5 py-20 sm:px-10 sm:py-28 lg:min-h-[100svh] lg:px-16 lg:py-32 text-[#0c0710]">
        {/* Subtle background dots & ambient atmospheric glow */}
        <div className="pointer-events-none absolute inset-0 z-0 opacity-25" style={{ backgroundImage: 'radial-gradient(rgba(12,7,16,.15) .75px, transparent .75px)', backgroundSize: '12px 12px' }} />
        <div className="pointer-events-none absolute -right-24 top-10 h-80 w-80 rounded-full bg-[#F45D9B]/10 blur-3xl z-0" />
        <div className="pointer-events-none absolute -left-20 bottom-10 h-72 w-72 rounded-full bg-pink-300/15 blur-3xl z-0" />

        {/* Decorative Circle Doodles & Orbital Rings */}
        <motion.div style={{ rotate: ringRotate }} className="pointer-events-none absolute -right-32 top-10 h-[34rem] w-[34rem] rounded-full border border-[#F45D9B]/20 sm:-right-20 sm:h-[46rem] sm:w-[46rem] z-0" />
        <div className="pointer-events-none absolute -right-16 top-24 h-[24rem] w-[24rem] rounded-full border border-dashed border-black/10 sm:h-[36rem] sm:w-[36rem] z-0" />

        <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-[.9fr_1.1fr] lg:gap-12">
          {/* Left Text Column */}
          <motion.div variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} className="relative z-10 max-w-xl">
            <h2 className="font-geist text-5xl font-black leading-[0.95] tracking-tight text-[#0c0710] sm:text-7xl lg:text-[5.5rem]">
              Your campus,<br />
              <span className="font-geraldine font-normal text-6xl text-[#F45D9B] sm:text-8xl lg:text-[7rem] tracking-normal inline-block mt-2">
                then the world.
              </span>
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-black/65 sm:text-lg">
              Meet study partners, gym spotters, and genuine friends between classes. Expand beyond when you&apos;re ready.
            </p>
          </motion.div>

          {/* Right Visual Column with Circular Doodles & Phone */}
          <div className="relative mx-auto flex min-h-[32rem] w-full max-w-[40rem] items-center justify-center sm:min-h-[42rem]">
            {/* Concentric Circle Doodles behind phone */}
            <div className="absolute h-[16rem] w-[16rem] rounded-full border border-[#F45D9B]/30 sm:h-[22rem] sm:w-[22rem]" />
            <div className="absolute h-[22rem] w-[22rem] rounded-full border border-dashed border-black/15 sm:h-[30rem] sm:w-[30rem]" />
            <div className="absolute h-[28rem] w-[28rem] rounded-full border border-black/10 sm:h-[38rem] sm:w-[38rem]" />

            {/* Floating Orbiting Accent Dot */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
              className="pointer-events-none absolute h-[22rem] w-[22rem] sm:h-[30rem] sm:w-[30rem]"
            >
              <span className="absolute -top-1.5 left-1/2 h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-[#F45D9B] shadow-[0_0_12px_#F45D9B]" />
            </motion.div>

            {/* Parallax Phone Mockup with Smooth Entrance and Hover Lift */}
            <motion.div
              style={{ y: phoneY }}
              initial={{ opacity: 0, y: 35, rotate: -2 }}
              whileInView={{ opacity: 1, y: 0, rotate: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.75, ease: sceneEase }}
              className="relative z-10 w-[15.5rem] sm:w-[19.5rem] lg:w-[21.5rem] drop-shadow-[0_35px_55px_rgba(12,7,16,.22)] transition-transform duration-500 hover:scale-105 hover:rotate-1"
            >
              <img src="/mockups/phone-discover.png" alt="Othrhalff Discover campus connections" className="h-auto w-full object-contain" />
            </motion.div>

            {/* Floating Match Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 15 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15, duration: 0.55, ease: sceneEase }}
              className="absolute bottom-[10%] right-[2%] z-20 min-w-[12rem] rounded-2xl border border-black/10 bg-white/95 p-4 shadow-[0_20px_45px_rgba(12,7,16,.14)] backdrop-blur-xl sm:right-[6%]"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F45D9B]">
                  <Sparkles className="h-3.5 w-3.5 fill-current text-white" />
                </span>
                <span className="font-mono text-[9px] font-bold tracking-[.15em] text-black/50">NEW CONNECTION</span>
              </div>
              <p className="mt-2.5 text-sm font-bold text-[#0c0710]">A shared campus signal.</p>
              <p className="mt-0.5 text-[11px] text-black/50">Study partner, friend, or vibe.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 02 / CONFESS SECTION */}
      <section ref={confessRef} id="confess" className="relative isolate overflow-hidden bg-[#FAF7EF] px-5 py-24 text-[#0c0710] sm:px-10 sm:py-28 lg:min-h-[105svh] lg:px-16 lg:py-36 border-t border-black/5">
        {/* Subtle background dots & ambient atmospheric glow */}
        <div className="pointer-events-none absolute inset-0 z-0 opacity-25" style={{ backgroundImage: 'radial-gradient(rgba(12,7,16,.15) .75px, transparent .75px)', backgroundSize: '12px 12px' }} />
        <div className="pointer-events-none absolute -left-28 top-16 h-80 w-80 rounded-full bg-[#F45D9B]/10 blur-3xl z-0" />
        <div className="pointer-events-none absolute -right-20 bottom-16 h-72 w-72 rounded-full bg-pink-300/15 blur-3xl z-0" />

        {/* Orbiting geometric rings */}
        <motion.div style={{ rotate: confessRingRotate }} className="pointer-events-none absolute -left-28 top-16 h-[32rem] w-[32rem] rounded-full border border-[#F45D9B]/15 sm:h-[44rem] sm:w-[44rem] z-0" />
        <div className="pointer-events-none absolute -left-16 top-28 h-[22rem] w-[22rem] rounded-full border border-dashed border-black/10 sm:h-[34rem] sm:w-[34rem] z-0" />

        <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-[1.02fr_.98fr] lg:gap-20">
          <div className="relative order-1 max-w-xl">
            <motion.div variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} className="relative z-10 max-w-xl">
              <h2 className="font-geist text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl lg:text-[5.5rem]">
                Say what you&apos;d never<br />
                <span className="font-geraldine font-normal text-6xl text-[#F45D9B] sm:text-8xl lg:text-[7rem] tracking-normal inline-block mt-2">
                  put on your story.
                </span>
              </h2>
              <p className="mt-6 max-w-md text-base leading-relaxed text-black/65 sm:text-lg">
                Unfiltered thoughts, campus tea, exam rants, and honest confessions — 100% anonymous.
              </p>
            </motion.div>
            <div className="mt-8 grid max-w-lg grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div className="group rounded-2xl border border-black/10 bg-white/90 p-4 sm:p-5 shadow-[0_12px_30px_rgba(28,11,21,.06)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#F45D9B]/35 hover:shadow-[0_20px_40px_rgba(244,93,155,.12)]">
                <div className="flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F45D9B]/10 text-[#F45D9B] shadow-inner">
                    <BadgeCheck className="h-4 w-4" />
                  </div>
                  <span className="font-mono text-[9px] font-bold tracking-[.14em] text-black/40 uppercase">Open Access</span>
                </div>
                <p className="mt-3.5 text-sm font-bold text-[#0c0710] sm:text-base">Read freely.</p>
                <p className="mt-0.5 text-xs font-medium text-black/55">No login required.</p>
              </div>

              <div className="group rounded-2xl border border-black/10 bg-white/90 p-4 sm:p-5 shadow-[0_12px_30px_rgba(28,11,21,.06)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#F45D9B]/35 hover:shadow-[0_20px_40px_rgba(244,93,155,.12)]">
                <div className="flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F45D9B]/15 text-[#F45D9B] shadow-inner">
                    <Lock className="h-4 w-4" />
                  </div>
                  <span className="font-mono text-[9px] font-bold tracking-[.14em] text-[#F45D9B] uppercase">Campus Only</span>
                </div>
                <p className="mt-3.5 text-sm font-bold text-[#0c0710] sm:text-base">Post &amp; react.</p>
                <p className="mt-0.5 text-xs font-medium text-black/55">Join your campus wall.</p>
              </div>
            </div>
          </div>
          <div className="relative order-2 mx-auto flex min-h-[33rem] w-full max-w-[34rem] items-center justify-center sm:min-h-[40rem]">
            <div className="absolute h-[21rem] w-[21rem] rotate-12 rounded-[3rem] bg-[#F45D9B]/14 sm:h-[29rem] sm:w-[29rem]" />
            <motion.div
              style={{ y: confessPhoneY }}
              initial={{ opacity: 0, y: 35, rotate: 4 }}
              whileInView={{ opacity: 1, y: 0, rotate: 2 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.75, ease: sceneEase }}
              className="relative z-10 w-[15.5rem] sm:w-[19.5rem] lg:w-[21.5rem] drop-shadow-[0_35px_55px_rgba(28,9,24,.28)] transition-transform duration-500 hover:scale-105 hover:-rotate-1"
            >
              <img src="/mockups/phone-confession.png" alt="Othrhalff's anonymous Confessions feed" className="h-auto w-full object-contain" />
            </motion.div>
            <motion.div
              animate={{ rotate: [-1.5, 1.5, -1.5], y: [0, -6, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute bottom-[9%] left-[1%] z-20 max-w-[12rem] rounded-2xl border border-black/10 bg-white/95 p-3.5 shadow-xl backdrop-blur-xl"
            >
              <p className="font-mono text-[8px] font-bold tracking-[.14em] text-black/42">ANONYMOUS BY DESIGN</p>
              <p className="mt-2 text-xs font-bold leading-snug">The room gets honest when names leave it.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 03 / GLIMPSE (SPARX) SECTION */}
      <section ref={glimpseRef} id="glimpse" className="relative isolate overflow-hidden bg-[#FAF7EF] px-5 py-24 text-[#0c0710] sm:px-10 sm:py-28 lg:min-h-[105svh] lg:px-16 lg:py-36 border-t border-black/5">
        {/* Subtle background dots & ambient atmospheric glows */}
        <div className="pointer-events-none absolute inset-0 z-0 opacity-25" style={{ backgroundImage: 'radial-gradient(rgba(12,7,16,.15) .75px, transparent .75px)', backgroundSize: '12px 12px' }} />
        <div className="pointer-events-none absolute -right-32 bottom-10 h-72 w-72 rounded-full bg-[#F45D9B]/10 blur-3xl sm:h-96 sm:w-96 z-0" />
        <div className="pointer-events-none absolute -left-20 top-20 h-64 w-64 rounded-full bg-sky-400/10 blur-3xl z-0" />

        {/* Orbiting geometric rings */}
        <motion.div style={{ rotate: glimpseRingRotate }} className="pointer-events-none absolute -left-24 top-16 h-[30rem] w-[30rem] rounded-full border border-[#F45D9B]/15 sm:h-[42rem] sm:w-[42rem] z-0" />
        <div className="pointer-events-none absolute -left-12 top-28 h-[20rem] w-[20rem] rounded-full border border-dashed border-black/10 sm:h-[32rem] sm:w-[32rem] z-0" />

        <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 lg:grid-cols-[1.1fr_.9fr] lg:gap-16">
          {/* Visual Column with Dual Phone Mockups (Feed + Capture) */}
          <div className="relative order-2 lg:order-1 mx-auto flex min-h-[34rem] w-full max-w-[36rem] items-center justify-center sm:min-h-[42rem]">
            {/* Ambient circular backdrop accent */}
            <div className="absolute h-[20rem] w-[20rem] -rotate-6 rounded-[3rem] bg-gradient-to-tr from-[#F45D9B]/20 via-pink-300/15 to-transparent sm:h-[28rem] sm:w-[28rem]" />

            {/* Background Phone: Instant Camera Capture Screen */}
            <motion.div
              style={{ y: glimpseBackPhoneY }}
              initial={{ opacity: 0, x: -30, rotate: -10 }}
              whileInView={{ opacity: 0.88, x: 0, rotate: -7 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.9, ease: sceneEase }}
              className="absolute -left-2 sm:left-2 z-10 w-[14rem] sm:w-[17.5rem] lg:w-[19rem] drop-shadow-[0_25px_45px_rgba(28,9,24,.18)] transition-all duration-500 hover:opacity-100 hover:scale-105"
            >
              <img
                src="/mockups/phone-glimpse-capture.png"
                alt="Othrhalff Glimpse instant campus camera capture"
                className="h-auto w-full object-contain"
                loading="lazy"
              />
            </motion.div>

            {/* Foreground Phone: 24-Hour Glimpse / Sparx Story Feed */}
            <motion.div
              style={{ y: glimpsePhoneY }}
              initial={{ opacity: 0, y: 40, rotate: 6 }}
              whileInView={{ opacity: 1, y: 0, rotate: 4 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 1, ease: sceneEase }}
              className="relative z-20 ml-12 sm:ml-20 w-[15.5rem] sm:w-[19rem] lg:w-[21rem] drop-shadow-[0_35px_60px_rgba(28,9,24,.32)] transition-transform duration-500 hover:scale-105 hover:rotate-1"
            >
              <img
                src="/mockups/phone-glimpse-feed.png"
                alt="Othrhalff 24-hour campus Glimpse story feed"
                className="h-auto w-full object-contain"
                loading="lazy"
              />
            </motion.div>

            {/* Top Floating Badge: Live 24H Feed */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-3 right-2 sm:right-6 z-30 rounded-2xl border border-black/10 bg-white/95 px-4 py-2.5 shadow-[0_15px_35px_rgba(28,9,24,.1)] backdrop-blur-xl"
            >
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="font-mono text-[10px] font-bold tracking-wider text-black/75 uppercase">24H CAMPUS FEED</span>
              </div>
            </motion.div>

            {/* Bottom Floating Badge: Zero Clout Anxiety */}
            <motion.div
              animate={{ rotate: [-1.5, 1.5, -1.5], y: [0, -6, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
              className="absolute -bottom-3 left-2 sm:left-6 z-30 max-w-[12.5rem] rounded-2xl border border-black/10 bg-white/95 p-3.5 shadow-[0_20px_45px_rgba(28,9,24,.12)] backdrop-blur-xl"
            >
              <div className="flex items-center gap-2 text-[#F45D9B]">
                <Flame className="h-4 w-4 fill-current" />
                <span className="font-mono text-[9px] font-bold tracking-[.14em] uppercase">ZERO PRESSURE</span>
              </div>
              <p className="mt-1 text-xs font-bold leading-snug text-[#0c0710]">
                No likes, no follower counts.
              </p>
            </motion.div>
          </div>

          {/* Text Column */}
          <div className="relative order-1 lg:order-2 max-w-xl">
            <motion.div variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
              <h2 className="font-geist text-5xl font-black leading-[0.95] tracking-tight text-[#0c0710] sm:text-7xl lg:text-[5.5rem]">
                24 hours.<br />
                <span className="font-geraldine font-normal text-6xl text-[#F45D9B] sm:text-8xl lg:text-[7rem] tracking-normal inline-block mt-2">
                  then it&apos;s gone.
                </span>
              </h2>
              <p className="mt-6 max-w-md text-base leading-relaxed text-black/65 sm:text-lg">
                Raw campus moments snapped in real time. Disappears tomorrow.
              </p>
            </motion.div>

            {/* Two Frosted Cards */}
            <div className="mt-8 grid max-w-lg grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div className="group rounded-2xl border border-black/10 bg-white/90 p-4 sm:p-5 shadow-[0_12px_30px_rgba(28,11,21,.06)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#F45D9B]/35 hover:shadow-[0_20px_40px_rgba(244,93,155,.12)]">
                <div className="flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F45D9B]/10 text-[#F45D9B] shadow-inner">
                    <Clock className="h-4 w-4" />
                  </div>
                  <span className="font-mono text-[9px] font-bold tracking-[.14em] text-black/40 uppercase">Ephemeral</span>
                </div>
                <p className="mt-3.5 text-sm font-bold text-[#0c0710] sm:text-base">Auto-disappearing.</p>
                <p className="mt-0.5 text-xs font-medium text-black/55">Gone in 24 hours.</p>
              </div>

              <div className="group rounded-2xl border border-black/10 bg-white/90 p-4 sm:p-5 shadow-[0_12px_30px_rgba(28,11,21,.06)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#F45D9B]/35 hover:shadow-[0_20px_40px_rgba(244,93,155,.12)]">
                <div className="flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F45D9B]/15 text-[#F45D9B] shadow-inner">
                    <Camera className="h-4 w-4" />
                  </div>
                  <span className="font-mono text-[9px] font-bold tracking-[.14em] text-[#F45D9B] uppercase">Real Time</span>
                </div>
                <p className="mt-3.5 text-sm font-bold text-[#0c0710] sm:text-base">Quick snapshots.</p>
                <p className="mt-0.5 text-xs font-medium text-black/55">What&apos;s real right now.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 04 / SPEED DISCOVER SECTION */}
      <section ref={speedRef} id="speed-discover" className="relative isolate overflow-hidden bg-[#FAF7EF] px-5 py-24 text-[#0c0710] sm:px-10 sm:py-28 lg:min-h-[105svh] lg:px-16 lg:py-36 border-t border-black/5">
        {/* Subtle background dots & ambient atmospheric glows */}
        <div className="pointer-events-none absolute inset-0 z-0 opacity-25" style={{ backgroundImage: 'radial-gradient(rgba(12,7,16,.15) .75px, transparent .75px)', backgroundSize: '12px 12px' }} />
        <div className="pointer-events-none absolute -right-24 top-16 h-80 w-80 rounded-full bg-[#F45D9B]/10 blur-3xl z-0" />
        <div className="pointer-events-none absolute -left-20 bottom-16 h-72 w-72 rounded-full bg-purple-400/10 blur-3xl z-0" />

        {/* Orbiting geometric rings */}
        <motion.div style={{ rotate: speedRingRotate }} className="pointer-events-none absolute -right-28 top-16 h-[32rem] w-[32rem] rounded-full border border-[#F45D9B]/15 sm:h-[44rem] sm:w-[44rem] z-0" />
        <div className="pointer-events-none absolute -right-16 top-28 h-[22rem] w-[22rem] rounded-full border border-dashed border-black/10 sm:h-[34rem] sm:w-[34rem] z-0" />

        <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          {/* Text Column */}
          <div className="relative max-w-xl">
            <motion.div variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
              <h2 className="font-geist text-5xl font-black leading-[0.95] tracking-tight text-[#0c0710] sm:text-7xl lg:text-[5.5rem]">
                Speed Discover.<br />
                <span className="font-geraldine font-normal text-6xl text-[#F45D9B] sm:text-8xl lg:text-[7rem] tracking-normal inline-block mt-2">
                  live campus radar.
                </span>
              </h2>
              <p className="mt-6 max-w-md text-base leading-relaxed text-black/65 sm:text-lg">
                See who&apos;s active on campus right now. Instant match, quick wave, and zero hesitation.
              </p>
            </motion.div>

            {/* Two Frosted Cards */}
            <div className="mt-8 grid max-w-lg grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div className="group rounded-2xl border border-black/10 bg-white/90 p-4 sm:p-5 shadow-[0_12px_30px_rgba(28,11,21,.06)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#F45D9B]/35 hover:shadow-[0_20px_40px_rgba(244,93,155,.12)]">
                <div className="flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F45D9B]/10 text-[#F45D9B] shadow-inner">
                    <Radio className="h-4 w-4" />
                  </div>
                  <span className="font-mono text-[9px] font-bold tracking-[.14em] text-black/40 uppercase">Live Radar</span>
                </div>
                <p className="mt-3.5 text-sm font-bold text-[#0c0710] sm:text-base">Active now.</p>
                <p className="mt-0.5 text-xs font-medium text-black/55">Match in real time.</p>
              </div>

              <div className="group rounded-2xl border border-black/10 bg-white/90 p-4 sm:p-5 shadow-[0_12px_30px_rgba(28,11,21,.06)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#F45D9B]/35 hover:shadow-[0_20px_40px_rgba(244,93,155,.12)]">
                <div className="flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F45D9B]/15 text-[#F45D9B] shadow-inner">
                    <Zap className="h-4 w-4" />
                  </div>
                  <span className="font-mono text-[9px] font-bold tracking-[.14em] text-[#F45D9B] uppercase">Fast Track</span>
                </div>
                <p className="mt-3.5 text-sm font-bold text-[#0c0710] sm:text-base">Quick connects.</p>
                <p className="mt-0.5 text-xs font-medium text-black/55">No waiting around.</p>
              </div>
            </div>
          </div>

          {/* Visual Column with Dual Phone Mockups (Searching + Lobby) */}
          <div className="relative mx-auto flex min-h-[34rem] w-full max-w-[36rem] items-center justify-center sm:min-h-[42rem]">
            {/* Ambient circular backdrop accent */}
            <div className="absolute h-[20rem] w-[20rem] rotate-6 rounded-[3rem] bg-gradient-to-tl from-[#F45D9B]/20 via-pink-300/15 to-transparent sm:h-[28rem] sm:w-[28rem]" />

            {/* Background Phone: Live Radar Searching Screen */}
            <motion.div
              style={{ y: speedBackPhoneY }}
              initial={{ opacity: 0, x: 30, rotate: 10 }}
              whileInView={{ opacity: 0.88, x: 0, rotate: 7 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.9, ease: sceneEase }}
              className="absolute -right-2 sm:right-2 z-10 w-[14rem] sm:w-[17.5rem] lg:w-[19rem] drop-shadow-[0_25px_45px_rgba(28,9,24,.18)] transition-all duration-500 hover:opacity-100 hover:scale-105"
            >
              <img
                src="/mockups/phone-speed-searching.png"
                alt="Othrhalff Speed Discover campus radar searching"
                className="h-auto w-full object-contain"
                loading="lazy"
              />
            </motion.div>

            {/* Foreground Phone: Speed Discover Home Screen */}
            <motion.div
              style={{ y: speedPhoneY }}
              initial={{ opacity: 0, y: 40, rotate: -6 }}
              whileInView={{ opacity: 1, y: 0, rotate: -4 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 1, ease: sceneEase }}
              className="relative z-20 mr-12 sm:mr-20 w-[15.5rem] sm:w-[19rem] lg:w-[21rem] drop-shadow-[0_35px_60px_rgba(28,9,24,.32)] transition-transform duration-500 hover:scale-105 hover:rotate-0"
            >
              <img
                src="/mockups/phone-speed-home.png"
                alt="Othrhalff Speed Discover real-time matching"
                className="h-auto w-full object-contain"
                loading="lazy"
              />
            </motion.div>

            {/* Top Floating Badge: Live Radar */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-3 left-2 sm:left-6 z-30 rounded-2xl border border-black/10 bg-white/95 px-4 py-2.5 shadow-[0_15px_35px_rgba(28,9,24,.1)] backdrop-blur-xl"
            >
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F45D9B] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#F45D9B]" />
                </span>
                <span className="font-mono text-[10px] font-bold tracking-wider text-black/75 uppercase">RADAR ACTIVE</span>
              </div>
            </motion.div>

            {/* Bottom Floating Badge: Instant Match */}
            <motion.div
              animate={{ rotate: [-1.5, 1.5, -1.5], y: [0, -6, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
              className="absolute -bottom-3 right-2 sm:right-6 z-30 max-w-[12.5rem] rounded-2xl border border-black/10 bg-white/95 p-3.5 shadow-[0_20px_45px_rgba(28,9,24,.12)] backdrop-blur-xl"
            >
              <div className="flex items-center gap-2 text-[#F45D9B]">
                <Sparkles className="h-4 w-4 fill-current" />
                <span className="font-mono text-[9px] font-bold tracking-[.14em] uppercase">INSTANT WAVE</span>
              </div>
              <p className="mt-1 text-xs font-bold leading-snug text-[#0c0710]">
                Match &amp; connect in under 60 seconds.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 05 / CHAT SECTION */}
      <section ref={chatRef} id="chat" className="relative isolate overflow-hidden bg-[#FAF7EF] px-5 py-24 text-[#0c0710] sm:px-10 sm:py-28 lg:min-h-[108svh] lg:px-16 lg:py-36 border-t border-black/5">
        {/* Subtle background dots & ambient atmospheric glows */}
        <div className="pointer-events-none absolute inset-0 z-0 opacity-25" style={{ backgroundImage: 'radial-gradient(rgba(12,7,16,.15) .75px, transparent .75px)', backgroundSize: '12px 12px' }} />
        <div className="pointer-events-none absolute -left-28 top-16 h-80 w-80 rounded-full bg-[#F45D9B]/10 blur-3xl z-0" />
        <div className="pointer-events-none absolute -right-24 bottom-16 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl z-0" />

        {/* Orbiting geometric rings */}
        <motion.div style={{ rotate: chatRingRotate }} className="pointer-events-none absolute -left-28 top-16 h-[32rem] w-[32rem] rounded-full border border-[#F45D9B]/15 sm:h-[44rem] sm:w-[44rem] z-0" />
        <div className="pointer-events-none absolute -left-16 top-28 h-[22rem] w-[22rem] rounded-full border border-dashed border-black/10 sm:h-[34rem] sm:w-[34rem] z-0" />

        <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          {/* Visual Column with 3 Phone Mockups (Matches List, Messages, In-App Call) */}
          <div className="relative order-2 lg:order-1 mx-auto flex min-h-[35rem] w-full max-w-[40rem] items-center justify-center sm:min-h-[44rem]">
            {/* Ambient circular backdrop accent */}
            <div className="absolute h-[22rem] w-[22rem] -rotate-3 rounded-[3.5rem] bg-gradient-to-tr from-[#F45D9B]/20 via-emerald-300/10 to-transparent sm:h-[30rem] sm:w-[30rem]" />

            {/* Left Background Phone: Matches & Inboxes */}
            <motion.div
              style={{ y: chatLeftPhoneY }}
              initial={{ opacity: 0, x: -40, rotate: -14 }}
              whileInView={{ opacity: 0.88, x: 0, rotate: -10 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.85, ease: sceneEase }}
              className="absolute -left-4 sm:left-0 z-10 w-[12rem] sm:w-[15.5rem] lg:w-[17rem] drop-shadow-[0_25px_40px_rgba(28,9,24,.18)] transition-all duration-500 hover:opacity-100 hover:scale-105"
            >
              <img
                src="/mockups/phone-chat-matches.png"
                alt="Othrhalff Campus matches and conversation inbox"
                className="h-auto w-full object-contain"
                loading="lazy"
              />
            </motion.div>

            {/* Right Background Phone: In-App Call Screen */}
            <motion.div
              style={{ y: chatRightPhoneY }}
              initial={{ opacity: 0, x: 40, rotate: 14 }}
              whileInView={{ opacity: 0.88, x: 0, rotate: 10 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.85, ease: sceneEase }}
              className="absolute -right-4 sm:right-0 z-10 w-[12rem] sm:w-[15.5rem] lg:w-[17rem] drop-shadow-[0_25px_40px_rgba(28,9,24,.18)] transition-all duration-500 hover:opacity-100 hover:scale-105"
            >
              <img
                src="/mockups/phone-chat-call.png"
                alt="Othrhalff In-app voice and video calling"
                className="h-auto w-full object-contain"
                loading="lazy"
              />
            </motion.div>

            {/* Center Foreground Phone: Active Messages Screen */}
            <motion.div
              style={{ y: chatPhoneY }}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 1, ease: sceneEase }}
              className="relative z-20 w-[14rem] sm:w-[17.5rem] lg:w-[19.5rem] drop-shadow-[0_35px_65px_rgba(28,9,24,.35)] transition-transform duration-500 hover:scale-105"
            >
              <img
                src="/mockups/phone-chat-messages.png"
                alt="Othrhalff Real-time private messaging"
                className="h-auto w-full object-contain"
                loading="lazy"
              />
            </motion.div>

            {/* Top Floating Badge: Calling & Voice */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-3 right-2 sm:right-6 z-30 rounded-2xl border border-black/10 bg-white/95 px-4 py-2.5 shadow-[0_15px_35px_rgba(28,9,24,.1)] backdrop-blur-xl"
            >
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="font-mono text-[10px] font-bold tracking-wider text-black/75 uppercase">HD CALLS &amp; VOICE</span>
              </div>
            </motion.div>

            {/* Bottom Floating Badge: Encrypted & Private */}
            <motion.div
              animate={{ rotate: [-1.5, 1.5, -1.5], y: [0, -6, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
              className="absolute -bottom-3 left-2 sm:left-6 z-30 max-w-[12.5rem] rounded-2xl border border-black/10 bg-white/95 p-3.5 shadow-[0_20px_45px_rgba(28,9,24,.12)] backdrop-blur-xl"
            >
              <div className="flex items-center gap-2 text-[#F45D9B]">
                <ShieldCheck className="h-4 w-4 fill-current" />
                <span className="font-mono text-[9px] font-bold tracking-[.14em] uppercase">PRIVATE &amp; DIRECT</span>
              </div>
              <p className="mt-1 text-xs font-bold leading-snug text-[#0c0710]">
                Zero phone number sharing.
              </p>
            </motion.div>
          </div>

          {/* Text Column */}
          <div className="relative order-1 lg:order-2 max-w-xl">
            <motion.div variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
              <h2 className="font-geist text-5xl font-black leading-[0.95] tracking-tight text-[#0c0710] sm:text-7xl lg:text-[5.5rem]">
                Real chats.<br />
                <span className="font-geraldine font-normal text-6xl text-[#F45D9B] sm:text-8xl lg:text-[7rem] tracking-normal inline-block mt-2">
                  from text to call.
                </span>
              </h2>
              <p className="mt-6 max-w-md text-base leading-relaxed text-black/65 sm:text-lg">
                Private messaging, instant voice notes, and seamless in-app calls. Where campus plans actually happen.
              </p>
            </motion.div>

            {/* Two Frosted Cards */}
            <div className="mt-8 grid max-w-lg grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div className="group rounded-2xl border border-black/10 bg-white/90 p-4 sm:p-5 shadow-[0_12px_30px_rgba(28,11,21,.06)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#F45D9B]/35 hover:shadow-[0_20px_40px_rgba(244,93,155,.12)]">
                <div className="flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F45D9B]/10 text-[#F45D9B] shadow-inner">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <span className="font-mono text-[9px] font-bold tracking-[.14em] text-black/40 uppercase">Direct Messaging</span>
                </div>
                <p className="mt-3.5 text-sm font-bold text-[#0c0710] sm:text-base">Instant chat.</p>
                <p className="mt-0.5 text-xs font-medium text-black/55">Text, voice notes &amp; media.</p>
              </div>

              <div className="group rounded-2xl border border-black/10 bg-white/90 p-4 sm:p-5 shadow-[0_12px_30px_rgba(28,11,21,.06)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#F45D9B]/35 hover:shadow-[0_20px_40px_rgba(244,93,155,.12)]">
                <div className="flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F45D9B]/15 text-[#F45D9B] shadow-inner">
                    <Phone className="h-4 w-4" />
                  </div>
                  <span className="font-mono text-[9px] font-bold tracking-[.14em] text-[#F45D9B] uppercase">In-App Audio</span>
                </div>
                <p className="mt-3.5 text-sm font-bold text-[#0c0710] sm:text-base">Voice &amp; video.</p>
                <p className="mt-0.5 text-xs font-medium text-black/55">Safe, instant audio calls.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const MarqueeBar: React.FC = () => (
  <div className="relative w-full overflow-hidden bg-[#07030d] py-6 sm:py-0">
    <div className="w-full md:-ml-[5vw] md:w-[110vw] rotate-0 md:-rotate-2 border-y border-[#F45D9B]/30 bg-[#F45D9B]/10 py-4 sm:py-7 md:py-10 shadow-[0_0_80px_rgba(244,93,155,0.1)]">
      <div className="landing-marquee-left flex w-max whitespace-nowrap font-geist text-2xl font-black tracking-[-.04em] text-white sm:text-6xl md:text-8xl lg:text-9xl">
        <span className="mx-6 sm:mx-8">FIND YOUR GYM SPOTTER <i className="not-italic text-[#F45D9B]">/</i> ROW TWO LECTURE PARTNER <i className="not-italic text-[#F45D9B]">/</i> LATE NIGHT STUDY BUDDY <i className="not-italic text-[#F45D9B]">/</i> CAMPUS TEA SQUAD</span>
        <span className="mx-6 sm:mx-8">FIND YOUR GYM SPOTTER <i className="not-italic text-[#F45D9B]">/</i> ROW TWO LECTURE PARTNER <i className="not-italic text-[#F45D9B]">/</i> LATE NIGHT STUDY BUDDY <i className="not-italic text-[#F45D9B]">/</i> CAMPUS TEA SQUAD</span>
      </div>
    </div>
    <div className="w-full md:-ml-[5vw] mt-3 md:-mt-10 md:w-[110vw] rotate-0 md:rotate-1 border-y border-blue-400/30 bg-blue-950/30 py-3 sm:py-6 md:py-8 mix-blend-screen">
      <div className="landing-marquee-right flex w-max whitespace-nowrap font-mono text-base tracking-[.12em] text-blue-200 sm:text-3xl md:text-5xl lg:text-7xl">
        <span className="mx-6 sm:mx-10">WE ARE BEYOND DATING <b className="font-normal text-[#F45D9B]">+</b> THE PEOPLE WHO MAKE CAMPUS YOURS</span>
        <span className="mx-6 sm:mx-10">WE ARE BEYOND DATING <b className="font-normal text-[#F45D9B]">+</b> THE PEOPLE WHO MAKE CAMPUS YOURS</span>
      </div>
    </div>
  </div>
);

const PromoVideoSection: React.FC = () => {
  const [isMuted, setIsMuted] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Interactive 3D tilt motion values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 260, damping: 20 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const rotateX = useTransform(smoothY, [-0.5, 0.5], ['16deg', '-16deg']);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], ['-16deg', '16deg']);
  const glareX = useTransform(smoothX, [-0.5, 0.5], ['0%', '100%']);
  const glareY = useTransform(smoothY, [-0.5, 0.5], ['0%', '100%']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(xPct);
    mouseY.set(yPct);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <section className="relative z-10 overflow-hidden bg-gradient-to-b from-[#07030d] via-[#160d22] to-[#FAF7EF] px-6 py-16 sm:px-10 sm:py-24 [perspective:1400px]">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.95, ease: sceneEase }}
        className="relative mx-auto w-full max-w-md sm:max-w-lg"
      >
        {/* Dynamic 3D Floating & Tilt Container (100% Borderless) */}
        <motion.div
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={handleMouseLeave}
          style={{
            rotateX,
            rotateY,
            transformStyle: 'preserve-3d',
          }}
          animate={{
            y: isHovered ? -12 : [0, -8, 0],
          }}
          transition={{
            y: isHovered
              ? { duration: 0.3 }
              : { duration: 5, repeat: Infinity, ease: 'easeInOut' },
          }}
          className="group relative cursor-pointer"
        >
          {/* Deep Dynamic 3D Atmospheric Glow Layer */}
          <div
            style={{ transform: 'translateZ(-40px)' }}
            className="absolute -inset-6 rounded-[3.5rem] bg-gradient-to-tr from-[#F45D9B]/35 via-emerald-400/25 to-sky-400/35 blur-3xl opacity-80 transition-opacity duration-500 group-hover:opacity-100"
          />

          {/* Borderless Floating 3D Video Surface */}
          <div
            style={{ transform: 'translateZ(15px)' }}
            className="relative aspect-square w-full overflow-hidden rounded-[2.2rem] sm:rounded-[2.8rem] bg-black shadow-[0_30px_90px_rgba(0,0,0,0.5),0_0_50px_rgba(244,93,155,0.25)] transition-shadow duration-300 group-hover:shadow-[0_45px_120px_rgba(0,0,0,0.65),0_0_70px_rgba(244,93,155,0.4)]"
          >
            <video
              ref={videoRef}
              src="/promo.mp4"
              autoPlay
              loop
              muted={isMuted}
              playsInline
              preload="metadata"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />

            {/* Dynamic 3D Specular Glare Reflection Layer */}
            <motion.div
              style={{
                background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.1) 30%, transparent 65%)`,
              }}
              className="pointer-events-none absolute inset-0 opacity-60 mix-blend-overlay transition-opacity duration-300 group-hover:opacity-90"
            />

            {/* Pop-out 3D Sound Toggle Button */}
            <div
              style={{ transform: 'translateZ(45px)' }}
              className="absolute right-4 top-4 z-20"
            >
              <button
                onClick={toggleSound}
                aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-all duration-300 hover:scale-115 hover:bg-black/65 hover:shadow-[0_0_20px_rgba(244,93,155,0.6)] active:scale-95 shadow-xl"
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4 text-white/90" />
                ) : (
                  <Volume2 className="h-4 w-4 text-[#F45D9B] drop-shadow-[0_0_8px_#F45D9B]" />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

const ManifestoSection: React.FC = () => {
  const primary = <span className="flex items-center gap-6">WE ARE BEYOND DATING <span className="text-[#F45D9B]">/</span></span>;
  const secondary = <span className="flex items-center gap-6">FIND YOUR PEOPLE <span className="text-black/30">/</span> REAL CAMPUS BELONGING <span className="text-black/30">/</span></span>;
  return (
    <section className="relative z-10 overflow-hidden border-y border-gray-300/40 bg-[#FAF7EF] pb-20 pt-0 text-gray-950 sm:pb-32">
      <VelocityScroll text1={primary} text2={secondary} default_velocity={1.8} bar1ClassName="bg-[linear-gradient(110deg,#FEDEE5_0%,#FFFFFF_45%,#FCE7F3_60%,#FEDEE5_100%)] text-[#07030d] border-b border-pink-200/60" bar2ClassName="bg-[linear-gradient(110deg,#FBCFE8_0%,#FEDEE5_35%,#FFFFFF_50%,#F45D9B_100%)] text-black border-b border-pink-300/50" textClassName="font-mono font-black text-2xl sm:text-4xl lg:text-7xl uppercase tracking-tighter" />
      <div className="mx-auto max-w-3xl space-y-8 px-6 pt-16 font-mono text-left sm:space-y-12 sm:px-12 sm:pt-24">
        <p className="text-base leading-[1.85] text-gray-800 sm:text-xl">College isn&apos;t meant to be lonely. Somewhere along the way, campus apps became endless superficial swiping, fake personas, and dead-end conversations. Othrhalff is built to bring back real student connection—where people meet naturally for friendships, study circles, and shared moments instead of becoming another profile card.</p>
        <p className="text-base leading-[1.85] text-gray-800 sm:text-xl">Discover people across your university. Share honest thoughts anonymously on campus confession walls. Let chat turn into a late-night study call, an interactive 2D campus world game, or an actual plan between classes.</p>
        <p className="border-l-4 border-[#F45D9B] py-1 pl-5 text-base font-semibold leading-[1.85] text-gray-950 sm:pl-8 sm:text-xl">One verified student identity. A genuine campus community. Study groups, gym spotters, creative collaborators, lasting friendships, and real relationships. <span className="font-bold text-[#F45D9B]">We are beyond dating. Built for belonging.</span></p>
      </div>
    </section>
  );
};

const Footer: React.FC = () => (
  <footer className="relative overflow-hidden border-t border-white/10 bg-gradient-to-b from-[#0B0514] via-zinc-950 to-black pb-8 pt-16 text-white sm:pt-20">
    <FooterBackgroundGradient />

    {/* Ambient neon radial glow */}
    <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-full max-w-4xl bg-[radial-gradient(ellipse_at_top,rgba(244,93,155,0.22)_0%,transparent_70%)]" />

    <div className="relative z-20 mx-auto max-w-7xl px-6 sm:px-10">
      <div className="grid grid-cols-1 gap-10 pb-14 sm:grid-cols-2 md:grid-cols-12 md:gap-12 md:pb-16">
        {/* Left Column: Brand & Socials */}
        <div className="sm:col-span-2 md:col-span-6">
          <div className="flex items-center gap-2.5">
            <Ghost className="h-6 w-6 text-[#F45D9B] drop-shadow-[0_0_14px_rgba(244,93,155,0.7)]" />
            <span className="text-2xl font-black tracking-tight text-white">
              Othr<span className="text-[#F45D9B]">Halff</span>
            </span>
          </div>
          <p className="mt-4 max-w-md text-sm font-normal leading-relaxed text-zinc-400">
            The campus is already full of your people. We are beyond dating — built for genuine student connections, friendships &amp; belonging.
          </p>
          <div className="mt-6 flex items-center gap-3.5">
            <a
              href="https://www.instagram.com/othrhalff/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Othrhalff on Instagram"
              className="group flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 shadow-[0_2px_10px_rgba(0,0,0,0.3)] backdrop-blur-md transition-all duration-300 hover:scale-110 hover:border-[#F45D9B]/50 hover:bg-[#F45D9B]/20 hover:text-white hover:shadow-[0_0_20px_rgba(244,93,155,0.4)]"
            >
              <Instagram className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
            </a>
            <Link
              href="/about"
              aria-label="About Othrhalff"
              className="group flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 shadow-[0_2px_10px_rgba(0,0,0,0.3)] backdrop-blur-md transition-all duration-300 hover:scale-110 hover:border-[#F45D9B]/50 hover:bg-[#F45D9B]/20 hover:text-white hover:shadow-[0_0_20px_rgba(244,93,155,0.4)]"
            >
              <Ghost className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
            </Link>
          </div>
        </div>

        {/* Middle Column: Company */}
        <div className="md:col-span-3">
          <div className="flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#F45D9B] shadow-[0_0_8px_#F45D9B]" />
            <h3 className="font-mono text-xs font-bold tracking-[.18em] text-white whitespace-nowrap">COMPANY</h3>
          </div>
          <ul className="mt-5 space-y-3.5 text-sm font-medium text-zinc-400">
            <li>
              <Link href="/about" className="inline-block transition-all duration-200 hover:translate-x-1 hover:text-[#F45D9B]">
                About Us
              </Link>
            </li>
            <li>
              <Link href="/careers" className="inline-block transition-all duration-200 hover:translate-x-1 hover:text-[#F45D9B]">
                Careers
              </Link>
            </li>
            <li>
              <Link href="/contact" className="inline-block transition-all duration-200 hover:translate-x-1 hover:text-[#F45D9B]">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        {/* Right Column: The Boring Stuff */}
        <div className="md:col-span-3">
          <div className="flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#F45D9B] shadow-[0_0_8px_#F45D9B]" />
            <h3 className="font-mono text-xs font-bold tracking-[.18em] text-white whitespace-nowrap">THE BORING STUFF</h3>
          </div>
          <ul className="mt-5 space-y-3.5 text-sm font-medium text-zinc-400">
            <li>
              <Link href="/privacy" className="inline-block transition-all duration-200 hover:translate-x-1 hover:text-[#F45D9B]">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="inline-block transition-all duration-200 hover:translate-x-1 hover:text-[#F45D9B]">
                Terms
              </Link>
            </li>
            <li>
              <Link href="/safety" className="inline-block transition-all duration-200 hover:translate-x-1 hover:text-[#F45D9B]">
                Safety
              </Link>
            </li>
            <li>
              <Link href="/guidelines" className="inline-block transition-all duration-200 hover:translate-x-1 hover:text-[#F45D9B]">
                Guidelines
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 pt-8 text-xs text-zinc-400">
        <span className="font-medium">© {new Date().getFullYear()} Othrhalff Inc. All rights reserved.</span>
      </div>
    </div>

    {/* Grand Interactive Cyber Neon Text Hover Effect */}
    <div className="relative z-10 mx-auto mt-6 -mb-6 flex h-32 w-full max-w-7xl items-center justify-center overflow-visible px-4 sm:-mb-10 sm:h-44 md:-mb-12 md:h-60 lg:-mb-14 lg:h-72">
      <TextHoverEffect text="OTHRHALFF" className="w-full select-none" />
    </div>
  </footer>
);

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, needsOnboarding, isLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [textRevealed, setTextRevealed] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const onEnter = () => navigate.push('/login');
  const navItems = [
    { name: 'Experience', link: '#experience' },
    { name: 'Stories', link: '/blog' },
    { name: 'Confessions', link: '/confessions' },
    { name: 'About', link: '/about' }
  ];

  const isOAuthCallback = typeof window !== 'undefined' && (
    window.location.hash.includes('access_token=') ||
    window.location.hash.includes('error=') ||
    window.location.search.includes('code=')
  );

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate.replace(needsOnboarding ? '/onboarding' : '/home');
    }
  }, [isAuthenticated, needsOnboarding, isLoading, navigate]);
  useEffect(() => { const textTimer = window.setTimeout(() => setTextRevealed(true), 120); const loadTimer = window.setTimeout(() => setPageLoaded(true), 1050); return () => { window.clearTimeout(textTimer); window.clearTimeout(loadTimer); }; }, []);
  useEffect(() => { const html = document.documentElement.style.overflow; const body = document.body.style.overflow; document.documentElement.style.overflow = 'unset'; document.body.style.overflow = 'unset'; return () => { document.documentElement.style.overflow = html; document.body.style.overflow = body; }; }, []);
  useEffect(() => { const move = (event: MouseEvent) => setMousePos({ x: event.clientX / window.innerWidth - .5, y: event.clientY / window.innerHeight - .5 }); window.addEventListener('mousemove', move, { passive: true }); return () => window.removeEventListener('mousemove', move); }, []);

  useEffect(() => {
    if (isOAuthCallback && typeof window !== 'undefined') {
      const timer = setTimeout(() => {
        if (window.location.hash.includes('access_token=')) {
          window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOAuthCallback]);

  if (isOAuthCallback || (isLoading && isAuthenticated)) {
    return <LoadingState message="Signing you in..." className="bg-[#05000a] fixed inset-0 z-[999]" />;
  }

  return (
    <div className="landing-page min-h-screen overflow-x-clip bg-[#07030d] font-sans text-white selection:bg-[#F45D9B] selection:text-white">
      <style>{`
        .font-geist { font-family: Geist, ui-sans-serif, system-ui, sans-serif; }
        .discover-grid { background-image: linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px); background-size: 48px 48px; mask-image: radial-gradient(circle at center, black 4%, transparent 72%); }
        .chat-dot { animation: chat-bounce 1.1s ease-in-out infinite; } .chat-dot:nth-child(2) { animation-delay: .13s; } .chat-dot:nth-child(3) { animation-delay: .26s; }
        @keyframes chat-bounce { 0%, 60%, 100% { transform: translateY(0); opacity: .45; } 30% { transform: translateY(-4px); opacity: 1; } }
        .landing-marquee-left { animation: landing-marquee-left 34s linear infinite; } .landing-marquee-right { animation: landing-marquee-right 38s linear infinite; }
        @keyframes landing-marquee-left { from { transform: translateX(0); } to { transform: translateX(-50%); } } @keyframes landing-marquee-right { from { transform: translateX(-50%); } to { transform: translateX(0); } }
        @media (prefers-reduced-motion: reduce) { .landing-page *, .landing-page *::before, .landing-page *::after { animation-duration: .001ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; } }
      `}</style>
      <div className={`fixed inset-0 z-[999] transition-all duration-700 ${pageLoaded ? 'pointer-events-none scale-110 opacity-0' : 'opacity-100'}`}>
        <LoadingState message="Connecting signals..." className="bg-[#05000a] h-full w-full" />
      </div>
      <header className="relative min-h-[100svh] overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute -inset-8 transition-transform duration-1000 ease-out"
            style={{ transform: `translate3d(${mousePos.x * -15}px,${mousePos.y * -15}px,0) scale(1.04)` }}
          >
            <img src="/landing_hero-bg.webp?v=14" alt="Campus Sunset Horizon" className="hidden h-full w-full object-cover md:block" />
            <img src="/landing_hero-mobile-bg.webp?v=14" alt="Campus Sunset Horizon" className="h-full w-full object-cover md:hidden" />
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(7,3,13,.04),rgba(7,3,13,.12)_54%,#07030d_100%)]" />
        </div>

        <Navbar>
          <NavBody>
            <NavbarLogo />
            <NavItems items={navItems} />
            <div className="flex items-center gap-4">
              <NavbarButton variant="secondary" onClick={onEnter}>Log In</NavbarButton>
              <NavbarButton variant="primary" onClick={onEnter}>Sign Up</NavbarButton>
            </div>
          </NavBody>
          <MobileNav>
            <MobileNavHeader>
              <NavbarLogo />
              <MobileNavToggle isOpen={isMobileMenuOpen} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
            </MobileNavHeader>
            <MobileNavMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)}>
              <div className="flex flex-col">
                {navItems.map((item) => (
                  <a
                    key={item.name}
                    href={item.link}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between border-b border-white/5 py-3.5 text-base font-semibold text-white/90"
                  >
                    <span>{item.name}</span>
                    <ArrowRight className="h-4 w-4 text-[#F45D9B]" />
                  </a>
                ))}
              </div>
              <div className="mt-3 flex flex-col gap-3">
                <NavbarButton variant="secondary" onClick={onEnter} className="w-full">Log In</NavbarButton>
                <NavbarButton variant="primary" onClick={onEnter} className="w-full">Sign Up</NavbarButton>
              </div>
            </MobileNavMenu>
          </MobileNav>
        </Navbar>

        <main className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl flex-col items-center justify-center px-5 pb-20 pt-24 text-center sm:px-8">
          <div className="max-w-3xl">
            <h1 className="font-geist text-5xl font-black leading-[.98] tracking-[-.07em] text-white drop-shadow-[0_10px_35px_rgba(0,0,0,.9)] sm:text-7xl md:text-8xl">
              {'Find your people.'.split(' ').map((word, index) => (
                <span
                  key={word}
                  className="mr-[.25em] inline-block whitespace-nowrap transition-all duration-700"
                  style={{
                    opacity: textRevealed ? 1 : 0,
                    transform: textRevealed ? 'translateY(0) rotateX(0)' : 'translateY(42px) rotateX(-90deg)',
                    transitionDelay: `${190 + index * 120}ms`
                  }}
                >
                  {word}
                </span>
              ))}
            </h1>
            <p
              className="mx-auto mt-7 max-w-2xl text-lg font-medium leading-relaxed text-white/95 drop-shadow-[0_2px_12px_rgba(0,0,0,.9)] sm:text-2xl"
              style={{
                opacity: textRevealed ? 1 : 0,
                transform: textRevealed ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all .8s ease-out .75s'
              }}
            >
              Go beyond dating. Meet persons you&apos;ll naturally cross paths with every day.
            </p>
            <div
              className="mt-10 flex flex-wrap items-center justify-center gap-4"
              style={{
                opacity: textRevealed ? 1 : 0,
                transform: textRevealed ? 'translateY(0) scale(1)' : 'translateY(30px) scale(.9)',
                transition: 'all .6s ease-out 1.05s'
              }}
            >
              <MagneticButton onClick={onEnter}>Find Your People</MagneticButton>
            </div>
          </div>
        </main>
      </header>
      <PromoVideoSection />
      <ManifestoSection />
      <ArtDirectedExperience />
      <MarqueeBar />
      <Footer />
    </div>
  );
};
