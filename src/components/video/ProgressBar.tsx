import React, { useRef, useCallback, useEffect, useState } from "react";

interface ProgressBarProps {
  progress: number;
  onScrub?: (percentage: number) => void;
  onScrubStart?: () => void;
  onScrubEnd?: () => void;
  variant?: "feed" | "watch" | "flow";
  currentTime?: number;
  duration?: number;
}

const formatTime = (timeInSeconds: number) => {
  if (isNaN(timeInSeconds) || timeInSeconds < 0) return "00:00";
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  onScrub,
  onScrubStart,
  onScrubEnd,
  variant = "feed",
  currentTime = 0,
  duration = 0,
}) => {
  const barRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const updateProgress = useCallback(
    (clientX: number) => {
      if (!barRef.current || !onScrub) return;
      const rect = barRef.current.getBoundingClientRect();
      const percentage = ((clientX - rect.left) / rect.width) * 100;
      onScrub(Math.max(0, Math.min(100, percentage)));
    },
    [onScrub]
  );

  const handleMouseMove = useCallback((e: MouseEvent) => {
    updateProgress(e.clientX);
  }, [updateProgress]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    onScrubEnd?.();
  }, [onScrubEnd]);

  // Handle Touch for Mobile
  const handleTouchMove = useCallback((e: TouchEvent) => {
    updateProgress(e.touches[0].clientX);
  }, [updateProgress]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  const onMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents video play/pause
    setIsDragging(true);
    onScrubStart?.();
    updateProgress(e.clientX);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    onScrubStart?.();
    updateProgress(e.touches[0].clientX);
  };

  return (
    <div className="w-full flex items-center gap-3 group select-none pointer-events-auto py-2">
      {variant === "flow" && (
        <span className="text-[10px] font-mono text-white/80 w-8">{formatTime(currentTime)}</span>
      )}
      
      <div
        ref={barRef}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        className="relative flex-1 h-1.5 bg-white/20 rounded-full cursor-pointer"
      >
        <div
          className="absolute top-0 left-0 h-full bg-purple-500 rounded-full flex items-center justify-end"
          style={{ width: `${progress}%` }}
        >
          {variant !== "feed" && (
            <div 
              className={`w-3 h-3 bg-white rounded-full shadow-xl border border-purple-400 transition-transform ${
                isDragging ? "scale-150" : "scale-100"
              } ${variant === 'watch' ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`} 
              style={{ marginRight: '-6px' }} 
            />
          )}
        </div>
      </div>

      {variant === "flow" && (
        <span className="text-[10px] font-mono text-white/80 w-8 text-right">{formatTime(duration)}</span>
      )}
    </div>
  );
};