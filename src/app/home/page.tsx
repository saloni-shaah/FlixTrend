
"use client";
import "regenerator-runtime/runtime";
import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import dynamic from 'next/dynamic';
import { getFirestore, collection, query, orderBy, getDoc, doc, limit, startAfter, getDocs, where, Timestamp, onSnapshot } from "firebase/firestore";
import { Plus, Bell, Search, Mic, Video, Flame, Gamepad2, Tv, Music, Rss, Compass, Smile, Code, Atom, LandPlot, Handshake, PenTool, Bot, Sparkles, Book, Camera, Palette, Shirt, Utensils, Plane, Film, BrainCircuit, Landmark, Drama, CookingPot, UtensilsCrossed, Scroll, Music4, HelpingHand, Sprout, Rocket, Briefcase, Heart, Trophy } from "lucide-react";
import { auth } from "@/utils/firebaseClient";
import { useAppState } from "@/utils/AppStateContext";
import { motion, AnimatePresence } from "framer-motion";
import { PostCard } from "@/components/PostCard";
import { app } from "@/utils/firebaseClient";
import { VibeSpaceLoader } from "@/components/VibeSpaceLoader";
import AdBanner from "@/components/AdBanner";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { CreatePostPrompt } from "@/components/CreatePostPrompt";
import { WelcomeAnimation } from "@/components/WelcomeAnimation";


const MusicDiscovery = dynamic(() => import('@/components/MusicDiscovery').then(mod => mod.MusicDiscovery), { ssr: false });
const FlashModal = dynamic(() => import('@/components/FlashModal'), { ssr: false });
const NotificationPanel = dynamic(() => import('@/components/NotificationPanel'), { ssr: false });

const db = getFirestore(app);

const categories = [
    { id: 'for-you', name: 'For You', icon: <Flame /> },
    { id: 'news', name: 'News', icon: <Rss /> },
    { id: 'gaming', name: 'Gaming', icon: <Gamepad2 /> },
    { id: 'music', name: 'Music', icon: <Music /> },
    { id: 'vlogs', name: 'Vlogs', icon: <Video /> },
    { id: 'comedy', name: 'Comedy', icon: <Smile /> },
    { id: 'tech', name: 'Tech', icon: <Code /> },
    { id: 'science', name: 'Science', icon: <Atom /> },
    { id: 'politics', name: 'Politics', icon: <Handshake /> },
    { id: 'education', name: 'Education', icon: <PenTool /> },
    { id: 'art-design', name: 'Art & Design', icon: <Palette /> },
    { id: 'diy-crafts', name: 'DIY & Crafts', icon: <Sparkles /> },
    { id: 'fashion-style', name: 'Fashion', icon: <Shirt /> },
    { id: 'food-cooking', name: 'Food', icon: <Utensils /> },
    { id: 'travel', name: 'Travel', icon: <Plane /> },
    { id: 'photography-videography', name: 'Photography', icon: <Camera /> },
    { id: 'books-literature', name: 'Books', icon: <Book /> },
    { id: 'movies-tv', name: 'Movies & TV', icon: <Film /> },
    { id: 'ai-future', name: 'AI & Future', icon: <Bot /> },
    { id: 'spirituality-wellness', name: 'Wellness', icon: <BrainCircuit /> },
    { id: 'business', name: 'Business', icon: <Briefcase /> },
    { id: 'health-fitness', name: 'Fitness', icon: <Heart /> },
    { id: 'sports', name: 'Sports', icon: <Trophy /> },
    // India-Specific
    { id: 'bollywood', name: 'Bollywood', icon: <Film /> },
    { id: 'bhakti', name: 'Bhakti', icon: <HelpingHand /> },
    { id: 'regional-cinema', name: 'Regional Cinema', icon: <Drama /> },
    { id: 'street-food', name: 'Street Food', icon: <CookingPot /> },
    { id: 'indian-mythology', name: 'Mythology', icon: <Scroll /> },
    { id: 'classical-music-dance', name: 'Classical Arts', icon: <Music4 /> },
    { id: 'festivals-of-india', name: 'Festivals', icon: <Landmark /> },
    { id: 'startups-india', name: 'Startups India', icon: <Rocket /> },
    { id: 'vedic-science', name: 'Vedic Science', icon: <Sprout /> },
];

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
  const [activeCategory, setActiveCategory] = useState('for-you');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showWelcomeAnimation, setShowWelcomeAnimation] = useState(false);
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
      if (searchParams.get('new') === 'true') {
          setShowWelcomeAnimation(true);
      }
  }, [searchParams]);

  useEffect(() => {
    if (!listening && transcript) {
        setSearchTerm(transcript);
        resetTranscript();
    }
  }, [listening, transcript, resetTranscript]);

  const fetchPosts = useCallback(async (category = 'for-you', loadMore = false) => {
    if (!auth.currentUser) return;
    
    if (loadMore) {
        setLoadingMore(true);
    } else {
        setLoading(true);
        setPosts([]); // Clear posts when changing category
        setLastVisible(null);
    }
    
    let postQuery;
    const baseQuery = collection(db, "posts");

    let constraints: any[] = [orderBy("publishAt", "desc")];
    if (category !== 'for-you') {
        constraints.unshift(where("creatorType", "==", category));
    }
    if (loadMore && lastVisible) {
        constraints.push(startAfter(lastVisible));
    }
    constraints.push(limit(POSTS_PER_PAGE));
    
    postQuery = query(baseQuery, ...constraints);

    const documentSnapshots = await getDocs(postQuery);
    
    const newPosts = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];

    setPosts(prev => loadMore ? [...prev, ...newPosts] : newPosts);
    setLastVisible(lastDoc);
    setHasMore(documentSnapshots.docs.length === POSTS_PER_PAGE);

    setLoading(false);
    setLoadingMore(false);
  }, [lastVisible]); // Keep lastVisible to manage pagination state

  useEffect(() => {
    fetchPosts(activeCategory);
  }, [activeCategory]); 

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async user => {
      if (user) {
        setCurrentUser(user);
        const userDocRef = doc(db, "users", user.uid);
        const userProfileSnap = await getDoc(userDocRef);
        const profileData = userProfileSnap.exists() ? userProfileSnap.data() : null;
        setUserProfile(profileData);
        
        const q = query(collection(db, "notifications", user.uid, "user_notifications"), where("read", "==", false));
        const unsubNotifs = onSnapshot(q, (snapshot) => {
            setHasUnreadNotifs(!snapshot.empty);
        });
        
        return () => unsubNotifs();

      } else {
        router.replace('/login'); 
      }
    });
    return () => unsubscribe();
  }, [router]);
  
  const fetchMorePosts = useCallback(() => {
      fetchPosts(activeCategory, true);
  }, [activeCategory, fetchPosts]);


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

  const filteredPosts = searchTerm.trim()
    ? posts.filter(
        (post) =>
          (post.content && post.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (post.username && post.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (post.hashtags && post.hashtags.some((h: string) => h.toLowerCase().includes(searchTerm.toLowerCase())))
      )
    : posts;
    
  const visibleCategories = showAllCategories ? categories : categories.slice(0, 5);

  if (loading && posts.length === 0) {
    return <VibeSpaceLoader />;
  }

  if (showWelcomeAnimation) {
      return <WelcomeAnimation onComplete={() => setShowWelcomeAnimation(false)} />;
  }

  return (
    <div className="flex flex-col w-full">
      <div className="w-full max-w-2xl mx-auto">
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

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
             {visibleCategories.map(cat => (
                <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`btn-glass text-sm flex items-center gap-2 shrink-0 ${activeCategory === cat.id ? 'bg-accent-cyan text-black' : ''}`}
                >
                    {cat.icon} {cat.name}
                </button>
            ))}
            {!showAllCategories && categories.length > 5 && (
                <button
                    onClick={() => setShowAllCategories(true)}
                    className="btn-glass text-sm flex items-center gap-2 shrink-0 bg-accent-purple/20 text-accent-purple"
                >
                    More...
                </button>
            )}
        </div>


        <motion.section 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 glass-card p-4">
            <h2 className="text-lg font-headline bg-gradient-to-r from-accent-pink to-accent-green bg-clip-text text-transparent mb-2">Flashes</h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
                <motion.button
                  className="w-20 h-20 rounded-full bg-gradient-to-tr from-gray-800 to-gray-700 border-4 border-dashed border-gray-600 flex flex-col items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-accent-green transition-transform hover:scale-105"
                  onClick={() => router.push('/create?type=flash')}
                  title="Create a Flash"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                >
                  <Plus className="text-gray-400 mb-1" />
                  <span className="text-xs text-gray-400">Add New</span>
                </motion.button>
              {flashUsers.map((userFlashes: any, index: number) => (
                <motion.button
                  key={userFlashes.userId}
                  className="w-20 h-20 rounded-full bg-gradient-to-tr from-accent-pink to-accent-green border-4 border-accent-green/40 flex items-center justify-center overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-accent-green transition-transform hover:scale-105"
                  onClick={() => setSelectedFlashUser(userFlashes)}
                  title={userFlashes.username || "Flash"}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 + index * 0.05, type: "spring", stiffness: 200 }}
                >
                  {userFlashes.avatar_url ? (
                      <img src={userFlashes.avatar_url} alt="flash" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl text-white">⚡</span>
                  )}
                </motion.button>
              ))}
            </div>
        </motion.section>

        <section className="flex-1 flex flex-col items-center mt-4">
            <h2 className="text-xl font-headline self-start bg-gradient-to-r from-accent-pink to-accent-green bg-clip-text text-transparent mb-4">VibeSpace</h2>
            {loading && posts.length === 0 ? (
              <VibeSpaceLoader />
            ) : (
              <div className="w-full max-w-xl flex flex-col gap-6">
                <CreatePostPrompt onGoLive={handleGoLive} />
                {filteredPosts.length > 0 ? filteredPosts.map((post, index) => (
                  <React.Fragment key={post.id}>
                    <PostCard post={post} />
                    {(index + 1) % 5 === 0 && <AdBanner key={`ad-${post.id}`} />}
                  </React.Fragment>
                )) : (
                    <div className="text-center text-gray-400 p-8 glass-card">No posts found in this category yet.</div>
                )}
                
                <div ref={feedEndRef} className="h-10 w-full" />

                {loadingMore && (
                  <div className="flex justify-center my-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-cyan"></div>
                  </div>
                )}
                
                {!hasMore && !searchTerm.trim() && posts.length > 0 && (
                  <div className="text-center text-gray-500 my-8">
                    <p>You've reached the end of the vibe. ✨</p>
                  </div>
                )}
              </div>
            )}
        </section>
      </div>
      
      <div className="fixed top-4 right-4 z-30 flex flex-col items-center">
        <motion.button
          className={`relative inline-flex items-center justify-center bg-white/10 dark:bg-black/20 backdrop-blur-md border border-white/10 dark:border-black/20 w-12 h-12 rounded-full text-white hover:bg-gradient-to-tr hover:from-accent-purple hover:to-accent-cyan transition-all ${hasUnreadNotifs ? 'animate-pulse' : ''}`}
          title="Notifications"
          onClick={() => setShowNotifications(true)}
          aria-label="Notifications"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Bell className="text-xl" />
          {hasUnreadNotifs && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-accent-pink rounded-full"></span>}
        </motion.button>
      </div>

      <AnimatePresence>
        {showMusicModal && <MusicDiscovery onClose={() => setShowMusicModal(false)} />}
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
