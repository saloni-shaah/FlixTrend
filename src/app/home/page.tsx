
"use client";
import React, { useState, useEffect } from "react";
import CreatePostModal from "./CreatePostModal";
import { getFirestore, collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { Plus, Bell, Search } from "lucide-react";
import { auth } from "@/utils/firebaseClient";
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
  const [showNotifications, setShowNotifications] = useState(false);
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

  return (
    <div className="flex flex-col w-full">
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
      
    </div>
  );
}
