
"use client";
import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import dynamic from 'next/dynamic';
import { getFirestore, collection, query, orderBy, getDoc, doc, limit, startAfter, getDocs, where, Timestamp, onSnapshot, or } from "firebase/firestore";
import { Plus, Bell, Search, Mic, Video, Flame, Gamepad2, Tv, Music, Rss, Compass, Smile, Code, Atom, LandPlot, Handshake, PenTool, Bot, Sparkles, Book, Camera, Palette, Shirt, Utensils, Plane, Film, BrainCircuit, Landmark, Drama, CookingPot, UtensilsCrossed, Scroll, Music4, HelpingHand, Sprout, Rocket, Briefcase, Heart, Trophy, AlignLeft, BarChart3, Zap, Radio, Image as ImageIcon, BriefcaseBusiness, Users, Brush, GraduationCap, Popcorn } from "lucide-react";
import { auth } from "@/utils/firebaseClient";
import { useAppState } from "@/utils/AppStateContext";
import { motion, AnimatePresence } from "framer-motion";
import { PostCard } from "@/components/PostCard";
import { app } from "@/utils/firebaseClient";
import { VibeSpaceLoader } from "@/components/VibeSpaceLoader";
import AdBanner from "@/components/AdBanner";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CreatePostPrompt } from "@/components/CreatePostPrompt";
import { WelcomeAnimation } from "@/components/WelcomeAnimation";
import { redisClient } from '@/utils/redis';

const MusicDiscovery = dynamic(() => import('@/components/MusicDiscovery').then(mod => mod.MusicDiscovery), { ssr: false });
const FlashModal = dynamic(() => import('@/components/FlashModal'), { ssr: false });
const NotificationPanel = dynamic(() => import('@/components/NotificationPanel'), { ssr: false });

const db = getFirestore(app);

const categories = [
    { id: 'all', name: 'All', icon: <Flame /> },
    { id: 'daily', name: 'Daily', icon: <Users /> },
    { id: 'creative', name: 'Creative', icon: <Brush /> },
    { id: 'play', name: 'Play', icon: <Gamepad2 /> },
    { id: 'learn', name: 'Learn', icon: <GraduationCap /> },
    { id: 'culture', name: 'Culture', icon: <Popcorn /> },
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
  const [activeCategory, setActiveCategory] = useState('all');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showWelcomeAnimation, setShowWelcomeAnimation] = useState(false);
  const POSTS_PER_PAGE = 5;
  const feedEndRef = useRef<HTMLDivElement>(null);
  const [hasUnreadNotifs, setHasUnreadNotifs] = useState(false);
  const [viewedFlashes, setViewedFlashes] = useState<string[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  
  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (hasMounted && searchParams.get('new') === 'true') {
        setShowWelcomeAnimation(true);
        // Clean the URL
        router.replace('/home', { scroll: false });
    }
  }, [searchParams, hasMounted, router]);

  useEffect(() => {
    const storedViewed = localStorage.getItem('viewedFlashes');
    if (storedViewed) {
        setViewedFlashes(JSON.parse(storedViewed));
    }
  }, []);

  const handleFlashModalClose = (viewedUserId?: string) => {
    if (viewedUserId && !viewedFlashes.includes(viewedUserId)) {
      const newViewed = [...viewedFlashes, viewedUserId];
      setViewedFlashes(newViewed);
      localStorage.setItem('viewedFlashes', JSON.stringify(newViewed));
    }
    setSelectedFlashUser(null);
  };

    const fetchPosts = useCallback(async (category: string, loadMore = false) => {
        if (!auth.currentUser) return;

        if (loadMore) {
            if (!hasMore || loadingMore) return;
            setLoadingMore(true);
        } else {
            setLoading(true);
            const cachedPosts: any = await redisClient.get(`feed:${category}`);
            if (cachedPosts) {
                setPosts(cachedPosts);
                setLoading(false);
                return;
            }
        }

        const baseQuery = collection(db, "posts");
        
        let constraints: any[] = [orderBy("publishAt", "desc")];

        if (category && category !== 'all') {
            constraints.unshift(or(
              where("category", "==", category), 
              where("creatorType", "==", category)
            ));
        }

        if (loadMore && lastVisible) {
            constraints.push(startAfter(lastVisible));
        }

        constraints.push(limit(POSTS_PER_PAGE));
        
        const postQuery = query(baseQuery, ...constraints);

        try {
            const documentSnapshots = await getDocs(postQuery);
            
            const newPosts = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];

            if (loadMore) {
                 setPosts(prev => {
                    const existingIds = new Set(prev.map(p => p.id));
                    const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p.id));
                    return [...prev, ...uniqueNewPosts];
                });
            } else {
                setPosts(newPosts);
                await redisClient.set(`feed:${category}`, newPosts, { ex: 300 }); // Cache for 5 minutes
            }


            setLastVisible(lastDoc);
            setHasMore(documentSnapshots.docs.length === POSTS_PER_PAGE);
        } catch (error) {
            console.error("Error fetching posts: ", error);
        } finally {
             if (loadMore) {
                setLoadingMore(false);
            } else {
                setLoading(false);
            }
        }
    }, [hasMore, lastVisible, loadingMore]);


    useEffect(() => {
        if(currentUser) { // Only fetch posts if user is authenticated
            fetchPosts(activeCategory);
        }
    }, [activeCategory, currentUser]); // Removed fetchPosts from deps to prevent re-fetch on every render
    
    const fetchMorePosts = useCallback(() => {
        fetchPosts(activeCategory, true);
    }, [fetchPosts, activeCategory]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async user => {
      if (user) {
        setCurrentUser(user);
        const userDocRef = doc(db, "users", user.uid);
        const userProfileSnap = await getDoc(userDocRef);
        const profileData = userProfileSnap.exists() ? userProfileSnap.data() : null;
        setUserProfile(profileData);
        
        const q = query(collection(db, "users", user.uid, "notifications"), where("read", "==", false));
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
  
  useEffect(() => {
    if (loading) return; // Don't setup observer while initially loading
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
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
  }, [fetchMorePosts, hasMore, loading, loadingMore]);


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
    
  
  const canCreatePost = true; // Anyone can post now

  const flashesContainerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.08,
        duration: 0.4,
        ease: 'easeOut',
        type: "spring",
        stiffness: 100,
        damping: 10
      },
    },
  };

  const flashItemVariants = {
    hidden: { opacity: 0, scale: 0.5 },
    visible: { opacity: 1, scale: 1 },
  };
  
  const categoryContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const categoryItemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.8 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 100, damping: 12 },
    },
  };

  const bellVariants = {
    initial: { rotate: 0 },
    jiggle: {
      rotate: [0, -15, 15, -15, 15, 0],
      transition: {
        duration: 0.5,
        ease: "easeInOut",
        repeat: Infinity,
        repeatDelay: 3,
      },
    },
  };


  if (loading && posts.length === 0) {
    return <VibeSpaceLoader />;
  }

  if (showWelcomeAnimation) {
      return <WelcomeAnimation onComplete={() => setShowWelcomeAnimation(false)} />;
  }

  return (
    <div className="flex flex-col w-full">
      <div className="w-full max-w-2xl mx-auto">
        <motion.div 
            className="flex justify-center items-center mb-6 w-full"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
        >
            <div className={`input-glass w-full flex items-center px-4 transition-all duration-300 ${isSearchFocused ? 'ring-2 ring-brand-saffron' : ''}`}>
                  <button
                      className={`p-1 rounded-full transition-colors text-gray-400 hover:text-brand-gold`}
                      aria-label="Voice search"
                      disabled={true}
                  >
                      <Mic size={20} />
                  </button>
                  <div className="w-px h-6 bg-glass-border mx-3"></div>
                  <input
                    type="text"
                    className="flex-1 bg-transparent py-3 text-lg font-body focus:outline-none"
                    placeholder={"Search posts..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    autoFocus={false}
                  />
                  <motion.div whileHover={{ scale: 1.1, rotate: 10 }}>
                    <button className="p-2 rounded-full text-brand-gold hover:bg-brand-gold/10">
                        <Search />
                    </button>
                  </motion.div>
              </div>
        </motion.div>

        {/* Category Filters */}
        <motion.div 
            className="flex gap-2 overflow-x-auto pb-4 mb-4"
            variants={categoryContainerVariants}
            initial="hidden"
            animate="visible"
        >
             {categories.map(cat => (
                <motion.button
                    key={cat.id}
                    variants={categoryItemVariants}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`btn-glass text-sm flex items-center gap-2 shrink-0 ${activeCategory === cat.id ? 'bg-accent-cyan text-black' : ''}`}
                >
                    {cat.icon} {cat.name}
                </motion.button>
            ))}
        </motion.div>

        
          <motion.section 
              className="mb-6 glass-card p-4"
              variants={flashesContainerVariants}
              initial="hidden"
              animate="visible"
          >
              <h2 className="text-lg font-headline bg-gradient-to-r from-accent-pink to-accent-green bg-clip-text text-transparent mb-2">Flashes</h2>
              <motion.div 
                className="flex gap-3 overflow-x-auto pb-2" 
                variants={flashesContainerVariants}
              >
                  <motion.button
                    variants={flashItemVariants}
                    className="w-20 h-20 shrink-0 rounded-full bg-gradient-to-tr from-gray-800 to-gray-700 border-4 border-dashed border-gray-600 flex flex-col items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-accent-green"
                    onClick={() => router.push('/create?type=flash')}
                    title="Create a Flash"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Plus className="text-gray-400 mb-1" />
                    <span className="text-xs text-gray-400">Add New</span>
                  </motion.button>
                {flashUsers.map((userFlashes: any) => {
                  const hasBeenViewed = viewedFlashes.includes(userFlashes.userId);
                  return (
                  <motion.button
                    key={userFlashes.userId}
                    variants={flashItemVariants}
                    className={`w-20 h-20 shrink-0 rounded-full bg-gradient-to-tr flex items-center justify-center overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-accent-green
                        ${hasBeenViewed ? 'border-4 border-gray-600' : 'from-accent-pink to-accent-green border-4 border-accent-green/40'}`}
                    onClick={() => setSelectedFlashUser(userFlashes)}
                    title={userFlashes.username || "Flash"}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {userFlashes.avatar_url ? (
                        <img src={userFlashes.avatar_url} alt="flash" className={`w-full h-full object-cover transition-opacity ${hasBeenViewed ? 'opacity-60' : ''}`} />
                    ) : (
                      <span className="text-2xl text-white">⚡</span>
                    )}
                  </motion.button>
                )})}
              </motion.div>
          </motion.section>
        

        <section className="flex-1 flex flex-col items-center mt-4">
            <motion.h2 
                className="text-xl font-headline self-start bg-gradient-to-r from-accent-pink to-accent-green bg-clip-text text-transparent mb-4 text-glow"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
            >
                VibeSpace
            </motion.h2>
            {loading ? (
              <VibeSpaceLoader />
            ) : (
              <div className="w-full max-w-xl flex flex-col gap-4">
                {canCreatePost && <CreatePostPrompt onGoLive={handleGoLive} />}
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
          className="relative inline-flex items-center justify-center bg-white/10 dark:bg-black/20 backdrop-blur-md border border-white/10 dark:border-black/20 w-12 h-12 rounded-full text-white hover:bg-gradient-to-tr hover:from-accent-purple hover:to-accent-cyan transition-all"
          title="Notifications"
          onClick={() => setShowNotifications(true)}
          aria-label="Notifications"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          variants={bellVariants}
          animate={hasUnreadNotifs ? "jiggle" : "initial"}
        >
          <Bell className="text-xl" />
          {hasUnreadNotifs && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-accent-pink rounded-full"></span>}
        </motion.button>
      </div>
      
      <Link href="/flix">
        <motion.button 
            className="fixed bottom-24 left-4 z-30 btn-glass-icon w-16 h-16 bg-gradient-to-tr from-accent-cyan to-accent-pink"
            aria-label="Flix Features"
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
        >
            <Compass size={32} />
        </motion.button>
      </Link>

      <AnimatePresence>
        {showMusicModal && <MusicDiscovery onClose={() => setShowMusicModal(false)} />}
        {selectedFlashUser && <FlashModal userFlashes={selectedFlashUser} onClose={() => handleFlashModalClose(selectedFlashUser?.userId)} />}
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
  );
}

    