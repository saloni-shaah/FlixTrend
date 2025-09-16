"use client";
import React from 'react';
import { motion } from 'framer-motion';

export function FlashPollWars() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-4xl glass-card p-8 text-center"
    >
      <h2 className="text-3xl font-headline text-accent-pink mb-4">Flash Poll Wars</h2>
      <p className="text-gray-400 mb-8">Predict the crowd. Users bet which poll option will win — fast prediction and social pressure make it addictive.</p>
      <div className="text-4xl animate-pulse">⚔️</div>
      <p className="mt-8 text-accent-cyan font-bold">Game UI and Logic Coming Soon!</p>
    </motion.div>
  );
}
