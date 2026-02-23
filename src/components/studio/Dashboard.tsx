'use client';

import React, { useState, useEffect } from 'react';
import { auth, app } from "@/utils/firebaseClient";
import { getFirestore, collection, query, where, getDocs, collectionGroup } from "firebase/firestore";
import { motion } from "framer-motion";
import { Film, Users, Heart } from 'lucide-react';

const db = getFirestore(app);

const StatCard = ({ icon: Icon, label, value, color, isLoading }: { icon: React.ElementType, label: string, value: number, color: string, isLoading: boolean }) => (
    <motion.div 
        className={`bg-gray-800 p-6 rounded-lg shadow-lg flex items-center space-x-4 border-l-4 ${color}`}>
        <Icon className="h-10 w-10 text-white" />
        <div>
            <h3 className="text-lg font-semibold text-gray-400">{label}</h3>
            {isLoading ? (
                <div className="h-8 w-24 bg-gray-700 rounded-md animate-pulse"></div>
            ) : (
                <p className="text-3xl font-bold text-white">{value}</p>
            )}
        </div>
    </motion.div>
);

export const Dashboard = () => {
  const [stats, setStats] = useState({ postCount: 0, followerCount: 0, totalLikes: 0 });
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      setLoading(true);

      try {
        // 1. Get Post Count
        const postsQuery = query(collection(db, "posts"), where("userId", "==", user.uid));
        const postSnap = await getDocs(postsQuery);
        const postCount = postSnap.size;

        // 2. Get Follower Count
        const followersQuery = query(collection(db, "users", user.uid, "followers"));
        const followerSnap = await getDocs(followersQuery);
        const followerCount = followerSnap.size;

        // 3. Get Total Likes from all posts by the user
        let totalLikes = 0;
        postSnap.docs.forEach(doc => {
            const postData = doc.data();
            if (postData.stars && typeof postData.stars === 'number') {
                totalLikes += postData.stars;
            }
        });

        setStats({ postCount, followerCount, totalLikes });
      } catch (error) {
        console.error("Error fetching creator stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8">
      <h2 className="text-3xl font-bold mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard icon={Film} label="Total Posts" value={stats.postCount} color="border-blue-500" isLoading={loading} />
        <StatCard icon={Users} label="Total Followers" value={stats.followerCount} color="border-green-500" isLoading={loading} />
        <StatCard icon={Heart} label="Total Likes" value={stats.totalLikes} color="border-pink-500" isLoading={loading} />
      </div>
    </motion.div>
  );
};
