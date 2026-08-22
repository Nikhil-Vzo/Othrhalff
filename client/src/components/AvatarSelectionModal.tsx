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
    imagePath: '/assets/characters/Males/M_01.webp',
    is32Char: true
  },
  {
    id: 'M_02',
    name: 'Boy 2',
    category: 'male',
    imagePath: '/assets/characters/Males/M_02.webp',
    is32Char: true
  },
  {
    id: 'F_01',
    name: 'Girl 1',
    category: 'female',
    imagePath: '/assets/characters/Females/F_01.webp',
    is32Char: true
  },
  {
    id: 'F_02',
    name: 'Girl 2',
    category: 'female',
    imagePath: '/assets/characters/Females/F_02.webp',
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

  const handleConfirm = () => {
    localStorage.setItem('playground_avatar', selectedId);
    localStorage.setItem('playground_avatar_selected', 'true');
    onSelect(selectedId);
    if (onClose) onClose();
  };

  const currentSelectionName = ALL_AVATARS.find(a => a.id === selectedId)?.name || 'Boy 1';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#0b0712]/95 border border-white/10 rounded-2xl p-6 max-w-lg w-full flex flex-col shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#F45D9B]" />
              <h2 className="text-base font-bold text-white font-mono tracking-wider uppercase">
                {isInitialSelection ? 'Choose Avatar' : 'Switch Avatar'}
              </h2>
            </div>
            <p className="text-xs text-white/50 mt-1">Select your character for the campus playground</p>
          </div>
          {onClose && !isInitialSelection && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Character Cards: 2 Boys & 2 Girls (No Toggles) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-6">
          {ALL_AVATARS.map(avatar => {
            const isSelected = avatar.id === selectedId;

            return (
              <button
                key={avatar.id}
                onClick={() => setSelectedId(avatar.id)}
                className={`relative flex flex-col items-center justify-center p-4 rounded-xl border transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-[#F45D9B]/10 border-[#F45D9B] shadow-[0_0_20px_rgba(244,93,155,0.25)]'
                    : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.06]'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#F45D9B] text-white flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}

                {/* Pixel Art Preview */}
                <div className="w-14 h-16 flex items-center justify-center overflow-hidden relative mb-2">
                  <div
                    className="w-[16px] h-[17px] bg-no-repeat"
                    style={{
                      backgroundImage: `url('${avatar.imagePath}')`,
                      backgroundPosition: '0px 0px',
                      transform: 'scale(3)',
                      transformOrigin: 'center center',
                      imageRendering: 'pixelated'
                    }}
                  />
                </div>

                <span className="text-xs font-semibold text-white/90 truncate w-full text-center">
                  {avatar.name}
                </span>
                <span className="text-[10px] text-white/40 capitalize font-mono mt-0.5">
                  {avatar.category === 'male' ? 'Boy' : 'Girl'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between shrink-0">
          <div className="text-xs text-white/50 font-mono">
            Selected: <span className="text-white font-medium">{currentSelectionName}</span>
          </div>

          <div className="flex gap-2">
            {onClose && !isInitialSelection && (
              <button
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-mono text-white/60 hover:text-white transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleConfirm}
              className="px-5 py-2 rounded-full bg-[#F45D9B] text-white text-xs font-mono font-bold tracking-wider uppercase hover:opacity-90 active:scale-95 transition-all shadow-[0_0_15px_rgba(244,93,155,0.3)] flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Confirm</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
