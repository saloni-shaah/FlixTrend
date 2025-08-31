
"use client";
import React from 'react';
import { useAppState } from '@/utils/AppStateContext';
import { Play, Pause, X } from 'lucide-react';
import { motion } from 'framer-motion';

export function GlobalMusicPlayer() {
  const { activeSong, isPlaying, toggleSong, pauseSong } = useAppState();

  if (!activeSong) {
    return null;
  }

  const handleClose = () => {
    pauseSong();
    // A function to clear the active song would be needed in context for full functionality
    // For now, pauseSong effectively stops it.
  };

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      exit={{ y: 100 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:max-w-md z-50"
    >
      <div className="glass-card p-3 flex items-center gap-4">
        <img
          src={activeSong.albumArtUrl}
          alt={activeSong.title}
          className="w-14 h-14 rounded-lg object-cover"
        />
        <div className="flex-1 overflow-hidden">
          <p className="font-bold text-accent-cyan truncate">{activeSong.title}</p>
          <p className="text-sm text-gray-400 truncate">{activeSong.artist}</p>
        </div>
        <button
          onClick={toggleSong}
          className="p-3 rounded-full bg-accent-cyan text-black shadow-lg hover:scale-110 transition-transform"
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
        {/* <button onClick={handleClose} className="p-2 text-gray-400 hover:text-white">
          <X size={20}/>
        </button> */}
      </div>
    </motion.div>
  );
}
