'use client';
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getFirestore, doc, getDoc, collection, query, where, getDocs, onSnapshot, orderBy } from "firebase/firestore";
import { auth, app } from "@/utils/firebaseClient";
import { PostCard } from "@/components/PostCard";
import { FollowButton } from "@/components/FollowButton";
import { Star, MapPin, User, Tag, ShieldCheck, Heart, CheckCircle, Trophy, Award, Sparkles, Users as UsersIcon, Edit2, AlignLeft, Image, BarChart3, Video, ArrowUp, ArrowDown, TrendingUp } from "lucide-react";
import { FollowListModal } from "@/components/FollowListModal";
import { AccoladeBadge } from "@/components/AccoladeBadge";
import { FullScreenImageViewer } from "@/components/FullScreenImageViewer";

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

export default function UserProfilePage() {
  const params = useParams();
  const uid = typeof params?.uid === 'string' ? params.uid : Array.isArray(params?.uid) ? params.uid[0] : null;
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [postTypeFilter, setPostTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [showFollowList, setShowFollowList] = useState<null | 'followers' | 'following'>(null);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setFirebaseUser(user);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!uid) {
        setLoading(false);
        return;
    }
    setLoading(true);

    const docRef = doc(db, "users", uid);
    const unsubProfile = onSnapshot(docRef, (docSnap) => {
        setProfile(docSnap.exists() ? { uid: docSnap.id, ...docSnap.data() } : null);
        setLoading(false);
    });

    const postsQuery = query(collection(db, "posts"), where("userId", "==", uid));
    const unsubPosts = onSnapshot(postsQuery, (snap) => {
        setUserPosts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    
    return () => {
        unsubProfile();
        unsubPosts();
    };
  }, [uid]);

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

  if (loading) {
    return <div className="flex flex-col min-h-screen items-center justify-center text-accent-cyan">Loading profile...</div>;
  }
  if (!profile) {
    return <div className="flex flex-col min-h-screen items-center justify-center text-red-400">User not found.</div>;
  }
  
  const initials = profile.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || profile.username?.slice(0, 2).toUpperCase() || "U";
  const isPremium = profile.isPremium && (!profile.premiumUntil || profile.premiumUntil.toDate() > new Date());
  const isDeveloper = Array.isArray(profile.role) && (profile.role.includes('developer') || profile.role.includes('founder'));
  const accolades = profile.accolades || [];
  const isOwnProfile = firebaseUser?.uid === uid;

  
  return (
    <>
    <div className="flex flex-col w-full pb-24">
      {showFollowList && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setShowFollowList(null)} />}
      <div className="relative h-40 md:h-60 w-full rounded-2xl overflow-hidden mb-8 glass-card cursor-pointer" onClick={() => setFullScreenImage(profile.banner_url)}>
        {profile.banner_url ? (
          <img
            src={profile.banner_url}
            alt="banner"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-accent-pink/40 to-accent-cyan/40" />
        )}
      </div>
      <div className="mx-auto w-full max-w-2xl glass-card p-6 -mt-24 flex flex-col items-center text-center">
        <div className="w-32 h-32 rounded-full bg-accent-cyan border-4 border-accent-pink shadow-fab-glow mb-4 overflow-hidden -mt-20 cursor-pointer" onClick={() => setFullScreenImage(profile.avatar_url)}>
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-5xl text-white flex items-center justify-center h-full w-full">{initials}</span>
          )}
        </div>
        <div className="flex items-center justify-center gap-2">
            <h2 className="text-2xl font-headline font-bold text-center">{profile.name}</h2>
             {isPremium && (
                <CheckCircle className="w-6 h-6 text-blue-500" title="Premium User"/>
            )}
             {isDeveloper && (
                <ShieldCheck className="w-6 h-6 text-accent-purple" title="FlixTrend Developer"/>
            )}
        </div>
        <p className="text-accent-cyan font-semibold mb-1 text-center">@{profile.username || "username"}</p>
        
        {accolades.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 my-4">
                {accolades.map((acc:string, i:number) => <AccoladeBadge key={i} type={acc} />)}
            </div>
        )}

        <div className="flex justify-center gap-8 my-4 w-full">
          <div className="text-center">
            <span className="font-bold text-lg text-accent-cyan">{profile.Posts_Count || 0}</span>
            <span className="text-xs text-gray-400 block">Posts</span>
          </div>
          <button className="text-center" onClick={() => setShowFollowList('followers')}>
            <span className="font-bold text-lg text-accent-cyan">{profile.Follower_Count || 0}</span>
            <span className="text-xs text-gray-400 block hover:underline">Followers</span>
          </button>
          <button className="text-center" onClick={() => setShowFollowList('following')}>
            <span className="font-bold text-lg text-accent-cyan">{profile.Following_Count || 0}</span>
            <span className="text-xs text-gray-400 block hover:underline">Following</span>
          </button>
        </div>

        <div className="mt-4 w-full max-w-lg">
            <p className="text-gray-400 text-center mb-4 text-sm">{profile.bio || "This user hasn't set a bio yet."}</p>
            <div className="flex justify-center flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500">
                {profile.location && <span className="flex items-center gap-1.5"><MapPin size={12}/> {profile.location}</span>}
                {profile.gender && <span className="flex items-center gap-1.5"><User size={12}/> {profile.gender}</span>}
                {profile.interests && <span className="flex items-center gap-1.5"><Tag size={12}/> {profile.interests}</span>}
            </div>
        </div>

        {!isOwnProfile && firebaseUser && (
          <div className="mt-6">
            <FollowButton profileUser={profile} currentUser={firebaseUser} />
          </div>
        )}
      </div>
      <div className="flex justify-center gap-4 my-8">
        <button className={`px-4 py-2 rounded-full font-bold transition-colors ${activeTab === "posts" ? "bg-accent-cyan text-black" : "bg-white/10 text-white"}`} onClick={() => setActiveTab("posts")}>Posts</button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center w-full">
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
              sortedAndFilteredPosts.map((post) => (
                <PostCard key={post.id} post={post} collectionName="posts"/>
              )))
             : (
            <div className="text-gray-400 text-center mt-16 flex flex-col items-center">
                <div className="text-4xl mb-4">📝</div>
                <div className="text-lg font-semibold mb-2">No Posts Yet</div>
                {isOwnProfile ? (
                    <>
                        <p className="text-sm mb-6">Your creative journey starts here. What will you share?</p>
                        <Link href="/create" className="btn btn-primary btn-cta">
                            Create Your First Post
                        </Link>
                    </>
                ) : (
                    <p className>Check back later to see what {profile.name} shares!</p>
                )}
            </div>
          )}
          </div>
        )}
      </div>
      {showFollowList && uid && firebaseUser && (
        <FollowListModal 
            userId={uid} 
            type={showFollowList} 
            onClose={() => setShowFollowList(null)}
            currentUser={firebaseUser}
        />
      )}
    </div>
    <FullScreenImageViewer imageUrl={fullScreenImage} onClose={() => setFullScreenImage(null)} />
    </>
  );
}
