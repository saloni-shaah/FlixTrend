'use client';

import React, { useState, useEffect } from 'react';
import { auth, app } from "@/utils/firebaseClient";
import { getFirestore, collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { PostCard } from "@/components/PostCard";
import { motion } from "framer-motion";

const db = getFirestore(app);

export const ContentManagement = () => {
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
        setError("You must be logged in to view your content.");
        setLoading(false);
        return;
    }

    const postsQuery = query(
        collection(db, "posts"), 
        where("userId", "==", user.uid), 
        orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
        setUserPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
    }, (err) => {
        console.error("Error fetching posts:", err);
        setError("Could not fetch your content. Please try again later.");
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return <div className="text-center p-8">Loading your content...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">{error}</div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8">
      <h2 className="text-3xl font-bold mb-6">Your Content</h2>
      {userPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userPosts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-8 bg-gray-800 rounded-lg">
            <div className="text-5xl mb-4">📝</div>
            <h3 className="text-2xl font-semibold mb-2">No Content Yet</h3>
            <p className="text-gray-400">When you create posts, they will appear here.</p>
        </div>
      )}
    </motion.div>
  );
};
