import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { X, Image as ImageIcon, Loader2, UploadCloud, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (target.closest('input') || target.closest('button')) {
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
    if (target.closest('input') || target.closest('button')) {
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

  if (!isOpen) return null;

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

          ctx.drawImage(img, 0, 0, width, height);

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
        throw dbError;
      }

      // Success
      setFile(null);
      setPreviewUrl(null);
      setCaption('');
      setIsAnonymous(false);
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
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030008]/80 backdrop-blur-xl transition-all duration-300 animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg overflow-hidden bg-[#0d091a] border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Clean, dark container without large glowing ambient blur dots */}

        {/* Header */}
        <div className="relative flex items-center justify-between p-6 border-b border-white/5 z-10">
          <h2 className="text-sm font-bold text-white tracking-wide">
            Share a Glimpse
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 rounded-full hover:text-white hover:bg-white/5 active:scale-95 transition-all duration-200 border border-white/5"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 z-10 custom-scrollbar">
          {error && (
            <div className="p-4 border border-red-500/20 bg-red-500/10 rounded-2xl text-red-400 text-sm font-medium animate-in slide-in-from-top-2">
              {error}
            </div>
          )}

          {/* Upload / Preview Area */}
          {!previewUrl ? (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 min-h-[200px] group
                ${dragActive 
                  ? 'border-pink-500/60 bg-pink-500/5' 
                  : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
                }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
              
              <div className="p-4 mb-4 rounded-2xl bg-white/5 border border-white/10 group-hover:border-white/20 transition-all duration-200">
                <UploadCloud className="w-7 h-7 text-gray-500 group-hover:text-gray-300 transition-colors" />
              </div>
              
              <h3 className="text-base font-semibold text-white mb-1">Drop your image here</h3>
              <p className="text-sm text-gray-500 mb-4 max-w-[260px] leading-relaxed">
                JPG, PNG or WebP. Disappears in 24 hours.
              </p>
              
              <button 
                type="button"
                className="px-5 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-sm font-semibold text-gray-300 hover:text-white rounded-xl transition-all duration-200 active:scale-95"
              >
                Browse Files
              </button>
            </div>
          ) : (
            /* Premium Live Mock-Feed Card Preview */
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
                className="relative rounded-[2rem] overflow-hidden border border-white/10 bg-black w-full aspect-[9/16] max-h-[360px] shadow-2xl flex items-center justify-center group select-none cursor-crosshair"
              >
                <img 
                  src={previewUrl} 
                  alt="Upload preview" 
                  className="w-full h-full object-cover pointer-events-none" 
                />
                
                {/* Draggable Snapchat-style Caption Input Overlay */}
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

                {/* Mock Card Glassmorphic Feed Info Bottom Overlay */}
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
 
                {/* Remove preview floating button */}
                <button
                  onClick={clearSelection}
                  className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/90 text-white rounded-full backdrop-blur-md transition-all border border-white/10 active:scale-90 hover:scale-105 z-20"
                  aria-label="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Post Anonymously Checkbox */}
          <div className="flex items-center gap-3 p-1">
            <input
              type="checkbox"
              id="glimpse-anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4.5 h-4.5 rounded border-white/20 bg-white/5 text-pink-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-pink-500"
            />
            <label 
              htmlFor="glimpse-anonymous" 
              className="text-xs font-bold text-gray-400 hover:text-white cursor-pointer select-none transition-colors"
            >
              Remain Anonymous (post under your anonymous handle)
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/5 bg-[#05020c]/40 backdrop-blur-md">
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
            className="px-6 py-2.5 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-2xl text-sm transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 min-w-[120px]"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Posting...</span>
              </>
            ) : (
              <>
                <span>Post Now</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
