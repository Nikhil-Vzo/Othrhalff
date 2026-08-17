import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AvatarSprite, Direction } from './AvatarSprite';
import { PoliceNPC } from './PoliceNPC';
import { HopNPC } from './HopNPC';

export interface Player {
  id: string;
  userId?: string;
  x: number;
  y: number;
  color: string;
  direction?: Direction;
  isMoving?: boolean;
  sittingOn?: string | null;
  avatarId?: string;
  lastSeen?: number;
}

interface PlaygroundCanvasProps {
  localPlayerId: string;
  localSessionId: string;
  onPositionChange: (x: number, y: number, dir: Direction, moving: boolean) => void;
  remotePlayers: Player[];
  localPosition: { x: number; y: number };
  speechBubbles: Map<string, {text: string, timestamp: number}>;
  gpsEnabled?: boolean;
  avatarId?: string;
  onCollisionCheckerReady?: (checker: (x: number, y: number) => { x: number; y: number; isBlocked: boolean }) => void;
}

const POLICE_GUARDS = [
  { id: 'police-main-gate', x: 1280, y: 225, name: 'Campus Police 👮', warningText: 'Idhar Jana Allowed nahi hai!' },
  { id: 'police-east-stair', x: 2050, y: 310, name: 'Campus Guard 🚨', warningText: 'Idhar Jana Allowed nahi hai!' }
];

// ---------------------------------------------------------
// MAP SETTINGS
// ---------------------------------------------------------
const WORLD_WIDTH = 2560;
const WORLD_HEIGHT = 1440;

export const PlaygroundCanvas: React.FC<PlaygroundCanvasProps> = ({
  localPlayerId,
  localSessionId,
  onPositionChange,
  remotePlayers,
  localPosition,
  speechBubbles,
  gpsEnabled = false,
  avatarId = 'default',
  onCollisionCheckerReady
}) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const localAvatarRef = useRef<HTMLDivElement>(null);

  const keys = useRef<{ [key: string]: boolean }>({});

  const posRef = useRef(localPosition);
  const [localDir, setLocalDir] = useState<Direction>('down');
  const [localIsMoving, setLocalIsMoving] = useState(false);

  const dirRef = useRef<Direction>('down');
  const movingRef = useRef(false);

  // Virtual Floating Touch Joystick Refs & State
  const [joystickVisible, setJoystickVisible] = useState(false);
  const [joystickOrigin, setJoystickOrigin] = useState({ x: 0, y: 0 });
  const touchOriginRef = useRef<{ x: number; y: number } | null>(null);
  const touchCurrentRef = useRef<{ x: number; y: number } | null>(null);
  const joystickKnobRef = useRef<HTMLDivElement>(null);

  // COLLISION MASK ENGINE (Cached Uint8ClampedArray for instant zero-copy lookups)
  const maskCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const collisionPixelsRef = useRef<Uint8ClampedArray | null>(null);

  const checkPixelCollision = useCallback((x: number, y: number, size: number = 32) => {
    if (x < 0 || x > WORLD_WIDTH || y < 0 || y > WORLD_HEIGHT) return true;

    const guardCollisionRadius = 35;
    for (const guard of POLICE_GUARDS) {
      const dx = x - guard.x;
      const dy = y - (guard.y - 15);
      if (Math.sqrt(dx * dx + dy * dy) < guardCollisionRadius) return true;
    }

    if (!collisionPixelsRef.current) return false;

    const checkX = Math.round(x);
    const checkY = Math.round(y + size / 2);
    if (checkX < 0 || checkX >= WORLD_WIDTH || checkY < 0 || checkY >= WORLD_HEIGHT) return true;

    // Fast array index lookup (4 bytes per pixel: R, G, B, A)
    const index = (checkY * WORLD_WIDTH + checkX) * 4;
    return collisionPixelsRef.current[index] < 50;
  }, []);

  const findNearestWalkablePosition = useCallback((startX: number, startY: number) => {
    if (!checkPixelCollision(startX, startY)) {
      return { x: startX, y: startY, isBlocked: false };
    }

    for (let r = 5; r <= 120; r += 5) {
      for (let angle = 0; angle < 360; angle += 45) {
        const rad = (angle * Math.PI) / 180;
        const testX = Math.round(startX + r * Math.cos(rad));
        const testY = Math.round(startY + r * Math.sin(rad));
        if (!checkPixelCollision(testX, testY)) {
          return { x: testX, y: testY, isBlocked: true };
        }
      }
    }
    return { x: startX, y: startY, isBlocked: true };
  }, [checkPixelCollision]);

  useEffect(() => {
    // Load the hidden collision mask image
    const maskImg = new Image();
    maskImg.src = '/assets/collision-mask.png';
    maskImg.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = WORLD_WIDTH;
      canvas.height = WORLD_HEIGHT;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(maskImg, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
        maskCtxRef.current = ctx;
        try {
          const imageData = ctx.getImageData(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
          collisionPixelsRef.current = imageData.data;
          console.log("Collision mask pixels cached successfully!");
        } catch (e) {
          console.warn("Could not extract collision mask pixel buffer:", e);
        }
        if (onCollisionCheckerReady) {
          onCollisionCheckerReady(findNearestWalkablePosition);
        }
      }
    };
    maskImg.onerror = () => {
      console.warn("collision-mask.png not found. Collisions are disabled.");
      if (onCollisionCheckerReady) {
        onCollisionCheckerReady(findNearestWalkablePosition);
      }
    };
  }, [findNearestWalkablePosition, onCollisionCheckerReady]);

  useEffect(() => {
    posRef.current = localPosition;
  }, [localPosition]);

  // WASD Movement & Camera Panning Loop
  useEffect(() => {

    let animationFrameId: number;
    const isMobile = typeof window !== 'undefined' && (window.innerWidth < 768 || 'ontouchstart' in window);
    const speed = isMobile ? 1.5 : 1.3;
    const playerCollisionSize = 32;

    const handleKeyDown = (e: KeyboardEvent) => { 
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      keys.current[e.key.toLowerCase()] = true; 
    };
    const handleKeyUp = (e: KeyboardEvent) => { 
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      keys.current[e.key.toLowerCase()] = false; 
    };

    // Mobile Virtual Floating Touch Joystick Handlers
    const handleTouchStart = (e: TouchEvent) => {
      if ((e.target as HTMLElement)?.closest('button, a, input, textarea')) return;
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        touchOriginRef.current = { x: touch.clientX, y: touch.clientY };
        touchCurrentRef.current = { x: touch.clientX, y: touch.clientY };
        setJoystickOrigin({ x: touch.clientX, y: touch.clientY });
        setJoystickVisible(true);
        if (joystickKnobRef.current) {
          joystickKnobRef.current.style.transform = 'translate3d(0, 0, 0)';
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchOriginRef.current) return;
      e.preventDefault(); 
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        touchCurrentRef.current = { x: touch.clientX, y: touch.clientY };

        const diffX = touch.clientX - touchOriginRef.current.x;
        const diffY = touch.clientY - touchOriginRef.current.y;
        const dist = Math.hypot(diffX, diffY);
        const maxRadius = 38;
        const angle = Math.atan2(diffY, diffX);
        const clampedDist = Math.min(dist, maxRadius);
        const knobX = Math.cos(angle) * clampedDist;
        const knobY = Math.sin(angle) * clampedDist;

        if (joystickKnobRef.current) {
          joystickKnobRef.current.style.transform = `translate3d(${knobX}px, ${knobY}px, 0)`;
        }
      }
    };

    const handleTouchEnd = () => {
      touchOriginRef.current = null;
      touchCurrentRef.current = null;
      setJoystickVisible(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const viewportNode = viewportRef.current;
    if (viewportNode) {
      viewportNode.addEventListener('touchstart', handleTouchStart, { passive: false });
      viewportNode.addEventListener('touchmove', handleTouchMove, { passive: false });
      viewportNode.addEventListener('touchend', handleTouchEnd);
      viewportNode.addEventListener('touchcancel', handleTouchEnd);
    }

    let lastBroadcastTime = 0;

    const updateLoop = (timestamp: number) => {
      let dx = 0;
      let dy = 0;
      let newDir = dirRef.current;

      if (keys.current['w'] || keys.current['arrowup']) { dy -= speed; }
      if (keys.current['s'] || keys.current['arrowdown']) { dy += speed; }
      if (keys.current['a'] || keys.current['arrowleft']) { dx -= speed; }
      if (keys.current['d'] || keys.current['arrowright']) { dx += speed; }

      if (touchOriginRef.current && touchCurrentRef.current) {
        const diffX = touchCurrentRef.current.x - touchOriginRef.current.x;
        const diffY = touchCurrentRef.current.y - touchOriginRef.current.y;
        const dist = Math.hypot(diffX, diffY);
        const deadzone = 6;

        if (dist > deadzone) {
          const intensity = Math.min(1, (dist - deadzone) / 32);
          const angle = Math.atan2(diffY, diffX);
          dx += Math.cos(angle) * speed * intensity;
          dy += Math.sin(angle) * speed * intensity;
        }
      }

      if (dx !== 0 || dy !== 0) {
        if (Math.abs(dy) > Math.abs(dx)) {
          newDir = dy < 0 ? 'up' : 'down';
        } else {
          newDir = dx < 0 ? 'left' : 'right';
        }
      }

      const isCurrentlyMoving = (dx !== 0 || dy !== 0);

      if (newDir !== dirRef.current) {
        dirRef.current = newDir;
        setLocalDir(newDir);
      }
      if (isCurrentlyMoving !== movingRef.current) {
        movingRef.current = isCurrentlyMoving;
        setLocalIsMoving(isCurrentlyMoving);
      }

      if (isCurrentlyMoving) {
        let proposedX = posRef.current.x + dx;
        let proposedY = posRef.current.y + dy;

        if (!checkPixelCollision(proposedX, proposedY, playerCollisionSize)) {
          posRef.current = { x: proposedX, y: proposedY };
        } else if (dx !== 0 && !checkPixelCollision(posRef.current.x + dx, posRef.current.y, playerCollisionSize)) {
          posRef.current.x += dx;
        } else if (dy !== 0 && !checkPixelCollision(posRef.current.x, posRef.current.y + dy, playerCollisionSize)) {
          posRef.current.y += dy;
        }
      }

      if (viewportRef.current && worldRef.current) {
        const vw = viewportRef.current.clientWidth;
        const vh = viewportRef.current.clientHeight;
        const isMobileScreen = vw < 768;
        
        let targetX = posRef.current.x;
        let targetY = posRef.current.y;
        let zoom = isMobileScreen ? 1.05 : 1.5;

        const offsetX = (vw / 2) - (targetX * zoom);
        const offsetY = (vh / 2) - (targetY * zoom);
        
        worldRef.current.style.transformOrigin = '0 0';
        worldRef.current.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0) scale(${zoom})`;
      }

      if (localAvatarRef.current) {
        localAvatarRef.current.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0) scale(0.6)`;
      }

      const movementStateChanged = movingRef.current !== isCurrentlyMoving;
      if (movementStateChanged || (isCurrentlyMoving && (timestamp - lastBroadcastTime > 100))) {
        onPositionChange(posRef.current.x, posRef.current.y, dirRef.current, isCurrentlyMoving);
        lastBroadcastTime = timestamp;
      }

      animationFrameId = requestAnimationFrame(updateLoop);
    };

    animationFrameId = requestAnimationFrame(updateLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (viewportNode) {
        viewportNode.removeEventListener('touchstart', handleTouchStart);
        viewportNode.removeEventListener('touchmove', handleTouchMove);
        viewportNode.removeEventListener('touchend', handleTouchEnd);
        viewportNode.removeEventListener('touchcancel', handleTouchEnd);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, [onPositionChange]);

  return (
    <div ref={viewportRef} className="relative w-full h-full bg-black overflow-hidden select-none">

      {/* THE WORLD - This pans around underneath the centered camera */}
      <div
        ref={worldRef}
        className="absolute top-0 left-0"
        style={{
          width: `${WORLD_WIDTH}px`,
          height: `${WORLD_HEIGHT}px`,
          backgroundImage: `url('/assets/campus-map.png')`,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          imageRendering: 'pixelated',
          willChange: 'transform'
        }}
      >
        {/* Crisp Campus Map Background Layer */}
        <img
          src="/assets/campus-map.png"
          alt="Campus Map"
          className="absolute inset-0 w-full h-full pointer-events-none select-none z-0"
          style={{ imageRendering: 'pixelated', width: `${WORLD_WIDTH}px`, height: `${WORLD_HEIGHT}px` }}
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            if (target.src.includes('campus-map.png')) {
              target.src = '/assets/campus map.png';
            } else if (target.src.includes('campus map.png')) {
              target.src = '/assets/campus map.jpeg';
            }
          }}
        />
        
        {/* Autonomous Roaming Hop Pet (wonders within the white walkable area) */}
        <HopNPC
          checkCollision={checkPixelCollision}
          playerX={posRef.current.x}
          playerY={posRef.current.y}
        />

        {/* Campus Police NPCs */}
        {POLICE_GUARDS.map(guard => (
          <PoliceNPC
            key={guard.id}
            x={guard.x}
            y={guard.y}
            playerX={posRef.current.x}
            playerY={posRef.current.y}
            name={guard.name}
            warningText={guard.warningText}
          />
        ))}

        {/* Remote Players (Excludes local player's current or previous sessions) */}
        {remotePlayers
          .filter(p => p.id !== localSessionId && (!p.userId || p.userId !== localPlayerId))
          .map((player) => {
           // Calculate distance
           const dx = player.x - posRef.current.x;
           const dy = player.y - posRef.current.y;
           const dist = Math.sqrt(dx*dx + dy*dy);
           // Proximity threshold for reading bubbles (approx 400px radius)
           const canReadBubble = dist < 400;
           const bubble = speechBubbles.get(player.id); // player.id is the sessionId

           return (
             <AvatarSprite 
               key={player.id}
               x={player.x}
               y={player.y}
               direction={player.direction || 'down'}
               isMoving={player.isMoving || false}
               color={player.color}
               username={player.id.substring(0, 5)}
               speechBubble={canReadBubble ? bubble?.text : undefined}
               avatarId={player.avatarId || 'default'}
             />
           );
        })}
        
        {/* Local Player */}
        <AvatarSprite 
           ref={localAvatarRef}
           x={posRef.current.x}
           y={posRef.current.y}
           direction={localDir}
           isMoving={localIsMoving}
           isLocal={true}
           speechBubble={speechBubbles.get(localSessionId)?.text}
           isGpsActive={gpsEnabled}
           avatarId={avatarId}
        />

      </div>

      {/* Sleek Minimalist Virtual Floating Touch Joystick */}
      {joystickVisible && (
        <div 
          className="fixed z-40 pointer-events-none -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full bg-white/5 backdrop-blur-md border border-white/20 shadow-2xl flex items-center justify-center animate-in fade-in duration-100"
          style={{ left: `${joystickOrigin.x}px`, top: `${joystickOrigin.y}px` }}
        >
          {/* Subtle inner dial */}
          <div className="w-14 h-14 rounded-full border border-white/10" />

          {/* Minimalist Thumbstick Knob */}
          <div 
            ref={joystickKnobRef}
            className="absolute w-12 h-12 rounded-full bg-white/20 backdrop-blur-lg border border-white/40 shadow-lg flex items-center justify-center will-change-transform"
            style={{ transform: 'translate3d(0, 0, 0)' }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-white shadow-sm opacity-90" />
          </div>
        </div>
      )}
    </div>
  );
};
