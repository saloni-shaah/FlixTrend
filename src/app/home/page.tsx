"use client";
import React, { useState, useEffect } from "react";
import CreatePostModal from "./CreatePostModal";
import { getFirestore, collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { Plus, Bell, Search } from "lucide-react";
import { auth } from "@/utils/firebaseClient";
import { almightyChat, AlmighyChatRequest, ChatMessage } from "@/ai/flows/almighty-chat-flow";
import { useAppState } from "@/utils/AppStateContext";
import { motion } from "framer-motion";
import { AlmightyLogo } from "@/components/AlmightyLogo";
import { FlashModal } from "@/components/FlashModal";
import { NotificationPanel } from "@/components/NotificationPanel";
import { PostCard } from "@/components/PostCard";
import { app } from "@/utils/firebaseClient";

const db = getFirestore(app);

export default function HomePage() {
  const [showModal, setShowModal] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [flashes, setFlashes] = useState<any[]>([]);
  const [selectedFlashUser, setSelectedFlashUser] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAlmighty, setShowAlmighty] = useState(false);
  const [chat, setChat] = useState<ChatMessage[]>([
    { role: "model", parts: [{ text: "Hey! I'm Almighty AI. Ask me anything about FlixTrend, or just say hi!" }] }
  ]);
  const [input, setInput] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [isAlmightyLoading, setIsAlmightyLoading] = useState(false);
  const { setCallTarget, setIsCalling } = useAppState();
  const currentUser = auth.currentUser;


  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "flashes"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setFlashes(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  // Group flashes by user
  const groupedFlashes = flashes.reduce((acc, flash) => {
    if (!acc[flash.userId]) {
      acc[flash.userId] = {
        userId: flash.userId,
        username: flash.username,
        avatar_url: flash.avatar_url,
        flashes: []
      };
    }
    acc[flash.userId].flashes.push(flash);
    return acc;
  }, {});

  const flashUsers = Object.values(groupedFlashes);

  // Filtered posts for search
  const filteredPosts = searchTerm.trim()
    ? posts.filter(
        (post) =>
          (post.content && post.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (post.username && post.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (post.hashtags && post.hashtags.some((h: string) => h.toLowerCase().includes(searchTerm.toLowerCase())))
      )
    : posts;

  const handleAlmightySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isAlmightyLoading) return;

    const userMessage: ChatMessage = { role: "user", parts: [{ text: input }] };
    const newChatHistory = [...chat, userMessage];
    setChat(newChatHistory);
    setInput("");
    setIsAlmightyLoading(true);

    try {
      if (!currentUser) throw new Error("User not logged in");

      const request: AlmighyChatRequest = {
        history: newChatHistory.slice(0, -1), // Send history without the latest user message
        userId: currentUser.uid,
        displayName: currentUser.displayName || 'Guest',
      };
      // Note: The `prompt` is now part of the history, not a separate field
      const response = await almightyChat(request);
      
      let modelResponse: ChatMessage | null = null;

      // Handle tool responses
      if (response.toolResponse) {
        if (response.toolResponse.name === 'initiateCall' && response.toolResponse.output) {
            const callTargetUser = response.toolResponse.output;
            setCallTarget(callTargetUser);
            setIsCalling(true);
            modelResponse = { role: 'model', parts: [{ text: `Sure, I'm calling ${callTargetUser.name} for you now!` }] };
        } else if (response.textResponse) {
            modelResponse = { role: 'model', parts: [{ text: response.textResponse }] };
        }
      } else if (response.textResponse) {
        modelResponse = { role: 'model', parts: [{ text: response.textResponse }] };
      }

      if (modelResponse) {
        setChat(prev => [...prev, modelResponse!]);
      }

    } catch (error) {
      console.error("Almighty AI Error:", error);
      setChat(prev => [...prev, { role: 'model', parts: [{ text: "Sorry, I ran into a problem. Please try again." }] }]);
    } finally {
      setIsAlmightyLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen pt-6 pb-24 px-2 md:px-8 transition-colors">
      <div className="w-full max-w-2xl mx-auto">
      {/* Centered, prominent search bar */}
      <div className="flex justify-center items-center mb-6 w-full">
        <div className="relative w-full max-w-2xl">
          <input
            type="text"
            className="input-glass w-full pl-12 pr-4 py-3 text-lg font-body"
            placeholder="Search posts or users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus={false}
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-brand-gold pointer-events-none">
            <Search />
          </span>
          {searchTerm && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-gold text-xl"
              onClick={() => setSearchTerm("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>
      {/* Flashes/Stories Section */}
      <section className="mb-6 glass-card p-4">
        <h2 className="text-lg font-headline bg-gradient-to-r from-accent-pink to-accent-green bg-clip-text text-transparent mb-2">Flashes</h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {flashUsers.length === 0 && (
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-accent-pink to-accent-green flex items-center justify-center text-3xl text-white opacity-60 border-4 border-accent-green/40 animate-pulse">
              +
            </div>
          )}
          {flashUsers.map((userFlashes: any) => (
            <button
              key={userFlashes.userId}
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-accent-pink to-accent-green border-4 border-accent-green/40 flex items-center justify-center overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-accent-green transition-transform hover:scale-105"
              onClick={() => setSelectedFlashUser(userFlashes)}
              title={userFlashes.username || "Flash"}
            >
              {userFlashes.avatar_url ? (
                  <img src={userFlashes.avatar_url} alt="flash" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl text-white">⚡</span>
              )}
            </button>
          ))}
        </div>
      </section>
      {/* Feed Section */}
      <section className="flex-1 flex flex-col items-center mt-4">
        {filteredPosts.length === 0 ? (
          <div className="text-gray-400 text-center mt-16 animate-fade-in">
            <div className="text-4xl mb-2">🪐</div>
            <div className="text-lg font-semibold">No posts yet</div>
            <div className="text-sm">When users join, their photos, videos, and vibes will appear here!</div>
          </div>
        ) : (
          <div className="w-full max-w-xl flex flex-col gap-6">
            {filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>
      </div>
      
      {/* Top Right FABs */}
      <div className="fixed top-4 right-4 z-50 flex gap-3">
        <button
          className="btn-glass-icon"
          title="Notifications"
          onClick={() => setShowNotifications(true)}
          aria-label="Notifications"
        >
          <Bell className="text-xl" />
        </button>
        <button
          className="btn-glass-icon"
          title="Create Post"
          onClick={() => setShowModal(true)}
          aria-label="Create Post"
        >
          <Plus className="text-xl" />
        </button>
      </div>

      <div className="fixed inset-0 z-50" style={{ pointerEvents: showModal || selectedFlashUser || showNotifications ? 'auto' : 'none' }}>
        {showModal && <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />}
        <CreatePostModal open={showModal} onClose={() => setShowModal(false)} />
        
        {selectedFlashUser && <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />}
        {selectedFlashUser && <FlashModal userFlashes={selectedFlashUser} onClose={() => setSelectedFlashUser(null)} />}
        
        {showNotifications && <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />}
        {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
      </div>
      
      {/* Almighty AI FAB (bottom right) */}
      <motion.button
        className="fixed bottom-24 right-4 z-50 btn-glass-icon w-16 h-16 bg-gradient-to-tr from-accent-pink to-accent-purple flex items-center justify-center"
        aria-label="Almighty AI"
        onClick={() => setShowAlmighty(true)}
        whileHover={{ scale: 1.1, rotate: 15 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <AlmightyLogo size={40} />
      </motion.button>

      {/* Almighty AI Chat Modal */}
      {showAlmighty && (
        <div className="fixed inset-0 z-[100] flex items-end justify-end p-4 bg-black/30 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="w-full max-w-xs sm:max-w-sm glass-card p-4 flex flex-col"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-headline text-accent-pink text-lg">Almighty AI</span>
              <button onClick={() => setShowAlmighty(false)} className="text-accent-green hover:text-accent-pink text-xl font-bold">×</button>
            </div>
            <div className="flex-1 overflow-y-auto max-h-60 mb-2 space-y-2 pr-2">
              {chat.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`rounded-xl px-3 py-2 max-w-[80%] ${msg.role === "model" ? "bg-accent-green/10 text-accent-green" : "bg-accent-pink/20 text-accent-pink"}`}>{msg.parts[0].text}</div>
                </div>
              ))}
              {isAlmightyLoading && (
                  <div className="flex justify-start">
                      <div className="rounded-xl px-3 py-2 bg-accent-green/10 text-accent-green animate-pulse">...</div>
                  </div>
              )}
            </div>
            <form
              onSubmit={handleAlmightySubmit}
              className="flex gap-2 mt-2"
            >
              <input
                className="input-glass flex-1"
                placeholder="Ask Almighty..."
                value={input}
                onChange={e => setInput(e.target.value)}
                autoFocus
              />
              <button
                type="submit"
                className="btn-glass px-4 py-2"
                disabled={!input.trim() || isAlmightyLoading}
              >
                Send
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
