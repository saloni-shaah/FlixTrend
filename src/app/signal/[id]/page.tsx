'use client';
import React, { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { getFirestore, collection, query, onSnapshot, orderBy, doc, addDoc, serverTimestamp, writeBatch, updateDoc, arrayUnion, deleteDoc, getDoc } from "firebase/firestore";
import { auth, app } from "@/utils/firebaseClient";
import { Loader, X, Trash2 } from "lucide-react";
import { useAppState } from "@/utils/AppStateContext";
import { motion, AnimatePresence } from "framer-motion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

import { ChatHeader } from "@/components/signal/ChatHeader";
import { MessageList } from "@/components/signal/MessageList";
import { ChatInput } from "@/components/signal/ChatInput";

const db = getFirestore(app);
const storage = getStorage(app);

function ChatPage({ firebaseUser, chatId }: { firebaseUser: any, chatId: string }) {
    const { drafts, setDraft } = useAppState();
    const [selectedChat, setSelectedChat] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);

    const [selectionMode, setSelectionMode] = useState<'messages' | null>(null);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);

    useEffect(() => {
        // --- CORRECTED LOGIC ---
        const isGroupChat = !chatId.includes('_');
        
        const setupChat = async () => {
            let chatDocRef;
            if (isGroupChat) {
                chatDocRef = doc(db, "groups", chatId);
            } else {
                const chatPartnerId = chatId.split('_').find(id => id !== firebaseUser.uid);
                if (!chatPartnerId) {
                    console.error("Could not determine chat partner from ID:", chatId);
                    return; // Exit if partner ID can't be found
                }
                chatDocRef = doc(db, "users", chatPartnerId);
            }

            const chatDocSnap = await getDoc(chatDocRef);
            if (chatDocSnap.exists()) {
                setSelectedChat({ id: chatDocSnap.id, ...chatDocSnap.data(), isGroup: isGroupChat });
            } else {
                console.error("Chat document not found at path:", chatDocRef.path);
                return; // Exit if the chat document doesn't exist
            }

            // Messages subscription can now be safely set up
            const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));
            const unsubMessages = onSnapshot(q, (snap) => {
                const newMessages = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                const unreadMessages = newMessages.filter(msg => msg.sender !== firebaseUser.uid && !(msg.readBy || []).includes(firebaseUser.uid));

                if (unreadMessages.length > 0) {
                    const batch = writeBatch(db);
                    unreadMessages.forEach(msg => {
                        const msgRef = doc(db, "chats", chatId, "messages", msg.id);
                        batch.update(msgRef, { readBy: arrayUnion(firebaseUser.uid) });
                    });
                    batch.commit();
                }
                setMessages(newMessages);
            });

            return () => {
                unsubMessages();
            };
        }

        const unsubscribePromise = setupChat();

        return () => {
            unsubscribePromise.then(unsub => {
                if (unsub) unsub();
            });
        };
        // --- END CORRECTED LOGIC ---
    }, [chatId, firebaseUser.uid]);


    const handleSendMessage = async (text: string, mediaUrl: string | null = null, type: 'text' | 'image' | 'audio' | 'gif' = 'text') => {
        if ((!text.trim() && !mediaUrl) || !selectedChat) return;
        
        const messageData = {
            sender: firebaseUser.uid,
            createdAt: serverTimestamp(),
            type: type,
            readBy: [firebaseUser.uid],
            reactions: {},
            deletedFor: [],
            text: text.trim(),
            ...(mediaUrl && { mediaUrl }),
        };
        
        await addDoc(collection(db, "chats", chatId, "messages"), messageData);
    };
    
    const handleInputSend = (content: string, type: 'text' | 'gif' = 'text') => {
        if (type === 'gif') {
            handleSendMessage('', content, 'gif');
        } else {
            handleSendMessage(content, null, 'text');
        }
    };

    const handleSendFile = async (file: File, type: 'image' | 'audio') => {
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            alert(`File size cannot exceed 5MB.`);
            return;
        }

        try {
            const path = type === 'audio' ? `voice_messages/${firebaseUser.uid}` : `chat_media/${firebaseUser.uid}`;
            const fileName = `${Date.now()}-${file.name}`;
            const fileRef = storageRef(storage, `${path}/${fileName}`);
            
            await uploadBytes(fileRef, file);
            const downloadURL = await getDownloadURL(fileRef);

            await handleSendMessage("", downloadURL, type);
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Upload failed. Please try again.");
        }
    };

    const handleDeleteMessages = async (mode: 'me' | 'everyone') => {
        const batch = writeBatch(db);
        selectedItems.forEach(messageId => {
            const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
            if (mode === 'me') {
                batch.update(msgRef, { deletedFor: arrayUnion(firebaseUser.uid) });
            } else { batch.delete(msgRef); }
        });
        await batch.commit();
        cancelSelectionMode();
    };
    
    const cancelSelectionMode = () => {
        setSelectionMode(null);
        setSelectedItems(new Set());
    };

    const handleMessageClick = (msgId: string) => {
        if (selectionMode === 'messages') {
            const newSelection = new Set(selectedItems);
            if (newSelection.has(msgId)) newSelection.delete(msgId); else newSelection.add(msgId);
            setSelectedItems(newSelection);
            if (newSelection.size === 0) cancelSelectionMode();
        }
    };

    if (!selectedChat) {
        return <div className="flex h-full w-full items-center justify-center text-accent-cyan"><Loader className="animate-spin" /> Loading Chat...</div>
    }

    return (
        <div className="flex-1 flex flex-col bg-black/40 h-full">
            <ChatHeader selectedChat={selectedChat} />
            
            <AnimatePresence>
                {selectionMode === 'messages' && (
                    <motion.div 
                        initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
                        className="p-3 border-b border-accent-cyan/10 flex items-center justify-between shrink-0 bg-accent-cyan/10 fixed top-[65px] left-0 right-0 z-10 md:left-1/3"
                    >
                        <button onClick={cancelSelectionMode}><X size={24} /></button>
                        <span className="font-bold">{selectedItems.size} selected</span>
                        <button onClick={() => setShowDeleteConfirm(true)}><Trash2 size={24} /></button>
                    </motion.div>
                )}
            </AnimatePresence>

            <MessageList 
                messages={messages}
                firebaseUser={firebaseUser}
                selectedChat={selectedChat}
                selectedItems={selectedItems}
                selectionMode={selectionMode}
                onLongPress={(msgId) => { setSelectionMode('messages'); setSelectedItems(new Set([msgId])); }}
                onClick={handleMessageClick}
                onShowEmojiPicker={setShowEmojiPicker}
                showEmojiPicker={showEmojiPicker}
                onShowDeleteConfirm={(msgId) => { setSelectedItems(new Set([msgId])); setShowDeleteConfirm(true); }}
            />

            <ChatInput
                chatId={chatId}
                onSendMessage={handleInputSend}
                onSendFile={handleSendFile}
                draft={drafts[chatId] || ''}
                setDraft={(text) => setDraft(chatId, text)}
            />

            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Delete Message(s)?</AlertDialogTitle></AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteMessages('me')} className="bg-yellow-600 hover:bg-yellow-700">Delete for Me</AlertDialogAction>
                        <AlertDialogAction onClick={() => handleDeleteMessages('everyone')} className="bg-red-600 hover:bg-red-700">Delete for Everyone</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
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
    
    if (loading || !firebaseUser) {
      return <div className="flex h-full items-center justify-center text-accent-cyan"><Loader className="animate-spin" /> Loading...</div>;
    }
    
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
