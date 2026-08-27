"use client";

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useScroll, useSpring, useTransform } from 'framer-motion';
import {
  ArrowDownRight,
  ArrowRight,
  BadgeCheck,
  Bell,
  Check,
  CheckCheck,
  Compass,
  Ghost,
  Heart,
  Instagram,
  Lock,
  MapPin,
  MessageCircle,
  Mic,
  Phone,
  Play,
  Plus,
  Radio,
  Send,
  Sparkles,
  UserRound,
  Video,
  Volume2,
  X,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter as useNavigate } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from '../components/LoadingState';
import { VelocityScroll } from '@/components/ui/VelocityScroll';
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

const pink = '#F45D9B';
const sceneEase = [0.22, 1, 0.36, 1] as const;

const chapterMeta = [
  { id: 'discover', label: '01 / DISCOVER' },
  { id: 'confess', label: '02 / CONFESS' },
  { id: 'playground', label: '03 / PLAYGROUND' },
  { id: 'chat', label: '04 / CHAT' },
  { id: 'safety', label: '05 / YOUR PACE' },
];

const reveal = {
  hidden: { opacity: 0, y: 32, filter: 'blur(8px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)' },
};

const SectionIndex: React.FC = () => {
  const [active, setActive] = useState('discover');

  useEffect(() => {
    const observers = chapterMeta.map((chapter) => {
      const element = document.getElementById(chapter.id);
      if (!element) return null;
      const observer = new IntersectionObserver(
        ([entry]) => entry.isIntersecting && setActive(chapter.id),
        { rootMargin: '-45% 0px -45% 0px' }
      );
      observer.observe(element);
      return observer;
    });
    return () => observers.forEach((observer) => observer?.disconnect());
  }, []);

  return (
    <nav aria-label="Experience chapters" className="fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 lg:flex flex-col items-end gap-2.5">
      {chapterMeta.map((chapter) => {
        const isActive = active === chapter.id;
        return (
          <a key={chapter.id} href={`#${chapter.id}`} className="group flex items-center gap-2">
            <span className={`font-mono text-[9px] tracking-[0.16em] transition-all duration-300 ${isActive ? 'translate-x-0 text-white opacity-100' : 'translate-x-2 text-white/50 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'}`}>
              {chapter.label}
            </span>
            <span className={`h-1.5 rounded-full transition-all duration-500 ${isActive ? 'w-8 bg-[#F45D9B] shadow-[0_0_14px_#F45D9B]' : 'w-1.5 bg-white/35 group-hover:bg-white/70'}`} />
          </a>
        );
      })}
    </nav>
  );
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

const SectionKicker: React.FC<{ index: string; title: string; tone?: 'dark' | 'light' }> = ({ index, title, tone = 'dark' }) => (
  <div className={`flex items-center gap-3 font-mono text-[10px] font-bold tracking-[0.18em] ${tone === 'dark' ? 'text-white/60' : 'text-black/45'}`}>
    <span className="text-[#F45D9B]">{index}</span>
    <span className={`h-px w-10 ${tone === 'dark' ? 'bg-white/20' : 'bg-black/15'}`} />
    <span>{title}</span>
  </div>
);

const Cursor: React.FC = () => (
  <motion.div initial={{ opacity: 0, scale: 0.6 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: 0.65, duration: 0.45 }} viewport={{ once: true }} className="absolute -bottom-3 -right-3 z-30 rounded-full border border-white/20 bg-black px-3 py-2 text-[10px] font-bold text-white shadow-2xl">
    <span className="mr-1 text-[#F45D9B]">+</span> IT&apos;S A MATCH
  </motion.div>
);

const DiscoverScene: React.FC = () => {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const xOne = useTransform(scrollYProgress, [0, 0.45, 1], [-85, 12, 100]);
  const xTwo = useTransform(scrollYProgress, [0, 0.52, 1], [90, -12, -110]);
  const rotateOne = useTransform(scrollYProgress, [0, 0.45, 1], [-16, -5, 9]);
  const rotateTwo = useTransform(scrollYProgress, [0, 0.52, 1], [17, 6, -9]);

  return (
    <section ref={ref} id="discover" className="relative min-h-[110svh] overflow-hidden bg-[#09030e] px-5 py-24 sm:px-10 lg:px-16 lg:py-36">
      <div className="discover-grid absolute inset-0 opacity-40" />
      <div className="absolute left-[8%] top-[20%] h-[34rem] w-[34rem] rounded-full bg-[#F45D9B]/20 blur-[150px]" />
      <div className="absolute bottom-[5%] right-[8%] h-[26rem] w-[26rem] rounded-full bg-blue-500/15 blur-[130px]" />
      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 lg:grid-cols-[0.85fr_1.15fr] lg:gap-8">
        <motion.div variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.9, ease: sceneEase }} className="relative z-10 max-w-xl">
          <SectionKicker index="01" title="THE FIRST SIGNAL" />
          <h2 className="mt-7 font-geist text-5xl font-black leading-[0.91] tracking-[-0.07em] text-white sm:text-7xl lg:text-[5.75rem]">
            You were never<br />
            <span className="text-white/35">one swipe</span><br />
            away.
          </h2>
          <p className="mt-8 max-w-md text-base leading-relaxed text-white/65 sm:text-lg">Discover the people already orbiting your campus. Same night classes, same niche interests, same kind of strange.</p>
          <div className="mt-10 flex flex-wrap gap-3">
            {['YOUR CAMPUS', 'YOUR INTENT', 'YOUR VIBE'].map((item) => <span key={item} className="rounded-full border border-white/15 bg-white/[0.035] px-3 py-2 font-mono text-[10px] font-bold tracking-[0.12em] text-white/75">{item}</span>)}
          </div>
        </motion.div>

        <div className="relative mx-auto flex h-[36rem] w-full max-w-[41rem] items-center justify-center sm:h-[42rem]">
          <motion.div style={{ x: xOne, rotate: rotateOne }} className="absolute left-[2%] top-[12%] h-[25rem] w-[13rem] overflow-hidden rounded-[2rem] border border-white/20 bg-zinc-900 shadow-[-20px_30px_80px_rgba(0,0,0,0.55)] sm:h-[31rem] sm:w-[16rem]">
            <img src="/mockups/phone-discover.png" alt="Othrhalff Discover screen" className="h-full w-full object-cover object-top" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black via-black/45 to-transparent" />
            <span className="absolute bottom-5 left-5 font-mono text-[10px] tracking-[0.18em] text-white/75">CAMPUS / LIVE</span>
          </motion.div>
          <motion.div style={{ x: xTwo, rotate: rotateTwo }} className="absolute right-[1%] top-[20%] h-[23rem] w-[12rem] overflow-hidden rounded-[2rem] border border-white/20 bg-zinc-950 shadow-[20px_30px_80px_rgba(0,0,0,0.65)] sm:h-[29rem] sm:w-[15rem]">
            <img src="/mockups/phone-nearby.png" alt="Othrhalff campus radar" className="h-full w-full object-cover object-top" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black via-black/45 to-transparent" />
            <span className="absolute bottom-5 left-5 font-mono text-[10px] tracking-[0.18em] text-white/75">NEARBY / NOW</span>
          </motion.div>
          <motion.div initial={{ scale: 0.8, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} transition={{ delay: 0.35, duration: 0.8, ease: sceneEase }} viewport={{ once: true }} className="relative z-20 flex h-36 w-36 items-center justify-center rounded-full border border-white/20 bg-[#F45D9B] text-center font-geist text-2xl font-black leading-none text-white shadow-[0_0_70px_rgba(244,93,155,0.75)] sm:h-44 sm:w-44 sm:text-3xl">
            FIND<br />YOUR<br />PEOPLE
          </motion.div>
          <Cursor />
          <div className="absolute bottom-[5%] left-[8%] flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-4 py-2 backdrop-blur-xl">
            <MapPin className="h-3.5 w-3.5 text-[#F45D9B]" /><span className="font-mono text-[10px] tracking-[0.12em] text-white/70">ON CAMPUS</span>
          </div>
        </div>
      </div>
    </section>
  );
};

const ConfessionScene: React.FC = () => {
  const [reacted, setReacted] = useState(false);
  return (
    <section id="confess" className="relative overflow-hidden bg-[#fbf8f0] px-5 py-24 text-[#0c0710] sm:px-10 lg:min-h-[110svh] lg:px-16 lg:py-36">
      <div className="absolute inset-0 opacity-[0.42]" style={{ backgroundImage: 'radial-gradient(rgba(12,7,16,.17) .75px, transparent .75px)', backgroundSize: '8px 8px' }} />
      <motion.div animate={{ rotate: [0, 2, 0, -2, 0] }} transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }} className="absolute -right-16 top-12 h-72 w-72 rounded-full border-[28px] border-[#F45D9B]/15" />
      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="relative mx-auto flex min-h-[32rem] w-full max-w-[38rem] items-center justify-center sm:min-h-[38rem]">
          <motion.div initial={{ opacity: 0, rotate: -8, x: -65 }} whileInView={{ opacity: 1, rotate: -5, x: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.9, ease: sceneEase }} className="absolute left-0 top-10 z-10 w-[72%] overflow-hidden rounded-[2.2rem] border border-black/10 bg-[#16111a] p-2 shadow-[0_35px_65px_rgba(19,8,18,0.25)]">
            <img src="/mockups/phone-confession.png" alt="Othrhalff Confessions feed" className="h-full w-full rounded-[1.7rem] object-cover object-top" />
          </motion.div>
          <motion.article initial={{ opacity: 0, rotate: 8, x: 65 }} whileInView={{ opacity: 1, rotate: 4, x: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ delay: 0.16, duration: 0.9, ease: sceneEase }} className="absolute right-0 top-[31%] z-20 w-[54%] rounded-[1.75rem] border border-black/10 bg-white p-5 shadow-[0_35px_65px_rgba(19,8,18,0.19)] sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0c0710] font-mono text-[10px] text-white">??</span><span className="font-mono text-[9px] font-bold tracking-[.13em] text-black/45">ANONYMOUS</span></div>
              <span className="font-mono text-[9px] text-black/35">NOW</span>
            </div>
            <p className="mt-5 text-sm font-semibold leading-relaxed text-[#0c0710] sm:text-base">“Who else has had a full existential crisis in the library this week?”</p>
            <div className="mt-5 flex items-center gap-2 border-t border-black/7 pt-4">
              <button onClick={() => setReacted((value) => !value)} aria-label="React to confession" className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-bold transition-all ${reacted ? 'bg-[#F45D9B] text-white' : 'bg-[#fff0f5] text-[#F45D9B]'}`}><Heart className={`h-3.5 w-3.5 ${reacted ? 'fill-current' : ''}`} /> {reacted ? '25' : '24'}</button>
              <span className="inline-flex items-center gap-1.5 px-1 text-[11px] text-black/45"><MessageCircle className="h-3.5 w-3.5" /> 08</span>
            </div>
          </motion.article>
          <motion.div animate={{ y: [0, -11, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }} className="absolute bottom-4 left-[10%] z-30 rounded-full border border-black/10 bg-[#F45D9B] px-4 py-2 font-mono text-[10px] font-bold tracking-[.12em] text-white shadow-xl">SAY THE REAL THING</motion.div>
        </div>
        <motion.div variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.9, ease: sceneEase }} className="max-w-xl lg:justify-self-end">
          <SectionKicker index="02" title="THE OPEN SECRET" tone="light" />
          <h2 className="mt-7 font-geist text-5xl font-black leading-[0.91] tracking-[-0.07em] sm:text-7xl lg:text-[5.4rem]">For the things<br />you&apos;d never put<br /><span className="text-[#F45D9B]">on your story.</span></h2>
          <p className="mt-8 max-w-md text-base leading-relaxed text-black/60 sm:text-lg">Confessions is the campus group chat without the names. Read the room, start a poll, leave a thought, or just be the quiet witness.</p>
          <p className="mt-7 font-mono text-[10px] font-bold tracking-[0.16em] text-black/45">OPEN TO READ. YOUR VOICE, WHEN YOU&apos;RE READY.</p>
        </motion.div>
      </div>
    </section>
  );
};

const ChatScene: React.FC = () => {
  const [showReply, setShowReply] = useState(false);
  const [hearted, setHearted] = useState(false);
  useEffect(() => {
    const interval = window.setInterval(() => setShowReply((value) => !value), 3300);
    return () => window.clearInterval(interval);
  }, []);
  return (
    <section id="chat" className="relative min-h-[110svh] overflow-hidden bg-[#05070b] px-5 py-24 sm:px-10 lg:px-16 lg:py-36">
      <div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.055) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
      <motion.div animate={{ x: ['-10%', '10%', '-10%'], y: ['-5%', '9%', '-5%'] }} transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }} className="absolute left-[18%] top-[28%] h-[28rem] w-[28rem] rounded-full bg-[#4c1d95]/35 blur-[135px]" />
      <motion.div animate={{ x: ['8%', '-10%', '8%'], y: ['4%', '-7%', '4%'] }} transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }} className="absolute bottom-[6%] right-[12%] h-[22rem] w-[22rem] rounded-full bg-[#F45D9B]/24 blur-[125px]" />
      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 lg:grid-cols-[0.95fr_1.05fr]">
        <motion.div variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.9, ease: sceneEase }} className="max-w-xl">
          <SectionKicker index="03" title="THE PART THAT MATTERS" />
          <h2 className="mt-7 font-geist text-5xl font-black leading-[0.91] tracking-[-0.07em] text-white sm:text-7xl lg:text-[5.5rem]">A conversation<br />with somewhere<br /><span className="text-[#bca7ff]">to go.</span></h2>
          <p className="mt-8 max-w-md text-base leading-relaxed text-white/65 sm:text-lg">Typing dots become inside jokes. Inside jokes become a two-truths challenge, a call, a movie room, or something that takes longer to name.</p>
          <div className="mt-9 flex flex-wrap gap-2.5 font-mono text-[10px] font-bold tracking-[.11em] text-white/70">
            {['LIVE TYPING', 'READ STATUS', 'VOICE + VIDEO', 'ICEBREAKERS'].map((item) => <span key={item} className="rounded-full border border-white/15 bg-white/5 px-3 py-2">{item}</span>)}
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.92, rotate: 3 }} whileInView={{ opacity: 1, scale: 1, rotate: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ delay: 0.08, duration: 0.95, ease: sceneEase }} className="relative mx-auto w-full max-w-[34rem] rounded-[2.3rem] border border-white/15 bg-[#10121d]/90 p-3 shadow-[0_38px_100px_rgba(0,0,0,.65)] backdrop-blur-xl sm:p-4">
          <div className="overflow-hidden rounded-[1.65rem] border border-white/7 bg-[#0b0d16]">
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
              <div className="flex items-center gap-3"><div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#F45D9B] to-[#7258e8] font-mono text-xs font-bold text-white">A<div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#0b0d16] bg-emerald-400" /></div><div><p className="text-sm font-bold text-white">Anon A7</p><p className="text-[10px] text-emerald-400">active now</p></div></div>
              <div className="flex gap-3 text-white/60"><Phone className="h-4 w-4" /><Video className="h-4 w-4" /></div>
            </div>
            <div className="min-h-[23rem] space-y-4 px-5 py-6 sm:min-h-[25rem]">
              <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }} viewport={{ once: true }} className="max-w-[82%] rounded-2xl rounded-tl-sm bg-white/8 px-4 py-3 text-sm leading-relaxed text-white/85">Okay, important question: which library floor has the least emotionally devastating lighting?</motion.div>
              <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.66 }} viewport={{ once: true }} className="ml-auto max-w-[76%] rounded-2xl rounded-tr-sm bg-[#F45D9B] px-4 py-3 text-sm leading-relaxed text-white">Third floor. But only if we pretend the printer noise is ambient music.</motion.div>
              <button onClick={() => setHearted((value) => !value)} className="ml-auto -mt-3 mr-1 flex items-center gap-1 rounded-full border border-white/10 bg-[#171827] px-2 py-1 text-[10px] text-white/70"><Heart className={`h-3 w-3 ${hearted ? 'fill-[#F45D9B] text-[#F45D9B]' : ''}`} /> {hearted ? '1' : ''}</button>
              <AnimatePresence mode="wait">
                {showReply ? <motion.div key="typing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex items-center gap-2"><div className="flex gap-1 rounded-2xl rounded-tl-sm bg-white/8 px-3 py-3"><span className="chat-dot h-1.5 w-1.5 rounded-full bg-white/65" /><span className="chat-dot h-1.5 w-1.5 rounded-full bg-white/65" /><span className="chat-dot h-1.5 w-1.5 rounded-full bg-white/65" /></div><span className="font-mono text-[9px] tracking-[.1em] text-white/35">TYPING</span></motion.div> : <motion.div key="game" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="max-w-[90%] rounded-xl border border-violet-400/25 bg-violet-400/10 p-3"><div className="flex items-center gap-2 text-[10px] font-bold tracking-[.1em] text-violet-200"><Sparkles className="h-3.5 w-3.5" /> WOULD YOU RATHER</div><p className="mt-2 text-xs text-white/80">Have a playlist made for you or make one for someone else?</p><div className="mt-3 flex gap-2"><span className="rounded-md bg-white/10 px-2 py-1 text-[10px] text-white/75">GET ONE</span><span className="rounded-md bg-white/10 px-2 py-1 text-[10px] text-white/75">MAKE ONE</span></div></motion.div>}
              </AnimatePresence>
            </div>
            <div className="flex items-center gap-3 border-t border-white/8 px-4 py-3"><Plus className="h-4 w-4 text-white/45" /><div className="flex-1 rounded-full bg-white/7 px-4 py-2 text-xs text-white/35">Type something true...</div><Send className="h-4 w-4 text-[#F45D9B]" /></div>
          </div>
          <motion.div animate={{ y: [0, -7, 0] }} transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }} className="absolute -right-6 top-[17%] rounded-2xl border border-white/15 bg-[#191323]/95 px-4 py-3 shadow-2xl backdrop-blur-xl"><p className="font-mono text-[9px] tracking-[.13em] text-white/50">CHEMISTRY</p><p className="mt-1 text-lg font-black text-white">86<span className="text-[#F45D9B]">%</span></p></motion.div>
        </motion.div>
      </div>
    </section>
  );
};

const GlimpseScene: React.FC = () => {
  const [isLive, setIsLive] = useState(false);
  return (
    <section id="glimpse" className="relative overflow-hidden bg-[#e9efff] px-5 py-24 text-[#090d1e] sm:px-10 lg:min-h-[110svh] lg:px-16 lg:py-36">
      <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(115deg, transparent 49.8%, rgba(9,13,30,.08) 50%, transparent 50.2%)', backgroundSize: '44px 44px' }} />
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 70, repeat: Infinity, ease: 'linear' }} className="absolute -left-40 top-0 h-[36rem] w-[36rem] rounded-full border-[1px] border-[#090d1e]/15" />
      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_0.93fr] lg:gap-20">
        <div className="order-2 max-w-xl lg:order-1">
          <motion.div variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.9, ease: sceneEase }}>
            <SectionKicker index="04" title="24 HOURS OF CAMPUS" tone="light" />
            <h2 className="mt-7 font-geist text-5xl font-black leading-[0.91] tracking-[-0.07em] sm:text-7xl lg:text-[5.45rem]">The campus is<br />always making<br /><span className="text-[#3155e8]">a little noise.</span></h2>
            <p className="mt-8 max-w-md text-base leading-relaxed text-[#090d1e]/60 sm:text-lg">Glimpses are the moments that would disappear otherwise. A late-night floor, a bad canteen take, the exact second something became lore.</p>
          </motion.div>
          <button onClick={() => setIsLive((value) => !value)} className="group mt-9 inline-flex items-center gap-3 rounded-full bg-[#090d1e] px-5 py-3 font-mono text-[10px] font-bold tracking-[.13em] text-white transition-transform hover:scale-[1.03]">
            <span className={`h-2 w-2 rounded-full ${isLive ? 'bg-[#F45D9B] shadow-[0_0_12px_#F45D9B]' : 'bg-white/35'}`} /> {isLive ? 'LIVE MOMENT SAVED' : 'TAP INTO THE MOMENT'} <ArrowDownRight className="h-4 w-4 transition-transform group-hover:translate-y-0.5 group-hover:translate-x-0.5" />
          </button>
        </div>
        <motion.div initial={{ opacity: 0, y: 55, rotate: -3 }} whileInView={{ opacity: 1, y: 0, rotate: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.9, ease: sceneEase }} className="relative order-1 mx-auto w-full max-w-[29rem] lg:order-2">
          <div className="absolute -inset-12 rounded-[3rem] bg-[#3155e8]/20 blur-3xl" />
          <div className="relative aspect-[9/14] overflow-hidden rounded-[2.4rem] border-[7px] border-[#090d1e] bg-[#090d1e] shadow-[0_34px_70px_rgba(48,82,232,.3)]">
            <img src="/mockups/phone-notification.png" alt="Othrhalff Glimpse and notifications" className="h-full w-full object-cover object-top opacity-90" />
            <div className="absolute inset-x-5 top-5 flex gap-1.5">{[1, 2, 3, 4].map((bar) => <span key={bar} className={`h-1 flex-1 rounded-full ${bar < 4 ? 'bg-white' : 'bg-white/35'}`} />)}</div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#090d1e] via-[#090d1e]/45 to-transparent px-6 pb-6 pt-24">
              <div className="flex items-center gap-2"><span className="h-8 w-8 rounded-full bg-[#F45D9B]" /><span className="font-mono text-[10px] font-bold tracking-[.13em] text-white">CAMPUS / 10:42 PM</span></div>
              <p className="mt-3 text-sm font-semibold leading-relaxed text-white">The chai queue just became a support group.</p>
              <div className="mt-4 flex items-center gap-2"><Heart className="h-4 w-4 fill-white text-white" /><span className="text-xs font-bold text-white">42</span></div>
            </div>
          </div>
          <motion.div animate={{ x: [0, 13, 0], y: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} className="absolute -left-10 top-[24%] rounded-2xl border border-[#090d1e]/10 bg-white/90 px-4 py-3 shadow-xl backdrop-blur"><p className="font-mono text-[9px] font-bold tracking-[.12em] text-[#090d1e]/50">NEW GLIMPSE</p><p className="mt-1 text-xs font-bold">Someone is here.</p></motion.div>
        </motion.div>
      </div>
    </section>
  );
};

const PlaygroundScene: React.FC = () => (
  <section id="playground" className="relative overflow-hidden bg-[#0b0710] px-5 py-24 sm:px-10 lg:min-h-[105svh] lg:px-16 lg:py-36">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(244,93,155,.17),transparent_23%),radial-gradient(circle_at_30%_75%,rgba(47,93,228,.16),transparent_28%)]" />
    <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 lg:grid-cols-[.92fr_1.08fr]">
      <motion.div variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.9, ease: sceneEase }} className="max-w-xl">
        <SectionKicker index="05" title="COLLEGE, MULTIPLAYER" />
        <h2 className="mt-7 font-geist text-5xl font-black leading-[0.91] tracking-[-0.07em] text-white sm:text-7xl lg:text-[5.4rem]">Leave your<br />room without<br /><span className="text-[#F45D9B]">leaving it.</span></h2>
        <p className="mt-8 max-w-md text-base leading-relaxed text-white/65 sm:text-lg">A shared campus made for wandering. Be a tiny avatar. Run into someone. Find the people still awake, without the “hey” that has to mean everything.</p>
        <div className="mt-9 flex items-center gap-3"><span className="relative flex h-3 w-3"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" /></span><span className="font-mono text-[10px] font-bold tracking-[.14em] text-white/65">CAMPUS WORLD ONLINE</span></div>
      </motion.div>
      <motion.div initial={{ opacity: 0, scale: .92 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 1.05, ease: sceneEase }} className="relative mx-auto w-full max-w-[43rem]">
        <div className="absolute -inset-5 rounded-[2rem] bg-gradient-to-tr from-[#F45D9B]/30 via-transparent to-blue-500/25 blur-2xl" />
        <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-black shadow-[0_30px_90px_rgba(0,0,0,.5)]">
          <video src="/game.mp4" autoPlay loop muted playsInline preload="metadata" className="aspect-[16/10] w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
          <div className="absolute bottom-5 left-5 flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black"><Play className="h-4 w-4 fill-current" /></div><div><p className="font-mono text-[9px] font-bold tracking-[.16em] text-white/55">PLAYGROUND</p><p className="text-sm font-bold text-white">Find the room between rooms.</p></div></div>
        </div>
      </motion.div>
    </div>
  </section>
);

const DatesScene: React.FC = () => {
  const [mode, setMode] = useState<'cinema' | 'music'>('cinema');
  return (
    <section id="dates" className="relative overflow-hidden bg-[#f53476] px-5 py-24 text-[#18040b] sm:px-10 lg:min-h-[105svh] lg:px-16 lg:py-36">
      <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'repeating-linear-gradient(135deg, transparent 0 23px, rgba(24,4,11,.18) 24px 25px)' }} />
      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 lg:grid-cols-[1fr_1fr]">
        <motion.div initial={{ opacity: 0, x: -38 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.9, ease: sceneEase }} className="relative mx-auto w-full max-w-[34rem]">
          <div className="relative overflow-hidden rounded-[2rem] border border-[#18040b]/20 bg-[#18040b] p-3 shadow-[0_35px_80px_rgba(78,7,28,.35)]">
            <div className="overflow-hidden rounded-[1.35rem] bg-[#25111a]">
              <div className="relative aspect-video overflow-hidden">
                <img src="/blog/virtual-dates.jpeg" alt="Othrhalff virtual date cinema room" className={`h-full w-full object-cover transition-all duration-700 ${mode === 'cinema' ? 'scale-100 opacity-85' : 'scale-110 opacity-35 grayscale'}`} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#25111a] via-transparent to-transparent" />
                <AnimatePresence mode="wait">{mode === 'cinema' ? <motion.div key="cinema" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="absolute inset-0 flex items-center justify-center"><span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur"><Play className="h-5 w-5 fill-current" /></span></motion.div> : <motion.div key="music" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-x-0 bottom-8 flex items-end justify-center gap-1">{[18, 36, 58, 28, 72, 45, 33, 64, 24, 48, 69, 30].map((height, index) => <motion.span key={index} animate={{ height: [height / 2, height, height / 1.6] }} transition={{ duration: .65 + index * .04, repeat: Infinity, repeatType: 'mirror' }} className="w-1.5 rounded-full bg-[#F45D9B]" />)}</motion.div>}</AnimatePresence>
              </div>
              <div className="flex items-center justify-between px-5 py-4 text-white"><div><p className="font-mono text-[9px] font-bold tracking-[.14em] text-white/45">PRIVATE ROOM / 8391</p><p className="mt-1 text-sm font-bold">{mode === 'cinema' ? 'Cinema after class' : 'The late-night playlist'}</p></div><div className="flex -space-x-2"><span className="h-8 w-8 rounded-full border-2 border-[#25111a] bg-[#F45D9B]" /><span className="h-8 w-8 rounded-full border-2 border-[#25111a] bg-[#8b7aff]" /></div></div>
            </div>
          </div>
          <div className="mt-5 flex justify-center gap-2"><button onClick={() => setMode('cinema')} className={`rounded-full px-4 py-2 font-mono text-[10px] font-bold tracking-[.12em] transition-colors ${mode === 'cinema' ? 'bg-[#18040b] text-white' : 'border border-[#18040b]/25 text-[#18040b]/60'}`}>CINEMA</button><button onClick={() => setMode('music')} className={`rounded-full px-4 py-2 font-mono text-[10px] font-bold tracking-[.12em] transition-colors ${mode === 'music' ? 'bg-[#18040b] text-white' : 'border border-[#18040b]/25 text-[#18040b]/60'}`}>MUSIC JAM</button></div>
        </motion.div>
        <motion.div variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.9, ease: sceneEase }} className="max-w-xl lg:justify-self-end">
          <SectionKicker index="06" title="A BETTER NEXT MOVE" tone="light" />
          <h2 className="mt-7 font-geist text-5xl font-black leading-[0.91] tracking-[-0.07em] sm:text-7xl lg:text-[5.4rem]">When chat says,<br /><span className="text-[#fff3d0]">“do something?”</span></h2>
          <p className="mt-8 max-w-md text-base leading-relaxed text-[#18040b]/70 sm:text-lg">Start a private room. Press play at the same moment. Swap songs. Keep your camera off if you want. The date is only as big as you make it.</p>
          <div className="mt-8 flex items-center gap-3 font-mono text-[10px] font-bold tracking-[.12em] text-[#18040b]/65"><span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#18040b]/20"><Lock className="h-3 w-3" /></span> INVITE-ONLY, WHEN IT SHOULD BE</div>
        </motion.div>
      </div>
    </section>
  );
};

const ArtDirectedExperience: React.FC = () => {
  const discoverRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: discoverRef, offset: ['start end', 'end start'] });
  const phoneY = useTransform(scrollYProgress, [0, 0.5, 1], [60, 0, -48]);
  const ringRotate = useTransform(scrollYProgress, [0, 1], [-8, 18]);

  return (
    <div id="experience">
      <section ref={discoverRef} id="discover" className="relative isolate overflow-hidden bg-[#09030e] px-5 py-24 sm:px-10 sm:py-28 lg:min-h-[108svh] lg:px-16 lg:py-36">
        <div className="discover-grid absolute inset-0 opacity-45" />
        <motion.div style={{ rotate: ringRotate }} className="absolute -right-36 top-20 h-[31rem] w-[31rem] rounded-full border border-[#F45D9B]/25 sm:-right-20 sm:h-[43rem] sm:w-[43rem]" />
        <div className="absolute left-[-14rem] top-[35%] h-[34rem] w-[34rem] rounded-full bg-[#7456ea]/20 blur-[130px]" />
        <div className="absolute right-[14%] top-[22%] h-56 w-56 rounded-full bg-[#F45D9B]/25 blur-[115px]" />
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-[.83fr_1.17fr] lg:gap-8">
          <motion.div variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.28 }} transition={{ duration: 0.9, ease: sceneEase }} className="relative z-10 max-w-xl">
            <SectionKicker index="01" title="DISCOVER / THE FIRST SIGNAL" />
            <h2 className="mt-7 font-geist text-[3.25rem] font-black leading-[.88] tracking-[-.075em] text-white sm:text-7xl lg:text-[5.85rem]">Your campus.<br /><span className="text-white/32">Then the world.</span></h2>
            <p className="mt-8 max-w-md text-base leading-relaxed text-white/62 sm:text-lg">Start with the people you could genuinely run into between classes. When your circle is ready to stretch, take the same curiosity beyond campus.</p>
            <div className="mt-9 flex w-full max-w-md items-center justify-between rounded-full border border-white/15 bg-white/[.045] p-1.5 font-mono text-[10px] font-bold tracking-[.15em] text-white/55">
              <span className="rounded-full bg-[#F45D9B] px-4 py-2.5 text-white shadow-[0_0_22px_rgba(244,93,155,.35)]">CAMPUS</span>
              <span className="px-3 text-white/35">TO</span>
              <span className="px-4 py-2.5">GLOBAL</span>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 font-mono text-[10px] font-bold tracking-[.12em] text-white/55">
              <span className="inline-flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-[#F45D9B]" />CAMPUS FIRST</span>
              <span className="inline-flex items-center gap-2"><Compass className="h-3.5 w-3.5 text-[#bca7ff]" />GLOBAL WHEN READY</span>
            </div>
          </motion.div>

          <div className="relative mx-auto flex min-h-[34rem] w-full max-w-[41rem] items-center justify-center sm:min-h-[43rem]">
            <div className="absolute h-[19rem] w-[19rem] rounded-full border border-white/10 sm:h-[26rem] sm:w-[26rem]" />
            <div className="absolute h-[26rem] w-[26rem] rounded-full border border-dashed border-white/10 sm:h-[35rem] sm:w-[35rem]" />
            <motion.div style={{ y: phoneY }} className="relative z-10 w-[15.75rem] drop-shadow-[0_38px_65px_rgba(0,0,0,.68)] sm:w-[20rem] lg:w-[22rem]">
              <img src="/mockups/phone-discover.webp" alt="Othrhalff Discover showing the Campus and Global switch" className="h-auto w-full object-contain" />
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: .75, y: 12 }} whileInView={{ opacity: 1, scale: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: .4, duration: .65, ease: sceneEase }} className="absolute bottom-[14%] right-[1%] z-20 min-w-[11.5rem] rounded-2xl border border-white/15 bg-[#14111d]/90 p-3.5 shadow-2xl backdrop-blur-xl sm:right-[4%] sm:p-4">
              <div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F45D9B]"><Heart className="h-3.5 w-3.5 fill-current text-white" /></span><span className="font-mono text-[9px] font-bold tracking-[.15em] text-white/48">NEW MATCH</span></div>
              <p className="mt-3 text-sm font-bold text-white">A shared signal.</p>
              <p className="mt-1 text-[11px] text-white/48">The next move is yours.</p>
            </motion.div>
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }} className="absolute left-[2%] top-[18%] z-20 rounded-full border border-white/15 bg-black/45 px-3 py-2 font-mono text-[9px] font-bold tracking-[.14em] text-white/70 backdrop-blur-xl">NEARBY / NOW</motion.div>
          </div>
        </div>
      </section>

      <section id="confess" className="relative isolate overflow-hidden bg-[#faf6ed] px-5 py-24 text-[#100913] sm:px-10 sm:py-28 lg:min-h-[108svh] lg:px-16 lg:py-36">
        <div className="absolute inset-0 opacity-[.44]" style={{ backgroundImage: 'radial-gradient(rgba(16,9,19,.2) .7px, transparent .7px)', backgroundSize: '9px 9px' }} />
        <div className="absolute -left-28 top-16 h-64 w-64 rounded-full border-[20px] border-[#F45D9B]/12 sm:h-96 sm:w-96" />
        <div className="absolute bottom-[-14rem] right-[-10rem] h-[30rem] w-[30rem] rounded-full bg-[#F45D9B]/12 blur-[95px]" />
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-[1.02fr_.98fr] lg:gap-20">
          <div className="relative order-1 max-w-xl">
            <motion.div variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, amount: .3 }} transition={{ duration: .9, ease: sceneEase }}>
              <SectionKicker index="02" title="CONFESSIONS / THE OPEN SECRET" tone="light" />
              <h2 className="mt-7 font-geist text-[3.25rem] font-black leading-[.88] tracking-[-.075em] sm:text-7xl lg:text-[5.5rem]">Say the thing<br />you&apos;d never put<br /><span className="text-[#F45D9B]">on your story.</span></h2>
              <p className="mt-8 max-w-md text-base leading-relaxed text-black/62 sm:text-lg">A living campus wall for the thought, question, and crush you&apos;d rather not attach to your name.</p>
            </motion.div>
            <div className="mt-9 grid max-w-lg grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div className="rounded-2xl border border-black/10 bg-white/75 p-4 shadow-[0_10px_30px_rgba(28,11,21,.05)]"><BadgeCheck className="h-4 w-4 text-[#F45D9B]" /><p className="mt-4 font-mono text-[9px] font-bold tracking-[.14em] text-black/42">NO LOGIN NEEDED</p><p className="mt-1.5 text-sm font-bold">Read every confession.</p></div>
              <div className="rounded-2xl border border-black/10 bg-[#170b1d] p-4 text-white shadow-[0_10px_30px_rgba(28,11,21,.13)]"><Lock className="h-4 w-4 text-[#F45D9B]" /><p className="mt-4 font-mono text-[9px] font-bold tracking-[.14em] text-white/42">WHEN YOU JOIN</p><p className="mt-1.5 text-sm font-bold">Post, react, comment, poll.</p></div>
            </div>
          </div>
          <div className="relative order-2 mx-auto flex min-h-[33rem] w-full max-w-[34rem] items-center justify-center sm:min-h-[40rem]">
            <div className="absolute h-[21rem] w-[21rem] rotate-12 rounded-[3rem] bg-[#F45D9B]/14 sm:h-[29rem] sm:w-[29rem]" />
            <motion.div initial={{ opacity: 0, y: 48, rotate: 5 }} whileInView={{ opacity: 1, y: 0, rotate: 0 }} viewport={{ once: true, amount: .25 }} transition={{ duration: 1, ease: sceneEase }} className="relative z-10 w-[16.5rem] drop-shadow-[0_35px_55px_rgba(28,9,24,.27)] sm:w-[21rem]">
              <img src="/mockups/phone-confession.webp" alt="Othrhalff's anonymous Confessions feed" className="h-auto w-full object-contain" />
            </motion.div>
            <motion.div animate={{ rotate: [-2, 2, -2], y: [0, -7, 0] }} transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }} className="absolute bottom-[9%] left-[1%] z-20 max-w-[12rem] rounded-2xl border border-black/10 bg-white/85 p-3.5 shadow-xl backdrop-blur"><p className="font-mono text-[8px] font-bold tracking-[.14em] text-black/42">ANONYMOUS BY DESIGN</p><p className="mt-2 text-xs font-bold leading-snug">The room gets honest when names leave it.</p></motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

const MarqueeBar: React.FC = () => (
  <div className="relative w-full overflow-hidden bg-[#07030d] py-0">
    <div className="-ml-[5vw] w-[110vw] -rotate-2 border-y border-[#F45D9B]/30 bg-[#F45D9B]/10 py-7 shadow-[0_0_80px_rgba(244,93,155,0.1)] sm:py-10">
      <div className="landing-marquee-left flex w-max whitespace-nowrap font-geist text-5xl font-black tracking-[-.06em] text-white sm:text-7xl md:text-9xl"><span className="mx-8">FIND YOUR GYM SPOTTER <i className="not-italic text-[#F45D9B]">/</i> ROW TWO LECTURE PARTNER <i className="not-italic text-[#F45D9B]">/</i> LATE NIGHT STUDY BUDDY</span><span className="mx-8">FIND YOUR GYM SPOTTER <i className="not-italic text-[#F45D9B]">/</i> ROW TWO LECTURE PARTNER <i className="not-italic text-[#F45D9B]">/</i> LATE NIGHT STUDY BUDDY</span></div>
    </div>
    <div className="-ml-[5vw] -mt-10 w-[110vw] rotate-1 border-y border-blue-400/30 bg-blue-950/30 py-5 mix-blend-screen sm:-mt-14 sm:py-8"><div className="landing-marquee-right flex w-max whitespace-nowrap font-mono text-3xl tracking-[.16em] text-blue-200 sm:text-5xl md:text-7xl"><span className="mx-10">THE MICROSCOPIC GEOGRAPHY OF COLLEGE <b className="font-normal text-[#F45D9B]">+</b> THE PEOPLE WHO MAKE IT YOURS</span><span className="mx-10">THE MICROSCOPIC GEOGRAPHY OF COLLEGE <b className="font-normal text-[#F45D9B]">+</b> THE PEOPLE WHO MAKE IT YOURS</span></div></div>
  </div>
);

const ManifestoSection: React.FC = () => {
  const primary = <span className="flex items-center gap-6">GO BEYOND DATING <span className="text-[#F45D9B]">/</span></span>;
  const secondary = <span className="flex items-center gap-6">FIND YOUR PEOPLE <span className="text-black/30">/</span></span>;
  return (
    <section className="relative z-10 overflow-hidden border-y border-gray-300/40 bg-[#FAF7EF] pb-20 pt-0 text-gray-950 sm:pb-32">
      <VelocityScroll text1={primary} text2={secondary} default_velocity={1.8} bar1ClassName="bg-[linear-gradient(110deg,#FEDEE5_0%,#FFFFFF_45%,#FCE7F3_60%,#FEDEE5_100%)] text-[#07030d] border-b border-pink-200/60" bar2ClassName="bg-[linear-gradient(110deg,#FBCFE8_0%,#FEDEE5_35%,#FFFFFF_50%,#F45D9B_100%)] text-black border-b border-pink-300/50" textClassName="font-mono font-black text-2xl sm:text-4xl lg:text-7xl uppercase tracking-tighter" />
      <div className="mx-auto max-w-3xl space-y-8 px-6 pt-16 font-mono text-left sm:space-y-12 sm:px-12 sm:pt-24">
        <p className="text-base leading-[1.85] text-gray-800 sm:text-xl">College isn&apos;t meant to be lonely. Somewhere along the way, campus life became endless swipes, fake personas, and conversations that never went anywhere. Othrhalff is built to bring back real student connection—where people meet naturally instead of becoming another profile.</p>
        <p className="text-base leading-[1.85] text-gray-800 sm:text-xl">Discover people. Say the thing anonymously. Let chat turn into a call, a game, a shared movie, or an actual plan. Meet inside the campus world when curiosity needs somewhere to go.</p>
        <p className="border-l-4 border-[#F45D9B] py-1 pl-5 text-base font-semibold leading-[1.85] text-gray-950 sm:pl-8 sm:text-xl">One verified student identity. A growing student network. Friendships, collaborations, communities, and relationships—without being forced into a box. <span className="font-bold text-[#F45D9B]">Not built for dating. Built for belonging.</span></p>
      </div>
    </section>
  );
};

const Footer: React.FC = () => (
  <footer className="relative border-t border-gray-900 bg-black/95 pb-8 pt-12 text-white sm:pt-16">
    <div className="mx-auto max-w-7xl px-5 sm:px-8">
      <div className="grid grid-cols-2 gap-8 pb-10 sm:gap-12 md:grid-cols-5 md:pb-14">
        <div className="col-span-2 md:col-span-1"><div className="flex items-center gap-2"><Ghost className="h-5 w-5 text-[#F45D9B]" /><span className="text-lg font-bold tracking-tight">OthrHalff</span></div><p className="mt-4 max-w-sm text-sm leading-relaxed text-gray-500">The campus is already full of your people. We just make the signal easier to find.</p><div className="mt-6 flex gap-3"><a href="https://www.instagram.com/othrhalff/" target="_blank" rel="noopener noreferrer" aria-label="Othrhalff on Instagram" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/7 text-gray-400 transition-all hover:scale-110 hover:bg-[#F45D9B] hover:text-white"><Instagram className="h-5 w-5" /></a><Link href="/about" aria-label="About Othrhalff" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/7 text-gray-400 transition-all hover:scale-110 hover:bg-[#F45D9B] hover:text-white"><Ghost className="h-5 w-5" /></Link></div></div>
        <div><h3 className="font-mono text-[10px] font-bold tracking-[.15em] text-white/50">COMPARE</h3><ul className="mt-5 space-y-3 text-sm text-gray-500"><li><Link href="/vs/tinder" className="transition-colors hover:text-[#F45D9B]">vs Tinder</Link></li><li><Link href="/vs/bumble" className="transition-colors hover:text-[#F45D9B]">vs Bumble</Link></li><li><Link href="/vs/hinge" className="transition-colors hover:text-[#F45D9B]">vs Hinge</Link></li><li><Link href="/vs-omegle" className="transition-colors hover:text-[#F45D9B]">vs Omegle</Link></li><li><Link href="/vs/yikyak" className="transition-colors hover:text-[#F45D9B]">vs Yik Yak</Link></li></ul></div>
        <div><h3 className="font-mono text-[10px] font-bold tracking-[.15em] text-white/50">CAMPUSES</h3><ul className="mt-5 space-y-3 text-sm text-gray-500"><li><Link href="/campus/delhi-university" className="transition-colors hover:text-[#F45D9B]">Delhi Univ (DU)</Link></li><li><Link href="/campus/iit-delhi" className="transition-colors hover:text-[#F45D9B]">IIT Delhi</Link></li><li><Link href="/campus/amity-noida" className="transition-colors hover:text-[#F45D9B]">Amity Noida</Link></li><li><Link href="/campus/amity-raipur" className="transition-colors hover:text-[#F45D9B]">Amity Raipur</Link></li><li><Link href="/campus/sharda-university" className="transition-colors hover:text-[#F45D9B]">Sharda Univ</Link></li></ul></div>
        <div><h3 className="font-mono text-[10px] font-bold tracking-[.15em] text-white/50">COMPANY</h3><ul className="mt-5 space-y-3 text-sm text-gray-500"><li><Link href="/about" className="transition-colors hover:text-[#F45D9B]">About Us</Link></li><li><Link href="/developers" className="transition-colors hover:text-[#F45D9B]">Developers</Link></li><li><Link href="/careers" className="transition-colors hover:text-[#F45D9B]">Careers</Link></li><li><Link href="/contact" className="transition-colors hover:text-[#F45D9B]">Contact</Link></li></ul></div>
        <div><h3 className="font-mono text-[10px] font-bold tracking-[.15em] text-white/50">THE BORING STUFF</h3><ul className="mt-5 space-y-3 text-sm text-gray-500"><li><Link href="/privacy" className="transition-colors hover:text-[#F45D9B]">Privacy</Link></li><li><Link href="/terms" className="transition-colors hover:text-[#F45D9B]">Terms</Link></li><li><Link href="/safety" className="transition-colors hover:text-[#F45D9B]">Safety</Link></li><li><Link href="/guidelines" className="transition-colors hover:text-[#F45D9B]">Guidelines</Link></li></ul></div>
      </div>
      <div className="flex flex-col items-center justify-between gap-3 border-t border-white/8 pt-6 text-xs text-gray-600 md:flex-row"><span>© {new Date().getFullYear()} Othrhalff Inc. All rights reserved.</span><span className="font-mono text-[10px] tracking-[.12em]">MADE FOR THE IN-BETWEEN MOMENTS</span></div>
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
      <header className="relative min-h-[100svh] overflow-hidden bg-black">
        {/* Background Campus Building anchored at bottom */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute inset-0 transition-transform duration-1000 ease-out"
            style={{ transform: `translate3d(${mousePos.x * -10}px,${mousePos.y * -10}px,0) scale(1.03)` }}
          >
            <img
              src="/landing_hero-bg.webp?v=12"
              alt="Campus Horizon"
              className="w-full h-full object-cover object-bottom"
            />
          </div>
          {/* Subtle top shade to ensure contrast while seamlessly blending into page */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-transparent pointer-events-none" />
          {/* Bottom fade into the next section */}
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#07030d] via-[#07030d]/60 to-transparent pointer-events-none" />
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
              Go beyond dating. Meet students you&apos;ll naturally cross paths with every day.
            </p>
            <div
              className="mt-10"
              style={{
                opacity: textRevealed ? 1 : 0,
                transform: textRevealed ? 'translateY(0) scale(1)' : 'translateY(30px) scale(.9)',
                transition: 'all .6s ease-out 1.05s'
              }}
            >
              <MagneticButton onClick={onEnter}>Find Your Othrhalff</MagneticButton>
            </div>
          </div>
          <a href="#experience" className="absolute bottom-8 inline-flex items-center gap-2 font-mono text-[10px] font-bold tracking-[.16em] text-white/65 hover:text-white transition-colors">
            <span className="h-px w-7 bg-white/40" /> START THE SIGNAL <ArrowDownRight className="h-3.5 w-3.5" />
          </a>
        </main>
      </header>
      <ManifestoSection />
      <ArtDirectedExperience />
      <MarqueeBar />
      <Footer />
    </div>
  );
};
