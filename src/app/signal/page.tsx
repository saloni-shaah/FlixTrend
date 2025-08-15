
"use client";
import React, { useEffect, useState, useRef } from "react";
import { getFirestore, collection, query, onSnapshot, orderBy, doc, getDoc, setDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { auth } from "@/utils/firebaseClient";
import { Phone, Video, Paperclip, Mic, Send, ArrowLeft, Image as ImageIcon, X } from "lucide-react";
import { useAppState } from "@/utils/AppStateContext";

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

function VideoCallModal({ peer, onClose }: { peer: any, onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
      }
    };

    getCameraPermission();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    }
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      <div className="relative flex-1 flex items-center justify-center">
        <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted />
        {!hasCameraPermission &&
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white text-center p-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Camera Access Required</h2>
              <p>Please allow camera and microphone access in your browser settings to use video calls.</p>
            </div>
          </div>
        }
        <div className="absolute top-4 left-4 text-white">
          <h3 className="text-xl font-bold">{peer.name}</h3>
          <p className="text-sm">Connecting...</p>
        </div>
      </div>
      <div className="bg-black/50 p-4 flex justify-center items-center gap-4">
        <button className="p-3 bg-gray-600 rounded-full text-white"><Mic size={24} /></button>
        <button className="p-3 bg-gray-600 rounded-full text-white"><Video size={24} /></button>
        <button onClick={onClose} className="p-4 bg-red-500 rounded-full text-white"><Phone size={24} /></button>
      </div>
    </div>
  )
}


function ClientOnlySignalPage({ firebaseUser }: { firebaseUser: any }) {
  const [mutuals, setMutuals] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { useMediaQuery } = require("@uidotdev/usehooks");
  const isMobile = useMediaQuery("(max-width: 767px)");
  const { isCalling, setIsCalling, callTarget, setCallTarget } = useAppState();

  useEffect(() => {
    if (!firebaseUser) return;
    const followingUnsub = onSnapshot(collection(db, "users", firebaseUser.uid, "following"), async (followingSnap) => {
      const following = followingSnap.docs.map((doc) => doc.id);
      const followersUnsub = onSnapshot(collection(db, "users", firebaseUser.uid, "followers"), async (followersSnap) => {
        const followers = followersSnap.docs.map((doc) => doc.id);
        const mutualUids = Array.from(new Set([...following, ...followers])).filter((uid) => uid !== firebaseUser.uid);
        const mutualProfiles = await Promise.all(
          mutualUids.map(async (uid) => {
            const userDoc = await getDoc(doc(db, "users", uid));
            return userDoc.exists() ? { uid, ...userDoc.data() } : null;
          })
        );
        setMutuals(mutualProfiles.filter(Boolean) as any[]);
      });
      return () => followersUnsub();
    });
    return () => followingUnsub();
  }, [firebaseUser]);

  useEffect(() => {
    if (!selectedChat || !firebaseUser) return;
    const chatId = getChatId(firebaseUser.uid, selectedChat.uid);
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

    const chatId = getChatId(firebaseUser.uid, selectedChat.uid);
    const messageData: any = {
        sender: firebaseUser.uid,
        createdAt: serverTimestamp(),
        type: type,
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Determine file type
    let type: 'image' | 'video' | 'audio' = 'image';
    if (file.type.startsWith('video/')) type = 'video';
    if (file.type.startsWith('audio/')) type = 'audio';

    const caption = newMessage; // use current input as caption
    
    // Upload and send
    try {
        const mediaUrl = await uploadToCloudinary(file);
        if (mediaUrl) {
            handleSend(new Event('submit') as any, mediaUrl, type);
        }
    } catch (error) {
        console.error("Upload failed:", error);
        alert("Sorry, the file upload failed.");
    }

    // Reset file input
    if (e.target) e.target.value = '';
  };
  
  const handleCall = async (type: 'video' | 'voice') => {
    if (!selectedChat || !firebaseUser) return;
    
    if (type === 'video') {
      setCallTarget(selectedChat);
      setIsCalling(true);
    } else {
      alert(`Starting voice call with ${selectedChat.name}... (Feature coming soon!)`);
    }

    // Create a notification for a missed call
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

  return (
    <>
    {isCalling && callTarget && <VideoCallModal peer={callTarget} onClose={() => setIsCalling(false)}/>}
    <div className="flex h-[calc(100vh-64px)] md:h-screen bg-transparent font-body text-white">
        <div className={`w-full md:w-1/3 md:min-w-[350px] border-r border-accent-cyan/10 bg-black/60 flex flex-col ${isMobile && selectedChat ? "hidden" : ""}`}>
            <div className="p-4 border-b border-accent-cyan/10">
                <h2 className="text-xl font-headline font-bold text-accent-cyan">Signal</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
                {mutuals.length === 0 ? (
                    <div className="text-gray-400 text-center p-8">No contacts yet. Follow some users to start chatting!</div>
                ) : (
                    mutuals.map((user) => (
                        <button key={user.uid} className={`w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-accent-cyan/10 transition-colors duration-200 ${selectedChat?.uid === user.uid ? "bg-accent-cyan/20" : ""}`} onClick={() => setSelectedChat(user)}>
                            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-accent-pink to-accent-cyan flex items-center justify-center text-white font-bold text-xl overflow-hidden shrink-0">
                                {user.avatar_url ? <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover"/> : getInitials(user)}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <span className="font-bold text-white block truncate">{user.name || user.username}</span>
                                <span className="text-xs text-gray-400 block truncate">@{user.username}</span>
                            </div>
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
                           {selectedChat.avatar_url ? <img src={selectedChat.avatar_url} alt="avatar" className="w-full h-full object-cover"/> : getInitials(selectedChat)}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-white">{selectedChat.name}</h3>
                            <p className="text-xs text-green-400">Online</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleCall('video')} className="p-2 rounded-full hover:bg-accent-cyan/10"><Video size={20}/></button>
                            <button onClick={() => handleCall('voice')} className="p-2 rounded-full hover:bg-accent-cyan/10"><Phone size={20}/></button>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex items-end gap-2 max-w-[80%] ${msg.sender === firebaseUser.uid ? "self-end flex-row-reverse" : "self-start"}`}>
                                <div className={`px-4 py-2 rounded-2xl ${msg.sender === firebaseUser.uid ? "bg-accent-cyan text-black rounded-br-none" : "bg-gray-700 text-white rounded-bl-none"}`}>
                                    {msg.type === 'image' && <img src={msg.mediaUrl} alt={msg.text || "image"} className="rounded-lg max-w-xs" />}
                                    {msg.type === 'video' && <video src={msg.mediaUrl} controls className="rounded-lg max-w-xs" />}
                                    {msg.type === 'audio' && <audio src={msg.mediaUrl} controls />}
                                    {msg.text && <p className="mt-1">{msg.text}</p>}
                                    <div className="text-xs mt-1 text-right opacity-70">
                                        {msg.createdAt?.toDate?.().toLocaleTimeString() || ""}
                                    </div>
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
                    <p className="max-w-xs">Start a conversation with your mutuals. Your messages are private and secure.</p>
                </div>
            )}
        </div>
    </div>
    </>
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

    