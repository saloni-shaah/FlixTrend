"use client";
import React, { useState, useEffect } from "react";
import { getFirestore, collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { ShortVibesPlayer } from "@/components/ShortVibesPlayer";
import { app } from "@/utils/firebaseClient";

const db = getFirestore(app);

export default function ScopePage() {
  const [shortVibes, setShortVibes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Query for all posts, ordered by creation date.
    // Filtering will happen on the client side.
    const q = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const videos = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        // Filter for documents that have a mediaUrl that ends with a video extension.
        .filter(post => post.mediaUrl && post.mediaUrl.match(/\.(mp4|webm|ogg)$/i));
      
      setShortVibes(videos);
      setLoading(false);
    }, (error) => {
      // It's good practice to handle potential errors from the listener.
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
    <div className="flex flex-col min-h-screen items-center justify-center text-center p-4 pb-24">
      <ShortVibesPlayer shortVibes={shortVibes} />
    </div>
  );
}
