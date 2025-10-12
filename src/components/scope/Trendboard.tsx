
"use client";
import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query as firestoreQuery, getDocs, where } from 'firebase/firestore';
import { app } from '@/utils/firebaseClient';
import { Loader, Trophy, User, MessageSquare } from 'lucide-react';
import Link from 'next/link';

const db = getFirestore(app);

const UserRow = ({ user, index }: { user: any, index: number }) => {
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
                    {user.followerCount !== undefined && <p className="font-bold">{user.followerCount} <span className="text-xs text-gray-500">followers</span></p>}
                    {user.postCount !== undefined && <p className="font-bold">{user.postCount} <span className="text-xs text-gray-500">posts</span></p>}
                    {user.creatorScore !== undefined && <p className="font-bold">{user.creatorScore.toFixed(0)} <span className="text-xs text-gray-500">score</span></p>}
                </div>
            </div>
        </Link>
    );
}

export function Trendboard() {
    const [leaderboards, setLeaderboards] = useState<any>({
        followers: [],
        posts: [],
        creators: [],
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

                    const followerCount = followersSnap.size;
                    const postCount = postsSnap.size;
                    
                    // Simple creator score: followers are 5x more valuable than posts
                    const creatorScore = followerCount * 5 + postCount;

                    return { ...user, followerCount, postCount, creatorScore };
                }));

                // Sort and set leaderboards
                setLeaderboards({
                    followers: [...usersData].sort((a, b) => b.followerCount - a.followerCount).slice(0, 10),
                    posts: [...usersData].sort((a, b) => b.postCount - a.postCount).slice(0, 10),
                    creators: [...usersData].sort((a, b) => b.creatorScore - a.creatorScore).slice(0, 10),
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
                <h3 className="text-xl font-bold text-accent-purple flex items-center gap-2 mb-4"><Trophy /> Top Creators</h3>
                <div className="space-y-2">
                    {leaderboards.creators.map((user: any, index: number) => <UserRow key={user.uid} user={user} index={index} />)}
                </div>
            </div>
             <div>
                <h3 className="text-xl font-bold text-accent-pink flex items-center gap-2 mb-4"><User /> Most Followers</h3>
                 <div className="space-y-2">
                    {leaderboards.followers.map((user: any, index: number) => <UserRow key={user.uid} user={user} index={index} />)}
                </div>
            </div>
             <div>
                <h3 className="text-xl font-bold text-accent-green flex items-center gap-2 mb-4"><MessageSquare /> Most Posts</h3>
                 <div className="space-y-2">
                    {leaderboards.posts.map((user: any, index: number) => <UserRow key={user.uid} user={user} index={index} />)}
                </div>
            </div>
        </div>
    );
}
