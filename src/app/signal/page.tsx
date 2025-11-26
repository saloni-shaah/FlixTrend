
"use client";
import React, { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from 'next/link';
import { getFirestore, collection, query, onSnapshot, orderBy, doc, getDoc, setDoc, addDoc, serverTimestamp, where, writeBatch, getDocs, updateDoc, deleteField, limit } from "firebase/firestore";
import { auth, app } from "@/utils/firebaseClient";
import { Users, Bot, Search, CheckSquare, Square, Trash2, X, PlusCircle } from "lucide-react";
import { useAppState } from "@/utils/AppStateContext";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChatLobby } from "@/components/signal/ChatLobby";

const db = getFirestore(app);

const useLongPress = (callback = () => {}, ms = 300) => {
    const timerRef = useRef<NodeJS.Timeout>();
    const onTouchStart = () => { timerRef.current = setTimeout(callback, ms); };
    const onTouchEnd = () => { if (timerRef.current) clearTimeout(timerRef.current); };
    return { 
        onTouchStart, 
        onTouchEnd, 
        onMouseDown: onTouchStart, 
        onMouseUp: onTouchEnd, 
        onMouseLeave: onTouchEnd 
    };
};

const ChatItem = React.memo(({ chat, selectionMode, isSelected, onLongPress, onClick, drafts }: any) => {
    const getInitials = (user: any) => user?.name?.[0] || user?.username?.[0] || "U";
    const longPressProps = useLongPress(onLongPress);

    return (
        <div 
            {...longPressProps}
            className={cn("w-full flex items-center gap-4 px-4 py-3 text-left transition-colors duration-200 group relative", isSelected ? "bg-accent-cyan/30" : "hover:bg-accent-cyan/10", "cursor-pointer")} 
            onClick={onClick}
        >
            {selectionMode === 'chats' && (
                <div className="absolute left-2 top-1/2 -translate-y-1/2">
                    {isSelected ? <CheckSquare className="text-accent-cyan"/> : <Square className="text-gray-500"/>}
                </div>
            )}
            <div className={cn("relative w-12 h-12 rounded-full bg-gradient-to-tr from-accent-pink to-accent-cyan flex items-center justify-center text-white font-bold text-xl overflow-hidden shrink-0", selectionMode === 'chats' && "ml-8")}>
                {chat.isGroup ? 
                    (chat.avatar_url ? <img src={chat.avatar_url} alt={chat.name} className="w-full h-full object-cover"/> : <Users/>) :
                    (chat.avatar_url ? <img src={chat.avatar_url} alt="avatar" className="w-full h-full object-cover"/> : getInitials(chat))
                }
                 {chat.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent-pink rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-background">
                        {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                    </div>
                )}
            </div>
            <div className="flex-1 overflow-hidden">
                <span className="font-bold text-white block truncate">{chat.name || chat.username}</span>
                <span className="text-xs text-gray-400 block truncate italic">
                    {drafts[chat.id] ? <span className="text-red-400">[Draft] {drafts[chat.id]}</span> : chat.lastMessage?.text || "No messages yet"}
                </span>
            </div>
        </div>
    )
});
ChatItem.displayName = 'ChatItem';


function ClientOnlySignalPage({ firebaseUser, userProfile }: { firebaseUser: any, userProfile: any }) {
    const [chats, setChats] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectionMode, setSelectionMode] = useState<'chats' | null>(null);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const router = useRouter();

    const { drafts } = useAppState();

    useEffect(() => {
        if (!firebaseUser) return;

        // Fetch user's groups
        const qGroups = query(collection(db, "groups"), where("members", "array-contains", firebaseUser.uid));
        const unsubGroups = onSnapshot(qGroups, async (groupsSnap) => {
            const groupChatsPromises = groupsSnap.docs.map(d => processChatData(d, true));
            Promise.all(groupChatsPromises).then(groupChats => {
                setChats(prev => {
                    const existingIds = new Set(prev.filter(p => !p.isGroup).map(p => p.id));
                    const newChats = groupChats.filter(p => !existingIds.has(p.id));
                    return [...prev.filter(p => !p.isGroup), ...newChats].sort((a,b) => (b.lastMessage?.createdAt?.toDate() || 0) - (a.lastMessage?.createdAt?.toDate() || 0));
                });
            });
        });

        const processChatData = async (chatDoc: any, isGroup: boolean) => {
            const chatData = { id: chatDoc.id, ...chatDoc.data(), isGroup };
            const chatId = isGroup ? chatDoc.id : [firebaseUser.uid, chatDoc.id].sort().join('_');
            
            const lastMsgQuery = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "desc"), limit(1));
            const lastMsgSnap = await getDocs(lastMsgQuery);
            const lastMessage = lastMsgSnap.empty ? null : lastMsgSnap.docs[0].data();

            const unreadQuery = query(
                collection(db, "chats", chatId, "messages"), 
                where("sender", "!=", firebaseUser.uid),
            );

            // This is still inefficient but works for a small number of chats.
            // A cloud function would be better to maintain a count.
            const unreadSnap = await getDocs(unreadQuery);
            const unreadCount = unreadSnap.docs.filter(doc => !(doc.data().readBy || []).includes(firebaseUser.uid)).length;

            return { ...chatData, lastMessage, unreadCount };
        }

        const fetchConnections = async () => {
             const followingRef = collection(db, "users", firebaseUser.uid, "following");
            const followersRef = collection(db, "users", firebaseUser.uid, "followers");
            const [followingSnap, followersSnap] = await Promise.all([getDocs(followingRef), getDocs(followersRef)]);
            
            const followingIds = followingSnap.docs.map(doc => doc.id);
            const followerIds = followersSnap.docs.map(doc => doc.id);
            const allConnections = Array.from(new Set([...followingIds, ...followerIds]));
            
            const userProfilesPromises = allConnections.map(async (uid) => {
                const userDoc = await getDoc(doc(db, "users", uid));
                if (!userDoc.exists()) return null;
                return processChatData(userDoc, false);
            });
            Promise.all(userProfilesPromises).then(userChats => {
                setChats(prev => {
                     const existingGroupIds = new Set(prev.filter(p => p.isGroup).map(p => p.id));
                     const newChats = userChats.filter(Boolean).filter(p => !existingGroupIds.has(p.id));
                     return [...prev.filter(p => p.isGroup), ...newChats].sort((a,b) => (b.lastMessage?.createdAt?.toDate() || 0) - (a.lastMessage?.createdAt?.toDate() || 0));
                });
            });
        };

        fetchConnections();

        return () => {
            unsubGroups();
        };

    }, [firebaseUser]);

    const handleSelectChat = (chat: any) => {
        if (selectionMode === 'chats') {
            handleItemClick(chat.id);
        } else {
            const chatId = chat.isGroup ? chat.id : [firebaseUser.uid, chat.id].sort().join('_');
            router.push(`/signal/${chatId}`);
        }
    };

    const handleDeleteChats = async () => {
        if (selectedItems.size === 0) return;
        const batch = writeBatch(db);
        selectedItems.forEach(chatId => {
            const userDeletedChatRef = doc(db, 'users', firebaseUser.uid, 'deletedChats', chatId);
            batch.set(userDeletedChatRef, {
                deletedAt: serverTimestamp()
            });
        });
        await batch.commit();
        setChats(prev => prev.filter(c => !selectedItems.has(c.id)));
        cancelSelectionMode();
    };

    const handleItemClick = (id: string) => {
        const newSelection = new Set(selectedItems);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        setSelectedItems(newSelection);
        if (newSelection.size === 0) {
            setSelectionMode(null);
        }
    };
    
    const cancelSelectionMode = () => {
        setSelectionMode(null);
        setSelectedItems(new Set());
    };

    const filteredChats = chats.filter(chat => 
        chat.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        chat.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="flex h-screen w-full bg-transparent font-body text-white overflow-hidden relative">
        <div className="w-full md:w-1/3 md:min-w-[350px] border-r border-accent-cyan/10 bg-black/60 flex flex-col relative">
            <AnimatePresence>
            {selectionMode === 'chats' ? (
                <motion.div 
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 0 }}
                    className="p-4 border-b border-accent-cyan/10 flex items-center justify-between shrink-0 bg-accent-cyan/10"
                >
                    <button onClick={cancelSelectionMode}><X size={24} /></button>
                    <span className="font-bold">{selectedItems.size} selected</span>
                    <button onClick={() => { if (window.confirm(`Hide ${selectedItems.size} chat(s) from your list?`)) handleDeleteChats(); }}><Trash2 size={24} /></button>
                </motion.div>
            ) : (
                <div className="p-4 border-b border-accent-cyan/10 flex items-center justify-between shrink-0">
                    <h2 className="text-xl font-headline font-bold text-accent-cyan">Signal</h2>
                    <Link href="/signal/create-group">
                        <motion.button 
                            className="btn-glass text-sm"
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Create Group
                        </motion.button>
                    </Link>
                </div>
            )}
            </AnimatePresence>
            
            <div className="p-2">
                <div className="relative">
                    <input 
                        type="text"
                        placeholder="Search chats..."
                        className="input-glass w-full pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto">
                {filteredChats.map((chat) => (
                    <ChatItem 
                        key={chat.id}
                        chat={chat}
                        selectionMode={selectionMode}
                        isSelected={selectedItems.has(chat.id)}
                        drafts={drafts}
                        onClick={() => handleSelectChat(chat)}
                        onLongPress={() => {setSelectionMode('chats'); setSelectedItems(new Set([chat.id]))}}
                    />
                ))}
            </div>
        </div>
        <div className="hidden md:flex flex-1 items-center justify-center bg-black/40">
            <ChatLobby />
        </div>
    </div>
  );
}

function SignalPage() {
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setFirebaseUser(user);
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserProfile({ ...user, ...userDocSnap.data() });
        } else {
          setUserProfile(user);
        }
      } else {
        setFirebaseUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);
  
  if (loading || !firebaseUser || !userProfile) {
    return <div className="flex h-screen items-center justify-center text-accent-cyan">Loading Signal...</div>;
  }
  return <ClientOnlySignalPage firebaseUser={firebaseUser} userProfile={userProfile} />;
}

export default function SignalPageWrapper() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center text-accent-cyan">Loading Signal...</div>}>
            <SignalPage />
        </Suspense>
    )
}
