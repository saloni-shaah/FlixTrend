
"use client";
import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore';
import { app } from '@/utils/firebaseClient';
import { Flame, Star, Users, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { InFeedVideoPlayer } from '../video/InFeedVideoPlayer';

const db = getFirestore(app);

function LeaderboardSection({ title, icon, data, renderItem }: { title: string; icon: React.ReactNode; data: any[]; renderItem: (item: any, index: number) => React.ReactNode }) {
    if (!data || data.length === 0) {
        return (
             <section>
                <h3 className="flex items-center gap-2 text-xl font-bold text-accent-cyan mb-3">
                    {icon} {title}
                </h3>
                <p className="text-gray-500 text-sm">Nothing to show here yet.</p>
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
                const postQuery = query(collection(db, "posts"), orderBy("viewCount", "desc"), limit(3));
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

                // Top 3 Liked Users (more complex)
                const allPostsSnap = await getDocs(query(collection(db, "posts"), limit(500))); // Limit to recent 500 for performance
                const userLikes: Record<string, number> = {};
                allPostsSnap.forEach(doc => {
                    const post = doc.data();
                    if(post.starCount && post.userId) {
                        userLikes[post.userId] = (userLikes[post.userId] || 0) + post.starCount;
                    }
                });
                
                const sortedUserIds = Object.keys(userLikes).sort((a,b) => userLikes[b] - userLikes[a]).slice(0,3);

                if (sortedUserIds.length > 0) {
                    const userDocs = await Promise.all(sortedUserIds.map(id => getDoc(doc(db, "users", id))));
                    const likedUsers = userDocs.map(docSnap => docSnap.exists() ? { id: docSnap.id, totalLikes: userLikes[docSnap.id], ...docSnap.data() } : null).filter(Boolean);
                    setTopLikedUsers(likedUsers as any[]);
                }

            } catch (error) {
                console.error("Error fetching trendboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        
    }, []);

    if (loading) {
        return <div className="text-center text-accent-cyan animate-pulse">Loading trends...</div>
    }

    return (
        <div className="w-full flex flex-col items-center gap-12">
            
            {currentPost && <MiniPlayer post={currentPost} />}

            <LeaderboardSection
                title="Top Creators"
                icon={<Trophy className="text-yellow-400" />}
                data={topCreators}
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
                renderItem={(item, index) => (
                    <motion.div key={item.id} initial={{opacity:0, x: -20}} animate={{opacity:1, x:0}} transition={{delay: index * 0.1}}>
                        <Link href={`/squad/${item.id}`} className="glass-card p-3 flex items-center gap-4 hover:border-accent-green">
                             <span className="font-bold text-xl text-gray-500 w-6">#{index + 1}</span>
                             <img src={item.avatar_url} alt={item.username} className="w-12 h-12 rounded-full object-cover"/>
                             <div className="flex-1">
                                <p className="font-bold text-white">{item.name}</p>
                                <p className="text-sm text-gray-400">@{item.username}</p>
                             </div>
                             <span className="font-bold text-accent-green">{item.totalLikes || 0} likes</span>
                        </Link>
                    </motion.div>
                )}
            />

             <LeaderboardSection
                title="Most Active Posters"
                icon={<Flame className="text-accent-pink" />}
                data={topPosters}
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
