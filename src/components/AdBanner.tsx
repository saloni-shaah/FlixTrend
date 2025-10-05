
"use client";

import React, { useEffect, useState, useRef } from 'react';
import { getFirestore, collection, query, where, getDocs, orderBy, limit, startAfter } from "firebase/firestore";
import { app } from "@/utils/firebaseClient";
import Link from 'next/link';

const db = getFirestore(app);

const FlixTrendAd = ({ ad }: { ad: any }) => {
    if (!ad?.creative) {
        return null; // Don't render if creative is missing
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

    useEffect(() => {
        const fetchAd = async () => {
            try {
                // This logic is simplified. A real ad server would be much more complex.
                // 1. Get a random active campaign
                const campaignsRef = collection(db, 'adCampaigns');
                const q = query(campaignsRef, where('status', '==', 'active'), limit(10));
                const campaignSnap = await getDocs(q);

                if (campaignSnap.empty) {
                    return; // No active campaigns
                }

                const campaigns = campaignSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                const randomCampaign = campaigns[Math.floor(Math.random() * campaigns.length)];

                // 2. Get a creative for that campaign
                const creativesRef = collection(db, 'adCampaigns', randomCampaign.id, 'creatives');
                const creativeSnap = await getDocs(query(creativesRef, limit(1)));
                
                if (creativeSnap.empty) {
                     return; // No creative found
                }

                const randomCreative = { id: creativeSnap.docs[0].id, ...creativeSnap.docs[0].data() };

                setAd({ campaign: randomCampaign, creative: randomCreative });

            } catch (error) {
                console.error("Error fetching FlixTrend ad:", error);
            }
        }
        fetchAd();
    }, []);
    
    // If we have a direct-sold ad, render it. Otherwise, render nothing.
    if (ad) {
        return <FlixTrendAd ad={ad} />;
    }

    return null;
}
