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

interface StickerConfig {
  name: string;
  defaultWidth: number;
  dataUrl: string;
}

const STICKERS: Record<'dog' | 'glasses' | 'crown' | 'mustache', StickerConfig> = {
  dog: {
    name: 'Puppy',
    defaultWidth: 120,
    dataUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg viewBox="0 0 120 80" width="120" height="80" xmlns="http://www.w3.org/2000/svg"><path d="M15,10 C5,10 0,25 5,35 C10,45 25,45 25,30 C25,20 20,10 15,10 Z" fill="#8b5a2b"/><path d="M105,10 C115,10 120,25 115,35 C110,45 95,45 95,30 C95,20 100,10 105,10 Z" fill="#8b5a2b"/><ellipse cx="60" cy="63" rx="12" ry="7" fill="black"/><ellipse cx="60" cy="65" rx="5" ry="3" fill="#333"/></svg>`)
  },
  glasses: {
    name: 'Sunglasses',
    defaultWidth: 100,
    dataUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg viewBox="0 0 100 30" width="100" height="30" xmlns="http://www.w3.org/2000/svg"><path d="M5,5 L40,5 L45,15 L35,25 L10,25 Z M55,5 L90,5 L85,25 L60,25 L50,15 Z M40,8 L60,8" fill="black" stroke="black" stroke-width="2" stroke-linejoin="round"/><path d="M12,9 L22,9" stroke="white" stroke-width="1.5" stroke-linecap="round"/><path d="M62,9 L72,9" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg>`)
  },
  crown: {
    name: 'Crown',
    defaultWidth: 100,
    dataUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg viewBox="0 0 100 60" width="100" height="60" xmlns="http://www.w3.org/2000/svg"><path d="M10,50 L90,50 L85,20 L65,35 L50,10 L35,35 L15,20 Z" fill="#ffd700" stroke="#b8860b" stroke-width="2" stroke-linejoin="round"/><circle cx="50" cy="10" r="4" fill="red"/><circle cx="15" cy="20" r="3" fill="blue"/><circle cx="85" cy="20" r="3" fill="blue"/><circle cx="30" cy="50" r="3" fill="red"/><circle cx="50" cy="50" r="3" fill="green"/><circle cx="70" cy="50" r="3" fill="red"/></svg>`)
  },
  mustache: {
    name: 'Mustache',
    defaultWidth: 100,
    dataUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg viewBox="0 0 100 30" width="100" height="30" xmlns="http://www.w3.org/2000/svg"><path d="M50,15 C45,10 35,5 20,5 C5,5 0,15 5,20 C10,25 25,25 45,15 C48,13 50,14 50,15 C50,14 52,13 55,15 C75,25 90,25 95,20 C100,15 95,5 80,5 C65,5 55,10 50,15 Z" fill="#2d1a04"/></svg>`)
  }
};

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
  const [activeMode, setActiveMode] = useState<'filters' | 'lenses'>('filters');
  const [activeSticker, setActiveSticker] = useState<{
    type: 'dog' | 'glasses' | 'crown' | 'mustache';
    x: number;
    y: number;
    scale: number;
    rotation: number;
  } | null>(null);
  const isDraggingStickerRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const faceDetectorRef = useRef<any>(null);
  const previewImageRef = useRef<HTMLImageElement>(null);

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
      setActiveSticker(null);
      setActiveMode('filters');
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

  // Sticker Drag Handlers
  const handleStickerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingStickerRef.current = true;
    document.addEventListener('mousemove', handleStickerMouseMove);
    document.addEventListener('mouseup', handleStickerMouseUp);
  };

  const handleStickerMouseMove = (e: MouseEvent) => {
    if (!isDraggingStickerRef.current || !previewContainerRef.current) return;
    const rect = previewContainerRef.current.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const relativeY = e.clientY - rect.top;
    const xPct = Math.max(0, Math.min(100, (relativeX / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, (relativeY / rect.height) * 100));
    setActiveSticker(prev => prev ? { ...prev, x: xPct, y: yPct } : null);
  };

  const handleStickerMouseUp = () => {
    isDraggingStickerRef.current = false;
    document.removeEventListener('mousemove', handleStickerMouseMove);
    document.removeEventListener('mouseup', handleStickerMouseUp);
  };

  const handleStickerTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    isDraggingStickerRef.current = true;
  };

  const handleStickerTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingStickerRef.current || !previewContainerRef.current) return;
    const rect = previewContainerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const relativeX = touch.clientX - rect.left;
    const relativeY = touch.clientY - rect.top;
    const xPct = Math.max(0, Math.min(100, (relativeX / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, (relativeY / rect.height) * 100));
    setActiveSticker(prev => prev ? { ...prev, x: xPct, y: yPct } : null);
  };

  const handleStickerTouchEnd = () => {
    isDraggingStickerRef.current = false;
  };

  // Cleanup drag listeners
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleStickerMouseMove);
      document.removeEventListener('mouseup', handleStickerMouseUp);
    };
  }, []);

  const getFaceDetector = async () => {
    if (faceDetectorRef.current) return faceDetectorRef.current;
    
    // @ts-ignore
    const visionModule = await (import(/* webpackIgnore: true */ "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/vision_bundle.mjs") as Promise<any>);
    const { FaceDetector, FilesetResolver } = visionModule;
    
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
    );
    
    const detector = await FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
        delegate: "GPU"
      },
      runningMode: "IMAGE"
    });
    
    faceDetectorRef.current = detector;
    return detector;
  };

  // Real-time tracking loop inside camera mode
  useEffect(() => {
    if (!isOpen || previewUrl || !activeSticker || !stream || cameraError) return;

    let active = true;
    let animationFrameId: number;

    const runTracking = async () => {
      try {
        const detector = await getFaceDetector();
        
        const track = async () => {
          if (!active || !videoRef.current || videoRef.current.readyState < 2) {
            if (active) animationFrameId = requestAnimationFrame(track);
            return;
          }

          const results = detector.detect(videoRef.current);
          if (results.detections && results.detections.length > 0) {
            const keypoints = results.detections[0].keypoints;
            if (keypoints && keypoints.length >= 4) {
              const eyeR = keypoints[0];
              const eyeL = keypoints[1];
              const nose = keypoints[2];
              const mouth = keypoints[3];

              // Eye distance and rotation
              const dx = eyeL.x - eyeR.x;
              const dy = eyeL.y - eyeR.y;
              const eyeDistance = Math.sqrt(dx * dx + dy * dy);
              const rotationAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
              const eyeMidX = (eyeR.x + eyeL.x) / 2;
              const eyeMidY = (eyeR.y + eyeL.y) / 2;

              let targetX = 50;
              let targetY = 40;
              let targetScale = 1.0;

              const isMirrored = facingMode === 'user';

              switch (activeSticker.type) {
                case 'glasses':
                  targetX = isMirrored ? (1 - eyeMidX) : eyeMidX;
                  targetY = eyeMidY;
                  targetScale = eyeDistance * 4.5;
                  break;
                case 'mustache':
                  const mustX = (nose.x + mouth.x) / 2;
                  const mustY = (nose.y + mouth.y) / 2;
                  targetX = isMirrored ? (1 - mustX) : mustX;
                  targetY = mustY;
                  targetScale = eyeDistance * 3.5;
                  break;
                case 'crown':
                  const angleRad = Math.atan2(dy, dx) - Math.PI / 2;
                  const shiftDist = eyeDistance * 1.5;
                  const crX = eyeMidX + Math.cos(angleRad) * shiftDist;
                  const crY = eyeMidY + Math.sin(angleRad) * shiftDist;
                  targetX = isMirrored ? (1 - crX) : crX;
                  targetY = crY;
                  targetScale = eyeDistance * 5.0;
                  break;
                case 'dog':
                  const anchX = (eyeMidX + nose.x) / 2;
                  const anchY = (eyeMidY + nose.y) / 2;
                  const dX = anchX;
                  const dY = anchY - eyeDistance * 0.3;
                  targetX = isMirrored ? (1 - dX) : dX;
                  targetY = dY;
                  targetScale = eyeDistance * 7.5;
                  break;
              }

              setActiveSticker({
                type: activeSticker.type,
                x: targetX * 100,
                y: targetY * 100,
                scale: targetScale,
                rotation: isMirrored ? -rotationAngle : rotationAngle
              });
            }
          }

          if (active) {
            animationFrameId = requestAnimationFrame(track);
          }
        };

        track();
      } catch (err) {
        console.error("Error in real-time face tracking loop:", err);
      }
    };

    runTracking();

    return () => {
      active = false;
      cancelAnimationFrame(animationFrameId);
    };
  }, [isOpen, previewUrl, activeSticker?.type, stream, facingMode, cameraError]);

  const handleSelectSticker = async (type: 'dog' | 'glasses' | 'crown' | 'mustache') => {
    const defaultSticker = {
      type,
      x: 50,
      y: 40,
      scale: 1.0,
      rotation: 0
    };
    setActiveSticker(defaultSticker);

    if (previewUrl && previewImageRef.current) {
      try {
        const detector = await getFaceDetector();
        const results = detector.detect(previewImageRef.current);
        if (results.detections && results.detections.length > 0) {
          const keypoints = results.detections[0].keypoints;
          if (keypoints && keypoints.length >= 4) {
            const eyeR = keypoints[0];
            const eyeL = keypoints[1];
            const nose = keypoints[2];
            const mouth = keypoints[3];

            const dx = eyeL.x - eyeR.x;
            const dy = eyeL.y - eyeR.y;
            const eyeDistance = Math.sqrt(dx * dx + dy * dy);
            const rotationAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
            const eyeMidX = (eyeR.x + eyeL.x) / 2;
            const eyeMidY = (eyeR.y + eyeL.y) / 2;

            let targetX = 50;
            let targetY = 40;
            let targetScale = 1.0;

            switch (type) {
              case 'glasses':
                targetX = eyeMidX;
                targetY = eyeMidY;
                targetScale = eyeDistance * 4.5;
                break;
              case 'mustache':
                targetX = (nose.x + mouth.x) / 2;
                targetY = (nose.y + mouth.y) / 2;
                targetScale = eyeDistance * 3.5;
                break;
              case 'crown':
                const angleRad = Math.atan2(dy, dx) - Math.PI / 2;
                const shiftDist = eyeDistance * 1.5;
                targetX = eyeMidX + Math.cos(angleRad) * shiftDist;
                targetY = eyeMidY + Math.sin(angleRad) * shiftDist;
                targetScale = eyeDistance * 5.0;
                break;
              case 'dog':
                const anchX = (eyeMidX + nose.x) / 2;
                const anchY = (eyeMidY + nose.y) / 2;
                targetX = anchX;
                targetY = anchY - eyeDistance * 0.3;
                targetScale = eyeDistance * 7.5;
                break;
            }

            setActiveSticker({
              type,
              x: targetX * 100,
              y: targetY * 100,
              scale: targetScale,
              rotation: rotationAngle
            });
          }
        }
      } catch (err) {
        console.error("Static face detection alignment failed:", err);
      }
    }
  };

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

          // Remove filter before drawing stickers and captions
          ctx.filter = 'none';

          const finalizeBlob = () => {
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

          // Draw active sticker if present
          if (activeSticker) {
            const stickerImg = new Image();
            stickerImg.onload = () => {
              const previewWidth = previewContainerRef.current?.clientWidth || 420;
              const targetX = width * (activeSticker.x / 100);
              const targetY = height * (activeSticker.y / 100);
              const drawW = width * ((STICKERS[activeSticker.type].defaultWidth * activeSticker.scale) / previewWidth);
              const drawH = drawW * (stickerImg.height / stickerImg.width);

              ctx.save();
              ctx.translate(targetX, targetY);
              ctx.rotate((activeSticker.rotation * Math.PI) / 180);
              ctx.drawImage(stickerImg, -drawW / 2, -drawH / 2, drawW, drawH);
              ctx.restore();

              finalizeBlob();
            };
            stickerImg.onerror = () => {
              console.error("Failed to load sticker image for baking, finalizing without sticker");
              finalizeBlob();
            };
            stickerImg.src = STICKERS[activeSticker.type].dataUrl;
          } else {
            finalizeBlob();
          }
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
    setActiveSticker(null);
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

  const renderLensesRow = () => (
    <div className="filter-row w-full overflow-x-auto custom-scrollbar flex gap-3 px-6 py-2 z-30 snap-x relative pointer-events-auto">
      {/* None Option */}
      <button
        type="button"
        onClick={() => setActiveSticker(null)}
        className={`flex flex-col items-center gap-1 shrink-0 snap-center transition-all ${!activeSticker ? 'scale-105 opacity-100' : 'opacity-50 hover:opacity-100 scale-90'}`}
      >
        <div 
          className={`w-12 h-12 rounded-full border-2 ${!activeSticker ? 'border-pink-500 shadow-[0_0_8px_rgba(255,0,127,0.4)]' : 'border-white/20'} overflow-hidden bg-zinc-950 flex items-center justify-center`}
        >
          <span className="text-zinc-500 text-xs font-bold font-mono">Ø</span>
        </div>
        <span className={`text-[9px] font-bold ${!activeSticker ? 'text-pink-500' : 'text-zinc-400'} drop-shadow-md`}>None</span>
      </button>

      {Object.entries(STICKERS).map(([key, sticker]) => (
        <button
          key={key}
          type="button"
          onClick={() => handleSelectSticker(key as any)}
          className={`flex flex-col items-center gap-1 shrink-0 snap-center transition-all ${activeSticker?.type === key ? 'scale-105 opacity-100' : 'opacity-50 hover:opacity-100 scale-90'}`}
        >
          <div 
            className={`w-12 h-12 rounded-full border-2 ${activeSticker?.type === key ? 'border-pink-500 shadow-[0_0_8px_rgba(255,0,127,0.4)]' : 'border-white/20'} overflow-hidden bg-zinc-950 flex items-center justify-center p-1.5`}
          >
            <img src={sticker.dataUrl} alt={sticker.name} className="w-full h-full object-contain" />
          </div>
          <span className={`text-[9px] font-bold ${activeSticker?.type === key ? 'text-pink-500' : 'text-zinc-400'} drop-shadow-md`}>{sticker.name}</span>
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
        <div className="absolute inset-0 flex flex-col justify-between items-center bg-black" ref={previewContainerRef}>
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

          {/* Render active sticker on top of video feed */}
          {!cameraError && activeSticker && (
            <div 
              style={{
                position: 'absolute',
                left: `${activeSticker.x}%`,
                top: `${activeSticker.y}%`,
                transform: `translate(-50%, -50%) scale(${activeSticker.scale}) rotate(${activeSticker.rotation}deg)`,
                cursor: 'move',
                touchAction: 'none'
              }}
              onMouseDown={handleStickerMouseDown}
              onTouchStart={handleStickerTouchStart}
              onTouchMove={handleStickerTouchMove}
              onTouchEnd={handleStickerTouchEnd}
              className="select-none active:scale-[1.02] transition-transform duration-75 z-25 pointer-events-auto"
            >
              <img 
                src={STICKERS[activeSticker.type].dataUrl} 
                alt={activeSticker.type}
                className="pointer-events-none select-none"
                style={{ width: `${STICKERS[activeSticker.type].defaultWidth}px` }}
              />
              <div className="absolute -inset-2 border border-dashed border-white/50 rounded pointer-events-none animate-pulse" />
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
              
              {/* Mode Switcher (Filters vs Lenses) */}
              <div className="flex justify-center gap-6 mb-3 pointer-events-auto shrink-0">
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveMode('filters'); }}
                  className={`text-[10px] uppercase tracking-widest font-black transition-all ${
                    activeMode === 'filters' ? 'text-pink-500 border-b-2 border-pink-500 pb-0.5' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Filters
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveMode('lenses'); }}
                  className={`text-[10px] uppercase tracking-widest font-black transition-all ${
                    activeMode === 'lenses' ? 'text-pink-500 border-b-2 border-pink-500 pb-0.5' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Lenses
                </button>
              </div>

              {/* Slider controls for active lens/sticker */}
              {activeSticker && (
                <div className="mx-6 mb-3 p-3 bg-black/75 border border-white/10 rounded-2xl backdrop-blur-md flex flex-col gap-2 pointer-events-auto shrink-0">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold font-mono">
                      Adjust {STICKERS[activeSticker.type].name}
                    </span>
                    <button 
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveSticker(null); }}
                      className="text-[9px] uppercase tracking-widest text-rose-500 font-bold font-mono hover:text-rose-400"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] text-zinc-500 font-bold font-mono w-10">Size</span>
                      <input 
                        type="range"
                        min="0.4"
                        max="3.0"
                        step="0.05"
                        value={activeSticker.scale}
                        onChange={(e) => setActiveSticker(prev => prev ? { ...prev, scale: parseFloat(e.target.value) } : null)}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        className="flex-1 accent-pink-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] text-zinc-500 font-bold font-mono w-10">Rotate</span>
                      <input 
                        type="range"
                        min="-180"
                        max="180"
                        value={activeSticker.rotation}
                        onChange={(e) => setActiveSticker(prev => prev ? { ...prev, rotation: parseInt(e.target.value) } : null)}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        className="flex-1 accent-pink-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Carousel */}
              <div className="w-full mb-4 shrink-0">
                {activeMode === 'filters' ? renderFilterRow() : renderLensesRow()}
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
              ref={previewImageRef}
              src={previewUrl} 
              alt="Upload preview" 
              crossOrigin="anonymous"
              style={{ filter: activeFilter }}
              className="w-full h-full object-cover pointer-events-none" 
            />
            {/* Vignette */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50 pointer-events-none" />
          </div>

          {/* Render active sticker on top of preview image */}
          {activeSticker && (
            <div 
              style={{
                position: 'absolute',
                left: `${activeSticker.x}%`,
                top: `${activeSticker.y}%`,
                transform: `translate(-50%, -50%) scale(${activeSticker.scale}) rotate(${activeSticker.rotation}deg)`,
                cursor: 'move',
                touchAction: 'none'
              }}
              onMouseDown={handleStickerMouseDown}
              onTouchStart={handleStickerTouchStart}
              onTouchMove={handleStickerTouchMove}
              onTouchEnd={handleStickerTouchEnd}
              className="select-none active:scale-[1.02] transition-transform duration-75 z-25 pointer-events-auto"
            >
              <img 
                src={STICKERS[activeSticker.type].dataUrl} 
                alt={activeSticker.type}
                className="pointer-events-none select-none"
                style={{ width: `${STICKERS[activeSticker.type].defaultWidth}px` }}
              />
              <div className="absolute -inset-2 border border-dashed border-white/50 rounded pointer-events-none animate-pulse" />
            </div>
          )}

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

            {/* Mode Switcher (Filters vs Lenses) */}
            <div className="flex justify-center gap-6 mb-3 pointer-events-auto shrink-0">
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveMode('filters'); }}
                className={`text-[10px] uppercase tracking-widest font-black transition-all ${
                  activeMode === 'filters' ? 'text-pink-500 border-b-2 border-pink-500 pb-0.5' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Filters
              </button>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveMode('lenses'); }}
                className={`text-[10px] uppercase tracking-widest font-black transition-all ${
                  activeMode === 'lenses' ? 'text-pink-500 border-b-2 border-pink-500 pb-0.5' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Lenses
              </button>
            </div>

            {/* Slider controls for active lens/sticker */}
            {activeSticker && (
              <div className="mx-6 mb-3 p-3 bg-black/75 border border-white/10 rounded-2xl backdrop-blur-md flex flex-col gap-2 pointer-events-auto shrink-0">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold font-mono">
                    Adjust {STICKERS[activeSticker.type].name}
                  </span>
                  <button 
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveSticker(null); }}
                    className="text-[9px] uppercase tracking-widest text-rose-500 font-bold font-mono hover:text-rose-400"
                  >
                    Remove
                  </button>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] text-zinc-500 font-bold font-mono w-10">Size</span>
                    <input 
                      type="range"
                      min="0.4"
                      max="3.0"
                      step="0.05"
                      value={activeSticker.scale}
                      onChange={(e) => setActiveSticker(prev => prev ? { ...prev, scale: parseFloat(e.target.value) } : null)}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      className="flex-1 accent-pink-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] text-zinc-500 font-bold font-mono w-10">Rotate</span>
                    <input 
                      type="range"
                      min="-180"
                      max="180"
                      value={activeSticker.rotation}
                      onChange={(e) => setActiveSticker(prev => prev ? { ...prev, rotation: parseInt(e.target.value) } : null)}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      className="flex-1 accent-pink-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Carousel */}
            <div className="w-full mb-4 shrink-0">
              {activeMode === 'filters' ? renderFilterRow() : renderLensesRow()}
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
