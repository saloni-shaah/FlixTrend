
"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { auth, app } from '@/utils/firebaseClient';
import { GuestPostCard } from '@/components/GuestPostCard';
import { VibeSpaceLoader } from '@/components/VibeSpaceLoader';
import Link from 'next/link';
import { FlixTrendLogo } from '@/components/FlixTrendLogo';
import { onAuthStateChanged } from 'firebase/auth';
import { redisClient } from '@/utils/redis';

const db = getFirestore(app);

export default function PostPage() {
    const params = useParams();
    const router = useRouter();
    const postId = params?.postId as string;
    
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                router.replace('/home');
            } else {
                if (postId) {
                    try {
                        const cachedPost: any = await redisClient.get(`post:${postId}`);
                        if (cachedPost) {
                            setPost(cachedPost);
                        } else {
                            const postRef = doc(db, "posts", postId);
                            const postSnap = await getDoc(postRef);

                            if (postSnap.exists()) {
                                const postData = { id: postSnap.id, ...postSnap.data() };
                                setPost(postData);
                                await redisClient.set(`post:${postId}`, postData, { ex: 3600 }); // Cache for 1 hour
                            } else {
                                setError("This vibe couldn't be found. It might have been deleted or the link is incorrect.");
                            }
                        }
                    } catch (err) {
                        console.error("Error fetching post:", err);
                        setError("There was an error loading this vibe.");
                    }
                }
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [postId, router]);

    if (loading) {
        return <VibeSpaceLoader />;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center">
                 <h1 className="text-2xl font-headline font-bold text-red-500 mb-4">{error}</h1>
                 <Link href="/guest" className="btn-glass bg-accent-pink text-white">Explore Guest Feed</Link>
            </div>
        )
    }

    return (
        <div className="flex flex-col w-full min-h-screen">
             <nav className="w-full flex justify-between items-center px-8 py-4 bg-black/70 border-b border-accent-cyan/20 fixed top-0 left-0 z-50 backdrop-blur-md">
                <Link href="/" className="flex items-center gap-3">
                  <FlixTrendLogo size={40} />
                  <span className="font-headline text-2xl text-accent-cyan font-bold tracking-wide">FlixTrend</span>
                </Link>
                <div className="flex gap-6 items-center">
                  <Link href="/signup" className="px-5 py-2 rounded-full bg-accent-pink text-white font-bold shadow-fab-glow hover:scale-105 transition-all">Sign Up</Link>
                  <Link href="/login" className="px-5 py-2 rounded-full border-2 border-accent-cyan text-accent-cyan font-bold bg-black/30 hover:bg-accent-cyan hover:text-primary transition-all">Log In</Link>
                </div>
            </nav>

            <main className="w-full max-w-xl mx-auto pt-28 pb-12">
                {post ? (
                    <GuestPostCard post={post} />
                ) : (
                    <p className="text-center text-gray-400">Post not found.</p>
                )}
            </main>
        </div>
    );
}
