"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, CheckCircle2, RotateCcw, Share2, Copy, Check, Heart, ShieldCheck, Zap } from 'lucide-react';
import Link from 'next/link';
import { personalityTypes, PersonalityType } from '../seo/data/personalityTypes';

const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "When meeting someone new, what creates an immediate spark for you?",
    options: [
      { text: "Deep, unfiltered conversations about life, dreams & ideas", type: 'N', codeMap: ['INFP', 'INFJ', 'INTJ', 'INTP'] },
      { text: "Playful teasing, spontaneous humor & easy banter", type: 'E', codeMap: ['ENFP', 'ENTP', 'ESFP', 'ESTP'] },
      { text: "Quiet presence, emotional warmth & genuine attentiveness", type: 'F', codeMap: ['ISFJ', 'ISFP', 'ENFJ', 'ESFJ'] },
      { text: "Sharp intellectual debates & high-ambition synergy", type: 'T', codeMap: ['ENTJ', 'INTJ', 'ENTP', 'ISTJ'] }
    ]
  },
  {
    id: 2,
    question: "How do you prefer to spend your ideal weekend evening?",
    options: [
      { text: "Cozy 1-on-1 intimate dinner, stargazing, or watching indie films", type: 'I', codeMap: ['INFP', 'INTJ', 'INFJ', 'ISFP'] },
      { text: "Exploring an underground music gig, cafe, or night adventure", type: 'E', codeMap: ['ENFP', 'ESTP', 'ESFP', 'ENTP'] },
      { text: "Working on creative projects or deep research rabbit holes", type: 'T', codeMap: ['INTP', 'INTJ', 'ISTP', 'ISTJ'] },
      { text: "Hosting a fun gathering with close friends & storytelling", type: 'F', codeMap: ['ENFJ', 'ESFJ', 'ISFJ', 'ENFP'] }
    ]
  },
  {
    id: 3,
    question: "What is your biggest non-negotiable green flag?",
    options: [
      { text: "High emotional intelligence & radical honesty", type: 'F', codeMap: ['INFJ', 'INFP', 'ENFJ', 'ISFP'] },
      { text: "Direct communication with zero mind games or mixed signals", type: 'T', codeMap: ['INTJ', 'ENTJ', 'ISTJ', 'ISTP'] },
      { text: "Ability to be completely unhinged and laugh at everything", type: 'E', codeMap: ['ENFP', 'ENTP', 'ESFP', 'ESTP'] },
      { text: "Consistency, loyalty, and remembering the tiny details", type: 'S', codeMap: ['ISFJ', 'ISTJ', 'ESFJ', 'ISFP'] }
    ]
  },
  {
    id: 4,
    question: "What is your secret communication superpower?",
    options: [
      { text: "I understand how people feel before they even say a word", type: 'N', codeMap: ['INFJ', 'ENFJ', 'INFP', 'ISFJ'] },
      { text: "I can break down complex ideas and solve problems clearly", type: 'T', codeMap: ['INTJ', 'INTP', 'ENTJ', 'ISTJ'] },
      { text: "I bring magnetic energy and make anyone feel at ease", type: 'E', codeMap: ['ENFP', 'ESFP', 'ENTP', 'ESFJ'] },
      { text: "I am a rock-solid listener who holds space without judgment", type: 'I', codeMap: ['ISFP', 'ISTP', 'ISFJ', 'INFP'] }
    ]
  }
];

export const ViralArchetypeQuiz: React.FC<{ onComplete?: (result: PersonalityType) => void }> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCodes, setSelectedCodes] = useState<string[][]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<PersonalityType | null>(null);
  const [copied, setCopied] = useState(false);

  const handleOptionSelect = (codeMap: string[]) => {
    const nextSelections = [...selectedCodes, codeMap];
    setSelectedCodes(nextSelections);

    if (currentStep < QUIZ_QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsCalculating(true);
      setTimeout(() => {
        // Find most frequent personality code across chosen answers
        const flatCodes = nextSelections.flat();
        const counts: Record<string, number> = {};
        flatCodes.forEach(code => {
          counts[code] = (counts[code] || 0) + 1;
        });
        const sortedCodes = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
        const bestCode = sortedCodes[0] || 'INFP';
        const finalType = personalityTypes.find(t => t.code === bestCode) || personalityTypes[0];

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
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/vibe?type=${result.code}` : `https://www.othrhalff.in/vibe?type=${result.code}`;
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

  return (
    <div className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-[2.5rem] border border-white/15 bg-[#0a0514]/90 p-6 sm:p-10 text-white shadow-[0_24px_80px_rgba(244,93,155,0.18)] backdrop-blur-2xl">
      <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#F45D9B]/20 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-violet-600/20 blur-[100px]" />

      <AnimatePresence mode="wait">
        {!result && !isCalculating && (
          <motion.div
            key={`step-${currentStep}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="relative z-10 space-y-6"
          >
            {/* Header progress */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F45D9B] text-xs font-black text-white">
                  {currentStep + 1}
                </span>
                <span className="font-mono text-xs uppercase tracking-widest text-white/50">
                  Question {currentStep + 1} of {QUIZ_QUESTIONS.length}
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold text-[#F45D9B]">
                <Sparkles className="h-3 w-3" /> Romantic Archetype Radar
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-gradient-to-r from-[#F45D9B] to-violet-500 transition-all duration-300"
                style={{ width: `${((currentStep + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
              />
            </div>

            {/* Question Text */}
            <h2 className="text-xl sm:text-2xl font-black leading-tight text-white">
              {QUIZ_QUESTIONS[currentStep].question}
            </h2>

            {/* Options */}
            <div className="space-y-3 pt-2">
              {QUIZ_QUESTIONS[currentStep].options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(opt.codeMap)}
                  className="group relative flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5 text-left text-sm sm:text-base font-medium text-white/90 transition-all hover:border-[#F45D9B]/60 hover:bg-[#F45D9B]/10 hover:shadow-[0_8px_30px_rgba(244,93,155,0.2)]"
                >
                  <span>{opt.text}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-white/30 transition-transform group-hover:translate-x-1 group-hover:text-[#F45D9B]" />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {isCalculating && (
          <motion.div
            key="calculating"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 py-16 text-center space-y-5"
          >
            <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#F45D9B] to-violet-600 shadow-[0_0_50px_rgba(244,93,155,0.5)] animate-pulse">
              <Zap className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-black text-white">Synthesizing Your Chemistry Profile...</h3>
            <p className="text-sm text-white/60 max-w-sm mx-auto">
              Analyzing cognitive functions, emotional priorities, and pairing synergy with verified students.
            </p>
          </motion.div>
        )}

        {result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 space-y-6"
          >
            {/* Badge top */}
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#F45D9B]/20 border border-[#F45D9B]/40 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-[#F45D9B]">
                <Sparkles className="h-3.5 w-3.5" /> Your Romantic Archetype
              </div>
              <button
                onClick={restartQuiz}
                className="flex items-center gap-1.5 text-xs font-bold text-white/50 hover:text-white transition-colors"
              >
                <RotateCcw className="h-3 w-3" /> Retake
              </button>
            </div>

            {/* Main Archetype Title */}
            <div>
              <span className="font-mono text-sm font-black text-[#F45D9B] tracking-wider">{result.code}</span>
              <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                {result.name}
              </h2>
              <p className="mt-1 text-sm italic text-white/70">
                "{result.tagline}"
              </p>
            </div>

            {/* Archetype Card */}
            <div className="rounded-3xl border border-white/15 bg-white/5 p-5 sm:p-6 space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-white/50">Core Dating Style</span>
                <p className="mt-1 text-sm leading-relaxed text-white/90">
                  {result.datingStyle}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/10">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" /> Top Green Flags
                  </span>
                  <ul className="mt-2 space-y-1 text-xs text-white/80">
                    {result.greenFlags.map((flag, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className="h-1 w-1 rounded-full bg-emerald-400" />
                        {flag}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5" /> Highest Synergy Pairs
                  </span>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {result.bestMatches.map((m, i) => (
                      <Link
                        key={i}
                        href={`/compatibility/${result.code.toLowerCase()}-and-${m.toLowerCase()}`}
                        className="rounded-lg border border-[#F45D9B]/40 bg-[#F45D9B]/10 px-2.5 py-1 text-xs font-bold text-[#F45D9B] hover:bg-[#F45D9B] hover:text-white transition-all"
                      >
                        {m} Synergy →
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Conversion CTA */}
            <div className="space-y-3 pt-2">
              <Link
                href={`/login?archetype=${result.code}`}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#F45D9B] to-violet-600 p-4 text-center font-bold text-white shadow-[0_12px_40px_rgba(244,93,155,0.4)] transition-all hover:scale-[1.02] hover:shadow-[0_16px_50px_rgba(244,93,155,0.6)]"
              >
                <Zap className="h-5 w-5 fill-current" />
                Find Your {result.bestMatches.join(' & ')} Counterpart (Free)
              </Link>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-3 text-xs font-bold text-white/80 hover:bg-white/10 transition-colors"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Link Copied to Clipboard!' : 'Share Archetype Card'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
