'use client';

import React, { useState, useEffect } from 'react';
import { auth, db } from "@/utils/firebaseClient";
import { doc, getDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { Film, Users, Heart } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color, isLoading }: { icon: React.ElementType, label: string, value: number, color: string, isLoading: boolean }) => (
    <motion.div 
        whileHover={{ y: -5, scale: 1.02 }}
        className={`glass-card p-6 rounded-2xl flex items-center space-x-4 border-l-4 ${color}`}>
        <Icon className={`h-10 w-10 text-white/80 ${color.replace('border', 'text')}`} />
        <div>
            <h3 className="text-lg font-semibold text-gray-400">{label}</h3>
            {isLoading ? (
                <div className="h-8 w-24 bg-white/5 rounded-md animate-pulse mt-1"></div>
            ) : (
                <p className="text-3xl font-bold text-white">{value.toLocaleString()}</p>
            )}
        </div>
    </motion.div>
);

export const Dashboard = () => {
  const [stats, setStats] = useState({ postCount: 0, followerCount: 0, totalLikes: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
        setLoading(false);
        setError("User not authenticated.");
        return;
    }

    const fetchStats = async () => {
      setLoading(true);
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const postCount = userData.Posts_Count ?? 0;
            const followerCount = userData.Follower_Count ?? 0;
            const totalLikes = userData.Total_likes ?? 0;
            setStats({ postCount, followerCount, totalLikes });
        } else {
            setError("Could not find user data.");
        }

      } catch (err) {
        console.error("Error fetching creator stats:", err);
        setError("Failed to fetch creator stats.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="p-4 sm:p-6 md:p-8">
      <h2 className="text-3xl font-bold mb-6 text-white/90">Dashboard</h2>
        {error ? (
            <div className="p-8 text-center">
                <p className="text-red-400">{error}</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard icon={Film} label="Total Posts" value={stats.postCount} color="border-accent-cyan" isLoading={loading} />
                <StatCard icon={Users} label="Total Followers" value={stats.followerCount} color="border-green-500" isLoading={loading} />
                <StatCard icon={Heart} label="Total Likes" value={stats.totalLikes} color="border-pink-500" isLoading={loading} />
            </div>
        )}
    </motion.div>
  );
};
