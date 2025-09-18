
"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FlixTrendLogo } from "@/components/FlixTrendLogo";
import { CheckCircle, Diamond, ShieldCheck, Sparkles, Bot } from "lucide-react";
import { motion } from "framer-motion";
import { auth, db } from "@/utils/firebaseClient";
import { doc, getDoc } from "firebase/firestore";

const premiumFeatures = [
    { icon: <CheckCircle className="text-accent-cyan"/>, text: "Verified Blue Tick on your profile" },
    { icon: <Diamond className="text-accent-pink"/>, text: "Ad-Free Experience across the app" },
    { icon: <Sparkles className="text-brand-gold"/>, text: "Exclusive profile customization options" },
    { icon: <Bot className="text-accent-purple"/>, text: "Early access to new features" },
    { icon: <ShieldCheck className="text-accent-cyan"/>, text: "Premium badge on your profile" },
];

function RewardsSection() {
    const [rewardStatus, setRewardStatus] = useState<'idle' | 'loading' | 'watched'>('idle');

    const handleWatchAd = () => {
        setRewardStatus('loading');
        // Simulate watching an ad
        setTimeout(() => {
            setRewardStatus('watched');
            // In a real app, you would now grant the user AI credits or temporary access.
        }, 2000);
    }

    if (rewardStatus === 'watched') {
        return (
            <div className="text-center bg-green-500/10 p-4 rounded-xl">
                <CheckCircle className="mx-auto text-green-400 mb-2" size={32}/>
                <h4 className="font-bold text-green-400">Ad Watched!</h4>
                <p className="text-xs text-gray-300">You've earned some rewards!</p>
            </div>
        )
    }

    return (
        <button 
            onClick={handleWatchAd}
            disabled={rewardStatus === 'loading'}
            className="w-full px-8 py-3 rounded-full bg-accent-green text-black font-bold text-lg shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-wait"
        >
            {rewardStatus === 'loading' ? "Loading Ad..." : "Watch Ad for Rewards"}
        </button>
    )
}

export default function PremiumPage() {
    const [isPremium, setIsPremium] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkPremiumStatus = async (user: any) => {
            if (!user) {
                setLoading(false);
                return;
            };
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                const premium = data.isPremium && (!data.premiumUntil || data.premiumUntil.toDate() > new Date());
                setIsPremium(premium);
            }
            setLoading(false);
        };
        const unsub = auth.onAuthStateChanged(checkPremiumStatus);
        return () => unsub();
    }, []);

    return (
    <div className="min-h-screen font-body text-white">
      <nav className="w-full flex justify-between items-center px-8 py-4 bg-black/70 border-b border-accent-cyan/20 fixed top-0 left-0 z-50 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-3">
          <FlixTrendLogo size={40} />
          <span className="font-headline text-2xl text-accent-cyan font-bold tracking-wide">FlixTrend</span>
        </Link>
        <Link href="/home" className="px-5 py-2 rounded-full border-2 border-accent-cyan text-accent-cyan font-bold bg-black/30 hover:bg-accent-cyan hover:text-primary transition-all">Back to App</Link>
      </nav>

      <div className="max-w-4xl mx-auto pt-28 pb-20 px-4 flex flex-col items-center">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 md:p-12 w-full max-w-2xl text-center"
        >
            {loading ? (
                 <p className="text-accent-cyan">Loading status...</p>
            ) : isPremium ? (
                 <div className="text-center">
                    <CheckCircle className="mx-auto text-green-400 mb-4" size={48}/>
                    <h1 className="text-3xl font-headline font-bold text-green-400 mb-2">You are a Premium Member!</h1>
                    <p className="text-gray-300">You have unlimited access to all features.</p>
                </div>
            ) : (
                <>
                    <div className="flex justify-center mb-4">
                        <Diamond size={48} className="text-accent-pink animate-glow" />
                    </div>
                    <h1 className="text-4xl font-headline font-bold text-accent-cyan mb-4">Go Premium</h1>
                    <p className="text-gray-300 mb-8">
                        Elevate your experience or watch a quick ad for rewards.
                    </p>

                    <div className="bg-black/20 p-6 rounded-2xl mb-8 text-left">
                        <ul className="space-y-4">
                            {premiumFeatures.map((feature, index) => (
                                <motion.li 
                                    key={index} 
                                    className="flex items-center gap-4"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 + index * 0.1 }}
                                >
                                    {feature.icon}
                                    <span className="text-gray-200">{feature.text}</span>
                                </motion.li>
                            ))}
                        </ul>
                    </div>

                    <div className="mb-6">
                        <p className="text-4xl font-bold text-white">₹80 <span className="text-lg font-normal text-gray-400">/ month</span></p>
                    </div>

                    <button 
                        className="w-full px-10 py-4 rounded-full bg-accent-pink text-white font-bold text-xl shadow-fab-glow hover:scale-105 hover:shadow-lg transition-all duration-200 mb-6"
                    >
                        Upgrade with UPI
                    </button>
                    
                    <div className="flex items-center gap-4 my-4">
                        <hr className="flex-1 border-glass-border"/>
                        <span className="text-gray-400 font-bold">OR</span>
                        <hr className="flex-1 border-glass-border"/>
                    </div>
                    
                    <RewardsSection />
                </>
            )}
        </motion.div>
      </div>
    </div>
  );
}
