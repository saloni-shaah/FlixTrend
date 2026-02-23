
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { OptimizedImage } from './OptimizedImage';

interface FullScreenImageViewerProps {
  imageUrl: string | null;
  onClose: () => void;
}

export const FullScreenImageViewer: React.FC<FullScreenImageViewerProps> = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;

  return (
    <AnimatePresence>
        {imageUrl && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="relative w-full h-full p-4 md:p-8"
                    onClick={(e) => e.stopPropagation()}
                >
                    <OptimizedImage
                        src={imageUrl}
                        alt="Full screen view"
                        className="w-full h-full object-contain"
                    />
                </motion.div>
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 text-white bg-black/40 rounded-full p-2 hover:bg-black/60 transition-colors"
                >
                    <X size={28} />
                </button>
            </motion.div>
        )}
    </AnimatePresence>
  );
};
