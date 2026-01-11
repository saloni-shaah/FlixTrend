
"use client";
import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import dynamic from 'next/dynamic';
import { getFirestore, collection, query, orderBy, getDoc, doc, limit, startAfter, getDocs, where, Timestamp, onSnapshot, or } from "firebase/firestore";
import { Plus, Bell, Search, Mic, ArrowLeft, Users as UsersIcon, Brush, GraduationCap, Popcorn, Gamepad2 } from "lucide-react";
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
    { id: 'daily', name: 'Daily', icon: <UsersIcon />, sub: ['Vlogs', 'Moments', 'Travel', 'Self'] },
    { id: 'creative', name: 'Creative', icon: <Brush />, sub: ['Art', 'Photos', 'Design', 'Writing'] },
    { id: 'play', name: 'Play', icon: <Gamepad2 />, sub: ['Gaming', 'Challenges', 'Comedy', 'Reactions'] },
    { id: 'learn', name: 'Learn', icon: <GraduationCap />, sub: ['Tips', 'Tech', 'Study', 'Explainers'] },
    { id: 'culture', name: 'Culture', icon: <Popcorn />, sub: ['Music', 'Movies', 'Trends', 'Community'] },
];

function HomePageContent() {
  const [posts, setPosts] = useState<any[]>([]);
  const [flashes, setFlashes] = useState<any[]>([]);
  const [selectedFlashUser, setSelectedFlashUser] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSubCategory, setActiveSubCategory] = useState<string | null>(null);
  
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

    const fetchPosts = useCallback(async (category: string | null, subCategory: string | null, loadMore = false) => {
        if (loadMore && (!hasMore || loadingMore)) return;

        const isInitialLoad = !loadMore;
        if (isInitialLoad) {
            setLoading(true);
            setPosts([]);
            setLastVisible(null);
            setHasMore(true);
        } else {
            setLoadingMore(true);
        }

        const baseQuery = collection(db, "posts");
        let constraints: any[] = [orderBy("publishAt", "desc")];

        if (subCategory) {
            constraints.unshift(where("creatorType", "==", subCategory.toLowerCase()));
        } else if (category) {
            constraints.unshift(where("category", "==", category));
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

            setPosts(prev => loadMore ? [...prev, ...newPosts] : newPosts);
            setLastVisible(lastDoc);
            setHasMore(documentSnapshots.docs.length === POSTS_PER_PAGE);
        } catch (error) {
            console.error("Error fetching posts: ", error);
        } finally {
            if (isInitialLoad) setLoading(false);
            if (loadMore) setLoadingMore(false);
        }
    }, [hasMore, loadingMore, lastVisible]);


    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async user => {
            if (user) {
                setCurrentUser(user);
                const q = query(collection(db, "users", user.uid, "notifications"), where("read", "==", false));
                const unsubNotifs = onSnapshot(q, (snapshot) => setHasUnreadNotifs(!snapshot.empty));
                return () => unsubNotifs();
            } else {
                router.replace('/login'); 
            }
        });
        return () => unsubscribe();
    }, [router]); 

    useEffect(() => {
        if (currentUser) {
            fetchPosts(activeCategory, activeSubCategory);
        }
    }, [currentUser, activeCategory, activeSubCategory]);
    
    const fetchMorePosts = useCallback(() => {
        if (currentUser) {
            fetchPosts(activeCategory, activeSubCategory, true);
        }
    }, [currentUser, activeCategory, activeSubCategory, fetchPosts]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
                    fetchMorePosts();
                }
            },
            { threshold: 1.0 }
        );

        const currentRef = feedEndRef.current;
        if (currentRef) observer.observe(currentRef);
        return () => {
            if (currentRef) observer.unobserve(currentRef);
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
    
    const flashesContainerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 }}};
    const flashItemVariants = { hidden: { opacity: 0, scale: 0.5 }, visible: { opacity: 1, scale: 1 }};
    const categoryContainerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.3 }}};
    const categoryItemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 12 }}};

    const handleCategoryClick = (catId: string | null) => {
        setActiveCategory(catId);
        setActiveSubCategory(null);
    }

    const renderCategoryFilters = () => {
        const selectedCat = categories.find(c => c.id === activeCategory);
        
        if (selectedCat) {
            return (
                 <motion.div className="flex gap-2 overflow-x-auto pb-4 mb-4" variants={categoryContainerVariants} initial="hidden" animate="visible">
                    <motion.button variants={categoryItemVariants} onClick={() => handleCategoryClick(null)} className="btn-glass text-sm flex items-center gap-2 shrink-0">
                        <ArrowLeft /> All Categories
                    </motion.button>
                     {selectedCat.sub.map(sub => (
                        <motion.button
                            key={sub}
                            variants={categoryItemVariants}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setActiveSubCategory(sub)}
                            className={`btn-glass text-sm flex items-center gap-2 shrink-0 ${activeSubCategory === sub ? 'bg-accent-cyan text-black' : ''}`}
                        >
                            {sub}
                        </motion.button>
                    ))}
                </motion.div>
            )
        }
        
        return (
             <motion.div className="flex gap-2 overflow-x-auto pb-4 mb-4" variants={categoryContainerVariants} initial="hidden" animate="visible">
                 {categories.map(cat => (
                    <motion.button
                        key={cat.id}
                        variants={categoryItemVariants}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleCategoryClick(cat.id)}
                        className={`btn-glass text-sm flex items-center gap-2 shrink-0`}
                    >
                        {cat.icon} {cat.name}
                    </motion.button>
                ))}
            </motion.div>
        )
    };


    if (!currentUser) {
        return <VibeSpaceLoader />;
    }

    if (showWelcomeAnimation) {
        return <WelcomeAnimation onComplete={() => setShowWelcomeAnimation(false)} />;
    }

  return (
    <div className="flex flex-col w-full">
      <div className="w-full max-w-2xl mx-auto">
        <motion.div className="flex justify-center items-center mb-6 w-full" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className={`input-glass w-full flex items-center px-4 transition-all duration-300 ${isSearchFocused ? 'ring-2 ring-brand-saffron' : ''}`}>
                  <button className={`p-1 rounded-full transition-colors text-gray-400 hover:text-brand-gold`} aria-label="Voice search" disabled={true}>
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
                  />
                  <motion.div whileHover={{ scale: 1.1, rotate: 10 }}>
                    <button className="p-2 rounded-full text-brand-gold hover:bg-brand-gold/10">
                        <Search />
                    </button>
                  </motion.div>
              </div>
        </motion.div>

        {renderCategoryFilters()}
        
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
            <motion.h2 className="text-xl font-headline self-start bg-gradient-to-r from-accent-pink to-accent-green bg-clip-text text-transparent mb-4 text-glow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                VibeSpace
            </motion.h2>
            {loading ? (
              <VibeSpaceLoader />
            ) : (
              <div className="w-full max-w-xl flex flex-col gap-4">
                <CreatePostPrompt onGoLive={() => {}} />
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
                
                {!hasMore && !loadingMore && posts.length > 0 && (
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
        >
          <Bell className="text-xl" />
          {hasUnreadNotifs && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-accent-pink rounded-full"></span>}
        </motion.button>
      </div>
      

      <AnimatePresence>
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
