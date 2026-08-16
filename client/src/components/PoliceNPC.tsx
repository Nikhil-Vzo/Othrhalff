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
  '/assets/police/1_police_Idle_000.png',
  '/assets/police/1_police_Idle_001.png',
  '/assets/police/1_police_Idle_002.png',
  '/assets/police/1_police_Idle_003.png',
  '/assets/police/1_police_Idle_004.png',
  '/assets/police/1_police_Idle_005.png',
  '/assets/police/1_police_Idle_006.png',
  '/assets/police/1_police_Idle_007.png',
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
  const isNear = distance < 130;

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
        width: '64px',
        height: '96px',
        marginTop: '-72px',
        marginLeft: '-32px'
      }}
    >
      {/* Warning Speech Bubble when user approaches */}
      {isNear && (
        <div className="absolute -top-12 z-30 flex flex-col items-center animate-bounce">
          <div className="bg-red-950/95 border-2 border-red-500/80 text-white px-3 py-1.5 rounded-2xl shadow-[0_0_20px_rgba(239,68,68,0.6)] flex items-center gap-1.5 whitespace-nowrap backdrop-blur-md">
            <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse shrink-0" />
            <span className="text-xs font-black tracking-wide text-red-100">{warningText}</span>
          </div>
          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-red-500 -mt-[1px]"></div>
        </div>
      )}

      {/* Police Name Tag */}
      <div className="absolute -top-3 px-2 py-0.5 bg-black/75 border border-blue-500/40 rounded-full flex items-center gap-1 shadow-md">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping"></span>
        <span className="text-[10px] font-bold text-blue-300 tracking-wider uppercase">{name}</span>
      </div>

      {/* Animated Police Sprite */}
      <img
        src={POLICE_FRAMES[frameIndex]}
        alt={name}
        className="w-full h-full object-contain filter drop-shadow-[0_8px_12px_rgba(0,0,0,0.6)]"
        style={{
          transform: dx < 0 ? 'scaleX(-1)' : 'scaleX(1)', // Turn towards player
          transition: 'transform 0.2s ease'
        }}
      />

      {/* Ground Shadow */}
      <div className="absolute -bottom-1 w-10 h-3 bg-black/50 rounded-[100%] blur-[2px] -z-10"></div>
    </div>
  );
};
