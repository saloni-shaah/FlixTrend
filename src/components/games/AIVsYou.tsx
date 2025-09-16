
"use client";
import React from 'react';
import { motion } from 'framer-motion';

export function AIVsYou() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-4xl glass-card p-8 text-center"
    >
      <h2 className="text-3xl font-headline text-accent-purple mb-4">AI vs You</h2>
      <p className="text-gray-400 mb-8">It's a high-speed trivia showdown. Face off against Almighty AI in a battle of wits. Can you outsmart the algorithm?</p>
      <div className="text-4xl animate-pulse">⚡</div>
      <p className="mt-8 text-accent-cyan font-bold">Game UI and Logic Coming Soon!</p>
    </motion.div>
  );
}
