"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  Check,
  RotateCcw,
  Copy,
  Heart,
  ShieldCheck,
  Zap,
  Flame,
  MessageSquare,
  Compass,
  Star,
  Layers,
  Share2
} from 'lucide-react';
import Link from 'next/link';
import { personalityTypes, PersonalityType } from '../seo/data/personalityTypes';

const QUIZ_QUESTIONS = [
  {
    id: 1,
    tag: "THE CHEMISTRY SPARK",
    question: "When meeting someone new, what creates an instant, magnetic spark for you?",
    options: [
      {
        letter: "A",
        title: "Deep Philosophical Banter",
        desc: "Unfiltered 2 AM talks about life, mindsets & abstract ideas",
        icon: "🔮",
        codeMap: ['INFP', 'INFJ', 'INTJ', 'INTP']
      },
      {
        letter: "B",
        title: "Electric Playful Banter",
        desc: "Quick wit, playful teasing & effortless spontaneous humor",
        icon: "⚡",
        codeMap: ['ENFP', 'ENTP', 'ESFP', 'ESTP']
      },
      {
        letter: "C",
        title: "Quiet Emotional Presence",
        desc: "Warmth, gentle attentiveness & feeling genuinely understood",
        icon: "🌊",
        codeMap: ['ISFJ', 'ISFP', 'ENFJ', 'ESFJ']
      },
      {
        letter: "D",
        title: "Intellectual Drive & Ambition",
        desc: "Sharp problem-solving, high standards & mutual growth",
        icon: "🚀",
        codeMap: ['ENTJ', 'INTJ', 'ENTP', 'ISTJ']
      }
    ]
  },
  {
    id: 2,
    tag: "ENERGY & VIBE",
    question: "How does your romantic battery recharge on an ideal weekend?",
    options: [
      {
        letter: "A",
        title: "Intimate 1-on-1 Sanctuary",
        desc: "Cozy dinner, stargazing, listening to vinyl, or indie films",
        icon: "🌙",
        codeMap: ['INFP', 'INTJ', 'INFJ', 'ISFP']
      },
      {
        letter: "B",
        title: "Spontaneous Night Quest",
        desc: "Underground music gig, cafe hopping, or random city drives",
        icon: "🔥",
        codeMap: ['ENFP', 'ESTP', 'ESFP', 'ENTP']
      },
      {
        letter: "C",
        title: "Deep Creative Solitude",
        desc: "Building a passion project or going down curious research rabbit holes",
        icon: "💡",
        codeMap: ['INTP', 'INTJ', 'ISTP', 'ISTJ']
      },
      {
        letter: "D",
        title: "Vibrant Social Circle",
        desc: "Hosting a group of great friends with drinks & loud storytelling",
        icon: "🥂",
        codeMap: ['ENFJ', 'ESFJ', 'ISFJ', 'ENFP']
      }
    ]
  },
  {
    id: 3,
    tag: "THE CORE STANDARD",
    question: "What is your biggest non-negotiable relationship green flag?",
    options: [
      {
        letter: "A",
        title: "Emotional Depth & Vulnerability",
        desc: "A partner who expresses real feelings without playing ego games",
        icon: "💎",
        codeMap: ['INFJ', 'INFP', 'ENFJ', 'ISFP']
      },
      {
        letter: "B",
        title: "Radical Transparency",
        desc: "Zero mixed signals; clear, direct communication every time",
        icon: "🎯",
        codeMap: ['INTJ', 'ENTJ', 'ISTJ', 'ISTP']
      },
      {
        letter: "C",
        title: "Unhinged Mutual Humor",
        desc: "Being able to laugh until your stomach hurts over dumb inside jokes",
        icon: "🎭",
        codeMap: ['ENFP', 'ENTP', 'ESFP', 'ESTP']
      },
      {
        letter: "D",
        title: "Steady Loyalty & Thoughtfulness",
        desc: "Remembering tiny details and being a rock-solid safe harbor",
        icon: "⚓",
        codeMap: ['ISFJ', 'ISTJ', 'ESFJ', 'ISFP']
      }
    ]
  },
  {
    id: 4,
    tag: "SUPERPOWER DYNAMICS",
    question: "What is your secret superpower in relationships?",
    options: [
      {
        letter: "A",
        title: "Intuitive Empathy",
        desc: "I can sense how someone feels before they even speak a word",
        icon: "👁️",
        codeMap: ['INFJ', 'ENFJ', 'INFP', 'ISFJ']
      },
      {
        letter: "B",
        title: "Strategic Clarity",
        desc: "I bring calm, level-headed logic and solve chaos smoothly",
        icon: "🧠",
        codeMap: ['INTJ', 'INTP', 'ENTJ', 'ISTJ']
      },
      {
        letter: "C",
        title: "Infectious Charisma",
        desc: "I bring magnetic warmth and make anyone feel electric and alive",
        icon: "✨",
        codeMap: ['ENFP', 'ESFP', 'ENTP', 'ESFJ']
      },
      {
        letter: "D",
        title: "Anchored Presence",
        desc: "I am a fiercely dependable confidant who never judges",
        icon: "🛡️",
        codeMap: ['ISFP', 'ISTP', 'ISFJ', 'INFP']
      }
    ]
  }
];

const CALC_MESSAGES = [
  "Mapping Cognitive Architecture...",
  "Calibrating Emotional Resonance Vectors...",
  "Cross-Referencing Campus Pairing Synergy...",
  "Synthesizing Your Romantic Archetype..."
];

export const ViralArchetypeQuiz: React.FC<{ onComplete?: (result: PersonalityType) => void }> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCodes, setSelectedCodes] = useState<string[][]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcMsgIndex, setCalcMsgIndex] = useState(0);
  const [result, setResult] = useState<PersonalityType | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isCalculating) {
      const interval = setInterval(() => {
        setCalcMsgIndex((prev) => (prev + 1) % CALC_MESSAGES.length);
      }, 400);
      return () => clearInterval(interval);
    }
  }, [isCalculating]);

  const handleOptionSelect = (codeMap: string[]) => {
    const nextSelections = [...selectedCodes, codeMap];
    setSelectedCodes(nextSelections);

    if (currentStep < QUIZ_QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsCalculating(true);
      setTimeout(() => {
        const flatCodes = nextSelections.flat();
        const counts: Record<string, number> = {};
        flatCodes.forEach((code) => {
          counts[code] = (counts[code] || 0) + 1;
        });
        const sortedCodes = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
        const bestCode = sortedCodes[0] || 'INFP';
        const finalType = personalityTypes.find((t) => t.code === bestCode) || personalityTypes[0];

        if (typeof window !== 'undefined') {
          localStorage.setItem('othrhalff_archetype', finalType.code);
          localStorage.setItem('othrhalff_archetype_name', finalType.name);
        }

        setResult(finalType);
        setIsCalculating(false);
        if (onComplete) onComplete(finalType);
      }, 1600);
    }
  };

  const handleCopyLink = () => {
    if (!result) return;
    const shareUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/vibe?type=${result.code}`
        : `https://www.othrhalff.in/vibe?type=${result.code}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const restartQuiz = () => {
    setCurrentStep(0);
    setSelectedCodes([]);
    setResult(null);
    setIsCalculating(false);
  };

  const progressPercent = ((currentStep + 1) / QUIZ_QUESTIONS.length) * 100;

  return (
    <div className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-[2.8rem] border border-white/15 bg-gradient-to-b from-[#12071f]/95 via-[#0b0314]/98 to-[#05000a] p-6 sm:p-10 text-white shadow-[0_30px_100px_rgba(244,93,155,0.22)] backdrop-blur-3xl">
      {/* ── Ambient Background Cyber Halos ── */}
      <div className="pointer-events-none absolute -left-28 -top-28 h-72 w-72 rounded-full bg-[#F45D9B]/25 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-28 -right-28 h-72 w-72 rounded-full bg-violet-600/25 blur-[120px]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-[#FF007F]/10 blur-[150px]" />

      <AnimatePresence mode="wait">
        {/* ── 1. QUIZ QUESTION SCREEN ── */}
        {!result && !isCalculating && (
          <motion.div
            key={`step-${currentStep}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 space-y-7"
          >
            {/* Top Bar Indicators */}
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 backdrop-blur-md">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F45D9B] text-[10px] font-black text-white shadow-[0_0_12px_#F45D9B]">
                  {currentStep + 1}
                </span>
                <span className="font-mono text-[11px] font-bold tracking-widest text-white/60">
                  {QUIZ_QUESTIONS[currentStep].tag}
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#F45D9B]/30 bg-[#F45D9B]/10 px-3.5 py-1.5 text-[11px] font-bold text-[#F45D9B] shadow-[0_0_15px_rgba(244,93,155,0.2)]">
                <Sparkles className="h-3.5 w-3.5" /> 60s Radar
              </div>
            </div>

            {/* Glowing Segmented Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-mono text-[10px] text-white/40">
                <span>PROGRESS</span>
                <span>{currentStep + 1} OF {QUIZ_QUESTIONS.length}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.07] p-0.5">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#F45D9B] via-[#FF007F] to-violet-500 shadow-[0_0_15px_#F45D9B]"
                  initial={{ width: `${((currentStep) / QUIZ_QUESTIONS.length) * 100}%` }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>

            {/* Question Heading */}
            <h2 className="font-geist text-2xl sm:text-3xl font-black leading-snug tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
              {QUIZ_QUESTIONS[currentStep].question}
            </h2>

            {/* Option Cards */}
            <div className="space-y-3.5 pt-1">
              {QUIZ_QUESTIONS[currentStep].options.map((opt, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => handleOptionSelect(opt.codeMap)}
                  whileHover={{ scale: 1.015, y: -2 }}
                  whileTap={{ scale: 0.985 }}
                  className="group relative flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-5 text-left transition-all duration-300 hover:border-[#F45D9B]/70 hover:bg-gradient-to-r hover:from-[#F45D9B]/15 hover:to-transparent hover:shadow-[0_12px_35px_rgba(244,93,155,0.25)]"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.05] text-lg font-bold text-white transition-colors group-hover:border-[#F45D9B] group-hover:bg-[#F45D9B] group-hover:text-white group-hover:shadow-[0_0_15px_#F45D9B]">
                    {opt.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-[#F45D9B] opacity-75">
                        [{opt.letter}]
                      </span>
                      <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-white">
                        {opt.title}
                      </h4>
                    </div>
                    <p className="mt-0.5 text-xs text-white/60 line-clamp-1 group-hover:text-white/80">
                      {opt.desc}
                    </p>
                  </div>

                  <ArrowRight className="h-4 w-4 shrink-0 text-white/25 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-[#F45D9B]" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── 2. SYNTHESIZING / CALCULATION SCREEN ── */}
        {isCalculating && (
          <motion.div
            key="calculating"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 py-16 text-center space-y-7"
          >
            {/* Concentric Rotating Holographic Radar Animation */}
            <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#F45D9B]/50 animate-[spin_8s_linear_infinite]" />
              <div className="absolute inset-2 rounded-full border border-violet-500/60 animate-[spin_4s_linear_infinite_reverse]" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F45D9B] to-violet-600 shadow-[0_0_50px_#F45D9B] animate-pulse">
                <Zap className="h-8 w-8 text-white fill-current" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {CALC_MESSAGES[calcMsgIndex]}
              </h3>
              <p className="text-xs sm:text-sm text-white/50 max-w-sm mx-auto">
                Synthesizing communication vectors, romantic archetypes & verified campus peers.
              </p>
            </div>
          </motion.div>
        )}

        {/* ── 3. SPOTIFY-WRAPPED TIER ARCHETYPE REVEAL CARD ── */}
        {result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 space-y-6"
          >
            {/* Top Badge & Reset */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#F45D9B]/20 to-violet-600/20 border border-[#F45D9B]/40 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-[#F45D9B] shadow-[0_0_20px_rgba(244,93,155,0.3)]">
                <Sparkles className="h-3.5 w-3.5" /> Your Romantic Archetype
              </div>
              <button
                onClick={restartQuiz}
                className="flex items-center gap-1.5 text-xs font-bold text-white/50 hover:text-white transition-colors"
              >
                <RotateCcw className="h-3 w-3" /> Retake Test
              </button>
            </div>

            {/* Aesthetic Poster-Style Archetype Hero Box */}
            <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-white/[0.08] via-white/[0.02] to-transparent p-6 sm:p-8 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
              <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-[#F45D9B]/30 blur-[70px]" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-block rounded-md bg-[#F45D9B] px-2.5 py-0.5 font-mono text-xs font-black uppercase tracking-widest text-white shadow-[0_0_12px_#F45D9B]">
                    {result.code}
                  </div>
                  <h2 className="mt-2 font-geist text-3xl sm:text-4xl font-black text-white leading-none tracking-tight">
                    {result.name}
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm font-medium italic text-white/70">
                    "{result.tagline}"
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-center sm:flex-col sm:justify-center">
                  <span className="text-3xl font-black text-[#F45D9B] leading-none">94%</span>
                  <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-white/50">
                    Max Synergy
                  </span>
                </div>
              </div>

              {/* Core Traits Bar */}
              <div className="mt-5 flex flex-wrap gap-2">
                {result.traits.map((trait, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[10px] font-bold text-white/80"
                  >
                    ✦ {trait}
                  </span>
                ))}
              </div>

              {/* Dating Style Breakdown */}
              <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-white/50">
                  Dating Blueprint
                </span>
                <p className="mt-1 text-xs sm:text-sm leading-relaxed text-white/85">
                  {result.datingStyle}
                </p>
              </div>

              {/* Green Flags & Best Matches Grid */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    <ShieldCheck className="h-3.5 w-3.5" /> Top Green Flags
                  </span>
                  <ul className="mt-2 space-y-1.5 text-xs text-white/80">
                    {result.greenFlags.map((flag, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] p-4">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-[#F45D9B] uppercase tracking-wider">
                    <Heart className="h-3.5 w-3.5 fill-current" /> Golden Matches
                  </span>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {result.bestMatches.map((m, i) => (
                      <Link
                        key={i}
                        href={`/compatibility/${result.code.toLowerCase()}-and-${m.toLowerCase()}`}
                        className="group flex items-center gap-1 rounded-xl border border-[#F45D9B]/30 bg-[#F45D9B]/10 px-2.5 py-1.5 text-xs font-bold text-[#F45D9B] transition-all hover:bg-[#F45D9B] hover:text-white"
                      >
                        <span>{m}</span>
                        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Conversion Actions ── */}
            <div className="space-y-3 pt-2">
              <Link
                href={`/login?archetype=${result.code}`}
                className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-[#F45D9B] via-[#FF007F] to-violet-600 p-4 text-center font-bold text-white shadow-[0_12px_45px_rgba(244,93,155,0.45)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_18px_60px_rgba(244,93,155,0.65)]"
              >
                <Zap className="h-5 w-5 fill-current" />
                <span className="text-base sm:text-lg">
                  Find Your {result.bestMatches.slice(0, 2).join(' & ')} Match Free →
                </span>
              </Link>

              <div className="flex gap-3">
                <button
                  onClick={handleCopyLink}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] py-3 text-xs font-bold text-white transition-colors hover:bg-white/10 hover:border-white/30"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Share Link Copied to Clipboard!' : 'Share Archetype Card'}
                </button>
              </div>
              <p className="text-center font-mono text-[10px] text-white/40">
                100% Free • Verified Campus Speed Dating • Zero Swipe Fatigue
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
