import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AvatarSprite, Direction } from './AvatarSprite';

export interface Player {
  id: string;
  x: number;
  y: number;
  color: string;
  direction?: Direction;
  isMoving?: boolean;
  sittingOn?: string | null;
}

interface PlaygroundCanvasProps {
  localPlayerId: string;
  localSessionId: string;
  onPositionChange: (x: number, y: number, dir: Direction, moving: boolean, sittingOn?: string | null) => void;
  remotePlayers: Player[];
  localPosition: { x: number; y: number };
  speechBubbles: Map<string, {text: string, timestamp: number}>;
  sitState: 'IDLE' | 'SITTING';
  activeBench: string | null;
  onSitRequest: (benchId: string, benchX: number, benchY: number) => void;
  gpsEnabled?: boolean;
  onCollisionCheckerReady?: (checker: (x: number, y: number) => { x: number; y: number; isBlocked: boolean }) => void;
}

const BENCH_ZONES = [
  // Top row near trees
  { id: 'bench-top-1', x: 1420, y: 280, radius: 80 },
  { id: 'bench-top-2', x: 1530, y: 280, radius: 80 },
  { id: 'bench-top-3', x: 1640, y: 280, radius: 80 },
  { id: 'bench-top-4', x: 1750, y: 280, radius: 80 },
  
  // Center Plaza
  { id: 'bench-plaza-tl', x: 1540, y: 770, radius: 80 },
  { id: 'bench-plaza-tr', x: 1950, y: 770, radius: 80 },
  { id: 'bench-plaza-c',  x: 1740, y: 930, radius: 80 },
  { id: 'bench-plaza-bl', x: 1540, y: 1110, radius: 80 },
  { id: 'bench-plaza-bc', x: 1760, y: 1240, radius: 80 },
  { id: 'bench-plaza-br', x: 1890, y: 1110, radius: 80 }
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
  sitState,
  activeBench,
  onSitRequest,
  gpsEnabled = false,
  onCollisionCheckerReady
}) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);

  const keys = useRef<{ [key: string]: boolean }>({});

  const posRef = useRef(localPosition);
  const [localDir, setLocalDir] = useState<Direction>('down');
  const [localIsMoving, setLocalIsMoving] = useState(false);

  const dirRef = useRef<Direction>('down');
  const movingRef = useRef(false);

  // Mobile Touch Refs
  const touchActiveRef = useRef(false);
  const touchPosRef = useRef({ x: 0, y: 0 });

  const activeBenchRef = useRef(activeBench);
  const lastActiveBenchRef = useRef<string | null>(null);
  
  useEffect(() => { 
    activeBenchRef.current = activeBench; 
    if (activeBench) {
      lastActiveBenchRef.current = activeBench;
    }
  }, [activeBench]);

  // COLLISION MASK ENGINE
  const maskCtxRef = useRef<CanvasRenderingContext2D | null>(null);

  const checkPixelCollision = useCallback((x: number, y: number, size: number = 32) => {
    if (x < 0 || x > WORLD_WIDTH || y < 0 || y > WORLD_HEIGHT) return true;

    const benchCollisionRadius = 30;
    for (const zone of BENCH_ZONES) {
      if (zone.id === activeBenchRef.current) continue;
      const dx = x - zone.x;
      const dy = y - (zone.y + 10);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < benchCollisionRadius) return true;
    }

    if (!maskCtxRef.current) return false;

    try {
      const pixel = maskCtxRef.current.getImageData(Math.round(x), Math.round(y + size / 2), 1, 1).data;
      return pixel[0] < 50;
    } catch (e) {
      return false;
    }
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
        console.log("Collision mask loaded successfully!");
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
    const speed = 0.8;
    const playerCollisionSize = 32;


    const handleKeyDown = (e: KeyboardEvent) => { 
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      keys.current[e.key.toLowerCase()] = true; 

      // Handle interaction key (SPACE) for benches
      if (e.code === 'Space' && sitState === 'IDLE') {
        const nearZone = BENCH_ZONES.find(zone => {
          const dx = posRef.current.x - zone.x;
          const dy = posRef.current.y - zone.y;
          return Math.sqrt(dx*dx + dy*dy) < zone.radius;
        });
        if (nearZone) {
          onSitRequest(nearZone.id, nearZone.x, nearZone.y);
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => { 
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      keys.current[e.key.toLowerCase()] = false; 
    };
    

    // Mobile Touch Event Handlers
    const handleTouchStart = (e: TouchEvent) => {
      touchActiveRef.current = true;
      if (e.touches.length > 0) {
        touchPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchActiveRef.current) return;
      e.preventDefault(); // Stop mobile browser scrolling/pull-to-refresh
      if (e.touches.length > 0) {
        touchPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const handleTouchEnd = () => {
      touchActiveRef.current = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const viewportNode = viewportRef.current;
    if (viewportNode) {
      viewportNode.addEventListener('touchstart', handleTouchStart, { passive: false });
      viewportNode.addEventListener('touchmove', handleTouchMove, { passive: false });
      viewportNode.addEventListener('touchend', handleTouchEnd);
    }

    let lastBroadcastTime = 0;

    // Pixel Collision Checker
    const checkPixelCollision = (x: number, y: number, size: number) => {
      // Hard boundary check
      if (x < 0 || x > WORLD_WIDTH || y < 0 || y > WORLD_HEIGHT) return true;

      // Check Bench Collision
      const benchCollisionRadius = 30; // Solid physics core
      for (const zone of BENCH_ZONES) {
        if (zone.id === activeBenchRef.current) continue; // Allow standing up from current bench
        
        const dx = x - zone.x;
        const dy = y - (zone.y + 10); // Center of physical bench block
        const dist = Math.sqrt(dx*dx + dy*dy);

        // If they just stood up, they are still inside the bench radius. 
        // We let them walk OUT, and lock the wall behind them only once they are fully clear.
        if (zone.id === lastActiveBenchRef.current) {
          if (dist > benchCollisionRadius + 2) {
            lastActiveBenchRef.current = null; // They are out! Clear it.
          } else {
            continue; // Still inside, let them move freely
          }
        }

        if (dist < benchCollisionRadius) {
          return true; // Hit a bench!
        }
      }


      // If mask isn't loaded, don't block
      if (!maskCtxRef.current) return false;

      try {
        // We check the pixel exactly at the character's feet (y + size/2)
        const pixel = maskCtxRef.current.getImageData(Math.round(x), Math.round(y + size / 2), 1, 1).data;
        // pixel is [R, G, B, A]. Black is [0, 0, 0, 255].
        // If the red channel is very dark (e.g., < 50), we consider it a solid wall.
        if (pixel[0] < 50) {
          return true; // Collision!
        }
        return false;
      } catch (e) {
        return false;
      }
    };

    const updateLoop = (timestamp: number) => {
      let dx = 0;
      let dy = 0;
      let newDir = dirRef.current;

      // Keyboard input
      if (keys.current['w'] || keys.current['arrowup']) { dy -= speed; }
      if (keys.current['s'] || keys.current['arrowdown']) { dy += speed; }
      if (keys.current['a'] || keys.current['arrowleft']) { dx -= speed; }
      if (keys.current['d'] || keys.current['arrowright']) { dx += speed; }

      // Mobile Touch input
      if (touchActiveRef.current && viewportRef.current) {
        const vw = viewportRef.current.clientWidth;
        const vh = viewportRef.current.clientHeight;
        const deltaX = touchPosRef.current.x - (vw / 2);
        const deltaY = touchPosRef.current.y - (vh / 2);

        // 30px deadzone so tapping the center doesn't cause jitters
        if (Math.abs(deltaX) > 30) dx += deltaX > 0 ? speed : -speed;
        if (Math.abs(deltaY) > 30) dy += deltaY > 0 ? speed : -speed;
      }

      // Determine direction (favor Y axis if angle is steep)
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

        // WALL SLIDING LOGIC using Pixel Collisions
        if (!checkPixelCollision(proposedX, proposedY, playerCollisionSize)) {
          posRef.current = { x: proposedX, y: proposedY };
        } else if (dx !== 0 && !checkPixelCollision(posRef.current.x + dx, posRef.current.y, playerCollisionSize)) {
          posRef.current.x += dx;
        } else if (dy !== 0 && !checkPixelCollision(posRef.current.x, posRef.current.y + dy, playerCollisionSize)) {
          posRef.current.y += dy;
        }
      }

      // CAMERA PANNING LOGIC
      if (viewportRef.current && worldRef.current) {
        const vw = viewportRef.current.clientWidth;
        const vh = viewportRef.current.clientHeight;
        
        // Find interaction target if one exists
        const targetZone = activeBench ? BENCH_ZONES.find(z => z.id === activeBench) : null;
        
        let targetX = posRef.current.x;
        let targetY = posRef.current.y;
        let zoom = 1.6;
        
        if (targetZone && sitState === 'SITTING') {
          targetX = targetZone.x;
          targetY = targetZone.y;
          zoom = 2.5; // Zoom in during bench interaction
        }

        const offsetX = (vw / 2) - (targetX * zoom);
        const offsetY = (vh / 2) - (targetY * zoom);
        
        worldRef.current.style.transformOrigin = '0 0';
        worldRef.current.style.transition = 'transform 0.5s ease-out'; // Smooth camera moves
        worldRef.current.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${zoom})`;
      }

      // Throttle network broadcast — only broadcast while moving or when stopping
      const movementStateChanged = movingRef.current !== isCurrentlyMoving;
      if ((isCurrentlyMoving || movementStateChanged) && (timestamp - lastBroadcastTime > 100)) {
        onPositionChange(posRef.current.x, posRef.current.y, dirRef.current, isCurrentlyMoving, activeBenchRef.current);
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
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, [onPositionChange, onSitRequest, sitState]);

  return (
    <div ref={viewportRef} className="relative w-full h-full bg-black overflow-hidden">

      {/* THE WORLD - This pans around underneath the centered camera */}
      <div
        ref={worldRef}
        className="absolute top-0 left-0"
        style={{
          width: `${WORLD_WIDTH}px`,
          height: `${WORLD_HEIGHT}px`,
          backgroundImage: `url('/assets/campus map.png')`,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          imageRendering: 'pixelated',
          willChange: 'transform'
        }}
      >

        
        {/* Render Zones */}
        {BENCH_ZONES.map(zone => {
          const dx = posRef.current.x - zone.x;
          const dy = posRef.current.y - zone.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          const isNear = dist < zone.radius;

          return (
            <div key={zone.id} className="absolute z-20 pointer-events-none" style={{ transform: `translate(${zone.x}px, ${zone.y}px)` }}>
              {/* Bench Graphic */}
              <div className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center">
                <div className="relative pointer-events-none drop-shadow-2xl">
                  <img src="/api/bench" alt="Bench" className="w-32 h-auto image-rendering-pixelated drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]" />
                  {/* Soft glow for interactivity */}
                  <div className="absolute inset-0 bg-white/5 rounded-sm animate-pulse blur-[5px] -z-10"></div>
                </div>
                
                {isNear && sitState === 'IDLE' && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onSitRequest(zone.id, zone.x, zone.y); }}
                    className="absolute -top-12 px-3 py-1 bg-black/80 text-white text-xs font-bold rounded-full border border-gray-400 whitespace-nowrap shadow-lg animate-bounce pointer-events-auto cursor-pointer hover:bg-gray-800 transition-colors"
                  >
                    Press SPACE or Click to Sit
                  </button>
                )}
              </div>
            </div>
          );
        })}
        
        {/* Remote Players */}
        {remotePlayers.map((player) => {
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
               isSitting={!!player.sittingOn}
             />
           );
        })}
        
        {/* Local Player */}
        <AvatarSprite 
           x={posRef.current.x}
           y={posRef.current.y}
           direction={localDir}
           isMoving={localIsMoving}
           isLocal={true}
           speechBubble={speechBubbles.get(localSessionId)?.text}
           isSitting={sitState === 'SITTING'}
           isGpsActive={gpsEnabled}
        />

      </div>
    </div>
  );
};
