
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { FlixTrendLogo } from './FlixTrendLogo';

const Watermark = () => (
    <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-black/40 text-white py-1 px-2 rounded-full text-xs pointer-events-none z-10">
        <FlixTrendLogo size={16} />
        <span className="font-bold">FlixTrend</span>
    </div>
);

export function FlashModal({ userFlashes, onClose }: { userFlashes: any; onClose: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const goToNext = () => setCurrentIndex(i => (i + 1) % userFlashes.flashes.length);
  const goToPrev = () => setCurrentIndex(i => (i - 1 + userFlashes.flashes.length) % userFlashes.flashes.length);

  useEffect(() => {
    const flash = userFlashes.flashes[currentIndex];
    const isVideo = flash.mediaUrl && flash.mediaUrl.match(/\.(mp4|webm|ogg)$/i);
    setProgress(0);
    
    if (timerRef.current) clearInterval(timerRef.current);
    
    if (!isVideo) {
      timerRef.current = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            goToNext();
            return 0;
          }
          return p + (100 / 50); // 5 seconds duration
        });
      }, 100);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, userFlashes]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={onClose}>
      <div className="relative w-full max-w-lg h-[90vh] flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-2 right-2 text-white text-3xl z-20">&times;</button>
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
            
            {/* Navigation */}
            <button onClick={goToPrev} className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/20 text-white p-2 rounded-full"><FaChevronLeft/></button>
            <button onClick={goToNext} className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/20 text-white p-2 rounded-full"><FaChevronRight/></button>
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
