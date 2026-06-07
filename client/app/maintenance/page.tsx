"use client";

import React, { useState, useEffect } from 'react';
import { StarField } from '../../src/components/StarField';
import { Ghost, Sparkles } from 'lucide-react';

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

// Helper to generate the animated frames from the static ASCII base
const getGhostFrame = (frame: number): string => {
  const lines = baseAscii.split('\n');

  if (frame === 1 || frame === 2) {
    // Wink right eye (rows 19-22, which are indexes 18-21 0-indexed)
    lines[18] = lines[18].replace("              ##*###         #******#", "                             #******#");
    lines[19] = lines[19].replace("             #****#*          ******#", "             #######          ******#");
    lines[20] = lines[20].replace("             #*****#          *******", "                              *******");
    lines[21] = lines[21].replace("              **##*", "                  ");
  }

  if (frame === 1) {
    // Puckered mouth (row 25, index 24)
    lines[24] = lines[24].replace(
      "                    *******                                               *******",
      "                    *******                      (*)                      *******"
    );
  } else if (frame === 2) {
    // Open mouth blowing kiss (row 25, index 24)
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
}

export default function MaintenancePage() {
  const [frame, setFrame] = useState(0);
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((prev) => {
        const next = (prev + 1) % 3; // 0, 1, 2
        if (next === 2) {
          // Spawn a new heart
          const newHeart = {
            id: Date.now(),
            drift: `${(Math.random() - 0.5) * 80}px`, // drift horizontal spacing
          };
          setHearts((prevHearts) => [...prevHearts, newHeart]);

          // Cleanup heart after its 2s animation ends
          setTimeout(() => {
            setHearts((prevHearts) => prevHearts.filter((h) => h.id !== newHeart.id));
          }, 2000);
        }
        return next;
      });
    }, 800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col justify-between items-center px-4 overflow-hidden selection:bg-neon selection:text-white font-sans">
      {/* Background StarField */}
      <StarField />

      {/* Embedded CSS for custom float animations */}
      <style>{`
        @keyframes heartFloat {
          0% {
            transform: translateY(10px) translateX(0) scale(0.6) rotate(0deg);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          100% {
            transform: translateY(-180px) translateX(var(--drift)) scale(1.5) rotate(15deg);
            opacity: 0;
          }
        }
        .floating-heart {
          animation: heartFloat 2.0s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }

        @keyframes cardFloat {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-6px);
          }
        }
        .animate-card-float {
          animation: cardFloat 6s ease-in-out infinite;
        }
      `}</style>

      {/* Spacer for vertical layout */}
      <div className="h-6" />

      {/* Main Glassmorphic Card (Borderless) */}
      <main className="w-full max-w-2xl bg-neutral-950/40 backdrop-blur-xl rounded-3xl p-6 sm:p-10 shadow-[0_0_50px_rgba(255,0,127,0.1)] relative z-10 animate-card-float my-auto">
        {/* Brand Name Header */}
        <header className="text-center mb-6">
          <div className="inline-flex items-center gap-3 justify-center select-none mb-1">
            <div className="relative">
              <Ghost className="w-8 h-8 text-neon drop-shadow-[0_0_8px_rgba(255,0,127,0.5)] rotate-6" />
              <Sparkles className="w-3.5 h-3.5 text-white absolute -top-1 -right-1 animate-pulse" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter uppercase leading-none">
              Othr<span className="text-neon">Halff</span>
            </h1>
          </div>
          <p className="text-[10px] font-bold text-neutral-500 tracking-[0.4em] uppercase">
            Campus Dating
          </p>
        </header>

        {/* Dynamic ASCII Logo blowing a kiss (Auto-height to prevent head cropping) */}
        <div className="flex flex-col items-center justify-center py-2 mb-6 relative">
          <div className="relative w-full max-w-lg flex items-center justify-center overflow-visible">
            <pre className="text-[3.8px] xs:text-[4.8px] sm:text-[6.2px] md:text-[7.2px] leading-[1.0] text-[#ff007f] filter drop-shadow-[0_0_8px_rgba(255,0,127,0.5)] font-mono font-bold select-none whitespace-pre text-center">
              {getGhostFrame(frame)}
            </pre>
            
            {/* Floating Hearts Container, aligned around the mouth line */}
            <div className="absolute top-[48%] left-[50.5%] pointer-events-none">
              {hearts.map((heart) => (
                <span
                  key={heart.id}
                  className="absolute floating-heart text-[#ff007f] text-2xl filter drop-shadow-[0_0_6px_rgba(255,0,127,0.8)]"
                  style={{
                    '--drift': heart.drift,
                  } as React.CSSProperties}
                >
                  ♥
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Maintenance Message with Poetic Quote */}
        <div className="text-center space-y-6">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-snug">
            Othrhalff is under renovation...
          </h2>
          <div className="space-y-2 max-w-md mx-auto">
            <p className="text-sm sm:text-base text-neutral-400 font-medium italic tracking-wide leading-relaxed">
              "In a sea of anonymous faces, searching for the spark; two wandering halves will find their light in the dark."
            </p>
            <p className="text-[10px] text-neutral-500 font-black tracking-[0.3em] uppercase">
              — OthrHalff
            </p>
          </div>
        </div>
      </main>

      {/* Footer Branding Info */}
      <footer className="w-full text-center py-8 z-10">
        <p className="text-[11px] font-bold text-neutral-600 tracking-widest uppercase">
          © {new Date().getFullYear()} OTHRHALFF. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
