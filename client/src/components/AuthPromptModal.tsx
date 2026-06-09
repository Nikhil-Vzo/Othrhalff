import React from 'react';
import { useRouter } from 'next/navigation';
import { Ghost, X } from 'lucide-react';
import { NeonButton } from './Common';

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthPromptModal: React.FC<AuthPromptModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 md:p-8 max-w-sm w-full relative shadow-2xl animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center text-center mt-4">
          <div className="w-16 h-16 bg-neon/10 rounded-full flex items-center justify-center mb-6 shadow-neon-sm">
            <Ghost className="w-8 h-8 text-neon" />
          </div>
          
          <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-2">Login Required</h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            You need to be logged in to access this feature and connect with your campus.
          </p>

          <div className="flex flex-col gap-3 w-full">
            <NeonButton 
              onClick={() => {
                onClose();
                router.push('/login');
              }}
              className="w-full"
            >
              Log In / Sign Up
            </NeonButton>
            <button 
              onClick={onClose}
              className="text-gray-500 font-medium hover:text-white transition-colors py-2"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
