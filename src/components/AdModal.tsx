
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import AdBanner from './AdBanner';

export default function AdModal({ onComplete }: { onComplete: () => void }) {
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        if (countdown <= 0) {
            onComplete();
            return;
        }
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [countdown, onComplete]);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4"
            >
                <div className="absolute top-4 right-4 z-10">
                    {countdown > 0 ? (
                        <span className="text-white bg-black/50 rounded-full px-3 py-1 text-sm">You can skip in {countdown}</span>
                    ) : (
                        <button onClick={onComplete} className="text-white bg-black/50 rounded-full px-4 py-2 text-sm flex items-center gap-2">
                            Skip Ad <X size={16} />
                        </button>
                    )}
                </div>
                <div className="w-full max-w-sm">
                    <AdBanner />
                </div>
                <p className="text-xs text-gray-500 mt-4">Sponsored Message</p>
            </motion.div>
        </AnimatePresence>
    );
}
