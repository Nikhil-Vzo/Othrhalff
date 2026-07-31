import React, { useEffect, useRef, useState } from 'react';
import { AvatarSprite, Direction } from './AvatarSprite';

export interface Player {
  id: string;
  x: number;
  y: number;
  color: string;
  direction?: Direction;
  isMoving?: boolean;
}

interface PlaygroundCanvasProps {
  localPlayerId: string;
  onPositionChange: (x: number, y: number, dir: Direction, moving: boolean) => void;
  remotePlayers: Player[];
  gpsEnabled: boolean;
  localPosition: { x: number; y: number };
}

// ---------------------------------------------------------
// MAP SETTINGS
// ---------------------------------------------------------
const WORLD_WIDTH = 2560;
const WORLD_HEIGHT = 1440;

export const PlaygroundCanvas: React.FC<PlaygroundCanvasProps> = ({
  localPlayerId,
  onPositionChange,
  remotePlayers,
  gpsEnabled,
  localPosition
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

  // COLLISION MASK ENGINE
  const maskCtxRef = useRef<CanvasRenderingContext2D | null>(null);

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
      }
    };
    maskImg.onerror = () => {
      console.warn("collision-mask.png not found. Collisions are disabled.");
    };
  }, []);

  useEffect(() => {
    posRef.current = localPosition;
  }, [localPosition]);

  // WASD Movement & Camera Panning Loop
  useEffect(() => {
    if (gpsEnabled) {
      setLocalIsMoving(false);
      return;
    }
    
    let animationFrameId: number;
    const speed = 0.8; 
    const playerCollisionSize = 32; 

    const handleKeyDown = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; };
    
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
        const zoom = 1.6; // Increased zoom factor
        const offsetX = (vw / 2) - (posRef.current.x * zoom);
        const offsetY = (vh / 2) - (posRef.current.y * zoom);
        worldRef.current.style.transformOrigin = '0 0';
        worldRef.current.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${zoom})`;
      }

      // Throttle network broadcast — only broadcast while moving or when stopping
      const movementStateChanged = movingRef.current !== isCurrentlyMoving;
      if ((isCurrentlyMoving || movementStateChanged) && (timestamp - lastBroadcastTime > 100)) {
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
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, [gpsEnabled, onPositionChange]);

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
        
        {/* Remote Players */}
        {remotePlayers.map((player) => (
           <AvatarSprite 
             key={player.id}
             x={player.x}
             y={player.y}
             direction={player.direction || 'down'}
             isMoving={player.isMoving || false}
             color={player.color}
             username={player.id.substring(0, 5)}
           />
        ))}
        
        {/* Local Player */}
        <AvatarSprite 
           x={posRef.current.x}
           y={posRef.current.y}
           direction={localDir}
           isMoving={localIsMoving}
           isLocal={true}
        />

      </div>
    </div>
  );
};
