
"use client";
import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { FollowButton } from './FollowButton';
import { app } from '@/utils/firebaseClient';

const db = getFirestore(app);

export function FollowListModal({ userId, type, onClose, currentUser }: { userId: string, type: 'followers' | 'following' | 'friends', onClose: () => void, currentUser: any }) {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchUsers() {
            setLoading(true);
            try {
                let userIds: string[] = [];

                if (type === 'friends') {
                    const followersSnap = await getDocs(collection(db, "users", userId, "followers"));
                    const followingSnap = await getDocs(collection(db, "users", userId, "following"));
                    const followerIds = followersSnap.docs.map(d => d.id);
                    const followingIds = followingSnap.docs.map(d => d.id);
                    userIds = followerIds.filter(id => followingIds.includes(id));
                } else {
                    const listCollectionRef = collection(db, "users", userId, type);
                    const listSnap = await getDocs(listCollectionRef);
                    userIds = listSnap.docs.map(d => d.id);
                }
                
                if (userIds.length > 0) {
                    const userPromises = userIds.map(id => getDoc(doc(db, "users", id)));
                    const userDocs = await Promise.all(userPromises);
                    const usersData = userDocs.map(docSnap => docSnap.exists() ? { uid: docSnap.id, ...docSnap.data() } : null).filter(Boolean);
                    setUsers(usersData);
                } else {
                    setUsers([]);
                }

            } catch (error) {
                console.error(`Error fetching ${type}:`, error);
            }
            setLoading(false);
        }
        fetchUsers();
    }, [userId, type]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-6 w-full max-w-md relative flex flex-col max-h-[70vh]"
                onClick={e => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">&times;</button>
                <h2 className="text-xl font-headline font-bold mb-4 text-accent-cyan capitalize">{type}</h2>
                <div className="flex-1 overflow-y-auto pr-2">
                    {loading ? (
                        <p className="text-center text-gray-400">Loading...</p>
                    ) : users.length === 0 ? (
                        <p className="text-center text-gray-400">No users to display.</p>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {users.map(user => (
                                <div key={user.uid} className="flex items-center gap-4 p-2 rounded-lg hover:bg-accent-cyan/10">
                                    <Link href={`/squad/${user.uid}`} className="flex items-center gap-3" onClick={onClose}>
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-accent-pink to-accent-cyan flex items-center justify-center text-white font-bold text-lg overflow-hidden shrink-0">
                                            {user.avatar_url ? (
                                                <img src={user.avatar_url} alt={user.name || user.username} className="w-full h-full object-cover" />
                                            ) : (
                                                <span>{user.name?.[0] || user.username?.[0] || 'U'}</span>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold">{user.name || user.username}</div>
                                            <div className="text-xs text-gray-400">@{user.username}</div>
                                        </div>
                                    </Link>
                                    <div className="ml-auto">
                                        <FollowButton profileUser={user} currentUser={currentUser} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
