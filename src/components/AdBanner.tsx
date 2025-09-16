
"use client";

import React, { useEffect, useRef } from 'react';

declare global {
    interface Window {
        adsbygoogle: any;
    }
}

const AdBanner = () => {
    const adPushed = useRef(false);

    useEffect(() => {
        if (!adPushed.current) {
            try {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
                adPushed.current = true;
            } catch (err) {
                console.error(err);
            }
        }
    }, []);

    return (
        <div className="w-full glass-card p-4 text-center my-4">
            <ins className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client="ca-pub-4402800926226975"
                data-ad-slot="7578594077"
                data-ad-format="fluid"
                data-ad-layout-key="-ef+6k-30-ac+ty"></ins>
            <p className="text-xs text-muted-foreground mt-2">Advertisement</p>
        </div>
    );
};

export default AdBanner;
