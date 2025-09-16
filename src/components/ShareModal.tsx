
"use client";

import React from 'react';
import { Copy, X } from 'lucide-react';
import { motion } from 'framer-motion';

export function ShareModal({ url, onClose }: { url: string; onClose: () => void }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[101] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="glass-card p-6 w-full max-w-sm relative"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={24} />
        </button>
        <h3 className="text-xl font-headline font-bold mb-4 text-brand-gold">Share Vibe</h3>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={url}
            readOnly
            className="input-glass flex-1 text-sm"
          />
          <button
            onClick={handleCopy}
            className="btn-glass px-4 py-2"
          >
            <Copy size={18} />
          </button>
        </div>
        {copied && <p className="text-accent-cyan text-sm mt-2 text-center">Link copied!</p>}
      </motion.div>
    </div>
  );
}
