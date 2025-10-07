
"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FlixTrendLogo } from "./FlixTrendLogo";

// --- Utility Functions ---
const rand = (min: number, max: number) => Math.random() * (max - min) + min;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

// ====================================================================================
// ===== ANIMATION 1: HYPERSPACE (The original one I made) ============================
// ====================================================================================
const StarV1 = () => (
    <motion.div
        className="absolute bg-white rounded-full"
        initial={{ opacity: 0, scale: rand(0.3, 1) }}
        animate={{ opacity: [0, 1, 0], x: [0, rand(-400, 400)], y: [0, rand(-400, 400)] }}
        transition={{ duration: rand(1, 2), ease: "easeOut", repeat: Infinity, repeatDelay: rand(0, 1) }}
        style={{
            top: '50%',
            left: '50%',
            width: rand(1, 3),
            height: rand(1, 3),
        }}
    />
);

function HyperspaceAnimation() {
    return (
        <motion.div
            key="hyperspace"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-6"
        >
            <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1, rotate: 360 }}
                transition={{ duration: 1.5, ease: 'circOut' }}
            >
                <FlixTrendLogo size={120} />
            </motion.div>
            {Array.from({ length: 100 }).map((_, i) => <StarV1 key={i} />)}
            <motion.h1
                className="text-4xl font-headline font-bold text-white text-glow"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 1 }}
            >
                Engaging VibeSpace...
            </motion.h1>
        </motion.div>
    );
}


// ====================================================================================
// ===== ANIMATION 2: NEBULA JOURNEY (The second one you provided) ====================
// ====================================================================================
const StarV2 = ({ delay }: { delay?: number }) => {
  const size = rand(1, 2.2);
  const duration = rand(2, 4);
  const x = rand(0, 100);
  const y = rand(0, 100);

  return (
    <motion.div
      className="absolute bg-white rounded-full opacity-90"
      style={{ width: size, height: size, top: `${y}%`, left: `${x}%` }}
      animate={{ opacity: [0, 1, 0.8, 0], scale: [1, 1.2, 1], y: ["0%", "-200%"] }}
      transition={{ delay: delay || 0, duration, repeat: Infinity, ease: "easeInOut" }}
    />
  );
};
const NebulaV2 = () => (
    <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 40 }).map((_, i) => (
            <motion.div
                key={i}
                className="absolute rounded-full bg-gradient-to-r from-purple-500/40 to-blue-500/40 blur-3xl"
                style={{ width: rand(150, 400), height: rand(150, 400), top: `${rand(0, 100)}%`, left: `${rand(0, 100)}%` }}
                animate={{ x: [0, rand(-100, 100)], y: [0, rand(-100, 100)], opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: rand(6, 12), repeat: Infinity, ease: "easeInOut" }}
            />
        ))}
    </div>
);
const WarpTunnelV2 = () => (
    <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 60 }).map((_, i) => (
            <motion.div
                key={i}
                className="absolute bg-gradient-to-b from-cyan-400 to-transparent opacity-60"
                style={{ width: rand(0.5, 1.5), height: rand(30, 100), left: `${rand(0, 100)}%`, top: `${rand(0, 100)}%`, transformOrigin: "center" }}
                animate={{ y: ["0%", "150%"], opacity: [0, 1, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: rand(0.5, 1.2), repeat: Infinity, ease: "easeIn" }}
            />
        ))}
    </div>
);
const FlareV2 = () => (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: [0, 1, 0], scale: [0.5, 4, 6] }}
      transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
    >
      <div className="w-[200px] h-[200px] bg-gradient-to-r from-fuchsia-500 to-cyan-400 rounded-full blur-3xl opacity-50" />
    </motion.div>
);
function NebulaJourneyAnimation() {
    return (
        <motion.div
            key="nebula-journey"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
        >
            <NebulaV2 />
            {Array.from({ length: 100 }).map((_, i) => <StarV2 key={i} delay={rand(0, 2)} />)}
            <div className="z-10 flex flex-col items-center justify-center h-full gap-6">
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
                        Entering the Nebula...
                    </span>
                </motion.h1>
            </div>
        </motion.div>
    );
}

// ====================================================================================
// ===== ANIMATION 3: CINEMATIC PORTAL (The final one you provided) ===================
// ====================================================================================
function StarV3({ x, y, size, delay }: { x: number; y: number; size: number; delay?: number }) {
  return (
    <motion.div
      className="absolute bg-white rounded-full opacity-90"
      style={{ width: size, height: size, left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: [0, 1, 0.8], scale: [0.6, 1, 0.9], y: ['0%', '-250%'] }}
      transition={{ delay: delay || 0, duration: rand(3, 6), repeat: Infinity, ease: 'linear' }}
    />
  );
}
const starV3s = Array.from({ length: 80 }).map((_, i) => ({ id: i, x: rand(5, 95), y: rand(5, 95), size: rand(0.8, 3.2), delay: rand(0, 6) }));

function CinematicPortalAnimation() {
    return (
        <motion.div
            key="cinematic-portal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-6"
        >
             <div className="absolute inset-0">
                <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 20% 20%, #021025 0%, #00010a 35%, #000000 100%)' }} />
                <div className="absolute inset-0">
                    {starV3s.map((s) => (<StarV3 key={s.id} x={s.x} y={s.y} size={s.size} delay={s.delay} />))}
                </div>
            </div>
            <motion.div
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
        </motion.div>
    );
}

// ====================================================================================
// ===== MAIN COMPONENT TO ORCHESTRATE THE ANIMATIONS ================================
// ====================================================================================
export function WelcomeAnimation({ onComplete }: { onComplete: () => void }) {
  const [activeAnimation, setActiveAnimation] = useState<'hyperspace' | 'nebula' | 'portal' | 'done'>('hyperspace');

  useEffect(() => {
    const sequence = [
      () => setActiveAnimation('nebula'),  // Switch to nebula after 3s
      () => setActiveAnimation('portal'),  // Switch to portal after another 3s (total 6s)
      () => {
          setActiveAnimation('done');
          onComplete(); // Complete after final animation finishes (total 9s)
      },
    ];

    const timeouts = [
        setTimeout(sequence[0], 3000),
        setTimeout(sequence[1], 6000),
        setTimeout(sequence[2], 9000),
    ];

    return () => timeouts.forEach(clearTimeout);
  }, [onComplete]);

  const renderAnimation = () => {
      switch (activeAnimation) {
          case 'hyperspace':
              return <HyperspaceAnimation />;
          case 'nebula':
              return <NebulaJourneyAnimation />;
          case 'portal':
              return <CinematicPortalAnimation />;
          default:
              return null;
      }
  }

  return (
    <div className="fixed inset-0 z-[999] bg-black">
        <AnimatePresence>
            {renderAnimation()}
        </AnimatePresence>
    </div>
  );
}
