
"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '@/utils/firebaseClient';
import { GuestPostCard } from '@/components/GuestPostCard';
import { VibeSpaceLoader } from '@/components/VibeSpaceLoader';
import Link from 'next/link';
import { FlixTrendLogo } from '@/components/FlixTrendLogo';
import { ArrowLeft } from 'lucide-react';

const db = getFirestore(app);

export default function PostPage() {
    const params = useParams();
    const postId = params?.postId as string;
    
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (postId) {
            const fetchPost = async () => {
                setLoading(true);
                try {
                    const postRef = doc(db, "posts", postId);
                    const postSnap = await getDoc(postRef);

                    if (postSnap.exists()) {
                        const postData = { id: postSnap.id, ...postSnap.data() };
                        setPost(postData);
                    } else {
                        setError("This vibe couldn't be found. It might have been deleted or the link is incorrect.");
                    }
                } catch (err) {
                    console.error("Error fetching post:", err);
                    setError("There was an error loading this vibe.");
                } finally {
                    setLoading(false);
                }
            };
            fetchPost();
        } else {
            setLoading(false);
            setError("No post ID provided.");
        }
    }, [postId]);

    if (loading) {
        return <VibeSpaceLoader />;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
                 <h1 className="text-2xl font-headline font-bold text-red-500 mb-4">{error}</h1>
                 <Link href="/" className="btn-glass bg-accent-pink text-white">Explore FlixTrend</Link>
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
                {post ? (
                    <>
                        <GuestPostCard post={post} />
                        <div className="mt-8 flex justify-center">
                            <Link href="/vibespace" className="btn-glass flex items-center gap-2 bg-accent-cyan text-black">
                                <ArrowLeft size={20} />
                                Back to VibeSpace
                            </Link>
                        </div>
                    </>
                ) : (
                    !loading && <p className="text-center text-gray-400">Post not found.</p>
                )}
            </main>
        </div>
    );
}
