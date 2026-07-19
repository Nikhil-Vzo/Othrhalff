"use client";

import React, { useState, useEffect } from 'react';
import { RotateCcw, Mail, ArrowRight, Check, Loader2, X, CheckCircle2, AlertCircle, Lock, Eye, EyeOff, Fingerprint } from 'lucide-react';
import { NeonInput, NeonButton } from '../components/Common';
import { useRouter as useNavigate } from 'next/navigation';
import Link from 'next/link';
import { authService } from '../services/auth';
import { analytics } from '../utils/analytics';
import { supabase } from '../lib/supabase';

export const Login: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  // Auto-dismiss success messages after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Clear error when user starts typing
  useEffect(() => {
    if (error) setError(null);
  }, [identifier, password]);

  // Email validation regex
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleEmailContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isLogin && !agreedToTerms) {
      setError('You must agree to the Terms and Conditions to continue.');
      return;
    }

    if (!identifier.trim()) {
      setError('Please enter a username or email address.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      let finalEmail = identifier.trim().toLowerCase();

      // If it doesn't look like an email, assume it's a username and look it up
      if (!isValidEmail(finalEmail)) {
        if (!isLogin) {
           setError('Please enter a valid email address to sign up.');
           setIsLoading(false);
           return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('university_email')
          .eq('username', finalEmail)
          .maybeSingle();

        if (profileError) {
          if (profileError.message.includes('Failed to fetch') || profileError.message.includes('Network Error')) {
            throw new Error('Database connection failed. Please ensure the Supabase project is active and not paused.');
          }
          console.error('Profile lookup error:', profileError);
          throw new Error('Username not found. Please try logging in with your email or Google.');
        }

        if (!profile) {
          throw new Error('Username not found. Please try logging in with your email or Google.');
        }

        finalEmail = profile.university_email;
      }

      if (isLogin) {
        await authService.signInWithPassword(finalEmail, password);
        analytics.login('Password');
        setSuccess('Logged in successfully! Redirecting...');
        // Let the normal app layout handle the routing
        setTimeout(() => navigate.push('/home'), 500);
      } else {
        await authService.signUp(finalEmail, password, '');
        analytics.login('Signup');
        setSuccess('Account created! Redirecting to setup...');
        setTimeout(() => navigate.push('/onboarding'), 500);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Failed to log in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLinkFallback = async () => {
    if (!isValidEmail(identifier.trim())) {
      setError('Please enter your valid email address to use a magic link.');
      return;
    }
    setIsLoading(true);
    try {
      await authService.signInWithMagicLink(identifier.trim());
      setSuccess('Magic Link sent! Check your email inbox.');
    } catch (err: any) {
      setError(err.message || 'Failed to send magic link.');
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
    } catch (error: any) {
      console.error('Google login error:', error);
      setError(error.message || 'Failed to initialize Google login. Please try again.');
      setIsLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase.auth.signInWithPasskey();
      if (error) throw error;
      setSuccess('Logged in successfully with Passkey! Redirecting...');
      analytics.login('Passkey');
      setTimeout(() => navigate.push('/home'), 500);
    } catch (err: any) {
      console.error('Passkey authentication error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Passkey authentication canceled or timed out.');
      } else {
        setError(err.message || 'Failed to authenticate with Passkey. Make sure you have registered a passkey on this device.');
      }
    } finally {
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
            src="/signup.png"
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
                  src="/auth-mascot.png"
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

            <div className="mb-6 grid gap-3">
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-white font-bold text-black transition-all hover:bg-gray-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
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

              {isLogin && (
                <button
                  type="button"
                  onClick={handlePasskeyLogin}
                  disabled={isLoading}
                  className="group flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-gray-800 bg-[#111522] font-bold text-white/90 transition-all hover:border-neon/60 hover:bg-neon/10 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Fingerprint className="h-5 w-5 text-neon transition-transform group-hover:scale-110" />
                  Sign in with Passkey
                </button>
              )}
            </div>

            <div className="mb-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-gray-800" />
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-500">Or Email</span>
              <div className="h-px flex-1 bg-gray-800" />
            </div>

            <form onSubmit={handleEmailContinue} className="space-y-5">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                <NeonInput
                  type="text"
                  placeholder={isLogin ? "Username or Email" : "name@example.com"}
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-14 rounded-2xl border-gray-800 bg-[#111522] pl-12 placeholder:text-gray-500 focus:border-neon/80"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                <NeonInput
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-14 rounded-2xl border-gray-800 bg-[#111522] pl-12 pr-12 placeholder:text-gray-500 focus:border-neon/80"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-gray-300"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

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
                    {isLogin ? 'Continue' : 'Create Account'} <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </NeonButton>
            </form>

            {isLogin && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={handleMagicLinkFallback}
                  className="text-xs text-gray-500 underline decoration-gray-700 underline-offset-4 transition-colors hover:text-white"
                  disabled={isLoading}
                >
                  Use magic link instead
                </button>
              </div>
            )}

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
