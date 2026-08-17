import React, { useState } from 'react';
import { Sparkles, Check, X, User } from 'lucide-react';

export interface AvatarOption {
  id: string;
  name: string;
  category: 'male' | 'female';
  imagePath: string;
  is32Char?: boolean;
}

export const ALL_AVATARS: AvatarOption[] = [
  {
    id: 'M_01',
    name: 'Boy 1',
    category: 'male',
    imagePath: '/assets/characters/Males/M_01.png',
    is32Char: true
  },
  {
    id: 'M_02',
    name: 'Boy 2',
    category: 'male',
    imagePath: '/assets/characters/Males/M_02.png',
    is32Char: true
  },
  {
    id: 'F_01',
    name: 'Girl 1',
    category: 'female',
    imagePath: '/assets/characters/Females/F_01.png',
    is32Char: true
  },
  {
    id: 'F_02',
    name: 'Girl 2',
    category: 'female',
    imagePath: '/assets/characters/Females/F_02.png',
    is32Char: true
  }
];

interface AvatarSelectionModalProps {
  currentAvatar: string;
  onSelect: (avatarId: string) => void;
  onClose?: () => void;
  isInitialSelection?: boolean;
}

export const AvatarSelectionModal: React.FC<AvatarSelectionModalProps> = ({
  currentAvatar,
  onSelect,
  onClose,
  isInitialSelection = false
}) => {
  const [selectedId, setSelectedId] = useState(
    ALL_AVATARS.some(a => a.id === currentAvatar) ? currentAvatar : 'M_01'
  );
  const [tab, setTab] = useState<'all' | 'male' | 'female'>('all');

  const filteredAvatars = ALL_AVATARS.filter(a => {
    if (tab === 'all') return true;
    return a.category === tab;
  });

  const handleConfirm = () => {
    localStorage.setItem('playground_avatar', selectedId);
    localStorage.setItem('playground_avatar_selected', 'true');
    onSelect(selectedId);
    if (onClose) onClose();
  };

  const currentSelectionName = ALL_AVATARS.find(a => a.id === selectedId)?.name || 'Boy 1';

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-gradient-to-b from-gray-900 via-gray-950 to-[#070510] border border-white/15 rounded-3xl p-5 sm:p-7 max-w-xl w-full flex flex-col max-h-[90vh] shadow-[0_0_60px_rgba(168,85,247,0.25)] relative overflow-hidden">
        
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-pink-500/20 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-violet-500/20 rounded-full blur-[90px] pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-400" />
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                {isInitialSelection ? 'Choose Your Campus Avatar' : 'Change Character'}
              </h2>
            </div>
            <p className="text-xs text-gray-400 mt-1">Select your character to roam around the playground</p>
          </div>
          {onClose && !isInitialSelection && (
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 my-4 p-1 bg-white/5 rounded-2xl border border-white/10 shrink-0">
          <button
            onClick={() => setTab('all')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              tab === 'all' ? 'bg-pink-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            All (4)
          </button>
          <button
            onClick={() => setTab('male')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              tab === 'male' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            Boys (2)
          </button>
          <button
            onClick={() => setTab('female')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              tab === 'female' ? 'bg-fuchsia-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            Girls (2)
          </button>
        </div>

        {/* Character Grid (4 options: 2 Boys & 2 Girls) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 min-h-0">
          {filteredAvatars.map(avatar => {
            const isSelected = avatar.id === selectedId;

            return (
              <button
                key={avatar.id}
                onClick={() => setSelectedId(avatar.id)}
                className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border transition-all active:scale-95 group ${
                  isSelected
                    ? 'bg-pink-500/20 border-pink-500 shadow-[0_0_25px_rgba(236,72,153,0.45)] scale-105'
                    : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-pink-500 text-white flex items-center justify-center shadow">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}

                {/* Pixel Art Preview */}
                <div className="w-16 h-20 flex items-center justify-center overflow-hidden relative mb-2">
                  <div
                    className="w-[16px] h-[17px] bg-no-repeat"
                    style={{
                      backgroundImage: `url('${avatar.imagePath}')`,
                      backgroundPosition: '0px 0px',
                      transform: 'scale(3.2)',
                      transformOrigin: 'center center',
                      imageRendering: 'pixelated'
                    }}
                  />
                </div>

                <span className="text-xs font-bold text-gray-200 truncate w-full text-center mt-1 group-hover:text-white">
                  {avatar.name}
                </span>
                <span className="text-[10px] text-gray-400 capitalize">
                  {avatar.category}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 mt-2 border-t border-white/10 flex items-center justify-between shrink-0">
          <div className="text-xs text-gray-400 flex items-center gap-1.5">
            <User className="w-4 h-4 text-pink-400" />
            <span>Selected: <strong className="text-white">{currentSelectionName}</strong></span>
          </div>

          <div className="flex gap-3">
            {onClose && !isInitialSelection && (
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleConfirm}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold shadow-[0_0_20px_rgba(236,72,153,0.4)] hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Confirm Avatar</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
