import React, { useEffect, useState } from 'react';

export type Direction = 'up' | 'down' | 'left' | 'right';

interface AvatarSpriteProps {
  x: number;
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
  x, y, direction, isMoving, color = '#3b82f6', username = 'Player', isLocal = false,
  speechBubble, isSitting = false, isGpsActive = false
}, ref) => {
  const [frame, setFrame] = useState(0);
  
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

  // The LPC sprites are exactly 64x64 per frame
  const spriteWidth = 64;
  const spriteHeight = 64;
  
  const bgX = -(frame * spriteWidth);
  const bgY = -(directionToRow[direction] * spriteHeight);

  return (
    <div 
      ref={ref}
      className={`absolute ${isLocal ? 'z-20' : 'z-10 transition-transform duration-[100ms] ease-linear'} flex flex-col items-center justify-center`}
      style={{ 
        transform: `translate3d(${x}px, ${y + (isSitting ? 15 : 0)}px, 0) scale(0.6)`,
        width: `${spriteWidth}px`,
        height: `${spriteHeight}px`,
        // Center the sprite precisely on the X,Y coordinates
        marginTop: `-${spriteHeight / 2}px`, 
        marginLeft: `-${spriteWidth / 2}px`,
        clipPath: isSitting ? 'inset(0 0 35% 0)' : 'none',
        willChange: 'transform'
      }}
    >
      {/* The actual animated sprite */}
      <div 
        className="w-full h-full bg-no-repeat relative"
        style={{
          // We use the character-spritesheet.png file that the user downloads
          backgroundImage: `url('/assets/character-spritesheet.png')`,
          backgroundPosition: `${bgX}px ${bgY}px`,
          imageRendering: 'pixelated', // Keeps pixel art crisp
        }}
      >
        {/* Simple Fallback circle just in case they haven't added the image yet */}
        <div className="absolute inset-0 -z-10 flex items-center justify-center opacity-20">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }}></div>
        </div>
      </div>
      
      {/* Drop Shadow underneath the character */}
      <div className="absolute bottom-2 w-8 h-2.5 bg-black/40 rounded-[100%] blur-[2px] -z-10"></div>

      {/* GPS Active Radar Ping Effect */}
      {isGpsActive && (
        <div className="absolute bottom-1 w-12 h-6 border-2 border-cyan-400/80 rounded-[100%] animate-ping pointer-events-none -z-10 shadow-[0_0_12px_rgba(34,211,238,0.8)]"></div>
      )}

      {/* Floating Speech Bubble */}
      {speechBubble && (
        <div className="absolute -top-10 flex flex-col items-center pointer-events-none z-30 animate-bounce">
          <div className="bg-white text-black px-3 py-1.5 rounded-2xl text-xs font-bold max-w-[150px] text-center shadow-lg break-words border-2 border-gray-200">
            {speechBubble}
          </div>
          {/* Little tail for the speech bubble */}
          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white -mt-[2px]"></div>
        </div>
      )}

      {/* Floating Name Tag */}
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
