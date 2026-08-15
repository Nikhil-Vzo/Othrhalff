import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Loader2 } from 'lucide-react';

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
  const lastTap = useRef(0);

  // 1. Viewport observer for auto-play / auto-pause & DOM swapping
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

  // 2. Play/Pause trigger when mounting/unmounting or entering/leaving viewport
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isInView) {
      video.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isInView]);

  // 3. Playback progress and loading state listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isInView) return;

    const handleTimeUpdate = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
    };
    const handlePause = () => setIsPlaying(false);
    const handleLoadedData = () => setIsLoading(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('pause', handlePause);
    video.addEventListener('loadeddata', handleLoadedData);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('loadeddata', handleLoadedData);
    };
  }, [isInView]);

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastTap.current < 300) {
      // Double tap triggered
      onDoubleTap?.();
    } else {
      if (videoRef.current) {
        if (videoRef.current.paused) {
          videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        } else {
          videoRef.current.pause();
          setIsPlaying(false);
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
      className="relative w-full max-h-[500px] min-h-[220px] bg-black rounded-2xl overflow-hidden cursor-pointer select-none border border-white/10 shadow-2xl flex items-center justify-center group"
      onClick={togglePlayPause}
    >
      {/* 🪄 DOM SWAPPING: Uses object-contain so video is NEVER cropped out */}
      {isInView ? (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          className="w-full max-h-[500px] object-contain rounded-2xl"
          loop
          muted={isMuted}
          playsInline
          webkit-playsinline="true"
          preload="metadata"
          autoPlay
        />
      ) : (
        poster ? (
          <img src={poster} alt="Video preview" className="w-full max-h-[500px] object-contain rounded-2xl" />
        ) : (
          <div className="w-full h-64 bg-black flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
              <Play className="w-6 h-6 text-white/50 fill-white/40 ml-0.5" />
            </div>
          </div>
        )
      )}

      {/* Loading Spinner */}
      {isLoading && isInView && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none z-10">
          <Loader2 className="w-8 h-8 text-neon animate-spin" />
        </div>
      )}

      {/* Center Play Button Overlay when Paused */}
      {!isPlaying && !isLoading && isInView && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none z-10">
          <div className="w-14 h-14 rounded-full bg-black/70 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
            <Play className="w-7 h-7 text-white fill-white ml-0.5" />
          </div>
        </div>
      )}

      {/* Bottom Floating Control Pill (Play/Pause + Mute) */}
      {isInView && (
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
          {/* Play / Pause Toggle Button */}
          <button
            onClick={togglePlayPause}
            aria-label={isPlaying ? "Pause video" : "Play video"}
            className="p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-xl border border-white/20 text-white transition-all active:scale-95 pointer-events-auto shadow-lg"
          >
            {isPlaying ? <Pause className="w-4 h-4 text-white fill-white" /> : <Play className="w-4 h-4 text-white fill-white ml-0.5" />}
          </button>

          {/* Sound Toggle Button */}
          <button
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute video" : "Mute video"}
            className="p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-xl border border-white/20 text-white transition-all active:scale-95 pointer-events-auto shadow-lg"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-white/80" /> : <Volume2 className="w-4 h-4 text-neon" />}
          </button>
        </div>
      )}

      {/* Bottom Progress Bar */}
      {isInView && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 pointer-events-none z-30">
          <div
            className="h-full bg-gradient-to-r from-neon to-pink-500 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};
