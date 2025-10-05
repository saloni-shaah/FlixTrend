
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
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { AlmightyLogo } from "@/components/ui/logo";
import { CreatePostPrompt } from "@/components/CreatePostPrompt";


const AddMusicModal = dynamic(() => import('@/components/MusicDiscovery').then(mod => mod.MusicDiscovery), { ssr: false });
const FlashModal = dynamic(() => import('@/components/FlashModal'), { ssr: false });
const NotificationPanel = dynamic(() => import('@/components/NotificationPanel'), { ssr: false });
const ShortsPlayer = dynamic(() => import('@/components/ShortsPlayer').then(mod => mod.ShortsPlayer), { ssr: false });
const AdModal = dynamic(() => import('@/components/AdModal'), { ssr: false });


const db = getFirestore(app);

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
  const [showShortsPlayer, setShowShortsPlayer] = useState(false);
  const [showAlmightyAd, setShowAlmightyAd] = useState(false);
  const router = useRouter();
  const POSTS_PER_PAGE = 5;
  const feedEndRef = useRef<HTMLDivElement>(null);
  const [hasUnreadNotifs, setHasUnreadNotifs] = useState(false);
  
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
        const userDocRef = doc(db, "users", user.uid);
        const userProfileSnap = await getDoc(userDocRef);
        const profileData = userProfileSnap.exists() ? userProfileSnap.data() : null;
        setUserProfile(profileData);

        const vibeEngineRef = doc(db, 'user_profiles', user.uid, 'engine', 'vibe');
        const vibeEngineSnap = await getDoc(vibeEngineRef);
        const vibeScores = vibeEngineSnap.exists() ? vibeEngineSnap.data().scores : {};
        
        // Setup notification listener
        const q = query(collection(db, "notifications", user.uid, "user_notifications"), where("read", "==", false));
        const unsubNotifs = onSnapshot(q, (snapshot) => {
            setHasUnreadNotifs(!snapshot.empty);
        });
        
        // Force a re-fetch of posts when user changes
        setPosts([]);
        setLastVisible(null);
        setHasMore(true);
        fetchPosts(true, vibeScores); // pass true to indicate a reset
        
        return () => unsubNotifs();

      } else {
        router.replace('/login'); 
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchPosts = useCallback(async (isReset = false, vibeScores = {}) => {
    if (!auth.currentUser) return;
    setLoading(true);

    const sortedInterests = Object.entries(vibeScores)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .map(([key]) => key);
    
    let q;
    if (sortedInterests.length > 0) {
        q = query(
            collection(db, "posts"),
            where("category", "in", sortedInterests.slice(0, 10)), // Query top 10 interests for variety
            orderBy("publishAt", "desc"),
            limit(POSTS_PER_PAGE)
        );
    } else {
        // Fallback for new users
        q = query(
            collection(db, "posts"),
            orderBy("publishAt", "desc"),
            limit(POSTS_PER_PAGE)
        );
    }


    const documentSnapshots = await getDocs(q);
    
    const newPosts = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];

    setPosts(isReset ? newPosts : [...posts, ...newPosts]);
    setLastVisible(lastDoc);
    setLoading(false);
    setHasMore(documentSnapshots.docs.length === POSTS_PER_PAGE);
  }, [posts]);
  
  const fetchMorePosts = useCallback(async () => {
      if (!auth.currentUser || !lastVisible || !hasMore || loadingMore) return;
      setLoadingMore(true);

      const vibeEngineRef = doc(db, 'user_profiles', auth.currentUser.uid, 'engine', 'vibe');
      const vibeEngineSnap = await getDoc(vibeEngineRef);
      const vibeScores = vibeEngineSnap.exists() ? vibeEngineSnap.data().scores : {};
      const sortedInterests = Object.entries(vibeScores)
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .map(([key]) => key);

      let next;
      if (sortedInterests.length > 0) {
          next = query(
              collection(db, "posts"),
              where("category", "in", sortedInterests.slice(0, 10)),
              orderBy("publishAt", "desc"),
              startAfter(lastVisible),
              limit(POSTS_PER_PAGE)
          );
      } else {
           next = query(
              collection(db, "posts"),
              orderBy("publishAt", "desc"),
              startAfter(lastVisible),
              limit(POSTS_PER_PAGE)
          );
      }

      const documentSnapshots = await getDocs(next);
      const nextBatch = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];

      setPosts(prevPosts => [...prevPosts, ...nextBatch]);
      setLastVisible(lastDoc);
      setLoadingMore(false);
      setHasMore(documentSnapshots.docs.length === POSTS_PER_PAGE);
  }, [lastVisible, hasMore, loadingMore]);


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
      const roomName = `${currentUser.uid}-${Date.now()}`;
      router.push(`/broadcast/${encodeURIComponent(roomName)}`);
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

  if (loading && posts.length === 0) {
    return <VibeSpaceLoader />;
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
        {loading && posts.length === 0 ? (
          <VibeSpaceLoader />
        ) : (
          <div className="w-full max-w-xl flex flex-col gap-6">
            <CreatePostPrompt isPremium={!!isPremium} onGoLive={handleGoLive} />
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
          className={`relative inline-flex items-center justify-center bg-white/10 dark:bg-black/20 backdrop-blur-md border border-white/10 dark:border-black/20 w-12 h-12 rounded-full text-white hover:bg-gradient-to-tr hover:from-accent-purple hover:to-accent-cyan transition-all ${hasUnreadNotifs ? 'animate-pulse' : ''}`}
          title="Notifications"
          onClick={() => setShowNotifications(true)}
          aria-label="Notifications"
        >
          <Bell className="text-xl" />
          {hasUnreadNotifs && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-accent-pink rounded-full"></span>}
        </button>
      </div>

       {/* Bottom Right AI FAB */}
      <div className="fixed bottom-24 right-4 z-30">
        <motion.button 
            onClick={() => setShowAlmightyAd(true)}
            className="w-16 h-16 rounded-full flex items-center justify-center shadow-fab-glow bg-green-200/20 dark:bg-green-900/30 backdrop-blur-md"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            title="Ask Almighty AI"
        >
            <AlmightyLogo className="w-8 h-8" />
        </motion.button>
      </div>

      <AnimatePresence>
        {showMusicModal && <AddMusicModal onClose={() => setShowMusicModal(false)} />}
        {selectedFlashUser && <FlashModal userFlashes={selectedFlashUser} onClose={() => setSelectedFlashUser(null)} />}
        {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
        {showAlmightyAd && <AdModal onComplete={() => { setShowAlmightyAd(false); router.push('/almighty'); }} />}
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
