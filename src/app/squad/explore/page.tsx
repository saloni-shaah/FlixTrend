
"use client";
import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { auth, app } from '@/utils/firebaseClient';
import { FollowButton } from '@/components/FollowButton';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

const db = getFirestore(app);

export default function ExploreCreatorsPage() {
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const currentUser = auth.currentUser;

    useEffect(() => {
        async function fetchAllUsers() {
            setLoading(true);
            try {
                const usersSnap = await getDocs(collection(db, "users"));
                const usersData = usersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
                setAllUsers(currentUser ? usersData.filter(u => u.uid !== currentUser.uid) : usersData);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
            setLoading(false);
        }
        fetchAllUsers();
    }, [currentUser]);

    const filteredUsers = searchTerm
        ? allUsers.filter(user =>
            user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.username?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : allUsers;

    return (
        <div className="flex flex-col w-full pb-24">
            <div className="w-full max-w-4xl mx-auto">
                <h1 className="text-3xl font-headline bg-gradient-to-r from-accent-pink to-accent-cyan bg-clip-text text-transparent mb-6 text-center">
                    Discover Creators
                </h1>
                
                <div className="relative mb-8 w-full max-w-lg mx-auto">
                    <input
                        type="text"
                        className="input-glass w-full pl-12 pr-4 py-3"
                        placeholder="Search for creators..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-brand-gold pointer-events-none">
                        <Search />
                    </span>
                </div>

                {loading ? (
                    <p className="text-center text-accent-cyan animate-pulse">Loading creators...</p>
                ) : filteredUsers.length === 0 ? (
                    <p className="text-center text-gray-400 mt-8">No users found. Try a different search!</p>
                ) : (
                    <motion.div 
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        {filteredUsers.map(user => (
                            <Link key={user.uid} href={`/squad/${user.uid}`} className="block">
                                <motion.div 
                                    className="glass-card p-4 flex flex-col items-center gap-4 hover:border-accent-cyan transition-all cursor-pointer h-full"
                                    whileHover={{ y: -5 }}
                                >
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-accent-pink to-accent-cyan flex items-center justify-center text-white font-bold text-4xl overflow-hidden shrink-0">
                                        {user.avatar_url ? (
                                            <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover rounded-full" />
                                        ) : (
                                            <span>{user.name ? user.name[0] : user.username?.[0] || "U"}</span>
                                        )}
                                    </div>
                                    <div className="flex-1 text-center">
                                        <div className="font-headline text-accent-cyan text-lg">{user.name}</div>
                                        <div className="text-sm text-gray-400">@{user.username}</div>
                                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">{user.bio}</p>
                                    </div>
                                    <FollowButton profileUser={user} currentUser={currentUser} />
                                </motion.div>
                            </Link>
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
