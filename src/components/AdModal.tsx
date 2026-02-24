'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import AdBanner from './AdBanner'; // Import the new AdBanner component

const AdModal = ({ onComplete }: { onComplete: () => void }) => {
    const [countdown, setCountdown] = useState(15); // Total ad duration
    const [showSkip, setShowSkip] = useState(false);
    const timerRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        // Timer to show the skip button
        const skipTimer = setTimeout(() => {
            setShowSkip(true);
        }, 5000); // Show skip button after 5 seconds

        // Timer for the ad countdown
        timerRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    onComplete(); // Ad is finished
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            clearTimeout(skipTimer);
            clearInterval(timerRef.current);
        };
    }, [onComplete]);

    const handleSkip = () => {
        clearInterval(timerRef.current);
        onComplete();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-lg">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative w-[70vw] h-[70vh] max-w-4xl max-h-2xl bg-black border-2 border-brand-gold rounded-lg shadow-2xl shadow-brand-gold/20 flex flex-col items-center justify-center p-4"
            >
                {/* Live AdSense Unit */}
                <div className="w-full h-full bg-gray-900 rounded-md flex items-center justify-center">
                    <AdBanner />
                </div>

                <div className="absolute bottom-4 right-4 flex items-center gap-4">
                    <span className="text-white bg-black/50 px-3 py-1 rounded-md text-sm">
                        Ad will end in {countdown}s
                    </span>
                    {showSkip && (
                        <button
                            onClick={handleSkip}
                            className="bg-white/10 text-white backdrop-blur-xl px-4 py-2 rounded-lg hover:bg-white/20 transition-all"
                        >
                            Skip Ad
                        </button>
                    )}
                </div>
                 <div className="absolute top-4 left-4">
                    <span className="text-xs font-bold bg-brand-gold text-black px-2 py-1 rounded-md">AD</span>
                 </div>
            </motion.div>
        </div>
    );
};

export default AdModal;
