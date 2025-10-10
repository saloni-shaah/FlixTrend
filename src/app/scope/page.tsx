"use client";
import React, { useState, useEffect } from "react";
import { getFirestore, collection, query, onSnapshot, getDocs } from "firebase/firestore";
import { app, auth } from "@/utils/firebaseClient";
import { ShortVibesPlayer } from "@/components/ShortVibesPlayer";
import { FollowButton } from "@/components/FollowButton";
import Link from "next/link";
import { motion } from "framer-motion";
import { Flame, Music, Gamepad2, Compass } from "lucide-react";
import { MusicDiscovery } from "@/components/MusicDiscovery";
import { GamesHub } from "@/components/GamesHub";

const db = getFirestore(app);

function ForYouContent() {
  const [shortVibes, setShortVibes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [trendingTags, setTrendingTags] = useState<string[]>([]);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });

    const q = query(collection(db, "posts"));

    const unsubPosts = onSnapshot(q, (snapshot) => {
      const allPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const videos = allPosts.filter(post => 
        post.mediaUrl && /\.(mp4|webm|ogg)$/i.test(post.mediaUrl)
      );
      setShortVibes(videos);

      const tagCounts: { [tag: string]: number } = {};
      allPosts.forEach(post => {
          if (post.hashtags && Array.isArray(post.hashtags)) {
              post.hashtags.forEach((tag: string) => {
                  tagCounts[tag] = (tagCounts[tag] || 0) + 1;
              });
          }
      });
      const sortedTags = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]);
      setTrendingTags(sortedTags.slice(0, 10));
      
      setLoading(false);
    }, (error) => {
      console.error("Error fetching posts:", error);
      setLoading(false);
    });
    
    async function fetchAllUsers() {
      const usersSnap = await getDocs(collection(db, "users"));
      const usersData = usersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
      setAllUsers(usersData);
    }
    
    fetchAllUsers();

    return () => {
      unsubAuth();
      unsubPosts();
    }
  }, []);

  const suggestedUsers = currentUser 
    ? allUsers.filter(u => u.uid !== currentUser.uid)
    : allUsers;

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center text-center p-4 pb-24">
        <div className="text-4xl animate-pulse">🎬</div>
        <p className="text-lg text-muted-foreground mt-2">Loading Vibes...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full">
      <h2 className="text-2xl font-headline text-accent-cyan mb-4 font-bold">Short Vibes</h2>
      <div className="w-full max-w-md h-[70vh] mb-8">
          <ShortVibesPlayer shortVibes={shortVibes} />
      </div>

      <div className="mt-8 w-full max-w-4xl mx-auto">
          <h3 className="text-xl font-headline bg-gradient-to-r from-accent-pink to-accent-cyan bg-clip-text text-transparent mb-4">TrendBoard</h3>
          <motion.div 
              className="glass-card p-4 flex flex-wrap gap-3 justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
          >
              {trendingTags.length > 0 ? trendingTags.map(tag => (
                  <motion.button 
                      key={tag}
                      className="btn-glass flex items-center gap-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                  >
                      <Flame className="text-red-400" /> #{tag}
                  </motion.button>
              )) : <p className="text-muted-foreground">No trending tags yet.</p>}
          </motion.div>
      </div>

      <div className="mt-12 w-full max-w-4xl mx-auto">
        <h3 className="text-xl font-headline bg-gradient-to-r from-accent-pink to-accent-cyan bg-clip-text text-transparent mb-4">Discover Creators</h3>
        {suggestedUsers.length === 0 ? (
          <div className="text-gray-400 text-center py-8">No other users found. Invite your friends to join!</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestedUsers.slice(0, 6).map((user) => (
              <Link key={user.uid} href={`/squad/${user.uid}`} className="block">
                <motion.div 
                  className="glass-card p-4 flex items-center gap-4 hover:border-accent-cyan transition-all cursor-pointer"
                  whileHover={{ scale: 1.03 }}
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-accent-pink to-accent-cyan flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <span>{user.name ? user.name[0] : user.username?.[0] || "U"}</span>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-headline text-accent-cyan">{user.name}</div>
                    <div className="text-xs text-gray-500">@{user.username}</div>
                  </div>
                  {currentUser && <FollowButton profileUser={user} currentUser={currentUser} />}
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ScopePage() {
  const [activeTab, setActiveTab] = useState("for-you");

  const tabs = [
    { id: "for-you", label: "For You", icon: Compass },
    { id: "music", label: "Music", icon: Music },
    { id: "games", label: "Games", icon: Gamepad2 },
  ];

  return (
    <div className="flex flex-col min-h-screen items-center p-4 pb-24 pt-16">
      <div className="w-full max-w-4xl mb-8">
        <div className="glass-card p-2 flex justify-around items-center rounded-full">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-2 rounded-full font-bold text-sm md:text-base flex items-center justify-center gap-2 transition-all ${activeTab === tab.id ? "bg-accent-cyan text-primary shadow-lg" : "bg-transparent text-muted-foreground"}`}
            >
              <tab.icon size={20} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="w-full max-w-5xl">
        {activeTab === "for-you" && <ForYouContent />}
        {activeTab === "music" && <MusicDiscovery />}
        {activeTab === "games" && <GamesHub />}
      </div>
    </div>
  );
}
