import React, { useState, useRef, DragEvent, ChangeEvent, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Image as ImageIcon, Loader2, UploadCloud, Sparkles, Camera, Zap, ZapOff, RefreshCcw, Grid } from 'lucide-react';
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
  { name: 'Ludwig', css: 'brightness(1.05) saturate(0.8) contrast(1.05)' },
  { name: 'Aden', css: 'hue-rotate(-20deg) contrast(0.9) saturate(0.85) brightness(1.2)' },
  { name: 'Perpetua', css: 'contrast(1.1) brightness(1.25)' },
  { name: 'Amaro', css: 'hue-rotate(-5deg) contrast(1.1) brightness(1.1) saturate(1.3)' },
  { name: 'Mayfair', css: 'contrast(1.1) saturate(1.1)' },
  { name: 'Rise', css: 'brightness(1.05) sepia(0.2) contrast(0.9)' },
  { name: 'Hudson', css: 'brightness(1.2) contrast(0.9) hue-rotate(-15deg)' },
  { name: 'Valencia', css: 'sepia(0.08) contrast(1.08) brightness(1.08)' },
  { name: 'X-Pro II', css: 'sepia(0.3) contrast(1.25) brightness(0.8)' },
  { name: 'Sierra', css: 'sepia(0.21) contrast(0.8) brightness(1.1)' },
  { name: 'Willow', css: 'grayscale(0.5) contrast(0.95) brightness(0.9)' },
  { name: 'Lo-Fi', css: 'saturate(1.5) contrast(1.5)' },
  { name: 'Inkwell', css: 'grayscale(1) contrast(1.2) brightness(1.05)' },
  { name: 'Hefe', css: 'contrast(1.5) saturate(1.2)' },
  { name: 'Nashville', css: 'sepia(0.2) contrast(1.2) brightness(1.05) saturate(1.2)' },
  { name: 'Stinson', css: 'brightness(1.1) saturate(0.85)' },
  { name: 'Vesper', css: 'sepia(0.35) contrast(1.15) brightness(1.1)' },
  { name: 'Earlybird', css: 'sepia(0.2) contrast(1.19) brightness(1.05)' },
  { name: 'Brannan', css: 'sepia(0.5) contrast(1.4)' },
  { name: 'Sutro', css: 'sepia(0.4) contrast(1.2) brightness(0.9) saturate(1.4)' },
  { name: 'Toaster', css: 'sepia(0.2) contrast(1.5) brightness(0.9)' },
  { name: 'Walden', css: 'brightness(1.1) hue-rotate(-10deg) sepia(0.3) saturate(1.6)' },
  { name: '1977', css: 'sepia(0.5) hue-rotate(-30deg) saturate(1.4) contrast(1.1)' },
  { name: 'Kelvin', css: 'sepia(0.15) contrast(1.5) brightness(1.1) hue-rotate(-10deg)' },
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
  React.useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Camera Management
  React.useEffect(() => {
    if (isOpen && !previewUrl) {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn("Camera API is not available (requires HTTPS or localhost). Falling back to gallery.");
        setCameraError(true);
        return;
      }

      let activeStream: MediaStream | null = null;
      navigator.mediaDevices.getUserMedia({ video: { facingMode } })
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
    resetDraft(true);
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
    
    // Do NOT apply filter here. 
    // We apply it in compressImage so the user can change it after capturing.
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const capturedFile = new File([blob], "capture.jpg", { type: "image/jpeg" });
        processFile(capturedFile);
      }
    }, 'image/jpeg', 0.9);
  };

  const renderFilterRow = (positionClasses: string) => (
    <div className={`${positionClasses} filter-row w-full overflow-x-auto custom-scrollbar flex gap-3 px-6 py-2 z-30 snap-x`}>
      {FILTERS.map((f) => (
        <button
          key={f.name}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveFilter(f.css); }}
          className={`flex flex-col items-center gap-1 shrink-0 snap-center transition-all ${activeFilter === f.css ? 'scale-110 opacity-100' : 'opacity-60 hover:opacity-100 scale-90'}`}
        >
          <div 
            className={`w-14 h-14 rounded-full border-2 ${activeFilter === f.css ? 'border-pink-500' : 'border-white/20'} overflow-hidden bg-black flex items-center justify-center`}
          >
             <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop')", filter: f.css }}></div>
          </div>
          <span className={`text-[10px] font-bold ${activeFilter === f.css ? 'text-pink-500' : 'text-white'} drop-shadow-md`}>{f.name}</span>
        </button>
      ))}
    </div>
  );

  // Reusable Preview Image component for both Mobile and Desktop views
  const renderPreviewBox = () => (
    <div className="flex flex-col items-center space-y-2">
      <span className="text-xs uppercase tracking-widest text-gray-500 font-mono flex items-center gap-1.5">
        <Sparkles className="w-3 h-3 text-gray-500" /> Drag vertically to position caption
      </span>
      
      <div 
        ref={previewContainerRef}
        onMouseDown={handleContainerMouseDown}
        onTouchStart={handleContainerTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative rounded-[1.5rem] md:rounded-[2rem] overflow-hidden border border-white/10 bg-black h-[45dvh] max-h-[360px] aspect-[9/16] mx-auto shadow-2xl flex items-center justify-center group select-none cursor-crosshair shrink-0"
      >
        <img 
          src={previewUrl!} 
          alt="Upload preview" 
          style={{ filter: activeFilter }}
          className="w-full h-full object-cover pointer-events-none" 
        />
        
        <div 
          style={{ top: `${captionY}%` }}
          className="absolute left-0 right-0 z-20 transform -translate-y-1/2 cursor-row-resize"
        >
          <div className="bg-black/60 backdrop-blur-[2px] py-2.5 px-4 w-full flex items-center justify-center border-y border-white/10 shadow-lg">
            <input 
              type="text"
              placeholder="TAP TO TYPE CAPTION..."
              value={caption}
              onChange={(e) => setCaption(e.target.value.slice(0, 100))}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className="w-full bg-transparent text-white text-center text-sm font-bold placeholder-white/50 outline-none border-none pointer-events-auto uppercase tracking-wide"
            />
          </div>
        </div>

        <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md flex flex-col gap-1 pointer-events-none select-none z-10">
          <div className="flex items-center gap-2">
            {currentUser?.avatar ? (
              <img src={currentUser.avatar} alt="" className="w-6 h-6 rounded-full border border-white/20 object-cover" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-pink-500/20 border border-pink-500/50 flex items-center justify-center text-[10px] font-bold text-pink-400">
                {currentUser?.realName?.[0] || currentUser?.anonymousId?.[0] || '?'}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white flex items-center gap-1">
                {currentUser?.realName || currentUser?.anonymousId || 'You'}
                {currentUser?.isVerified && (
                  <span className="w-3 h-3 rounded-full bg-blue-500 flex items-center justify-center text-[8px] text-white">✓</span>
                )}
              </span>
              <span className="text-[9px] text-gray-300 font-medium">{currentUser?.university || 'My University'}</span>
            </div>
          </div>
        </div>

        <button
          onClick={clearSelection}
          className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/90 text-white rounded-full backdrop-blur-md transition-all border border-white/10 active:scale-90 hover:scale-105 z-20"
          aria-label="Remove image"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  // -----------------------------------------------------
  // MOBILE UI (Full-screen Portal)
  // -----------------------------------------------------
  if (isMobile) {
    const mobileCameraUI = (
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black transition-all duration-300 animate-in fade-in"
        onClick={onClose}
      >
        {!previewUrl && !cameraError ? (
          /* MOBILE CAMERA VIEW (Full bleed) */
          <div 
            className="w-full h-full flex flex-col relative bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Controls */}
            <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-6 pt-10 z-20 bg-gradient-to-b from-black/50 to-transparent pointer-events-none">
              <button onClick={onClose} className="p-2 text-white drop-shadow-md transition-transform pointer-events-auto">
                <X className="w-7 h-7" />
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="p-2 text-white drop-shadow-md transition-transform pointer-events-auto">
                <Grid className="w-7 h-7" />
              </button>
            </div>

            {/* Camera Preview Squircle */}
            <div className="flex-1 flex items-center justify-center p-4 pt-20 pb-40 overflow-hidden">
              <div className="w-full max-w-[95%] aspect-[4/5] mx-auto relative overflow-hidden rounded-[3rem] shadow-[0_0_40px_rgba(0,0,0,0.5)] bg-gray-900 border border-white/5 shrink-0">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ filter: activeFilter }}
                  className={`absolute inset-0 w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                />
              </div>
            </div>

            {/* Bottom Controls Area */}
            <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none flex flex-col pt-10">
              <div className="pointer-events-auto w-full">
                {renderFilterRow('relative')}
              </div>
              
              <div className="p-8 pb-12 flex items-center justify-center gap-12 pointer-events-none">
                {/* Flash Toggle */}
                <button onClick={toggleTorch} className="p-3 text-white drop-shadow-md transition-transform active:scale-90 pointer-events-auto">
                  {torchOn ? <Zap className="w-7 h-7 text-yellow-400 fill-yellow-400" /> : <ZapOff className="w-7 h-7" />}
                </button>

                {/* Capture Button */}
                <button 
                  onClick={capturePhoto} 
                  className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1 hover:scale-105 active:scale-95 transition-all shadow-xl pointer-events-auto"
                >
                  <div className="w-full h-full bg-white rounded-full"></div>
                </button>

                {/* Flip Camera */}
                <button onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')} className="p-3 text-white drop-shadow-md transition-transform active:scale-90 pointer-events-auto">
                  <RefreshCcw className="w-7 h-7" />
                </button>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
        ) : (
          /* MOBILE PREVIEW VIEW OR CAMERA ERROR (Card Style) */
          <div 
            className="relative w-full max-w-lg overflow-hidden bg-[#0d091a] border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[85dvh] animate-in fade-in zoom-in-95 duration-300 m-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {previewUrl && (
              <div className="relative flex items-center justify-between p-6 border-b border-white/5 z-10 shrink-0">
                <h2 className="text-sm font-bold text-white tracking-wide">
                  Share a Glimpse
                </h2>
                <button 
                  onClick={onClose}
                  className="p-2 text-gray-400 rounded-full hover:text-white hover:bg-white/5 active:scale-95 transition-all duration-200 border border-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 z-10">
              {error && (
                <div className="p-4 border border-red-500/20 bg-red-500/10 rounded-2xl text-red-400 text-sm font-medium">
                  {error}
                </div>
              )}

              {cameraError && !previewUrl ? (
                <div className="flex flex-col items-center justify-center p-8 text-center h-full min-h-[50vh] w-full">
                  <Camera className="w-12 h-12 text-gray-500 mb-4" />
                  <p className="text-white font-bold mb-2">Camera Unavailable</p>
                  <p className="text-gray-400 text-sm mb-6 max-w-xs">Please allow camera access, or use the gallery. (Note: Camera requires HTTPS or localhost)</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all"
                  >
                    Open Gallery
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <div className="absolute top-4 left-4 z-20">
                    <button onClick={onClose} className="p-3 text-white drop-shadow-md bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-md">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              ) : null}

              {previewUrl && (
                <>
                  {renderPreviewBox()}
                  <div className="w-full mt-4 bg-black/20 rounded-2xl py-2">
                    {renderFilterRow('relative')}
                  </div>
                  {/* Post Anonymously Checkbox */}
                  <div className="flex items-center gap-3 p-1">
                    <input
                      type="checkbox"
                      id="glimpse-anonymous-mobile"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="w-4.5 h-4.5 rounded border-white/20 bg-white/5 text-pink-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-pink-500"
                    />
                    <label 
                      htmlFor="glimpse-anonymous-mobile" 
                      className="text-xs font-bold text-gray-400 hover:text-white cursor-pointer select-none transition-colors"
                    >
                      Remain Anonymous (post under your anonymous handle)
                    </label>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            {previewUrl && (
              <div className="flex items-center justify-end gap-3 p-4 border-t border-white/5 bg-[#05020c]/40 backdrop-blur-md shrink-0">
                <button
                  onClick={onClose}
                  disabled={isUploading}
                  className="px-5 py-2.5 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white font-bold rounded-2xl text-sm transition-all duration-300 active:scale-95 disabled:opacity-50"
                >
                  Cancel
                </button>
                
                <button
                  onClick={handleUpload}
                  disabled={isUploading || !file}
                  className="px-6 py-2.5 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-2xl text-sm transition-all duration-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 min-w-[120px]"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Posting...</span>
                    </>
                  ) : (
                    <span>Post Now</span>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
    return createPortal(mobileCameraUI, document.body);
  }

  // -----------------------------------------------------
  // DESKTOP UI (Original Box)
  // -----------------------------------------------------
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030008]/80 backdrop-blur-xl transition-all duration-300 animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg overflow-hidden bg-[#0d091a] border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[85dvh] animate-in fade-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {previewUrl && (
          <div className="relative flex items-center justify-between p-6 border-b border-white/5 z-10 shrink-0">
            <h2 className="text-sm font-bold text-white tracking-wide">
              Share a Glimpse
            </h2>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 rounded-full hover:text-white hover:bg-white/5 active:scale-95 transition-all duration-200 border border-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className={`flex-1 overflow-y-auto custom-scrollbar ${previewUrl ? 'p-6 space-y-6 z-10' : 'p-0 relative flex flex-col bg-[#030008]'}`}>
          {error && (
            <div className="p-4 border border-red-500/20 bg-red-500/10 rounded-2xl text-red-400 text-sm font-medium">
              {error}
            </div>
          )}

          {/* Upload / Camera View Area */}
          {!previewUrl ? (
            <div className="relative flex flex-col items-center justify-center h-full min-h-[60vh] bg-[#030008] overflow-hidden">
              {cameraError ? (
                <div className="flex flex-col items-center justify-center p-8 text-center h-full w-full">
                  <Camera className="w-12 h-12 text-gray-500 mb-4" />
                  <p className="text-white font-bold mb-2">Camera Unavailable</p>
                  <p className="text-gray-400 text-sm mb-6 max-w-xs">Please allow camera access, or use the gallery. (Note: Camera requires HTTPS or localhost)</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all"
                  >
                    Open Gallery
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <div className="absolute top-4 left-4 z-20">
                    <button onClick={onClose} className="p-3 text-white drop-shadow-md bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-md">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative w-full max-w-sm aspect-[4/5] sm:aspect-square mx-auto overflow-hidden rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] mb-10">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{ filter: activeFilter }}
                      className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                    />
                  </div>

                  {/* Top Overlay Controls */}
                  <div className="absolute top-4 left-4 z-20">
                    <button onClick={onClose} className="p-3 text-white drop-shadow-md bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-md">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="absolute top-4 right-4 z-20">
                    <button onClick={() => fileInputRef.current?.click()} className="p-3 text-white drop-shadow-md bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-md">
                      <Grid className="w-6 h-6" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </div>

                  {/* Bottom Controls Area */}
                  <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col pt-10 pb-8 rounded-b-3xl">
                    <div className="w-full">
                      {renderFilterRow('relative')}
                    </div>
                    <div className="flex items-center justify-between px-10 sm:px-16 mt-4">
                      <button onClick={toggleTorch} className="p-3 text-white bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full transition-all active:scale-90">
                        {torchOn ? <Zap className="w-6 h-6 text-yellow-400 fill-yellow-400" /> : <ZapOff className="w-6 h-6 text-white" />}
                      </button>
                      <button 
                        onClick={capturePhoto} 
                        className="w-20 h-20 rounded-full border-4 border-white/50 bg-white/20 backdrop-blur-sm p-1 transition-transform active:scale-90"
                      >
                        <div className="w-full h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]"></div>
                      </button>
                      <button onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')} className="p-3 text-white bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full transition-all active:scale-90">
                        <RefreshCcw className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              {renderPreviewBox()}
              <div className="w-full mt-4 bg-black/20 rounded-2xl py-2">
                {renderFilterRow('relative')}
              </div>
              <div className="flex items-center gap-3 p-1">
                <input
                  type="checkbox"
                  id="glimpse-anonymous-desktop"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4.5 h-4.5 rounded border-white/20 bg-white/5 text-pink-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-pink-500"
                />
                <label 
                  htmlFor="glimpse-anonymous-desktop" 
                  className="text-xs font-bold text-gray-400 hover:text-white cursor-pointer select-none transition-colors"
                >
                  Remain Anonymous (post under your anonymous handle)
                </label>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {previewUrl && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-white/5 bg-[#05020c]/40 backdrop-blur-md shrink-0">
            <button
              onClick={onClose}
              disabled={isUploading}
              className="px-5 py-2.5 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white font-bold rounded-2xl text-sm transition-all duration-300 active:scale-95 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={isUploading || !file}
              className="px-6 py-2.5 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-2xl text-sm transition-all duration-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 min-w-[120px]"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Posting...</span>
                </>
              ) : (
                <span>Post Now</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
