"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  isTheaterMode: boolean;
  children: React.ReactNode;
}

export function TheaterModeContainer({ isTheaterMode, children }: Props) {
  return (
    <>
      {isTheaterMode && (
        <style>{`
          body { overflow-x: hidden; }
          .watch-sidebar { display: none !important; }
          .watch-main { max-width: 100% !important; padding: 0 !important; }
        `}</style>
      )}
      <motion.div
        layout
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className={
          isTheaterMode
            ? "w-screen relative left-1/2 -translate-x-1/2 bg-black"
            : "w-full rounded-xl overflow-hidden relative bg-black"
        }
        style={isTheaterMode ? { maxWidth: "100vw" } : undefined}
      >
        {children}
      </motion.div>
    </>
  );
}