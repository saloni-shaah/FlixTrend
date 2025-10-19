"use client";
import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { app } from '@/utils/firebaseClient';
import { Flame, Star, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { PostCard } from '../PostCard';

const db = getFirestore(app);

function LeaderboardSection({ title, icon, data, renderItem }: { title: string; icon: React.ReactNode; data: any[]; renderItem: (item: any, index: number) => React.ReactNode }) {
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


export function Trendboard() {
    const [topPosts, setTopPosts] = useState<any[]>([]);
    const [topCreators, setTopCreators] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const postQuery = query(collection(db, "posts"), where("isVideo", "==", true), orderBy("viewCount", "desc"), limit(5));
        const creatorQuery = query(collection(db, "users"), orderBy("followerCount", "desc"), limit(5));

        const unsubPosts = onSnapshot(postQuery, (snapshot) => {
            setTopPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const unsubCreators = onSnapshot(creatorQuery, (snapshot) => {
             setTopCreators(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        
        // This is a simplified loading state.
        const timer = setTimeout(() => setLoading(false), 1500);

        return () => {
            unsubPosts();
            unsubCreators();
            clearTimeout(timer);
        };
    }, []);

    if (loading) {
        return <div className="text-center text-accent-cyan animate-pulse">Loading trends...</div>
    }

    return (
        <div className="w-full flex flex-col items-center gap-12">
            <LeaderboardSection
                title="Trending Videos"
                icon={<Flame className="text-accent-pink" />}
                data={topPosts}
                renderItem={(item, index) => (
                    <motion.div key={item.id} initial={{opacity:0, x: -20}} animate={{opacity:1, x:0}} transition={{delay: index * 0.1}}>
                        <PostCard post={item} />
                    </motion.div>
                )}
            />
             <LeaderboardSection
                title="Top Creators"
                icon={<Users className="text-accent-green" />}
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
        </div>
    );
}
