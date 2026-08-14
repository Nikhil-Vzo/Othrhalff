import React, { useRef, useEffect, useState } from 'react';
import { Play, Volume2, VolumeX, Loader2 } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  onDoubleTap?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, poster, onDoubleTap }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const lastTap = useRef(0);

  // 1. Observer only tracks visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsInView(entry.isIntersecting);
        });
      },
      { threshold: 0.5 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  // 2. Autoplay/Pause when video element mounts/unmounts or visibility changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isInView) {
      video.play().then(() => {
        setIsPlaying(true);
        setShowPlayIcon(false);
      }).catch(() => {
        setIsPlaying(false);
      });
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isInView]);

  // 3. Track playback progress and loading events (re-attached when node mounts)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isInView) return;

    const handleTimeUpdate = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => setIsLoading(false);
    const handleLoadedData = () => setIsLoading(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('loadeddata', handleLoadedData);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('loadeddata', handleLoadedData);
    };
  }, [isInView]);

  const handleTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastTap.current < 300) {
      // Double-tap triggered (like)
      onDoubleTap?.();
    } else {
      // Single tap toggle play / pause
      if (videoRef.current) {
        if (videoRef.current.paused) {
          videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
          setShowPlayIcon(false);
        } else {
          videoRef.current.pause();
          setIsPlaying(false);
          setShowPlayIcon(true);
        }
      }
    }
    lastTap.current = now;
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[4/5] sm:aspect-video max-h-[460px] bg-black/90 rounded-2xl overflow-hidden cursor-pointer select-none border border-white/10 shadow-2xl group"
      onClick={handleTap}
    >
      {/* 🪄 DOM SWAPPING: Heavy <video> only exists in RAM when visible (Saves iOS Safari RAM) */}
      {isInView ? (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          className="w-full h-full object-cover"
          loop
          muted={isMuted}
          playsInline
          webkit-playsinline="true"
          preload="metadata"
          autoPlay
        />
      ) : (
        poster ? (
          <img src={poster} alt="Video preview" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-black/80 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
              <Play className="w-6 h-6 text-white/50 fill-white/40 ml-0.5" />
            </div>
          </div>
        )
      )}

      {/* Loading Spinner */}
      {isLoading && isInView && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm pointer-events-none">
          <Loader2 className="w-8 h-8 text-neon animate-spin" />
        </div>
      )}

      {/* Paused Indicator Overlay */}
      {(!isPlaying || showPlayIcon) && !isLoading && isInView && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/25 pointer-events-none transition-opacity">
          <div className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
            <Play className="w-7 h-7 text-white fill-white ml-0.5" />
          </div>
        </div>
      )}

      {/* Sound Toggle Button */}
      {isInView && (
        <button
          onClick={toggleMute}
          aria-label={isMuted ? "Unmute video" : "Mute video"}
          className="absolute top-3 right-3 p-2 rounded-full bg-black/50 hover:bg-black/75 backdrop-blur-xl border border-white/15 text-white transition-all active:scale-90 z-20 shadow-lg"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-white/80" /> : <Volume2 className="w-4 h-4 text-neon" />}
        </button>
      )}

      {/* Subtle Bottom Progress Bar */}
      {isInView && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/15 pointer-events-none z-10">
          <div
            className="h-full bg-gradient-to-r from-neon to-pink-500 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};
