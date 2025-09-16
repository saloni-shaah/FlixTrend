"use client";
import React from 'react';
import { motion } from 'framer-motion';

export function RadarHunt() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-4xl glass-card p-8 text-center"
    >
      <h2 className="text-3xl font-headline text-accent-green mb-4">Radar Hunt</h2>
      <p className="text-gray-400 mb-8">The world is your playground. Follow clues posted as vibes in the feed to find AR treasures hidden in the real world. (Requires camera access).</p>
      <div className="text-4xl animate-pulse">🗺️</div>
      <p className="mt-8 text-accent-cyan font-bold">Game UI and Logic Coming Soon!</p>
    </motion.div>
  );
}
