'use client';

import { motion } from 'framer-motion';
import { quickEmojis, quickPhrases } from '@/lib/quick-drop-data';

interface QuickDropMenuProps {
    onSelect: (item: string) => void;
}

export function QuickDropMenu({ onSelect }: QuickDropMenuProps) {
    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gray-900/80 backdrop-blur-lg rounded-xl p-4 shadow-2xl w-64"
        >
            <div className="grid grid-cols-6 gap-2 mb-4">
                {quickEmojis.map((emoji) => (
                    <button 
                        key={emoji}
                        onClick={() => onSelect(emoji)}
                        className="text-2xl rounded-lg hover:bg-white/10 aspect-square flex items-center justify-center transition-colors"
                    >
                        {emoji}
                    </button>
                ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
                {quickPhrases.map((phrase) => (
                    <button 
                        key={phrase.display}
                        onClick={() => onSelect(phrase.text)}
                        className="bg-white/10 hover:bg-white/20 text-white font-semibold py-2 px-3 rounded-lg text-sm transition-colors"
                    >
                        {phrase.display.toUpperCase()}
                    </button>
                ))}
            </div>
        </motion.div>
    );
}
