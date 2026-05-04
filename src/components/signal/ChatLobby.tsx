"use client";

import React from "react";
import { motion } from "framer-motion";
import { MessageSquare, Sparkles } from "lucide-react";

export function ChatLobby() {
  return (
    <div className="h-full flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-center max-w-sm"
      >
        {/* Animated Icon */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="mb-6 flex justify-center"
        >
          <div className="p-4 rounded-2xl bg-gradient-to-tr from-accent-pink/20 to-accent-cyan/20 backdrop-blur-md">
            <MessageSquare size={48} strokeWidth={1.5} className="text-white" />
          </div>
        </motion.div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white mb-2">
          Your conversations start here
        </h2>

        {/* Subtitle */}
        <p className="text-gray-400 text-sm mb-6">
          Pick a chat or start a new one to connect instantly.
        </p>

        {/* CTA */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-5 py-2.5 rounded-full bg-gradient-to-r from-accent-pink to-accent-cyan text-white text-sm font-medium shadow-md"
        >
          Start a new chat
        </motion.button>

        {/* Small extra vibe */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500">
          <Sparkles size={14} />
          Fast. Private. FlixTrend Signal.
        </div>
      </motion.div>
    </div>
  );
}