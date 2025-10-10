
"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '@/utils/firebaseClient';
import { OptimizedVideo } from '@/components/OptimizedVideo';

const db = getFirestore(app);

export default function EmbedPage() {
    const params = useParams();
    const postId = params?.postId as string;
    
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (postId) {
            const postRef = doc(db, "posts", postId);
            getDoc(postRef).then(docSnap => {
                if (docSnap.exists()) {
                    const postData = docSnap.data();
                    if (postData.type === 'media' && (Array.isArray(postData.mediaUrl) ? postData.mediaUrl.some((url: string) => /\.(mp4|webm|ogg)$/i.test(url)) : /\.(mp4|webm|ogg)$/i.test(postData.mediaUrl))) {
                        setPost({ id: docSnap.id, ...postData });
                    } else {
                        setError("This post is not a video and cannot be embedded.");
                    }
                } else {
                    setError("This vibe couldn't be found.");
                }
            }).catch(err => {
                console.error("Error fetching post:", err);
                setError("There was an error loading this vibe.");
            }).finally(() => {
                setLoading(false);
            });
        }
    }, [postId]);

    if (loading) {
        return <div className="w-screen h-screen flex items-center justify-center bg-black text-white">Loading Vibe...</div>;
    }

    if (error) {
        return <div className="w-screen h-screen flex items-center justify-center bg-black text-white p-4 text-center">{error}</div>;
    }

    const videoUrl = Array.isArray(post.mediaUrl) ? post.mediaUrl.find((url: string) => /\.(mp4|webm|ogg)$/i.test(url)) : post.mediaUrl;

    return (
        <div className="w-screen h-screen bg-black flex items-center justify-center">
            <style jsx global>{`body { background: black !important; }`}</style>
            {post && videoUrl && (
                 <OptimizedVideo 
                    src={videoUrl} 
                    thumbnailUrl={post.thumbnailUrl} 
                    className="w-full h-full object-contain" 
                />
            )}
        </div>
    );
}
