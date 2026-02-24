'use client';
import React, { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { getFirestore, collection, query, onSnapshot, orderBy, doc, addDoc, serverTimestamp, writeBatch, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { auth, app } from "@/utils/firebaseClient";
import { Loader, X, Trash2, Smile } from "lucide-react";
import { useAppState } from "@/utils/AppStateContext";
import { motion, AnimatePresence } from "framer-motion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

import { ChatHeader } from "@/components/signal/ChatHeader";
import { MessageList } from "@/components/signal/MessageList";
import { ChatInput } from "@/components/signal/ChatInput";
import { FullScreenImageViewer } from "@/components/FullScreenImageViewer";

const db = getFirestore(app);
const storage = getStorage(app);

function ChatPage({ firebaseUser, chatId }: { firebaseUser: any, chatId: string }) {
    const { drafts, setDraft } = useAppState();
    const [selectedChat, setSelectedChat] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);

    const [selectionMode, setSelectionMode] = useState<'messages' | null>(null);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [itemsToDelete, setItemsToDelete] = useState<string[]>([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
    const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
    const [canDeleteForEveryone, setCanDeleteForEveryone] = useState(true);
    const [longPressMenu, setLongPressMenu] = useState<{ x: number, y: number, msgId: string } | null>(null);

    useEffect(() => {
        const handleGlobalClick = () => setLongPressMenu(null);
        window.addEventListener('click', handleGlobalClick);
        return () => window.removeEventListener('click', handleGlobalClick);
    }, []);

    useEffect(() => {
        const isGroupChat = !chatId.includes('_');
        const setupChat = async () => {
            const chatDocRef = isGroupChat ? doc(db, "groups", chatId) : doc(db, "users", chatId.split('_').find(id => id !== firebaseUser.uid)!);
            const chatDocSnap = await getDoc(chatDocRef);
            if (chatDocSnap.exists()) setSelectedChat({ id: chatDocSnap.id, ...chatDocSnap.data(), isGroup: isGroupChat });

            const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));
            const unsub = onSnapshot(q, (snap) => {
                const newMessages = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                const unread = newMessages.filter(m => m.sender !== firebaseUser.uid && !(m.readBy || []).includes(firebaseUser.uid));
                if (unread.length > 0) {
                    const batch = writeBatch(db);
                    unread.forEach(m => batch.update(doc(db, "chats", chatId, "messages", m.id), { readBy: arrayUnion(firebaseUser.uid) }));
                    batch.commit().catch(console.error);
                }
                setMessages(newMessages);
            });
            return unsub;
        };
        const unsubPromise = setupChat();
        return () => { unsubPromise.then(unsub => unsub && unsub()); };
    }, [chatId, firebaseUser.uid]);

    const handleSendMessage = async (text: string, mediaUrl: string | null = null, type: 'text' | 'image' | 'audio' | 'gif' = 'text') => {
        if ((!text.trim() && !mediaUrl) || !selectedChat) return;
        await addDoc(collection(db, "chats", chatId, "messages"), { sender: firebaseUser.uid, createdAt: serverTimestamp(), type, readBy: [firebaseUser.uid], reactions: {}, deletedFor: [], text: text.trim(), ...(mediaUrl && { mediaUrl }) });
    };
    
    const handleInputSend = (content: string, type: 'text' | 'gif' = 'text') => handleSendMessage(content, type === 'gif' ? content : null, type);

    const handleSendFile = async (file: File, type: 'image' | 'audio') => {
        if (file.size > 5 * 1024 * 1024) return alert(`File size cannot exceed 5MB.`);
        try {
            const path = type === 'audio' ? `voice_messages/${firebaseUser.uid}` : `chat_media/${firebaseUser.uid}`;
            const fileRef = storageRef(storage, `${path}/${Date.now()}-${file.name}`);
            const downloadURL = await getDownloadURL(await uploadBytes(fileRef, file));
            await handleSendMessage("", downloadURL, type);
        } catch (error) { console.error("Upload failed:", error); alert("Upload failed. Please try again."); }
    };
    
    const cancelSelectionMode = () => {
        setSelectionMode(null);
        setSelectedItems(new Set());
        setLongPressMenu(null);
        setShowDeleteConfirm(false);
        setItemsToDelete([]);
    };

    const openDeleteConfirmation = (msgId?: string) => {
        const items = msgId ? [msgId] : Array.from(selectedItems);
        if (items.length === 0) return;
        setItemsToDelete(items);

        const allOwned = items.every(id => messages.find(m => m.id === id)?.sender === firebaseUser.uid);
        setCanDeleteForEveryone(allOwned);
        setShowDeleteConfirm(true);
        if (longPressMenu) setLongPressMenu(null);
    };

    const handleDeleteMessages = async (mode: 'me' | 'everyone') => {
        const batch = writeBatch(db);
        itemsToDelete.forEach(messageId => {
            const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
            if (mode === 'me') {
                batch.update(msgRef, { deletedFor: arrayUnion(firebaseUser.uid) });
            } else {
                const message = messages.find(m => m.id === messageId);
                if (message && message.sender === firebaseUser.uid) {
                    batch.delete(msgRef);
                }
            }
        });
        await batch.commit();
        cancelSelectionMode();
    };

    const handleMessageClick = (msgId: string) => {
        if (longPressMenu) return setLongPressMenu(null);
        const newSelection = new Set(selectedItems);
        if (newSelection.has(msgId)) newSelection.delete(msgId); else newSelection.add(msgId);

        if (newSelection.size > 0 && !selectionMode) setSelectionMode('messages');
        else if (newSelection.size === 0 && selectionMode) setSelectionMode(null);
        setSelectedItems(newSelection);
    };
    
    const handleLongPress = (event: React.MouseEvent | React.TouchEvent, msgId: string) => {
        event.preventDefault();
        event.stopPropagation();
        const x = event.type.includes('mouse') ? (event as React.MouseEvent).pageX : (event as React.TouchEvent).touches[0].pageX;
        const y = event.type.includes('mouse') ? (event as React.MouseEvent).pageY : (event as React.TouchEvent).touches[0].pageY;
        setLongPressMenu({ x, y, msgId });
    };

    if (!selectedChat) return <div className="flex h-full w-full items-center justify-center text-accent-cyan"><Loader className="animate-spin" /> Loading Chat...</div>

    return (
        <div className="flex-1 flex flex-col bg-black/40 h-full">
            <ChatHeader selectedChat={selectedChat} />
            
            <AnimatePresence>
                {selectionMode === 'messages' && (
                    <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} className="p-3 border-b border-accent-cyan/10 flex items-center justify-between shrink-0 bg-accent-cyan/10 fixed top-[65px] left-0 right-0 z-20 md:left-1/3">
                        <button onClick={cancelSelectionMode}><X size={24} /></button>
                        <span className="font-bold">{selectedItems.size} selected</span>
                        <button onClick={() => openDeleteConfirmation()}><Trash2 size={24} /></button>
                    </motion.div>
                )}
            </AnimatePresence>

            <MessageList {...{messages, firebaseUser, selectedChat, selectedItems, selectionMode, handleLongPress, handleMessageClick, setShowEmojiPicker, showEmojiPicker, openDeleteConfirmation, setFullScreenImage}} />

            <ChatInput {...{chatId, onSendMessage: handleInputSend, onSendFile: handleSendFile, draft: drafts[chatId] || '', setDraft: (text: string) => setDraft(chatId, text)}} />

            {longPressMenu && (
                 <Popover open={true} onOpenChange={() => setLongPressMenu(null)}>
                     <PopoverTrigger asChild><div style={{ position: 'fixed', left: longPressMenu.x, top: longPressMenu.y }} /></PopoverTrigger>
                     <PopoverContent onClick={(e) => e.stopPropagation()} className="w-auto p-2 bg-gray-800 border-gray-700 rounded-lg shadow-xl">
                         <div className="flex items-center gap-2">
                            <button onClick={() => {setShowEmojiPicker(longPressMenu.msgId); setLongPressMenu(null);}} className="p-2 rounded-full hover:bg-gray-700"><Smile size={20}/></button>
                            <button onClick={() => openDeleteConfirmation(longPressMenu.msgId)} className="p-2 rounded-full hover:bg-gray-700"><Trash2 size={20}/></button>
                         </div>
                     </PopoverContent>
                 </Popover>
            )}

            <AlertDialog open={showDeleteConfirm} onOpenChange={(open) => !open && cancelSelectionMode()}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Delete Message?</AlertDialogTitle></AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteMessages('me')} className="bg-yellow-600 hover:bg-yellow-700">Delete for Me</AlertDialogAction>
                        {canDeleteForEveryone && <AlertDialogAction onClick={() => handleDeleteMessages('everyone')} className="bg-red-600 hover:bg-red-700">Delete for Everyone</AlertDialogAction>}
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
        if (user) setFirebaseUser(user);
        else router.push('/login');
        setLoading(false);
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
