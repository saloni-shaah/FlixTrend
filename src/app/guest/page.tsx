
"use client";
import React, { useState, useEffect } from "react";
import { getFirestore, collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { app } from "@/utils/firebaseClient";
import AdBanner from "@/components/AdBanner";
import { VibeSpaceLoader } from "@/components/VibeSpaceLoader";
import { GuestPostCard } from "@/components/GuestPostCard";
import Link from "next/link";
import { FlixTrendLogo } from "@/components/FlixTrendLogo";

const db = getFirestore(app);

export default function GuestPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <div className="flex flex-col w-full">
      {/* Navbar for Guest */}
       <nav className="w-full flex justify-between items-center px-8 py-4 bg-black/70 border-b border-accent-cyan/20 fixed top-0 left-0 z-50 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-3">
          <FlixTrendLogo size={40} />
          <span className="font-headline text-2xl text-accent-cyan font-bold tracking-wide">FlixTrend (Guest)</span>
        </Link>
        <div className="flex gap-6 items-center">
          <Link href="/signup" className="px-5 py-2 rounded-full bg-accent-pink text-white font-bold shadow-fab-glow hover:scale-105 transition-all">Sign Up</Link>
          <Link href="/login" className="px-5 py-2 rounded-full border-2 border-accent-cyan text-accent-cyan font-bold bg-black/30 hover:bg-accent-cyan hover:text-primary transition-all">Log In</Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="w-full max-w-2xl mx-auto pt-20">
        <div className="text-center mb-8 p-4 glass-card">
            <h1 className="text-3xl font-headline font-bold text-accent-cyan">Welcome to the VibeSpace</h1>
            <p className="text-gray-300 mt-2">You're viewing as a guest. <Link href="/login" className="text-accent-pink underline">Log in or sign up</Link> to join the conversation!</p>
        </div>

        <section className="flex-1 flex flex-col items-center">
          {loading || posts.length === 0 ? (
            <VibeSpaceLoader />
          ) : (
            <div className="w-full max-w-xl flex flex-col gap-6">
              {posts.map((post, index) => (
                <React.Fragment key={post.id}>
                  <GuestPostCard post={post} />
                  {(index + 1) % 3 === 0 && <AdBanner key={`ad-${post.id}`} />}
                </React.Fragment>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
