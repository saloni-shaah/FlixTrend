
"use client";
import React, { useEffect, useState, useRef } from "react";
import { getFirestore, collection, query, onSnapshot, orderBy, doc, getDoc, setDoc, addDoc, serverTimestamp, where, writeBatch, getDocs, updateDoc, deleteDoc, arrayUnion } from "firebase/firestore";
import { auth } from "@/utils/firebaseClient";
import { Phone, Video, Paperclip, Mic, Send, ArrowLeft, Image as ImageIcon, X, Smile, Trash2, Users, CheckSquare, Square, MoreVertical } from "lucide-react";
import { useAppState } from "@/utils/AppStateContext";
import { createCall } from "@/utils/callService";
import { motion, AnimatePresence } from "framer-motion";

const db = getFirestore();

async function uploadToCloudinary(file: File, onProgress?: (percent: number) => void): Promise<string | null> {
  const url = `https://api.cloudinary.com/v1_1/drrzvi2jp/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "flixtrend_unsigned");
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      const data = JSON.parse(xhr.responseText);
      if (xhr.status === 200 && data.secure_url) {
        resolve(data.secure_url);
      } else {
        reject(new Error(data.error?.message || "Upload failed"));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(formData);
  });
}

function getChatId(uid1: string, uid2: string) {
  return [uid1, uid2].sort().join("_");
}

function CreateGroupModal({ mutuals, currentUser, onClose, onGroupCreated }: { mutuals: any[], currentUser: any, onClose: () => void, onGroupCreated: (group:any) => void }) {
    const [selectedUids, setSelectedUids] = useState<string[]>([]);
    const [groupName, setGroupName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleToggleUser = (uid: string) => {
        setSelectedUids(prev => 
            prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
        );
    };

    const handleCreateGroup = async () => {
        if (selectedUids.length < 1) {
            setError("You must select at least one other member.");
            return;
        }
        if (!groupName.trim()) {
            setError("Please give your group a name.");
            return;
        }
        setLoading(true);
        setError('');

        try {
            const memberUids = [...selectedUids, currentUser.uid];
            const memberProfiles = await Promise.all(
                memberUids.map(async uid => {
                    const userDoc = await getDoc(doc(db, "users", uid));
                    return userDoc.exists() ? { uid, ...userDoc.data() } : null;
                })
            );

            const validMembers = memberProfiles.filter(Boolean);

            const groupDocRef = await addDoc(collection(db, "groups"), {
                name: groupName,
                members: memberUids,
                memberInfo: validMembers.reduce((acc, user) => ({ ...acc, [user!.uid]: { name: user!.name, avatar_url: user!.avatar_url, username: user!.username } }), {}),
                admins: [currentUser.uid],
                createdAt: serverTimestamp(),
                createdBy: currentUser.uid,
                isGroup: true,
            });
            
            const groupData = (await getDoc(groupDocRef)).data();

            await addDoc(collection(db, "chats", groupDocRef.id, "messages"), {
                text: `${currentUser.displayName} created the group "${groupName}"`,
                sender: 'system',
                createdAt: serverTimestamp(),
                readBy: [currentUser.uid]
            });
            
            onGroupCreated({ id: groupDocRef.id, ...groupData });
            onClose();
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };
    
    const getInitials = (user: any) => user?.name?.[0] || user?.username?.[0] || "U";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-6 w-full max-w-md relative flex flex-col max-h-[90vh]"
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">&times;</button>
                <h2 className="text-xl font-headline font-bold mb-4 text-accent-cyan">Create a New Group</h2>
                
                <input
                    type="text"
                    placeholder="Group Name"
                    className="input-glass w-full mb-4"
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                />

                <h3 className="font-bold mb-2 text-accent-cyan">Select Members</h3>
                <div className="flex-1 overflow-y-auto mb-4 border-y border-accent-cyan/10">
                    {mutuals.map(user => (
                        <div key={user.uid} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent-cyan/10 cursor-pointer" onClick={() => handleToggleUser(user.uid)}>
                            {selectedUids.includes(user.uid) ? <CheckSquare className="text-accent-cyan"/> : <Square className="text-gray-500"/>}
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent-pink to-accent-cyan flex items-center justify-center text-white font-bold text-lg overflow-hidden shrink-0">
                                {user.avatar_url ? <img src={user.avatar_url} alt={user.name || user.username} className="w-full h-full object-cover"/> : getInitials(user)}
                            </div>
                            <div>
                                <div className="font-bold">{user.name || user.username}</div>
                                <div className="text-xs text-gray-400">@{user.username}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {error && <p className="text-red-400 text-center mb-2">{error}</p>}
                
                <button className="btn-glass bg-accent-cyan text-black" onClick={handleCreateGroup} disabled={loading}>
                    {loading ? "Creating..." : "Create Group"}
                </button>
            </motion.div>
        </div>
    );
}

function ClientOnlySignalPage({ firebaseUser }: { firebaseUser: any }) {
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [unreadCounts, setUnreadCounts] = useState<{ [key: string]: number }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { useMediaQuery } = require("@uidotdev/usehooks");
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showMenu, setShowMenu] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseUser) return;

    // Fetch 1-on-1 chats (mutuals)
    const fetchMutuals = async () => {
        const followingRef = collection(db, "users", firebaseUser.uid, "following");
        const followersRef = collection(db, "users", firebaseUser.uid, "followers");
        const [followingSnap, followersSnap] = await Promise.all([getDocs(followingRef), getDocs(followersSnap)]);
        
        const following = followingSnap.docs.map(doc => doc.id);
        const followers = followersSnap.docs.map(doc => doc.id);
        const mutualUids = Array.from(new Set([...following, ...followers])).filter(uid => uid !== firebaseUser.uid);
        
        const mutualProfiles = await Promise.all(
          mutualUids.map(async (uid) => {
            const userDoc = await getDoc(doc(db, "users", uid));
            return userDoc.exists() ? { uid, ...userDoc.data(), isGroup: false, id: uid } : null;
          })
        );
        return mutualProfiles.filter(Boolean) as any[];
    };
    
    // Listener for group chats
    const groupsQuery = query(collection(db, "groups"), where("members", "array-contains", firebaseUser.uid));
    const unsubGroups = onSnapshot(groupsQuery, async (groupsSnap) => {
        const groupChats = groupsSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), isGroup: true, uid: doc.id }));
        const oneOnOneChats = await fetchMutuals();
        
        // Combine and remove duplicates, prioritizing group chats if ID is same as a user UID somehow
        const allChats = [...groupChats, ...oneOnOneChats];
        const uniqueChats = allChats.filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i);

        setChats(uniqueChats);
    });

    return () => unsubGroups();

  }, [firebaseUser]);


  const handleSelectChat = async (chat: any) => {
    setSelectedChat(chat);
    setShowMenu(null);
    setShowEmojiPicker(null);
    const chatId = chat.isGroup ? chat.id : getChatId(firebaseUser.uid, chat.uid);
    const unreadQuery = query(
        collection(db, "chats", chatId, "messages"), 
        where("readBy", "not-in", [[firebaseUser.uid]])
    );
    const unreadDocs = await getDocs(unreadQuery);
    const batch = writeBatch(db);
    let hasUnread = false;
    unreadDocs.forEach(doc => {
      const data = doc.data();
      if(!data.readBy || !data.readBy.includes(firebaseUser.uid)){
        hasUnread = true;
        batch.update(doc.ref, { readBy: arrayUnion(firebaseUser.uid) });
      }
    });
    if(hasUnread) await batch.commit();
  };

  useEffect(() => {
    if (!selectedChat || !firebaseUser) return;
    const chatId = selectedChat.isGroup ? selectedChat.id : getChatId(firebaseUser.uid, selectedChat.uid);
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [selectedChat, firebaseUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent, mediaUrl: string | null = null, type: 'text' | 'image' | 'video' | 'audio' = 'text') => {
    e.preventDefault();
    if ((!newMessage.trim() && !mediaUrl) || !firebaseUser || !selectedChat) return;

    const chatId = selectedChat.isGroup ? selectedChat.id : getChatId(firebaseUser.uid, selectedChat.uid);
    const messageData: any = {
        sender: firebaseUser.uid,
        createdAt: serverTimestamp(),
        type: type,
        readBy: [firebaseUser.uid],
        reactions: {},
    };

    if (mediaUrl) {
        messageData.mediaUrl = mediaUrl;
        messageData.text = newMessage; // Caption
    } else {
        messageData.text = newMessage;
    }

    await addDoc(collection(db, "chats", chatId, "messages"), messageData);
    setNewMessage("");
  };
  
  const handleDeleteMessage = async (messageId: string) => {
    if (!selectedChat || !firebaseUser) return;
    const chatId = selectedChat.isGroup ? selectedChat.id : getChatId(firebaseUser.uid, selectedChat.uid);
    const messageRef = doc(db, "chats", chatId, "messages", messageId);
    if(window.confirm("Are you sure you want to delete this message for everyone? This action is irreversible.")) {
      await deleteDoc(messageRef);
    }
  };

  const handleReact = async (messageId: string, emoji: string) => {
    if (!selectedChat || !firebaseUser) return;
    const chatId = selectedChat.isGroup ? selectedChat.id : getChatId(firebaseUser.uid, selectedChat.uid);
    const messageRef = doc(db, "chats", chatId, "messages", messageId);
    const messageSnap = await getDoc(messageRef);
    const messageData = messageSnap.data();

    if (messageData) {
        const currentReactions = messageData.reactions || {};
        const uidsForEmoji = currentReactions[emoji] || [];

        if (uidsForEmoji.includes(firebaseUser.uid)) {
            // User is removing their reaction
            const newUids = uidsForEmoji.filter((uid: string) => uid !== firebaseUser.uid);
            if (newUids.length > 0) {
                await updateDoc(messageRef, { [`reactions.${emoji}`]: newUids });
            } else {
                // If no one is left, remove the emoji key
                delete currentReactions[emoji];
                await updateDoc(messageRef, { reactions: currentReactions });
            }
        } else {
            // User is adding a reaction
            await updateDoc(messageRef, {
              [`reactions.${emoji}`]: arrayUnion(firebaseUser.uid)
            });
        }
    }
    setShowEmojiPicker(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let type: 'image' | 'video' | 'audio' = 'image';
    if (file.type.startsWith('video/')) type = 'video';
    if (file.type.startsWith('audio/')) type = 'audio';
    
    try {
        const mediaUrl = await uploadToCloudinary(file);
        if (mediaUrl) {
            handleSend(new Event('submit') as any, mediaUrl, type);
        }
    } catch (error) {
        console.error("Upload failed:", error);
        alert("Sorry, the file upload failed.");
    }

    if (e.target) e.target.value = '';
  };
  
  const handleCall = async (type: 'video' | 'voice') => {
    if (!selectedChat || !firebaseUser || selectedChat.isGroup) {
      alert("Calls can only be made in one-on-one chats for now.");
      return;
    };
    
    if (type === 'video') {
      await createCall(firebaseUser, selectedChat);
    } else {
      alert(`Starting voice call with ${selectedChat.name}... (Feature coming soon!)`);
    }

    const notifRef = collection(db, "notifications", selectedChat.uid, "user_notifications");
    await addDoc(notifRef, {
      type: 'missed_call',
      callType: type,
      fromUserId: firebaseUser.uid,
      fromUsername: firebaseUser.displayName,
      fromAvatarUrl: firebaseUser.photoURL,
      createdAt: serverTimestamp(),
      read: false,
    });
  };
  
  const getInitials = (user: any) => user?.name?.[0] || user?.username?.[0] || "U";
  
  const defaultReactions = ["👍", "❤️", "😂", "😢", "😮", "🙏"];

  return (
    <div className="flex h-[calc(100vh-64px)] md:h-[calc(100vh-88px)] bg-transparent font-body text-white">
        {showCreateGroup && <CreateGroupModal mutuals={chats.filter(c => !c.isGroup)} currentUser={firebaseUser} onClose={() => setShowCreateGroup(false)} onGroupCreated={(newGroup) => {
            setChats(prev => [newGroup, ...prev]);
            setSelectedChat(newGroup);
        }} />}
        <div className={`w-full md:w-1/3 md:min-w-[350px] border-r border-accent-cyan/10 bg-black/60 flex flex-col ${isMobile && selectedChat ? "hidden" : ""}`}>
            <div className="p-4 border-b border-accent-cyan/10 flex items-center justify-between">
                <h2 className="text-xl font-headline font-bold text-accent-cyan">Signal</h2>
                <button className="btn-glass-icon w-10 h-10" title="Create Group" onClick={() => setShowCreateGroup(true)}>
                    <Users size={20} />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto">
                {chats.length === 0 ? (
                    <div className="text-gray-400 text-center p-8">No contacts or groups yet. Follow some users to start chatting!</div>
                ) : (
                    chats.map((chat) => (
                        <button key={chat.id} className={`w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-accent-cyan/10 transition-colors duration-200 ${selectedChat?.id === chat.id ? "bg-accent-cyan/20" : ""}`} onClick={() => handleSelectChat(chat)}>
                            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-accent-pink to-accent-cyan flex items-center justify-center text-white font-bold text-xl overflow-hidden shrink-0">
                                {chat.isGroup ? 
                                    <Users/> :
                                    (chat.avatar_url ? <img src={chat.avatar_url} alt="avatar" className="w-full h-full object-cover"/> : getInitials(chat))
                                }
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <span className="font-bold text-white block truncate">{chat.name || chat.username}</span>
                                {!chat.isGroup && <span className="text-xs text-gray-400 block truncate">@{chat.username}</span>}
                            </div>
                            {unreadCounts[chat.id] > 0 && (
                                <span className="bg-accent-pink text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                                    {unreadCounts[chat.id]}
                                </span>
                            )}
                        </button>
                    ))
                )}
            </div>
        </div>

        <div className={`flex-1 flex flex-col bg-black/40 ${!selectedChat && isMobile ? "hidden" : ""}`}>
            {selectedChat ? (
                <>
                    <div className="flex items-center gap-3 p-3 border-b border-accent-cyan/10 bg-black/60 shadow-md">
                        {isMobile && <button onClick={() => setSelectedChat(null)} className="p-2 rounded-full hover:bg-accent-cyan/10"><ArrowLeft size={20}/></button>}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent-pink to-accent-cyan flex items-center justify-center text-white font-bold text-lg overflow-hidden shrink-0">
                           {selectedChat.isGroup ? <Users/> : (selectedChat.avatar_url ? <img src={selectedChat.avatar_url} alt="avatar" className="w-full h-full object-cover"/> : getInitials(selectedChat))}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-white">{selectedChat.name}</h3>
                            <p className="text-xs text-green-400">{selectedChat.isGroup ? `${selectedChat.members.length} members` : 'Online'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                           {!selectedChat.isGroup && <button onClick={() => handleCall('video')} className="p-2 rounded-full hover:bg-accent-cyan/10"><Video size={20}/></button>}
                           {!selectedChat.isGroup && <button onClick={() => handleCall('voice')} className="p-2 rounded-full hover:bg-accent-cyan/10"><Phone size={20}/></button>}
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
                        {messages.map(msg => (
                             <div key={msg.id} className={`group flex items-end gap-2 max-w-[80%] ${msg.sender === firebaseUser.uid ? "self-end flex-row-reverse" : msg.sender === 'system' ? 'self-center' : "self-start"}`}>
                                <div className={`relative px-4 py-2 rounded-2xl ${msg.sender === firebaseUser.uid ? "bg-accent-cyan text-black rounded-br-none" : msg.sender === 'system' ? "bg-gray-800 text-gray-400 text-xs italic" : "bg-gray-700 text-white rounded-bl-none"}`}>
                                    {msg.type === 'image' && <img src={msg.mediaUrl} alt={msg.text || "image"} className="rounded-lg max-w-xs" />}
                                    {msg.type === 'video' && <video src={msg.mediaUrl} controls className="rounded-lg max-w-xs" />}
                                    {msg.type === 'audio' && <audio src={msg.mediaUrl} controls />}
                                    {msg.text && <p className="mt-1">{msg.text}</p>}
                                    {msg.sender !== 'system' && <div className="text-xs mt-1 text-right opacity-70">
                                        {msg.createdAt?.toDate?.().toLocaleTimeString() || ""}
                                    </div>}
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
                                <div className={`relative hidden group-hover:flex items-center gap-1 ${msg.sender === firebaseUser.uid ? "flex-row-reverse" : ""}`}>
                                   {msg.sender !== 'system' && 
                                    <div className="relative">
                                       <button onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)} className="p-1 rounded-full bg-gray-600 hover:bg-gray-500"><Smile size={16}/></button>
                                        <AnimatePresence>
                                        {showEmojiPicker === msg.id && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="absolute z-10 -top-10 bg-gray-800 rounded-full p-2 flex gap-1 shadow-lg"
                                            >
                                                {defaultReactions.map(emoji => (
                                                    <button key={emoji} onClick={() => handleReact(msg.id, emoji)} className="text-xl hover:scale-125 transition-transform">{emoji}</button>
                                                ))}
                                            </motion.div>
                                        )}
                                        </AnimatePresence>
                                    </div>
                                   }
                                   {msg.sender === firebaseUser.uid && <button onClick={() => handleDeleteMessage(msg.id)} className="p-1 rounded-full bg-gray-600 hover:bg-red-500"><Trash2 size={16}/></button>}
                                </div>
                            </div>
                        ))}
                         <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSend} className="flex items-center gap-2 p-4 border-t border-accent-cyan/10 bg-black/60">
                         <div className="relative group">
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 rounded-full hover:bg-accent-cyan/20 transition-colors">
                                <Paperclip size={20}/>
                            </button>
                         </div>
                         <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*,audio/*" />
                        <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1 bg-gray-700 rounded-full px-4 py-2 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent-cyan"/>
                        <button type="submit" className="p-3 rounded-full bg-accent-cyan text-black" disabled={!newMessage.trim()}><Send size={20}/></button>
                    </form>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-center p-4">
                    <div className="text-5xl mb-4">💬</div>
                    <h3 className="text-xl font-bold">Select a chat</h3>
                    <p className="max-w-xs">Start a conversation with your mutuals or create a group to chat with friends.</p>
                </div>
            )}
        </div>
    </div>
  );
}

export default function SignalPage() {
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      setFirebaseUser(user);
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (!userDocSnap.exists()) {
          await setDoc(userDocRef, {
            uid: user.uid,
            name: user.displayName || "",
            username: user.displayName ? user.displayName.replace(/\s+/g, "").toLowerCase() : "",
            email: user.email || "",
            avatar_url: user.photoURL || "",
            bio: "",
            interests: "",
            createdAt: new Date(),
          });
        }
      }
    });
    return () => unsub();
  }, []);
  
  if (!firebaseUser) {
    return <div className="flex min-h-screen items-center justify-center text-accent-cyan">Loading Signal...</div>;
  }
  return <ClientOnlySignalPage firebaseUser={firebaseUser} />;
}
