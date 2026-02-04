"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FlixTrendLogo } from "./FlixTrendLogo";
import Image from "next/image";

// --- Keyframes and Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
  exit: { opacity: 0, transition: { duration: 0.5, delay: 0.5 } },
};

const textVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const glitchVariants = {
  hidden: { opacity: 0, filter: 'blur(5px)', skewX: '15deg' },
  visible: {
    opacity: 1,
    filter: 'blur(0px)',
    skewX: '0deg',
    transition: { duration: 0.05 },
  },
  exit: { opacity: 0, filter: 'blur(5px)', skewX: '-15deg' },
};

const glitchWords = ["VIBE", "CONNECT", "SECURE"];
const landmarks = [
    { name: "Paris", src: "https://picsum.photos/seed/paris/800/600", hint: "eiffel tower" },
    { name: "Agra", src: "https://picsum.photos/seed/agra/800/600", hint: "taj mahal" },
    { name: "New York", src: "https://picsum.photos/seed/nyc/800/600", hint: "statue liberty" },
    { name: "Tokyo", src: "https://picsum.photos/seed/tokyo/800/600", hint: "tokyo tower" },
];

function WorldTourAnimation() {
    const [wordIndex, setWordIndex] = useState(0);
    const [landmarkIndex, setLandmarkIndex] = useState(0);

    useEffect(() => {
        const wordInterval = setInterval(() => {
            setWordIndex(prev => (prev + 1) % glitchWords.length);
        }, 100); // Fast-paced glitch effect

        const landmarkInterval = setInterval(() => {
            setLandmarkIndex(prev => (prev + 1) % landmarks.length);
        }, 800);

        return () => {
            clearInterval(wordInterval);
            clearInterval(landmarkInterval);
        };
    }, []);

    return (
        <motion.div
            key="world-tour"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
            className="absolute inset-0 flex flex-col items-center justify-center gap-6 overflow-hidden"
        >
            <AnimatePresence>
                <motion.div
                    key={landmarkIndex}
                    className="absolute inset-0 z-0"
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <Image
                        src={landmarks[landmarkIndex].src}
                        alt={landmarks[landmarkIndex].name}
                        fill
                        style={{ objectFit: 'cover' }}
                        className="opacity-20"
                        data-ai-hint={landmarks[landmarkIndex].hint}
                    />
                </motion.div>
            </AnimatePresence>

             <div className="absolute inset-0 z-10 bg-black/70 backdrop-blur-md"></div>
             <div 
                className="absolute inset-0 z-10"
                style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.05), rgba(255,255,255,0.05) 1px, transparent 1px, transparent 4px)',
                    backgroundSize: '100% 4px',
                    animation: 'scanline 10s linear infinite'
                }}
             ></div>


            <div className="relative z-20 flex flex-col items-center gap-4 text-center">
                 <motion.div variants={textVariants}>
                    <FlixTrendLogo size={100} />
                </motion.div>
                <div className="h-20 w-80 text-center">
                    <AnimatePresence mode="wait">
                        <motion.h1
                            key={wordIndex}
                            variants={glitchVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="text-6xl font-headline font-bold text-accent-cyan text-glow"
                        >
                            {glitchWords[wordIndex]}
                        </motion.h1>
                    </AnimatePresence>
                </div>
                 <div className="h-8">
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={landmarkIndex}
                            className="text-lg text-white font-semibold tracking-widest"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            {landmarks[landmarkIndex].name.toUpperCase()}
                        </motion.p>
                    </AnimatePresence>
                 </div>
            </div>
        </motion.div>
    );
}


function FinalWelcomeAnimation() {
  return (
    <motion.div
      key="final-welcome"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={containerVariants}
      className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black"
    >
      <motion.div variants={textVariants}>
        <FlixTrendLogo size={120} />
      </motion.div>
      <motion.h1
        className="text-5xl md:text-6xl font-headline font-bold text-white text-center"
        variants={textVariants}
      >
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-pink to-accent-cyan">
          Welcome to the FlixTrend Universe
        </span>
      </motion.h1>
      <motion.p
        className="text-lg md:text-xl text-gray-300 font-light"
        variants={textVariants}
        transition={{ delay: 0.2 }}
      >
        Where trend finds you first.
      </motion.p>
    </motion.div>
  );
}


export function WelcomeAnimation({ onComplete }: { onComplete: () => void }) {
  const [stage, setStage] = useState<'intro' | 'tour' | 'final'>('intro');

  useEffect(() => {
    const introTimer = setTimeout(() => setStage('tour'), 1000); // FlixTrend Logo
    const tourTimer = setTimeout(() => setStage('final'), 5000); // Glitch + World Tour
    const finalTimer = setTimeout(() => onComplete(), 7500); // Final Welcome

    return () => {
      clearTimeout(introTimer);
      clearTimeout(tourTimer);
      clearTimeout(finalTimer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[999] bg-black">
        <style>{`
            @keyframes scanline {
                0% { background-position: 0 0; }
                100% { background-position: 0 -100vh; }
            }
        `}</style>
      <AnimatePresence mode="wait">
        {stage === 'intro' && (
             <motion.div
                key="intro"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center"
             >
                <FlixTrendLogo size={120} />
             </motion.div>
        )}
        {stage === 'tour' && <WorldTourAnimation />}
        {stage === 'final' && <FinalWelcomeAnimation />}
      </AnimatePresence>
    </div>
  );
}
