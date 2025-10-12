
"use client";
import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query as firestoreQuery, getDocs, where } from 'firebase/firestore';
import { app } from '@/utils/firebaseClient';
import { Loader, Trophy, User, Star } from 'lucide-react';
import Link from 'next/link';

const db = getFirestore(app);

const UserRow = ({ user, index, metric, metricLabel }: { user: any, index: number, metric: number, metricLabel: string }) => {
    const getRankColor = () => {
        if (index === 0) return 'border-brand-gold text-brand-gold';
        if (index === 1) return 'border-gray-400 text-gray-400';
        if (index === 2) return 'border-orange-400 text-orange-400';
        return 'border-gray-600 text-gray-500';
    };
    return (
        <Link href={`/squad/${user.uid}`}>
            <div className="flex items-center gap-4 p-2 rounded-lg hover:bg-accent-cyan/10 transition-colors">
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
}

export function Trendboard() {
    const [leaderboards, setLeaderboards] = useState<any>({
        posts: [],
        followers: [],
        likes: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboards = async () => {
            setLoading(true);
            try {
                const usersSnap = await getDocs(collection(db, "users"));
                const usersData = await Promise.all(usersSnap.docs.map(async (userDoc) => {
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
                }));

                // Sort and set leaderboards
                setLeaderboards({
                    posts: [...usersData].sort((a, b) => b.postCount - a.postCount).slice(0, 3),
                    followers: [...usersData].sort((a, b) => b.followerCount - a.followerCount).slice(0, 3),
                    likes: [...usersData].sort((a, b) => b.totalLikes - a.totalLikes).slice(0, 3),
                });

            } catch (error) {
                console.error("Error fetching leaderboards:", error);
            }
            setLoading(false);
        };
        fetchLeaderboards();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <Loader className="animate-spin text-accent-purple mb-4" size={48} />
                <p className="text-gray-400">Calculating leaderboards...</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-xl font-bold text-accent-cyan flex items-center gap-2 mb-4"><Trophy /> Most Posts</h3>
                <div className="space-y-2">
                    {leaderboards.posts.map((user: any, index: number) => <UserRow key={user.uid} user={user} index={index} metric={user.postCount} metricLabel="posts" />)}
                </div>
            </div>
             <div>
                <h3 className="text-xl font-bold text-accent-pink flex items-center gap-2 mb-4"><User /> Most Followers</h3>
                 <div className="space-y-2">
                    {leaderboards.followers.map((user: any, index: number) => <UserRow key={user.uid} user={user} index={index} metric={user.followerCount} metricLabel="followers" />)}
                </div>
            </div>
             <div>
                <h3 className="text-xl font-bold text-brand-gold flex items-center gap-2 mb-4"><Star /> Most Likes</h3>
                 <div className="space-y-2">
                    {leaderboards.likes.map((user: any, index: number) => <UserRow key={user.uid} user={user} index={index} metric={user.totalLikes} metricLabel="likes" />)}
                </div>
            </div>
        </div>
    );
}
