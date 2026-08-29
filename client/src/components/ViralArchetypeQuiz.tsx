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
  "Mapping Cognitive Functions...",
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
    /* ── Tactile Glass & Smoked Acrylic Shell with Geraldine Aesthetic ── */
    <div className="relative mx-auto w-full max-w-xl overflow-hidden rounded-[2.5rem] border border-white/20 bg-[#0e0717]/90 p-5 sm:p-8 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
      {/* Specular Top Sheen */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.08] to-transparent rounded-t-[2.5rem]" />

      <AnimatePresence mode="wait">
        {/* ── 1. CLEAN TACTILE QUESTION SCREEN ── */}
        {!result && !isCalculating && (
          <motion.div
            key={`step-${currentStep}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="relative z-10 space-y-6"
          >
            {/* Top Indicator & Progress */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F45D9B] text-[10px] font-black text-white">
                  {currentStep + 1}
                </span>
                <span className="font-mono text-[10px] font-bold tracking-widest text-white/60 uppercase">
                  {QUIZ_QUESTIONS[currentStep].tag}
                </span>
              </div>
              <span className="font-mono text-[10px] text-white/40">
                {currentStep + 1} / {QUIZ_QUESTIONS.length}
              </span>
            </div>

            {/* Tactile Progress Line */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#F45D9B] to-violet-400"
                initial={{ width: `${(currentStep / QUIZ_QUESTIONS.length) * 100}%` }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.35 }}
              />
            </div>

            {/* Question Heading */}
            <h2 className="text-xl sm:text-2xl font-bold leading-snug text-white">
              {QUIZ_QUESTIONS[currentStep].question}
            </h2>

            {/* Tactile Option Cards */}
            <div className="space-y-3 pt-1">
              {QUIZ_QUESTIONS[currentStep].options.map((opt, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => handleOptionSelect(opt.codeMap)}
                  whileHover={{ y: -2, scale: 1.01 }}
                  whileTap={{ y: 1, scale: 0.99 }}
                  className="group relative flex w-full items-center gap-3.5 rounded-2xl border border-white/15 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-4 text-left transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_4px_15px_rgba(0,0,0,0.5)] hover:border-[#F45D9B]/60 hover:bg-[#F45D9B]/10 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-black/40 text-lg">
                    {opt.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-white">
                      {opt.title}
                    </h4>
                    <p className="text-xs text-white/60 line-clamp-1">
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
            className="relative z-10 py-14 text-center space-y-6"
          >
            <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-white/20 bg-gradient-to-b from-white/10 to-black/60 shadow-[0_0_40px_rgba(244,93,155,0.3)]">
              <div className="absolute inset-1 rounded-full border border-dashed border-[#F45D9B]/60 animate-[spin_6s_linear_infinite]" />
              <Zap className="h-7 w-7 text-[#F45D9B] fill-current animate-pulse" />
            </div>

            <h3 className="font-geraldine text-3xl sm:text-4xl text-[#F45D9B]">
              {CALC_MESSAGES[calcMsgIndex]}
            </h3>
          </motion.div>
        )}

        {/* ── 3. ELEGANT SKEUOMORPHIC REVEAL POSTER ── */}
        {result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 space-y-5"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#F45D9B]">
                ✦ Romantic Blueprint
              </span>
              <button
                onClick={restartQuiz}
                className="flex items-center gap-1 text-[11px] font-bold text-white/50 hover:text-white transition-colors"
              >
                <RotateCcw className="h-3 w-3" /> Retake
              </button>
            </div>

            {/* Poster Card with Mascot & Geraldine Font */}
            <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-b from-[#211133] to-[#0d0517] p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_15px_40px_rgba(0,0,0,0.8)]">
              <div className="flex items-center gap-4">
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/25 bg-black/50 p-1 shadow-[0_0_20px_rgba(244,93,155,0.3)]">
                  <img
                    src="/assets/vibe/cyber-mascot.png"
                    alt="Cyber Mascot"
                    className="h-full w-full object-contain"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="inline-block rounded bg-[#F45D9B] px-2 py-0.5 font-mono text-[10px] font-black text-white">
                    {result.code}
                  </div>
                  <h2 className="font-geraldine text-3xl sm:text-4xl text-white tracking-normal leading-none mt-1">
                    {result.name}
                  </h2>
                  <p className="text-xs italic text-white/70 truncate mt-0.5">
                    "{result.tagline}"
                  </p>
                </div>
              </div>

              {/* Traits Pills */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {result.traits.map((trait, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-[10px] text-white/80"
                  >
                    ✦ {trait}
                  </span>
                ))}
              </div>

              {/* Green Flags & Best Matches */}
              <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
                <div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                    Green Flags
                  </span>
                  <p className="text-xs text-white/80 mt-1 line-clamp-2">
                    {result.greenFlags.slice(0, 2).join(' • ')}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-[#F45D9B] uppercase tracking-wider block">
                    Golden Match
                  </span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {result.bestMatches.slice(0, 2).map((m, i) => (
                      <Link
                        key={i}
                        href={`/compatibility/${result.code.toLowerCase()}-and-${m.toLowerCase()}`}
                        className="rounded-lg border border-[#F45D9B]/40 bg-[#F45D9B]/10 px-2 py-0.5 text-xs font-bold text-[#F45D9B] hover:bg-[#F45D9B] hover:text-white transition-all"
                      >
                        {m} →
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-1">
              <Link
                href={`/login?archetype=${result.code}`}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-gradient-to-b from-[#F45D9B] to-[#b32766] py-3.5 text-center font-bold text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_8px_25px_rgba(244,93,155,0.4)] transition-all hover:brightness-110 active:translate-y-0.5"
              >
                <Zap className="h-4 w-4 fill-current" />
                <span>Find Your {result.bestMatches[0]} Match (Free) →</span>
              </Link>

              <button
                onClick={handleCopyLink}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-2.5 text-xs font-bold text-white/80 transition-colors hover:bg-white/10"
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
