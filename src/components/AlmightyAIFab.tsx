
"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlmightyLogo } from "@/components/AlmightyLogo";
import { AlmightyChatModal } from "@/components/AlmightyChatModal";
import Link from 'next/link';

export function AlmightyAIFab() {
  const [isOpen, setIsOpen] = useState(false);

  // In a real app, you'd fetch the user's premium status or credits.
  // For this prototype, we can use a simple prop or context.
  const hasAccess = true; // Replace with real logic

  if (!hasAccess) {
    return (
      <Link href="/premium">
        <div className="fixed bottom-6 right-6 z-50">
          <motion.button
            className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white shadow-fab-glow border border-glass-border"
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Get AI Access"
          >
            <AlmightyLogo size={40} />
          </motion.button>
        </div>
      </Link>
    );
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
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
