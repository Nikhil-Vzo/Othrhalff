import React, { useEffect, useRef, useState, useCallback } from 'react';

interface HopNPCProps {
  checkCollision: (x: number, y: number, size?: number) => boolean;
  playerX?: number;
  playerY?: number;
}

const WORLD_WIDTH = 2560;
const WORLD_HEIGHT = 1440;

// Verified Open White Walkable Zones (Central Diamond Plaza, Pathways & Courtyards)
const WHITE_WALKABLE_ZONES = [
  { minX: 1500, maxX: 2150, minY: 500, maxY: 1100 }, // Main Open Central Plaza & Lawn Walkway
  { minX: 1450, maxX: 1900, minY: 350, maxY: 600 },  // Upper North Plaza
  { minX: 1550, maxX: 2200, minY: 750, maxY: 1200 }, // Lower South Plaza
  { minX: 950,  maxX: 1350, minY: 150, maxY: 320 },  // Top North Courtyard
];

const HOP_MESSAGES = [
  'Hop! 🐰✨',
  'Zoomies! 💨',
  'Campus Vibe 🎧',
  'Find your other half! 💖',
  '*hops around happily* 🌸',
  'Sparx FM on repeat! 📻'
];

export const HopNPC: React.FC<HopNPCProps> = ({ checkCollision, playerX, playerY }) => {
  // Start right in the middle of the main open white plaza
  const posRef = useRef({ x: 1680, y: 720 });
  const [renderPos, setRenderPos] = useState({ x: 1680, y: 720 });
  const [facingRight, setFacingRight] = useState(true);
  const [isHopping, setIsHopping] = useState(false);
  const [bubbleText, setBubbleText] = useState<string | null>(null);
  const [imageSrc, setImageSrc] = useState('/assets/hop.webp');
  const [imageError, setImageError] = useState(false);

  const targetPosRef = useRef<{ x: number; y: number } | null>(null);
  const stateRef = useRef<'IDLE' | 'MOVING'>('IDLE');
  const idleTimerRef = useRef(0.5);
  const hopCycleRef = useRef(0);

  // Pick a random valid target coordinate strictly inside the white walkable area
  const pickRandomWhiteAreaTarget = useCallback(() => {
    // 1. Try picking from the confirmed open white zones first
    for (let attempts = 0; attempts < 40; attempts++) {
      const zone = WHITE_WALKABLE_ZONES[Math.floor(Math.random() * WHITE_WALKABLE_ZONES.length)];
      const testX = Math.round(zone.minX + Math.random() * (zone.maxX - zone.minX));
      const testY = Math.round(zone.minY + Math.random() * (zone.maxY - zone.minY));

      // Strictly verify coordinate is NOT blocked by any black mask pixel (checkCollision === false)
      if (!checkCollision(testX, testY, 24)) {
        return { x: testX, y: testY };
      }
    }

    // 2. Fallback to nearby white radius
    for (let attempts = 0; attempts < 25; attempts++) {
      const distance = 80 + Math.random() * 250;
      const angle = Math.random() * Math.PI * 2;
      const testX = Math.round(posRef.current.x + Math.cos(angle) * distance);
      const testY = Math.round(posRef.current.y + Math.sin(angle) * distance);

      if (
        testX > 200 && testX < WORLD_WIDTH - 200 &&
        testY > 150 && testY < WORLD_HEIGHT - 150 &&
        !checkCollision(testX, testY, 24)
      ) {
        return { x: testX, y: testY };
      }
    }

    // Default safe white area coordinate in the central plaza
    return { x: 1680 + (Math.random() * 120 - 60), y: 720 + (Math.random() * 120 - 60) };
  }, [checkCollision]);

  // Main 60 FPS autonomous roaming animation loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    // Verify initial spawn is in white area once collision mask loads
    const initialTarget = pickRandomWhiteAreaTarget();
    if (checkCollision(posRef.current.x, posRef.current.y, 24)) {
      posRef.current = { x: initialTarget.x, y: initialTarget.y };
      setRenderPos({ x: initialTarget.x, y: initialTarget.y });
    }

    const wanderLoop = (currentTime: number) => {
      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      // Ensure Hop never stays stuck on a black blocked pixel
      if (checkCollision(posRef.current.x, posRef.current.y, 24)) {
        const safeSpot = pickRandomWhiteAreaTarget();
        posRef.current = { x: safeSpot.x, y: safeSpot.y };
        setRenderPos({ x: safeSpot.x, y: safeSpot.y });
        stateRef.current = 'IDLE';
        idleTimerRef.current = 1.0;
        setIsHopping(false);
        targetPosRef.current = null;
      }

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
          // Move towards target at a pleasant hopping speed
          const speed = 70; // pixels per second
          const moveDist = Math.min(speed * delta, distance);
          const nextX = posRef.current.x + (dx / distance) * moveDist;
          const nextY = posRef.current.y + (dy / distance) * moveDist;

          // Check if path is strictly in white area (not blocked)
          if (!checkCollision(nextX, nextY, 24)) {
            posRef.current = { x: nextX, y: nextY };
            setFacingRight(dx > 0);
            hopCycleRef.current += delta * 9;
          } else {
            // Blocked by obstacle or black zone -> pause and pick a new target
            stateRef.current = 'IDLE';
            idleTimerRef.current = 0.8;
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

  // Handle image error fallback sequence (/assets/hop.webp -> /assets/hop.gif -> /hop.png -> fallback icon)
  const handleImageError = () => {
    if (imageSrc === '/assets/hop.webp') {
      setImageSrc('/assets/hop.gif');
    } else if (imageSrc === '/assets/hop.gif') {
      setImageSrc('/hop.webp');
    } else if (imageSrc === '/hop.webp') {
      setImageSrc('/hop.png');
    } else {
      setImageError(true);
    }
  };

  const bubbleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);
    };
  }, []);

  const handleHopClick = () => {
    const randomMsg = HOP_MESSAGES[Math.floor(Math.random() * HOP_MESSAGES.length)];
    setBubbleText(randomMsg);
    if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);
    bubbleTimeoutRef.current = setTimeout(() => setBubbleText(null), 3500);

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
      {/* Minimalist Dark Speech Bubble */}
      {bubbleText && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-md text-white text-[10px] font-mono font-medium tracking-wide px-3 py-1 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.8)] whitespace-nowrap border border-white/15 animate-bounce">
          {bubbleText}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-black/90 rotate-45 border-r border-b border-white/15" />
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
