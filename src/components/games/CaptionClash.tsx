"use client";
import React from 'react';
import { motion } from 'framer-motion';

export function CaptionClash() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-4xl glass-card p-8 text-center"
    >
      <h2 className="text-3xl font-headline text-brand-gold mb-4">Caption Clash</h2>
      <p className="text-gray-400 mb-8">You're the comedian. We provide the image, you provide the wit. Submit your best caption and let the community vote for the winner.</p>
      <div className="text-4xl animate-pulse">🎤</div>
      <p className="mt-8 text-accent-pink font-bold">Game UI and Logic Coming Soon!</p>
    </motion.div>
  );
}
