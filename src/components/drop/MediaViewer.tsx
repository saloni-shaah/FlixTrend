"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getFirestore, doc, increment, writeBatch } from "firebase/firestore";
import { app } from "@/utils/firebaseClient";

const db = getFirestore(app);

export function MediaViewer({
  post,
  media,
  currentMediaIndex,
  onClose,
  onNext,
  onPrev,
}: {
  post: any;
  media: string[];
  currentMediaIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const [showLike, setShowLike] = useState(false);

  const isVideo = useCallback((url: string) => {
    if (!url) return false;
    try {
      const pathname = new URL(url).pathname.toLowerCase();
      return pathname.endsWith('.mp4') || pathname.endsWith('.webm') || pathname.endsWith('.mov');
    } catch (error) {
      const lowercasedUrl = url.toLowerCase();
      return lowercasedUrl.includes('.mp4') || lowercasedUrl.includes('.webm') || lowercasedUrl.includes('.mov');
    }
  }, []);

  const handleDoubleClick = () => {
    setShowLike(true);
    setTimeout(() => setShowLike(false), 1000);
    // Later, you can add your backend call here to persist the like
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onNext, onPrev, onClose]);

  useEffect(() => {
    const nextIndex = (currentMediaIndex + 1) % media.length;
    if (media[nextIndex] && !isVideo(media[nextIndex])) {
      const img = new Image();
      img.src = media[nextIndex];
    }
  }, [currentMediaIndex, media, isVideo]);

  useEffect(() => {
    if (post.id) {
      const postRef = doc(db, "drops", post.id);
      const batch = writeBatch(db);
      batch.update(postRef, { viewCount: increment(1) });
      batch.commit().catch(console.error);
    }
  }, [post.id]);

  const currentMediaUrl = media[currentMediaIndex];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center select-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        onContextMenu={(e) => e.preventDefault()} // Prevent right-click context menu
      >
        {/* Main Content Area */}
        <div className="relative w-full h-full flex items-center justify-center" onDoubleClick={handleDoubleClick}>
          {/* Tap Zones */}
          <div className="absolute left-0 top-0 h-full w-1/4" onClick={(e) => { e.stopPropagation(); onPrev(); }} />
          <div className="absolute right-0 top-0 h-full w-1/4" onClick={(e) => { e.stopPropagation(); onNext(); }} />

          {/* Close Button */}
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors z-20"
          >
            <X size={32} />
          </button>

          {/* Media Content */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentMediaIndex + '_' + post.id}
              className="relative max-w-4xl max-h-[85vh] w-auto h-auto flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.98, x: 50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.98, x: -50 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              {isVideo(currentMediaUrl) ? (
                <video
                  src={currentMediaUrl}
                  controls
                  controlsList="nodownload" // Prevent download option in controls
                  autoPlay
                  playsInline
                  preload="metadata"
                  onEnded={onNext}
                  className="max-h-[85vh] w-auto shadow-2xl rounded-lg"
                />
              ) : (
                <img
                  src={currentMediaUrl}
                  className="max-h-[85vh] w-auto object-contain shadow-2xl rounded-lg"
                  alt={`Media ${currentMediaIndex + 1} of ${media.length}`}
                  draggable={false} // Prevent dragging image
                />
              )}
              <AnimatePresence>
                {showLike && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1, transition: { type: "spring", stiffness: 500, damping: 30 } }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center text-white text-6xl pointer-events-none"
                  >
                    ❤️
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>

          {/* Context Layer */}
          <div 
            className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/50 to-transparent text-white pointer-events-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-w-4xl mx-auto">
                <p className="font-bold text-lg">@{post.username || "user"}</p>
                <p className="text-sm mt-1 whitespace-pre-line">{post.content}</p>
            </div>
          </div>

          {/* Counter */}
          {media.length > 1 && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/80 text-sm bg-black/30 rounded-full px-3 py-1">
                  {currentMediaIndex + 1} / {media.length}
              </div>
          )}
        </div>

        {/* Navigation Buttons for Desktop */}
        {media.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onPrev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-colors hidden md:block"
            >
              <ChevronLeft size={44} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onNext(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-colors hidden md:block"
            >
              <ChevronRight size={44} />
            </button>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
