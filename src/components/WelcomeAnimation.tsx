"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FlixTrendLogo } from "./FlixTrendLogo";

// Helper: random number generator
const rand = (min: number, max: number) => Math.random() * (max - min) + min;

// ✨ Star Particle
const Star = ({ delay }: { delay?: number }) => {
  const size = rand(1, 2.2);
  const duration = rand(2, 4);
  const x = rand(0, 100);
  const y = rand(0, 100);

  return (
    <motion.div
      className="absolute bg-white rounded-full opacity-90"
      style={{
        width: size,
        height: size,
        top: `${y}%`,
        left: `${x}%`,
      }}
      animate={{
        opacity: [0, 1, 0.8, 0],
        scale: [1, 1.2, 1],
        y: ["0%", "-200%"],
      }}
      transition={{
        delay: delay || 0,
        duration,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
};

// 🌌 Nebula Dust Effect
const Nebula = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {Array.from({ length: 40 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-gradient-to-r from-purple-500/40 to-blue-500/40 blur-3xl"
          style={{
            width: rand(150, 400),
            height: rand(150, 400),
            top: `${rand(0, 100)}%`,
            left: `${rand(0, 100)}%`,
          }}
          animate={{
            x: [0, rand(-100, 100)],
            y: [0, rand(-100, 100)],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: rand(6, 12),
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// 🌠 Warp Tunnel Lines
const WarpTunnel = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {Array.from({ length: 60 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute bg-gradient-to-b from-cyan-400 to-transparent opacity-60"
          style={{
            width: rand(0.5, 1.5),
            height: rand(30, 100),
            left: `${rand(0, 100)}%`,
            top: `${rand(0, 100)}%`,
            transformOrigin: "center",
          }}
          animate={{
            y: ["0%", "150%"],
            opacity: [0, 1, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: rand(0.5, 1.2),
            repeat: Infinity,
            ease: "easeIn",
          }}
        />
      ))}
    </div>
  );
};

// 💫 Cosmic Flare Burst
const Flare = () => {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: [0, 1, 0], scale: [0.5, 4, 6] }}
      transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
    >
      <div className="w-[200px] h-[200px] bg-gradient-to-r from-fuchsia-500 to-cyan-400 rounded-full blur-3xl opacity-50" />
    </motion.div>
  );
};

// 🚀 Main Welcome Animation
export function WelcomeAnimation({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const sequence = [
      () => setPhase(1), // Warp start
      () => setPhase(2), // Enter nebula zone
      () => setPhase(3), // Show logo + welcome
      () => setPhase(4), // Fade out
      () => onComplete(),
    ];

    const timeouts = [0, 3000, 5500, 8500, 9500];
    const timers = timeouts.map((t, i) => setTimeout(sequence[i], t));
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase < 4 && (
        <motion.div
          key="welcome-overlay"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="fixed inset-0 z-[999] bg-black flex items-center justify-center overflow-hidden"
        >
          {/* PHASE 1: Warp Speed */}
          {phase === 1 && (
            <motion.div
              key="warp"
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              <WarpTunnel />
              {Array.from({ length: 60 }).map((_, i) => (
                <Star key={i} delay={rand(0, 2)} />
              ))}
              <Flare />
            </motion.div>
          )}

          {/* PHASE 2: Nebula Space */}
          {phase === 2 && (
            <motion.div
              key="nebula"
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 2 }}
            >
              <Nebula />
              {Array.from({ length: 100 }).map((_, i) => (
                <Star key={i} delay={rand(0, 2)} />
              ))}
            </motion.div>
          )}

          {/* PHASE 3: Welcome Logo & Text */}
          {phase === 3 && (
            <motion.div
              key="welcome"
              className="z-10 flex flex-col items-center gap-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
            >
              <motion.div
                initial={{ rotate: -10, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              >
                <FlixTrendLogo size={120} />
              </motion.div>

              <motion.h1
                className="text-5xl md:text-6xl font-headline font-bold text-white text-center tracking-wide"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 1 }}
              >
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500">
                  Welcome to FlixTrend
                </span>
              </motion.h1>

              <motion.p
                className="text-lg md:text-xl text-gray-300 font-light"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 1 }}
              >
                The Future of Social — Built for the Next Universe 🌌
              </motion.p>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
