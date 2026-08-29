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
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { personalityTypes, PersonalityType } from '../seo/data/personalityTypes';

const QUIZ_QUESTIONS = [
  {
    id: 1,
    tag: "THE SPARK",
    question: "When meeting someone new, what creates an instant spark for you?",
    options: [
      {
        letter: "A",
        title: "Deep Philosophical Banter",
        desc: "2 AM talks about life, mindsets & ideas",
        icon: "🔮",
        codeMap: ['INFP', 'INFJ', 'INTJ', 'INTP']
      },
      {
        letter: "B",
        title: "Electric Playful Banter",
        desc: "Quick wit, playful teasing & humor",
        icon: "⚡",
        codeMap: ['ENFP', 'ENTP', 'ESFP', 'ESTP']
      },
      {
        letter: "C",
        title: "Quiet Emotional Presence",
        desc: "Warmth, gentleness & feeling understood",
        icon: "🌊",
        codeMap: ['ISFJ', 'ISFP', 'ENFJ', 'ESFJ']
      },
      {
        letter: "D",
        title: "Intellectual Drive & Ambition",
        desc: "Sharp problem-solving & mutual growth",
        icon: "🚀",
        codeMap: ['ENTJ', 'INTJ', 'ENTP', 'ISTJ']
      }
    ]
  },
  {
    id: 2,
    tag: "ENERGY",
    question: "How does your battery recharge on an ideal weekend?",
    options: [
      {
        letter: "A",
        title: "Intimate 1-on-1 Sanctuary",
        desc: "Cozy dinner, stargazing, or indie films",
        icon: "🌙",
        codeMap: ['INFP', 'INTJ', 'INFJ', 'ISFP']
      },
      {
        letter: "B",
        title: "Spontaneous Night Quest",
        desc: "Underground music gig or night drives",
        icon: "🔥",
        codeMap: ['ENFP', 'ESTP', 'ESFP', 'ENTP']
      },
      {
        letter: "C",
        title: "Creative Solitude",
        desc: "Building a passion project or deep rabbit holes",
        icon: "💡",
        codeMap: ['INTP', 'INTJ', 'ISTP', 'ISTJ']
      },
      {
        letter: "D",
        title: "Vibrant Social Circle",
        desc: "Hosting great friends & loud storytelling",
        icon: "🥂",
        codeMap: ['ENFJ', 'ESFJ', 'ISFJ', 'ENFP']
      }
    ]
  },
  {
    id: 3,
    tag: "GREEN FLAG",
    question: "What is your biggest non-negotiable green flag?",
    options: [
      {
        letter: "A",
        title: "Emotional Depth & Honesty",
        desc: "Expressing real feelings without ego games",
        icon: "💎",
        codeMap: ['INFJ', 'INFP', 'ENFJ', 'ISFP']
      },
      {
        letter: "B",
        title: "Radical Transparency",
        desc: "Zero mixed signals; clear, direct communication",
        icon: "🎯",
        codeMap: ['INTJ', 'ENTJ', 'ISTJ', 'ISTP']
      },
      {
        letter: "C",
        title: "Unhinged Mutual Humor",
        desc: "Laughing until your stomach hurts over dumb jokes",
        icon: "🎭",
        codeMap: ['ENFP', 'ENTP', 'ESFP', 'ESTP']
      },
      {
        letter: "D",
        title: "Steady Loyalty",
        desc: "Remembering tiny details & being a safe harbor",
        icon: "⚓",
        codeMap: ['ISFJ', 'ISTJ', 'ESFJ', 'ISFP']
      }
    ]
  },
  {
    id: 4,
    tag: "SUPERPOWER",
    question: "What is your secret superpower in relationships?",
    options: [
      {
        letter: "A",
        title: "Intuitive Empathy",
        desc: "Sensing feelings before words are spoken",
        icon: "👁️",
        codeMap: ['INFJ', 'ENFJ', 'INFP', 'ISFJ']
      },
      {
        letter: "B",
        title: "Strategic Clarity",
        desc: "Bringing calm, level-headed logic to chaos",
        icon: "🧠",
        codeMap: ['INTJ', 'INTP', 'ENTJ', 'ISTJ']
      },
      {
        letter: "C",
        title: "Magnetic Warmth",
        desc: "Making anyone feel energized and alive",
        icon: "✨",
        codeMap: ['ENFP', 'ESFP', 'ENTP', 'ESFJ']
      },
      {
        letter: "D",
        title: "Anchored Presence",
        desc: "A dependable confidant who never judges",
        icon: "🛡️",
        codeMap: ['ISFP', 'ISTP', 'ISFJ', 'INFP']
      }
    ]
  }
];

const CALC_MESSAGES = [
  "Mapping Cognitive Synergy...",
  "Calibrating Resonance...",
  "Synthesizing Archetype..."
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
      }, 450);
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
      }, 1400);
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
    /* ── Clean Modern Luxury Glass Container ── */
    <div className="relative mx-auto w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-black/70 p-6 sm:p-8 text-white backdrop-blur-2xl shadow-2xl shadow-black/80">
      {/* Ambient Lighting Glow */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-48 w-48 rounded-full bg-[#F45D9B]/15 blur-[80px]" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-violet-600/15 blur-[80px]" />

      <AnimatePresence mode="wait">
        {/* ── 1. CLEAN MODERN QUESTION SCREEN ── */}
        {!result && !isCalculating && (
          <motion.div
            key={`step-${currentStep}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="relative z-10 space-y-5"
          >
            {/* Top Indicator & Step */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F45D9B] text-[10px] font-bold text-white">
                  {currentStep + 1}
                </span>
                <span className="font-mono text-[10px] font-bold tracking-widest text-white/60 uppercase">
                  {QUIZ_QUESTIONS[currentStep].tag}
                </span>
              </div>

              <span className="font-mono text-xs font-medium text-white/40">
                {currentStep + 1} / {QUIZ_QUESTIONS.length}
              </span>
            </div>

            {/* Smooth Progress Line */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#F45D9B] to-violet-400"
                initial={{ width: `${(currentStep / QUIZ_QUESTIONS.length) * 100}%` }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Question Heading */}
            <h2 className="font-geist text-xl sm:text-2xl font-bold leading-snug text-white">
              {QUIZ_QUESTIONS[currentStep].question}
            </h2>

            {/* Clean Modern Option Cards */}
            <div className="space-y-2.5 pt-1">
              {QUIZ_QUESTIONS[currentStep].options.map((opt, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => handleOptionSelect(opt.codeMap)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="group flex w-full items-center gap-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 text-left transition-all duration-150 hover:border-[#F45D9B]/50 hover:bg-[#F45D9B]/10 active:bg-[#F45D9B]/20"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-lg transition-colors group-hover:bg-[#F45D9B]/20">
                    {opt.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm sm:text-base font-semibold text-white group-hover:text-white">
                      {opt.title}
                    </h4>
                    <p className="mt-0.5 text-xs text-white/50 line-clamp-1 group-hover:text-white/80">
                      {opt.desc}
                    </p>
                  </div>

                  <ArrowRight className="h-4 w-4 shrink-0 text-white/30 transition-transform group-hover:translate-x-1 group-hover:text-[#F45D9B]" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── 2. SYNTHESIZING SCREEN ── */}
        {isCalculating && (
          <motion.div
            key="calculating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 py-14 text-center space-y-5"
          >
            <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#F45D9B]/10 border border-[#F45D9B]/30">
              <Zap className="h-8 w-8 text-[#F45D9B] fill-current animate-pulse" />
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-white">
              {CALC_MESSAGES[calcMsgIndex]}
            </h3>
          </motion.div>
        )}

        {/* ── 3. CLEAN MODERN REVEAL CARD ── */}
        {result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="relative z-10 space-y-6"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#F45D9B]">
                ✦ ROMANTIC ARCHETYPE
              </span>
              <button
                onClick={restartQuiz}
                className="flex items-center gap-1 text-[11px] font-medium text-white/50 hover:text-white transition-colors"
              >
                <RotateCcw className="h-3 w-3" /> Retake
              </button>
            </div>

            {/* Center Artwork & Identity */}
            <div className="text-center space-y-4">
              {/* Floating 3D Mascot */}
              <div className="relative mx-auto h-24 w-24 sm:h-28 sm:w-28">
                <div className="absolute inset-0 rounded-full bg-[#F45D9B]/25 blur-[24px]" />
                <img
                  src="/assets/vibe/cyber-mascot.png"
                  alt="Cyber Mascot"
                  className="relative h-full w-full object-contain drop-shadow-xl"
                />
              </div>

              {/* Archetype Title & Tagline */}
              <div className="space-y-1.5">
                <div className="inline-block rounded-full bg-[#F45D9B]/15 border border-[#F45D9B]/30 px-3 py-0.5 font-mono text-[11px] font-bold text-[#F45D9B]">
                  {result.code} • {result.archetype}
                </div>

                <h2 className="font-geist text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {result.name}
                </h2>

                <p className="text-xs sm:text-sm italic text-white/70 max-w-sm mx-auto leading-relaxed">
                  "{result.tagline}"
                </p>
              </div>

              {/* Trait Pills */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                {result.traits.map((trait, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-0.5 font-mono text-[10px] text-white/80"
                  >
                    ✦ {trait}
                  </span>
                ))}
              </div>
            </div>

            {/* Synergy & Match Section */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-[#F45D9B] flex items-center gap-1.5">
                  <Heart className="h-3.5 w-3.5 fill-current" /> Golden Matches:
                </span>
                <div className="flex gap-1.5">
                  {result.bestMatches.slice(0, 3).map((m, i) => (
                    <Link
                      key={i}
                      href={`/compatibility/${result.code.toLowerCase()}-and-${m.toLowerCase()}`}
                      className="rounded-md border border-[#F45D9B]/40 bg-[#F45D9B]/15 px-2 py-0.5 text-xs font-bold text-[#F45D9B] hover:bg-[#F45D9B] hover:text-white transition-colors"
                    >
                      {m}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs text-white/75 pt-2 border-t border-white/10">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                <span className="leading-snug">{result.greenFlags.slice(0, 2).join(' • ')}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-1">
              <Link
                href={`/login?archetype=${result.code}`}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#F45D9B] via-[#FF007F] to-[#b32766] py-3.5 text-center font-bold text-white shadow-lg shadow-[#F45D9B]/25 transition-all hover:opacity-95 active:scale-[0.99]"
              >
                <Zap className="h-4 w-4 fill-current" />
                <span>Find Your {result.bestMatches[0]} Match Free →</span>
              </Link>

              <button
                onClick={handleCopyLink}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-xs font-semibold text-white/75 transition-colors hover:bg-white/[0.08]"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Link Copied to Clipboard!' : 'Share Archetype Card'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
