"use client";
import React, { useState, useEffect } from 'react';
import { getDownloadedPosts } from '@/utils/offline-db';
import { PostCard } from '@/components/PostCard';
import { Download } from 'lucide-react';

export function UserDownloads() {
    const [downloadedPosts, setDownloadedPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadDownloads() {
            setLoading(true);
            const posts = await getDownloadedPosts();
            setDownloadedPosts(posts);
            setLoading(false);
        }
        loadDownloads();
    }, []);

    if (loading) return <div className="text-gray-400 text-center mt-16 animate-pulse">Loading downloads...</div>;

    if (downloadedPosts.length === 0) {
        return (
            <div className="text-gray-400 text-center mt-16">
                <div className="text-4xl mb-2"><Download /></div>
                <div className="text-lg font-semibold">No downloaded posts</div>
                <div className="text-sm">Download posts to view them offline.</div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-xl flex flex-col gap-6">
            {downloadedPosts.map(post => (
                <PostCard key={post.id} post={post} />
            ))}
        </div>
    );
}
