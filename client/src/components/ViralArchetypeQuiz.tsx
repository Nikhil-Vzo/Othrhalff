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
  Star
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
  "Mapping Cognitive Resonance...",
  "Calibrating Archetype Synergy...",
  "Synthesizing Your Blueprint..."
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
    /* ── Seamless Tactile Glass Console ── */
    <div 
      className="relative mx-auto w-full max-w-xl overflow-hidden rounded-[2.8rem] p-6 sm:p-9 text-white transition-all duration-300"
      style={{
        background: 'linear-gradient(175deg, #1f142b 0%, #12091d 45%, #0a0412 100%)',
        boxShadow: `
          -6px -6px 18px rgba(255, 255, 255, 0.06),
          12px 16px 40px rgba(0, 0, 0, 0.85),
          inset 0 1px 1px rgba(255, 255, 255, 0.35),
          inset 0 -2px 4px rgba(0, 0, 0, 0.9),
          0 0 0 1px rgba(255, 255, 255, 0.14)
        `
      }}
    >
      {/* ── Top Glass Specular Arc ── */}
      <div 
        className="pointer-events-none absolute inset-x-0 top-0 h-36 rounded-t-[2.8rem]"
        style={{
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.02) 60%, transparent 100%)'
        }}
      />

      <AnimatePresence mode="wait">
        {/* ── 1. SKEUOMORPHIC QUIZ QUESTION SCREEN ── */}
        {!result && !isCalculating && (
          <motion.div
            key={`step-${currentStep}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="relative z-10 space-y-6"
          >
            {/* Skeuomorphic Top Header */}
            <div className="flex items-center justify-between">
              <div 
                className="flex items-center gap-2.5 rounded-full px-3.5 py-1.5"
                style={{
                  background: 'linear-gradient(180deg, #180d24 0%, #0c0514 100%)',
                  boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.8), 0 1px 0 rgba(255, 255, 255, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.08)'
                }}
              >
                <div 
                  className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black text-white"
                  style={{
                    background: 'radial-gradient(circle at 35% 30%, #ff6bb1 0%, #F45D9B 50%, #a82062 100%)',
                    boxShadow: '0 2px 6px rgba(244, 93, 155, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.8)'
                  }}
                >
                  {currentStep + 1}
                </div>
                <span className="font-mono text-[10px] font-bold tracking-widest text-white/70 uppercase">
                  {QUIZ_QUESTIONS[currentStep].tag}
                </span>
              </div>

              <span className="font-mono text-xs font-bold text-white/40 tracking-wider">
                {currentStep + 1} / {QUIZ_QUESTIONS.length}
              </span>
            </div>

            {/* Debossed Progress Channel */}
            <div 
              className="h-2.5 w-full overflow-hidden rounded-full p-0.5"
              style={{
                background: '#07020c',
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.95), 0 1px 0 rgba(255, 255, 255, 0.12)'
              }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #F45D9B 0%, #ff2e93 50%, #9933ff 100%)',
                  boxShadow: '0 0 10px #F45D9B, inset 0 1px 1px rgba(255, 255, 255, 0.7)'
                }}
                initial={{ width: `${(currentStep / QUIZ_QUESTIONS.length) * 100}%` }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.35 }}
              />
            </div>

            {/* Question Heading */}
            <h2 className="font-geist text-2xl sm:text-[1.65rem] font-bold leading-snug text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              {QUIZ_QUESTIONS[currentStep].question}
            </h2>

            {/* Skeuomorphic Extruded 3D Push-Buttons */}
            <div className="space-y-3 pt-1">
              {QUIZ_QUESTIONS[currentStep].options.map((opt, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => handleOptionSelect(opt.codeMap)}
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 2 }}
                  className="group relative flex w-full items-center gap-3.5 rounded-2xl p-3.5 sm:p-4 text-left transition-all duration-150"
                  style={{
                    background: 'linear-gradient(180deg, #2b1c3d 0%, #1c102a 60%, #130a1e 100%)',
                    boxShadow: `
                      0 8px 18px -2px rgba(0, 0, 0, 0.7),
                      0 2px 4px rgba(0, 0, 0, 0.5),
                      inset 0 1px 1px rgba(255, 255, 255, 0.28),
                      inset 0 -2px 2px rgba(0, 0, 0, 0.6),
                      0 0 0 1px rgba(255, 255, 255, 0.12)
                    `
                  }}
                >
                  <div 
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                    style={{
                      background: 'linear-gradient(180deg, #100619 0%, #1d0f2b 100%)',
                      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.8), 0 1px 0 rgba(255, 255, 255, 0.15)'
                    }}
                  >
                    {opt.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                      {opt.title}
                    </h4>
                    <p className="text-xs text-white/60 line-clamp-1 group-hover:text-white/80">
                      {opt.desc}
                    </p>
                  </div>

                  <div 
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                    style={{
                      background: '#0d0517',
                      boxShadow: 'inset 0 2px 3px rgba(0, 0, 0, 0.8), 0 1px 0 rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <ArrowRight className="h-3 w-3 text-white/40 transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
                  </div>
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
            className="relative z-10 py-16 text-center space-y-6"
          >
            <div 
              className="relative mx-auto flex h-28 w-28 items-center justify-center rounded-full"
              style={{
                background: 'linear-gradient(180deg, #1b0f27 0%, #0a0312 100%)',
                boxShadow: 'inset 0 3px 6px rgba(0, 0, 0, 0.9), 0 1px 1px rgba(255, 255, 255, 0.2)'
              }}
            >
              <div className="absolute inset-1.5 rounded-full border-2 border-dashed border-[#F45D9B]/50 animate-[spin_6s_linear_infinite]" />
              <div 
                className="relative flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{
                  background: 'radial-gradient(circle at 35% 30%, #ff6bb1 0%, #F45D9B 60%, #991550 100%)',
                  boxShadow: '0 0 25px rgba(244, 93, 155, 0.8)'
                }}
              >
                <Zap className="h-7 w-7 text-white fill-current animate-pulse" />
              </div>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {CALC_MESSAGES[calcMsgIndex]}
            </h3>
          </motion.div>
        )}

        {/* ── 3. HYPER-AESTHETIC HERO REVEAL CARD ── */}
        {result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 space-y-6"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#F45D9B]">
                ✦ ROMANTIC ARCHETYPE
              </span>
              <button
                onClick={restartQuiz}
                className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold text-white/60 transition-all hover:text-white"
                style={{
                  background: 'linear-gradient(180deg, #221535 0%, #12091e 100%)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.2)'
                }}
              >
                <RotateCcw className="h-3 w-3" /> Retake
              </button>
            </div>

            {/* ── Centered Hero Artwork & Identity ── */}
            <div className="text-center space-y-4">
              {/* Glowing 3D Mascot Centerpiece */}
              <div className="relative mx-auto flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-[#F45D9B]/30 blur-[30px] animate-pulse" />
                <div 
                  className="relative flex h-full w-full items-center justify-center rounded-3xl p-2"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0.6) 100%)',
                    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.4), 0 12px 24px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.15)'
                  }}
                >
                  <img
                    src="/assets/vibe/cyber-mascot.png"
                    alt="Cyber Mascot"
                    className="h-full w-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)]"
                  />
                </div>
              </div>

              {/* Title & Badge */}
              <div className="space-y-1.5">
                <div 
                  className="inline-block rounded-full px-3 py-0.5 font-mono text-[11px] font-black uppercase tracking-wider text-white"
                  style={{
                    background: 'linear-gradient(180deg, #F45D9B 0%, #a82062 100%)',
                    boxShadow: '0 2px 8px rgba(244,93,155,0.5), inset 0 1px 1px rgba(255,255,255,0.6)'
                  }}
                >
                  {result.code} • {result.archetype.toUpperCase()}
                </div>

                <h2 className="font-geist text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                  {result.name}
                </h2>

                <p className="text-xs sm:text-sm italic text-white/75 max-w-md mx-auto leading-relaxed px-4">
                  "{result.tagline}"
                </p>
              </div>

              {/* Trait Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                {result.traits.map((trait, i) => (
                  <span
                    key={i}
                    className="rounded-full px-3 py-1 font-mono text-[10px] font-bold text-white/90"
                    style={{
                      background: 'rgba(255, 255, 255, 0.07)',
                      boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.2), 0 2px 4px rgba(0,0,0,0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.12)'
                    }}
                  >
                    ✦ {trait}
                  </span>
                ))}
              </div>
            </div>

            {/* ── Synergy Matrix & Green Flags Bar ── */}
            <div 
              className="rounded-2xl p-4 sm:p-5 space-y-3.5"
              style={{
                background: 'linear-gradient(180deg, #180d24 0%, #0d0515 100%)',
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.8), 0 1px 0 rgba(255, 255, 255, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.08)'
              }}
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[#F45D9B] flex items-center gap-1.5">
                  <Heart className="h-3.5 w-3.5 fill-current" /> Golden Matches:
                </span>
                <div className="flex gap-1.5">
                  {result.bestMatches.slice(0, 3).map((m, i) => (
                    <Link
                      key={i}
                      href={`/compatibility/${result.code.toLowerCase()}-and-${m.toLowerCase()}`}
                      className="rounded-md px-2 py-0.5 text-xs font-black text-[#F45D9B] transition-all hover:bg-[#F45D9B] hover:text-white"
                      style={{
                        background: 'rgba(244, 93, 155, 0.15)',
                        border: '1px solid rgba(244, 93, 155, 0.35)'
                      }}
                    >
                      {m}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs text-white/80 pt-1 border-t border-white/10">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                <span className="leading-snug">{result.greenFlags.slice(0, 2).join(' • ')}</span>
              </div>
            </div>

            {/* ── Skeuomorphic 3D Action Buttons ── */}
            <div className="space-y-3 pt-1">
              <Link
                href={`/login?archetype=${result.code}`}
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-center font-bold text-white transition-all active:translate-y-0.5"
                style={{
                  background: 'linear-gradient(180deg, #ff4d9e 0%, #F45D9B 50%, #9e1a5a 100%)',
                  boxShadow: `
                    0 8px 22px rgba(244, 93, 155, 0.55),
                    0 2px 4px rgba(0, 0, 0, 0.4),
                    inset 0 1px 1px rgba(255, 255, 255, 0.7),
                    inset 0 -2px 2px rgba(0, 0, 0, 0.5),
                    0 0 0 1px rgba(255, 255, 255, 0.2)
                  `
                }}
              >
                <Zap className="h-4 w-4 fill-current" />
                <span className="text-base drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  Find Your {result.bestMatches[0]} Match Free →
                </span>
              </Link>

              <button
                onClick={handleCopyLink}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold text-white/80 transition-all active:translate-y-0.5"
                style={{
                  background: 'linear-gradient(180deg, #221535 0%, #130a1e 100%)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.2), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                }}
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
