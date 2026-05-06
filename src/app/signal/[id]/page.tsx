'use client';
import React, { useEffect, useState, Suspense, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getFirestore, collection, query, onSnapshot, orderBy, doc, addDoc, serverTimestamp, updateDoc, getDoc, limit, startAfter, getDocs, setDoc, Timestamp, arrayUnion } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { auth, app } from "@/utils/firebaseClient";
import { Loader, X, Trash2, Smile, CheckSquare } from "lucide-react";
import { useAppState } from "@/utils/AppStateContext";
import { motion, AnimatePresence } from "framer-motion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuid } from 'uuid';

import { ChatHeader } from "@/components/signal/ChatHeader";
import { MessageList } from "@/components/signal/MessageList";
import { ChatInput } from "@/components/signal/ChatInput";
import { FullScreenImageViewer } from "@/components/FullScreenImageViewer";

const db = getFirestore(app);
const storage = getStorage(app);

interface ChatUser {
  id: string;
  name?: string;
  username?: string;
  avatar_url?: string;
  isGroup?: boolean;
  status?: 'online' | 'offline';
  lastSeen?: any;
}

const debounce = (func, delay) => {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
};

function ChatPage({ firebaseUser, chatId }: { firebaseUser: any, chatId: string }) {
    const { drafts, setDraft } = useAppState();
    const [selectedChat, setSelectedChat] = useState<ChatUser | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    
    const [selectionMode, setSelectionMode] = useState<boolean>(false);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
    const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
    const [longPressMenu, setLongPressMenu] = useState<{ x: number, y: number, msgId: string } | null>(null);

    const [oldestDoc, setOldestDoc] = useState<any>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMoreToLoad, setHasMoreToLoad] = useState(true);

    const bottomRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!loadingMore) {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, loadingMore]);

    useEffect(() => {
        const handleGlobalClick = () => setLongPressMenu(null);
        window.addEventListener('click', handleGlobalClick);
        return () => window.removeEventListener('click', handleGlobalClick);
    }, []);

    useEffect(() => {
        let chatUnsubscribe: () => void;

        const setupChat = async () => {
            if (!firebaseUser?.uid) return;
            const isGroupChat = !chatId.includes('_');

            const chatDocRef = isGroupChat
                ? doc(db, "groups", chatId)
                : doc(db, "users", chatId.split('_').find(id => id !== firebaseUser.uid)!);

            const chatDocSnap = await getDoc(chatDocRef);
            if (chatDocSnap.exists()) {
                const chatData = chatDocSnap.data();
                const members = chatData.members || (isGroupChat ? [] : [chatDocSnap.id, firebaseUser.uid]);
                setSelectedChat({ id: chatDocSnap.id, ...chatData, members, isGroup: isGroupChat });
            }

            const q = query(
                collection(db, "chats", chatId, "messages"),
                orderBy("createdAt", "desc"),
                limit(50)
            );

            chatUnsubscribe = onSnapshot(q, 
              (snap) => {
                const serverDocs = snap.docs;
                const serverMessages = serverDocs.map(d => ({ id: d.id, ...d.data() }));

                setMessages(prev => {
                    const tempMessages = prev.filter(m => m.pending);
                    const serverClientIds = new Set(serverMessages.map(m => m.clientId));
                    const uniqueTempMessages = tempMessages.filter(m => !serverClientIds.has(m.clientId));
                    
                    const combined = [...serverMessages, ...uniqueTempMessages];
                    combined.sort((a, b) => {
                        const aTime = a.createdAt?.toDate?.() || (a.pending ? a.createdAt.getTime() : 0);
                        const bTime = b.createdAt?.toDate?.() || (b.pending ? b.createdAt.getTime() : 0);
                        return aTime - bTime;
                    });

                    return combined;
                });
                
                setOldestDoc(serverDocs[serverDocs.length - 1]);
                setHasMoreToLoad(serverDocs.length === 50);
              },
              (error) => {
                console.error("Messages snapshot error:", error);
              }
            );
        };

        setupChat();

        return () => {
            if (chatUnsubscribe) chatUnsubscribe();
        };
    }, [chatId, firebaseUser.uid]);

    const loadMoreMessages = async () => {
        if (loadingMore || !hasMoreToLoad || !scrollContainerRef.current) return;
        setLoadingMore(true);
    
        const scrollContainer = scrollContainerRef.current;
        const prevHeight = scrollContainer.scrollHeight;
    
        const q = query(
            collection(db, "chats", chatId, "messages"),
            orderBy("createdAt", "desc"),
            startAfter(oldestDoc),
            limit(50)
        );
    
        try {
            const snap = await getDocs(q);
            const olderDocs = snap.docs;
            const olderMessages = olderDocs.map(d => ({ id: d.id, ...d.data() }));

            if (olderDocs.length > 0) {
                setMessages(prev => [...olderMessages.reverse(), ...prev]);
                setOldestDoc(olderDocs[olderDocs.length - 1]);
                setHasMoreToLoad(olderDocs.length === 50);
        
                requestAnimationFrame(() => {
                    const newHeight = scrollContainer.scrollHeight;
                    scrollContainer.scrollTop += (newHeight - prevHeight);
                });

            } else {
                setHasMoreToLoad(false);
            }
        } catch (error: any) {
            if (error.code !== 'permission-denied') {
                console.error("Load more failed:", error);
            }
        } finally {
            setLoadingMore(false);
        }
    };

    const debouncedMarkAsRead = React.useRef(
        debounce(async (messageId: string) => {
            if (!firebaseUser?.uid) return;
            try {
                const messageRef = doc(db, "chats", chatId, "messages", messageId);
                const msgSnap = await getDoc(messageRef);

                if (!msgSnap.exists()) return;

                const data = msgSnap.data();

                if (!data.readBy || !Array.isArray(data.readBy)) {
                    await updateDoc(messageRef, {
                        readBy: [firebaseUser.uid]
                    });
                } else if (!data.readBy.includes(firebaseUser.uid)) {
                    await updateDoc(messageRef, {
                        readBy: arrayUnion(firebaseUser.uid)
                    });
                }
            } catch (error: any) {
                if (error.code !== 'permission-denied') {
                    console.error("Mark read failed:", error);
                }
            }
        }, 2000)
    ).current;

    useEffect(() => {
        if (!messages.length || !firebaseUser?.uid) return;
        
        const lastMsg = messages[messages.length - 1];

        if (lastMsg && lastMsg.id && !lastMsg.pending && lastMsg.sender !== firebaseUser.uid) {
            const isRead = (lastMsg.readBy || []).includes(firebaseUser.uid);
            if (!isRead) {
                debouncedMarkAsRead(lastMsg.id);
            }
        }
    }, [messages, chatId, firebaseUser.uid, debouncedMarkAsRead]);

    const handleSendMessage = async (text: string, mediaUrl: string | null = null, type: 'text' | 'image' | 'audio' | 'gif' | 'video' = 'text') => {
        if (!firebaseUser?.uid) return;
        if ((!text.trim() && !mediaUrl) || !selectedChat) return;

        const clientId = uuid();
        const tempMessage = {
            id: `temp-${clientId}`,
            clientId,
            sender: firebaseUser.uid,
            createdAt: new Date(),
            type,
            reactions: {},
            deletedFor: [],
            readBy: [firebaseUser.uid],
            text: text.trim(),
            mediaUrl: mediaUrl,
            pending: true,
        };
        
        setMessages(prev => [...prev, tempMessage]);

        try {
            const newDocRef = doc(collection(db, "chats", chatId, "messages"));
            await setDoc(newDocRef, { 
                clientId,
                sender: firebaseUser.uid, 
                createdAt: serverTimestamp(),
                type, 
                reactions: {}, 
                deletedFor: [], 
                readBy: [firebaseUser.uid], 
                text: text.trim() || "",
                mediaUrl: mediaUrl || null,
            });
        } catch(e) {
            console.error(e);
            setMessages(prev => prev.filter(m => m.clientId !== clientId));
            alert("Message failed to send");
        }
    };
    
    const handleInputSend = (content: string, type: 'text' | 'gif' = 'text') => handleSendMessage(type === 'gif' ? '' : content, type === 'gif' ? content : null, type);

    const handleSendFile = async (file: File, type: 'image' | 'audio' | 'video') => {
        if (!firebaseUser?.uid) return;
        const sizeLimit = type === 'audio' ? 10 * 1024 * 1024 : 25 * 1024 * 1024;
        if (file.size > sizeLimit) {
            return alert(`File size cannot exceed ${sizeLimit / 1024 / 1024}MB.`);
        }

        try {
            const path = type === 'audio' ? `voice_messages/${firebaseUser.uid}` : `chat_media/${firebaseUser.uid}`;
            const fileRef = ref(storage, `${path}/${uuid()}`);
            await uploadBytes(fileRef, file);
            const downloadURL = await getDownloadURL(fileRef);
            await handleSendMessage("", downloadURL, type);
        } catch (error) { console.error("Upload failed:", error); alert("Upload failed. Please try again."); }
    };
    
    const cancelSelection = () => {
        setSelectionMode(false);
        setSelectedItems(new Set());
        setLongPressMenu(null);
    };

    const handleDeleteMessages = async (forEveryone: boolean) => {
        const functions = getFunctions(app);
        const deleteMessage = httpsCallable(functions, 'deleteMessage');

        const items = Array.from(selectedItems);
        const promises = items.map(messageId => 
            deleteMessage({ chatId, messageId, mode: forEveryone ? 'everyone' : 'me' })
        );

        try {
            await Promise.all(promises);
        } catch (error) {
            console.error("Error deleting messages:", error);
            alert("An error occurred. Please try again.");
        } finally {
            cancelSelection();
            setShowDeleteConfirm(false);
        }
    };

    const handleMessageClick = (msgId: string) => {
        if (longPressMenu) return setLongPressMenu(null);

        if (selectionMode) {
            const newSelection = new Set(selectedItems);
            if (newSelection.has(msgId)) {
                newSelection.delete(msgId);
            } else {
                newSelection.add(msgId);
            }
            setSelectedItems(newSelection);

            if (newSelection.size === 0) {
                setSelectionMode(false);
            }
        }
    };

    const startSelection = (msgId: string) => {
        setSelectionMode(true);
        setSelectedItems(new Set([msgId]));
        setLongPressMenu(null);
    };
    
    const handleLongPressOrContextMenu = (event: React.MouseEvent | React.TouchEvent, msgId: string) => {
        event.preventDefault();
        event.stopPropagation();
        
        if (selectionMode) return; // Don't show menu in selection mode

        let x: number, y: number;
        if ('touches' in event && event.touches.length > 0) {
            x = event.touches[0].pageX;
            y = event.touches[0].pageY;
        } else {
            x = (event as React.MouseEvent).pageX;
            y = (event as React.MouseEvent).pageY;
        }

        setLongPressMenu({ x, y, msgId });
    };

    if (!selectedChat) return <ChatHeader selectedChat={null} />

    const canDeleteForEveryone = Array.from(selectedItems).every(id => messages.find(m => m.id === id)?.sender === firebaseUser.uid);

    return (
        <div className="flex-1 flex flex-col bg-black/40 h-full pt-4 pb-6">
             <AnimatePresence>
                {selectionMode ? (
                     <motion.div 
                         initial={{ opacity: 0, y: -60 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0, y: -60 }}
                         transition={{ duration: 0.3, ease: "easeInOut" }}
                         className="fixed top-0 left-0 right-0 z-20 p-3 flex items-center justify-between bg-black/70 backdrop-blur-md border-b border-white/10"
                     >
                        <button onClick={cancelSelection} className="p-2 rounded-full hover:bg-white/10"><X size={24} /></button>
                        <motion.span layout className="font-bold text-lg text-white">{selectedItems.size} selected</motion.span>
                        <button onClick={() => setShowDeleteConfirm(true)} className="p-2 rounded-full hover:bg-red-500/20 text-red-500"><Trash2 size={24} /></button>
                    </motion.div>
                ) : (
                     <ChatHeader selectedChat={selectedChat} />
                )}
            </AnimatePresence>


            <MessageList {...{messages, firebaseUser, selectedChat, selectedItems, selectionMode, handleLongPress: handleLongPressOrContextMenu, onContextMenu: handleLongPressOrContextMenu, handleMessageClick, setShowEmojiPicker, showEmojiPicker, setFullScreenImage, bottomRef, loadMoreMessages, loadingMore, hasMoreToLoad, scrollContainerRef}} />

            <ChatInput {...{chatId, onSendMessage: handleInputSend, onSendFile: handleSendFile, draft: drafts[chatId] || '', setDraft: (text: string) => setDraft(chatId, text)}} />

            {longPressMenu && (
                 <Popover open={true} onOpenChange={() => setLongPressMenu(null)}>
                     <PopoverTrigger asChild><div style={{ position: 'fixed', left: longPressMenu.x, top: longPressMenu.y }} /></PopoverTrigger>
                     <PopoverContent onClick={(e) => e.stopPropagation()} className="w-auto p-1 bg-gray-900/80 backdrop-blur-sm border border-white/10 rounded-xl shadow-xl">
                         <div className="flex items-center gap-1">
                            <button onClick={() => startSelection(longPressMenu.msgId)} className="p-2 rounded-full hover:bg-white/10"><CheckSquare size={18}/></button>
                            <button onClick={() => {setShowEmojiPicker(longPressMenu.msgId); setLongPressMenu(null);}} className="p-2 rounded-full hover:bg-white/10"><Smile size={18}/></button>
                            {messages.find(m => m.id === longPressMenu.msgId)?.sender === firebaseUser.uid && 
                                <button onClick={() => { startSelection(longPressMenu.msgId); setShowDeleteConfirm(true); }} className="p-2 rounded-full hover:bg-white/10 text-red-500"><Trash2 size={18}/></button>
                            }
                         </div>
                     </PopoverContent>
                 </Popover>
            )}

            <AlertDialog open={showDeleteConfirm} onOpenChange={(open) => !open && setShowDeleteConfirm(false)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Message{selectedItems.size > 1 && 's'}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={cancelSelection}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteMessages(false)} className="bg-yellow-600 hover:bg-yellow-700">Delete for Me</AlertDialogAction>
                        {canDeleteForEveryone && <AlertDialogAction onClick={() => handleDeleteMessages(true)} className="bg-red-600 hover:bg-red-700">Delete for Everyone</AlertDialogAction>}
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <FullScreenImageViewer imageUrl={fullScreenImage} onClose={() => setFullScreenImage(null)} />
        </div>
    )
}

function ChatPageWrapper() {
    const params = useParams();
    const chatId = params.id as string;
    const [firebaseUser, setFirebaseUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
  
    useEffect(() => {
      const unsub = auth.onAuthStateChanged((user) => {
        if (user) {
            setFirebaseUser(user);
            setLoading(false);
        } else {
            router.push('/login');
        }
      });
      return () => unsub();
    }, [router]);
    
    if (loading || !firebaseUser) return <div className="flex h-full items-center justify-center text-accent-cyan"><Loader className="animate-spin" /> Loading...</div>;
    
    return <ChatPage firebaseUser={firebaseUser} chatId={chatId} />;
}

export default function SignalChatPage() {
    return (
        <div className="h-full w-full">
            <Suspense fallback={<div className="flex h-full items-center justify-center text-accent-cyan"><Loader className="animate-spin" /> Loading Chat...</div>}>
                <ChatPageWrapper />
            </Suspense>
        </div>
    )
}
