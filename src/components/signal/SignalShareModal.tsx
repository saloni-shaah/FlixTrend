'use client';
import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, doc, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { auth, app } from '@/utils/firebaseClient';
import { Send, Search, Users } from 'lucide-react';

const db = getFirestore(app);

export function SignalShareModal({ messages, onClose }: { messages: any[]; onClose: () => void }) {
    const [chats, setChats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedChats, setSelectedChats] = useState<string[]>([]);
    const [isSending, setIsSending] = useState(false);
    const currentUser = auth.currentUser;

    useEffect(() => {
        if (!currentUser) return;

        const fetchChats = async () => {
            setLoading(true);
            try {
                // 1. Fetch groups (Correct)
                const groupQuery = query(collection(db, "groups"), where("members", "array-contains", currentUser.uid));
                const groupsSnap = await getDocs(groupQuery);
                const groupChats = groupsSnap.docs.map(d => ({ ...d.data(), id: d.id, isGroup: true }));

                // 2. Fetch DMs using the logic from your Signal page (Corrected)
                const [followingSnap, followersSnap] = await Promise.all([
                    getDocs(collection(db, 'users', currentUser.uid, 'following')),
                    getDocs(collection(db, 'users', currentUser.uid, 'followers')),
                ]);

                const followingIds = followingSnap.docs.map(d => d.id);
                const followerIds = followersSnap.docs.map(d => d.id);
                const directChatUserIds = Array.from(new Set([...followingIds, ...followerIds]));

                let directChats: any[] = [];
                if (directChatUserIds.length > 0) {
                    const usersQuery = query(collection(db, 'users'), where('__name__', 'in', directChatUserIds));
                    const usersSnap = await getDocs(usersQuery);
                    directChats = usersSnap.docs.map(d => ({ ...d.data(), id: d.id, isGroup: false }));
                }

                // 3. Combine and set the chats
                setChats([...groupChats, ...directChats]);

            } catch (error) {
                console.error("Error fetching chats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchChats();
    }, [currentUser]);


    const handleToggleChat = (chatId: string) => {
        setSelectedChats(prev => 
            prev.includes(chatId) ? prev.filter(id => id !== chatId) : [...prev, chatId]
        );
    };

    const handleSend = async () => {
        if (selectedChats.length === 0 || !currentUser || messages.length === 0) return;
        setIsSending(true);
        
        const sendPromises = selectedChats.flatMap(chatId => {
            const chat = chats.find(c => c.id === chatId);
            if (!chat) return [];
            
            let finalChatId = chat.isGroup ? chat.id : [currentUser.uid, chat.id].sort().join('_');

            return messages.map(messageToForward => {
                const originalMessage = { ...messageToForward };
                delete originalMessage.id;
                delete originalMessage.pending;
                delete originalMessage.reactions;

                return addDoc(collection(db, 'chats', finalChatId, 'messages'), {
                    originalMessage,
                    sender: currentUser.uid,
                    createdAt: serverTimestamp(),
                    type: 'forward',
                });
            })
        });

        try {
            await Promise.all(sendPromises);
        } catch (error) {
            console.error("Error forwarding messages:", error);
        } finally {
            setIsSending(false);
            onClose();
        }
    };

    const filteredChats = searchTerm
        ? chats.filter(c => c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.username?.toLowerCase().includes(searchTerm.toLowerCase()))
        : chats;
    
    const getInitials = (user: any) => user?.name?.[0] || user?.username?.[0] || "U";

    return (
        <div className="fixed inset-0 z-[102] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-4 w-full max-w-md relative flex flex-col max-h-[80vh]"
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-xl font-headline font-bold mb-4 text-accent-cyan text-center">Forward to...</h2>

                <div className="relative mb-4">
                    <input
                        type="text"
                        placeholder="Search chats..."
                        className="input-glass w-full pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                </div>
                
                <div className="flex-1 overflow-y-auto mb-4 border-y border-accent-cyan/10 py-2">
                    {loading ? (
                        <p className="text-center text-gray-400">Loading chats...</p>
                    ) : (
                        <div className="flex flex-col gap-1">
                            {filteredChats.map(chat => (
                                <div 
                                    key={chat.id} 
                                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${selectedChats.includes(chat.id) ? 'bg-accent-cyan/20' : 'hover:bg-accent-cyan/10'}`}
                                    onClick={() => handleToggleChat(chat.id)}
                                >
                                     <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent-pink to-accent-cyan flex items-center justify-center text-white font-bold text-lg overflow-hidden shrink-0">
                                        {chat.isGroup ? 
                                            (chat.avatar_url ? <img src={chat.avatar_url} alt={chat.name} className="w-full h-full object-cover"/> : <Users/>) :
                                            (chat.avatar_url ? <img src={chat.avatar_url} alt="avatar" className="w-full h-full object-cover"/> : getInitials(chat))
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm truncate">{chat.name || chat.username}</p>
                                        <p className="text-xs text-gray-400">{chat.isGroup ? `${chat.members?.length} members` : `@${chat.username}`}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex gap-2 mt-auto">
                    <button className="btn-glass flex-1" onClick={onClose}>Cancel</button>
                    <button 
                        className="btn-glass bg-accent-cyan text-black flex-1 flex items-center justify-center gap-2"
                        onClick={handleSend}
                        disabled={isSending || selectedChats.length === 0}
                    >
                        {isSending ? 'Sending...' : `Send to ${selectedChats.length} chat(s)`} <Send size={16}/>
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
