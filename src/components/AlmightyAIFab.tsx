
"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlmightyLogo } from "@/components/AlmightyLogo";
import { AlmightyChatModal } from "@/components/AlmightyChatModal";

export function AlmightyAIFab() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-24 md:bottom-6 right-6 z-50">
        <motion.button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white shadow-fab-glow border border-glass-border"
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Open Almighty AI"
        >
          <AlmightyLogo size={40} />
        </motion.button>
      </div>
      <AnimatePresence>
        {isOpen && <AlmightyChatModal onClose={() => setIsOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
