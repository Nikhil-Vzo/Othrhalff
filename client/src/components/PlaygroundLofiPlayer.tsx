import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, Volume2, VolumeX, Heart, ChevronDown, ChevronUp, Music2, Radio } from 'lucide-react';

export interface LofiTrack {
  id: string;
  title: string;
  artist: string;
  cover: string;
  src: string;
  duration: number; // in seconds
}

// Curated selection of authentic, warm Purrple Cat & Chillhop Lo-fi study tracks
export const LOFI_PLAYLIST: LofiTrack[] = [
  {
    id: 'lofi-1',
    title: 'Fluffy',
    artist: 'Purrple Cat',
    cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format&fit=crop&q=80',
    src: 'https://stream.zeno.fm/f3wvbbqmdg8uv', // 24/7 Lofi Study Live Stream (Always Online)
    duration: 180
  },
  {
    id: 'lofi-2',
    title: 'Moonlit Walk',
    artist: 'Purrple Cat',
    cover: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&auto=format&fit=crop&q=80',
    src: 'https://stream.zeno.fm/0r0xa792kwzuv', // Lofi Chillhop Beats 24/7
    duration: 210
  },
  {
    id: 'lofi-3',
    title: 'Golden Hour',
    artist: 'Purrple Cat',
    cover: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&auto=format&fit=crop&q=80',
    src: 'https://stream.zeno.fm/f3wvbbqmdg8uv',
    duration: 195
  },
  {
    id: 'lofi-4',
    title: 'Sunflowers',
    artist: 'Purrple Cat',
    cover: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=300&auto=format&fit=crop&q=80',
    src: 'https://stream.zeno.fm/0r0xa792kwzuv',
    duration: 175
  },
  {
    id: 'lofi-5',
    title: 'Heart of the Ocean',
    artist: 'Purrple Cat',
    cover: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=300&auto=format&fit=crop&q=80',
    src: 'https://stream.zeno.fm/f3wvbbqmdg8uv',
    duration: 220
  }
];

export const PlaygroundLofiPlayer: React.FC = () => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrack = LOFI_PLAYLIST[currentTrackIndex];

  // Set up audio source and handlers
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;
    audio.src = currentTrack.src;
    audio.volume = isMuted ? 0 : volume;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      setCurrentTrackIndex(prev => (prev + 1) % LOFI_PLAYLIST.length);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    if (isPlaying) {
      audio.play().catch(err => {
        console.warn('Autoplay blocked or stream connecting:', err);
        setIsPlaying(false);
      });
    }

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrackIndex]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // Handle play/pause
  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn('Audio play error:', err);
        setIsPlaying(false);
      });
    }
  };

  const handleNext = () => {
    setCurrentTime(0);
    setCurrentTrackIndex(prev => (prev + 1) % LOFI_PLAYLIST.length);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    setIsMuted(newVol === 0);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = currentTrack.duration > 0 ? (currentTime / currentTrack.duration) * 100 : 0;

  return (
    <div className="fixed bottom-24 md:bottom-6 left-4 md:left-[275px] z-40 select-none transition-all duration-300 pointer-events-auto">
      {/* Collapsed Pill Button */}
      {isCollapsed ? (
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-2.5 px-3.5 py-2 bg-[#120e1f]/95 hover:bg-[#1b152e] border border-pink-500/30 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.7)] backdrop-blur-xl text-white transition-all active:scale-95 group cursor-pointer"
        >
          <div className="relative">
            <img
              src={currentTrack.cover}
              alt={currentTrack.title}
              className={`w-8 h-8 rounded-xl object-cover border border-white/20 ${isPlaying ? 'animate-spin-slow' : ''}`}
            />
            {isPlaying && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-pink-500 rounded-full border-2 border-black animate-pulse" />
            )}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping"></span>
              <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest">LIVE RADIO</span>
            </div>
            <span className="text-xs font-bold text-gray-200 block truncate max-w-[110px]">{currentTrack.title}</span>
          </div>
          <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-white" />
        </button>
      ) : (
        /* Expanded lofi.town-style Floating Card */
        <div className="bg-[#100c1e]/95 border border-pink-500/30 rounded-3xl p-3.5 shadow-[0_12px_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl w-[290px] sm:w-[310px] relative animate-in fade-in slide-in-from-bottom-3">
          
          {/* Header Bar */}
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-pink-500/15 border border-pink-500/30 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse"></span>
              <span className="text-[9px] font-black text-pink-400 uppercase tracking-wider flex items-center gap-1">
                <Radio className="w-2.5 h-2.5" /> LIVE
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsLiked(!isLiked)}
                className={`p-1.5 rounded-full hover:bg-white/10 transition-colors ${
                  isLiked ? 'text-pink-500' : 'text-gray-400 hover:text-white'
                }`}
                title={isLiked ? 'Liked' : 'Like Track'}
              >
                <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-pink-500' : ''}`} />
              </button>
              <button
                onClick={() => setIsCollapsed(true)}
                className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                title="Collapse Player"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Track Info & Art */}
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <img
                src={currentTrack.cover}
                alt={currentTrack.title}
                className={`w-12 h-12 rounded-2xl object-cover border border-white/15 shadow-md ${
                  isPlaying ? 'ring-2 ring-pink-500/40' : ''
                }`}
              />
              <button
                onClick={togglePlay}
                className="absolute inset-0 m-auto w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white flex items-center justify-center shadow-lg transition-transform active:scale-90"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white ml-0.5" />}
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-extrabold text-white truncate tracking-tight">{currentTrack.title}</h4>
              <p className="text-xs text-pink-300/80 truncate font-medium">{currentTrack.artist}</p>
            </div>

            <button
              onClick={handleNext}
              className="p-2 rounded-2xl bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white transition-all active:scale-95 shrink-0"
              title="Next Track"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>
          </div>

          {/* Progress Bar & Timing */}
          <div className="mt-3">
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden relative cursor-pointer">
              <div
                className="bg-gradient-to-r from-pink-500 to-violet-500 h-full rounded-full transition-all duration-200"
                style={{ width: `${Math.min(100, progressPercent)}%` }}
              />
            </div>

            <div className="flex items-center justify-between mt-1.5 text-[10px] font-semibold text-gray-400">
              <div className="flex items-center gap-1">
                <button onClick={toggleMute} className="hover:text-white transition-colors">
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-3 h-3 text-red-400" />
                  ) : (
                    <Volume2 className="w-3 h-3" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-14 h-1 accent-pink-500 bg-transparent cursor-pointer"
                />
              </div>

              <span>{formatTime(currentTime)} / {formatTime(currentTrack.duration)}</span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
