'use client';

import React, { useState, useEffect } from 'react';
import { auth, app } from "@/utils/firebaseClient";
import { getFirestore, collection, query, where, getDocs, orderBy, collectionGroup, limit } from "firebase/firestore";
import { motion } from "framer-motion";
import Link from 'next/link';
import Image from 'next/image';

const db = getFirestore(app);

export const Community = () => {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    const fetchComments = async () => {
      if (!user) return;
      setLoading(true);

      try {
        // Find all posts made by the current creator
        const postsQuery = query(collection(db, "posts"), where("userId", "==", user.uid));
        const postSnap = await getDocs(postsQuery);
        const postIds = postSnap.docs.map(doc => doc.id);

        if (postIds.length === 0) {
          setLoading(false);
          return;
        }

        // Use a collectionGroup query to get comments from all posts, ordered by creation date
        // This is efficient as it queries the 'comments' subcollection across all documents.
        const commentsQuery = query(
          collectionGroup(db, 'comments'), 
          where('postId', 'in', postIds),
          orderBy('createdAt', 'desc'),
          limit(50) // Limit to the 50 most recent comments to start
        );
        const commentsSnapshot = await getDocs(commentsQuery);
        
        const commentsData = commentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setComments(commentsData);
      } catch (error) {
        console.error("Error fetching comments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [user]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8">
      <h2 className="text-3xl font-bold mb-6">Community Engagement</h2>
      
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-800 p-4 rounded-lg animate-pulse h-24"></div>
          ))}
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map(comment => (
            <div key={comment.id} className="bg-gray-800 p-4 rounded-lg shadow-md flex items-start space-x-4">
              <Image src={comment.authorAvatar || `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${comment.authorId}`} alt={comment.authorName} width={40} height={40} className="rounded-full" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-white">{comment.authorName}</p>
                  <span className="text-xs text-gray-400">{new Date(comment.createdAt?.toDate()).toLocaleDateString()}</span>
                </div>
                <p className="text-gray-300 my-1">{comment.text}</p>
                <Link href={`/post/${comment.postId}`}>
                  <span className="text-xs text-purple-400 hover:underline">View Post</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-8 bg-gray-800 rounded-lg">
          <div className="text-5xl mb-4">💬</div>
          <h3 className="text-2xl font-semibold mb-2">No Comments Yet</h3>
          <p className="text-gray-400">When viewers comment on your posts, they will appear here.</p>
        </div>
      )}
    </motion.div>
  );
};
