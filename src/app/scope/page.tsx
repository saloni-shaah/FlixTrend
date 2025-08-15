"use client";
import React, { useState, useEffect } from "react";
import { getFirestore, collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { ShortVibesPlayer } from "@/components/ShortVibesPlayer";

const db = getFirestore();

export default function ScopePage() {
  const [shortVibes, setShortVibes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Query for posts that are videos and have a mediaUrl
    const q = query(
      collection(db, "posts"),
      where("mediaUrl", "!=", null),
      orderBy("mediaUrl"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const videos = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(post => post.mediaUrl && post.mediaUrl.match(/\.(mp4|webm|ogg)$/i));
      
      setShortVibes(videos);
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
    <div className="flex flex-col min-h-screen items-center justify-center text-center p-4 pb-24">
      <ShortVibesPlayer shortVibes={shortVibes} />
    </div>
  );
}
