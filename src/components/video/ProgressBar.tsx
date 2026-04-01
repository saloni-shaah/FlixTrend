
"use client";
import React from 'react';

interface ProgressBarProps {
    progress: number;
    onScrub?: (e: React.MouseEvent<HTMLDivElement> | React.ChangeEvent<HTMLInputElement>) => void;
    variant: 'feed' | 'watch' | 'flow';
    progressBarRef?: React.RefObject<HTMLDivElement>;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, onScrub, variant, progressBarRef }) => {
    if (variant === 'feed') {
        return (
            <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
                <div
                    className="h-full bg-accent-pink transition-all duration-100"
                    style={{ width: `${progress}%` }}
                />
            </div>
        );
    }

    if (variant === 'watch') {
        return (
            <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={onScrub as (e: React.ChangeEvent<HTMLInputElement>) => void}
                className="w-full h-1 accent-red-500 cursor-pointer"
            />
        );
    }

    if (variant === 'flow') {
        return (
            <div 
                ref={progressBarRef} 
                className="w-full h-1 bg-white/30 rounded-full mt-3 cursor-pointer pointer-events-auto group"
                onClick={onScrub as (e: React.MouseEvent<HTMLDivElement>) => void}
            >
                <div className="h-full bg-accent-cyan rounded-full relative" style={{ width: `${progress}%` }}>
                   <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity" style={{ transform: 'translateX(50%)' }}/>
                </div>
            </div>
        );
    }

    return null;
};
