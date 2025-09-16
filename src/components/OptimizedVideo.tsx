
"use client";

import React from 'react';

const CLOUDINARY_BASE_URL = "https://res.cloudinary.com/drrzvi2jp";

function getCloudinaryId(url: string): string | null {
  const regex = /https?:\/\/res\.cloudinary\.com\/[a-z0-9-]+\/(image|video|raw)\/upload\/(?:v[0-9]+\/)?([a-zA-Z0-9\/_-]+\.[a-zA-Z0-9]+)/;
  const match = url.match(regex);
  return match ? match[2] : null;
}

export function OptimizedVideo({ src, thumbnailUrl, className, width, height }: { src: string; thumbnailUrl?: string; className?: string; width?: number; height?: number; }) {
  
  if (!src.startsWith(CLOUDINARY_BASE_URL)) {
    return <video src={src} poster={thumbnailUrl} className={className} width={width} height={height} controls preload="metadata" />;
  }

  const publicId = getCloudinaryId(src);
  if (!publicId) {
    return <video src={src} poster={thumbnailUrl} className={className} width={width} height={height} controls preload="metadata" />;
  }

  const transformedVideoUrl = `${CLOUDINARY_BASE_URL}/video/upload/f_auto,q_auto,w_800,c_limit/${publicId}`;

  return (
    <video
      src={transformedVideoUrl}
      poster={thumbnailUrl}
      className={className}
      width={width}
      height={height}
      controls
      preload="metadata" // Only load metadata initially
      style={{
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : 'auto',
        aspectRatio: width && height ? `${width}/${height}` : undefined,
      }}
    />
  );
}
