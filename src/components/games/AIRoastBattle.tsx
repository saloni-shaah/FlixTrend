
"use client";
import React from 'react';
import { motion } from 'framer-motion';

export function AIRoastBattle() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-4xl glass-card p-8 text-center"
    >
      <h2 className="text-3xl font-headline text-accent-purple mb-4">AI Roast Battle</h2>
      <p className="text-gray-400 mb-8">You versus the machine. A witty roast at you; you reply with your roast. Friends vote winner.</p>
      <div className="text-4xl animate-pulse">🔥</div>
      <p className="mt-8 text-accent-cyan font-bold">Game UI and Logic Coming Soon!</p>
    </motion.div>
  );
}
