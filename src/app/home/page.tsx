
"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import dynamic from 'next/dynamic';
import { getFirestore, collection, query, orderBy, onSnapshot, getDoc, doc, limit, startAfter, getDocs, where } from "firebase/firestore";
import { Plus, Bell, Search, Music, Gamepad2, PenSquare, Image as ImageIcon, AlignLeft, BarChart3 } from "lucide-react";
import { auth } from "@/utils/firebaseClient";
import { useAppState } from "@/utils/AppStateContext";
import { motion, AnimatePresence } from "framer-motion";
import { AlmightyLogo } from "@/components/AlmightyLogo";
import { PostCard } from "@/components/PostCard";
import { app } from "@/utils/firebaseClient";
import { VibeSpaceLoader } from "@/components/VibeSpaceLoader";
import AdBanner from "@/components/AdBanner";
import { useRouter } from "next/navigation";

const CreatePostModal = dynamic(() => import('./CreatePostModal'));
const AddMusicModal = dynamic(() => import('@/components/MusicDiscovery').then(mod => mod.AddMusicModal));
const AddGameModal = dynamic(() => import('@/components/GamesHub').then(mod => mod.AddGameModal));
const FlashModal = dynamic(() => import('@/components/FlashModal').then(mod => mod.FlashModal));
const NotificationPanel = dynamic(() => import('@/components/NotificationPanel').then(mod => mod.NotificationPanel));


const db = getFirestore(app);

function CreatePostPrompt({ onPromptClick }: { onPromptClick: (type: "text" | "media" | "poll") => void }) {
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }
      }
    });
    return () => unsub();
  }, []);

  return (
    <div className="glass-card p-4 w-full max-w-xl mb-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-accent-pink to-accent-cyan flex items-center justify-center font-bold text-lg overflow-hidden shrink-0">
          {userProfile?.avatar_url ? (
            <img src={userProfile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-white">{userProfile?.name?.[0] || 'U'}</span>
          )}
        </div>
        <div 
          className="flex-1 input-glass text-left text-gray-400 cursor-pointer"
          onClick={() => onPromptClick('text')}
        >
          drop something bro
        </div>
      </div>
      <div className="flex justify-around items-center mt-4 pt-3 border-t border-glass-border">
          <button onClick={() => onPromptClick('text')} className="flex items-center gap-2 text-gray-300 hover:text-accent-cyan"><AlignLeft/> Text</button>
          <button onClick={() => onPromptClick('media')} className="flex items-center gap-2 text-gray-300 hover:text-accent-cyan"><ImageIcon/> Media</button>
          <button onClick={() => onPromptClick('poll')} className="flex items-center gap-2 text-gray-300 hover:text-accent-cyan"><BarChart3/> Poll</button>
      </div>
    </div>
  );
}


export default function HomePage() {
  const [showPostModal, setShowPostModal] = useState(false);
  const [initialPostType, setInitialPostType] = useState<"text" | "media" | "poll" | "flash">("text");
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [showGameModal, setShowGameModal] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [flashes, setFlashes] = useState<any[]>([]);
  const [selectedFlashUser, setSelectedFlashUser] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const { setCallTarget, setIsCalling } = useAppState();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter();
  const POSTS_PER_PAGE = 5;
  const feedEndRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setCurrentUser(user);
      } else {
        router.replace('/login'); 
      }
    });
    return () => unsubscribe();
  }, [router]);


  const fetchPosts = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);

    const first = query(
      collection(db, "posts"), 
      orderBy("createdAt", "desc"), 
      limit(POSTS_PER_PAGE)
    );

    const documentSnapshots = await getDocs(first);
    
    const firstBatch = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];

    setPosts(firstBatch);
    setLastVisible(lastDoc);
    setLoading(false);
    setHasMore(documentSnapshots.docs.length === POSTS_PER_PAGE);
  }, [currentUser]);
  
  const fetchMorePosts = useCallback(async () => {
      if (!currentUser || !lastVisible || !hasMore || loadingMore) return;
      setLoadingMore(true);

      const next = query(
          collection(db, "posts"),
          orderBy("createdAt", "desc"),
          startAfter(lastVisible),
          limit(POSTS_PER_PAGE)
      );

      const documentSnapshots = await getDocs(next);
      const nextBatch = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];

      setPosts(prevPosts => [...prevPosts, ...nextBatch]);
      setLastVisible(lastDoc);
      setLoadingMore(false);
      setHasMore(documentSnapshots.docs.length === POSTS_PER_PAGE);
  }, [currentUser, lastVisible, hasMore, loadingMore]);


  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          fetchMorePosts();
        }
      },
      { threshold: 1.0 }
    );

    const currentRef = feedEndRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [feedEndRef, fetchMorePosts, hasMore, loading, loadingMore]);


  useEffect(() => {
    if (!currentUser) return;
    const q = query(
        collection(db, "flashes"), 
        where("expiresAt", ">", new Date()),
        orderBy("expiresAt", "desc")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setFlashes(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [currentUser]);

  const handleCreatePost = (type: "text" | "media" | "poll" | "flash") => {
    setInitialPostType(type);
    setShowPostModal(true);
  };

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

  if (!currentUser) {
    return <VibeSpaceLoader />;
  }

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
            <button
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-gray-800 to-gray-700 border-4 border-dashed border-gray-600 flex flex-col items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-accent-green transition-transform hover:scale-105"
              onClick={() => handleCreatePost('flash')}
              title="Create a Flash"
            >
              <Plus className="text-gray-400 mb-1" />
              <span className="text-xs text-gray-400">Add New</span>
            </button>
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
        {loading ? (
          <VibeSpaceLoader />
        ) : (
          <div className="w-full max-w-xl flex flex-col gap-6">
            <CreatePostPrompt onPromptClick={handleCreatePost} />
            {filteredPosts.map((post, index) => (
              <React.Fragment key={post.id}>
                <PostCard post={post} />
                {(index + 1) % 5 === 0 && <AdBanner key={`ad-${post.id}`} />}
              </React.Fragment>
            ))}
            
            <div ref={feedEndRef} className="h-10 w-full" />

            {loadingMore && (
              <div className="flex justify-center my-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-cyan"></div>
              </div>
            )}
            
            {!hasMore && !searchTerm.trim() && (
              <div className="text-center text-gray-500 my-8">
                <p>You've reached the end of the vibe. ✨</p>
              </div>
            )}
          </div>
        )}
      </section>
      </div>
      
      {/* Top Right FABs */}
      <div className="fixed top-4 right-4 z-30 flex flex-col items-center">
        <button
          className="btn-glass-icon"
          title="Notifications"
          onClick={() => setShowNotifications(true)}
          aria-label="Notifications"
        >
          <Bell className="text-xl" />
        </button>
      </div>

      <AnimatePresence>
        {showPostModal && <CreatePostModal open={showPostModal} onClose={() => setShowPostModal(false)} initialType={initialPostType} />}
        {showMusicModal && <AddMusicModal onClose={() => setShowMusicModal(false)} />}
        {showGameModal && <AddGameModal onClose={() => setShowGameModal(false)} />}
        {selectedFlashUser && <FlashModal userFlashes={selectedFlashUser} onClose={() => setSelectedFlashUser(null)} />}
        {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
      </AnimatePresence>
    </div>
  );
}

    