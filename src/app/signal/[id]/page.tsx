
"use client";
import React, { useEffect, useState, useRef, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { getFirestore, collection, query, onSnapshot, orderBy, doc, getDoc, setDoc, addDoc, serverTimestamp, where, writeBatch, getDocs, updateDoc, deleteDoc, arrayUnion, arrayRemove, deleteField, limit } from "firebase/firestore";
import { auth, app } from "@/utils/firebaseClient";
import { Phone, Video, Paperclip, Mic, Send, ArrowLeft, Image as ImageIcon, X, Smile, Trash2, Users, CheckSquare, Square, MoreVertical, UserPlus, UserX, Edit, Shield, EyeOff, LogOut, UploadCloud, UserCircle, Cake, MapPin, AtSign, User, Bot, Search, Check } from "lucide-react";
import { useAppState } from "@/utils/AppStateContext";
import { createCall } from "@/utils/callService";
import { motion, AnimatePresence } from "framer-motion";
import { uploadFileToFirebaseStorage } from '@/app/actions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions(app);
const db = getFirestore(app);
const deleteMessageCallable = httpsCallable(functions, 'deleteMessage');

const anonymousNames = ["Ram", "Shyam", "Sita", "Mohan", "Krishna", "Radha", "Anchal", "Anaya", "Advik", "Diya", "Rohan", "Priya", "Arjun", "Saanvi", "Kabir"];
const generateAnonymousName = (userId: string, chatId: string) => {
    const hash = (str: string) => {
        let h = 0;
        for (let i = 0; i < str.length; i++) {
            h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
        }
        return h;
    };
    const nameIndex = Math.abs(hash(userId + chatId)) % anonymousNames.length;
    const num = Math.abs(hash(chatId + userId)) % 900 + 100;
    return `${anonymousNames[nameIndex]}${num}`;
};

const useLongPress = (callback: () => void, ms = 300) => {
    const timerRef = useRef<NodeJS.Timeout>();
    const onTouchStart = () => { timerRef.current = setTimeout(callback, ms); };
    const onTouchEnd = () => { if (timerRef.current) clearTimeout(timerRef.current); };
    return { onTouchStart, onTouchEnd, onMouseDown: onTouchStart, onMouseUp: onTouchEnd, onMouseLeave: onTouchEnd };
};

function timeSince(date: Date) {
    if (!date) return "";
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "just now";
}

const MessageItem = React.memo(({ msg, isUser, selectedChat, firebaseUser, isSelected, onLongPress, onClick, onReact, onShowEmojiPicker, showEmojiPicker, onShowDeleteConfirm, selectionMode }: any) => {
    const longPressProps = useLongPress(onLongPress);
    const senderInfo = selectedChat.isGroup ? (selectedChat.groupType === 'simple' ? selectedChat.memberInfo?.[msg.sender] : null) : selectedChat;
    const displayName = selectedChat.groupType === 'anonymous' ? generateAnonymousName(msg.sender, selectedChat.id) : selectedChat.groupType === 'pseudonymous' ? selectedChat.pseudonyms?.[msg.sender] || 'Anon' : senderInfo?.name || "User";
    const defaultReactions = ["👍", "❤️", "😂", "😢", "😮", "🙏"];

    return (
        <div 
            key={msg.id} 
            onClick={onClick}
            {...longPressProps}
            className={cn("group flex w-full items-end gap-2", isUser ? "justify-end" : msg.sender === 'system' ? 'justify-center' : "justify-start", selectionMode === 'messages' && "cursor-pointer")}
        >
        <div className={cn("flex items-end gap-2 max-w-[80%] md:max-w-[70%]", isSelected && "bg-accent-cyan/20 rounded-xl")}>
            <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div className={`relative px-4 py-2 rounded-2xl transition-all duration-300 ${isUser ? "bg-accent-cyan text-white rounded-br-none" : msg.sender === 'system' ? "bg-gray-800 text-gray-400 text-xs italic" : "bg-gray-700 text-white rounded-bl-none"}`}>
                    {!isUser && msg.sender !== 'system' && (
                        <div className="font-bold text-sm text-accent-pink">{displayName}</div>
                    )}
                    {msg.type === 'image' && <img src={msg.mediaUrl} alt={msg.text || "image"} className="rounded-lg max-w-xs" />}
                    {msg.type === 'video' && <video src={msg.mediaUrl} controls className="rounded-lg max-w-xs" />}
                    {msg.type === 'audio' && <audio src={msg.mediaUrl} controls />}
                    {msg.text && <p className="mt-1 break-words">{msg.text}</p>}
                    
                    {msg.sender !== 'system' && (
                    <div className={`text-xs mt-1 flex items-center gap-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
                        <span>{msg.createdAt?.toDate?.().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ""}</span>
                    </div>
                    )}
                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div className="absolute -bottom-4 -right-1 flex gap-1">
                            {Object.entries(msg.reactions).map(([emoji, uids]: [string, any]) => (
                                <div key={emoji} className="bg-gray-600 px-1.5 py-0.5 rounded-full text-xs flex items-center gap-1">
                                    <span>{emoji}</span>
                                    <span className="font-bold text-xs">{Array.isArray(uids) ? uids.length : 0}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className={`relative hidden group-hover:flex items-center gap-1 mt-1 ${isUser ? "flex-row-reverse" : ""}`}>
                {msg.sender !== 'system' && 
                    <>
                        <div className="relative">
                        <button onClick={() => onShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)} className="p-1 rounded-full bg-gray-600 hover:bg-gray-500"><Smile size={16}/></button>
                            <AnimatePresence>
                            {showEmojiPicker === msg.id && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute z-10 -top-10 bg-gray-800 rounded-full p-2 flex gap-1 shadow-lg"
                                >
                                    {defaultReactions.map(emoji => (
                                        <button key={emoji} onClick={() => onReact(msg.id, emoji)} className="text-xl hover:scale-125 transition-transform">{emoji}</button>
                                    ))}
                                </motion.div>
                            )}
                            </AnimatePresence>
                        </div>
                    </>
                }
                {isUser && <button onClick={onShowDeleteConfirm} className="p-1 rounded-full bg-gray-600 hover:bg-red-500"><Trash2 size={16}/></button>}
                </div>
            </div>
            </div>
        </div>
    );
});
MessageItem.displayName = 'MessageItem';


function ChatPage({ firebaseUser, userProfile, chatId }: { firebaseUser: any, userProfile: any, chatId: string }) {
    const router = useRouter();
    const { drafts, setDraft } = useAppState();
    const [selectedChat, setSelectedChat] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const [selectionMode, setSelectionMode] = useState<'messages' | null>(null);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
    const [typingStatus, setTypingStatus] = useState<string[]>([]);
    const [onlineStatus, setOnlineStatus] = useState<any>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (drafts[chatId]) {
            setNewMessage(drafts[chatId]);
        } else {
            setNewMessage('');
        }
    }, [chatId, drafts]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);
        if(!selectedChat) return;
        setDraft(chatId, e.target.value);

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        
        const updateRef = doc(db, selectedChat.isGroup ? "groups" : "users", selectedChat.id);
        updateDoc(updateRef, {
            typing: arrayUnion(firebaseUser.uid)
        }).catch(() => {});

        typingTimeoutRef.current = setTimeout(() => {
            updateDoc(updateRef, {
                typing: arrayRemove(firebaseUser.uid)
            }).catch(() => {});
        }, 3000);
    };

    useEffect(() => {
        if (!chatId || !firebaseUser) return;
    
        // Determine if it's a group or 1-on-1 chat
        const isGroupChat = !chatId.includes('_');
        let unsub: Unsubscribe;
    
        if (isGroupChat) {
            unsub = onSnapshot(doc(db, "groups", chatId), (doc) => {
                if (doc.exists()) {
                    setSelectedChat({ id: doc.id, ...doc.data(), isGroup: true });
                }
            });
        } else {
            const otherUserId = chatId.replace(firebaseUser.uid, '').replace('_', '');
            unsub = onSnapshot(doc(db, "users", otherUserId), (doc) => {
                if(doc.exists()) {
                    setSelectedChat({ id: doc.id, ...doc.data(), isGroup: false });
                }
            });
        }
    
        const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));
        const unsubMessages = onSnapshot(q, (snap) => {
            setMessages(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        });
    
        // Mark messages as read
        const markAsRead = async () => {
            const unreadQuery = query(
                collection(db, "chats", chatId, "messages"), 
                where("readBy", "array-contains", firebaseUser.uid)
            );
            const querySnapshot = await getDocs(unreadQuery);
            const batch = writeBatch(db);
            let hasUnread = false;
            querySnapshot.forEach(doc => {
                const data = doc.data();
                if (!data.readBy.includes(firebaseUser.uid)) {
                    hasUnread = true;
                    batch.update(doc.ref, { readBy: arrayUnion(firebaseUser.uid) });
                }
            });
            if (hasUnread) {
                await batch.commit();
            }
        };
        markAsRead();
    
        return () => {
            unsub();
            unsubMessages();
        };
    }, [chatId, firebaseUser]);


    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);
    
    const handleSend = async (e: React.FormEvent, mediaUrl: string | null = null, type: 'text' | 'image' | 'video' | 'audio' = 'text') => {
        e.preventDefault();
        if ((!newMessage.trim() && !mediaUrl) || !firebaseUser || !selectedChat) return;
        
        const textToSend = newMessage;
        setNewMessage("");
        setDraft(selectedChat.id, '');
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
        const messageData: any = {
            sender: firebaseUser.uid,
            createdAt: serverTimestamp(),
            type: type,
            readBy: [firebaseUser.uid],
            reactions: {},
            deletedFor: []
        };
    
        if (mediaUrl) {
            messageData.mediaUrl = mediaUrl;
            messageData.text = textToSend; // Caption
        } else {
            messageData.text = textToSend;
        }
    
        await addDoc(collection(db, "chats", chatId, "messages"), messageData);
    };

    // ... other handlers (handleFileChange, handleMic, handleDeleteMessages, etc.) would go here
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
  
      let type: 'image' | 'video' | 'audio' = 'image';
      if (file.type.startsWith('video/')) type = 'video';
      if (file.type.startsWith('audio/')) type = 'audio';
      
      try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('userId', firebaseUser.uid);
          const result = await uploadFileToFirebaseStorage(formData);
          if (result.success?.url) {
              handleSend(new Event('submit') as any, result.success.url, type);
          } else {
            throw new Error(result.failure || "Upload failed");
          }
      } catch (error) {
          console.error("Upload failed:", error);
          alert("Sorry, the file upload failed.");
      }
  
      if (e.target) e.target.value = '';
    };

    if (!selectedChat) {
        return <div className="flex h-screen w-full items-center justify-center text-accent-cyan">Loading Chat...</div>
    }

    return (
        <div className="flex-1 flex flex-col bg-black/40 relative">
            <div className="flex items-center gap-3 p-3 border-b border-accent-cyan/10 bg-black/60 shadow-md shrink-0">
                <button onClick={() => router.push('/signal')} className="p-2 rounded-full hover:bg-accent-cyan/10"><ArrowLeft size={20}/></button>
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent-pink to-accent-cyan flex items-center justify-center text-white font-bold text-lg overflow-hidden shrink-0">
                {selectedChat.isGroup ? 
                        (selectedChat.avatar_url ? <img src={selectedChat.avatar_url} alt={selectedChat.name} className="w-full h-full object-cover"/> : <Users/>) :
                        (selectedChat.avatar_url ? <img src={selectedChat.avatar_url} alt="avatar" className="w-full h-full object-cover"/> : <UserCircle/>)
                }
                </div>
                <div className="flex-1 text-left">
                    <h3 className="font-bold text-white">{selectedChat.name || selectedChat.username}</h3>
                    {/* Status would be implemented here */}
                </div>
                <div className="flex items-center gap-2">
                {!selectedChat.isGroup && <button className="p-2 rounded-full hover:bg-accent-cyan/10"><Video size={20}/></button>}
                {!selectedChat.isGroup && <button className="p-2 rounded-full hover:bg-accent-cyan/10"><Phone size={20}/></button>}
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
                {messages.filter(msg => !(msg.deletedFor || []).includes(firebaseUser.uid)).map(msg => {
                    const isUser = msg.sender === firebaseUser.uid;
                    return (
                        <MessageItem
                          key={msg.id}
                          msg={msg}
                          isUser={isUser}
                          selectedChat={selectedChat}
                          firebaseUser={firebaseUser}
                          isSelected={false}
                          selectionMode={null}
                          onLongPress={() => {}}
                          onClick={() => {}}
                          onReact={()=>{}}
                          showEmojiPicker={null}
                          onShowEmojiPicker={()=>{}}
                          onShowDeleteConfirm={() => {}}
                        />
                    )
                })}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="flex items-center gap-2 p-2 border-t border-accent-cyan/10 bg-black/60 shrink-0">
                <AnimatePresence mode="wait">
                {newMessage.trim() === "" ? (
                        <motion.button 
                        key="mic"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        type="button" 
                        className={`p-3 rounded-full transition-colors ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-accent-pink text-white'}`}
                        >
                        <Mic size={20}/>
                        </motion.button>
                ) : (
                        <motion.button 
                        key="send"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        type="submit" 
                        className="p-3 rounded-full bg-accent-cyan text-white"
                        >
                        <Send size={20}/>
                        </motion.button>
                )}
                </AnimatePresence>
                <div className="flex-1 bg-gray-700 rounded-full flex items-center border border-gray-600 focus-within:ring-2 focus-within:ring-accent-cyan">
                    <button type="button" onClick={() => alert("Emoji picker coming soon!")} className="p-2 text-gray-400 hover:text-accent-cyan">
                        <Smile size={20}/>
                    </button>
                    <input 
                        type="text" 
                        value={newMessage} 
                        onChange={handleInputChange} 
                        placeholder={isRecording ? "Recording..." : "Type a message..."} 
                        className="flex-1 bg-transparent px-4 py-2 text-white focus:outline-none"
                    />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-accent-cyan">
                        <Paperclip size={20}/>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*,audio/*" />
                </div>
            </form>
        </div>
    )
}

function ChatPageWrapper() {
    const params = useParams();
    const chatId = params.id as string;
    const [firebaseUser, setFirebaseUser] = useState<any>(null);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
  
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
          router.push('/login');
        }
        setLoading(false);
      });
      return () => unsub();
    }, [router]);
    
    if (loading || !firebaseUser || !userProfile) {
      return <div className="flex h-screen items-center justify-center text-accent-cyan">Loading Chat...</div>;
    }
    
    return <ChatPage firebaseUser={firebaseUser} userProfile={userProfile} chatId={chatId} />;
  }

export default function SignalChatPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center text-accent-cyan">Loading Chat...</div>}>
            <ChatPageWrapper />
        </Suspense>
    )
}
