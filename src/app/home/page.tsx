
"use client";
import "regenerator-runtime/runtime";
import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import dynamic from 'next/dynamic';
import { getFirestore, collection, query, orderBy, onSnapshot, getDoc, doc, limit, startAfter, getDocs, where, Timestamp } from "firebase/firestore";
import { Plus, Bell, Search, Mic, Video } from "lucide-react";
import { auth } from "@/utils/firebaseClient";
import { useAppState } from "@/utils/AppStateContext";
import { motion, AnimatePresence } from "framer-motion";
import { PostCard } from "@/components/PostCard";
import { app } from "@/utils/firebaseClient";
import { VibeSpaceLoader } from "@/components/VibeSpaceLoader";
import AdBanner from "@/components/AdBanner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles } from 'lucide-react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { AlmightyLogo } from "@/components/ui/logo";

const AddMusicModal = dynamic(() => import('@/components/MusicDiscovery').then(mod => mod.MusicDiscovery), { ssr: false });
const FlashModal = dynamic(() => import('@/components/FlashModal'), { ssr: false });
const NotificationPanel = dynamic(() => import('@/components/NotificationPanel'), { ssr: false });
const LiveStream = dynamic(() => import('@/components/LiveStream').then(mod => mod.LiveStream), { ssr: false });
const ShortsPlayer = dynamic(() => import('@/components/ShortsPlayer').then(mod => mod.ShortsPlayer), { ssr: false });

const db = getFirestore(app);

const CreatePostPrompt = dynamic(() => Promise.resolve(function CreatePostPrompt({ isPremium }: { isPremium: boolean }) {
  const [userProfile, setUserProfile] = useState<any>(null);
  const router = useRouter();

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
        <button className="glass-card p-4 text-center w-full" onClick={() => router.push('/create')}>
          <h3 className="font-bold text-lg">Flix Your Fit by dropping a post</h3>
          <span className="text-accent-cyan hover:underline text-sm">
            click here to make a post
          </span>
        </button>
        {!isPremium && <PremiumUpgradeBanner />}
      </div>
  );
}), { ssr: false });

const PremiumUpgradeBanner = dynamic(() => Promise.resolve(function PremiumUpgradeBanner() {
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
}), { ssr: false });


function HomePageContent() {
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
  const [isLive, setIsLive] = useState(false);
  const [liveStreamTitle, setLiveStreamTitle] = useState('');
  const [showShortsPlayer, setShowShortsPlayer] = useState(false);
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
      where("publishAt", "<=", Timestamp.now()),
      orderBy("publishAt", "desc"), 
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
          where("publishAt", "<=", Timestamp.now()),
          orderBy("publishAt", "desc"),
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
  
  const handleGoLive = (title: string) => {
      setLiveStreamTitle(title);
      setIsLive(true);
  }

  const handleVoiceSearch = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      SpeechRecognition.startListening();
    }
  };

  // Group flashes by user
  const groupedFlashes = flashes.reduce((acc: any, flash) => {
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


  if (showShortsPlayer) {
    return <ShortsPlayer onClose={() => setShowShortsPlayer(false)} />;
  }

  if (!currentUser || !browserSupportsSpeechRecognition) {
    return <VibeSpaceLoader />;
  }

   if (isLive) {
    return <LiveStream title={liveStreamTitle} onStreamEnd={() => setIsLive(false)} />;
  }

  return (
    <div className="flex flex-col w-full">
      <div className="w-full max-w-2xl mx-auto">
      {/* Centered, prominent search bar */}
      <div className="flex justify-center items-center mb-6 w-full">
        <div className="input-glass w-full flex items-center px-4">
              <button
                  onClick={handleVoiceSearch}
                  className={`p-1 rounded-full transition-colors text-gray-400 hover:text-brand-gold ${listening ? 'animate-pulse bg-red-500/50' : ''}`}
                  aria-label="Voice search"
              >
                  <Mic size={20} />
              </button>
              <div className="w-px h-6 bg-glass-border mx-3"></div>
              <input
                type="text"
                className="flex-1 bg-transparent py-3 text-lg font-body focus:outline-none"
                placeholder={listening ? "Listening..." : "Search posts..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus={false}
              />
              <button className="p-2 rounded-full text-brand-gold hover:bg-brand-gold/10">
                <Search />
              </button>
          </div>
      </div>
      {/* Flashes/Stories Section */}
      <section className="mb-6 glass-card p-4">
        <h2 className="text-lg font-headline bg-gradient-to-r from-accent-pink to-accent-green bg-clip-text text-transparent mb-2">Flashes</h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
            <button
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-gray-800 to-gray-700 border-4 border-dashed border-gray-600 flex flex-col items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-accent-green transition-transform hover:scale-105"
              onClick={() => router.push('/create?type=flash')}
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

      {/* Shorts Player Button */}
      <section className="mb-6">
        <button
          onClick={() => setShowShortsPlayer(true)}
          className="w-full glass-card p-4 flex items-center justify-center gap-4 hover:border-accent-pink transition-colors"
        >
          <Video className="text-accent-pink" size={32} />
          <div className="text-left">
            <h3 className="font-headline text-xl font-bold">Watch Shorts</h3>
            <p className="text-sm text-gray-400">Tap to dive into a full-screen video feed</p>
          </div>
        </button>
      </section>

      {/* Feed Section */}
      <section className="flex-1 flex flex-col items-center mt-4">
        {loading ? (
          <VibeSpaceLoader />
        ) : (
          <div className="w-full max-w-xl flex flex-col gap-6">
            <CreatePostPrompt isPremium={isPremium} />
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
          className="relative inline-flex items-center justify-center bg-white/10 dark:bg-black/20 backdrop-blur-md border border-white/10 dark:border-black/20 w-12 h-12 rounded-full text-white hover:bg-gradient-to-tr hover:from-accent-purple hover:to-accent-cyan transition-all"
          title="Notifications"
          onClick={() => setShowNotifications(true)}
          aria-label="Notifications"
        >
          <Bell className="text-xl" />
        </button>
      </div>

       {/* Bottom Right AI FAB */}
      <div className="fixed bottom-24 right-4 z-30">
        <Link href="/signal">
            <motion.button 
                className="w-16 h-16 rounded-full flex items-center justify-center shadow-fab-glow bg-green-200/20 dark:bg-green-900/30 backdrop-blur-md"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title="Ask Almighty AI"
            >
                <AlmightyLogo className="w-8 h-8" />
            </motion.button>
        </Link>
      </div>

      <AnimatePresence>
        {showMusicModal && <AddMusicModal onClose={() => setShowMusicModal(false)} />}
        {selectedFlashUser && <FlashModal userFlashes={selectedFlashUser} onClose={() => setSelectedFlashUser(null)} />}
        {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
      </AnimatePresence>
    </div>
  );
}

export default function HomePage() {
    return (
        <Suspense fallback={<VibeSpaceLoader />}>
            <HomePageContent />
        </Suspense>
    )
}
