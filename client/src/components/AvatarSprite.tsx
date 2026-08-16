import React, { useEffect, useState, useRef } from 'react';

export type Direction = 'up' | 'down' | 'left' | 'right';

interface AvatarSpriteProps {
  x: number; // Target network position
  y: number;
  direction: Direction;
  isMoving: boolean;
  color?: string;
  username?: string;
  isLocal?: boolean;
  speechBubble?: string;
  isSitting?: boolean;
  isGpsActive?: boolean;
}

// LPC Universal Spritesheet standard rows for walking
const directionToRow = {
  up: 8,
  left: 9,
  down: 10,
  right: 11
};

export const AvatarSprite = React.forwardRef<HTMLDivElement, AvatarSpriteProps>(({
  x: targetX, y: targetY, direction, isMoving, color = '#3b82f6', username = 'Player', isLocal = false,
  speechBubble, isSitting = false, isGpsActive = false
}, ref) => {
  const [frame, setFrame] = useState(0);
  const spriteRef = useRef<HTMLDivElement>(null);
  
  // Expose the internal div to parent ref
  React.useImperativeHandle(ref, () => spriteRef.current!);

  // Local coordinates for smooth interpolation
  const displayX = useRef(targetX);
  const displayY = useRef(targetY);

  // Walk animation loop
  useEffect(() => {
    if (!isMoving) {
      setFrame(0); // Frame 0 is the idle standing pose
      return;
    }
    
    // Cycle through 9 frames of the walk animation at a natural 100ms pace
    const interval = setInterval(() => {
      setFrame(prev => (prev + 1) % 9);
    }, 100);
    
    return () => clearInterval(interval);
  }, [isMoving]);

  // Client-side interpolation (Lerping) for remote players (bypasses React diffs for 60FPS smoothness)
  useEffect(() => {
    if (isLocal) {
      displayX.current = targetX;
      displayY.current = targetY;
      if (spriteRef.current) {
        spriteRef.current.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) scale(0.6)`;
      }
      return;
    }

    let animationFrameId: number;
    const lerp = () => {
      // Smoothly interpolate towards target (15% distance per frame)
      displayX.current += (targetX - displayX.current) * 0.15; 
      displayY.current += (targetY - displayY.current) * 0.15;

      if (spriteRef.current) {
        spriteRef.current.style.transform = `translate3d(${displayX.current}px, ${displayY.current}px, 0) scale(0.6)`;
      }
      
      // Stop lerping when close enough to save CPU
      if (Math.abs(targetX - displayX.current) < 0.5 && Math.abs(targetY - displayY.current) < 0.5) {
        displayX.current = targetX;
        displayY.current = targetY;
        return; 
      }
      animationFrameId = requestAnimationFrame(lerp);
    };

    animationFrameId = requestAnimationFrame(lerp);
    return () => cancelAnimationFrame(animationFrameId);
  }, [targetX, targetY, isLocal]);

  // The LPC sprites are exactly 64x64 per frame
  const spriteWidth = 64;
  const spriteHeight = 64;
  
  const effectiveDirection = isSitting ? 'down' : direction;
  const effectiveFrame = isSitting ? 0 : frame;
  const bgX = -(effectiveFrame * spriteWidth);
  const bgY = -(directionToRow[effectiveDirection] * spriteHeight);

  return (
    <div 
      ref={spriteRef}
      className={`absolute ${isLocal ? 'z-20' : 'z-10'} flex flex-col items-center justify-center`}
      style={{ 
        transform: `translate3d(${targetX}px, ${targetY}px, 0) scale(0.6)`,
        width: `${spriteWidth}px`,
        height: `${spriteHeight}px`,
        marginTop: `-${spriteHeight / 2}px`, 
        marginLeft: `-${spriteWidth / 2}px`,
        willChange: 'transform'
      }}
    >
      {/* The actual animated sprite */}
      <div 
        className="w-full h-full bg-no-repeat relative"
        style={{
          backgroundImage: `url('/assets/character-spritesheet.png')`,
          backgroundPosition: `${bgX}px ${bgY}px`,
          imageRendering: 'pixelated',
        }}
      >
        {/* Fallback circle */}
        <div className="absolute inset-0 -z-10 flex items-center justify-center opacity-20">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }}></div>
        </div>
      </div>
      
      {/* Drop Shadow */}
      <div className="absolute bottom-2 w-8 h-2.5 bg-black/40 rounded-[100%] blur-[2px] -z-10"></div>

      {/* GPS Active Ping */}
      {isGpsActive && (
        <div className="absolute bottom-1 w-12 h-6 border-2 border-cyan-400/80 rounded-[100%] animate-ping pointer-events-none -z-10 shadow-[0_0_12px_rgba(34,211,238,0.8)]"></div>
      )}

      {/* Speech Bubble */}
      {speechBubble && (
        <div className="absolute -top-10 flex flex-col items-center pointer-events-none z-30 animate-bounce">
          <div className="bg-white text-black px-3 py-1.5 rounded-2xl text-xs font-bold max-w-[150px] text-center shadow-lg break-words border-2 border-gray-200">
            {speechBubble}
          </div>
          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white -mt-[2px]"></div>
        </div>
      )}

      {/* Name Tag */}
      <div className="absolute -bottom-3 whitespace-nowrap pointer-events-none">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-md backdrop-blur-sm
          ${isLocal 
            ? 'bg-black/80 text-neon border-neon/50' 
            : 'bg-black/60 text-gray-200 border-gray-700'
          }`}
        >
          {isLocal ? 'You' : username}
        </span>
      </div>
    </div>
  );
});

AvatarSprite.displayName = 'AvatarSprite';
