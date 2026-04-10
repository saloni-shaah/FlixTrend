
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react'; // Using Heart as a placeholder, can be changed
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { app, auth } from '@/utils/firebaseClient';
import { toggleReaction, EMOJI_LIST, Emoji } from '@/lib/reactions';
import { useAuthState } from 'react-firebase-hooks/auth';

const db = getFirestore(app);

interface ReactionButtonProps {
  postId: string;
  collectionName: string;
}

export const ReactionButton: React.FC<ReactionButtonProps> = ({ postId, collectionName }) => {
  const [user] = useAuthState(auth);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [currentUserReaction, setCurrentUserReaction] = useState<Emoji | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Listen for the current user's reaction in real-time
  useEffect(() => {
    if (!user) return;
    const reactionDocRef = doc(db, collectionName, postId, 'reactions', user.uid);
    const unsubscribe = onSnapshot(reactionDocRef, (doc) => {
      if (doc.exists()) {
        setCurrentUserReaction(doc.data().emoji as Emoji);
      } else {
        setCurrentUserReaction(null);
      }
    });
    return () => unsubscribe();
  }, [postId, collectionName, user]);

  const handleEmojiSelect = async (emoji: Emoji) => {
    if (!user) {
      // Optionally, trigger a login modal
      alert("You need to be logged in to react.");
      return;
    }
    setIsSubmitting(true);
    try {
      await toggleReaction(collectionName, postId, user.uid, emoji);
    } catch (error) {
      console.error("Failed to toggle reaction:", error);
      // Optionally, show an error to the user
    } finally {
      setIsSubmitting(false);
      setIsPickerOpen(false);
    }
  };

  const pickerVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.9 },
    visible: { 
      opacity: 1, y: 0, scale: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.1 }
    },
    exit: { opacity: 0, y: 10, scale: 0.9 }
  };

  const emojiVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsPickerOpen(true)}
      onMouseLeave={() => setIsPickerOpen(false)}
    >
      <button 
        className="flex items-center justify-center p-2 rounded-full transition-colors duration-200 text-muted-foreground hover:text-primary disabled:opacity-50"
        disabled={isSubmitting || !user}
      >
        {currentUserReaction ? (
          <span className="text-2xl">{currentUserReaction}</span>
        ) : (
          <Heart className="w-6 h-6" />
        )}
      </button>
      <AnimatePresence>
        {isPickerOpen && (
          <motion.div
            className="absolute bottom-full mb-2 flex items-center justify-center w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1}}
            exit={{ opacity: 0 }}
           >
            <motion.div 
              className="flex gap-2 bg-background border p-2 rounded-full shadow-lg"
              variants={pickerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {EMOJI_LIST.map((emoji) => (
                <motion.button
                  key={emoji}
                  className={`p-2 rounded-full text-xl transition-transform duration-150 hover:scale-125 ${currentUserReaction === emoji ? 'bg-muted' : ''}`}
                  onClick={() => handleEmojiSelect(emoji)}
                  variants={emojiVariants}
                  disabled={isSubmitting}
                >
                  {emoji}
                </motion.button>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
