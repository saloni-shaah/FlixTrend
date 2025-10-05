"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { FlixTrendPlayer } from './FlixTrendPlayer';

export function PlayerModal({ post, onClose }: { post: any, onClose: () => void }) {
    return (
        <div
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full md:w-auto md:h-auto"
                onClick={e => e.stopPropagation()}
            >
                <FlixTrendPlayer post={post} onClose={onClose} />
            </motion.div>
        </div>
    );
}
