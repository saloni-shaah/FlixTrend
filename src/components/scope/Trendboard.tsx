
"use client";
import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query as firestoreQuery, getDocs, where, orderBy, limit } from 'firebase/firestore';
import { app } from '@/utils/firebaseClient';
import { Loader, Trophy, User, Star, Eye } from 'lucide-react';
import Link from 'next/link';
import { OptimizedImage } from '../OptimizedImage';

const db = getFirestore(app);

const UserRow = ({ user, index, metric, metricLabel }: { user: any, index: number, metric: number, metricLabel: string }) => {
    const getRankColor = () => {
        if (index === 0) return 'border-yellow-400 text-yellow-400';
        if (index === 1) return 'border-gray-400 text-gray-400';
        if (index === 2) return 'border-orange-400 text-orange-400';
        return 'border-gray-600 text-gray-500';
    };
    return (
        <Link href={`/squad/${user.uid}`}>
            <div className="flex items-center gap-4 p-2 rounded-lg hover:bg-white/10 transition-colors">
                <span className={`w-8 text-center font-bold text-lg ${getRankColor()}`}>{index + 1}</span>
                <img src={user.avatar_url} alt={user.username} className="w-10 h-10 rounded-full object-cover" />
                <div className="flex-1">
                    <p className="font-bold text-white">@{user.username}</p>
                    <p className="text-xs text-gray-400">{user.name}</p>
                </div>
                <div className="text-right">
                    <p className="font-bold">{metric.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{metricLabel}</p>
                </div>
            </div>
        </Link>
    );
};

const PostRow = ({ post, index }: { post: any, index: number }) => {
    const getRankColor = () => {
        if (index === 0) return 'border-yellow-400 text-yellow-400';
        if (index === 1) return 'border-gray-400 text-gray-400';
        if (index === 2) return 'border-orange-400 text-orange-400';
        return 'border-gray-600 text-gray-500';
    };
    
    const mediaUrl = Array.isArray(post.mediaUrl) ? post.mediaUrl[0] : post.mediaUrl;
    const thumbnailUrl = post.thumbnailUrl || mediaUrl || `https://picsum.photos/seed/${post.id}/200`;

    return (
        <Link href={`/home`}>
             <div className="flex items-center gap-4 p-2 rounded-lg hover:bg-white/10 transition-colors">
                <span className={`w-8 text-center font-bold text-lg ${getRankColor()}`}>{index + 1}</span>
                <OptimizedImage src={thumbnailUrl} alt={post.content} className="w-10 h-10 rounded-md object-cover" />
                <div className="flex-1">
                    <p className="font-bold text-white truncate">{post.content || "Video Post"}</p>
                    <p className="text-xs text-gray-400">by @{post.username}</p>
                </div>
                <div className="text-right flex items-center gap-1">
                    <Eye size={14}/>
                    <p className="font-bold">{post.viewCount?.toLocaleString() || 0}</p>
                </div>
            </div>
        </Link>
    );
};

export function Trendboard() {
    const [leaderboards, setLeaderboards] = useState<any>({
        posts: [],
        followers: [],
        likes: [],
        topPosts: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchLeaderboards = async () => {
            setLoading(true);
            setError('');
            try {
                // Fetch all users
                const usersSnap = await getDocs(collection(db, "users"));
                const usersDataPromises = usersSnap.docs.map(async (userDoc) => {
                    const user = { uid: userDoc.id, ...userDoc.data() };
                    
                    const followersSnap = await getDocs(collection(db, `users/${user.uid}/followers`));
                    
                    const postsQuery = firestoreQuery(collection(db, "posts"), where('userId', '==', user.uid));
                    const postsSnap = await getDocs(postsQuery);
                    
                    const postCount = postsSnap.size;
                    const followerCount = followersSnap.size;

                    let totalLikes = 0;
                    postsSnap.forEach(postDoc => {
                        totalLikes += postDoc.data().starCount || 0;
                    });

                    return { ...user, postCount, followerCount, totalLikes };
                });
                
                const usersData = await Promise.all(usersDataPromises);

                // Fetch top video posts
                const topPostsQuery = firestoreQuery(
                    collection(db, "posts"), 
                    where('isVideo', '==', true), 
                    orderBy('viewCount', 'desc'), 
                    limit(10)
                );
                const topPostsSnap = await getDocs(topPostsQuery);
                const topPostsData = topPostsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                setLeaderboards({
                    posts: [...usersData].sort((a, b) => b.postCount - a.postCount).slice(0, 10),
                    followers: [...usersData].sort((a, b) => b.followerCount - a.followerCount).slice(0, 10),
                    likes: [...usersData].sort((a, b) => b.totalLikes - a.totalLikes).slice(0, 10),
                    topPosts: topPostsData,
                });

            } catch (error) {
                console.error("Error fetching leaderboards:", error);
                setError("Could not load leaderboards. Please check your connection or permissions.");
            }
            setLoading(false);
        };
        fetchLeaderboards();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <Loader className="animate-spin text-orange-500 mb-4" size={48} />
                <p className="text-gray-400">Calculating leaderboards...</p>
            </div>
        );
    }
    
    if (error) {
        return <div className="text-center text-red-400">{error}</div>;
    }
    
    return (
        <div className="space-y-8 glass-card p-4">
            <h2 className="text-3xl font-headline bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent mb-8 text-center">
                Trendboard
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-xl font-bold text-accent-cyan flex items-center gap-2 mb-4"><Eye /> Top Posts</h3>
                    <div className="space-y-2">
                        {leaderboards.topPosts.length > 0 ? 
                            leaderboards.topPosts.map((post: any, index: number) => <PostRow key={post.id} post={post} index={index} />) :
                            <p className="text-sm text-gray-500 text-center">No video posts have been viewed yet.</p>
                        }
                    </div>
                </div>
                 <div>
                    <h3 className="text-xl font-bold text-green-400 flex items-center gap-2 mb-4"><User /> Most Followers</h3>
                     <div className="space-y-2">
                        {leaderboards.followers.map((user: any, index: number) => <UserRow key={user.uid} user={user} index={index} metric={user.followerCount} metricLabel="followers" />)}
                    </div>
                </div>
            </div>
        </div>
    );
}
