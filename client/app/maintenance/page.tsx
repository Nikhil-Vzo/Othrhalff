"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { StarField } from '../../src/components/StarField';
import { 
  Clock, 
  Mail, 
  Copy, 
  Check, 
  ShieldCheck, 
  Globe, 
  Sparkles, 
  ArrowUpRight,
  Send,
  Lock
} from 'lucide-react';

const TARGET_EMAIL = "lachavzo11@gmail.com";
const MAIL_SUBJECT = encodeURIComponent("Domain Acquisition Inquiry - othrhalff.com");
const MAIL_BODY = encodeURIComponent(
  "Hello,\n\nI am contacting you regarding the acquisition of this domain/page.\n\nProposed Offer (USD): \nBuyer / Organization Name: \nContact Phone (Optional): \nAdditional Message / Terms:\n\nThank you!"
);
const MAILTO_URL = `mailto:${TARGET_EMAIL}?subject=${MAIL_SUBJECT}&body=${MAIL_BODY}`;

export default function MaintenancePage() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [is24Hour, setIs24Hour] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleCopyEmail = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(TARGET_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }, []);

  // Time calculations
  const rawHours = currentTime ? currentTime.getHours() : 12;
  const displayHours = is24Hour ? rawHours : rawHours % 12 || 12;
  const hoursStr = String(displayHours).padStart(2, '0');
  const minutesStr = currentTime ? String(currentTime.getMinutes()).padStart(2, '0') : '00';
  const secondsStr = currentTime ? String(currentTime.getSeconds()).padStart(2, '0') : '00';
  const ampmStr = rawHours >= 12 ? 'PM' : 'AM';
  const currentSeconds = currentTime ? currentTime.getSeconds() : 0;

  // Date formatting
  const formattedDate = currentTime
    ? currentTime.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Synchronizing time...';

  // Timezone display
  const localTimezone = mounted
    ? (Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local Time')
    : 'Local Time';

  const utcTimeString = currentTime
    ? `${String(currentTime.getUTCHours()).padStart(2, '0')}:${String(
        currentTime.getUTCMinutes()
      ).padStart(2, '0')}:${String(currentTime.getUTCSeconds()).padStart(2, '0')} UTC`
    : '--:--:-- UTC';

  // SVG circular progress calculation for the seconds indicator
  const circleRadius = 46;
  const circumference = 2 * Math.PI * circleRadius;
  const progressOffset = circumference - (currentSeconds / 60) * circumference;

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col justify-between items-center px-4 py-8 overflow-x-hidden selection:bg-neon selection:text-white font-sans">
      {/* Background Starfield (Stars & Shooting Stars) */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <StarField />
      </div>

      {/* Subtle radial ambient atmosphere */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,0,127,0.06),rgba(0,0,0,0.6))]" />

      {/* Top Bar: Brand & Live Notice Pill */}
      <header className="w-full max-w-4xl relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md shadow-inner">
            <Globe className="w-5 h-5 text-neon" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight uppercase text-white leading-none">
              Othr<span className="text-neon">Halff</span>
            </h1>
            <p className="text-[10px] tracking-[0.25em] uppercase text-neutral-500 font-semibold">
              Domain Portfolio
            </p>
          </div>
        </div>

        {/* Live Status Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Public Sale & Acquisition Notice</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-4xl relative z-10 my-8 flex flex-col items-center gap-8">
        
        {/* Clock Card Section */}
        <section 
          aria-label="Live Clock"
          className="w-full bg-neutral-950/40 border border-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-10 shadow-[0_0_50px_rgba(255,0,127,0.08)] flex flex-col items-center relative overflow-hidden"
        >
          {/* Subtle top card glow line */}
          <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-[#ff007f]/50 to-transparent" />

          {/* Clock Header Controls */}
          <div className="w-full flex items-center justify-between text-xs text-neutral-400 font-medium mb-6 pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-neon" />
              <span className="tracking-wide">Standard Real-Time Clock</span>
            </div>
            <button
              onClick={() => setIs24Hour((prev) => !prev)}
              id="toggle-clock-format-btn"
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-[11px] font-mono tracking-wider text-neutral-300 hover:text-white"
              title="Toggle between 12-hour and 24-hour mode"
            >
              {is24Hour ? 'Switch to 12H' : 'Switch to 24H'}
            </button>
          </div>

          {/* Digital Clock Display with circular second radar */}
          <div className="relative flex items-center justify-center py-4 my-2">
            {/* Circular second progress track (visible on sm screens and up) */}
            <div className="absolute -inset-6 sm:-inset-8 pointer-events-none hidden xs:flex items-center justify-center">
              <svg className="w-48 h-48 sm:w-60 sm:h-60 -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r={circleRadius}
                  className="stroke-neutral-800/40"
                  strokeWidth="1.5"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={circleRadius}
                  className="stroke-neon transition-all duration-300 ease-linear"
                  strokeWidth="2.5"
                  strokeDasharray={circumference}
                  strokeDashoffset={progressOffset}
                  strokeLinecap="round"
                  fill="none"
                  style={{ filter: 'drop-shadow(0 0 6px rgba(255, 0, 127, 0.7))' }}
                />
              </svg>
            </div>

            {/* Numbers Display */}
            <div className="flex items-baseline gap-1 sm:gap-3 select-none z-10">
              {/* Hours */}
              <div className="flex flex-col items-center">
                <span className="text-4xl xs:text-5xl sm:text-7xl font-mono font-black tracking-tight text-white tabular-nums drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                  {hoursStr}
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase font-mono tracking-widest text-neutral-500 mt-1">
                  Hours
                </span>
              </div>

              {/* Blinking Colon */}
              <span className="text-3xl xs:text-4xl sm:text-6xl font-mono font-light text-neon animate-pulse -translate-y-2 sm:-translate-y-3">
                :
              </span>

              {/* Minutes */}
              <div className="flex flex-col items-center">
                <span className="text-4xl xs:text-5xl sm:text-7xl font-mono font-black tracking-tight text-white tabular-nums drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                  {minutesStr}
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase font-mono tracking-widest text-neutral-500 mt-1">
                  Minutes
                </span>
              </div>

              {/* Blinking Colon */}
              <span className="text-3xl xs:text-4xl sm:text-6xl font-mono font-light text-neon animate-pulse -translate-y-2 sm:-translate-y-3">
                :
              </span>

              {/* Seconds */}
              <div className="flex flex-col items-center">
                <span className="text-4xl xs:text-5xl sm:text-7xl font-mono font-black tracking-tight text-neon tabular-nums drop-shadow-[0_0_25px_rgba(255,0,127,0.5)]">
                  {secondsStr}
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase font-mono tracking-widest text-neon/70 mt-1">
                  Seconds
                </span>
              </div>

              {/* AM/PM Pill (Only in 12-hour mode) */}
              {!is24Hour && (
                <div className="ml-1 sm:ml-2 -translate-y-4 sm:-translate-y-6">
                  <span className="px-2 py-0.5 rounded-md bg-white/10 text-white font-mono text-xs sm:text-sm font-bold tracking-wider">
                    {ampmStr}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Date & Timezone Details */}
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-center text-neutral-400 text-sm">
            <span className="font-medium text-neutral-200">
              {formattedDate}
            </span>
            <span className="hidden sm:inline text-neutral-600">•</span>
            <span className="font-mono text-xs text-neutral-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/5">
              {localTimezone}
            </span>
            <span className="hidden sm:inline text-neutral-600">•</span>
            <span className="font-mono text-xs text-neutral-400">
              {utcTimeString}
            </span>
          </div>
        </section>

        {/* Domain For Sale Notice & Contact Section */}
        <section 
          aria-label="Domain Sale Announcement"
          className="w-full bg-neutral-950/40 border border-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-10 shadow-[0_0_50px_rgba(255,0,127,0.08)] relative overflow-hidden"
        >
          {/* Subtle neon corner highlight */}
          <div className="absolute -top-16 -right-16 w-32 h-32 bg-[#ff007f]/15 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col items-center text-center max-w-2xl mx-auto space-y-4">
            
            {/* Tag */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neon/10 border border-neon/30 text-neon text-[11px] font-bold tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Publicly Available for Sale</span>
            </div>

            {/* Primary Headline */}
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              This Page & Domain Are <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-200 to-[#ff007f]">Available for Purchase</span>
            </h2>

            {/* Description */}
            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed max-w-xl">
              This premium domain name, branding, and web presence are publicly available for acquisition. 
              If you represent an organization or are an interested buyer, you can submit an offer or initiate transfer discussions directly with the owner.
            </p>

            {/* Three key pillars */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 text-left">
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-sm flex items-start gap-3">
                <div className="p-2 rounded-xl bg-neon/10 text-neon">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Direct Transfer</h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Quick domain auth code push to your preferred registrar.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-sm flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Escrow Protected</h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Transactions can be handled via trusted escrow platforms.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-sm flex items-start gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Verified Ownership</h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Deal directly with the primary registered asset holder.</p>
                </div>
              </div>
            </div>

            {/* Action Card: Click to Redirect to Mailbox */}
            <div className="w-full mt-4 p-5 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-left w-full sm:w-auto">
                <p className="text-xs uppercase tracking-widest text-neutral-400 font-bold">
                  Official Inquiries & Offers:
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4 text-neon" />
                  <a
                    href={MAILTO_URL}
                    className="font-mono text-sm sm:text-base font-semibold text-white hover:text-neon transition-colors underline-offset-4 hover:underline break-all"
                  >
                    {TARGET_EMAIL}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {/* One-Click Copy Button */}
                <button
                  onClick={handleCopyEmail}
                  id="copy-email-btn"
                  className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-neutral-200 hover:text-white transition-all flex items-center gap-1.5 active:scale-95"
                  title="Copy email address"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                {/* Primary CTA Button: Click to Open Mail Client / Mailbox */}
                <a
                  href={MAILTO_URL}
                  id="mail-redirect-cta"
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-[#ff007f] hover:bg-[#e00070] text-white text-xs sm:text-sm font-bold tracking-wide shadow-[0_0_20px_rgba(255,0,127,0.4)] hover:shadow-[0_0_25px_rgba(255,0,127,0.6)] transition-all flex items-center justify-center gap-2 active:scale-95 group"
                >
                  <Send className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  <span>Send Offer via Mail</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" />
                </a>
              </div>
            </div>

            <p className="text-[11px] text-neutral-500 tracking-wide mt-2">
              Clicking the button above redirects directly to your email composer addressed to{' '}
              <a href={MAILTO_URL} className="text-neutral-400 underline hover:text-white">
                {TARGET_EMAIL}
              </a>
              .
            </p>

          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-4xl relative z-10 text-center py-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-2">
        <p>
          © {new Date().getFullYear()} Othrhalff. Domain & Digital Asset Portfolio.
        </p>
        <p className="flex items-center gap-1.5">
          <span>Inquiries:</span>
          <a href={MAILTO_URL} className="text-neutral-400 hover:text-neon transition-colors font-mono">
            {TARGET_EMAIL}
          </a>
        </p>
      </footer>
    </div>
  );
}
