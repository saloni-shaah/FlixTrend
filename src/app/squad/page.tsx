'use client';
import React, { useEffect, useState, Suspense } from "react";
import { auth, app } from "@/utils/firebaseClient";
import { getFirestore, doc, onSnapshot, collection, query, where, getDocs, orderBy, serverTimestamp, setDoc, limit } from "firebase/firestore";
import { Cog, MapPin, User, Tag, ShieldCheck, Heart, CheckCircle, Users as UsersIcon, Image, BarChart3, AlignLeft, Video, ArrowUp, ArrowDown, TrendingUp, Home, Compass, Loader2 } from "lucide-react";
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

const db = getFirestore(app);

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
  const [postCount, setPostCount] = useState(0);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [friends, setFriends] = useState(0);
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'home');
  const [postTypeFilter, setPostTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [showFollowList, setShowFollowList] = useState<null | 'followers' | 'following' | 'friends'>(null);
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const router = useRouter();

  const handleCreatorStudioClick = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const idToken = await user.getIdToken();
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

  useEffect(() => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;
    const postsQuery = query(collection(db, "posts"), where("userId", "==", uid));
    const unsubPosts = onSnapshot(postsQuery, (snapshot) => {
      setUserPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setPostCount(snapshot.size);
    });

    const unsubFollowers = onSnapshot(collection(db, "users", uid, "followers"), snap => setFollowers(snap.size));
    const unsubFollowing = onSnapshot(collection(db, "users", uid, "following"), snap => setFollowing(snap.size));

    const fetchFriends = async () => {
      const followersSnap = await getDocs(collection(db, "users", uid, "followers"));
      const followingSnap = await getDocs(collection(db, "users", uid, "following"));
      const followerIds = followersSnap.docs.map(d => d.id);
      const followingIds = followingSnap.docs.map(d => d.id);
      const friendsIds = followerIds.filter(id => followingIds.includes(id));
      setFriends(friendsIds.length);
    };
    fetchFriends();

    return () => {
      unsubPosts();
      unsubFollowers();
      unsubFollowing();
    };
  }, [firebaseUser]);

  const sortedAndFilteredPosts = userPosts
    .filter(post => {
        const postToCheck = post.type === 'relay' ? post.originalPost : post;
        if (!postToCheck) return false;
        switch (postTypeFilter) {
            case 'all': return true;
            case 'text': return postToCheck.type === 'text';
            case 'image': return postToCheck.type === 'media' && !postToCheck.isVideo;
            case 'video': return postToCheck.type === 'media' && postToCheck.isVideo;
            case 'poll': return postToCheck.type === 'poll';
            case 'flow': return postToCheck.isFlow === true;
            default: return true;
        }
    })
    .sort((a, b) => {
        const postA = a.type === 'relay' ? a.originalPost : a;
        const postB = b.type === 'relay' ? b.originalPost : b;

        switch (sortBy) {
            case 'latest':
                return (postB.createdAt?.toDate() || 0) - (postA.createdAt?.toDate() || 0);
            case 'oldest':
                return (postA.createdAt?.toDate() || 0) - (postB.createdAt?.toDate() || 0);
            case 'popular':
                return (postB.likes?.length || 0) - (postA.likes?.length || 0);
            default:
                return 0;
        }
    });

  if (loading || !firebaseUser || !profile) {
    return <div className="flex flex-col min-h-screen items-center justify-center text-accent-cyan"><Loader2 className="animate-spin"/></div>;
  }

  const initials = profile.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || profile.username?.slice(0, 2).toUpperCase() || "U";
  const isPremium = profile.isPremium && (!profile.premiumUntil || profile.premiumUntil.toDate() > new Date());
  const isDeveloper = Array.isArray(profile.role) && (profile.role.includes('developer') || profile.role.includes('founder'));
  const accolades = profile.accolades || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col w-full items-center pb-24">
        {isCreator && <motion.button onClick={handleCreatorStudioClick} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5 }} className="fixed top-4 right-4 z-30 btn-glass-icon bg-purple-500/50 text-white" aria-label="Creator Studio" whileHover={{ scale: 1.1, rotate: -15 }} whileTap={{ scale: 0.9 }}><BarChart3 /></motion.button>}
        {showFollowList && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setShowFollowList(null)} />}
        <Link href="/settings"><motion.button initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5 }} className="fixed bottom-24 right-4 z-30 btn-glass-icon" aria-label="Settings" whileHover={{ scale: 1.1, rotate: 15 }} whileTap={{ scale: 0.9 }}><Cog /></motion.button></Link>

        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative h-40 md:h-60 w-full max-w-2xl rounded-2xl overflow-hidden mb-8 glass-card">
            {profile.banner_url ? <img src={profile.banner_url} alt="banner" className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-accent-pink/40 to-accent-cyan/40" />}
        </motion.div>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="mx-auto w-full max-w-2xl glass-card p-6 -mt-24 flex flex-col items-center text-center">
            <motion.div whileHover={{ scale: 1.1 }} className="w-32 h-32 rounded-full bg-accent-cyan border-4 border-accent-pink shadow-fab-glow mb-4 overflow-hidden -mt-20">
            {profile.avatar_url ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" /> : <span className="text-5xl text-white flex items-center justify-center h-full w-full">{initials}</span>}
            </motion.div>
            <div className="flex items-center justify-center gap-2">
                <h2 className="text-2xl font-headline font-bold text-center">{profile.name}</h2>
                {isDeveloper && <ShieldCheck className="w-6 h-6 text-accent-purple" title="FlixTrend Developer" />}
                {isPremium && <CheckCircle className="w-6 h-6 text-blue-500" title="Premium User" />}
            </div>
            <p className="text-accent-cyan font-semibold mb-1 text-center">@{profile.username || "username"}</p>
            {accolades.length > 0 && <div className="flex flex-wrap items-center justify-center gap-2 my-4">{accolades.map(type => <AccoladeBadge key={type} type={type} />)}</div>}
            <div className="flex justify-center gap-8 my-4 w-full">
                <div className="text-center"><span className="font-bold text-lg text-accent-cyan">{postCount}</span><span className="text-xs text-gray-400 block">Posts</span></div>
                <button className="text-center" onClick={() => setShowFollowList('followers')}><span className="font-bold text-lg text-accent-cyan">{followers}</span><span className="text-xs text-gray-400 block hover:underline">Followers</span></button>
                <button className="text-center" onClick={() => setShowFollowList('following')}><span className="font-bold text-lg text-accent-cyan">{following}</span><span className="text-xs text-gray-400 block hover:underline">Following</span></button>
                <button className="text-center" onClick={() => setShowFollowList('friends')}><span className="font-bold text-lg text-accent-cyan">{friends}</span><span className="text-xs text-gray-400 block hover:underline">Friends</span></button>
            </div>
            <div className="mt-4 w-full max-w-lg">
                <p className="text-gray-400 text-center mb-4 text-sm">{profile.bio || "This user hasn't set a bio yet."}</p>
                <div className="flex justify-center flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500">
                    {profile.location && <span className="flex items-center gap-1.5"><MapPin size={12} /> {profile.location}</span>}
                    {profile.gender && <span className="flex items-center gap-1.5"><User size={12} /> {profile.gender}</span>}
                    {profile.interests && <span className="flex items-center gap-1.5"><Tag size={12} /> {profile.interests}</span>}
                </div>
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-glass mt-6" onClick={() => setShowEdit(true)}>Edit Profile</motion.button>
        </motion.div>

        {activeTab === 'posts' && firebaseUser && firebaseUser.uid === profile.uid && <div className="w-full max-w-xl mt-8"><CreatePostPrompt /></div>}

        <div className="flex justify-center gap-2 md:gap-4 my-8 flex-wrap">
            <button className={`px-4 py-2 rounded-full font-bold transition-colors ${activeTab === "home" ? "bg-accent-cyan text-black" : "bg-white/10 text-white"}`} onClick={() => setActiveTab("home")}><Home className="inline-block mr-2" size={16}/>Home</button>
            <button className={`px-4 py-2 rounded-full font-bold transition-colors ${activeTab === "explore" ? "bg-accent-cyan text-black" : "bg-white/10 text-white"}`} onClick={() => setActiveTab("explore")}><Compass className="inline-block mr-2" size={16}/>Explore</button>
            <button className={`px-4 py-2 rounded-full font-bold transition-colors ${activeTab === "posts" ? "bg-accent-cyan text-black" : "bg-white/10 text-white"}`} onClick={() => setActiveTab("posts")}>My Posts</button>
            <button className={`px-4 py-2 rounded-full font-bold transition-colors ${activeTab === "likes" ? "bg-accent-cyan text-black" : "bg-white/10 text-white"}`} onClick={() => setActiveTab("likes")}>Likes</button>
            <button className={`px-4 py-2 rounded-full font-bold transition-colors ${activeTab === "playlists" ? "bg-accent-cyan text-black" : "bg-white/10 text-white"}`} onClick={() => setActiveTab("playlists")}>Playlists</button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center w-full min-h-[400px]">
            {activeTab === "home" && <HomeFeed userId={firebaseUser.uid} />}
            {activeTab === "explore" && <ExploreCreators userId={firebaseUser.uid} />}
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
                        {['text', 'image', 'poll'].includes(postTypeFilter) && (
                            <>
                                <button onClick={() => setSortBy('latest')} className={`px-3 py-1 rounded-full font-bold transition-colors flex items-center gap-1 ${sortBy === 'latest' ? 'bg-accent-cyan/20 text-accent-cyan' : 'text-gray-400'}`}><ArrowUp size={12}/>Latest</button>
                                <button onClick={() => setSortBy('oldest')} className={`px-3 py-1 rounded-full font-bold transition-colors flex items-center gap-1 ${sortBy === 'oldest' ? 'bg-accent-cyan/20 text-accent-cyan' : 'text-gray-400'}`}><ArrowDown size={12}/>Oldest</button>
                            </>
                        )}
                        {['video', 'flow'].includes(postTypeFilter) && (
                            <>
                                <button onClick={() => setSortBy('latest')} className={`px-3 py-1 rounded-full font-bold transition-colors flex items-center gap-1 ${sortBy === 'latest' ? 'bg-accent-cyan/20 text-accent-cyan' : 'text-gray-400'}`}><ArrowUp size={12}/>Latest</button>
                                <button onClick={() => setSortBy('oldest')} className={`px-3 py-1 rounded-full font-bold transition-colors flex items-center gap-1 ${sortBy === 'oldest' ? 'bg-accent-cyan/20 text-accent-cyan' : 'text-gray-400'}`}><ArrowDown size={12}/>Oldest</button>
                                <button onClick={() => setSortBy('popular')} className={`px-3 py-1 rounded-full font-bold transition-colors flex items-center gap-1 ${sortBy === 'popular' ? 'bg-accent-cyan/20 text-accent-cyan' : 'text-gray-400'}`}><TrendingUp size={12}/>Popular</button>
                            </>
                        )}
                    </div>
                )}

                {sortedAndFilteredPosts.length > 0 ? (
                sortedAndFilteredPosts.map((post) => <PostCard key={post.id} post={post} collectionName="posts" />)
                ) : (
                <div className="text-gray-400 text-center mt-16">
                    <div className="text-4xl mb-2">🪐</div>
                    <div className="text-lg font-semibold">No posts of this type yet.</div>
                </div>
                )}
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
  );
}

const HomeFeed = ({ userId }: { userId: string }) => {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [followingIds, setFollowingIds] = useState<string[]>([]);

    useEffect(() => {
        const followingRef = collection(db, 'users', userId, 'following');
        const unsub = onSnapshot(followingRef, (snap) => {
            const ids = snap.docs.map(doc => doc.id);
            setFollowingIds(ids);
        });
        return () => unsub();
    }, [userId]);

    useEffect(() => {
        if (followingIds.length === 0) {
            setLoading(false);
            setPosts([]);
            return;
        }

        setLoading(true);
        const postsQuery = query(
            collection(db, 'posts'), 
            where('userId', 'in', followingIds),
            orderBy('createdAt', 'desc'),
            limit(50)
        );

        const unsub = onSnapshot(postsQuery, (snap) => {
            setPosts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });

        return () => unsub();
    }, [followingIds]);

    if (loading) return <div className="flex justify-center mt-20"><Loader2 className="animate-spin"/></div>

    return (
        <div className="w-full max-w-xl flex flex-col gap-6">
            {posts.length > 0 ? (
                posts.map(post => <PostCard key={post.id} post={post} collectionName="posts" />)
            ) : (
                <div className="text-center text-gray-400 mt-20 p-8 bg-white/5 rounded-2xl">
                    <UsersIcon size={48} className="mx-auto mb-4 text-accent-cyan"/>
                    <h3 className="text-xl font-bold">Your feed is quiet</h3>
                    <p className="mt-2">Follow creators to see their latest posts here. Start by checking out the Explore tab!</p>
                </div>
            )}
        </div>
    )
};

const ExploreCreators = ({ userId }: { userId: string }) => {
    const [creators, setCreators] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCreators = async () => {
            setLoading(true);
            const followingRef = collection(db, 'users', userId, 'following');
            const followingSnap = await getDocs(followingRef);
            const followingIds = followingSnap.docs.map(doc => doc.id);
            const excludedIds = [...followingIds, userId];

            let creatorsQuery = query(
                collection(db, 'users'),
                where('accountType', '==', 'creator'),
                limit(20)
            );

            const querySnapshot = await getDocs(creatorsQuery);
            const fetchedCreators = querySnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(creator => !excludedIds.includes(creator.id));
            
            setCreators(fetchedCreators);
            setLoading(false);
        };
        fetchCreators();
    }, [userId]);

    if (loading) return <div className="flex justify-center mt-20"><Loader2 className="animate-spin"/></div>

    return (
        <div className="w-full max-w-xl grid grid-cols-2 md:grid-cols-3 gap-4">
            {creators.map(creator => (
                <Link href={`/squad/${creator.id}`} key={creator.id}>
                    <motion.div 
                        whileHover={{ scale: 1.05 }} 
                        className="bg-white/10 p-4 rounded-lg text-center flex flex-col items-center aspect-square justify-center">
                        <img src={creator.avatar_url} alt={creator.name} className="w-20 h-20 rounded-full object-cover mb-3"/>
                        <h4 className="font-bold text-md truncate">{creator.name}</h4>
                        <p className="text-xs text-accent-cyan">@{creator.username}</p>
                    </motion.div>
                </Link>
            ))}
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
