'use client';
import React, { useEffect, useState, Suspense, useRef, useCallback } from "react";
import { auth, app } from "@/utils/firebaseClient";
import { getFirestore, doc, onSnapshot, collection, query, where, getDocs, orderBy, serverTimestamp, setDoc, limit, startAfter, OrderByDirection } from "firebase/firestore";
import { Cog, MapPin, User, Tag, ShieldCheck, CheckCircle, Users as UsersIcon, BarChart3, Home, Loader2, ChevronLeft, ChevronRight, AlignLeft, Image, Video, ArrowUp, ArrowDown, TrendingUp } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { PostCard } from "@/components/PostCard";
import { FollowListModal } from "@/components/FollowListModal";
import { CompleteProfileModal } from "@/components/squad/CompleteProfileModal";
import { EditProfileModal } from "@/components/squad/EditProfileModal";
import { UserPlaylists } from "@/components/squad/UserPlaylists";
import { AccoladeBadge } from "@/components/AccoladeBadge";
import { CreatePostPrompt } from "@/components/CreatePostPrompt";
import LikedPostsTab from "@/components/squad/LikedPostsTab";
import { FollowButton } from "@/components/FollowButton";
import { FullScreenImageViewer } from "@/components/FullScreenImageViewer";

const db = getFirestore(app);
const POSTS_PER_PAGE = 10;

const FlowIcon = ({ className }: { className?: string }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
            <linearGradient id="flowGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--accent-pink)" />
                <stop offset="100%" stopColor="var(--accent-cyan)" />
            </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="12" fill="url(#flowGradient)" className="group-hover:opacity-80 transition-opacity">
             <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
        </circle>
        <path d="M9.5 16V8L16.5 12L9.5 16Z" fill="white"/>
    </svg>
);

function SquadPageContent() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [showEdit, setShowEdit] = useState(false);
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'home');
  const [showFollowList, setShowFollowList] = useState<null | 'followers' | 'following' | 'friends'>(null);
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [isCreator, setIsCreator] = useState(false);
  const router = useRouter();

  // State for the new posts tab
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [postTypeFilter, setPostTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [postsLoading, setPostsLoading] = useState(true);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);

  const observer = useRef<IntersectionObserver>();
  const loadMoreRef = useCallback(node => {
    if (loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMorePosts && activeTab === 'posts') {
        fetchMorePosts();
      }
    });
    if (node) observer.current.observe(node);
  }, [loadingMore, hasMorePosts, activeTab]);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setFirebaseUser(user);
        const userDocRef = doc(db, "users", user.uid);
        const unsubProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setProfile({ uid: docSnap.id, ...data });
            if (data.accountType === 'creator') setIsCreator(true);
            if (data.profileComplete === false) setShowCompleteProfile(true);
          } else {
            const defaultUsername = user.email ? user.email.split('@')[0] : `user${user.uid.substring(0, 5)}`;
            setDoc(userDocRef, {
              uid: user.uid,
              name: user.displayName || "New User",
              username: defaultUsername,
              email: user.email || "",
              avatar_url: `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${user.uid}`,
              bio: "",
              interests: "",
              createdAt: serverTimestamp(),
              profileComplete: false,
            }).then(() => setShowCompleteProfile(true));
          }
        });

        setLoading(false);
        return () => unsubProfile();
      } else {
        setFirebaseUser(null);
        router.replace('/login');
      }
    });

    return () => unsubAuth();
  }, [router]);
  
  const uid = firebaseUser?.uid;

  // Fetching logic for posts tab
  useEffect(() => {
    if (activeTab === 'posts' && uid) {
      fetchInitialPosts();
    }
  }, [activeTab, uid, postTypeFilter, sortBy]);

  const getQuery = () => {
    let q = query(collection(db, "posts"), where("userId", "==", uid));

    if (postTypeFilter !== 'all') {
        if (postTypeFilter === 'flow') {
            q = query(q, where('isFlow', '==', true));
        } else if (postTypeFilter === 'image') {
            q = query(q, where('type', '==', 'media'), where('isVideo', '==', false));
        } else if (postTypeFilter === 'video') {
            q = query(q, where('type', '==', 'media'), where('isVideo', '==', true));
        } else {
            q = query(q, where('type', '==', postTypeFilter));
        }
    }

    let orderByField = 'createdAt';
    let orderByDirection: OrderByDirection = sortBy === 'oldest' ? 'asc' : 'desc';
    if (sortBy === 'popular') {
        orderByField = 'likesCount';
    }

    q = query(q, orderBy(orderByField, orderByDirection));
    return q;
  }

  const fetchInitialPosts = async () => {
    if (!uid) return;
    setPostsLoading(true);
    setUserPosts([]);
    setLastVisible(null);

    const q = getQuery();
    const finalQuery = query(q, limit(POSTS_PER_PAGE));

    try {
        const documentSnapshots = await getDocs(finalQuery);
        const posts = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUserPosts(posts);
        setLastVisible(documentSnapshots.docs[documentSnapshots.docs.length - 1]);
        setHasMorePosts(documentSnapshots.docs.length === POSTS_PER_PAGE);
    } catch (error) {
        console.error("Error fetching initial posts: ", error);
        setHasMorePosts(false);
    }
    setPostsLoading(false);
  }

  const fetchMorePosts = async () => {
    if (!uid || !lastVisible) return;
    setLoadingMore(true);

    const q = getQuery();
    const finalQuery = query(q, startAfter(lastVisible), limit(POSTS_PER_PAGE));

    try {
        const documentSnapshots = await getDocs(finalQuery);
        const newPosts = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUserPosts(prevPosts => [...prevPosts, ...newPosts]);
        setLastVisible(documentSnapshots.docs[documentSnapshots.docs.length - 1]);
        setHasMorePosts(documentSnapshots.docs.length === POSTS_PER_PAGE);
    } catch (error) {
        console.error("Error fetching more posts: ", error);
        setHasMorePosts(false);
    }

    setLoadingMore(false);
  }

  const handleCreatorStudioClick = async () => {
    if (!uid) return;
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/create-session-token', {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (!response.ok) throw new Error('Failed to create session token');

      const { customToken } = await response.json();
      window.open(`http://studio.flixtrend.in?token=${customToken}`, '_blank');
    } catch (error) {
      console.error("Error navigating to creator studio:", error);
    }
  };

  if (loading || !firebaseUser || !profile) {
    return <div className="flex flex-col min-h-screen items-center justify-center text-accent-cyan"><Loader2 className="animate-spin"/></div>;
  }

  const initials = profile.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || profile.username?.slice(0, 2).toUpperCase() || "U";
  const isPremium = profile.isPremium && (!profile.premiumUntil || profile.premiumUntil.toDate() > new Date());
  const isDeveloper = Array.isArray(profile.role) && (profile.role.includes('developer') || profile.role.includes('founder'));
  const accolades = profile.accolades || [];

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col w-full items-center pb-24">
          {isCreator && <motion.button onClick={handleCreatorStudioClick} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5 }} className="fixed top-4 right-4 z-30 btn-glass-icon bg-purple-500/50 text-white" aria-label="Creator Studio" whileHover={{ scale: 1.1, rotate: -15 }} whileTap={{ scale: 0.9 }}><BarChart3 /></motion.button>}
          {showFollowList && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setShowFollowList(null)} />}
          <Link href="/settings"><motion.button initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5 }} className="fixed bottom-24 right-4 z-30 btn-glass-icon" aria-label="Settings" whileHover={{ scale: 1.1, rotate: 15 }} whileTap={{ scale: 0.9 }}><Cog /></motion.button></Link>

          <motion.div 
            initial={{ y: -20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            className="relative h-60 md:h-72 w-full max-w-2xl rounded-2xl overflow-hidden mb-8 glass-card cursor-pointer group"
            onClick={() => profile.banner_url && setFullScreenImage(profile.banner_url)}
          >
              {profile.banner_url ? 
                  <img src={profile.banner_url} alt="banner" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" /> 
                  : <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-accent-pink/40 to-accent-cyan/40" />
              }
              <div className="absolute inset-0 w-full h-full bg-gradient-to-t from-black/60 via-transparent to-black/10" />
          </motion.div>
          <motion.div 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            transition={{ delay: 0.2 }} 
            className="relative mx-auto w-full max-w-2xl glass-card p-6 -mt-32 flex flex-col items-center text-center"
          >
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-glass absolute top-10 left-10" onClick={() => setShowEdit(true)}>Edit PF</motion.button>
              <motion.div 
                whileHover={{ scale: 1.1 }} 
                className="w-36 h-36 rounded-full bg-accent-cyan border-4 border-accent-pink shadow-fab-glow mb-4 overflow-hidden -mt-20 cursor-pointer translate-x-18"
                onClick={() => profile.avatar_url && setFullScreenImage(profile.avatar_url)}
              >
                {profile.avatar_url ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" /> : <span className="text-5xl text-white flex items-center justify-center h-full w-full">{initials}</span>}
              </motion.div>
              <div className="translate-x-19">
                  <div className="flex items-center justify-center gap-2">
                      <h2 className="text-2xl font-headline font-bold text-center">{profile.name}</h2>
                      {isDeveloper && <ShieldCheck className="w-6 h-6 text-accent-purple" title="FlixTrend Developer" />}
                      {isPremium && <CheckCircle className="w-6 h-6 text-blue-500" title="Premium User" />}
                  </div>
                  <p className="text-accent-cyan font-semibold mb-1 text-center">@{profile.username || "username"}</p>
              </div>
              {accolades.length > 0 && <div className="flex flex-wrap items-center justify-center gap-2 my-4">{accolades.map(type => <AccoladeBadge key={type} type={type} />)}</div>}
              <div className="flex justify-center gap-8 my-4 w-full">
                  <div className="text-center"><span className="font-bold text-lg text-accent-cyan">{profile.Posts_Count || 0}</span><span className="text-xs text-gray-400 block">Posts</span></div>
                  <button className="text-center" onClick={() => setShowFollowList('followers')}><span className="font-bold text-lg text-accent-cyan">{profile.Follower_Count || 0}</span><span className="text-xs text-gray-400 block hover:underline">Followers</span></button>
                  <button className="text-center" onClick={() => setShowFollowList('following')}><span className="font-bold text-lg text-accent-cyan">{profile.Following_Count || 0}</span><span className="text-xs text-gray-400 block hover:underline">Following</span></button>
              </div>
              <div className="mt-4 w-full max-w-lg">
                  <p className="text-gray-400 text-center mb-4 text-sm">{profile.bio || "This user hasn't set a bio yet."}</p>
                  <div className="flex justify-center flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500">
                      {profile.location && <span className="flex items-center gap-1.5"><MapPin size={12} /> {profile.location}</span>}
                      {profile.gender && <span className="flex items-center gap-1.5"><User size={12} /> {profile.gender}</span>}
                      {profile.interests && <span className="flex items-center gap-1.5"><Tag size={12} /> {profile.interests}</span>}
                  </div>
              </div>
          </motion.div>

          {['home', 'posts', 'likes', 'playlists'].includes(activeTab) && firebaseUser && profile && firebaseUser.uid === profile.uid && <div className="w-full max-w-xl mt-8"><CreatePostPrompt /></div>}

          <div className="flex justify-center gap-2 md:gap-4 my-8 flex-wrap">
              <button className={`px-4 py-2 rounded-full font-bold transition-colors ${activeTab === "home" ? "bg-accent-cyan text-black" : "bg-white/10 text-white"}`} onClick={() => setActiveTab("home")}><Home className="inline-block mr-2" size={16}/>Home</button>
              <button className={`px-4 py-2 rounded-full font-bold transition-colors ${activeTab === "posts" ? "bg-accent-cyan text-black" : "bg-white/10 text-white"}`} onClick={() => setActiveTab("posts")}>My Posts</button>
              <button className={`px-4 py-2 rounded-full font-bold transition-colors ${activeTab === "likes" ? "bg-accent-cyan text-black" : "bg-white/10 text-white"}`} onClick={() => setActiveTab("likes")}>Likes</button>
              <button className={`px-4 py-2 rounded-full font-bold transition-colors ${activeTab === "playlists" ? "bg-accent-cyan text-black" : "bg-white/10 text-white"}`} onClick={() => setActiveTab("playlists")}>Playlists</button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center w-full min-h-[400px]">
              {activeTab === "home" && <HomeFeed user={firebaseUser} />}
              {activeTab === "posts" && (
                <div className="w-full max-w-xl flex flex-col gap-6">
                    <div className="flex justify-center gap-2 p-1 rounded-full bg-black/30">
                        <button onClick={() => { setPostTypeFilter('all'); setSortBy('latest'); }} className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${postTypeFilter === 'all' ? 'bg-white/10 text-white' : 'text-gray-400'}`}>All</button>
                        <button onClick={() => { setPostTypeFilter('text'); setSortBy('latest'); }} className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${postTypeFilter === 'text' ? 'bg-white/10 text-white' : 'text-gray-400'}`}><AlignLeft size={14} className="inline" /></button>
                        <button onClick={() => { setPostTypeFilter('image'); setSortBy('latest'); }} className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${postTypeFilter === 'image' ? 'bg-white/10 text-white' : 'text-gray-400'}`}><Image size={14} className="inline" /></button>
                        <button onClick={() => { setPostTypeFilter('video'); setSortBy('latest'); }} className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${postTypeFilter === 'video' ? 'bg-white/10 text-white' : 'text-gray-400'}`}><Video size={14} className="inline" /></button>
                        <button onClick={() => { setPostTypeFilter('poll'); setSortBy('latest'); }} className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${postTypeFilter === 'poll' ? 'bg-white/10 text-white' : 'text-gray-400'}`}><BarChart3 size={14} className="inline" /></button>
                        <button onClick={() => { setPostTypeFilter('flow'); setSortBy('latest'); }} className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${postTypeFilter === 'flow' ? 'bg-white/10 text-white' : 'text-gray-400'}`}><FlowIcon className="w-4 h-4 inline" /></button>
                    </div>

                    {postTypeFilter !== 'all' && (
                        <div className="flex justify-center gap-2 p-1 rounded-full bg-black/20 text-xs">
                            <button onClick={() => setSortBy('latest')} className={`px-3 py-1 rounded-full font-bold transition-colors flex items-center gap-1 ${sortBy === 'latest' ? 'bg-accent-cyan/20 text-accent-cyan' : 'text-gray-400'}`}><ArrowUp size={12}/>Latest</button>
                            <button onClick={() => setSortBy('oldest')} className={`px-3 py-1 rounded-full font-bold transition-colors flex items-center gap-1 ${sortBy === 'oldest' ? 'bg-accent-cyan/20 text-accent-cyan' : 'text-gray-400'}`}><ArrowDown size={12}/>Oldest</button>
                            <button onClick={() => setSortBy('popular')} className={`px-3 py-1 rounded-full font-bold transition-colors flex items-center gap-1 ${sortBy === 'popular' ? 'bg-accent-cyan/20 text-accent-cyan' : 'text-gray-400'}`}><TrendingUp size={12}/>Popular</button>
                        </div>
                    )}
                    
                    {postsLoading ? <div className="flex justify-center mt-20"><Loader2 className="animate-spin"/></div> :
                      userPosts.length > 0 ? (
                        userPosts.map((post, index) => {
                          if (userPosts.length === index + 1) {
                              return <div ref={loadMoreRef} key={post.id}><PostCard post={post} collectionName="posts"/></div>
                          }
                          return <PostCard key={post.id} post={post} collectionName="posts"/>
                        }))
                      : (
                        <div className="text-gray-400 text-center mt-16 flex flex-col items-center">
                          <div className="text-4xl mb-4">📝</div>
                          <div className="text-lg font-semibold mb-2">No Posts Yet</div>
                          <p className="text-sm mb-6">Your creative journey starts here. What will you share?</p>
                          <Link href="/create" className="btn btn-primary btn-cta">Create Your First Post</Link>
                        </div>
                      )
                    }
                    {loadingMore && <div className="text-center text-accent-cyan py-4">Loading more posts...</div>}
                    {!hasMorePosts && userPosts.length > 0 && <div className="text-center text-gray-500 py-4">You've reached the end!</div>}
                </div>
              )}
              {activeTab === "likes" && firebaseUser && <LikedPostsTab userId={firebaseUser.uid} />}
              {activeTab === "playlists" && firebaseUser && <UserPlaylists userId={firebaseUser.uid} />}
          </div>

          {showCompleteProfile && profile && <CompleteProfileModal profile={profile} onClose={() => setShowCompleteProfile(false)} />}
          {showEdit && <EditProfileModal profile={profile} onClose={() => setShowEdit(false)} />}
          {showFollowList && firebaseUser && (
              <FollowListModal
              userId={firebaseUser.uid}
              type={showFollowList}
              onClose={() => setShowFollowList(null)}
              currentUser={firebaseUser}
              />
          )}
      </motion.div>
      <FullScreenImageViewer imageUrl={fullScreenImage} onClose={() => setFullScreenImage(null)} />
    </>
  );
}

const CreatorSuggestions = ({ creators, title, currentUser }: { creators: any[], title: string, currentUser: any }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const handleScroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = scrollContainerRef.current.offsetWidth * 0.8;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    if (creators.length === 0) {
        return null;
    }

    return (
        <motion.div className="my-8 w-full glass-card p-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-accent-cyan">{title}</h3>
                <div className="flex gap-2">
                    <button onClick={() => handleScroll('left')} className="p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors"><ChevronLeft size={16}/></button>
                    <button onClick={() => handleScroll('right')} className="p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors"><ChevronRight size={16}/></button>
                </div>
            </div>
            <div ref={scrollContainerRef} className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide">
                {creators.map(creator => (
                     <motion.div
                        key={creator.id}
                        whileHover={{ y: -5 }}
                        className="bg-white/5 p-4 rounded-lg flex flex-col text-center flex-shrink-0 w-48"
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                        >
                        <Link href={`/squad/${creator.id}`} className="flex flex-col items-center flex-grow">
                            <img src={creator.avatar_url} alt={creator.name} className="w-20 h-20 rounded-full object-cover mb-3"/>
                            <h4 className="font-bold text-md truncate w-full">{creator.name}</h4>
                            <p className="text-xs text-accent-cyan/80">@{creator.username}</p>
                            <p className="text-xs text-gray-400 mt-2 line-clamp-2 flex-grow min-h-[40px] w-full">{creator.bio || ''}</p>
                        </Link>
                        <div className="mt-4 w-full">
                           <FollowButton profileUser={creator} currentUser={currentUser} />
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

const HomeFeed = ({ user }: { user: any }) => {
    const [posts, setPosts] = useState<any[]>([]);
    const [creators, setCreators] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const userId = user?.uid;

    useEffect(() => {
        if (!userId) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                const followingRef = collection(db, 'users', userId, 'following');
                const followingSnap = await getDocs(followingRef);
                const followingIds = followingSnap.docs.map(doc => doc.id);

                const postsPromise = followingIds.length > 0 ? getDocs(query(
                    collection(db, 'posts'), 
                    where('userId', 'in', followingIds),
                    orderBy('createdAt', 'desc'),
                    limit(25)
                )) : Promise.resolve({ docs: [] });

                const creatorsPromise = getDocs(query(
                    collection(db, 'users'),
                    where('accountType', '==', 'creator'),
                    limit(40)
                ));
                
                const [postsSnapshot, creatorsSnapshot] = await Promise.all([postsPromise, creatorsPromise]);

                const fetchedPosts = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setPosts(fetchedPosts);

                const excludedIds = [...followingIds, userId];
                const fetchedCreators = creatorsSnapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(creator => !excludedIds.includes(creator.id))
                    .slice(0, 20);
                
                setCreators(fetchedCreators);

            } catch (error) {
                console.error("Error fetching home feed:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userId]);
    
    const posts1 = posts.slice(0, 3);
    const creators1 = creators.slice(0, 4);
    const posts2 = posts.slice(3, 7);
    const creators2 = creators.slice(4, 8);
    const posts3 = posts.slice(7, 12);
    const creators3 = creators.slice(8, 12);
    const posts4 = posts.slice(12, 18);
    const creators4 = creators.slice(12, 16);
    const posts5 = posts.slice(18, 25);
    const creators5 = creators.slice(16, 20);

    if (loading) return <div className="flex justify-center mt-20"><Loader2 className="animate-spin"/></div>;

    const hasContent = posts.length > 0 || creators.length > 0;

    return (
        <div className="w-full max-w-xl flex flex-col gap-6">
            {!hasContent && !loading ? (
                 <div className="text-center text-gray-400 mt-20 p-8 bg-white/5 rounded-2xl">
                    <UsersIcon size={48} className="mx-auto mb-4 text-accent-cyan"/>
                    <h3 className="text-xl font-bold">Your feed is quiet</h3>
                    <p className="mt-2">Follow creators to see their latest posts here or find new creators to follow.</p>
                </div>
            ) : (
                <>
                    {posts1.map(post => <PostCard key={post.id} post={post} collectionName="posts" />)}
                    <CreatorSuggestions creators={creators1} title="Suggested Creators" currentUser={user} />
                    
                    {posts2.map(post => <PostCard key={post.id} post={post} collectionName="posts" />)}
                    <CreatorSuggestions creators={creators2} title="More Creators" currentUser={user} />

                    {posts3.map(post => <PostCard key={post.id} post={post} collectionName="posts" />)}
                    <CreatorSuggestions creators={creators3} title="Keep Exploring" currentUser={user} />

                    {posts4.map(post => <PostCard key={post.id} post={post} collectionName="posts" />)}
                    <CreatorSuggestions creators={creators4} title="Discover More" currentUser={user} />

                    {posts5.map(post => <PostCard key={post.id} post={post} collectionName="posts" />)}
                    <CreatorSuggestions creators={creators5} title="Top Picks for You" currentUser={user} />

                    <div className="text-center mt-8">
                        <Link href="/squad/explore" className="btn-glass text-accent-cyan font-bold py-3 px-6 rounded-lg">
                            Explore More Creators
                        </Link>
                    </div>
                </>
            )}
        </div>
    );
};

export default function SquadPage() {
  return (
    <Suspense fallback={<div className="flex flex-col min-h-screen items-center justify-center text-accent-cyan"><Loader2 className="animate-spin"/></div>}>
      <SquadPageContent />
    </Suspense>
  );
}
