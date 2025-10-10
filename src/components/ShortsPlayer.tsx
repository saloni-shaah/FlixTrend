
"use client";

import React from 'react';
import { ShortVibesPlayer } from './ShortVibesPlayer';
import { VibeSpaceLoader } from './VibeSpaceLoader';

export default function ShortsPlayer({ initialPost, initialPosts, onClose }: { initialPost?: any, initialPosts?: any[], onClose: () => void }) {
    
    return (
        <div className="fixed inset-0 z-[110] bg-black">
            <button onClick={onClose} className="absolute top-4 right-4 z-50 text-white bg-black/30 rounded-full p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <ShortVibesPlayer shortVibes={initialPosts || []} initialPost={initialPost} onEndReached={() => {}} hasMore={true} />
        </div>
    );
}
