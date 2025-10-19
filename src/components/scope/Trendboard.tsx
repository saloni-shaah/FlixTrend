
"use client";
import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, orderBy, limit, onSnapshot, getDocs, doc, getDoc } from 'firebase/firestore';
import { app } from '@/utils/firebaseClient';
import { Flame, Star, Users, Trophy, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { InFeedVideoPlayer } from '../video/InFeedVideoPlayer';

const db = getFirestore(app);

function LeaderboardSection({ title, icon, data, loading, renderItem, error }: { title: string; icon: React.ReactNode; data: any[]; loading: boolean; renderItem: (item: any, index: number) => React.ReactNode; error?: string | null }) {
    if (loading) {
        return (
            <section>
                <h3 className="flex items-center gap-2 text-xl font-bold text-accent-cyan mb-3">
                    {icon} {title}
                </h3>
                <div className="flex flex-col gap-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="glass-card p-3 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-black/20 animate-pulse"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-black/20 rounded w-3/4 animate-pulse"></div>
                                <div className="h-3 bg-black/20 rounded w-1/2 animate-pulse"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        );
    }
    
    if (error || !data || data.length === 0) {
        return (
             <section>
                <h3 className="flex items-center gap-2 text-xl font-bold text-accent-cyan mb-3">
                    {icon} {title}
                </h3>
                <p className="text-gray-500 text-sm p-4 text-center glass-card">{error || "Nothing to show here yet."}</p>
            </section>
        )
    }

    return (
        <section>
            <h3 className="flex items-center gap-2 text-xl font-bold text-accent-cyan mb-3">
                {icon} {title}
            </h3>
            <div className="flex flex-col gap-3">
                {data.map(renderItem)}
            </div>
        </section>
    );
}

function MiniPlayer({ post }: { post: any }) {
    if (!post) return null;
    return (
        <div className="w-full rounded-2xl overflow-hidden mb-8 glass-card">
            <div className="aspect-video">
                 <InFeedVideoPlayer mediaUrls={Array.isArray(post.mediaUrl) ? post.mediaUrl : [post.mediaUrl]} post={post} />
            </div>
            <div className="p-3">
                <p className="font-bold text-sm truncate">{post.content || 'Video'}</p>
                <p className="text-xs text-gray-400">Continue watching or scroll down to explore trends.</p>
            </div>
        </div>
    );
}

export function Trendboard({ currentPost }: { currentPost: any }) {
    const [topPosts, setTopPosts] = useState<any[]>([]);
    const [topCreators, setTopCreators] = useState<any[]>([]);
    const [topLikedUsers, setTopLikedUsers] = useState<any[]>([]);
    const [topPosters, setTopPosters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const fetchData = async () => {
            try {
                // Top 3 Videos by Views
                const postQuery = query(collection(db, "posts"), where("isVideo", "==", true), orderBy("viewCount", "desc"), limit(3));
                const postSnap = await getDocs(postQuery);
                setTopPosts(postSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    
                // Top 3 Creators by Followers
                const userQueryFollowers = query(collection(db, "users"), orderBy("followerCount", "desc"), limit(3));
                const userSnapFollowers = await getDocs(userQueryFollowers);
                setTopCreators(userSnapFollowers.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                // Top 5 Posters by postCount
                const userQueryPosts = query(collection(db, "users"), orderBy("postCount", "desc"), limit(5));
                const userSnapPosts = await getDocs(userQueryPosts);
                setTopPosters(userSnapPosts.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                // Top 3 Liked Users (by finding users with the most liked posts)
                const likedPostsQuery = query(collection(db, "posts"), orderBy("starCount", "desc"), limit(10));
                const likedPostsSnap = await getDocs(likedPostsQuery);
                const userLikes: Record<string, any> = {};
                likedPostsSnap.docs.forEach(doc => {
                    const post = doc.data();
                    if (post.userId && !userLikes[post.userId]) {
                         userLikes[post.userId] = {
                            id: post.userId,
                            name: post.displayName,
                            username: post.username,
                            avatar_url: post.avatar_url,
                            starCount: post.starCount
                        };
                    }
                });
                const sortedLikedUsers = Object.values(userLikes).sort((a,b) => b.starCount - a.starCount).slice(0,3);
                setTopLikedUsers(sortedLikedUsers);

            } catch (error) {
                console.error("Error fetching trendboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        
    }, []);


    return (
        <div className="w-full flex flex-col items-center gap-12">
            
            {currentPost && <MiniPlayer post={currentPost} />}

            <LeaderboardSection
                title="Top Creators"
                icon={<Trophy className="text-yellow-400" />}
                data={topCreators}
                loading={loading}
                renderItem={(item, index) => (
                    <motion.div key={item.id} initial={{opacity:0, x: -20}} animate={{opacity:1, x:0}} transition={{delay: index * 0.1}}>
                        <Link href={`/squad/${item.id}`} className="glass-card p-3 flex items-center gap-4 hover:border-accent-green">
                             <span className="font-bold text-xl text-gray-500 w-6">#{index + 1}</span>
                             <img src={item.avatar_url} alt={item.username} className="w-12 h-12 rounded-full object-cover"/>
                             <div className="flex-1">
                                <p className="font-bold text-white">{item.name}</p>
                                <p className="text-sm text-gray-400">@{item.username}</p>
                             </div>
                             <span className="font-bold text-accent-green">{item.followerCount || 0} followers</span>
                        </Link>
                    </motion.div>
                )}
            />

            <LeaderboardSection
                title="Most Liked Users"
                icon={<Star className="text-yellow-400" />}
                data={topLikedUsers}
                loading={loading}
                renderItem={(item, index) => (
                    <motion.div key={item.id} initial={{opacity:0, x: -20}} animate={{opacity:1, x:0}} transition={{delay: index * 0.1}}>
                        <Link href={`/squad/${item.id}`} className="glass-card p-3 flex items-center gap-4 hover:border-accent-green">
                             <span className="font-bold text-xl text-gray-500 w-6">#{index + 1}</span>
                             <img src={item.avatar_url} alt={item.username} className="w-12 h-12 rounded-full object-cover"/>
                             <div className="flex-1">
                                <p className="font-bold text-white">{item.name}</p>
                                <p className="text-sm text-gray-400">@{item.username}</p>
                             </div>
                             <span className="font-bold text-accent-green flex items-center gap-1"><Star size={14}/> {item.starCount || 0}</span>
                        </Link>
                    </motion.div>
                )}
            />

             <LeaderboardSection
                title="Most Active Posters"
                icon={<Flame className="text-accent-pink" />}
                data={topPosters}
                loading={loading}
                renderItem={(item, index) => (
                    <motion.div key={item.id} initial={{opacity:0, x: -20}} animate={{opacity:1, x:0}} transition={{delay: index * 0.1}}>
                        <Link href={`/squad/${item.id}`} className="glass-card p-3 flex items-center gap-4 hover:border-accent-green">
                             <span className="font-bold text-xl text-gray-500 w-6">#{index + 1}</span>
                             <img src={item.avatar_url} alt={item.username} className="w-12 h-12 rounded-full object-cover"/>
                             <div className="flex-1">
                                <p className="font-bold text-white">{item.name}</p>
                                <p className="text-sm text-gray-400">@{item.username}</p>
                             </div>
                             <span className="font-bold text-accent-green">{item.postCount || 0} posts</span>
                        </Link>
                    </motion.div>
                )}
            />

            <LeaderboardSection
                title="Top Videos"
                icon={<Flame className="text-accent-pink" />}
                data={topPosts}
                loading={loading}
                renderItem={(item, index) => (
                    <motion.div key={item.id} initial={{opacity:0, x: -20}} animate={{opacity:1, x:0}} transition={{delay: index * 0.1}}>
                        <Link href={`/post/${item.id}`} className="glass-card p-3 flex items-center gap-4 hover:border-accent-pink">
                             <span className="font-bold text-xl text-gray-500 w-6">#{index + 1}</span>
                             <div className="w-16 h-20 rounded-md bg-black overflow-hidden shrink-0">
                                 <InFeedVideoPlayer mediaUrls={Array.isArray(item.mediaUrl) ? item.mediaUrl : [item.mediaUrl]} post={item} />
                             </div>
                             <div className="flex-1">
                                <p className="font-bold text-white truncate">{item.content || "Video"}</p>
                                <p className="text-sm text-gray-400">by @{item.username}</p>
                             </div>
                             <span className="font-bold text-accent-pink">{item.viewCount || 0} views</span>
                        </Link>
                    </motion.div>
                )}
            />
        </div>
    );
}
