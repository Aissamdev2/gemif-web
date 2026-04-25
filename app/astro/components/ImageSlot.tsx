'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface ImageSlotProps {
  src?: string;
  alt: string;
  caption?: string;
}

export default function ImageSlot({ src, alt, caption }: ImageSlotProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Bloqueja l'scroll quan la imatge està expandida
  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isExpanded]);

  return (
    <div className="my-12">
      {/* Inline View */}
      <div className="relative aspect-video group overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shadow-lg">
        {src ? (
          <div className="relative w-full h-full">
            <Image
              src={src}
              alt={alt}
              fill
              className="object-contain cursor-zoom-in transition-transform duration-500 group-hover:scale-105"
              onClick={() => setIsExpanded(true)}
              sizes="(max-width: 896px) 100vw, 896px"
              priority
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400">
            <p>Espai per a la Infografia</p>
          </div>
        )}
        
        <button 
          onClick={() => setIsExpanded(true)}
          className="absolute bottom-4 right-4 p-2 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-colors z-10"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>

      {caption && (
        <p className="mt-4 text-center text-xs text-slate-500 italic px-4">
          {caption}
        </p>
      )}

      {/* Expanded Modal View */}
      {isExpanded && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 p-4 md:p-8"
          onClick={() => setIsExpanded(false)}
        >
          <div className="relative w-full h-full max-w-7xl max-h-screen">
            <Image
              src={src || ''}
              alt={alt}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>
          
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(false);
            }}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors z-[110]"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
