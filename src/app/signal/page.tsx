"use client";
import React, { useEffect, useState, useRef } from "react";
import { getFirestore, collection, query, where, onSnapshot, orderBy, doc, getDoc, setDoc, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { auth } from "@/utils/firebaseClient";

const db = getFirestore();

function getChatId(uid1: string, uid2: string) {
  return [uid1, uid2].sort().join("_");
}

function ClientOnlySignalPage({ firebaseUser }: { firebaseUser: any }) {
  const [mutuals, setMutuals] = useState<any[]>([]); // Users you can chat with
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { useMediaQuery } = require("@uidotdev/usehooks"); // Dynamically require
  const isMobile = useMediaQuery("(max-width: 767px)");

  // Fetch mutuals (users you follow or who follow you)
  useEffect(() => {
    if (!firebaseUser) return;
    // Real-time listeners for following and followers
    const followingUnsub = onSnapshot(collection(db, "users", firebaseUser.uid, "following"), async (followingSnap) => {
      const following = followingSnap.docs.map((doc) => doc.id);
      const followersUnsub = onSnapshot(collection(db, "users", firebaseUser.uid, "followers"), async (followersSnap) => {
        const followers = followersSnap.docs.map((doc) => doc.id);
        const mutualUids = Array.from(new Set([...following, ...followers])).filter((uid) => uid !== firebaseUser.uid);
        // Fetch user profiles
        const mutualProfiles = await Promise.all(
          mutualUids.map(async (uid) => {
            const userDoc = await getDoc(doc(db, "users", uid));
            return userDoc.exists() ? { uid, ...userDoc.data() } : null;
          })
        );
        setMutuals(mutualProfiles.filter(Boolean));
      });
      // Clean up followers listener
      return () => followersUnsub();
    });
    // Clean up following listener
    return () => followingUnsub();
  }, [firebaseUser]);

  // Fetch messages for selected chat
  useEffect(() => {
    if (!selectedChat || !firebaseUser) return;
    const chatId = getChatId(firebaseUser.uid, selectedChat.uid);
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [selectedChat, firebaseUser]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Send a message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !firebaseUser || !selectedChat) return;
    const chatId = getChatId(firebaseUser.uid, selectedChat.uid);
    await addDoc(collection(db, "chats", chatId, "messages"), {
      sender: firebaseUser.uid,
      text: newMessage,
      createdAt: serverTimestamp(),
    });
    setNewMessage("");
  };

  // WhatsApp-like UI
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-primary via-secondary to-accent-cyan/10">
      <h2 className="text-lg font-headline text-accent-cyan mb-4 px-4 pt-6 md:block hidden">Signal (Chats)</h2>
      <div className="flex flex-1 overflow-hidden rounded-2xl shadow-lg mx-auto max-w-4xl bg-white/80 dark:bg-black/60 border border-accent-cyan/20 md:flex-row flex-col" style={{ minHeight: 500 }}>
        {/* Chat List */}
        <div className={`md:w-1/3 w-full min-w-[220px] border-r border-accent-cyan/10 bg-white/90 dark:bg-card/80 flex flex-col ${isMobile && selectedChat ? "hidden" : "block"}`}>
          <div className="p-4 font-bold text-accent-cyan text-xl border-b border-accent-cyan/10">Chats</div>
          <div className="flex-1 overflow-y-auto">
            {mutuals.length === 0 ? (
              <div className="text-gray-400 text-center mt-8">No contacts yet</div>
            ) : (
              mutuals.map((user) => (
                <button
                  key={user.uid}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-accent-cyan/10 transition-all ${selectedChat?.uid === user.uid ? "bg-accent-cyan/20" : ""}`}
                  onClick={() => setSelectedChat(user)}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accentPink to-accentCyan flex items-center justify-center text-white font-bold text-lg">
                    {user.name ? user.name[0] : user.username?.[0] || "U"}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-headline text-accent-cyan text-sm">@{user.username || (user.name ? user.name.replace(/\s+/g, "").toLowerCase() : "user")}</span>
                    <span className="text-xs text-gray-500">{user.bio || "No bio"}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
        {/* Chat Window */}
        <div className={`flex-1 flex flex-col relative bg-gradient-to-b from-white/90 dark:from-black/90 to-accent-cyan/5 rounded-r-2xl ${isMobile && !selectedChat ? "hidden" : "block"}`}>
          {selectedChat ? (
            <>
              <div className="flex items-center gap-3 p-4 border-b border-accent-cyan/10 bg-white/90 dark:bg-card/80 rounded-tr-2xl">
                {isMobile && (
                  <button className="mr-2 text-accent-cyan text-2xl" onClick={() => setSelectedChat(null)}>&larr;</button>
                )}
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accentPink to-accentCyan flex items-center justify-center text-white font-bold text-lg">
                  {selectedChat.name ? selectedChat.name[0] : selectedChat.username?.[0] || "U"}
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-headline text-accent-cyan text-sm">@{selectedChat.username || (selectedChat.name ? selectedChat.name.replace(/\s+/g, "").toLowerCase() : "user")}</span>
                  <span className="text-xs text-gray-500">{selectedChat.bio || "No bio"}</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2" style={{ minHeight: 0 }}>
                {messages.length === 0 ? (
                  <div className="text-gray-400 text-center mt-8">No messages yet</div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`max-w-[70%] px-4 py-2 rounded-2xl shadow text-base font-body mb-2 ${msg.sender === firebaseUser.uid ? "bg-black/70 text-[#E0E0E0] self-end" : "bg-white/90 dark:bg-card/90 text-black dark:text-white self-start"}`}
                      style={msg.sender === firebaseUser.uid ? { textShadow: '1px 1px 4px rgba(0,0,0,0.7)', fontFamily: 'Inter, Poppins, Roboto, sans-serif', fontWeight: 600 } : {}}
                    >
                      {msg.text}
                      <div className="text-xs text-gray-200 dark:text-gray-400 mt-1 text-right">
                        {msg.createdAt?.toDate?.().toLocaleString?.() || "Just now"}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              {/* Sticky message input */}
              <form onSubmit={handleSend} className="flex gap-2 p-4 border-t border-accent-cyan/10 bg-white/95 dark:bg-card/95 rounded-b-2xl sticky bottom-0 left-0 right-0 z-[60] pb-4 md:pb-4" style={{ boxShadow: "0 -2px 16px 0 rgba(0,0,0,0.04)" }}>
                <input
                  type="text"
                  className="flex-1 rounded-full px-4 py-3 border border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-cyan bg-black/60 text-[#E0E0E0] text-base shadow font-semibold"
                  style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.7)', fontFamily: 'Inter, Poppins, Roboto, sans-serif' }}
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-6 py-3 rounded-full bg-accent-cyan text-primary font-bold text-lg hover:bg-accent-pink hover:text-white transition-all disabled:opacity-60 shadow"
                  disabled={!newMessage.trim()}
                >
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <div className="text-4xl mb-2">💬</div>
              <div className="text-lg font-semibold">Select a chat to start messaging</div>
              <div className="text-sm">You can only chat with users you follow or who follow you.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Main export: only use useMediaQuery in the client
export default function SignalPage() {
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      setFirebaseUser(user);
      if (user) {
        // Auto-create user doc in Firestore if missing
        const db = getFirestore();
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
    return <div className="flex min-h-screen items-center justify-center text-accent-cyan">Loading...</div>;
  }
  // Only render the client-only chat UI after user is loaded
  return <div className="min-h-screen bg-gradient-to-br from-pink-500 via-yellow-400 via-blue-400 via-green-400 via-purple-500 via-orange-400 via-cyan-400 via-red-400 to-pink-400 transition-colors"><ClientOnlySignalPage firebaseUser={firebaseUser} /></div>;
}
