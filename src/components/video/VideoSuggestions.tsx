"use client";

import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { app } from '@/utils/firebaseClient';
import Link from 'next/link';

const db = getFirestore(app);

export function VideoSuggestions({ currentPost, onPlayNext }: { currentPost: any, onPlayNext: (post: any) => void }) {
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSuggestions = async () => {
            setLoading(true);
            try {
                // MODIFIED: Removed category-based filtering for a simpler, non-AI recommendation.
                // This now fetches the latest media posts regardless of category.
                const q = query(
                    collection(db, "posts"),
                    where("type", "==", "media"),
                    orderBy("createdAt", "desc"),
                    limit(9) // 8 suggestions + the current post which we'll filter out
                );
                const querySnapshot = await getDocs(q);
                const allPosts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                
                // Filter out the current post and take the first 8
                const filtered = allPosts.filter(p => p.id !== currentPost.id).slice(0, 8);
                setSuggestions(filtered);

            } catch (error) {
                console.error("Error fetching video suggestions:", error);
            }
            setLoading(false);
        };

        fetchSuggestions();
        
    }, [currentPost]);

    return (
        <div className="w-full h-full bg-black/80 flex flex-col items-center justify-center p-4">
            <h3 className="text-xl font-bold text-white mb-4">Up Next</h3>
            {loading ? (
                <div className="text-white">Loading suggestions...</div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {suggestions.map(post => (
                        <div key={post.id} className="relative aspect-video rounded-lg overflow-hidden cursor-pointer group" onClick={() => onPlayNext(post)}>
                            <img src={post.thumbnailUrl || '/video_placeholder.png'} alt={post.title} className="w-full h-full object-cover"/>
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <p className="text-white text-sm font-bold text-center p-2 line-clamp-2">{post.title}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
