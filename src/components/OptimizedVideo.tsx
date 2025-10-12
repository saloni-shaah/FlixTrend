
"use client";

import React from 'react';

const CLOUDINARY_BASE_URL = "https://res.cloudinary.com/drrzvi2jp";

function getCloudinaryId(url: string): string | null {
  const regex = /https?:\/\/res\.cloudinary\.com\/[a-z0-9-]+\/(image|video|raw)\/upload\/(?:v[0-9]+\/)?([a-zA-Z0-9\/_-]+\.[a-zA-Z0-9]+)/;
  const match = url.match(regex);
  return match ? match[2] : null;
}

export const OptimizedVideo = React.forwardRef<HTMLVideoElement, { src: string; thumbnailUrl?: string; className?: string; preload?: "auto" | "metadata" | "none"; loop?: boolean; muted?: boolean; [key: string]: any; }>(({ src, thumbnailUrl, className, preload, loop, muted, ...props }, ref) => {
    if (!src.startsWith(CLOUDINARY_BASE_URL)) {
        return <video ref={ref} src={src} poster={thumbnailUrl} className={className} preload={preload || "metadata"} loop={loop} muted={muted} {...props} />;
    }

    const publicId = getCloudinaryId(src);
    if (!publicId) {
        return <video ref={ref} src={src} poster={thumbnailUrl} className={className} preload={preload || "metadata"} loop={loop} muted={muted} {...props} />;
    }

    const transformedVideoUrl = `${CLOUDINARY_BASE_URL}/video/upload/f_auto,q_auto,w_800,c_limit/${publicId}`;

    return (
        <video
            ref={ref}
            src={transformedVideoUrl}
            poster={thumbnailUrl}
            className={className}
            preload={preload || "metadata"}
            loop={loop}
            muted={muted}
            {...props}
        />
    );
});

OptimizedVideo.displayName = 'OptimizedVideo';
