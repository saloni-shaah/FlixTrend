
"use client";
import React from 'react';
import { motion } from 'framer-motion';

export function GeoVibes() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-4xl glass-card p-8 text-center"
    >
      <h2 className="text-3xl font-headline text-accent-green mb-4">Geo Vibes</h2>
      <p className="text-gray-400 mb-8">Check-in with a vibe! Post from unique locations like cafes, parks, or landmarks to collect special Geo-Badges and show off your travels.</p>
      <div className="text-4xl animate-pulse">📍</div>
      <p className="mt-8 text-accent-cyan font-bold">Game UI and Logic Coming Soon!</p>
    </motion.div>
  );
}
