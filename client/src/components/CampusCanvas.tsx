import React, { useEffect, useRef } from 'react';
import { MAP_DIMENSIONS } from '../utils/mapUtils';

interface Player {
  id: string;
  x: number;
  y: number;
  color: string;
}

interface CampusCanvasProps {
  myPos: { x: number, y: number };
  otherPlayers: Player[];
  gpsEnabled: boolean;
  onManualMove?: (x: number, y: number) => void;
}

export const CampusCanvas: React.FC<CampusCanvasProps> = ({ myPos, otherPlayers, gpsEnabled, onManualMove }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Resize canvas to fill screen
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Handle keyboard movement if GPS is disabled
  useEffect(() => {
    if (gpsEnabled || !onManualMove) return;

    // Movement state
    const keys = { w: false, a: false, s: false, d: false, ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };
    let animationFrameId: number;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key in keys) keys[e.key as keyof typeof keys] = true;
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key in keys) keys[e.key as keyof typeof keys] = false;
    };

    const updatePosition = () => {
      const SPEED = 6;
      let dx = 0;
      let dy = 0;
      
      if (keys.w || keys.ArrowUp) dy -= SPEED;
      if (keys.s || keys.ArrowDown) dy += SPEED;
      if (keys.a || keys.ArrowLeft) dx -= SPEED;
      if (keys.d || keys.ArrowRight) dx += SPEED;
      
      if (dx !== 0 || dy !== 0) {
        // We use functional state update pattern indirectly by calculating next pos 
        // But since this is a loop, we rely on the parent component's latest myPos.
        // Actually, for a smooth loop, it's better to let the parent handle the delta.
        onManualMove(dx, dy); 
      }
      animationFrameId = requestAnimationFrame(updatePosition);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    animationFrameId = requestAnimationFrame(updatePosition);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [gpsEnabled, onManualMove]);

  // Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Camera Offset: keep myPos at the center of the canvas
      const cameraX = myPos.x - canvas.width / 2;
      const cameraY = myPos.y - canvas.height / 2;

      ctx.save();
      // Translate the context so everything drawn is shifted by the camera offset
      ctx.translate(-cameraX, -cameraY);

      // --- Draw Temporary Background (Grid) ---
      // Fill base background
      ctx.fillStyle = '#0a0a0a'; // Very dark gray
      ctx.fillRect(0, 0, MAP_DIMENSIONS.width, MAP_DIMENSIONS.height);

      // Draw Grid lines
      ctx.strokeStyle = '#1f2937'; // Lighter gray for lines
      ctx.lineWidth = 2;
      const GRID_SIZE = 100;
      
      ctx.beginPath();
      for (let x = 0; x <= MAP_DIMENSIONS.width; x += GRID_SIZE) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, MAP_DIMENSIONS.height);
      }
      for (let y = 0; y <= MAP_DIMENSIONS.height; y += GRID_SIZE) {
        ctx.moveTo(0, y);
        ctx.lineTo(MAP_DIMENSIONS.width, y);
      }
      ctx.stroke();

      // Draw boundary border (Electric Pink)
      ctx.strokeStyle = '#ff007f'; 
      ctx.lineWidth = 4;
      ctx.strokeRect(0, 0, MAP_DIMENSIONS.width, MAP_DIMENSIONS.height);

      // --- Draw Other Players ---
      otherPlayers.forEach(player => {
        ctx.beginPath();
        ctx.arc(player.x, player.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = player.color || '#3b82f6';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // --- Draw Me (Local Player) ---
      ctx.beginPath();
      ctx.arc(myPos.x, myPos.y, 12, 0, Math.PI * 2);
      ctx.fillStyle = '#ff007f'; 
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw a "pulse" ring around me
      const time = Date.now() / 500;
      const pulseRadius = 12 + Math.abs(Math.sin(time)) * 8;
      ctx.beginPath();
      ctx.arc(myPos.x, myPos.y, pulseRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 0, 127, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [myPos, otherPlayers]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full bg-black touch-none"
    />
  );
};
