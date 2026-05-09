'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { getFirestore, doc, onSnapshot, getDoc, updateDoc, arrayRemove, collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { auth, app } from '@/utils/firebaseClient';
import { ArrowLeft, Archive, Users, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const db = getFirestore(app);

const ChatItem = ({ chat, onUnarchive }: any) => {
    const init = (u: any) => (u?.name?.[0] || u?.username?.[0] || 'U').toUpperCase();
    
    return (
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04]">
            <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-accent-pink to-accent-cyan flex items-center justify-center font-bold text-white text-base overflow-hidden">
                    {chat.avatar_url
                        ? <img src={chat.avatar_url} alt="" className="w-full h-full object-cover" />
                        : chat.isGroup ? <Users size={20} /> : <span>{init(chat)}</span>
                    }
                </div>
            </div>
            <div className="flex-1 min-w-0">
                <span className='truncate font-bold text-[14.5px] text-white'>
                    {chat.name || chat.username}
                </span>
            </div>
            <button 
                onClick={() => onUnarchive(chat._chatId)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-cyan/10 hover:bg-accent-cyan/20 text-sm text-accent-cyan transition-colors">
                <Archive size={14} />
                Unarchive
            </button>
        </div>
    );
};

export default function ArchivedChatsPage() {
    const [firebaseUser, setFirebaseUser] = useState<any>(null);
    const [archivedChats, setArchivedChats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const getChatId = useCallback((chat: any) => {
        if (!firebaseUser) return null;
        return chat?.isGroup ? chat.id : [firebaseUser.uid, chat?.id].sort().join('_');
    }, [firebaseUser]);

    const processChatData = useCallback(async (chatId: string) => {
        let chatDoc, isGroup = false;
        const groupDocRef = doc(db, 'groups', chatId);
        const groupDoc = await getDoc(groupDocRef);

        if (groupDoc.exists()) {
            chatDoc = groupDoc;
            isGroup = true;
        } else {
            const parts = chatId.split('_');
            if (parts.length !== 2) return null;
            const otherUserId = parts[0] === firebaseUser.uid ? parts[1] : parts[0];
            const userDocRef = doc(db, 'users', otherUserId);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                chatDoc = userDoc;
            }
        }

        if (!chatDoc) return null;

        const chatData = { id: chatDoc.id, ...chatDoc.data(), isGroup };
        return { ...chatData, _chatId: chatId };
    }, [firebaseUser]);

    useEffect(() => {
        const unsubAuth = auth.onAuthStateChanged(user => {
            if (user) {
                setFirebaseUser(user);
                const userDocRef = doc(db, 'users', user.uid);
                const unsubProfile = onSnapshot(userDocRef, async (docSnap) => {
                    if (docSnap.exists()) {
                        const userData = docSnap.data();
                        const archivedIds = userData.signalManagement?.archived ?? [];
                        
                        const chatPromises = archivedIds.map(processChatData);
                        const chats = (await Promise.all(chatPromises)).filter(Boolean);
                        
                        setArchivedChats(chats);
                    }
                    setLoading(false);
                });
                return () => unsubProfile();
            } else {
                router.push('/login');
            }
        });
        return () => unsubAuth();
    }, [router, processChatData]);

    const handleUnarchive = async (chatId: string) => {
        if (firebaseUser) {
            try {
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                await updateDoc(userDocRef, {
                    'signalManagement.archived': arrayRemove(chatId)
                });
                setArchivedChats(prev => prev.filter(c => c._chatId !== chatId));
            } catch (error) {
                console.error("Failed to unarchive chat:", error);
            }
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-transparent">
                <Loader2 className="w-8 h-8 text-accent-cyan animate-spin" />
            </div>
        );
    }

    return (
        <div className="w-full max-w-lg mx-auto p-4">
            <Link href="/settings" className="btn-glass mb-8 inline-flex items-center gap-2">
                <ArrowLeft /> Back to Settings
            </Link>
            <h2 className="text-2xl font-headline font-bold mb-6 text-accent-cyan flex items-center gap-2"><Archive /> Archived Chats</h2>

            {archivedChats.length === 0 ? (
                <p className="text-center text-gray-500">You have no archived chats.</p>
            ) : (
                <div className="bg-white/20 rounded-xl">
                    {archivedChats.map(chat => (
                        <ChatItem key={chat._chatId} chat={chat} onUnarchive={handleUnarchive} />
                    ))}
                </div>
            )}
        </div>
    );
}
