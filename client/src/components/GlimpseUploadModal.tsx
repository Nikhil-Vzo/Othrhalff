import React, { useState, useRef, DragEvent, ChangeEvent, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Image as ImageIcon, Loader2, Sparkles, Camera, Zap, ZapOff, RefreshCcw, Grid, Send, BadgeCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const FILTERS = [
  { name: 'Normal', css: 'none' },
  { name: 'Clarendon', css: 'contrast(1.2) saturate(1.35)' },
  { name: 'Gingham', css: 'brightness(1.05) hue-rotate(-10deg)' },
  { name: 'Moon', css: 'grayscale(1) contrast(1.1) brightness(1.1)' },
  { name: 'Lark', css: 'contrast(0.9) saturate(1.5) brightness(1.2)' },
  { name: 'Reyes', css: 'sepia(0.22) brightness(1.1) contrast(0.85) saturate(0.75)' },
  { name: 'Juno', css: 'saturate(1.2) contrast(1.15) hue-rotate(-4deg)' },
  { name: 'Slumber', css: 'sepia(0.25) saturate(0.85)' },
  { name: 'Crema', css: 'sepia(0.5) brightness(1.15)' },
  { name: 'Lo-Fi', css: 'saturate(1.5) contrast(1.5)' },
  { name: 'Inkwell', css: 'grayscale(1) contrast(1.2) brightness(1.05)' },
  { name: 'Hefe', css: 'contrast(1.5) saturate(1.2)' },
];

interface GlimpseUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export const GlimpseUploadModal: React.FC<GlimpseUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const { currentUser } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [activeFilter, setActiveFilter] = useState('none');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Camera States
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const resetDraft = (keepNewFile = false) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    if (!keepNewFile) {
      setFile(null);
      setPreviewUrl(null);
      setCaption('');
      setError(null);
    }
  };

  const handleClose = () => {
    resetDraft(false);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      resetDraft(false);
    }
  }, [isOpen]);

  const [captionY, setCaptionY] = useState(50); // Vertical percentage (5 to 95)
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDraggingRef.current || !previewContainerRef.current) return;
    const rect = previewContainerRef.current.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    const percentage = Math.max(5, Math.min(95, (relativeY / rect.height) * 100));
    setCaptionY(percentage);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // Touch drag handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    isDraggingRef.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || !previewContainerRef.current) return;
    const rect = previewContainerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const relativeY = touch.clientY - rect.top;
    const percentage = Math.max(5, Math.min(95, (relativeY / rect.height) * 100));
    setCaptionY(percentage);
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  // Click container to position caption strip
  const handleContainerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('input') || target.closest('button') || target.closest('.filter-row')) {
      return;
    }
    e.preventDefault();
    if (!previewContainerRef.current) return;
    const rect = previewContainerRef.current.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    const percentage = Math.max(5, Math.min(95, (relativeY / rect.height) * 100));
    setCaptionY(percentage);

    isDraggingRef.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleContainerTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('input') || target.closest('button') || target.closest('.filter-row')) {
      return;
    }
    if (!previewContainerRef.current) return;
    const rect = previewContainerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const relativeY = touch.clientY - rect.top;
    const percentage = Math.max(5, Math.min(95, (relativeY / rect.height) * 100));
    setCaptionY(percentage);

    isDraggingRef.current = true;
  };

  // Cleanup drag listeners
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Camera Management
  useEffect(() => {
    if (isOpen && !previewUrl) {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn("Camera API is not available. Falling back to gallery.");
        setCameraError(true);
        return;
      }

      let activeStream: MediaStream | null = null;
      navigator.mediaDevices.getUserMedia({ video: { facingMode: facingMode } })
        .then(mediaStream => {
          activeStream = mediaStream;
          setStream(mediaStream);
          setCameraError(false);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        })
        .catch(err => {
          console.error("Camera error:", err);
          setCameraError(true);
        });

      return () => {
        if (activeStream) {
          activeStream.getTracks().forEach(track => track.stop());
        }
      };
    } else if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [isOpen, previewUrl, facingMode]);

  if (!isOpen || !mounted) return null;

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, WebP)');
      return;
    }
    setError(null);
    setFile(selectedFile);
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const compressImage = (imageFile: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxSize = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxSize) {
              height = Math.round((height * maxSize) / width);
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = Math.round((width * maxSize) / height);
              height = maxSize;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Apply selected filter to canvas
          ctx.filter = activeFilter;
          ctx.drawImage(img, 0, 0, width, height);

          // Remove filter before drawing caption
          ctx.filter = 'none';

          // Bake Snapchat-style caption strip
          if (caption.trim()) {
            const trimmedCaption = caption.trim();
            const fontSize = Math.max(16, Math.round(width * 0.035));
            ctx.font = `bold ${fontSize}px sans-serif`;
            
            const bannerHeight = fontSize * 1.8;
            const yPos = height * (captionY / 100);
            
            // Draw background strip
            ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
            ctx.fillRect(0, yPos - bannerHeight / 2, width, bannerHeight);
            
            // Draw centered white text
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(trimmedCaption, width / 2, yPos);
          }

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Canvas toBlob failed'));
              }
            },
            'image/jpeg',
            0.8
          );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(imageFile);
    });
  };

  const handleUpload = async () => {
    if (!currentUser) {
      setError('You must be signed in to post glimpses.');
      return;
    }
    if (!file) {
      setError('Please select an image first.');
      return;
    }
    if (!supabase) {
      setError('Supabase is not initialized.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // 1. Compress Image
      const compressedBlob = await compressImage(file);

      // 2. Upload to Storage
      const fileExt = 'jpg';
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${currentUser.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('glimpses')
        .upload(filePath, compressedBlob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // 3. Insert metadata into public.glimpses table
      const { error: dbError } = await supabase
        .from('glimpses')
        .insert({
          user_id: currentUser.id,
          image_path: filePath,
          caption: caption.trim() || null,
          university: currentUser.university || 'Global',
          is_anonymous: isAnonymous,
        });

      if (dbError) {
        await supabase.storage.from('glimpses').remove([filePath]).catch(err => {
          console.error('Failed to clean up orphaned image from storage:', err);
        });
        throw dbError;
      }

      // Success
      resetDraft(false);
      onUploadSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error uploading glimpse:', err);
      setError(err.message || 'An unexpected error occurred during upload.');
    } finally {
      setIsUploading(false);
    }
  };

  const clearSelection = () => {
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setError(null);
    setActiveFilter('none');
  };

  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;
    
    try {
      const capabilities = track.getCapabilities() as any;
      if (capabilities.torch) {
        const newTorchState = !torchOn;
        await track.applyConstraints({
          advanced: [{ torch: newTorchState }] as any
        });
        setTorchOn(newTorchState);
      }
    } catch (err) {
      console.error("Failed to toggle torch", err);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const capturedFile = new File([blob], "capture.jpg", { type: "image/jpeg" });
        processFile(capturedFile);
      }
    }, 'image/jpeg', 0.9);
  };

  const renderFilterRow = () => (
    <div className="filter-row w-full overflow-x-auto custom-scrollbar flex gap-3 px-6 py-2 z-30 snap-x relative pointer-events-auto">
      {FILTERS.map((f) => (
        <button
          key={f.name}
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveFilter(f.css); }}
          className={`flex flex-col items-center gap-1 shrink-0 snap-center transition-all ${activeFilter === f.css ? 'scale-105 opacity-100' : 'opacity-50 hover:opacity-100 scale-90'}`}
        >
          <div 
            className={`w-12 h-12 rounded-full border-2 ${activeFilter === f.css ? 'border-pink-500 shadow-[0_0_8px_rgba(255,0,127,0.4)]' : 'border-white/20'} overflow-hidden bg-black flex items-center justify-center`}
          >
             <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop')", filter: f.css }}></div>
          </div>
          <span className={`text-[9px] font-bold ${activeFilter === f.css ? 'text-pink-500' : 'text-zinc-400'} drop-shadow-md`}>{f.name}</span>
        </button>
      ))}
    </div>
  );

  const mainUIContent = (
    <div 
      className={`relative w-full overflow-hidden bg-black flex flex-col z-10 shadow-2xl transition-all duration-300 ${
        isMobile 
          ? 'w-screen h-[100dvh]' 
          : 'max-w-[420px] aspect-[9/16] h-[85dvh] max-h-[780px] border border-white/10 rounded-[3rem] shadow-[0_0_40px_rgba(0,0,0,0.8)]'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* -------------------- VIEW 1: CAMERA SCANNING / UPLOAD SELECTION -------------------- */}
      {!previewUrl ? (
        <div className="absolute inset-0 flex flex-col justify-between items-center bg-black">
          {cameraError ? (
            /* Fallback Gallery Mode */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center w-full z-10 relative">
              <div className="absolute top-6 left-6 pointer-events-auto">
                <button onClick={handleClose} className="p-2.5 text-white bg-black/40 hover:bg-black/60 rounded-full border border-white/10 backdrop-blur-md transition-all active:scale-90">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-3xl max-w-xs flex flex-col items-center shadow-xl">
                <Camera className="w-10 h-10 text-zinc-500 mb-4" />
                <h3 className="text-sm font-bold text-white mb-2">Camera Unavailable</h3>
                <p className="text-xs text-zinc-500 mb-6 leading-relaxed">Please grant camera permissions, or select an image directly from your local photos library.</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 bg-white hover:bg-zinc-200 text-black text-xs font-black rounded-2xl tracking-wider uppercase transition-all shadow-md active:scale-95"
                >
                  Import Photo
                </button>
              </div>
            </div>
          ) : (
            /* Snapchat Camera Feed Bleed */
            <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ filter: activeFilter }}
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />
              {/* Overlay Glass Vignette */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />
            </div>
          )}

          {/* HUD TOP BAR */}
          <div className="w-full flex justify-between items-center p-6 z-20 pointer-events-none mt-2">
            <button 
              onClick={handleClose} 
              className="p-2.5 text-white bg-black/40 hover:bg-black/60 rounded-full border border-white/10 backdrop-blur-md transition-all active:scale-90 pointer-events-auto"
              title="Close Camera"
            >
              <X className="w-5 h-5" />
            </button>
            <button 
              onClick={toggleTorch} 
              className="p-2.5 text-white bg-black/40 hover:bg-black/60 rounded-full border border-white/10 backdrop-blur-md transition-all active:scale-90 pointer-events-auto"
              title="Toggle Flash"
            >
              {torchOn ? <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" /> : <ZapOff className="w-5 h-5" />}
            </button>
          </div>

          {/* HUD BOTTOM BAR */}
          {!cameraError && (
            <div className="w-full flex flex-col z-20 pointer-events-none pb-8">
              {/* Filter Carousel */}
              <div className="w-full mb-4 shrink-0">
                {renderFilterRow()}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between px-10 sm:px-14 pointer-events-none">
                {/* Open Gallery */}
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="p-3 text-white bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full border border-white/10 transition-all active:scale-90 pointer-events-auto"
                  title="Open Gallery"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>

                {/* Concentric Snapchat Capture Ring */}
                <button 
                  onClick={capturePhoto} 
                  className="w-20 h-20 rounded-full border-4 border-white bg-white/20 backdrop-blur-sm p-1 transition-all hover:scale-105 active:scale-90 pointer-events-auto flex items-center justify-center cursor-pointer shadow-xl shadow-black/30"
                >
                  <div className="w-full h-full bg-white rounded-full"></div>
                </button>

                {/* Switch Camera */}
                <button 
                  onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')} 
                  className="p-3 text-white bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full border border-white/10 transition-all active:scale-90 pointer-events-auto"
                >
                  <RefreshCcw className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>
      ) : (
        /* -------------------- VIEW 2: IMAGE PREVIEW & CAPTION OVERLAY -------------------- */
        <div 
          ref={previewContainerRef}
          onMouseDown={handleContainerMouseDown}
          onTouchStart={handleContainerTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="absolute inset-0 flex flex-col justify-between items-center bg-black select-none cursor-crosshair overflow-hidden"
        >
          {/* Full bleed Preview image */}
          <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
            <img 
              src={previewUrl} 
              alt="Upload preview" 
              style={{ filter: activeFilter }}
              className="w-full h-full object-cover pointer-events-none" 
            />
            {/* Vignette */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50 pointer-events-none" />
          </div>

          {/* HUD Top Bar */}
          <div className="w-full flex justify-between items-center p-6 z-20 pointer-events-none mt-2">
            <button 
              onClick={clearSelection} 
              className="p-2.5 text-white bg-black/40 hover:bg-black/60 rounded-full border border-white/10 backdrop-blur-md transition-all active:scale-90 pointer-events-auto"
              title="Back to Camera"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Drag instructions overlay */}
            <div className="bg-black/40 border border-white/10 px-3 py-1.5 rounded-full backdrop-blur-md text-[10px] uppercase tracking-widest text-zinc-300 font-bold font-mono">
              Drag Caption Vertically
            </div>
          </div>

          {/* Draggable Snapchat Caption Strip */}
          <div 
            style={{ top: `${captionY}%` }}
            className="absolute left-0 right-0 z-20 transform -translate-y-1/2 cursor-row-resize pointer-events-auto"
          >
            <div className="bg-black/60 backdrop-blur-[1.5px] py-3.5 px-6 w-full flex items-center justify-center border-y border-white/10 shadow-lg">
              <input 
                type="text"
                placeholder="TAP TO TYPE CAPTION..."
                value={caption}
                onChange={(e) => setCaption(e.target.value.slice(0, 100))}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="w-full bg-transparent text-white text-center text-sm font-bold placeholder-white/40 outline-none border-none pointer-events-auto uppercase tracking-wide"
              />
            </div>
          </div>

          {/* Bottom Controls Area */}
          <div className="w-full flex flex-col z-20 pointer-events-none pb-8">
            
            {/* Error notifications */}
            {error && (
              <div className="mx-6 mb-4 p-3 bg-red-950/70 border border-red-900/30 rounded-2xl text-red-400 text-xs font-semibold text-center backdrop-blur-md">
                {error}
              </div>
            )}

            {/* Filter swiper */}
            <div className="w-full mb-4 shrink-0">
              {renderFilterRow()}
            </div>

            {/* HUD Footer actions */}
            <div className="flex items-center justify-between px-6 pointer-events-none">
              
              {/* Anonymous HUD Toggle */}
              <div className="pointer-events-auto bg-black/60 border border-white/10 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2 text-xs font-bold text-gray-300 hover:text-white transition-all cursor-pointer">
                <input
                  type="checkbox"
                  id="glimpse-anon-hud"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-pink-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-pink-500"
                />
                <label htmlFor="glimpse-anon-hud" className="cursor-pointer select-none">
                  Anon Post
                </label>
              </div>

              {/* Snapchat style floating send button */}
              <button 
                onClick={handleUpload} 
                disabled={isUploading || !file}
                className="p-4 bg-gradient-to-tr from-pink-500 to-rose-600 rounded-full border border-white/10 shadow-[0_0_20px_rgba(244,63,94,0.4)] text-white hover:scale-105 active:scale-95 pointer-events-auto transition-all"
                title="Send Glimpse"
              >
                {isUploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                ) : (
                  <Send className="w-6 h-6 fill-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return createPortal(
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black transition-all duration-300 animate-in fade-in"
        onClick={handleClose}
      >
        {mainUIContent}
      </div>,
      document.body
    );
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030008]/85 backdrop-blur-xl transition-all duration-300 animate-in fade-in"
      onClick={handleClose}
    >
      {mainUIContent}
    </div>
  );
};
