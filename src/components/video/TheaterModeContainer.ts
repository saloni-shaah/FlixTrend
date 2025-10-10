"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function TheaterModeContainer({ isTheaterMode, setIsTheaterMode, children }: { isTheaterMode: boolean, setIsTheaterMode: (value: boolean) => void, children: React.ReactNode }) {

    if (!isTheaterMode) {
        return (
            <div className="mt-2 w-full rounded-xl overflow-hidden relative bg-black">
                {children}
            </div>
        );
    }
    
    return (
        <AnimatePresence>
            {isTheaterMode && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
                    onClick={() => setIsTheaterMode(false)}
                >
                    <div className="w-full max-w-screen-lg h-auto" onClick={(e) => e.stopPropagation()}>
                        {children}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}