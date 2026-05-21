'use client';

import React from 'react';
import { Copy, X, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

export function MessageShareModal({ message, onSignalShare, onClose }: { message: string; onSignalShare: () => void; onClose: () => void }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
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
        <h3 className="text-xl font-headline font-bold mb-4 text-brand-gold">Share Message</h3>

        <>
          <button
            className="w-full btn-glass bg-accent-purple/20 text-accent-purple font-bold flex items-center justify-center gap-3 mb-4"
            onClick={onSignalShare}
          >
            <MessageSquare /> Share in Signal
          </button>

          <div className="flex items-center gap-2 mt-4">
            <p className="input-glass flex-1 text-sm overflow-hidden whitespace-nowrap text-ellipsis">{message}</p>
            <button onClick={() => handleCopy(message)} className="btn-glass px-4 py-2">
              <Copy size={18} />
            </button>
          </div>
        </>
        {copied && <p className="text-accent-cyan text-sm mt-2 text-center">Message copied!</p>}
      </motion.div>
    </div>
  );
}
