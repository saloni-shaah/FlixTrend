'use client';
import { motion } from 'framer-motion';
import { quickEmojis, quickPhrases } from '@/lib/quick-drop-data';

interface QuickDropMenuProps {
  onSelect: (item: string) => void;
}

export function QuickDropMenu({ onSelect }: QuickDropMenuProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.88, y: 20 }}
      transition={{ type: 'spring', damping: 24, stiffness: 300 }}
      onClick={e => e.stopPropagation()}
      className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 shadow-2xl w-72"
    >
      <p className="text-[11px] text-white/30 uppercase tracking-widest mb-3 px-1 font-semibold">
        Quick Drop ⚡
      </p>

      {/* Emoji grid */}
      <div className="grid grid-cols-5 gap-1.5 mb-3">
        {quickEmojis.map(emoji => (
          <motion.button
            key={emoji}
            whileTap={{ scale: 0.72 }}
            onClick={() => onSelect(emoji)}
            className="text-2xl rounded-2xl bg-white/5 hover:bg-white/10 active:bg-white/15 aspect-square flex items-center justify-center transition-colors"
          >
            {emoji}
          </motion.button>
        ))}
      </div>

      {/* Phrase grid */}
      <div className="grid grid-cols-4 gap-1.5">
        {quickPhrases.map(phrase => (
          <motion.button
            key={phrase.display}
            whileTap={{ scale: 0.9 }}
            onClick={() => onSelect(phrase.text)}
            className="bg-white/5 hover:bg-white/10 active:bg-white/15 text-white/80 font-bold py-2 px-1 rounded-xl text-[11px] tracking-wide transition-colors border border-white/5"
          >
            {phrase.display}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}