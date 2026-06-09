"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Ghost, Sparkles, X } from 'lucide-react';

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

const baseAscii = `                                                                                                     
                                                                                                     
                                                                                                     
                                              #####*#####                                            
                                        #*********************##                                     
                                    *****************************###                                 
                                 #***********************************#                               
                               *#***********#####     ##**#*************                             
                             #***********#                   #*#**********                           
                           ##********##                          #*********#                         
                          #*********                               *********#                        
                         #********#                                  *********                       
                        #*******#                                     #*******#                      
                       #*******#                                        #*******                     
                      #********                                         #*******#                    
                      ********                                           ********#                   
                      #******#                                            #******#                   
                     #******#                                             #******#                   
                     #******#          **###               ##*###         #******#                   
                     #******          #*****#             #****#*          ******#                   
                     *******          #*****#             #*****#          *******                   
                     *******           *###*               **##*           *******                   
                     *******                                               *******                   
                     *******                                               *******                   
                     *******                                               *******                   
                     *******                                               *******                   
                     *******                                               *******                   
                     *******                                               *******                   
                     *******                                               *******                   
                     *******                                               *******                   
                     *******                                               *******                   
                     *******                                               *******                   
                     *******                                               *******                   
                     *******                                               *******                   
                     *******                                               *******                   
                     *******                                               *******                   
                     *******   #****##          #****##          #*****#   *******                   
                     ******* ##********#      #********##      ##********# *******                   
                     *******#***********##   #************#   #************#******                   
                     **************************************##*********************                   
                     *************##***************##***************#*************                   
                     ***********#    #***********#   #************#   #***********                   
                     *********##      #********#       #********#       #*********                   
                     #******##          ##****#          ##**##           #*******                   
                      ****##                                                #****#                   
                                                                                                     
                                                                                                     
                                                                                                     
                                                                                                     
                                                                                                     
                                                                                                     
                                                                                                     `;

const getGhostFrame = (frame: number): string => {
  const lines = baseAscii.split('\n');

  if (frame === 1 || frame === 2) {
    lines[18] = lines[18].replace("              ##*###         #******#", "                             #******#");
    lines[19] = lines[19].replace("             #****#*          ******#", "             #######          ******#");
    lines[20] = lines[20].replace("             #*****#          *******", "                              *******");
    lines[21] = lines[21].replace("              **##*", "                  ");
  }

  if (frame === 1) {
    lines[24] = lines[24].replace(
      "                    *******                                               *******",
      "                    *******                      (*)                      *******"
    );
  } else if (frame === 2) {
    lines[24] = lines[24].replace(
      "                    *******                                               *******",
      "                    *******                      (O)                      *******"
    );
  }

  return lines.join('\n');
};

interface FloatingHeart {
  id: number;
  drift: string;
  delay: string;
}

export const AuthPromptModal: React.FC<AuthPromptModalProps> = ({ isOpen, onClose, message }) => {
  const router = useRouter();
  const [frame, setFrame] = useState(0);
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setFrame((prev) => {
        const next = (prev + 1) % 3; // 0, 1, 2
        if (next === 2) {
          const spawnTwo = Math.random() > 0.4; // 60% chance to spawn 2 hearts
          const newHearts: FloatingHeart[] = [
            {
              id: Date.now(),
              drift: `${(Math.random() - 0.5) * 60}px`,
              delay: '0s',
            }
          ];
          if (spawnTwo) {
            newHearts.push({
              id: Date.now() + 1,
              drift: `${(Math.random() - 0.5) * 60}px`,
              delay: '0.25s',
            });
          }
          setHearts((prevHearts) => [...prevHearts, ...newHearts]);

          newHearts.forEach((h) => {
            const timeoutDuration = 2000 + (parseFloat(h.delay) * 1000);
            setTimeout(() => {
              setHearts((prevHearts) => prevHearts.filter((heart) => heart.id !== h.id));
            }, timeoutDuration);
          });
        }
        return next;
      });
    }, 800);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSignUp = () => {
    onClose();
    router.push('/login');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* CSS for custom float animations */}
      <style>{`
        @keyframes heartFloatModal {
          0% {
            transform: translateY(10px) translateX(0) scale(0.6) rotate(0deg);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          100% {
            transform: translateY(-120px) translateX(var(--drift)) scale(1.4) rotate(15deg);
            opacity: 0;
          }
        }
        .modal-floating-heart {
          animation: heartFloatModal 2.0s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          animation-delay: var(--delay);
        }
      `}</style>

      {/* Glassmorphic Modal Card */}
      <div className="relative w-full max-w-md bg-neutral-950/80 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-[0_0_50px_rgba(255,0,127,0.15)] z-10 text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white rounded-full hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Mascot Header */}
        <div className="inline-flex items-center gap-2 justify-center select-none mb-4">
          <div className="relative">
            <Ghost className="w-6 h-6 text-neon drop-shadow-[0_0_8px_rgba(255,0,127,0.5)] rotate-6" />
            <Sparkles className="w-2.5 h-2.5 text-white absolute -top-1 -right-1 animate-pulse" />
          </div>
          <span className="text-xl font-black text-white tracking-tighter uppercase">
            Othr<span className="text-neon">Halff</span>
          </span>
        </div>

        {/* Dynamic ASCII Logo blowing a kiss */}
        <div className="flex flex-col items-center justify-center mb-6 relative">
          <div className="relative w-full max-w-[240px] flex items-center justify-center overflow-visible">
            <pre className="text-[2.2px] sm:text-[2.6px] leading-[1.0] text-[#ff007f] filter drop-shadow-[0_0_6px_rgba(255,0,127,0.5)] font-mono font-bold select-none whitespace-pre text-center">
              {getGhostFrame(frame)}
            </pre>

            {/* Floating Hearts Container */}
            <div className="absolute top-[48%] left-[50.5%] pointer-events-none">
              {hearts.map((heart) => (
                <span
                  key={heart.id}
                  className="absolute modal-floating-heart text-[#ff007f] text-xl filter drop-shadow-[0_0_4px_rgba(255,0,127,0.8)]"
                  style={{
                    '--drift': heart.drift,
                    '--delay': heart.delay,
                  } as React.CSSProperties}
                >
                  ♥
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-3 mb-6">
          <h2 className="text-lg sm:text-xl font-black tracking-tight text-white uppercase">
            {message || "Signup to access other sections"}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 font-medium leading-relaxed max-w-xs mx-auto">
            {message ? "Create an account or log in to view and connect with your college community." : "Create an account or log in to get a match, view profiles, confessions, comment and chat with other students."}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleSignUp}
            className="w-full py-3 bg-neon text-white font-bold text-sm uppercase tracking-wider rounded-full hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(255,0,127,0.4)] hover:shadow-[0_0_30px_rgba(255,0,127,0.6)]"
          >
            Log In / Sign Up
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 bg-transparent text-gray-500 hover:text-gray-300 font-bold text-sm uppercase tracking-wider rounded-full border border-gray-800 hover:border-gray-700 transition-colors"
          >
            Stay as Guest
          </button>
        </div>
      </div>
    </div>
  );
};
