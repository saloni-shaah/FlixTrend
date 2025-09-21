
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FlixTrendLogo } from './FlixTrendLogo';

const Watermark = () => (
    <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-black/40 text-white py-1 px-2 rounded-full text-xs pointer-events-none z-10">
        <FlixTrendLogo size={16} />
        <span className="font-bold">FlixTrend</span>
    </div>
);

export default function FlashModal({ userFlashes, onClose }: { userFlashes: any; onClose: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef(0);

  const goToNext = useCallback(() => {
    setCurrentIndex(i => {
        if (i < userFlashes.flashes.length - 1) {
            return i + 1;
        }
        onClose(); // Close modal after the last flash
        return i;
    });
  }, [userFlashes.flashes.length, onClose]);

  const goToPrev = useCallback(() => {
    setCurrentIndex(i => (i > 0 ? i - 1 : 0));
  }, []);

  useEffect(() => {
    const flash = userFlashes.flashes[currentIndex];
    const isVideo = flash.mediaUrl && flash.mediaUrl.match(/\.(mp4|webm|ogg)$/i);
    setProgress(0);
    
    if (timerRef.current) clearInterval(timerRef.current);
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
    }

    const duration = 15; // All flashes are 15 seconds
    
    if (flash.song && flash.song.preview_url) {
        const audio = new Audio(flash.song.preview_url);
        audioRef.current = audio;
        audio.currentTime = flash.song.snippetStart || 0;
        audio.play().catch(e => console.error("Audio play failed", e));
        
        audio.addEventListener('ended', goToNext);
    }
    
    if (!isVideo) {
      timerRef.current = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            goToNext();
            return 0;
          }
          return p + (100 / (duration * 10)); // duration in seconds
        });
      }, 100);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.removeEventListener('ended', goToNext);
      }
    };
  }, [currentIndex, userFlashes, goToNext]);
  
  // Keyboard and click navigation
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'ArrowRight') goToNext();
          if (e.key === 'ArrowLeft') goToPrev();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev]);

  const handleContainerClick = (e: React.MouseEvent) => {
      const { clientX, currentTarget } = e;
      const { left, width } = currentTarget.getBoundingClientRect();
      const clickPosition = clientX - left;
      if (clickPosition < width / 3) {
          goToPrev();
      } else {
          goToNext();
      }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartX.current;
    if (Math.abs(deltaX) > 50) { // Swipe threshold
      if (deltaX < 0) { // Swipe left
        goToNext();
      } else { // Swipe right
        goToPrev();
      }
    }
  };


  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    }
  };
  const handleVideoEnded = () => {
      goToNext();
  };

  const currentFlash = userFlashes.flashes[currentIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="relative w-full max-w-lg h-[90vh] flex flex-col items-center justify-center cursor-pointer" onClick={handleContainerClick}>
        <button onClick={(e) => { e.stopPropagation(); onClose();}} className="absolute top-2 right-2 text-white text-3xl z-20">&times;</button>
        {/* Progress Bars */}
        <div className="absolute top-4 left-2 right-2 flex gap-1 z-20">
            {userFlashes.flashes.map((_:any, idx:number) => (
                <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full">
                    <div className="h-full bg-white rounded-full" style={{ width: `${idx === currentIndex ? progress : (idx < currentIndex ? 100 : 0)}%` }}/>
                </div>
            ))}
        </div>
        
        <div className="w-full h-full relative">
            {currentFlash.mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                <div className="relative w-full h-full">
                    <video
                        ref={videoRef}
                        src={currentFlash.mediaUrl}
                        className="w-full h-full object-contain"
                        autoPlay
                        onTimeUpdate={handleVideoTimeUpdate}
                        onEnded={handleVideoEnded}
                    />
                    <Watermark />
                </div>
            ) : (
                <div className="relative w-full h-full">
                    <img src={currentFlash.mediaUrl} alt="flash" className="w-full h-full object-contain" />
                    <Watermark />
                </div>
            )}
        </div>

        {currentFlash.caption && (
          <div className="absolute bottom-10 left-4 right-4 text-white text-center font-semibold p-2 bg-black/50 rounded-lg">
            {currentFlash.caption}
          </div>
        )}
      </div>
    </div>
  );
}
