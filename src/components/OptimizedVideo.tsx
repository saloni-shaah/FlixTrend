
"use client";

import React from 'react';

const CLOUDINARY_BASE_URL = "https://res.cloudinary.com/drrzvi2jp";

function getCloudinaryId(url: string): string | null {
  const regex = /https?:\/\/res\.cloudinary\.com\/[a-z0-9-]+\/(image|video|raw)\/upload\/(?:v[0-9]+\/)?([a-zA-Z0-9\/_-]+\.[a-zA-Z0-9]+)/;
  const match = url.match(regex);
  return match ? match[2] : null;
}

export const OptimizedVideo = React.forwardRef<HTMLVideoElement, { src: string; thumbnailUrl?: string; className?: string; preload?: "auto" | "metadata" | "none"; loop?: boolean; muted?: boolean; [key: string]: any; }>(({ src, thumbnailUrl, className, preload, loop, muted, ...props }, ref) => {
    if (!src) {
        return null; 
    }

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
    };

    const videoProps = {
        ref: ref,
        poster: thumbnailUrl,
        className: `${className} pointer-events-none`,
        preload: preload || "metadata",
        loop: loop,
        muted: muted,
        style: { userSelect: 'none' },
        ...props,
    };

    const isCloudinaryUrl = src.startsWith(CLOUDINARY_BASE_URL);
    const publicId = isCloudinaryUrl ? getCloudinaryId(src) : null;

    if (publicId) {
        const transformedVideoUrl = `${CLOUDINARY_BASE_URL}/video/upload/f_auto,q_auto,w_800,c_limit/${publicId}`;
        return (
            <div className="relative w-full h-full" onContextMenu={handleContextMenu}>
                <video {...videoProps} src={transformedVideoUrl} />
                <div className="absolute inset-0"></div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full" onContextMenu={handleContextMenu}>
            <video {...videoProps} src={src} />
            <div className="absolute inset-0"></div>
        </div>
    );
});

OptimizedVideo.displayName = 'OptimizedVideo';
