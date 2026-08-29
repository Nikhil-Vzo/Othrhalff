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
  Star
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
    /* ── Main Skeuomorphic Outer Shell with Beveled Rim & Inset Specular Depth ── */
    <div className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-[3rem] border border-white/20 bg-gradient-to-b from-[#1c1228] via-[#10071c] to-[#08020f] p-6 sm:p-10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),inset_0_-2px_4px_rgba(0,0,0,0.8),0_25px_80px_rgba(0,0,0,0.9),0_0_50px_rgba(244,93,155,0.18)]">
      {/* ── Realistic Top Glass Specular Reflection Highlight ── */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.09] via-white/[0.02] to-transparent rounded-t-[3rem]" />
      
      {/* ── Ambient Underglow ── */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#F45D9B]/20 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-violet-600/20 blur-[100px]" />

      <AnimatePresence mode="wait">
        {/* ── 1. SKEUOMORPHIC QUIZ QUESTION SCREEN ── */}
        {!result && !isCalculating && (
          <motion.div
            key={`step-${currentStep}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 space-y-7"
          >
            {/* Skeuomorphic Top Header with Inset Tactile Pills */}
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-gradient-to-b from-black/60 to-black/30 px-4 py-2 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6),0_1px_1px_rgba(255,255,255,0.15)]">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-b from-[#F45D9B] to-[#b32766] text-[10px] font-black text-white shadow-[0_2px_6px_rgba(244,93,155,0.6),inset_0_1px_1px_rgba(255,255,255,0.4)]">
                  {currentStep + 1}
                </span>
                <span className="font-mono text-[11px] font-bold tracking-widest text-white/70">
                  {QUIZ_QUESTIONS[currentStep].tag}
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#F45D9B]/40 bg-gradient-to-b from-[#F45D9B]/25 to-[#F45D9B]/10 px-4 py-2 text-[11px] font-bold text-[#F45D9B] shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),0_2px_8px_rgba(244,93,155,0.25)]">
                <Sparkles className="h-3.5 w-3.5" /> 60s Radar
              </div>
            </div>

            {/* Skeuomorphic Beveled Gas-Discharge Progress Meter */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-mono text-[10px] font-bold text-white/50">
                <span>RADAR CALIBRATION</span>
                <span>STEP {currentStep + 1} OF {QUIZ_QUESTIONS.length}</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full border border-white/15 bg-[#08030d] p-0.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.9),0_1px_1px_rgba(255,255,255,0.1)]">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#F45D9B] via-[#FF007F] to-violet-500 shadow-[0_0_14px_#F45D9B,inset_0_1px_1px_rgba(255,255,255,0.5)]"
                  initial={{ width: `${((currentStep) / QUIZ_QUESTIONS.length) * 100}%` }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>

            {/* Question Heading */}
            <h2 className="font-geist text-2xl sm:text-3xl font-black leading-snug tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
              {QUIZ_QUESTIONS[currentStep].question}
            </h2>

            {/* Skeuomorphic Raised 3D Option Cards */}
            <div className="space-y-3.5 pt-1">
              {QUIZ_QUESTIONS[currentStep].options.map((opt, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => handleOptionSelect(opt.codeMap)}
                  whileHover={{ y: -3, scale: 1.01 }}
                  whileTap={{ y: 1, scale: 0.99 }}
                  className="group relative flex w-full items-center gap-4 rounded-2xl border border-white/20 bg-gradient-to-b from-[#221435]/90 via-[#180c29]/90 to-[#10071e]/90 p-4 sm:p-5 text-left transition-all duration-200 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),0_8px_20px_rgba(0,0,0,0.6),0_1px_0_rgba(255,255,255,0.1)] hover:border-[#F45D9B] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_12px_30px_rgba(244,93,155,0.35),0_0_20px_rgba(244,93,155,0.2)] active:shadow-[inset_0_3px_6px_rgba(0,0,0,0.8)]"
                >
                  {/* Tactile Embossed Icon Box */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-gradient-to-b from-white/15 to-black/40 text-xl font-bold shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_4px_10px_rgba(0,0,0,0.5)] transition-all group-hover:border-[#F45D9B] group-hover:bg-[#F45D9B] group-hover:text-white group-hover:shadow-[0_0_20px_#F45D9B,inset_0_1px_2px_rgba(255,255,255,0.6)]">
                    {opt.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-[#F45D9B] opacity-90 drop-shadow-[0_0_6px_rgba(244,93,155,0.5)]">
                        [{opt.letter}]
                      </span>
                      <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                        {opt.title}
                      </h4>
                    </div>
                    <p className="mt-0.5 text-xs text-white/60 line-clamp-1 group-hover:text-white/85">
                      {opt.desc}
                    </p>
                  </div>

                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/30 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)] group-hover:border-[#F45D9B] group-hover:bg-[#F45D9B] group-hover:shadow-[0_0_10px_#F45D9B]">
                    <ArrowRight className="h-3.5 w-3.5 text-white/40 transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
                  </div>
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
            {/* Concentric Rotating Holographic Radar */}
            <div className="relative mx-auto flex h-32 w-32 items-center justify-center rounded-full border border-white/20 bg-gradient-to-b from-white/10 to-black/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8),0_10px_30px_rgba(0,0,0,0.8)]">
              <div className="absolute inset-2 rounded-full border-2 border-dashed border-[#F45D9B]/60 animate-[spin_8s_linear_infinite]" />
              <div className="absolute inset-4 rounded-full border border-violet-500/60 animate-[spin_4s_linear_infinite_reverse]" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-b from-[#F45D9B] to-[#991550] shadow-[0_0_40px_#F45D9B,inset_0_1px_2px_rgba(255,255,255,0.6)] animate-pulse">
                <Zap className="h-8 w-8 text-white fill-current" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                {CALC_MESSAGES[calcMsgIndex]}
              </h3>
              <p className="text-xs sm:text-sm text-white/50 max-w-sm mx-auto">
                Synthesizing communication vectors, romantic archetypes & verified campus peers.
              </p>
            </div>
          </motion.div>
        )}

        {/* ── 3. SKEUOMORPHIC SPOTIFY-WRAPPED TIER ARCHETYPE REVEAL CARD ── */}
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
              <div className="inline-flex items-center gap-2 rounded-full border border-[#F45D9B]/50 bg-gradient-to-b from-[#F45D9B]/30 to-[#F45D9B]/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-[#F45D9B] shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_0_20px_rgba(244,93,155,0.3)]">
                <Sparkles className="h-3.5 w-3.5" /> Your Romantic Archetype
              </div>
              <button
                onClick={restartQuiz}
                className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-xs font-bold text-white/60 shadow-[inset_0_1px_1px_rgba(0,0,0,0.6)] hover:text-white hover:border-white/30 transition-all"
              >
                <RotateCcw className="h-3 w-3" /> Retake
              </button>
            </div>

            {/* Tactile Embossed Poster Card */}
            <div className="relative overflow-hidden rounded-3xl border border-white/25 bg-gradient-to-b from-[#25153a] via-[#170c26] to-[#0c0416] p-6 sm:p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-2px_4px_rgba(0,0,0,0.8),0_20px_50px_rgba(0,0,0,0.8)]">
              <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-[#F45D9B]/25 blur-[70px]" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* 3D Mascot in Embossed Frame */}
                  <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl border border-white/30 bg-gradient-to-b from-white/20 to-black/60 p-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5),0_8px_20px_rgba(0,0,0,0.8),0_0_25px_rgba(244,93,155,0.4)]">
                    <img
                      src="/assets/vibe/cyber-mascot.png"
                      alt="Cyber Romantic Mascot"
                      className="h-full w-full object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]"
                    />
                  </div>
                  <div>
                    <div className="inline-block rounded-md bg-gradient-to-b from-[#F45D9B] to-[#b32766] px-2.5 py-0.5 font-mono text-xs font-black uppercase tracking-widest text-white shadow-[0_2px_8px_rgba(244,93,155,0.6),inset_0_1px_1px_rgba(255,255,255,0.5)]">
                      {result.code}
                    </div>
                    <h2 className="mt-1 font-geist text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                      {result.name}
                    </h2>
                    <p className="text-xs sm:text-sm font-medium italic text-white/70">
                      "{result.tagline}"
                    </p>
                  </div>
                </div>

                {/* Beveled Synergy Display Gauge */}
                <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-white/20 bg-gradient-to-b from-black/80 to-black/40 px-5 py-3.5 text-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.9),0_1px_0_rgba(255,255,255,0.15)] sm:flex-col sm:justify-center">
                  <span className="text-3xl font-black text-[#F45D9B] leading-none drop-shadow-[0_0_10px_#F45D9B]">94%</span>
                  <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-white/50">
                    Max Synergy
                  </span>
                </div>
              </div>

              {/* Core Traits Pills */}
              <div className="mt-5 flex flex-wrap gap-2">
                {result.traits.map((trait, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-white/15 bg-gradient-to-b from-white/10 to-white/5 px-3 py-1 font-mono text-[10px] font-bold text-white/90 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]"
                  >
                    ✦ {trait}
                  </span>
                ))}
              </div>

              {/* Inset Dating Style Blueprint Box */}
              <div className="mt-5 rounded-2xl border border-white/15 bg-gradient-to-b from-black/70 to-black/40 p-4 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.1)]">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#F45D9B]">
                  Dating Blueprint
                </span>
                <p className="mt-1 text-xs sm:text-sm leading-relaxed text-white/85">
                  {result.datingStyle}
                </p>
              </div>

              {/* Green Flags & Best Matches Beveled Containers */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/30 to-black/60 p-4 shadow-[inset_0_1px_1px_rgba(16,185,129,0.3)]">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    <ShieldCheck className="h-3.5 w-3.5" /> Top Green Flags
                  </span>
                  <ul className="mt-2 space-y-1.5 text-xs text-white/85">
                    {result.greenFlags.map((flag, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_6px_#10B981]" />
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-b from-rose-950/30 to-black/60 p-4 shadow-[inset_0_1px_1px_rgba(244,93,155,0.3)]">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-[#F45D9B] uppercase tracking-wider">
                    <Heart className="h-3.5 w-3.5 fill-current" /> Golden Matches
                  </span>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {result.bestMatches.map((m, i) => (
                      <Link
                        key={i}
                        href={`/compatibility/${result.code.toLowerCase()}-and-${m.toLowerCase()}`}
                        className="group flex items-center gap-1 rounded-xl border border-[#F45D9B]/40 bg-gradient-to-b from-[#F45D9B]/25 to-[#F45D9B]/10 px-2.5 py-1.5 text-xs font-bold text-[#F45D9B] shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] transition-all hover:bg-[#F45D9B] hover:text-white"
                      >
                        <span>{m}</span>
                        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Tactile 3D Extruded Conversion Actions ── */}
            <div className="space-y-3 pt-2">
              <Link
                href={`/login?archetype=${result.code}`}
                className="group relative flex w-full items-center justify-center gap-3 rounded-2xl border border-white/30 bg-gradient-to-b from-[#ff3b8d] via-[#F45D9B] to-[#991550] p-4 text-center font-bold text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),0_10px_30px_rgba(244,93,155,0.5),0_2px_0_rgba(255,255,255,0.2)] transition-all duration-200 hover:brightness-110 active:translate-y-0.5 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"
              >
                <Zap className="h-5 w-5 fill-current" />
                <span className="text-base sm:text-lg drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  Find Your {result.bestMatches.slice(0, 2).join(' & ')} Match Free →
                </span>
              </Link>

              <div className="flex gap-3">
                <button
                  onClick={handleCopyLink}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/20 bg-gradient-to-b from-white/10 to-black/40 py-3 text-xs font-bold text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),0_4px_10px_rgba(0,0,0,0.4)] transition-all hover:border-white/40 active:translate-y-0.5 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Share Link Copied to Clipboard!' : 'Share Archetype Card'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
