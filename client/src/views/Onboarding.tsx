"use client";

import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { NeonInput, NeonButton } from '../components/Common';
import { 
  Upload, Lock, ChevronDown, Loader2, AlertCircle, 
  CheckCircle2, X, Calendar
} from 'lucide-react';
import { 
  AVATAR_PRESETS, MOCK_INTERESTS, CHHATTISGARH_COLLEGES, 
  LOOKING_FOR_OPTIONS, BRANCH_CATEGORIES, YEAR_OPTIONS 
} from '../constants';
import { authService } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import { useRouter as useNavigate, useSearchParams } from 'next/navigation';
import { supabase } from '../lib/supabase';

// Generate arrays for DOB dropdowns
const DAYS = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YEARS = Array.from({ length: 30 }, (_, i) => (new Date().getFullYear() - 18 - i).toString());

export const Onboarding: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const searchParams = useSearchParams();

  // Loading & submission state
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Verified Email
  const [email, setEmail] = useState<string>(searchParams.get('email') || '');

  // DOB state
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');

  const [tempProfile, setTempProfile] = useState<Partial<UserProfile>>({
    interests: [],
    lookingFor: [],
    gender: 'Male',
    university: CHHATTISGARH_COLLEGES[0],
    avatar: AVATAR_PRESETS[0],
    dob: '',
    realName: '',
    bio: '',
    branch: '',
    year: '1st Year'
  });

  const [branchCategory, setBranchCategory] = useState('');
  const [customUniversity, setCustomUniversity] = useState('');

  // --- Fetch existing profile & pre-fill data ---
  useEffect(() => {
    const fetchUserAndCheckProfile = async () => {
      if (!supabase) {
        setIsCheckingProfile(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          if (user.email) setEmail(user.email);

          // Check for existing database profile
          const { data: existingProfile, error: profileErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (existingProfile && !profileErr) {
            // Pre-fill DOB if present
            if (existingProfile.dob) {
              const parts = existingProfile.dob.split('-');
              if (parts.length === 3) {
                setDobYear(parts[0]);
                const monthIdx = parseInt(parts[1], 10) - 1;
                if (monthIdx >= 0 && monthIdx < 12) setDobMonth(MONTHS[monthIdx]);
                setDobDay(parts[2].padStart(2, '0'));
              }
            }

            // Pre-fill tempProfile with existing DB values
            setTempProfile({
              username: existingProfile.username || '',
              realName: existingProfile.real_name || '',
              gender: existingProfile.gender || 'Male',
              university: existingProfile.university || CHHATTISGARH_COLLEGES[0],
              branch: existingProfile.branch || '',
              year: existingProfile.year || '1st Year',
              interests: existingProfile.interests || [],
              lookingFor: existingProfile.looking_for || [],
              bio: existingProfile.bio || '',
              avatar: existingProfile.avatar || AVATAR_PRESETS[0],
              dob: existingProfile.dob || '',
              anonymousId: existingProfile.anonymous_id
            });

            if (existingProfile.branch) {
              setBranchCategory(BRANCH_CATEGORIES.includes(existingProfile.branch) ? existingProfile.branch : 'Other');
            }

            // If profile is already complete (has real_name, dob), go straight to home!
            if (existingProfile.real_name && existingProfile.dob) {
              const appUser: UserProfile = {
                id: existingProfile.id,
                username: existingProfile.username,
                anonymousId: existingProfile.anonymous_id,
                realName: existingProfile.real_name,
                gender: existingProfile.gender,
                university: existingProfile.university,
                universityEmail: existingProfile.university_email,
                branch: existingProfile.branch,
                year: existingProfile.year,
                interests: existingProfile.interests || [],
                lookingFor: existingProfile.looking_for || [],
                bio: existingProfile.bio,
                dob: existingProfile.dob,
                isVerified: existingProfile.is_verified,
                avatar: existingProfile.avatar,
                isPremium: existingProfile.is_premium
              };

              await login(appUser);
              navigate.push('/home');
              return;
            }
          } else {
            // Auto-fill from Google Metadata for new user
            const googleName = user.user_metadata?.full_name || user.user_metadata?.name;
            const googleAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture;

            setTempProfile(prev => ({
              ...prev,
              realName: googleName || prev.realName || '',
              avatar: googleAvatar || prev.avatar
            }));
          }
        }
      } catch (err) {
        console.error("Error checking profile:", err);
      } finally {
        setIsCheckingProfile(false);
      }
    };

    fetchUserAndCheckProfile();
  }, [login, navigate]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const MAX_SIZE = 2 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        alert("Please upload an image smaller than 2MB.");
        return;
      }
      const base64 = await authService.uploadAvatar(file);
      setTempProfile(prev => ({ ...prev, avatar: base64 }));
    }
  };

  const toggleInterest = (interest: string) => {
    const current = tempProfile.interests || [];
    if (current.includes(interest)) {
      setTempProfile({ ...tempProfile, interests: current.filter(i => i !== interest) });
    } else {
      if (current.length < 5) {
        setTempProfile({ ...tempProfile, interests: [...current, interest] });
      }
    }
  };

  const toggleLookingFor = (option: string) => {
    const current = tempProfile.lookingFor || [];
    if (current.includes(option)) {
      setTempProfile({ ...tempProfile, lookingFor: current.filter(o => o !== option) });
    } else {
      setTempProfile({ ...tempProfile, lookingFor: [...current, option] });
    }
  };

  const handleSaveProfile = async () => {
    setError(null);

    // Validation
    if (!email) {
      setError("Email is required. Please login again.");
      return;
    }
    if (!tempProfile.realName?.trim()) {
      setError("Please enter your display name.");
      return;
    }
    if (!tempProfile.branch?.trim()) {
      setError("Please select your field of study.");
      return;
    }
    if (tempProfile.university === 'Other' && !customUniversity.trim()) {
      setError("Please enter your college name.");
      return;
    }
    if (!dobDay || !dobMonth || !dobYear) {
      setError("Please select your complete date of birth.");
      return;
    }
    if ((tempProfile.interests || []).length === 0) {
      setError("Please select at least one interest.");
      return;
    }
    if ((tempProfile.lookingFor || []).length < 2) {
      setError("Please select at least 2 'Looking For' options.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (!supabase) {
        setError("Authentication service not available.");
        setIsSubmitting(false);
        return;
      }

      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        setError("Authentication failed. Please login again.");
        setIsSubmitting(false);
        return;
      }

      // Compose DOB
      const monthIndex = MONTHS.indexOf(dobMonth) + 1;
      const formattedDob = (dobYear && monthIndex && dobDay) 
        ? `${dobYear}-${monthIndex.toString().padStart(2, '0')}-${dobDay}`
        : (tempProfile.dob || '2000-01-01');

      const userToSave: UserProfile = {
        id: authUser.id,
        username: tempProfile.username || undefined,
        anonymousId: tempProfile.anonymousId || `User#${authUser.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`,
        realName: (tempProfile.realName || '').trim(),
        gender: tempProfile.gender || 'Male',
        university: tempProfile.university === 'Other' ? customUniversity.trim() : (tempProfile.university || CHHATTISGARH_COLLEGES[0]),
        universityEmail: email || authUser.email || '',
        isVerified: false,
        branch: tempProfile.branch || 'General',
        year: tempProfile.year || '1st Year',
        interests: tempProfile.interests || [],
        lookingFor: tempProfile.lookingFor || [],
        bio: tempProfile.bio || '',
        avatar: tempProfile.avatar || AVATAR_PRESETS[0],
        dob: formattedDob
      };

      await login(userToSave);
      setSuccess("Profile created! Redirecting to campus...");

      setTimeout(() => {
        navigate.push('/home');
      }, 500);
    } catch (err: any) {
      setError(err.message || "Failed to save profile. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (isCheckingProfile) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-9 h-9 text-neon animate-spin" />
          <p className="text-zinc-400 text-xs font-mono tracking-wider">LOADING PROFILE...</p>
        </div>
      </div>
    );
  }

  // --- FULL ONBOARDING FORM FOR NEW USERS ---
  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Background Lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="w-full max-w-2xl bg-zinc-950/90 backdrop-blur-2xl p-6 md:p-8 rounded-3xl border border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.8)] space-y-6 relative z-10 overflow-y-auto max-h-[90vh] custom-scrollbar">
        
        {/* Header */}
        <div className="text-center space-y-1.5 border-b border-zinc-800/80 pb-5">
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Create Your Campus Persona</h2>
          <p className="text-xs text-zinc-400">
            Customize your student profile to connect with peers across your college campus.
          </p>
        </div>

        {/* Notifications */}
        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2.5 text-xs text-rose-300 animate-fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Avatar Selection */}
        <div className="flex flex-col items-center gap-3">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Profile Avatar</label>
          <div className="w-20 h-20 rounded-full border-2 border-neon p-0.5 relative group overflow-hidden bg-zinc-900 shadow-[0_0_20px_rgba(255,0,127,0.2)]">
            <img src={tempProfile.avatar} alt="Avatar" className="w-full h-full object-cover rounded-full" />
            <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Upload className="w-5 h-5 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
          <div className="flex gap-2 overflow-x-auto max-w-full pb-1 custom-scrollbar">
            {AVATAR_PRESETS.map((avatar, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setTempProfile({ ...tempProfile, avatar })}
                className={`w-9 h-9 rounded-full border overflow-hidden flex-shrink-0 transition-all ${
                  tempProfile.avatar === avatar ? 'border-neon ring-2 ring-neon/40 scale-105' : 'border-zinc-800 opacity-60 hover:opacity-100'
                }`}
              >
                <img src={avatar} alt={`Preset ${i}`} className="w-full h-full object-cover bg-zinc-900" />
              </button>
            ))}
          </div>
        </div>

        {/* College Dropdown */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-zinc-300">College / University</label>
          <div className="relative">
            <select
              className="w-full bg-zinc-900 border border-zinc-800 text-white px-4 py-3 rounded-xl outline-none focus:border-neon appearance-none text-sm pr-10"
              value={tempProfile.university}
              onChange={e => setTempProfile({ ...tempProfile, university: e.target.value })}
            >
              {CHHATTISGARH_COLLEGES.map(college => (
                <option key={college} value={college} className="bg-zinc-900 text-white">{college}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 pointer-events-none" />
          </div>

          {tempProfile.university === 'Other' && (
            <div className="mt-2">
              <NeonInput
                value={customUniversity}
                onChange={e => setCustomUniversity(e.target.value)}
                placeholder="Enter college name"
              />
            </div>
          )}
        </div>

        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Display Name */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-zinc-300">Display Name / Nickname</label>
              <span className="text-[10px] text-zinc-500 flex items-center gap-1"><Lock className="w-3 h-3" /> Private</span>
            </div>
            <NeonInput
              value={tempProfile.realName || ''}
              onChange={e => setTempProfile({ ...tempProfile, realName: e.target.value })}
              placeholder="Jane or Nickname"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Gender</label>
            <div className="relative">
              <select
                className="w-full bg-zinc-900 border border-zinc-800 text-white px-4 py-3 rounded-xl outline-none focus:border-neon appearance-none text-sm pr-10"
                value={tempProfile.gender}
                onChange={e => setTempProfile({ ...tempProfile, gender: e.target.value })}
              >
                <option value="Male" className="bg-zinc-900 text-white">Male</option>
                <option value="Female" className="bg-zinc-900 text-white">Female</option>
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 pointer-events-none" />
            </div>
          </div>

          {/* Field of Study */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Field of Study</label>
            <div className="relative">
              <select
                className="w-full bg-zinc-900 border border-zinc-800 text-white px-4 py-3 rounded-xl outline-none focus:border-neon appearance-none text-sm pr-10"
                value={branchCategory}
                onChange={e => {
                  const val = e.target.value;
                  setBranchCategory(val);
                  if (val !== 'Other') {
                    setTempProfile({ ...tempProfile, branch: val });
                  } else {
                    setTempProfile({ ...tempProfile, branch: '' });
                  }
                }}
              >
                <option value="" className="bg-zinc-900 text-white">Select Field</option>
                {BRANCH_CATEGORIES.map(cat => (
                  <option key={cat} value={cat} className="bg-zinc-900 text-white">{cat}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 pointer-events-none" />
            </div>

            {branchCategory === 'Other' && (
              <div className="mt-2">
                <NeonInput
                  value={tempProfile.branch || ''}
                  onChange={e => setTempProfile({ ...tempProfile, branch: e.target.value })}
                  placeholder="Specific Branch"
                />
              </div>
            )}
          </div>

          {/* Year */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Year</label>
            <div className="relative">
              <select
                className="w-full bg-zinc-900 border border-zinc-800 text-white px-4 py-3 rounded-xl outline-none focus:border-neon appearance-none text-sm pr-10"
                value={tempProfile.year}
                onChange={e => setTempProfile({ ...tempProfile, year: e.target.value })}
              >
                {YEAR_OPTIONS.map(yr => (
                  <option key={yr} value={yr} className="bg-zinc-900 text-white">{yr}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 pointer-events-none" />
            </div>
          </div>

          {/* DOB */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" /> Date of Birth
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div className="relative">
                <select
                  className="w-full bg-zinc-900 border border-zinc-800 text-white px-3 py-3 rounded-xl outline-none focus:border-neon appearance-none text-xs text-center pr-6"
                  value={dobDay}
                  onChange={e => setDobDay(e.target.value)}
                >
                  <option value="" className="bg-zinc-900 text-white">Day</option>
                  {DAYS.map(d => <option key={d} value={d} className="bg-zinc-900 text-white">{d}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 w-3.5 h-3.5 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  className="w-full bg-zinc-900 border border-zinc-800 text-white px-3 py-3 rounded-xl outline-none focus:border-neon appearance-none text-xs text-center pr-6"
                  value={dobMonth}
                  onChange={e => setDobMonth(e.target.value)}
                >
                  <option value="" className="bg-zinc-900 text-white">Month</option>
                  {MONTHS.map(m => <option key={m} value={m} className="bg-zinc-900 text-white">{m}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 w-3.5 h-3.5 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  className="w-full bg-zinc-900 border border-zinc-800 text-white px-3 py-3 rounded-xl outline-none focus:border-neon appearance-none text-xs text-center pr-6"
                  value={dobYear}
                  onChange={e => setDobYear(e.target.value)}
                >
                  <option value="" className="bg-zinc-900 text-white">Year</option>
                  {YEARS.map(y => <option key={y} value={y} className="bg-zinc-900 text-white">{y}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 w-3.5 h-3.5 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Interests */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-zinc-300">Interests (Max 5)</label>
          <div className="flex flex-wrap gap-2">
            {MOCK_INTERESTS.map(interest => {
              const isSelected = (tempProfile.interests || []).includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    isSelected
                      ? 'bg-neon/20 border-neon text-neon shadow-[0_0_12px_rgba(255,0,127,0.3)]'
                      : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </div>

        {/* Looking For */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-zinc-300">Looking For (Select at least 2)</label>
          <div className="flex flex-wrap gap-2">
            {LOOKING_FOR_OPTIONS.map(option => {
              const isSelected = (tempProfile.lookingFor || []).includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleLookingFor(option)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    isSelected
                      ? 'bg-pink-500/20 border-pink-500 text-pink-300 shadow-[0_0_12px_rgba(236,72,153,0.3)]'
                      : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        {/* Anonymous Bio */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-zinc-300">Anonymous Bio</label>
          <textarea
            className="w-full bg-zinc-900 border border-zinc-800 text-white px-4 py-3 rounded-xl outline-none focus:border-neon text-sm h-20 resize-none placeholder:text-zinc-600"
            placeholder="Describe yourself without revealing your identity..."
            value={tempProfile.bio || ''}
            onChange={e => setTempProfile({ ...tempProfile, bio: e.target.value })}
          />
        </div>

        <NeonButton
          onClick={handleSaveProfile}
          disabled={isSubmitting}
          className="w-full py-4 text-base font-bold rounded-xl"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Create Persona & Enter'}
        </NeonButton>

      </div>
    </div>
  );
};