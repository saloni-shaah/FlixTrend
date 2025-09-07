
"use client";
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const Dot = ({ x, y }: { x: number; y: number }) => {
  const delay = Math.random() * 2;
  return (
    <motion.div
      className="absolute rounded-full bg-accent-cyan"
      style={{
        width: '4px',
        height: '4px',
        left: `${x}%`,
        top: `${y}%`,
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: [0, 1, 0.5, 1], opacity: [0, 1, 1, 0] }}
      transition={{
        duration: 2.5,
        repeat: Infinity,
        repeatType: 'loop',
        delay,
        ease: 'easeInOut',
      }}
    />
  );
};

const dots = Array.from({ length: 50 }, () => ({
  x: Math.random() * 100,
  y: Math.random() * 100,
}));

export function VibeSpaceLoader() {
  const lines = [
    "thx for dropping into FlixTrend.",
    "ur safe here. fr.",
    "meet Almighty, ur personal AI genius.",
    "Voltix security is on lock w/ lazer-tech shields.",
    "this is ur universe, in ur pocket.",
    "welcome to the future.",
  ];

  const [currentLine, setCurrentLine] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLine(prev => (prev + 1) % lines.length);
    }, 4000); // Change text every 4 seconds
    return () => clearInterval(interval);
  }, [lines.length]);

  return (
    <div className="relative w-full h-96 flex flex-col items-center justify-center text-center overflow-hidden rounded-2xl bg-black/50 p-4">
      {/* Background Dot Animation */}
      {dots.map((dot, i) => (
        <Dot key={i} x={dot.x} y={dot.y} />
      ))}
      
      {/* Foreground Content */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <div className="w-full text-center">
          <div className="font-headline text-lg md:text-xl text-accent-cyan overflow-hidden whitespace-nowrap animate-typing border-r-2 border-r-accent-cyan">
             {lines[currentLine]}
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-400 max-w-sm">
          Loading the latest vibes from across the universe...
        </p>
      </div>
    </div>
  );
}
