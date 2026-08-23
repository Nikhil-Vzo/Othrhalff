import React, { useState, useEffect } from 'react';
import { useParams, useRouter as useNavigate } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase'; // Changed: Import Supabase
import { authService } from '../services/auth';
import { UserProfile } from '../types';
import { NeonButton, NeonInput } from '../components/Common';
import {
    Edit2, Camera, X, Ghost, User, GraduationCap, BadgeCheck, CheckCircle2,
    LogOut, ChevronDown, Settings, Lock, ShieldBan,
    MessageCircle, Mail, Phone, Loader2, Heart, Search,
    Download, Smartphone, ExternalLink, Code, Scale, FileText,
    Shield, Info, Briefcase, Users, Rocket, Sparkles
} from 'lucide-react';
import { AVATAR_PRESETS, LOOKING_FOR_OPTIONS, YEAR_OPTIONS, MOCK_INTERESTS } from '../constants';
import { getOptimizedUrl, handleImageError } from '../utils/image';

const calculateAge = (dob?: string): number | null => {
    if (!dob) return null;
    const birth = new Date(dob);
    const today = new Date();
    if (isNaN(birth.getTime())) return null;
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
};

export const Profile: React.FC = () => {
    const params = useParams();
    const id = params?.id as string;
    const navigate = useNavigate();
    const { currentUser, updateProfile, logout, isLoading } = useAuth();

    // State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
    const [showVerification, setShowVerification] = useState(false);
    const [verifyStep, setVerifyStep] = useState(1);
    const [verifyData, setVerifyData] = useState({ college: '', email: '', file: null as File | null });

    // New State for fetching external profiles
    const [fetchedProfile, setFetchedProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showLegal, setShowLegal] = useState(false);
    const [showAccount, setShowAccount] = useState(false);
    const [showBehindScenes, setShowBehindScenes] = useState(false);

    // PWA Install state
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isPWAInstallable, setIsPWAInstallable] = useState(false);

    useEffect(() => {
        const storedPrompt = (window as any).__pwaInstallPrompt;
        if (storedPrompt) {
            setDeferredPrompt(storedPrompt);
            setIsPWAInstallable(true);
        }
    }, []);

    // Also listen in case it fires after mount (unlikely but safe)
    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsPWAInstallable(true);
            (window as any).__pwaInstallPrompt = e;
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    // Redirect to landing page if not logged in (after auth check finishes)
    useEffect(() => {
        if (!isLoading && !currentUser) {
            navigate.push('/');
        }
    }, [currentUser?.id, isLoading, navigate]);

    const isIOS = typeof window !== 'undefined' ? /iPad|iPhone|iPod/.test(window.navigator.userAgent) : false;
    const isStandalone = typeof window !== 'undefined' ? (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) : false;

    const handleInstallPWA = async () => {
        if (isStandalone) {
            alert('OthrHalff is already installed!');
            return;
        }
        // Try global prompt first, then component state
        const prompt = (window as any).__pwaInstallPrompt || deferredPrompt;
        if (prompt) {
            prompt.prompt();
            const { outcome } = await prompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
                (window as any).__pwaInstallPrompt = null;
            }
        } else if (isIOS) {
            alert('To install: tap the Share button (↑) at the bottom of Safari, then tap "Add to Home Screen".');
        } else {
            alert('To install: open the browser menu (⋮) and tap "Install app" or "Add to Home Screen".');
        }
    };

    // Determine if viewing self
    const isSelf = !id || id === currentUser?.id;

    // Resolve which profile to show
    const profileUser = isSelf ? currentUser : fetchedProfile;



    // Fetch Profile Data (if not self)
    useEffect(() => {
        if (isSelf || !id || !supabase) return;

        const fetchProfile = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;

                if (data) {
                    // Map DB snake_case to Client camelCase
                    const mapped: UserProfile = {
                        id: data.id,
                        anonymousId: data.anonymous_id,
                        realName: data.real_name,
                        gender: data.gender,
                        university: data.university,
                        universityEmail: data.university_email,
                        branch: data.branch,
                        year: data.year,
                        interests: data.interests || [],
                        bio: data.bio,
                        dob: data.dob,
                        isVerified: data.is_verified,
                        avatar: data.avatar,
                        isPremium: data.is_premium,
                        lookingFor: data.looking_for || []
                    };
                    setFetchedProfile(mapped);
                }
            } catch (err) {
                console.error('Error fetching profile:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [id, isSelf]);

    // Loading State
    if (loading) return (
        <div className="h-full flex items-center justify-center bg-black text-white">
            <Loader2 className="w-10 h-10 text-neon animate-spin" />
        </div>
    );

    if (!profileUser) return (
        <div className="h-full flex flex-col items-center justify-center bg-black text-white">
            <Ghost className="w-12 h-12 text-gray-700 mb-4" />
            <p className="text-gray-500">User not found.</p>
            <button onClick={() => navigate.back()} className="mt-4 text-neon hover:underline">Go Back</button>
        </div>
    );

    // Handlers
    const startEdit = () => {
        if (currentUser) {
            setEditForm({ ...currentUser });
            setIsEditing(true);
        }
    };

    const isFormDirty = () => {
        if (!currentUser) return false;
        return (
            (editForm.realName !== undefined && editForm.realName !== currentUser.realName) ||
            (editForm.branch !== undefined && editForm.branch !== currentUser.branch) ||
            (editForm.year !== undefined && editForm.year !== currentUser.year) ||
            (editForm.bio !== undefined && editForm.bio !== currentUser.bio) ||
            (editForm.avatar !== undefined && editForm.avatar !== currentUser.avatar) ||
            (editForm.gender !== undefined && editForm.gender !== currentUser.gender) ||
            (editForm.dob !== undefined && editForm.dob !== currentUser.dob) ||
            (JSON.stringify(editForm.interests || []) !== JSON.stringify(currentUser.interests || [])) ||
            (JSON.stringify(editForm.lookingFor || []) !== JSON.stringify(currentUser.lookingFor || []))
        );
    };

    const handleCloseEdit = () => {
        if (isFormDirty()) {
            const confirmDiscard = window.confirm("You have unsaved changes. Are you sure you want to discard them?");
            if (!confirmDiscard) return;
        }
        setIsEditing(false);
    };

    // Browser navigation / refresh discard protection
    useEffect(() => {
        if (!isEditing) return;
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isFormDirty()) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isEditing, editForm, currentUser]);

    const saveProfile = async () => {
        if (!editForm || !currentUser || !supabase) return;
        setSaving(true);

        try {
            // 1. Prepare DB Payload (snake_case)
            const updates = {
                real_name: editForm.realName,
                branch: editForm.branch,
                year: editForm.year,
                bio: editForm.bio,
                dob: editForm.dob,
                avatar: editForm.avatar,

                interests: editForm.interests,
                looking_for: editForm.lookingFor,
                updated_at: new Date().toISOString()
            };

            // 2. Update Supabase
            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', currentUser.id);

            if (error) throw error;

            // 3. Update Local Context
            updateProfile(editForm);
            setIsEditing(false);

        } catch (err) {
            console.error('Failed to update profile:', err);
            alert('Failed to save changes.');
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const MAX_SIZE = 2 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            alert("Please upload an image smaller than 2MB.");
            return;
        }

        try {
            const compressed = await authService.uploadAvatar(file);
            setEditForm(prev => ({ ...prev, avatar: compressed }));
        } catch (err) {
            console.error("Error processing avatar:", err);
            alert("Failed to process image. Please try another one.");
        }
    };

    return (
        <div className="h-full w-full overflow-y-auto custom-scrollbar bg-[#000000] text-white relative">

            {/* --- Cinematic Background --- */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-black via-[#000000] to-[#000000]" />
                <div className="absolute top-[-20%] right-[10%] w-[800px] h-[800px] bg-neon/5 blur-[120px] rounded-full animate-pulse-slow" />
                <div className="absolute top-[20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full" />
            </div>

            <div className="relative z-10 w-full max-w-5xl mx-auto p-4 md:p-8 pb-32">

                {/* Mobile Nav */}
                <div className="flex md:hidden justify-between items-center mb-6">
                    <button onClick={() => navigate.back()} className="p-2 bg-gray-900/80 backdrop-blur rounded-full text-white border border-gray-800">
                        <ChevronDown className="w-5 h-5 rotate-90" />
                    </button>
                    <span className="font-bold text-sm tracking-widest uppercase text-gray-400">{isSelf ? 'My Profile' : 'Student Profile'}</span>
                    <div className="w-9" />
                </div>

                {/* --- Main Content --- */}
                <div className="space-y-6 md:space-y-8">

                    {/* 1. HERO SECTION (Identity Card) */}
                    <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-6 md:p-10 shadow-2xl relative overflow-hidden group">
                        
                        {/* Desktop: Glow behind avatar */}
                        <div className="hidden md:block absolute top-0 left-0 w-full h-full bg-gradient-to-r from-neon/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 md:gap-10 relative z-10">
                            
                            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 w-full md:w-auto">
                                {/* Circle Avatar Container */}
                                <div className="relative flex-shrink-0">
                                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-zinc-950 shadow-[0_15px_30px_rgba(0,0,0,0.5)] overflow-hidden bg-zinc-800 relative group/avatar">
                                        <img
                                            src={getOptimizedUrl(profileUser.avatar || AVATAR_PRESETS[0], 1024)}
                                            alt="Avatar"
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover/avatar:scale-105"
                                            referrerPolicy="no-referrer"
                                            onError={handleImageError}
                                        />
                                    </div>
                                    {profileUser.isVerified && (
                                        <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-blue-500 to-blue-600 text-white p-2 rounded-full border-4 border-zinc-950 shadow-[0_0_16px_rgba(96,165,250,0.7)] animate-bounce-in" title="Verified Student">
                                            <BadgeCheck className="w-5 h-5 md:w-6 md:h-6 fill-white/10" />
                                        </div>
                                    )}
                                </div>

                                {/* Identity text */}
                                <div className="text-center md:text-left space-y-3">
                                    <div>
                                        <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 mb-1">
                                            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                                                {isSelf ? profileUser.realName : profileUser.anonymousId}
                                            </h1>
                                            {profileUser.isPremium && (
                                                <span className="px-2.5 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-full text-[10px] font-black tracking-wider uppercase text-white shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                                                    PRO
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-center justify-center md:justify-start gap-1.5 text-zinc-400 font-semibold text-sm">
                                            <GraduationCap className="w-4 h-4 text-neon" />
                                            <span>{profileUser.university}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap justify-center md:justify-start gap-2">
                                        <span className="bg-zinc-850 px-3 py-1 rounded-full text-xs border border-white/5 text-zinc-300 font-medium">
                                            {profileUser.year}
                                        </span>
                                        <span className="bg-zinc-850 px-3 py-1 rounded-full text-xs border border-white/5 text-zinc-300 font-medium">
                                            {profileUser.branch}
                                        </span>
                                        <span className="bg-zinc-850 px-3 py-1 rounded-full text-xs border border-white/5 text-zinc-300 font-medium uppercase">
                                            {profileUser.gender}
                                        </span>
                                        {profileUser.dob && calculateAge(profileUser.dob) !== null && (
                                            <span className="bg-zinc-850 px-3 py-1 rounded-full text-xs border border-white/5 text-zinc-300 font-medium">
                                                {calculateAge(profileUser.dob)} Years Old
                                            </span>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    {!isEditing && (
                                        <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center md:justify-start">
                                            {isSelf ? (
                                                <>
                                                    <button
                                                        onClick={startEdit}
                                                        className="px-6 py-3 rounded-xl bg-white text-black hover:bg-neon hover:text-white transition-all font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(255,255,255,0.05)] hover:shadow-[0_10px_20px_rgba(255,0,127,0.3)] hover:-translate-y-0.5 active:translate-y-0"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" /> Edit Profile Details
                                                    </button>
                                                    {!currentUser?.isVerified && (
                                                        <button
                                                            onClick={() => setShowVerification(true)}
                                                            className="px-6 py-3 rounded-xl bg-zinc-950 border border-white/10 text-zinc-300 hover:border-blue-500/50 hover:bg-blue-950/20 hover:text-blue-400 transition-all font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0"
                                                        >
                                                            <Shield className="w-3.5 h-3.5" /> Verify Account
                                                        </button>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="flex gap-3 w-full sm:w-auto">
                                                    <button onClick={() => navigate.push(`/chat/${profileUser.id}`)} className="px-6 py-3 rounded-xl bg-neon text-white shadow-[0_10px_20px_rgba(255,0,127,0.3)] hover:bg-neon/90 hover:scale-[1.02] transition-all font-bold text-xs uppercase tracking-wider flex items-center gap-2 justify-center">
                                                        <MessageCircle className="w-4 h-4" /> Message
                                                    </button>
                                                    <button className="px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 hover:bg-zinc-800 transition-all flex items-center justify-center">
                                                        <Phone className="w-4 h-4 text-zinc-300" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>



                        </div>
                    </div>

                    {/* 2. DETAILS GRID */}
                    <div className="w-full">
                        {isEditing ? (
                            <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6 md:p-8 animate-fade-in shadow-2xl">
                                <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                                    <h3 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-wide">
                                        <Settings className="w-5 h-5 text-neon" /> Edit Profile Details
                                    </h3>
                                    <button onClick={handleCloseEdit} className="text-zinc-500 hover:text-white transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {/* Avatar and file upload */}
                                    <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <div className="relative group/edit-avatar">
                                            <div className="w-24 h-24 rounded-full border-2 border-white/10 overflow-hidden bg-zinc-800">
                                                <img
                                                    src={getOptimizedUrl(editForm.avatar || profileUser.avatar || AVATAR_PRESETS[0], 192)}
                                                    alt="Edit Avatar"
                                                    className="w-full h-full object-cover"
                                                    referrerPolicy="no-referrer"
                                                    onError={handleImageError}
                                                />
                                            </div>
                                            <label className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover/edit-avatar:opacity-100 transition-opacity duration-300">
                                                <Camera className="w-6 h-6 text-white" />
                                                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                                            </label>
                                        </div>
                                        <div className="flex-1 text-center sm:text-left">
                                            <span className="text-[10px] text-zinc-500 font-bold block mb-2 uppercase">Or Choose a Quick Avatar</span>
                                            <div className="flex gap-2.5 overflow-x-auto pb-2 max-w-[320px] sm:max-w-none custom-scrollbar">
                                                {AVATAR_PRESETS.map((avatar, i) => (
                                                    <button 
                                                        key={i} 
                                                        type="button"
                                                        onClick={() => setEditForm(prev => ({ ...prev, avatar }))} 
                                                        className={`w-10 h-10 rounded-full border-2 flex-shrink-0 transition-all ${
                                                            editForm.avatar === avatar ? 'border-neon scale-105' : 'border-zinc-800 opacity-60 hover:opacity-100'
                                                        }`}
                                                    >
                                                        <img src={getOptimizedUrl(avatar, 40)} alt="" className="w-full h-full bg-zinc-800 rounded-full" referrerPolicy="no-referrer" onError={handleImageError} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-[10px] text-zinc-500 font-bold block mb-2 uppercase">Real Name</label>
                                            <NeonInput value={editForm.realName || ''} onChange={e => setEditForm({ ...editForm, realName: e.target.value })} />
                                            <p className="text-[9px] text-zinc-500 mt-1.5 flex items-center gap-1">
                                                <Lock className="w-3 h-3 text-neon" /> Revealed only after mutual match.
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-zinc-500 font-bold block mb-2 uppercase">Branch / Major</label>
                                            <NeonInput value={editForm.branch || ''} onChange={e => setEditForm({ ...editForm, branch: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-zinc-500 font-bold block mb-2 uppercase">Year of Study</label>
                                            <div className="relative">
                                                <select
                                                    className="w-full bg-gray-900 border-2 border-gray-800 text-white px-4 py-3 rounded-xl outline-none focus:border-neon appearance-none transition-all duration-300"
                                                    value={editForm.year || '1st Year'}
                                                    onChange={e => setEditForm({ ...editForm, year: e.target.value })}
                                                >
                                                    {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] text-zinc-500 font-bold block mb-2 uppercase">Bio</label>
                                        <textarea
                                            className="w-full bg-gray-900 border-2 border-gray-800 focus:border-neon text-white px-4 py-3 rounded-xl outline-none h-32 resize-none transition-all focus:ring-1 focus:ring-neon/50 placeholder-zinc-700 text-sm"
                                            value={editForm.bio || ''}
                                            onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                                            placeholder="Write something about yourself, your interests, or what you're looking for..."
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] text-zinc-500 font-bold block mb-2 uppercase">Interests & Passions</label>
                                        <div className="flex flex-wrap gap-2">
                                            {MOCK_INTERESTS.map(option => {
                                                const current = editForm.interests || [];
                                                const isSelected = current.includes(option);
                                                return (
                                                    <button
                                                        key={option}
                                                        type="button"
                                                        onClick={() => {
                                                            const updated = isSelected
                                                                ? current.filter(i => i !== option)
                                                                : [...current, option];
                                                            setEditForm({ ...editForm, interests: updated });
                                                        }}
                                                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 ${
                                                            isSelected
                                                                ? 'bg-teal-500 border-teal-500 text-white shadow-[0_0_12px_rgba(20,184,166,0.4)]'
                                                                : 'bg-transparent border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                                                        }`}
                                                    >
                                                        #{option}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] text-zinc-500 font-bold block mb-2 uppercase">Looking For</label>
                                        <div className="flex flex-wrap gap-2">
                                            {LOOKING_FOR_OPTIONS.map(option => {
                                                const current = editForm.lookingFor || [];
                                                const isSelected = current.includes(option);
                                                return (
                                                    <button
                                                        key={option}
                                                        type="button"
                                                        onClick={() => {
                                                            const updated = isSelected
                                                                ? current.filter(i => i !== option)
                                                                : [...current, option];
                                                            setEditForm({ ...editForm, lookingFor: updated });
                                                        }}
                                                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 ${
                                                            isSelected
                                                                ? 'bg-pink-500 border-pink-500 text-white shadow-[0_0_12px_rgba(236,72,153,0.4)]'
                                                                : 'bg-transparent border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                                                        }`}
                                                    >
                                                        {option}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-6 border-t border-white/5">
                                        <NeonButton onClick={saveProfile} className="flex-1" disabled={saving}>
                                            {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Save Changes'}
                                        </NeonButton>
                                        <button 
                                            type="button"
                                            onClick={handleCloseEdit} 
                                            className="px-6 py-3 rounded-full border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all font-bold text-xs uppercase tracking-wider"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {/* About Box (Spans 2 cols on desktop) */}
                                <div className="sm:col-span-2 bg-zinc-900/30 border border-white/5 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden group hover:border-white/10 transition-colors">
                                    <div className="absolute top-4 right-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                                        <Ghost className="w-32 h-32 text-white" />
                                    </div>
                                    <span className="text-[10px] text-zinc-500 font-black tracking-widest block mb-2 uppercase">About Me</span>
                                    <p className="text-zinc-200 leading-relaxed text-base md:text-lg font-light italic relative z-10">
                                        "{profileUser.bio || "Keeping it mysterious..."}"
                                    </p>
                                </div>

                                {/* Verification Card (Spans 2 cols) */}
                                {profileUser.isVerified ? (
                                    <div className="sm:col-span-2 bg-zinc-900/30 border border-white/5 rounded-3xl p-5 md:p-6 backdrop-blur-md relative overflow-hidden group hover:border-white/10 transition-all">
                                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6">
                                            <div className="flex items-start gap-3.5">
                                                <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-neon flex-shrink-0 mt-0.5">
                                                    <Shield className="w-5 h-5" />
                                                </div>
                                                <div className="space-y-1.5 min-w-0">
                                                    <h4 className="font-black text-white uppercase tracking-widest text-xs">Student Verification</h4>
                                                    <p className="text-xs text-zinc-400 leading-relaxed">
                                                        Your student profile is authenticated and active.
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-center gap-1.5 text-emerald-450 font-bold text-xs bg-emerald-950/20 border border-emerald-500/20 py-2 px-4 rounded-xl self-stretch md:self-center">
                                                <BadgeCheck className="w-4 h-4 text-emerald-450 fill-emerald-500/10" /> Verified Student
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="sm:col-span-2 bg-zinc-900/30 border border-white/5 rounded-3xl p-5 md:p-6 backdrop-blur-md relative overflow-hidden group hover:border-white/10 transition-all">
                                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6">
                                            <div className="flex items-start gap-3.5 w-full">
                                                <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-neon flex-shrink-0 mt-0.5">
                                                    <Shield className="w-5 h-5" />
                                                </div>
                                                <div className="space-y-1.5 min-w-0 flex-1">
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                                                        <h4 className="font-black text-white uppercase tracking-widest text-xs">Student Verification</h4>
                                                        <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/25 rounded-full text-[9px] font-bold text-amber-500 uppercase tracking-wider whitespace-nowrap w-fit">
                                                            Action Required
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-zinc-400 leading-relaxed">
                                                        Verify your college email to get a verified student badge and boost your profile credibility.
                                                    </p>
                                                </div>
                                            </div>
                                            {isSelf ? (
                                                <button 
                                                    onClick={() => setShowVerification(true)} 
                                                    className="w-full md:w-auto px-6 py-3 rounded-xl bg-neon text-white hover:bg-neon/90 font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(255,0,127,0.2)] hover:shadow-[0_0_20px_rgba(255,0,127,0.4)] text-center whitespace-nowrap self-stretch md:self-center"
                                                >
                                                    Verify Now
                                                </button>
                                            ) : (
                                                <div className="flex items-center justify-center gap-1.5 text-zinc-500 font-bold text-xs bg-zinc-950/40 border border-white/5 py-2 px-4 rounded-xl self-stretch md:self-center">
                                                    <X className="w-4 h-4 text-zinc-600" /> Unverified Student
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Passions Box (Spans 2 cols on desktop) */}
                                <div className="sm:col-span-2 bg-zinc-900/30 border border-white/5 rounded-3xl p-6 backdrop-blur-md hover:border-white/10 transition-colors">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-[10px] text-zinc-400 font-black tracking-widest uppercase">Interests & Passions</span>
                                        <Heart className="w-4 h-4 text-neon" />
                                    </div>
                                    {profileUser.interests && profileUser.interests.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {profileUser.interests.map(interest => (
                                                <span key={interest} className="px-3 py-1.5 bg-white/[0.03] border border-white/10 hover:border-neon/30 hover:text-neon rounded-2xl text-xs font-semibold text-zinc-300 transition-colors">
                                                    #{interest}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-zinc-500 italic">No interests added yet.</p>
                                    )}
                                </div>

                                {/* Looking For Box (Spans 2 cols on desktop) */}
                                <div className="sm:col-span-2 bg-zinc-900/30 border border-white/5 rounded-3xl p-6 backdrop-blur-md hover:border-white/10 transition-colors">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-[10px] text-zinc-400 font-black tracking-widest uppercase">Looking For</span>
                                        <Search className="w-4 h-4 text-neon" />
                                    </div>
                                    {profileUser.lookingFor && profileUser.lookingFor.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {profileUser.lookingFor.map(option => (
                                                <span key={option} className="px-3 py-1.5 bg-white/[0.03] border border-white/10 rounded-2xl text-xs font-semibold text-zinc-300">
                                                    {option}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-zinc-500 italic">Looking for connections.</p>
                                    )}
                                </div>

                                {/* Account Settings Panel (Spans 2 cols) */}
                                {isSelf && (
                                    <div className="sm:col-span-2 bg-zinc-900/30 border border-white/5 rounded-3xl p-6 backdrop-blur-md hover:border-white/10 transition-colors">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2.5 bg-neon/10 rounded-xl text-neon">
                                                <Settings className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-white uppercase tracking-widest text-sm">Account Settings</h3>
                                                <p className="text-[10px] text-zinc-500 font-medium">Manage your account & app settings</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                            {/* Contact Support */}
                                            <button
                                                onClick={() => navigate.push('/contact')}
                                                className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 text-left transition-all flex items-center gap-3"
                                            >
                                                <div className="p-2 bg-white/10 rounded-lg text-zinc-300 flex-shrink-0">
                                                    <Mail className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="font-bold text-zinc-200 text-xs block">Contact Support</span>
                                                    <span className="text-[10px] text-zinc-500">Submit a support ticket</span>
                                                </div>
                                            </button>

                                            {/* Install App */}
                                            <button
                                                onClick={handleInstallPWA}
                                                className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 text-left transition-all flex items-center gap-3"
                                            >
                                                <div className="p-2 bg-white/10 rounded-lg text-zinc-300 flex-shrink-0">
                                                    <Smartphone className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <span className="font-bold text-zinc-200 text-xs block">Install App</span>
                                                    <span className="text-[10px] text-zinc-500 block truncate">Add to your home screen</span>
                                                </div>
                                            </button>

                                            {/* Student Verification */}
                                            {!profileUser.isVerified && isSelf && (
                                                <button
                                                    onClick={() => setShowVerification(true)}
                                                    className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/30 hover:bg-blue-950/20 text-left transition-all flex items-center gap-3 group"
                                                >
                                                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 flex-shrink-0 group-hover:scale-105 transition-transform">
                                                        <Shield className="w-4 h-4" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <span className="font-bold text-blue-300 text-xs block">Verify Account</span>
                                                        <span className="text-[10px] text-zinc-500 block truncate">Unlock verified badge</span>
                                                    </div>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Standalone Log Out Button */}
                                {isSelf && (
                                    <div className="sm:col-span-2 pt-2">
                                        <button
                                            onClick={logout}
                                            className="w-full p-4 rounded-2xl bg-red-950/20 border border-red-900/30 hover:bg-red-900/20 hover:border-red-500/50 text-center transition-all flex items-center justify-center gap-2 group"
                                        >
                                            <LogOut className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
                                            <span className="font-bold text-red-400 text-sm group-hover:text-red-300">Log Out</span>
                                        </button>
                                    </div>
                                )}

                                {/* Footer Links for Legal & Informational Pages */}
                                <div className="sm:col-span-2 border-t border-white/5 pt-8 mt-8 pb-12">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
                                        <button onClick={() => navigate.push('/safety')} className="py-3 px-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all text-xs font-bold text-zinc-400 hover:text-white flex items-center justify-center gap-2">
                                            <Shield className="w-3.5 h-3.5" /> Safety Hub
                                        </button>
                                        <button onClick={() => navigate.push('/guidelines')} className="py-3 px-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all text-xs font-bold text-zinc-400 hover:text-white flex items-center justify-center gap-2">
                                            <FileText className="w-3.5 h-3.5" /> Guidelines
                                        </button>
                                        <button onClick={() => navigate.push('/privacy')} className="py-3 px-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all text-xs font-bold text-zinc-400 hover:text-white flex items-center justify-center gap-2">
                                            <Lock className="w-3.5 h-3.5" /> Privacy
                                        </button>
                                        <button onClick={() => navigate.push('/terms')} className="py-3 px-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all text-xs font-bold text-zinc-400 hover:text-white flex items-center justify-center gap-2">
                                            <Scale className="w-3.5 h-3.5" /> Terms
                                        </button>
                                        <button onClick={() => navigate.push('/blog')} className="py-3 px-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all text-xs font-bold text-zinc-400 hover:text-white flex items-center justify-center gap-2">
                                            <Rocket className="w-3.5 h-3.5" /> Our Story
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- Verification Modal --- */}
                {showVerification && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
                        <div className="bg-zinc-900 w-full max-w-md p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative">
                            <button onClick={() => setShowVerification(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"><X className="w-6 h-6" /></button>

                            <div className="text-center mb-8">
                                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10 shadow-[0_0_20px_rgba(255,0,127,0.15)]">
                                    <Shield className="w-10 h-10 text-neon" />
                                </div>
                                <h2 className="text-2xl font-black text-white">Student Verification</h2>
                                <p className="text-sm text-zinc-400 mt-2">Unlock the verified checkmark & exclusive features.</p>
                            </div>

                            {verifyStep === 1 ? (
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">College Email (.edu)</label>
                                        <NeonInput placeholder="student@university.edu" value={verifyData.email} onChange={e => setVerifyData({ ...verifyData, email: e.target.value })} />
                                    </div>
                                    <NeonButton onClick={async () => {
                                        if (!verifyData.email.trim() || !verifyData.email.includes('@') || !verifyData.email.toLowerCase().endsWith('.edu')) {
                                            alert("Please enter a valid college email address ending with .edu");
                                            return;
                                        }
                                        if (!currentUser) return;

                                        setSaving(true);
                                        try {
                                            const { error } = await supabase
                                                .from('verification_requests')
                                                .insert({
                                                    user_id: currentUser.id,
                                                    email: verifyData.email,
                                                    status: 'pending'
                                                });

                                            if (error) throw error;
                                            setVerifyStep(2);
                                        } catch (err) {
                                            console.error('Verification request failed:', err);
                                            alert('Failed to send request. Please try again.');
                                        } finally {
                                            setSaving(false);
                                        }
                                    }} className="w-full py-4 text-base rounded-full" disabled={saving}>
                                        {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Send Verification'}
                                    </NeonButton>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <div className="w-16 h-16 bg-green-950/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30 animate-pulse">
                                        <CheckCircle2 className="w-8 h-8 text-green-400" />
                                    </div>
                                    <p className="text-white font-bold text-xl mb-2">Request Sent!</p>
                                    <p className="text-sm text-zinc-400 mb-8 px-4 leading-relaxed font-light">Our team is reviewing your details. You will receive an email within 24 hours.</p>
                                    <NeonButton onClick={() => setShowVerification(false)} className="w-full py-4 text-base rounded-full">Done</NeonButton>
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};