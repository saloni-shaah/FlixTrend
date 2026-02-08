'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioPlayerProps {
  src: string;
  isUser: boolean;
}

const formatTime = (timeInSeconds: number) => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export function AudioPlayer({ src, isUser }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration);
    };

    const updateProgress = () => {
      setProgress(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent message selection
    const audio = audioRef.current;
    if (audio) {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className={cn("flex items-center gap-2 w-full max-w-xs", isUser ? "text-white" : "text-white")} onClick={(e) => e.stopPropagation()}>
       <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
      <button onClick={togglePlayPause} className="p-2 flex-shrink-0">
        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
      </button>
      <div className="flex-grow h-1 rounded-full bg-gray-500/50">
          <div 
              className={cn("h-1 rounded-full", isUser ? "bg-white" : "bg-white")}
              style={{ width: `${(progress / duration) * 100}%` }}
          />
      </div>
      <span className="text-xs font-mono w-10 text-right">{formatTime(duration - progress)}</span>
    </div>
  );
}
