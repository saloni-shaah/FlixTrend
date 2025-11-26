'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getFirestore, collection, query, where, getDocs, doc, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, app } from '@/utils/firebaseClient';
import { useAuthState } from 'react-firebase-hooks/auth';
import { VibeSpaceLoader } from '@/components/VibeSpaceLoader';
import { ArrowLeft, Check, Plus, Search, User, Users, X } from 'lucide-react';
import Link from 'next/link';

const db = getFirestore(app);

export default function CreateGroupPage() {
    const [user, loading] = useAuthState(auth);
    const router = useRouter();
    const [connections, setConnections] = useState<any[]>([]);
    const [groupName, setGroupName] = useState('');
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (!user) return;
        
        const fetchConnections = async () => {
            const followingRef = collection(db, "users", user.uid, "following");
            const followersRef = collection(db, "users", user.uid, "followers");
            const [followingSnap, followersSnap] = await Promise.all([getDocs(followingRef), getDocs(followersRef)]);
            
            const followingIds = followingSnap.docs.map(doc => doc.id);
            const followerIds = followersSnap.docs.map(doc => doc.id);
            const allConnectionIds = Array.from(new Set([...followingIds, ...followerIds]));
            
            if (allConnectionIds.length > 0) {
                 const userProfilesPromises = allConnectionIds.map(async (uid) => {
                    const userDoc = await getDoc(doc(db, "users", uid));
                    return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null;
                });
                const userProfiles = (await Promise.all(userProfilesPromises)).filter(Boolean);
                setConnections(userProfiles as any[]);
            }
        };

        fetchConnections();
    }, [user]);

    const handleToggleMember = (uid: string) => {
        setSelectedMembers(prev => 
            prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
        );
    };

    const handleCreateGroup = async () => {
        if (!user || !groupName.trim() || selectedMembers.length === 0) return;

        setIsCreating(true);
        try {
            const groupData = {
                name: groupName,
                members: [user.uid, ...selectedMembers],
                admins: [user.uid],
                createdBy: user.uid,
                createdAt: serverTimestamp(),
                isGroup: true,
                avatar_url: null, // Can add group avatar later
            };

            const groupDocRef = await addDoc(collection(db, 'groups'), groupData);
            router.push(`/signal/${groupDocRef.id}`);

        } catch (error) {
            console.error("Error creating group:", error);
            alert("Failed to create group. Please try again.");
        } finally {
            setIsCreating(false);
        }
    };

    if (loading) {
        return <VibeSpaceLoader />;
    }
    
    const filteredConnections = connections.filter(c => 
        c.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="w-full max-w-lg mx-auto flex flex-col p-4">
             <div className="flex items-center gap-4 mb-8">
                <Link href="/signal">
                    <span className="p-2 rounded-full hover:bg-white/10"><ArrowLeft /></span>
                </Link>
                <div>
                    <h1 className="text-2xl font-headline font-bold text-accent-cyan">New Group</h1>
                    <p className="text-sm text-gray-400">{selectedMembers.length > 0 ? `${selectedMembers.length} members selected` : 'Select members'}</p>
                </div>
            </div>
            
            <div className="flex flex-col gap-4">
                 <input
                    type="text"
                    placeholder="Group Name"
                    className="input-glass w-full"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                />
                 <div className="relative">
                    <input
                        type="text"
                        placeholder="Search connections..."
                        className="input-glass w-full pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                </div>
                
                <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-2">
                    {filteredConnections.map(conn => (
                        <div key={conn.id} onClick={() => handleToggleMember(conn.id)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent-cyan/10 cursor-pointer">
                            <div className="relative w-12 h-12 rounded-full bg-black/20 overflow-hidden shrink-0">
                                <img src={conn.avatar_url} alt={conn.username} className="w-full h-full object-cover" />
                                {selectedMembers.includes(conn.id) && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                        <Check className="text-white"/>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="font-bold">{conn.name}</p>
                                <p className="text-sm text-gray-400">@{conn.username}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <button 
                    className="btn-glass bg-accent-pink w-full mt-4" 
                    disabled={!groupName.trim() || selectedMembers.length === 0 || isCreating}
                    onClick={handleCreateGroup}
                >
                    {isCreating ? "Creating..." : "Create Group"}
                </button>
            </div>
        </div>
    );
}