"use client";
import { getFirestore, doc, runTransaction, collection, serverTimestamp } from 'firebase/firestore';
import { app } from '@/utils/firebaseClient';

const db = getFirestore(app);

export const EMOJI_LIST = ['❤️', '🔥', '😂', '👍', '😮', '😢'] as const;
export type Emoji = typeof EMOJI_LIST[number];

export const toggleReaction = async (
  collectionName: string,
  postId: string,
  userId: string,
  newEmoji: Emoji
) => {
  if (!userId) {
    throw new Error("User must be logged in to react.");
  }
  if (!EMOJI_LIST.includes(newEmoji)) {
    throw new Error("Invalid emoji reaction.");
  }

  const postRef = doc(db, collectionName, postId);
  const reactionRef = doc(collection(postRef, 'reactions'), userId);

  try {
    await runTransaction(db, async (transaction) => {
      const postDoc = await transaction.get(postRef);
      const reactionDoc = await transaction.get(reactionRef);

      if (!postDoc.exists()) {
        throw "Post does not exist!";
      }

      const postData = postDoc.data();
      const reactions = postData.reactions || {};
      const oldEmoji = reactionDoc.exists() ? reactionDoc.data().emoji : null;

      // Case 1: User is removing their existing reaction by clicking it again
      if (oldEmoji === newEmoji) {
        reactions[oldEmoji] = (reactions[oldEmoji] || 1) - 1;
        if (reactions[oldEmoji] <= 0) {
          delete reactions[oldEmoji];
        }
        transaction.update(postRef, { reactions });
        transaction.delete(reactionRef);
      } 
      // Case 2: User is changing their reaction
      else if (oldEmoji) {
        // Decrement old
        reactions[oldEmoji] = (reactions[oldEmoji] || 1) - 1;
        if (reactions[oldEmoji] <= 0) {
          delete reactions[oldEmoji];
        }
        // Increment new
        reactions[newEmoji] = (reactions[newEmoji] || 0) + 1;
        
        transaction.update(postRef, { reactions });
        transaction.set(reactionRef, { emoji: newEmoji, userId, updatedAt: serverTimestamp() });
      }
      // Case 3: User is adding a new reaction
      else {
        reactions[newEmoji] = (reactions[newEmoji] || 0) + 1;
        transaction.update(postRef, { reactions });
        transaction.set(reactionRef, { emoji: newEmoji, userId, createdAt: serverTimestamp() });
      }
    });
  } catch (error) {
    console.error("Transaction failed: ", error);
    // Re-throw the error to be handled by the calling component
    throw error;
  }
};
