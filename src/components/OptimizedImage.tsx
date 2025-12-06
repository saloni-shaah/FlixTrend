
"use client";

import React from 'react';

const CLOUDINARY_BASE_URL = "https://res.cloudinary.com/drrzvi2jp";

function getCloudinaryId(url: string): string | null {
  const regex = /https?:\/\/res\.cloudinary\.com\/[a-z0-9-]+\/(image|video|raw)\/upload\/(?:v[0-9]+\/)?([a-zA-Z0-9\/_-]+\.[a-zA-Z0-9]+)/;
  const match = url.match(regex);
  return match ? match[2] : null;
}

const imageBreakpoints = [400, 600, 800, 1200, 1600];

export function OptimizedImage({ src, alt, className, width, height }: { src: string; alt: string; className?: string; width?: number; height?: number; }) {
  if (!src) {
    return null; // Don't render anything if there's no src
  }
  
  const isCloudinaryUrl = src.startsWith(CLOUDINARY_BASE_URL);

  if (isCloudinaryUrl) {
    const publicId = getCloudinaryId(src);
    if (!publicId) {
       // Fallback for Cloudinary URLs that don't match the regex
       return <img src={src} alt={alt} className={className} width={width} height={height} loading="lazy" />;
    }

    const getTransformedUrl = (w: number) => {
      return `${CLOUDINARY_BASE_URL}/image/upload/f_auto,q_auto,w_${w}/${publicId}`;
    };

    const srcSet = imageBreakpoints.map(w => `${getTransformedUrl(w)} ${w}w`).join(', ');

    return (
      <img
        src={getTransformedUrl(imageBreakpoints[1])} // Default src
        srcSet={srcSet}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 800px"
        alt={alt}
        className={className}
        loading="lazy"
        decoding="async"
        width={width}
        height={height}
        style={{
          width: width ? `${width}px` : '100%',
          height: height ? `${height}px` : 'auto',
          aspectRatio: width && height ? `${width}/${height}` : undefined,
        }}
      />
    );
  }

  // Default behavior for non-Cloudinary images (e.g., Firebase Storage)
  return <img src={src} alt={alt} className={className} width={width} height={height} loading="lazy" />;
}
