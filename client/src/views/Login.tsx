"use client";

import React, { useState, useEffect } from 'react';
import { RotateCcw, Mail, ArrowRight, Check, Loader2, X, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { NeonInput, NeonButton } from '../components/Common';
import { useRouter as useNavigate } from 'next/navigation';
import Link from 'next/link';
import { authService } from '../services/auth';
import { analytics } from '../utils/analytics';
import { useAuth } from '../context/AuthContext';
import { validateEmail } from '../utils/emailSanitizer';

export const Login: React.FC = () => {
  const { currentUser, needsOnboarding, isLoading: isAuthLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState(''); // Anti-bot honeypot field
  const [isLogin, setIsLogin] = useState(true);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (currentUser && !isAuthLoading) {
      const target = needsOnboarding ? '/onboarding' : '/home';
      navigate.replace(target);
    }
  }, [currentUser, needsOnboarding, isAuthLoading, navigate]);

  // Auto-dismiss success messages after 8 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Check for OAuth errors in URL hash
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash.includes('error_description=')) {
        const params = new URLSearchParams(hash.replace('#', '?'));
        const desc = params.get('error_description');
        if (desc) setError(decodeURIComponent(desc).replace(/\+/g, ' '));
      }
    }
  }, []);

  // Update suggestions & clear error when email changes
  useEffect(() => {
    if (error) setError(null);
    if (!email.trim()) {
      setSuggestion(null);
      return;
    }
    const validation = validateEmail(email);
    setSuggestion(validation.suggestion || null);
  }, [email]);

  const handleApplySuggestion = () => {
    if (suggestion) {
      setEmail(suggestion);
      setSuggestion(null);
      setError(null);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Bot check: if hidden honeypot field is filled by bot scripts, abort silently
    if (honeypot.trim()) {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setSuccess('Magic Link sent! Please check your inbox.');
      }, 1000);
      return;
    }

    if (!isLogin && !agreedToTerms) {
      setError('You must agree to the Terms and Conditions to continue.');
      return;
    }

    // Perform smart email validation (RFC syntax, disposable blocker, typo guard)
    const validation = validateEmail(email);

    if (!validation.isValid) {
      setError(validation.error || 'Please enter a valid email address.');
      return;
    }

    const cleanEmail = validation.cleanEmail;

    // If there's an active typo suggestion, auto-correct and inform the user
    const finalEmail = validation.suggestion || cleanEmail;

    setIsLoading(true);
    try {
      await authService.signInWithMagicLink(finalEmail);
      analytics.login('MagicLink');
      setSuccess(`Magic Link sent to ${finalEmail}! Check your inbox (or spam) to sign in instantly.`);
      setSuggestion(null);
    } catch (err: any) {
      console.error('Magic link error:', err);
      const msg = err.message || '';
      if (msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('over_email_send_rate_limit')) {
        setError('Email rate limit exceeded for magic links. Please sign in using "Continue with Google" or wait a few minutes before trying again.');
      } else {
        setError(msg || 'Failed to send magic link. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);

    if (!isLogin && !agreedToTerms) {
      setError('You must agree to the Terms and Conditions to continue.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.signInWithGoogle();
      analytics.login('Google');
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(err.message || 'Failed to initialize Google login. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full overflow-y-auto bg-[#050507] text-white">
      <button
        onClick={() => navigate.push('/')}
        className="fixed left-4 top-4 z-30 flex items-center gap-2 rounded-full border border-white/10 bg-black/45 px-3 py-2 text-xs font-bold text-white/70 backdrop-blur-md transition-colors hover:text-white sm:left-6 sm:top-6"
      >
        <RotateCcw className="h-4 w-4" /> Home
      </button>

      <main className="relative flex min-h-[100dvh] w-full items-start justify-center px-5 pt-20 pb-20 sm:px-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.78fr)] lg:items-center lg:px-0 lg:py-0" style={{ paddingBottom: 'max(5rem, env(safe-area-inset-bottom))' }}>
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[45%] bg-[linear-gradient(180deg,rgba(26,18,26,0.92)_0%,rgba(18,12,20,0.96)_28%,rgba(10,9,15,0.98)_100%)] lg:block" />
        <div className="pointer-events-none absolute inset-y-0 right-[32%] hidden w-[22%] bg-[linear-gradient(90deg,rgba(255,182,197,0.08)_0%,rgba(255,121,176,0.06)_38%,rgba(14,10,16,0)_100%)] blur-2xl lg:block" />
        <section className="relative hidden h-[100dvh] overflow-hidden lg:block">
          <img
            src="/signup.webp"
            alt="Two OthrHalff mascots floating through a bright campus-inspired valley"
            className="h-full w-full object-cover object-[42%_50%]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.02)_0%,rgba(0,0,0,0.04)_54%,rgba(7,7,10,0.12)_68%,rgba(7,7,10,0.38)_80%,rgba(7,7,10,0.72)_92%,rgba(7,7,10,0.9)_100%)]" />
        </section>

        <section className="relative z-10 w-full max-w-md animate-fade-in lg:mx-auto lg:px-8">
          <div className="mb-6">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-[98px] w-[98px] shrink-0 items-center justify-center sm:h-[108px] sm:w-[108px]">
                <img
                  src="/auth-mascot.webp"
                  alt="OthrHalff mascot"
                  className="h-full w-full scale-[1.38] object-contain"
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/45">OthrHalff</p>
                <h1 className="text-[32px] font-black uppercase leading-none text-white sm:text-[40px]">
                  {isLogin ? (
                    <>Welcome <span className="text-neon">Back</span></>
                  ) : (
                    <>Create <span className="text-neon">Account</span></>
                  )}
                </h1>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 animate-fade-in">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
              <p className="flex-1 text-sm text-red-300">{error}</p>
              <button onClick={() => setError(null)} className="text-red-400 transition-colors hover:text-red-300">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {success && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 animate-fade-in">
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-400" />
              <p className="flex-1 text-sm text-green-300">{success}</p>
              <button onClick={() => setSuccess(null)} className="text-green-400 transition-colors hover:text-green-300">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Google One-Click OAuth */}
          <div className="mb-6 grid gap-3">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-white font-bold text-black transition-all hover:bg-gray-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 shadow-lg shadow-white/5"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              Continue with Google
            </button>
          </div>

          <div className="mb-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-gray-800" />
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-500">Or Magic Link</span>
            <div className="h-px flex-1 bg-gray-800" />
          </div>

          {/* Magic Link Form */}
          <form onSubmit={handleMagicLink} className="space-y-4">
            {/* Anti-Bot Honeypot Field (invisible to humans) */}
            <div className="hidden" aria-hidden="true">
              <input
                type="text"
                name="website_url_hp"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={e => setHoneypot(e.target.value)}
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
              <NeonInput
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="h-14 rounded-2xl border-gray-800 bg-[#111522] pl-12 placeholder:text-gray-500 focus:border-neon/80"
              />
            </div>

            {/* Smart Typo Suggestion Banner */}
            {suggestion && (
              <div className="flex items-center justify-between gap-2 rounded-xl border border-neon/30 bg-neon/10 px-3.5 py-2 text-xs animate-fade-in">
                <div className="flex items-center gap-1.5 text-white/90">
                  <Sparkles className="h-3.5 w-3.5 flex-shrink-0 text-neon" />
                  <span className="truncate">Did you mean <strong className="text-neon">{suggestion}</strong>?</span>
                </div>
                <button
                  type="button"
                  onClick={handleApplySuggestion}
                  className="shrink-0 font-bold text-neon hover:underline focus:outline-none"
                >
                  Apply
                </button>
              </div>
            )}

            {!isLogin && (
              <div className="flex items-start gap-3 px-1 animate-fade-in">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    disabled={isLoading}
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-600 bg-gray-900 transition-all checked:border-neon checked:bg-neon hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-neon/50"
                  />
                  <Check className="pointer-events-none absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
                </div>
                <label htmlFor="terms" className="cursor-pointer select-none text-xs leading-relaxed text-gray-400">
                  I agree to the <Link href="/terms" target="_blank" className="text-neon hover:underline">Terms</Link>, <Link href="/privacy" target="_blank" className="text-neon hover:underline">Privacy Policy</Link>, and confirm I am a university student.
                </label>
              </div>
            )}

            <NeonButton
              disabled={isLoading}
              className="h-14 w-full gap-2 rounded-2xl bg-neon text-base shadow-[0_0_28px_rgba(255,0,127,0.38)] hover:shadow-[0_0_36px_rgba(255,0,127,0.48)]"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Send Magic Link <ArrowRight className="h-5 w-5" />
                </>
              )}
            </NeonButton>
          </form>

          <div className="mt-7 space-y-3 text-center">
            <div className="text-sm text-gray-500">
              {isLogin ? (
                <>
                  Don't have an account?{' '}
                  <button
                    onClick={() => { setIsLogin(false); setAgreedToTerms(false); }}
                    className="font-bold text-neon hover:underline"
                    disabled={isLoading}
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    onClick={() => setIsLogin(true)}
                    className="font-bold text-neon hover:underline"
                    disabled={isLoading}
                  >
                    Log in
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
