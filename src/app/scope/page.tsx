
"use client";
import React, { useState, useEffect } from "react";
import { getFirestore, collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { app } from "@/utils/firebaseClient";
import { ShortVibesPlayer } from "@/components/ShortVibesPlayer";

const db = getFirestore(app);

export default function ScopePage() {
  const [shortVibes, setShortVibes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const allPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const videos = allPosts.filter(post => 
        post.mediaUrl && /\.(mp4|webm|ogg)$/i.test(post.mediaUrl)
      );
      
      setShortVibes(videos);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching posts:", error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center text-center p-4 pb-24">
        <div className="text-4xl animate-pulse">🎬</div>
        <p className="text-lg text-muted-foreground mt-2">Loading Short Vibes...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen items-center justify-center text-center p-4 pb-24 pt-16">
        <h2 className="text-2xl font-headline text-accent-cyan mb-4 font-bold absolute top-4">Short Vibes</h2>
        <div className="w-full max-w-md h-full">
            <ShortVibesPlayer shortVibes={shortVibes} />
        </div>
    </div>
  );
}
