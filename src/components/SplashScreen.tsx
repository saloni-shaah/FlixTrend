
"use client";

import React from 'react';
import Lottie from 'lottie-react';
import animationData from './animations/splash-animation.json';
import { motion } from 'framer-motion';

export function SplashScreen() {
  return (
    <motion.div 
      className="min-h-screen w-full flex flex-col items-center justify-center bg-background"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Lottie animationData={animationData} loop={true} style={{ width: 300, height: 300 }} />
      <h1 className="text-3xl font-headline text-accent-cyan font-bold mt-4 animate-glow">
        FlixTrend
      </h1>
    </motion.div>
  );
}
