
"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlixTrendLogo } from './FlixTrendLogo';

const Star = () => {
    const size = Math.random() * 2 + 1;
    const duration = Math.random() * 2 + 2;
    const left = `${Math.random() * 100}%`;

    return (
        <motion.div
            className="absolute bg-white rounded-full"
            style={{
                width: size,
                height: size,
                left,
            }}
            initial={{ top: '-10%' }}
            animate={{ top: '110%' }}
            transition={{ duration, repeat: Infinity, ease: 'linear' }}
        />
    );
};

export function WelcomeAnimation({ onComplete }: { onComplete: () => void }) {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const sequence = [
            () => setStep(1), // Hyperspace starts
            () => setStep(2), // Welcome text appears
            () => setStep(3), // Fade out
            () => onComplete(), // Animation is done
        ];

        const timeouts = [
            0,    // Start immediately
            2500, // Show text after 2.5s
            4500, // Start fade out after 4.5s
            5500, // Complete after 5.5s
        ];

        const timers = timeouts.map((delay, index) => setTimeout(sequence[index], delay));

        return () => timers.forEach(clearTimeout);
    }, [onComplete]);

    return (
        <AnimatePresence>
            {step < 3 && (
                <motion.div
                    key="animation-overlay"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center overflow-hidden"
                >
                    {/* Starfield */}
                    <AnimatePresence>
                        {step === 1 && (
                            <motion.div
                                key="starfield"
                                initial={{ scale: 0.1, rotate: 0 }}
                                animate={{ scale: 5, rotate: 180 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 3, ease: 'easeIn' }}
                                className="absolute inset-0"
                            >
                                {Array.from({ length: 150 }).map((_, i) => <Star key={i} />)}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Welcome Message */}
                    <AnimatePresence>
                        {step === 2 && (
                            <motion.div
                                key="welcome-message"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5 }}
                                className="z-10 flex flex-col items-center gap-4"
                            >
                                <FlixTrendLogo size={100} />
                                <h1 className="text-4xl font-headline font-bold text-white text-glow">Welcome to the VibeSpace</h1>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
