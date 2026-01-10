"use client";
import React, { useEffect, useState, useRef, Suspense } from "react";
import { auth, app } from "@/utils/firebaseClient";
import { getFirestore, doc, onSnapshot, collection, query, where, getCountFromServer, getDocs, orderBy, writeBatch, deleteDoc, arrayUnion, arrayRemove, serverTimestamp, setDoc } from "firebase/firestore";
import { Cog, Compass, MapPin, User, Tag, ShieldCheck, Music, Bookmark, Heart, Folder, Download, CheckCircle, Search, Users as UsersIcon, Phone, Trophy, Award, Sparkles, Image, BarChart3, AlignLeft, Radio, Zap } from "lucide-react";
import { signOut } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { PostCard } from "@/components/PostCard";
import { FollowListModal } from "@/components/FollowListModal";
import { CompleteProfileModal } from "@/components/squad/CompleteProfileModal";
import { EditProfileModal } from "@/components/squad/EditProfileModal";
import { UserPlaylists } from "@/components/squad/UserPlaylists";
import { UserCollections } from "@/components/squad/UserCollections";
import { UserDownloads } from "@/components/squad/UserDownloads";
import { AccoladeBadge } from "@/components/AccoladeBadge";


const db = getFirestore(app);

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
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'posts');
  const [postTypeFilter, setPostTypeFilter] = useState('all');
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [starredPosts, setStarredPosts] = useState<any[]>([]);
  const [showFollowList, setShowFollowList] = useState<null | 'followers' | 'following' | 'friends'>(null);
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);
  const router = useRouter();


  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setFirebaseUser(user);
        const userDocRef = doc(db, "users", user.uid);
        const unsubProfile = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setProfile({ uid: docSnap.id, ...data });
                // Only show the completion modal if the flag is explicitly false.
                if (data.profileComplete === false) {
                   setShowCompleteProfile(true);
                }
            } else {
                // If the user doc doesn't exist, we should create it and prompt for completion.
                const defaultUsername = user.email ? user.email.split('@')[0] : `user${user.uid.substring(0,5)}`;
                setDoc(userDocRef, {
                    uid: user.uid,
                    name: user.displayName || "New User",
                    username: defaultUsername,
                    email: user.email || "",
                    avatar_url: `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${user.uid}`,
                    bio: "",
                    interests: "",
                    createdAt: serverTimestamp(),
                    profileComplete: false, // Set to false to trigger the modal
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

    const postsQuery = query(collection(db, "posts"), where("userId", "==", uid), orderBy("createdAt", "desc"));
    const unsubPosts = onSnapshot(postsQuery, (snapshot) => {
        setUserPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setPostCount(snapshot.size);
    });
    
    const unsubFollowers = onSnapshot(collection(db, "users", uid, "followers"), snap => setFollowers(snap.size));
    const unsubFollowing = onSnapshot(collection(db, "users", uid, "following"), snap => setFollowing(snap.size));
    
    const q = query(collection(db, "users", uid, "starredPosts"), orderBy("starredAt", "desc"));
    const unsubStarred = onSnapshot(q, (snapshot) => {
        setStarredPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const fetchFriends = async () => {
        const followersSnap = await getDocs(collection(db, "users", uid, "followers"));
        const followingSnap = await getDocs(collection(db, "users", uid, "following"));
        const followerIds = followersSnap.docs.map(d => d.id);
        const followingIds = followingSnap.docs.map(d => d.id);
        const friendsIds = followerIds.filter(id => followingIds.includes(id));
        setFriends(friendsIds.length);
    }
    fetchFriends();

    return () => {
      unsubPosts();
      unsubFollowers();
      unsubFollowing();
      unsubStarred();
    };
  }, [firebaseUser]);
  
  const filteredUserPosts = userPosts.filter(post => {
      if (postTypeFilter === 'all') return true;
      return post.type === postTypeFilter;
  });


  if (loading) {
    return <div className="flex flex-col min-h-screen items-center justify-center text-accent-cyan">Loading profile...</div>;
  }
  if (!firebaseUser || !profile) {
    return <div className="flex flex-col items-center justify-center text-red-400">Not logged in or profile not found.</div>;
  }
  
  const initials = profile.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || profile.username?.slice(0, 2).toUpperCase() || "U";
  const isPremium = profile.isPremium && (!profile.premiumUntil || profile.premiumUntil.toDate() > new Date());
  const isDeveloper = Array.isArray(profile.role) && (profile.role.includes('developer') || profile.role.includes('founder'));
  const accolades = profile.accolades || [];


  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col w-full pb-24">
        {showFollowList && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setShowFollowList(null)} />}
        <Link href="/settings">
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="fixed bottom-24 right-4 z-30 btn-glass-icon"
              aria-label="Settings"
              whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
            >
              <Cog />
            </motion.button>
        </Link>
      {/* Banner */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative h-40 md:h-60 w-full rounded-2xl overflow-hidden mb-8 glass-card">
        {profile.banner_url ? (
          <img
            src={profile.banner_url}
            alt="banner"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-accent-pink/40 to-accent-cyan/40" />
        )}
      </motion.div>
      {/* Profile Card */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mx-auto w-full max-w-2xl glass-card p-6 -mt-24 flex flex-col items-center text-center">
        <motion.div 
          whileHover={{ scale: 1.1 }}
          className="w-32 h-32 rounded-full bg-accent-cyan border-4 border-accent-pink shadow-fab-glow mb-4 overflow-hidden -mt-20">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-5xl text-white flex items-center justify-center h-full w-full">{initials}</span>
          )}
        </motion.div>
        <div className="flex items-center justify-center gap-2">
            <h2 className="text-2xl font-headline font-bold text-center">{profile.name}</h2>
            {isDeveloper && (
                <ShieldCheck className="w-6 h-6 text-accent-purple" title="FlixTrend Developer"/>
            )}
             {isPremium && (
                <CheckCircle className="w-6 h-6 text-blue-500" title="Premium User"/>
            )}
        </div>
        <p className="text-accent-cyan font-semibold mb-1 text-center">@{profile.username || "username"}</p>
        
         {accolades.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 my-4">
                {accolades.includes('top_1_follower') && <AccoladeBadge type="top_1_follower" />}
                {accolades.includes('top_2_follower') && <AccoladeBadge type="top_2_follower" />}
                {accolades.includes('top_3_follower') && <AccoladeBadge type="top_3_follower" />}
                {accolades.includes('social_butterfly') && <AccoladeBadge type="social_butterfly" />}
                {accolades.includes('vibe_starter') && <AccoladeBadge type="vibe_starter" />}
            </div>
        )}

        {/* Stats */}
        <div className="flex justify-center gap-8 my-4 w-full">
          <div className="text-center">
            <span className="font-bold text-lg text-accent-cyan">{postCount}</span>
            <span className="text-xs text-gray-400 block">Posts</span>
          </div>
          <button className="text-center" onClick={() => setShowFollowList('followers')}>
            <span className="font-bold text-lg text-accent-cyan">{followers}</span>
            <span className="text-xs text-gray-400 block hover:underline">Followers</span>
          </button>
          <button className="text-center" onClick={() => setShowFollowList('following')}>
            <span className="font-bold text-lg text-accent-cyan">{following}</span>
            <span className="text-xs text-gray-400 block hover:underline">Following</span>
          </button>
          <button className="text-center" onClick={() => setShowFollowList('friends')}>
            <span className="font-bold text-lg text-accent-cyan">{friends}</span>
            <span className="text-xs text-gray-400 block hover:underline">Friends</span>
          </button>
        </div>

        {/* Bio and Details */}
        <div className="mt-4 w-full max-w-lg">
            <p className="text-gray-400 text-center mb-4 text-sm">{profile.bio || "This user hasn't set a bio yet."}</p>
            <div className="flex justify-center flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500">
                {profile.location && <span className="flex items-center gap-1.5"><MapPin size={12}/> {profile.location}</span>}
                {profile.gender && <span className="flex items-center gap-1.5"><User size={12}/> {profile.gender}</span>}
                {profile.interests && <span className="flex items-center gap-1.5"><Tag size={12}/> {profile.interests}</span>}
            </div>
        </div>

        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-glass mt-6" onClick={() => setShowEdit(true)}>Edit Profile</motion.button>
      </motion.div>

      {/* Tabs */}
      <div className="flex justify-center gap-2 md:gap-4 my-8 flex-wrap">
        <button className={`px-4 py-2 rounded-full font-bold transition-colors ${activeTab === "posts" ? "bg-accent-cyan text-black" : "bg-white/10 text-white"}`} onClick={() => setActiveTab("posts")}>Posts</button>
        <button className={`px-4 py-2 rounded-full font-bold transition-colors ${activeTab === "likes" ? "bg-accent-cyan text-black" : "bg-white/10 text-white"}`} onClick={() => setActiveTab("likes")}>Likes</button>
        <button className={`px-4 py-2 rounded-full font-bold transition-colors ${activeTab === "playlists" ? "bg-accent-cyan text-black" : "bg-white/10 text-white"}`} onClick={() => setActiveTab("playlists")}>Playlists</button>
        <button className={`px-4 py-2 rounded-full font-bold transition-colors ${activeTab === "collections" ? "bg-accent-cyan text-black" : "bg-white/10 text-white"}`} onClick={() => setActiveTab("collections")}>Collections</button>
        <button className={`px-4 py-2 rounded-full font-bold transition-colors ${activeTab === "downloads" ? "bg-accent-cyan text-black" : "bg-white/10 text-white"}`} onClick={() => setActiveTab("downloads")}>Downloads</button>
      </div>
      {/* Tab Content */}
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        {activeTab === "posts" && (
            <div className="w-full max-w-xl flex flex-col gap-6">
                <div className="flex justify-center gap-2 p-1 rounded-full bg-black/30">
                    <button onClick={() => setPostTypeFilter('all')} className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${postTypeFilter === 'all' ? 'bg-white/10 text-white' : 'text-gray-400'}`}>All</button>
                    <button onClick={() => setPostTypeFilter('text')} className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${postTypeFilter === 'text' ? 'bg-white/10 text-white' : 'text-gray-400'}`}><AlignLeft size={14} className="inline"/></button>
                    <button onClick={() => setPostTypeFilter('media')} className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${postTypeFilter === 'media' ? 'bg-white/10 text-white' : 'text-gray-400'}`}><Image size={14} className="inline"/></button>
                    <button onClick={() => setPostTypeFilter('poll')} className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${postTypeFilter === 'poll' ? 'bg-white/10 text-white' : 'text-gray-400'}`}><BarChart3 size={14} className="inline"/></button>
                    <button onClick={() => setPostTypeFilter('flash')} className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${postTypeFilter === 'flash' ? 'bg-white/10 text-white' : 'text-gray-400'}`}><Zap size={14} className="inline"/></button>
                    <button onClick={() => setPostTypeFilter('live')} className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${postTypeFilter === 'live' ? 'bg-white/10 text-white' : 'text-gray-400'}`}><Radio size={14} className="inline"/></button>
                </div>
                 {filteredUserPosts.length > 0 ? (
                    filteredUserPosts.map((post) => <PostCard key={post.id} post={post} />)
                ) : (
                    <div className="text-gray-400 text-center mt-16">
                        <div className="text-4xl mb-2">🪐</div>
                        <div className="text-lg font-semibold">No posts of this type yet.</div>
                    </div>
                )}
            </div>
        )}
        {activeTab === "likes" && (
            starredPosts.length > 0 ? (
                <div className="w-full max-w-xl flex flex-col gap-6">
                    {starredPosts.map((post) => (
                        <PostCard key={post.id} post={post} />
                    ))}
                </div>
            ) : (
                <div className="text-gray-400 text-center mt-16">
                    <div className="text-4xl mb-2"><Heart /></div>
                    <div className="text-lg font-semibold">No liked posts</div>
                    <div className="text-sm">Your liked posts will appear here.</div>
                </div>
            )
        )}
        {activeTab === "playlists" && firebaseUser && (
            <UserPlaylists userId={firebaseUser.uid} />
        )}
        {activeTab === "collections" && firebaseUser && (
            <UserCollections userId={firebaseUser.uid} />
        )}
        {activeTab === "downloads" && (
            <UserDownloads />
        )}
      </div>
        
      {/* Discover Other Users */}
      <div className="mt-16 w-full max-w-4xl mx-auto flex justify-center">
        <Link href="/squad/explore">
            <motion.button 
                className="btn-glass bg-accent-pink/80 flex items-center gap-3 text-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <Compass />
                Explore Creators
            </motion.button>
        </Link>
      </div>
       {showCompleteProfile && profile && (
        <CompleteProfileModal profile={profile} onClose={() => setShowCompleteProfile(false)} />
       )}
      {showEdit && (
        <EditProfileModal profile={profile} onClose={() => setShowEdit(false)} />
      )}
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


export default function SquadPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SquadPageContent />
        </Suspense>
    );
}
