"use client";
import React from 'react';
import { motion } from 'framer-motion';

export function SpotTheFake() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-4xl glass-card p-8 text-center"
    >
      <h2 className="text-3xl font-headline text-accent-cyan mb-4">Spot the Fake</h2>
      <p className="text-gray-400 mb-8">One of these is not like the other. We'll show you two posts—one is real, one is AI-generated. Can your keen eye tell the difference?</p>
      <div className="text-4xl animate-pulse">🤖</div>
      <p className="mt-8 text-accent-pink font-bold">Game UI and Logic Coming Soon!</p>
    </motion.div>
  );
}
