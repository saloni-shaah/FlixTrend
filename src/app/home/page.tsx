
"use client";
import "regenerator-runtime/runtime";
import React, { useState, useEffect, useCallback, useRef } from "react";
import dynamic from 'next/dynamic';
import { getFirestore, collection, query, orderBy, onSnapshot, getDoc, doc, limit, startAfter, getDocs, where } from "firebase/firestore";
import { Plus, Bell, Search, Music, Bot, Mic, Camera, Radio } from "lucide-react";
import { auth } from "@/utils/firebaseClient";
import { useAppState } from "@/utils/AppStateContext";
import { motion, AnimatePresence } from "framer-motion";
import { PostCard } from "@/components/PostCard";
import { app } from "@/utils/firebaseClient";
import { VibeSpaceLoader } from "@/components/VibeSpaceLoader";
import AdBanner from "@/components/AdBanner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlignLeft, BarChart3, ImageIcon, Sparkles } from 'lucide-react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { AlmightyLogo } from "@/components/ui/logo";


const CreatePostModal = dynamic(() => import('./CreatePostModal'), { ssr: false });
const AddMusicModal = dynamic(() => import('@/components/MusicDiscovery'), { ssr: false });
const FlashModal = dynamic(() => import('@/components/FlashModal'), { ssr: false });
const NotificationPanel = dynamic(() => import('@/components/NotificationPanel'), { ssr: false });


const db = getFirestore(app);

const CHAT_KEYWORDS = ['hi', 'hello', 'hey', 'yo', 'almighty', 'what', 'who', 'when', 'where', 'why', 'how'];

function CreatePostPrompt({ onPromptClick, isPremium }: { onPromptClick: (type: "text" | "media" | "poll" | "camera" | "live") => void; isPremium: boolean }) {
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
      <div className="w-full max-w-xl mb-6">
        <div className="glass-card p-4">
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
              <button onClick={() => onPromptClick('camera')} className="flex items-center gap-2 text-gray-300 hover:text-accent-cyan"><Camera/> Camera</button>
              <button onClick={() => onPromptClick('poll')} className="flex items-center gap-2 text-gray-300 hover:text-accent-cyan"><BarChart3/> Poll</button>
              <button onClick={() => onPromptClick('live')} className="flex items-center gap-2 text-red-500 hover:text-red-400"><Radio className="animate-pulse"/> Live</button>
          </div>
        </div>
        {!isPremium && <PremiumUpgradeBanner />}
      </div>
  );
}

function PremiumUpgradeBanner() {
    return (
        <Link href="/premium">
            <motion.div 
                className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-accent-purple via-accent-pink to-brand-gold cursor-pointer"
                whileHover={{ scale: 1.02 }}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                         <Sparkles className="text-white" />
                        <div>
                            <h4 className="font-headline font-bold text-white">Go Premium!</h4>
                            <p className="text-xs text-white/80">Unlock blue tick, an ad-free experience & more.</p>
                        </div>
                    </div>
                    <span className="px-4 py-2 rounded-full bg-white/20 text-white font-bold text-sm">Upgrade</span>
                </div>
            </motion.div>
        </Link>
    )
}


export default function HomePage() {
  const [showPostModal, setShowPostModal] = useState(false);
  const [initialPostType, setInitialPostType] = useState<"text" | "media" | "poll" | "flash" | "camera" | "live">("text");
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [flashes, setFlashes] = useState<any[]>([]);
  const [selectedFlashUser, setSelectedFlashUser] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const { setCallTarget, setIsCalling } = useAppState();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter();
  const POSTS_PER_PAGE = 5;
  const feedEndRef = useRef<HTMLDivElement>(null);
  
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  useEffect(() => {
    if (!listening && transcript) {
        setSearchTerm(transcript);
        resetTranscript();
    }
  }, [listening, transcript, resetTranscript]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async user => {
      if (user) {
        setCurrentUser(user);
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }
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

  const handleCreatePost = (type: "text" | "media" | "poll" | "flash" | "camera" | "live") => {
    setInitialPostType(type);
    setShowPostModal(true);
  };
  
  const handleVoiceSearch = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      SpeechRecognition.startListening();
    }
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
    
  const isPremium = userProfile?.isPremium && (!userProfile.premiumUntil || userProfile.premiumUntil.toDate() > new Date());


  if (!currentUser || !browserSupportsSpeechRecognition) {
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
            className="input-glass w-full pl-12 pr-24 py-3 text-lg font-body"
            placeholder={listening ? "Listening..." : "Search posts..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus={false}
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-brand-gold pointer-events-none">
            <Search />
          </span>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <button
                onClick={handleVoiceSearch}
                className={`p-1 rounded-full transition-colors text-gray-400 hover:text-brand-gold ${listening ? 'animate-pulse bg-red-500/50' : ''}`}
                aria-label="Voice search"
            >
                <Mic size={20} />
            </button>
          </div>
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
            <CreatePostPrompt onPromptClick={handleCreatePost} isPremium={isPremium} />
            {filteredPosts.map((post, index) => (
              <React.Fragment key={post.id}>
                <PostCard post={post} />
                {(index + 1) % 5 === 0 && !isPremium && <AdBanner key={`ad-${post.id}`} />}
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

       {/* Bottom Right AI FAB */}
      <div className="fixed bottom-24 right-4 z-30">
        <Link href="/almighty">
            <motion.button 
                className="btn-glass-icon w-16 h-16 bg-gradient-to-tr from-accent-purple to-accent-cyan flex items-center justify-center shadow-fab-glow"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title="Ask Almighty AI"
            >
                <AlmightyLogo className="w-8 h-8" />
            </motion.button>
        </Link>
      </div>

      <AnimatePresence>
        {showPostModal && <CreatePostModal open={showPostModal} onClose={() => setShowPostModal(false)} initialType={initialPostType} />}
        {showMusicModal && <AddMusicModal onClose={() => setShowMusicModal(false)} />}
        {selectedFlashUser && <FlashModal userFlashes={selectedFlashUser} onClose={() => setSelectedFlashUser(null)} />}
        {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
      </AnimatePresence>
    </div>
  );
}
