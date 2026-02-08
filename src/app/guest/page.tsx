
"use client";
import React, { useEffect, useState } from 'react';
import { getFirestore, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { app } from '@/utils/firebaseClient';
import { GuestPostCard } from '@/components/GuestPostCard';
import { VibeSpaceLoader } from '@/components/VibeSpaceLoader';
import Link from 'next/link';
import { FlixTrendLogo } from '@/components/FlixTrendLogo';

const db = getFirestore(app);

export default function GuestFeed() {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const postsQuery = query(
                    collection(db, "posts"), 
                    orderBy("createdAt", "desc"), 
                    limit(20)
                );
                const querySnapshot = await getDocs(postsQuery);
                const postsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setPosts(postsData);
            } catch (err) {
                console.error("Error fetching guest feed:", err);
                setError("Could not load the feed. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    if (loading) {
        return <VibeSpaceLoader />;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
                 <h1 className="text-2xl font-headline font-bold text-red-500 mb-4">{error}</h1>
            </div>
        )
    }

    return (
        <div className="flex flex-col w-full min-h-screen bg-primary">
            <nav className="w-full flex justify-between items-center px-4 sm:px-8 py-4 bg-black/70 border-b border-accent-cyan/20 fixed top-0 left-0 z-50 backdrop-blur-md">
                <Link href="/" className="flex items-center gap-3">
                  <FlixTrendLogo size={40} />
                  <span className="font-headline text-2xl text-accent-cyan font-bold tracking-wide">FlixTrend</span>
                </Link>
                <div className="flex gap-4 sm:gap-6 items-center">
                  <Link href="/signup" className="px-5 py-2 rounded-full bg-accent-pink text-white font-bold shadow-fab-glow hover:scale-105 transition-all">Sign Up</Link>
                  <Link href="/login" className="hidden sm:block px-5 py-2 rounded-full border-2 border-accent-cyan text-accent-cyan font-bold bg-black/30 hover:bg-accent-cyan hover:text-primary transition-all">Log In</Link>
                </div>
            </nav>

            <main className="w-full max-w-xl mx-auto pt-24 sm:pt-28 pb-12 px-4">
                <h1 className="text-3xl font-headline font-bold text-center mb-8 text-white">Discover What's Trending</h1>
                <div className="flex flex-col gap-6">
                    {posts.length > 0 ? (
                        posts.map(post => <GuestPostCard key={post.id} post={post} />)
                    ) : (
                        <p className="text-center text-gray-400">No vibes to show right now. Check back later!</p>
                    )}
                </div>
            </main>
        </div>
    );
}
