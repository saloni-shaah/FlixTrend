'use client';

import React, { useEffect, useRef } from 'react';

const AdBanner = ({ id }: { id: string }) => {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    // Check if the ad slot is empty before pushing an ad.
    if (adRef.current && adRef.current.children.length === 0) {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch (err: any) {
        // Don't log the "already filled" error, as we might still see it
        // in race conditions during development.
        if (!err.message.includes("All 'ins' elements")) {
          console.error('AdSense error:', err);
        }
      }
    }
  }, [id]); // Re-run if the ID changes

  return (
    <ins
      ref={adRef}
      className="adsbygoogle"
      id={id} // Add a unique ID to the DOM element as well
      style={{ display: 'block' }}
      data-ad-client={process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID}
      data-ad-slot={process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_AD_SLOT_ID}
      data-ad-format="auto"
      data-full-width-responsive="true"
    ></ins>
  );
};

export default AdBanner;
