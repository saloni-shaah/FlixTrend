"use client";

import React, { useEffect } from 'react';

declare global {
    interface Window {
        adsbygoogle: any;
    }
}

const AdBanner = () => {
    useEffect(() => {
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (err) {
            console.error(err);
        }
    }, []);

    return (
        <div className="w-full glass-card p-4 text-center my-4">
            <ins className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client="ca-pub-4402800926226975"
                data-ad-slot="YOUR_AD_SLOT_ID" // Replace with your ad slot ID
                data-ad-format="auto"
                data-full-width-responsive="true"></ins>
            <p className="text-xs text-muted-foreground mt-2">Advertisement</p>
        </div>
    );
};

export default AdBanner;
