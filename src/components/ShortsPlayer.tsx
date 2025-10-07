
"use client";

import React from 'react';
import { ShortVibesPlayer } from './ShortVibesPlayer';
import { VibeSpaceLoader } from './VibeSpaceLoader';

export default function ShortsPlayer({ shortVibes, onEndReached, hasMore, onClose, isFullScreen }: { shortVibes: any[], onEndReached: () => void, hasMore: boolean, onClose: () => void, isFullScreen: boolean }) {
    if (!shortVibes || shortVibes.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-black">
                <VibeSpaceLoader />
            </div>
        );
    }
    
    return (
        <div className="w-full h-full bg-black">
            {isFullScreen && (
                <button onClick={onClose} className="absolute top-4 right-4 z-50 text-white bg-black/30 rounded-full p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            )}
            <ShortVibesPlayer shortVibes={shortVibes} onEndReached={onEndReached} hasMore={hasMore}/>
        </div>
    );
}
