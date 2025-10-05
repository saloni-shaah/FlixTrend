
"use client";

import React, { useEffect, useState, useRef } from 'react';
import { getFirestore, collection, query, where, getDocs, orderBy, limit, startAfter } from "firebase/firestore";
import { app } from "@/utils/firebaseClient";
import Link from 'next/link';

const db = getFirestore(app);

// Fallback Google AdSense component
const AdSenseBanner = () => {
    const adPushed = useRef(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && !adPushed.current) {
            try {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
                adPushed.current = true;
            } catch (err) {
                console.error("AdSense Error:", err);
            }
        }
    }, []);

    return (
        <div className="w-full min-w-[250px] glass-card p-4 text-center my-4">
            <ins className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client="ca-pub-4402800926226975"
                data-ad-slot="3640779681"
                data-ad-format="fluid"
                data-ad-layout-key="-dv+6x-3g-hy+19g"></ins>
            <p className="text-xs text-muted-foreground mt-2">Advertisement</p>
        </div>
    );
};


const FlixTrendAd = ({ ad }: { ad: any }) => {
    if (!ad?.creative) {
        return <AdSenseBanner />; // Fallback if creative is missing
    }

    const { creative } = ad;

    return (
         <div className="w-full glass-card p-4 my-4">
             <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-accent-purple overflow-hidden">
                    {/* In a real app, you'd show the advertiser's logo */}
                    <img src={`https://api.dicebear.com/8.x/initials/svg?seed=${ad.campaign.name}`} alt="advertiser logo" className="w-full h-full" />
                </div>
                <div>
                    <p className="text-sm font-bold">{ad.campaign.name}</p>
                    <p className="text-xs text-gray-400">Sponsored</p>
                </div>
            </div>
            {creative.type === 'image' && creative.mediaUrl && (
                <img src={creative.mediaUrl} alt={creative.headline} className="rounded-lg w-full" />
            )}
            {creative.type === 'video' && creative.mediaUrl && (
                <video src={creative.mediaUrl} className="rounded-lg w-full" controls />
            )}
            <div className="mt-3">
                <p className="font-bold text-accent-cyan">{creative.headline}</p>
                <p className="text-sm text-gray-300">{creative.body}</p>
                 <a href={creative.callToActionUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-accent-pink hover:underline mt-2 inline-block">
                    {creative.callToAction} &rarr;
                </a>
            </div>
        </div>
    )
}

export default function AdBanner() {
    const [ad, setAd] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAd = async () => {
            try {
                // This logic is simplified. A real ad server would be much more complex.
                // 1. Get a random active campaign
                const campaignsRef = collection(db, 'adCampaigns');
                const q = query(campaignsRef, where('status', '==', 'active'), limit(10));
                const campaignSnap = await getDocs(q);

                if (campaignSnap.empty) {
                    setLoading(false);
                    return; // No active campaigns, will fallback to AdSense
                }

                const campaigns = campaignSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                const randomCampaign = campaigns[Math.floor(Math.random() * campaigns.length)];

                // 2. Get a creative for that campaign
                const creativesRef = collection(db, 'adCampaigns', randomCampaign.id, 'creatives');
                const creativeSnap = await getDocs(query(creativesRef, limit(1)));
                
                if (creativeSnap.empty) {
                     setLoading(false);
                     return; // No creative found, will fallback
                }

                const randomCreative = { id: creativeSnap.docs[0].id, ...creativeSnap.docs[0].data() };

                setAd({ campaign: randomCampaign, creative: randomCreative });
                setLoading(false);

            } catch (error) {
                console.error("Error fetching FlixTrend ad:", error);
                setLoading(false); // Fallback to AdSense on error
            }
        }
        fetchAd();
    }, []);
    
    // If there's no direct-sold ad, render the AdSense fallback
    if (!loading && !ad) {
        return <AdSenseBanner />;
    }
    
    // If we have a direct-sold ad, render it
    if (ad) {
        return <FlixTrendAd ad={ad} />;
    }

    // While loading, we can show a placeholder or nothing
    return null;
}
