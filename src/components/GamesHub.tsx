
"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Gamepad2 } from 'lucide-react';

export function GamesHub() {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-4xl glass-card p-8 text-center"
        >
            <div className="text-5xl mb-4 text-accent-green">
                <Gamepad2 size={64} className="mx-auto" />
            </div>
            <h2 className="text-3xl font-headline text-accent-green mb-4">Offline Games Coming Soon!</h2>
            <p className="text-gray-400 mb-8">Get ready for a new collection of 50 offline games you can play anytime, anywhere. We're building something epic for you!</p>
            <div className="text-4xl animate-pulse">🎮</div>
        </motion.div>
    );
}
