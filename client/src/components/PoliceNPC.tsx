import React, { useState, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';

interface PoliceNPCProps {
  x: number;
  y: number;
  playerX: number;
  playerY: number;
  name?: string;
  warningText?: string;
}

const POLICE_FRAMES = [
  '/assets/police/1_police_Idle_000.webp',
  '/assets/police/1_police_Idle_001.webp',
  '/assets/police/1_police_Idle_002.webp',
  '/assets/police/1_police_Idle_003.webp',
  '/assets/police/1_police_Idle_004.webp',
  '/assets/police/1_police_Idle_005.webp',
  '/assets/police/1_police_Idle_006.webp',
  '/assets/police/1_police_Idle_007.webp',
];

export const PoliceNPC: React.FC<PoliceNPCProps> = ({
  x,
  y,
  playerX,
  playerY,
  name = 'Campus Security',
  warningText = 'Idhar Jana Allowed nahi hai!'
}) => {
  const [frameIndex, setFrameIndex] = useState(0);

  // Calculate distance to player
  const dx = playerX - x;
  const dy = playerY - y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const isNear = distance < 95;

  // Cycle idle frames
  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIndex(prev => (prev + 1) % POLICE_FRAMES.length);
    }, 140);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="absolute z-20 pointer-events-none flex flex-col items-center justify-center select-none"
      style={{
        transform: `translate3d(${x}px, ${y}px, 0)`,
        width: '32px',
        height: '48px',
        marginTop: '-38px',
        marginLeft: '-16px'
      }}
    >
      {/* Warning Speech Bubble when user approaches */}
      {isNear && (
        <div className="absolute -top-8 z-30 flex flex-col items-center animate-bounce">
          <div className="bg-red-950/95 border border-red-500/80 text-white px-2 py-0.5 rounded-xl shadow-[0_0_12px_rgba(239,68,68,0.5)] flex items-center gap-1 whitespace-nowrap backdrop-blur-md">
            <ShieldAlert className="w-3 h-3 text-red-400 animate-pulse shrink-0" />
            <span className="text-[10px] font-bold tracking-tight text-red-100">{warningText}</span>
          </div>
          <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-red-500 -mt-[1px]"></div>
        </div>
      )}

      {/* Police Name Tag */}
      <div className="absolute -top-2 px-1.5 py-0 bg-black/80 border border-blue-500/40 rounded-full flex items-center gap-0.5 shadow-sm scale-90">
        <span className="w-1 h-1 rounded-full bg-blue-400 animate-ping"></span>
        <span className="text-[8px] font-bold text-blue-300 tracking-wider uppercase">{name}</span>
      </div>

      {/* Animated Police Sprite */}
      <img
        src={POLICE_FRAMES[frameIndex]}
        alt={name}
        className="w-full h-full object-contain filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]"
        style={{
          transform: dx < 0 ? 'scaleX(-1)' : 'scaleX(1)', // Turn towards player
          transition: 'transform 0.2s ease'
        }}
      />

      {/* Ground Shadow */}
      <div className="absolute -bottom-1 w-6 h-2 bg-black/40 rounded-[100%] blur-[1px] -z-10"></div>
    </div>
  );
};
