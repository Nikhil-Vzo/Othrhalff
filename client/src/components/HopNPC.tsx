import React, { useEffect, useRef, useState, useCallback } from 'react';

interface HopNPCProps {
  checkCollision: (x: number, y: number, size?: number) => boolean;
  playerX?: number;
  playerY?: number;
}

const WORLD_WIDTH = 2560;
const WORLD_HEIGHT = 1440;

const HOP_MESSAGES = [
  'Hop! 🐰✨',
  'Zoomies! 💨',
  'Campus Vibe 🎧',
  'Find your other half! 💖',
  '*hops around happily* 🌸',
  'Sparx FM on repeat! 📻'
];

export const HopNPC: React.FC<HopNPCProps> = ({ checkCollision, playerX, playerY }) => {
  // Start near the central open plaza (white walkable area)
  const posRef = useRef({ x: 1280, y: 720 });
  const [renderPos, setRenderPos] = useState({ x: 1280, y: 720 });
  const [facingRight, setFacingRight] = useState(true);
  const [isHopping, setIsHopping] = useState(false);
  const [bubbleText, setBubbleText] = useState<string | null>(null);
  const [imageSrc, setImageSrc] = useState('/assets/hop.png');
  const [imageError, setImageError] = useState(false);

  const targetPosRef = useRef<{ x: number; y: number } | null>(null);
  const stateRef = useRef<'IDLE' | 'MOVING'>('IDLE');
  const idleTimerRef = useRef(0);
  const hopCycleRef = useRef(0);

  // Pick a random valid target coordinate inside the white area
  const pickRandomWhiteAreaTarget = useCallback(() => {
    for (let attempts = 0; attempts < 30; attempts++) {
      // Pick within a radius of 200 - 450px from current position
      const distance = 150 + Math.random() * 300;
      const angle = Math.random() * Math.PI * 2;
      const testX = Math.round(posRef.current.x + Math.cos(angle) * distance);
      const testY = Math.round(posRef.current.y + Math.sin(angle) * distance);

      // Verify coordinate is within bounds and on walkable white area (collision === false)
      if (
        testX > 200 && testX < WORLD_WIDTH - 200 &&
        testY > 150 && testY < WORLD_HEIGHT - 150 &&
        !checkCollision(testX, testY, 24)
      ) {
        return { x: testX, y: testY };
      }
    }

    // Fallback toward center plaza if stuck
    return { x: 1280 + (Math.random() * 200 - 100), y: 720 + (Math.random() * 200 - 100) };
  }, [checkCollision]);

  // Main 60 FPS autonomous roaming animation loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const wanderLoop = (currentTime: number) => {
      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      if (stateRef.current === 'IDLE') {
        idleTimerRef.current -= delta;
        if (idleTimerRef.current <= 0) {
          // Transition to MOVING
          targetPosRef.current = pickRandomWhiteAreaTarget();
          stateRef.current = 'MOVING';
          setIsHopping(true);
        }
      } else if (stateRef.current === 'MOVING' && targetPosRef.current) {
        const dx = targetPosRef.current.x - posRef.current.x;
        const dy = targetPosRef.current.y - posRef.current.y;
        const distance = Math.hypot(dx, dy);

        if (distance < 6) {
          // Arrived at destination -> Idle for 1.5 - 3.5 seconds
          stateRef.current = 'IDLE';
          idleTimerRef.current = 1.5 + Math.random() * 2.0;
          setIsHopping(false);
          targetPosRef.current = null;
        } else {
          // Move towards target
          const speed = 75; // pixels per second
          const moveDist = Math.min(speed * delta, distance);
          const nextX = posRef.current.x + (dx / distance) * moveDist;
          const nextY = posRef.current.y + (dy / distance) * moveDist;

          // Check if path is blocked
          if (!checkCollision(nextX, nextY, 24)) {
            posRef.current = { x: nextX, y: nextY };
            setFacingRight(dx > 0);
            hopCycleRef.current += delta * 10;
          } else {
            // Blocked by obstacle -> pause and pick new target
            stateRef.current = 'IDLE';
            idleTimerRef.current = 1.0;
            setIsHopping(false);
            targetPosRef.current = null;
          }
        }
      }

      setRenderPos({ x: posRef.current.x, y: posRef.current.y });
      animationFrameId = requestAnimationFrame(wanderLoop);
    };

    animationFrameId = requestAnimationFrame(wanderLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [checkCollision, pickRandomWhiteAreaTarget]);

  // Handle image error fallback sequence (/assets/hop.png -> /hop.png -> /assets/hop.gif -> fallback icon)
  const handleImageError = () => {
    if (imageSrc === '/assets/hop.png') {
      setImageSrc('/hop.png');
    } else if (imageSrc === '/hop.png') {
      setImageSrc('/assets/hop.gif');
    } else if (imageSrc === '/assets/hop.gif') {
      setImageSrc('/assets/hop.jpeg');
    } else {
      setImageError(true);
    }
  };

  const handleHopClick = () => {
    const randomMsg = HOP_MESSAGES[Math.floor(Math.random() * HOP_MESSAGES.length)];
    setBubbleText(randomMsg);
    setTimeout(() => setBubbleText(null), 3500);

    // Give a playful little jump
    targetPosRef.current = pickRandomWhiteAreaTarget();
    stateRef.current = 'MOVING';
    setIsHopping(true);
  };

  return (
    <div
      className="absolute z-20 cursor-pointer pointer-events-auto select-none"
      style={{
        transform: `translate3d(${renderPos.x}px, ${renderPos.y}px, 0)`,
        willChange: 'transform'
      }}
      onClick={handleHopClick}
    >
      {/* Speech Bubble */}
      {bubbleText && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white/95 text-gray-900 text-[11px] font-black px-3 py-1 rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.4)] whitespace-nowrap border border-pink-400/50 animate-bounce">
          {bubbleText}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45 border-r border-b border-pink-400/50" />
        </div>
      )}

      {/* Hop Character Sprite with Dynamic Bounce & Directional Flip */}
      <div
        className="relative flex items-center justify-center transition-transform duration-75"
        style={{
          transform: `scaleX(${facingRight ? 1 : -1}) translateY(${isHopping ? -Math.abs(Math.sin(hopCycleRef.current)) * 8 : 0}px)`
        }}
      >
        {!imageError ? (
          <img
            src={imageSrc}
            alt="Hop"
            className="w-12 h-12 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] filter hover:brightness-110 active:scale-95 transition-all"
            onError={handleImageError}
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-purple-500 border-2 border-white/80 shadow-[0_0_15px_rgba(236,72,153,0.8)] flex items-center justify-center text-lg">
            🐰
          </div>
        )}

        {/* Small Ambient Shadow underneath */}
        <div
          className="absolute -bottom-1 w-8 h-2 rounded-full bg-black/40 blur-[1px] transition-all"
          style={{
            transform: `scale(${isHopping ? 0.75 : 1})`,
            opacity: isHopping ? 0.4 : 0.7
          }}
        />
      </div>
    </div>
  );
};
