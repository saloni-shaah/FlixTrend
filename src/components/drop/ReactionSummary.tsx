
"use client";

import React, { useState, useEffect } from 'react';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { app } from '@/utils/firebaseClient';
import { EMOJI_LIST, Emoji } from '@/lib/reactions';

const db = getFirestore(app);

interface ReactionSummaryProps {
  postId: string;
  collectionName: string;
}

// A consistent order for displaying emojis
const displayOrder = EMOJI_LIST;

export const ReactionSummary: React.FC<ReactionSummaryProps> = ({ postId, collectionName }) => {
  const [reactions, setReactions] = useState<Record<Emoji, number> | null>(null);

  useEffect(() => {
    const postRef = doc(db, collectionName, postId);
    const unsubscribe = onSnapshot(postRef, (doc) => {
      if (doc.exists()) {
        const postData = doc.data();
        setReactions(postData.reactions || {});
      }
    });
    return () => unsubscribe();
  }, [postId, collectionName]);

  const sortedReactions = reactions 
    ? Object.entries(reactions)
        .filter(([emoji, count]) => count > 0 && EMOJI_LIST.includes(emoji as Emoji))
        .sort(([a], [b]) => displayOrder.indexOf(a as Emoji) - displayOrder.indexOf(b as Emoji))
    : [];

  if (!sortedReactions.length) {
    return <div className="h-6"></div>; // Reserve space
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap h-6">
        <AnimatePresence mode="popLayout">
            {sortedReactions.map(([emoji, count]) => (
                <motion.div
                    key={emoji}
                    layout
                    initial={{ opacity: 0, scale: 0.5, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5, x: -10 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="flex items-center gap-1 bg-muted/50 text-xs px-2 py-0.5 rounded-full cursor-pointer border border-transparent hover:border-primary/50"
                >
                    <span className="text-sm">{emoji}</span>
                    <span className="font-bold text-muted-foreground">{count}</span>
                </motion.div>
            ))}
        </AnimatePresence>
    </div>
  );
};
