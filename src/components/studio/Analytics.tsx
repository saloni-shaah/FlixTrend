'use client';

import React, { useState, useEffect } from 'react';
import { auth, db } from "@/utils/firebaseClient";
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { PostCard } from "@/components/PostCard";
import { Users, Heart, Star, TrendingUp, Activity } from 'lucide-react';

const AnalyticsStatCard = ({ icon: Icon, label, value, isLoading }: { icon: React.ElementType, label: string, value: string | number, isLoading: boolean }) => (
    <motion.div 
        whileHover={{ y: -5, scale: 1.02 }}
        className="glass-card p-6 rounded-2xl flex flex-col justify-start text-left">
        <div className="flex items-center space-x-3 mb-2">
            <Icon className="h-6 w-6 text-accent-cyan" />
            <h3 className="text-md font-semibold text-gray-400">{label}</h3>
        </div>
        {isLoading ? (
            <div className="h-10 w-28 bg-white/5 rounded-md animate-pulse mt-1"></div>
        ) : (
            <p className="text-4xl font-bold text-white">{value}</p>
        )}
    </motion.div>
);

export const Analytics = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [topPosts, setTopPosts] = useState<any[]>([]);
  const [stats, setStats] = useState({ followerCount: 0, totalLikes: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
        setLoading(false);
        setError("User not authenticated.");
        return;
    }

    const fetchAnalyticsData = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. Fetch pre-aggregated stats from user document
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setStats({
                followerCount: userData.Follower_Count ?? 0,
                totalLikes: userData.Total_likes ?? 0,
            });
        } else {
            throw new Error("Could not find user data.");
        }

        // 2. Fetch all posts by user for detailed analysis
        const postsQuery = query(collection(db, "posts"), where("userId", "==", user.uid));
        const postSnap = await getDocs(postsQuery);
        const userPosts = postSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPosts(userPosts);

        // 3. Sort posts by stars to find top posts
        const sortedPosts = [...userPosts].sort((a, b) => (b.stars || 0) - (a.stars || 0));
        setTopPosts(sortedPosts.slice(0, 3)); // Get top 3 posts

      } catch (err: any) {
        console.error("Error fetching analytics data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [user]);

  const averageLikes = posts.length > 0 ? (stats.totalLikes / posts.length).toFixed(1) : '0';
  // A simple engagement rate: (total likes / total followers / number of posts) - more accurate
  const engagementRate = stats.followerCount > 0 && posts.length > 0 ? ((stats.totalLikes / stats.followerCount / posts.length) * 100).toFixed(2) : '0';

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="p-4 sm:p-6 md:p-8">
      <h2 className="text-3xl font-bold mb-6 text-white/90">Analytics</h2>
      
      {error ? (
        <div className="p-8 text-center glass-card">
            <p className="text-red-400">{error}</p>
        </div>
      ) : (
        <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <AnalyticsStatCard icon={Users} label="Followers" value={stats.followerCount} isLoading={loading} />
                <AnalyticsStatCard icon={Heart} label="Total Likes" value={stats.totalLikes} isLoading={loading} />
                <AnalyticsStatCard icon={Star} label="Avg. Likes / Post" value={averageLikes} isLoading={loading} />
                <AnalyticsStatCard icon={Activity} label="Engagement Rate" value={`${engagementRate}%`} isLoading={loading} />
            </div>

            {/* Top Performing Content */}
            <div>
                <h3 className="text-2xl font-bold mb-4 text-white/80 flex items-center gap-2"><TrendingUp/> Top Performing Content</h3>
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="h-96 glass-card rounded-lg animate-pulse"></div>
                        <div className="h-96 glass-card rounded-lg animate-pulse"></div>
                        <div className="h-96 glass-card rounded-lg animate-pulse"></div>
                    </div>
                ) : topPosts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {topPosts.map(post => (
                    <PostCard key={post.id} post={post} />
                    ))}
                </div>
                ) : (
                <div className="text-center py-16 px-8 glass-card rounded-lg">
                    <div className="text-5xl mb-4">📊</div>
                    <h3 className="text-2xl font-semibold mb-2">Not Enough Data</h3>
                    <p className="text-gray-400">Create more posts to see your top performing content here.</p>
                </div>
                )}
            </div>
        </>
      )}
    </motion.div>
  );
};
