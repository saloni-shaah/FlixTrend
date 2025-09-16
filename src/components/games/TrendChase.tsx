
"use client";
import React from 'react';
import { motion } from 'framer-motion';

export function TrendChase() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-4xl glass-card p-8 text-center"
    >
      <h2 className="text-3xl font-headline text-accent-pink mb-4">Trend Chase</h2>
      <p className="text-gray-400 mb-8">Can you spot the real vibe? Two posts will appear. One is a certified trend, the other is a fake. Choose wisely and quickly!</p>
      <div className="text-4xl animate-pulse">🕵️‍♂️</div>
      <p className="mt-8 text-accent-cyan font-bold">Game UI and Logic Coming Soon!</p>
    </motion.div>
  );
}
