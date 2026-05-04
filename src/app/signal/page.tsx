"use client";
import React, { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from 'next/link';
import { getFirestore, collection, query, onSnapshot, orderBy, doc, getDoc, setDoc, addDoc, serverTimestamp, where, writeBatch, getDocs, updateDoc, deleteField, limit, arrayUnion, arrayRemove } from "firebase/firestore";
import { auth, app } from "@/utils/firebaseClient";
import { Users, Bot, Search, CheckSquare, Square, Trash2, X, PlusCircle, Compass, Archive, MoreVertical, Star } from "lucide-react";
import { useAppState } from "@/utils/AppStateContext";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChatLobby } from "@/components/signal/ChatLobby";
import { QuickDropMenu } from "@/components/signal/QuickDropMenu";

const db = getFirestore(app);

const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const now = new Date();

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (targetDate.getTime() === today.getTime()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (targetDate.getTime() === yesterday.getTime()) {
        return 'Yesterday';
    } else {
        if (date.getFullYear() === now.getFullYear()) {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
        }
    }
};

const ChatItem = React.memo(({ chat, selectionMode, isSelected, isStarred, onClick, onArchive, draft, onlineStatus, onLongPress, ...props }: any) => {
    const getInitials = (user: any) => user?.name?.[0] || user?.username?.[0] || "U";
    const x = useMotionValue(0);
    const background = useTransform(
      x,
      [-100, 0, 100],
      ["rgba(239, 68, 68, 1)", "rgba(239, 68, 68, 0)", "rgba(59, 130, 246, 0)"]
    );
    const opacity = useTransform(x, [-50, 0, 50], [1, 0, 1]);

    const handleDragEnd = (event: any, info: any) => {
        if (info.offset.x < -100) {
            onArchive();
        } else if (info.offset.x > 100) {
            onClick();
        }
    };

    return (
        <div className="relative">
             <motion.div
                className="absolute inset-y-0 right-0 flex items-center justify-end pr-8 w-1/2"
                style={{ background }}
            >
                <motion.div style={{ opacity }}>
                    <Archive size={24} className="text-white" />
                </motion.div>
            </motion.div>
            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={handleDragEnd}
                style={{ x }}
                onClick={onClick}
                {...props}
                className={cn(
                    "flex items-center gap-3 px-4 py-3 transition-colors cursor-pointer relative bg-transparent z-10",
                    isSelected ? "bg-white/10" : "hover:bg-white/5 active:scale-[0.98] active:bg-white/[.08]"
                )}
                layout
            >
                {selectionMode === 'chats' && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                        {isSelected ? <CheckSquare className="text-[#00E5FF]" size={20}/> : <Square className="text-gray-500" size={20}/>}
                    </div>
                )}
                <div className={cn("relative w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0", selectionMode === 'chats' && "ml-8")}>
                    {chat.avatar_url ? (
                        <img src={chat.avatar_url} className="w-full h-full object-cover"/>
                    ) : (
                        getInitials(chat)
                    )}

                    {onlineStatus && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-gray-900 shadow-[0_0_10px_rgba(0,229,255,0.7)]" />} 
                    {chat.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#00E5FF] rounded-full flex items-center justify-center text-black text-[10px] font-bold border-2 border-black"/>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {isStarred && <Star size={16} className="text-yellow-400 fill-yellow-400" />}
                      <span className={cn(
                          "truncate font-bold",
                          chat.unreadCount > 0 ? "text-white" : "text-gray-300"
                      )}>
                          {chat.name || chat.username}
                      </span>
                    </div>

                    {chat.lastMessage?.createdAt && (
                        <span className="text-xs text-gray-400">
                            {formatTimestamp(chat.lastMessage.createdAt)}
                        </span>
                    )}
                    </div>

                    <p className={cn(
                        "text-sm truncate",
                        chat.unreadCount > 0 ? "text-white/90" : "text-gray-400",
                    )}>
                    {draft ? <span className="text-yellow-400">{`Draft: ${draft}`}</span> : chat.lastMessage?.text || "Start chatting"}
                    </p>
                </div>
            </motion.div>
        </div>
    );
});
ChatItem.displayName = 'ChatItem';

function useLongPress(callback: (event: React.MouseEvent | React.TouchEvent, context: any) => void, context: any, duration = 500) {
    const timer = useRef<any>(null);

    const onStart = (event: React.MouseEvent | React.TouchEvent) => {
        timer.current = setTimeout(() => {
            callback(event, context);
        }, duration);
    };

    const onEnd = () => {
        if (timer.current) {
            clearTimeout(timer.current);
        }
    };

    return {
        onMouseDown: onStart,
        onTouchStart: onStart,
        onMouseUp: onEnd,
        onTouchEnd: onEnd,
        onMouseLeave: onEnd,
    };
}


function ClientOnlySignalPage({ firebaseUser, userProfile }: { firebaseUser: any, userProfile: any }) {
    const [chats, setChats] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectionMode, setSelectionMode] = useState<'chats' | null>(null);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
    const [onlineStatus, setOnlineStatus] = useState<{ [key: string]: boolean }>({});
    const [quickDropChat, setQuickDropChat] = useState<any>(null);
    const router = useRouter();

    const { drafts } = useAppState();

    const getChatId = (chat: any) => {
        if (!chat) return '';
        return chat.isGroup ? chat.id : [firebaseUser.uid, chat.id].sort().join('_');
    }

    useEffect(() => {
        if (!firebaseUser || !userProfile) return;

        const allUnsubs: (() => void)[] = [];
        const archivedChats = userProfile.signalManagement?.archived || [];
        const starredChats = userProfile.signalManagement?.starred || [];

        const processChatData = async (chatDoc: any, isGroup: boolean) => {
            const chatData = { id: chatDoc.id, ...chatDoc.data(), isGroup };
            const chatId = getChatId(chatData);

            const lastMsgQuery = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "desc"), limit(1));
            const lastMsgSnap = await getDocs(lastMsgQuery);
            const lastMessage = lastMsgSnap.empty ? null : lastMsgSnap.docs[0].data();

            const unreadQuery = query(collection(db, "chats", chatId, "messages"), where("sender", "!=", firebaseUser.uid));
            const unreadSnap = await getDocs(unreadQuery);
            const unreadCount = unreadSnap.docs.filter(doc => !(doc.data().readBy || []).includes(firebaseUser.uid)).length;
            
            if (!isGroup) {
                const otherUserId = chatId.split('_').find(id => id !== firebaseUser.uid);
                if (otherUserId) {
                    const userRef = doc(db, "users", otherUserId);
                    const unsubOnline = onSnapshot(userRef, (doc) => {
                        setOnlineStatus(prev => ({ ...prev, [chatId]: doc.data()?.status === 'online' }));
                    });
                    allUnsubs.push(unsubOnline);
                }
            }

            return { ...chatData, lastMessage, unreadCount };
        }
        
        const sortChats = (chatsToSort: any[]) => {
            return chatsToSort.sort((a, b) => {
                const aChatId = getChatId(a);
                const bChatId = getChatId(b);
                const aIsStarred = starredChats.includes(aChatId);
                const bIsStarred = starredChats.includes(bChatId);

                if (aIsStarred && !bIsStarred) return -1;
                if (!aIsStarred && bIsStarred) return 1;
                return (b.lastMessage?.createdAt?.toDate() || 0) - (a.lastMessage?.createdAt?.toDate() || 0);
            });
        };

        const qGroups = query(collection(db, "groups"), where("members", "array-contains", firebaseUser.uid));
        const unsubGroups = onSnapshot(qGroups, async (groupsSnap) => {
            const groupChatsData = (await Promise.all(groupsSnap.docs.map(d => processChatData(d, true))))
                .filter(gc => gc && !archivedChats.includes(gc.id));

            setChats(prev => {
                const otherChats = prev.filter(c => c.isGroup === false);
                return sortChats([...otherChats, ...groupChatsData]);
            });
        });
        allUnsubs.push(unsubGroups);

        const fetchConnections = async () => {
            const followingRef = collection(db, "users", firebaseUser.uid, "following");
            const followersRef = collection(db, "users", firebaseUser.uid, "followers");
            const [followingSnap, followersSnap] = await Promise.all([getDocs(followingRef), getDocs(followersRef)]);
            
            const followingIds = followingSnap.docs.map(doc => doc.id);
            const followerIds = followersSnap.docs.map(doc => doc.id);
            const allConnections = Array.from(new Set([...followingIds, ...followerIds]));

            const userChatsData = (await Promise.all(allConnections.map(async (uid) => {
                const userDoc = await getDoc(doc(db, "users", uid));
                if (!userDoc.exists()) return null;
                const processed = await processChatData(userDoc, false);
                const chatId = getChatId(processed);
                return !archivedChats.includes(chatId) ? processed : null;
            }))).filter(Boolean) as any[];

            setChats(prev => {
                 const groupChats = prev.filter(c => c.isGroup === true);
                 return sortChats([...groupChats, ...userChatsData]);
            });
        };

        fetchConnections();

        return () => {
            allUnsubs.forEach(unsub => unsub());
        };

    }, [firebaseUser, userProfile]);

    const handleSelectChat = (chat: any) => {
        if (selectionMode === 'chats') {
            handleItemClick(chat.id);
        } else {
            router.push(`/signal/${getChatId(chat)}`);
        }
    };
    
    const handleArchiveChat = async (chatId: string) => {
      const chatToArchive = chats.find(c => c.id === chatId);
      if (!chatToArchive) return;
      const userRef = doc(db, 'users', firebaseUser.uid);
      const fullChatId = getChatId(chatToArchive);
      await updateDoc(userRef, { 'signalManagement.archived': arrayUnion(fullChatId) });
      setChats(prev => prev.filter(c => c.id !== chatId));
    };

    const handleArchiveChats = async () => {
        if (selectedItems.size === 0) return;
        const userRef = doc(db, 'users', firebaseUser.uid);
        const chatIdsToArchive = Array.from(selectedItems).map(id => getChatId(chats.find(c => c.id === id)));
        await updateDoc(userRef, { 'signalManagement.archived': arrayUnion(...chatIdsToArchive) });
        setChats(prev => prev.filter(c => !selectedItems.has(c.id)));
        cancelSelectionMode();
    };
    
    const handleStarChats = async () => {
        if (selectedItems.size === 0) return;
        const currentStarred = userProfile.signalManagement?.starred || [];
        const chatIdsToStar = Array.from(selectedItems).map(id => getChatId(chats.find(c => c.id === id)));
        const newStars = chatIdsToStar.filter(id => !currentStarred.includes(id));

        if (currentStarred.length + newStars.length > 5) {
            alert(`You can only star up to 5 chats. You are trying to star ${newStars.length} new chat(s).`);
            return;
        }

        const userRef = doc(db, 'users', firebaseUser.uid);
        await updateDoc(userRef, { 'signalManagement.starred': arrayUnion(...chatIdsToStar) });
        cancelSelectionMode();
    };

    const handleUnstarChats = async () => {
        if (selectedItems.size === 0) return;
        const userRef = doc(db, 'users', firebaseUser.uid);
        const chatIdsToUnstar = Array.from(selectedItems).map(id => getChatId(chats.find(c => c.id === id)));
        await updateDoc(userRef, { 'signalManagement.starred': arrayRemove(...chatIdsToUnstar) });
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
    };
    
    const toggleSelectionMode = () => {
        setSelectionMode(prev => prev === 'chats' ? null : 'chats');
        setSelectedItems(new Set());
    };

    const cancelSelectionMode = () => {
        setSelectionMode(null);
        setSelectedItems(new Set());
        setIsActionMenuOpen(false);
    };

    const handleLongPress = (event: React.MouseEvent | React.TouchEvent, chat: any) => {
        event.preventDefault();
        event.stopPropagation();
        setQuickDropChat(chat);
    };

    const handleQuickDrop = async (item: string) => {
        if (!quickDropChat) return;
        const chatId = getChatId(quickDropChat);
        await addDoc(collection(db, "chats", chatId, "messages"), {
            sender: firebaseUser.uid,
            createdAt: serverTimestamp(),
            type: 'quick_drop',
            readBy: [firebaseUser.uid],
            reactions: {},
            deletedFor: [],
            text: item,
        });
        setQuickDropChat(null);
    };

    const filteredChats = chats.filter(chat => 
        chat.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        chat.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getMenuOptions = () => {
        const selectedChatIds = Array.from(selectedItems).map(id => getChatId(chats.find(c => c.id === id)));
        const starredChats = userProfile.signalManagement?.starred || [];

        const someSelectedAreStarred = selectedChatIds.some(id => starredChats.includes(id));
        const allSelectedAreStarred = selectedChatIds.every(id => starredChats.includes(id));

        const canStar = !allSelectedAreStarred;
        const canUnstar = someSelectedAreStarred;

        return { canStar, canUnstar };
    }
    
    const ChatItemWithLongPress = ({ chat, ...props }: any) => {
        const longPressProps = useLongPress(handleLongPress, chat);
        return <ChatItem chat={chat} {...props} {...longPressProps} />;
    };


    const { canStar, canUnstar } = getMenuOptions();

  return (
    <div className="fixed inset-0 flex w-full bg-transparent text-white overflow-hidden">
       <div className="w-full md:w-1/3 md:min-w-[350px] border-r border-white/10 bg-[rgba(10,12,20,0.7)] backdrop-blur-xl flex flex-col relative">
            
            <div className="absolute top-0 left-0 w-full z-40 backdrop-blur-xl bg-[rgba(10,12,20,0.8)] border-b border-white/10 shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
                <div className="h-[64px] flex items-center justify-between px-4">
                    <h2 className="text-xl font-bold text-white">Signal</h2>

                    <div className="flex items-center gap-2">
                        <Link href="/squad/explore">
                            <motion.button 
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition text-white text-sm"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Compass size={16}/>
                                Explore
                            </motion.button>
                        </Link>
                        <motion.button
                            onClick={toggleSelectionMode}
                            className="p-2 rounded-full hover:bg-white/10 transition-colors"
                            whileTap={{ scale: 0.9 }}
                        >
                            <MoreVertical size={20} />
                        </motion.button>
                    </div>
                </div>
                <div className="px-4 pt-2 pb-3">
                    <div className="relative">
                    <input
                        type="text"
                        placeholder="Search chats..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-full bg-white/10 border-none text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/40 transition-all"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16}/>
                    </div>
                </div>
            </div>

            <AnimatePresence>
            {selectionMode === 'chats' && (
                <motion.div
                initial={{ y: -80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -80, opacity: 0 }}
                className="absolute top-0 left-0 w-full z-50 bg-black/90 backdrop-blur-xl border-b border-white/10 shadow-lg"
                >
                <div className="h-[64px] flex items-center justify-between px-4">
                    <button className="hover:text-[#00E5FF] transition-colors" onClick={cancelSelectionMode}>
                        <X size={22}/>
                    </button>

                    <span className="font-semibold text-sm">
                    {selectedItems.size} selected
                    </span>

                    <div className="relative">
                        <motion.button
                            onClick={() => setIsActionMenuOpen(p => !p)}
                            className="p-2 rounded-full hover:bg-white/20 transition-colors"
                        >
                            <MoreVertical size={20} />
                        </motion.button>
                        <AnimatePresence>
                        {isActionMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                className="absolute right-0 top-full mt-2 w-48 bg-gray-900 border border-white/10 rounded-lg shadow-xl z-20 py-1"
                            >
                                {canStar && <button key="star" onClick={handleStarChats} className="w-full text-left px-4 py-2 text-sm hover:bg-white/10 flex items-center gap-3">
                                    <Star size={16} /> Star Chats
                                </button>}
                                {canUnstar && <button key="unstar" onClick={handleUnstarChats} className="w-full text-left px-4 py-2 text-sm hover:bg-white/10 flex items-center gap-3">
                                    <Star size={16} className="opacity-50"/> Unstar Chats
                                </button>}
                                <button key="archive" onClick={handleArchiveChats} className="w-full text-left px-4 py-2 text-sm hover:bg-white/10 flex items-center gap-3">
                                    <Archive size={16} /> Archive Chats
                                </button>
                            </motion.div>
                        )}
                        </AnimatePresence>
                    </div>
                </div>
                </motion.div>
            )}
            </AnimatePresence>

            <div className="flex-1 overflow-y-auto pt-32 pb-16">
                {filteredChats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 px-6">
                        <div className="text-lg font-medium text-white mb-2">No chats yet</div>
                        <p className="text-sm">Start a conversation from Explore</p>
                    </div>
                ) : (
                    filteredChats.map((chat) => {
                        const fullChatId = getChatId(chat);
                        return (
                            <ChatItemWithLongPress 
                                key={chat.id}
                                chat={chat}
                                selectionMode={selectionMode}
                                isSelected={selectedItems.has(chat.id)}
                                isStarred={(userProfile.signalManagement?.starred || []).includes(fullChatId)}
                                draft={drafts[fullChatId]}
                                onlineStatus={onlineStatus[fullChatId]}
                                onClick={() => handleSelectChat(chat)}
                                onArchive={() => handleArchiveChat(chat.id)}
                            />
                        )
                    })
                )}
            </div>
        </div>
        <div className="hidden md:flex flex-1 items-center justify-center bg-transparent">
            <ChatLobby />
        </div>
        {quickDropChat && (
             <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setQuickDropChat(null)}>
                <QuickDropMenu
                    onSelect={handleQuickDrop}
                />
            </div>
        )}
    </div>
  );
}

function SignalPage() {
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
        if (user) {
            const userDocRef = doc(db, "users", user.uid);
            const unsubProfile = onSnapshot(userDocRef, (snap) => {
                const profileData = snap.exists() ? snap.data() : {};
                setUserProfile({ uid: user.uid, ...user, ...profileData });
                setFirebaseUser(user);
                setLoading(false);
            });
            return () => unsubProfile();
        } else {
            router.push('/login');
        }
    });
    return () => unsub();
  }, [router]);
  
  if (loading || !firebaseUser || !userProfile) {
    return <div className="flex h-screen items-center justify-center text-gray-300">Loading Signal...</div>;
  }
  return <ClientOnlySignalPage firebaseUser={firebaseUser} userProfile={userProfile} />;
}

export default function SignalPageWrapper() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center text-gray-300">Loading Signal...</div>}>
            <SignalPage />
        </Suspense>
    )
}
