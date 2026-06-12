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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        });

      if (dbError) {
        throw dbError;
      }

      // Success
      setFile(null);
      setPreviewUrl(null);
      setCaption('');
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
        className="relative w-full max-w-lg overflow-hidden bg-gradient-to-b from-[#0d091a]/95 to-[#04010a]/98 border border-white/10 rounded-[2.5rem] shadow-[0_0_80px_rgba(255,0,128,0.15)] flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top ambient color dots inside modal */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-pink-500/10 blur-[50px] pointer-events-none" />
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[50px] pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-center justify-between p-6 border-b border-white/5 z-10">
          <h2 className="text-lg font-black uppercase tracking-wider text-white flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
            </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400">
              Share Glimpse
            </span>
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
              className={`relative border-2 border-dashed rounded-[2rem] p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 min-h-[280px] group
                ${dragActive 
                  ? 'border-pink-500 bg-pink-500/5 shadow-[0_0_30px_rgba(255,0,127,0.15)] scale-[1.01]' 
                  : 'border-white/10 hover:border-pink-500/50 hover:bg-white/5 hover:shadow-[0_0_20px_rgba(255,255,255,0.02)]'
                }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
              
              <div className="p-5 mb-5 rounded-3xl bg-white/5 border border-white/10 group-hover:border-pink-500/30 group-hover:bg-pink-500/5 transition-all duration-300 group-hover:scale-110 shadow-lg">
                <UploadCloud className="w-8 h-8 text-gray-400 group-hover:text-pink-500 transition-colors" />
              </div>
              
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-pink-400 transition-colors">Drag & drop your story</h3>
              <p className="text-sm text-gray-400 mb-6 max-w-[280px] leading-relaxed">
                Choose a visual vibe (JPG, PNG, WebP). Story automatically vanishes in 24 hours.
              </p>
              
              <button 
                type="button"
                className="px-6 py-3 bg-white/5 hover:bg-gradient-to-r hover:from-pink-500 hover:to-purple-600 hover:text-white border border-white/10 hover:border-transparent text-sm font-bold rounded-2xl transition-all duration-300 shadow-sm active:scale-95"
              >
                Browse Files
              </button>
            </div>
          ) : (
            /* Premium Live Mock-Feed Card Preview */
            <div className="flex flex-col items-center space-y-2">
              <span className="text-xs uppercase tracking-widest text-gray-500 font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-pink-500" /> Story Preview
              </span>
              
              <div className="relative rounded-[2rem] overflow-hidden border border-white/10 bg-black w-full aspect-[9/16] max-h-[360px] shadow-2xl flex items-center justify-center group">
                <img 
                  src={previewUrl} 
                  alt="Upload preview" 
                  className="w-full h-full object-cover" 
                />
                
                {/* Mock Card Glassmorphic Feed Info Bottom Overlay */}
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md flex flex-col gap-1 pointer-events-none select-none">
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
                  {caption.trim() && (
                    <p className="text-xs text-gray-200 mt-2 line-clamp-2 font-light">{caption}</p>
                  )}
                </div>

                {/* Remove preview floating button */}
                <button
                  onClick={clearSelection}
                  className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/90 text-white rounded-full backdrop-blur-md transition-all border border-white/10 active:scale-90 hover:scale-105"
                  aria-label="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Caption Input */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm font-bold text-gray-300">
              <label htmlFor="glimpse-caption">Describe the Vibe</label>
              <span className={`text-xs font-mono ${caption.length > 150 ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                {caption.length}/150
              </span>
            </div>
            <textarea
              id="glimpse-caption"
              placeholder="What's happening right now? Add a slick caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value.slice(0, 150))}
              rows={3}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 hover:border-white/20 focus:border-pink-500 focus:ring-1 focus:ring-pink-500/50 rounded-2xl text-white placeholder-gray-600 outline-none transition-all duration-300 resize-none text-sm leading-relaxed"
            />
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
            className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-black rounded-2xl text-sm shadow-[0_0_20px_rgba(255,0,128,0.25)] hover:shadow-[0_0_35px_rgba(255,0,128,0.45)] transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 min-w-[120px]"
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
