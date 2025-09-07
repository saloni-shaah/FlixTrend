<<<<<<< HEAD

"use client";
import React, { useState, useEffect } from "react";
import { getFirestore, collection, query, onSnapshot, getDocs, orderBy } from "firebase/firestore";
=======
"use client";
import React, { useState, useEffect } from "react";
import { getFirestore, collection, query, onSnapshot, getDocs } from "firebase/firestore";
>>>>>>> 41a2162a78298df970810cb54c8ed33fc2c24ecf
import { app, auth } from "@/utils/firebaseClient";
import { ShortVibesPlayer } from "@/components/ShortVibesPlayer";
import { FollowButton } from "@/components/FollowButton";
import Link from "next/link";
<<<<<<< HEAD
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Music, Gamepad2, Compass, Crown, Heart } from "lucide-react";
=======
import { motion } from "framer-motion";
import { Flame, Music, Gamepad2, Compass } from "lucide-react";
>>>>>>> 41a2162a78298df970810cb54c8ed33fc2c24ecf
import { MusicDiscovery } from "@/components/MusicDiscovery";
import { GamesHub } from "@/components/GamesHub";

const db = getFirestore(app);

function ForYouContent() {
  const [shortVibes, setShortVibes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
<<<<<<< HEAD
  const [topPosters, setTopPosters] = useState<any[]>([]);
  const [topLiked, setTopLiked] = useState<any[]>([]);

=======
  const [trendingTags, setTrendingTags] = useState<string[]>([]);
>>>>>>> 41a2162a78298df970810cb54c8ed33fc2c24ecf

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });

    const q = query(collection(db, "posts"));

<<<<<<< HEAD
    const unsubPosts = onSnapshot(q, async (snapshot) => {
=======
    const unsubPosts = onSnapshot(q, (snapshot) => {
>>>>>>> 41a2162a78298df970810cb54c8ed33fc2c24ecf
      const allPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const videos = allPosts.filter(post => 
        post.mediaUrl && /\.(mp4|webm|ogg)$/i.test(post.mediaUrl)
      );
      setShortVibes(videos);

<<<<<<< HEAD
      // Calculate Top Posters
      const postCounts: { [userId: string]: number } = {};
      allPosts.forEach(post => {
          postCounts[post.userId] = (postCounts[post.userId] || 0) + 1;
      });

      const sortedPosters = Object.keys(postCounts)
          .sort((a, b) => postCounts[b] - postCounts[a])
          .slice(0, 3);

      // Calculate Top Liked Creators
      const likeCounts: { [userId: string]: number } = {};
      for (const post of allPosts) {
          const starsQuery = query(collection(db, "posts", post.id, "stars"));
          const starsSnap = await getDocs(starsQuery);
          const numStars = starsSnap.size;
          likeCounts[post.userId] = (likeCounts[post.userId] || 0) + numStars;
      }
      
      const sortedLikers = Object.keys(likeCounts)
          .sort((a, b) => likeCounts[b] - likeCounts[a])
          .slice(0, 3);
      
      // Fetch user data for leaderboards
      const usersSnap = await getDocs(collection(db, "users"));
      const usersData = usersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
      setAllUsers(usersData);

      const topPostersData = sortedPosters.map(uid => {
          const user = usersData.find(u => u.uid === uid);
          return user ? { ...user, count: postCounts[uid] } : null;
      }).filter(Boolean);
      setTopPosters(topPostersData);

      const topLikedData = sortedLikers.map(uid => {
          const user = usersData.find(u => u.uid === uid);
          return user ? { ...user, count: likeCounts[uid] } : null;
      }).filter(Boolean);
      setTopLiked(topLikedData);
=======
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
>>>>>>> 41a2162a78298df970810cb54c8ed33fc2c24ecf
      
      setLoading(false);
    }, (error) => {
      console.error("Error fetching posts:", error);
      setLoading(false);
    });
    
<<<<<<< HEAD
=======
    async function fetchAllUsers() {
      const usersSnap = await getDocs(collection(db, "users"));
      const usersData = usersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
      setAllUsers(usersData);
    }
    
    fetchAllUsers();

>>>>>>> 41a2162a78298df970810cb54c8ed33fc2c24ecf
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
<<<<<<< HEAD
      <div className="flex flex-col items-center justify-center text-center p-4">
=======
      <div className="flex flex-col min-h-screen items-center justify-center text-center p-4 pb-24">
>>>>>>> 41a2162a78298df970810cb54c8ed33fc2c24ecf
        <div className="text-4xl animate-pulse">🎬</div>
        <p className="text-lg text-muted-foreground mt-2">Loading Vibes...</p>
      </div>
    );
  }

<<<<<<< HEAD
  const CreatorCard = ({ user, type, rank }: { user: any, type: 'posts' | 'likes', rank: number }) => (
    <Link href={`/squad/${user.uid}`} className="block">
        <motion.div 
            className="glass-card p-4 flex items-center gap-4 hover:border-accent-cyan transition-all cursor-pointer"
            whileHover={{ scale: 1.05, y: -2 }}
        >
            <span className="text-2xl font-bold text-brand-gold w-8 text-center">{rank}</span>
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-accent-pink to-accent-cyan flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                {user.avatar_url ? (
                    <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover rounded-full" />
                ) : (
                    <span>{user.name ? user.name[0] : user.username?.[0] || "U"}</span>
                )}
            </div>
            <div className="flex-1 text-left">
                <div className="font-headline text-accent-cyan">{user.name}</div>
                <div className="text-xs text-gray-400">@{user.username}</div>
            </div>
            <div className="flex items-center gap-1 font-bold text-white">
                {type === 'posts' ? <Crown className="text-yellow-400"/> : <Heart className="text-red-400"/>}
                {user.count}
            </div>
        </motion.div>
    </Link>
  );

  return (
    <div className="flex flex-col items-center w-full">
      <h2 className="text-2xl font-headline text-accent-cyan mb-4 font-bold">Short Vibes</h2>
      <div className="w-full max-w-md h-[32rem] mb-8">
=======
  return (
    <div className="flex flex-col items-center w-full">
      <h2 className="text-2xl font-headline text-accent-cyan mb-4 font-bold">Short Vibes</h2>
      <div className="w-full max-w-md h-[70vh] mb-8">
>>>>>>> 41a2162a78298df970810cb54c8ed33fc2c24ecf
          <ShortVibesPlayer shortVibes={shortVibes} />
      </div>

      <div className="mt-8 w-full max-w-4xl mx-auto">
<<<<<<< HEAD
          <h3 className="text-2xl font-headline bg-gradient-to-r from-accent-pink to-accent-cyan bg-clip-text text-transparent mb-4 text-center">TrendBoard</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-bold text-lg text-center mb-3 text-accent-cyan flex items-center justify-center gap-2"><Crown/> Top Posters</h4>
              <div className="flex flex-col gap-3">
                {topPosters.map((user, idx) => <CreatorCard key={user.uid} user={user} type="posts" rank={idx + 1} />)}
              </div>
            </div>
             <div>
              <h4 className="font-bold text-lg text-center mb-3 text-accent-cyan flex items-center justify-center gap-2"><Heart/> Most Liked</h4>
              <div className="flex flex-col gap-3">
                {topLiked.map((user, idx) => <CreatorCard key={user.uid} user={user} type="likes" rank={idx + 1} />)}
              </div>
            </div>
          </div>
=======
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
>>>>>>> 41a2162a78298df970810cb54c8ed33fc2c24ecf
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
<<<<<<< HEAD
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { id: "for-you", label: "For You", icon: Compass, component: <ForYouContent/> },
    { id: "music", label: "Music", icon: Music, component: <MusicDiscovery/> },
    { id: "games", label: "Games", icon: Gamepad2, component: <GamesHub/> },
  ];
  
  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const handleDragEnd = (e: any, { offset, velocity }: any) => {
    const swipe = swipePower(offset.x, velocity.x);

    if (swipe < -swipeConfidenceThreshold) {
      setActiveTab(prev => Math.min(prev + 1, tabs.length - 1));
    } else if (swipe > swipeConfidenceThreshold) {
      setActiveTab(prev => Math.max(prev - 1, 0));
    }
  };

  const variants = {
    enter: (direction: number) => {
      return {
        x: direction > 0 ? 1000 : -1000,
        opacity: 0
      };
    },
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => {
      return {
        zIndex: 0,
        x: direction < 0 ? 1000 : -1000,
        opacity: 0
      };
    }
  };

  return (
    <div className="flex flex-col w-full">
      <div className="w-full max-w-4xl mb-8 mx-auto">
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
                <span>{tab.label}</span>
              </span>
=======
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
>>>>>>> 41a2162a78298df970810cb54c8ed33fc2c24ecf
            </button>
          ))}
        </div>
      </div>

<<<<<<< HEAD
      <div className="w-full flex-1 relative min-h-[60vh] overflow-y-auto">
        <AnimatePresence initial={false} custom={activeTab}>
             <motion.div
                key={activeTab}
                className="w-full h-full absolute top-0 left-0"
                custom={activeTab}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 }
                }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={1}
                onDragEnd={handleDragEnd}
             >
                {tabs[activeTab].component}
             </motion.div>
        </AnimatePresence>
=======
      <div className="w-full max-w-5xl">
        {activeTab === "for-you" && <ForYouContent />}
        {activeTab === "music" && <MusicDiscovery />}
        {activeTab === "games" && <GamesHub />}
>>>>>>> 41a2162a78298df970810cb54c8ed33fc2c24ecf
      </div>
    </div>
  );
}
<<<<<<< HEAD

    
=======
>>>>>>> 41a2162a78298df970810cb54c8ed33fc2c24ecf
