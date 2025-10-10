"use client";
import React, { useState, useEffect, useCallback } from "react";
import { getFirestore, collection, query, onSnapshot, getDocs, orderBy, limit, where, startAfter } from "firebase/firestore";
import { app, auth } from "@/utils/firebaseClient";
import { ShortsPlayer } from "@/components/ShortsPlayer";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Music, Gamepad2, Flame, User, Heart, Mic } from "lucide-react";
import { MusicDiscovery } from "@/components/MusicDiscovery";
import { GamesHub } from "@/components/GamesHub";

const db = getFirestore(app);
const VIBES_PER_PAGE = 5;

function ForYouContent({ isFullScreen, onDoubleClick }: { isFullScreen: boolean, onDoubleClick: () => void }) {
  const [shortVibes, setShortVibes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  
  const fetchVibes = useCallback(async () => {
    setLoading(true);
    // Simplified query to avoid needing a composite index immediately.
    // This is less efficient as it filters on the client, but it prevents crashing.
    const first = query(
        collection(db, "posts"),
        orderBy("createdAt", "desc"),
        limit(VIBES_PER_PAGE * 2) // Fetch more to account for client-side filtering
    );

    const documentSnapshots = await getDocs(first);
    const firstBatch = documentSnapshots.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(post => {
        const mediaUrl = post.mediaUrl;
        if (!mediaUrl) return false;
        const urls = Array.isArray(mediaUrl) ? mediaUrl : [mediaUrl];
        return urls.some((url: string) => /\.(mp4|webm|ogg)$/i.test(url));
      });
    
    const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];
    setShortVibes(firstBatch);
    setLastVisible(lastDoc);
    setLoading(false);
    setHasMore(!!lastDoc);
  }, []);

  const fetchMoreVibes = useCallback(async () => {
    if (!lastVisible || !hasMore || loadingMore) return;
    setLoadingMore(true);

     const next = query(
        collection(db, "posts"),
        orderBy("createdAt", "desc"),
        startAfter(lastVisible),
        limit(VIBES_PER_PAGE * 2) // Fetch more to account for client-side filtering
    );
    
    const documentSnapshots = await getDocs(next);
    const nextBatch = documentSnapshots.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(post => {
            const mediaUrl = post.mediaUrl;
            if (!mediaUrl) return false;
            const urls = Array.isArray(mediaUrl) ? mediaUrl : [mediaUrl];
            return urls.some((url: string) => /\.(mp4|webm|ogg)$/i.test(url));
        });

    const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];

    setShortVibes(prevVibes => [...prevVibes, ...nextBatch]);
    setLastVisible(lastDoc);
    setLoadingMore(false);
    setHasMore(!!lastDoc);

  }, [lastVisible, hasMore, loadingMore]);
  
  useEffect(() => {
    fetchVibes();
  }, [fetchVibes]);


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-4 h-full">
        <div className="text-4xl animate-pulse">🎬</div>
        <p className="text-lg text-muted-foreground mt-2">Loading Vibes...</p>
      </div>
    );
  }

  return (
    <div 
        className={`w-full h-full transition-all duration-300 ${isFullScreen ? '' : 'max-w-md mx-auto aspect-[9/16] rounded-2xl overflow-hidden'}`} 
        onDoubleClick={onDoubleClick}
    >
        <ShortsPlayer shortVibes={shortVibes} onEndReached={fetchMoreVibes} hasMore={hasMore}/>
    </div>
  );
}


function TrendBoard() {
    const [topPosters, setTopPosters] = useState<any[]>([]);
    const [topFollowed, setTopFollowed] = useState<any[]>([]);
    const [topLiked, setTopLiked] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTrendData = async () => {
            setLoading(true);
            try {
                const usersSnap = await getDocs(collection(db, "users"));
                const users = usersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() }));

                const postsSnap = await getDocs(collection(db, "posts"));
                const posts = postsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // 1. Calculate Top Posters
                const postCounts = users.map(user => {
                    const count = posts.filter(p => p.userId === user.uid).length;
                    return { ...user, postCount: count };
                });
                setTopPosters(postCounts.sort((a, b) => b.postCount - a.postCount).slice(0, 3));

                // 2. Calculate Most Followed
                const followerCounts = await Promise.all(users.map(async user => {
                    const followersSnap = await getDocs(collection(db, "users", user.uid, "followers"));
                    return { ...user, followerCount: followersSnap.size };
                }));
                setTopFollowed(followerCounts.sort((a, b) => b.followerCount - a.followerCount).slice(0, 3));

                // 3. Calculate Most Liked (Corrected Logic)
                const likeCounts = await Promise.all(users.map(async user => {
                    const userPosts = posts.filter(p => p.userId === user.uid);
                    let totalLikes = 0;
                    for (const post of userPosts) {
                        const starsSnap = await getDocs(collection(db, "posts", post.id, "stars"));
                        totalLikes += starsSnap.size;
                    }
                    return { ...user, likeCount: totalLikes };
                }));
                 setTopLiked(likeCounts.sort((a, b) => b.likeCount - a.likeCount).slice(0, 3));

            } catch (e) {
                console.error("Error fetching trend data:", e);
            }
            setLoading(false);
        };
        fetchTrendData();
    }, []);
    
    if (loading) {
        return (
             <div className="glass-card p-6 text-center animate-pulse">
                <h3 className="text-2xl font-headline font-bold text-accent-pink mb-4 flex items-center gap-2 justify-center"><Flame /> Loading Trends...</h3>
            </div>
        );
    }

    return (
        <div className="glass-card p-6 flex flex-col gap-6">
            <h3 className="text-2xl font-headline font-bold text-accent-pink mb-2 flex items-center gap-2 justify-center"><Flame /> Trend Board</h3>
            
            <TrendCategory title="Top Posters" icon={<Mic/>} users={topPosters} statKey="postCount" statLabel="Posts"/>
            <TrendCategory title="Most Followers" icon={<User/>} users={topFollowed} statKey="followerCount" statLabel="Followers" />
            <TrendCategory title="Most Liked" icon={<Heart/>} users={topLiked} statKey="likeCount" statLabel="Likes" />

        </div>
    );
}

function TrendCategory({ title, icon, users, statKey, statLabel }: { title: string, icon: React.ReactNode, users: any[], statKey: string, statLabel: string }) {
     if (users.length === 0) return null;
     return (
        <div className="border-t border-accent-cyan/10 pt-4">
            <div className="font-bold text-accent-cyan mb-3 flex items-center gap-2">{icon} {title}</div>
            <div className="flex flex-col gap-3">
                {users.map(user => (
                    <Link href={`/squad/${user.uid}`} key={user.uid} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent-cyan/10">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent-pink to-accent-cyan flex items-center justify-center text-white font-bold text-lg overflow-hidden shrink-0">
                            {user.avatar_url ? <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover"/> : <User/>}
                        </div>
                        <div className="flex-1">
                            <p className="font-bold">{user.name}</p>
                            <p className="text-xs text-gray-400">@{user.username}</p>
                        </div>
                        <div className="text-right">
                           <p className="font-bold text-accent-cyan">{user[statKey] || 0}</p>
                           <p className="text-xs text-gray-500">{statLabel}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
     )
}


export default function ScopePage() {
  const [activeTab, setActiveTab] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(true);

  const handleDoubleClick = () => {
    setIsFullScreen(prev => !prev);
  }

  const tabs = [
    { id: "for-you", label: "For You", icon: Compass },
    { id: "music", label: "Music", icon: Music, component: <MusicDiscovery/> },
    { id: "games", label: "Games", icon: Gamepad2, component: <GamesHub/> },
  ];
  
  const variants = {
    enter: { opacity: 0, y: 10 },
    center: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  return (
    <div className={`fixed inset-0 top-0 left-0 w-full h-full z-0 transition-colors duration-300 ${isFullScreen ? 'bg-black' : 'bg-background pt-6'}`}>
      
      {/* This container manages the layout switch */}
      <div className={`w-full h-full relative transition-all duration-300 ${isFullScreen ? 'flex items-center' : 'overflow-y-auto'}`}>
        
        {isFullScreen ? (
           <ForYouContent isFullScreen={isFullScreen} onDoubleClick={handleDoubleClick} />
        ) : (
            <div className="w-full max-w-4xl mx-auto flex flex-col gap-8 px-4 pb-24">
                 <div className="glass-card p-2 flex justify-around items-center rounded-full">
                  {tabs.map((tab, index) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(index)}
                      className={`relative flex-1 px-4 py-2 rounded-full font-bold text-sm md:text-base flex items-center justify-center gap-2 transition-colors ${activeTab === index ? "text-primary" : "bg-transparent text-muted-foreground"}`}
                    >
                      {activeTab === index && (
                        <motion.div layoutId="activeScopeTab" className="absolute inset-0 bg-accent-cyan rounded-full z-0"/>
                      )}
                      <span className="relative z-10 flex items-center gap-2">
                        <tab.icon size={20} />
                        <span className="hidden md:inline">{tab.label}</span>
                      </span>
                    </button>
                  ))}
                </div>
                
                <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      variants={variants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.2 }}
                    >
                      {activeTab === 0 && (
                          <div className="grid md:grid-cols-2 gap-8 items-start">
                               <div className="md:col-span-1">
                                   <TrendBoard />
                               </div>
                               <div className="md:col-span-1 h-[60vh] max-h-[700px]">
                                   <ForYouContent isFullScreen={isFullScreen} onDoubleClick={handleDoubleClick} />
                               </div>
                          </div>
                      )}
                      {activeTab !== 0 && tabs[activeTab].component}
                    </motion.div>
                </AnimatePresence>
            </div>
        )}
      </div>
    </div>
  );
}
