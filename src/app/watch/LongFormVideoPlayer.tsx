
"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
} from "lucide-react";
import { OptimizedVideo } from "@/components/OptimizedVideo";
import { Watermark } from "@/components/video/Watermark";
import { TheaterModeContainer } from "@/components/video/TheaterModeContainer";
import { ProgressBar } from "@/components/video/ProgressBar";

interface LongFormVideoPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string;
}

export const LongFormVideoPlayer: React.FC<LongFormVideoPlayerProps> = ({
  videoUrl,
  thumbnailUrl,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const togglePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(console.error);
      } else {
        videoRef.current.pause();
      }
    }
  }, []);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseFloat(e.target.value);
    setProgress(newProgress);
    if (videoRef.current && duration > 0) {
      videoRef.current.currentTime = (newProgress / 100) * duration;
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video && video.duration > 0) {
        const currentProgress = (video.currentTime / video.duration) * 100;
        if(isFinite(currentProgress)){
            setProgress(currentProgress);
        }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
        containerRef.current?.requestFullscreen().catch(err => {
            alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else {
        document.exitFullscreen();
    }
  };
  
  useEffect(() => {
      const handleFullscreenChange = () => {
          setIsFullScreen(!!document.fullscreenElement);
      }
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);


  const toggleTheaterMode = () => {
    setIsTheaterMode(!isTheaterMode);
  };

  const formatTime = (timeInSeconds: number) => {
    const time = Math.floor(timeInSeconds);
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const hideControls = () => setShowControls(false);

    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        if (isPlaying) {
            controlsTimeoutRef.current = setTimeout(hideControls, 3000);
        }
    };
    
    const handleMouseLeave = () => {
        if (isPlaying) {
            hideControls();
        }
    };

    if (!isPlaying) {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
    }
    
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseleave', handleMouseLeave);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
    };
  }, [isPlaying]);
  

  if (!videoUrl) return null;

  return (
    <TheaterModeContainer isTheaterMode={isTheaterMode}>
      <div
        ref={containerRef}
        className="w-full h-full relative bg-black group"
        onClick={togglePlayPause}
        onDoubleClick={toggleFullScreen}
      >
        <OptimizedVideo
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain"
          playsInline
          preload="metadata"
          muted={isMuted}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          poster={thumbnailUrl}
        />
        
        {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
              <Play size={60} className="text-white opacity-80" fill="white" />
            </div>
        )}

        <Watermark />

        <div
          className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent transition-opacity duration-300 ${
            showControls ? "opacity-100" : "opacity-0"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <ProgressBar progress={progress} onScrub={handleProgressChange} variant="watch" />

          <div className="flex items-center justify-between text-white mt-2">
            <div className="flex items-center space-x-4">
              <button onClick={togglePlayPause}>
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
              <div className="flex items-center space-x-2">
                <button onClick={toggleMute}>
                  {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-24 h-1 accent-white cursor-pointer"
                />
              </div>
              <span>
                {formatTime(videoRef.current?.currentTime || 0)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <button onClick={toggleTheaterMode}>
                {isTheaterMode ? <Minimize size={24} /> : <Maximize size={24} />}
              </button>
              <button onClick={toggleFullScreen}>
                 {isFullScreen ? <Minimize size={24} /> : <Maximize size={24} />}
              </button>
              <button>
                <Settings size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </TheaterModeContainer>
  );
};
