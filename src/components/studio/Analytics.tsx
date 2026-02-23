'use client';

import React, { useState, useEffect } from 'react';
import { auth, app } from "@/utils/firebaseClient";
import { getFirestore, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { motion } from "framer-motion";
import { PostCard } from "@/components/PostCard";
import { Users, Heart, Star, BarChartHorizontal } from 'lucide-react';

const db = getFirestore(app);

const AnalyticsStatCard = ({ icon: Icon, label, value, isLoading }: { icon: React.ElementType, label: string, value: string | number, isLoading: boolean }) => (
    <motion.div 
        className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col justify-start text-left">
        <div className="flex items-center space-x-3 mb-2">
            <Icon className="h-6 w-6 text-purple-400" />
            <h3 className="text-md font-semibold text-gray-400">{label}</h3>
        </div>
        {isLoading ? (
            <div className="h-10 w-28 bg-gray-700 rounded-md animate-pulse mt-1"></div>
        ) : (
            <p className="text-4xl font-bold text-white">{value}</p>
        )}
    </motion.div>
);

export const Analytics = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [topPosts, setTopPosts] = useState<any[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!user) return;
      setLoading(true);

      try {
        // Fetch all posts by user
        const postsQuery = query(collection(db, "posts"), where("userId", "==", user.uid));
        const postSnap = await getDocs(postsQuery);
        const userPosts = postSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPosts(userPosts);

        // Calculate total likes
        const total = userPosts.reduce((acc, post) => acc + (post.stars || 0), 0);
        setTotalLikes(total);

        // Sort posts by stars to find top posts
        const sortedPosts = [...userPosts].sort((a, b) => (b.stars || 0) - (a.stars || 0));
        setTopPosts(sortedPosts.slice(0, 3)); // Get top 3 posts

        // Fetch follower count
        const followersQuery = query(collection(db, "users", user.uid, "followers"));
        const followerSnap = await getDocs(followersQuery);
        setFollowerCount(followerSnap.size);

      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [user]);

  const averageLikes = posts.length > 0 ? (totalLikes / posts.length).toFixed(1) : '0';
  // A simple engagement rate: (total likes / total followers) * 100. Capped at 100 for display.
  const engagementRate = followerCount > 0 ? Math.min(((totalLikes / followerCount) / posts.length) * 100, 100).toFixed(2) : '0';


  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8">
      <h2 className="text-3xl font-bold mb-6">Analytics</h2>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <AnalyticsStatCard icon={Users} label="Followers" value={followerCount} isLoading={loading} />
          <AnalyticsStatCard icon={Heart} label="Total Likes" value={totalLikes} isLoading={loading} />
          <AnalyticsStatCard icon={Star} label="Avg. Likes / Post" value={averageLikes} isLoading={loading} />
          <AnalyticsStatCard icon={BarChartHorizontal} label="Engagement Rate" value={`${engagementRate}%`} isLoading={loading} />
      </div>

      {/* Top Performing Content */}
      <div>
        <h3 className="text-2xl font-bold mb-4">Top Performing Content</h3>
        {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="h-96 bg-gray-800 rounded-lg animate-pulse"></div>
                <div className="h-96 bg-gray-800 rounded-lg animate-pulse"></div>
                <div className="h-96 bg-gray-800 rounded-lg animate-pulse"></div>
            </div>
        ) : topPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topPosts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-8 bg-gray-800 rounded-lg">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="text-2xl font-semibold mb-2">Not Enough Data</h3>
            <p className="text-gray-400">Create more posts to see your top performing content here.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
