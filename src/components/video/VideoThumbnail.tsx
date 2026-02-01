'use client';

import React from 'react';

export const VideoThumbnail = ({ src, alt }: { src: string; alt: string }) => {
    // Appending #t=0.1 to the video URL is a standard way to hint to the browser
    // that it should show the frame at 0.1 seconds as the poster image.
    return (
        <video
            src={`${src}#t=0.1`}
            className="w-full h-full object-cover"
            preload="metadata"
            muted
            playsInline
            aria-label={alt}
        />
    );
};
