
"use client";
import React, { useEffect, useState, useRef, Suspense } from "react";
import { auth, app } from "@/utils/firebaseClient";
import { getFirestore, doc, onSnapshot, collection, query, where, getCountFromServer, getDocs, orderBy, writeBatch, deleteDoc, arrayUnion, arrayRemove, serverTimestamp } from "firebase/firestore";
import { Cog, Compass, MapPin, User, Tag, ShieldCheck, Music, Bookmark, Heart, Folder, Download, CheckCircle, Search, Users, Phone } from "lucide-react";
import { signOut } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { PostCard } from "@/components/PostCard";
import { FollowListModal } from "@/components/FollowListModal";
import { CompleteProfileModal } from "@/components/squad/CompleteProfileModal";
import { EditProfileModal } from "@/components/squad/EditProfileModal";
import { SettingsModal } from "@/components/squad/SettingsModal";
import { UserPlaylists } from "@/components/squad/UserPlaylists";
import { UserCollections } from "@/components/squad/UserCollections";
import { UserDownloads } from "@/components/squad/UserDownloads";


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
  const [showSettings, setShowSettings] = useState(false);
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'posts');
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [starredPosts, setStarredPosts] = useState<any[]>([]);
  const [showFollowList, setShowFollowList] = useState<null | 'followers' | 'following' | 'friends'>(null);
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();


  const handleSearch = async (term: string) => {
      setSearchTerm(term);
      if (term.trim() === '') {
          setIsSearching(false);
          setSearchResults([]);
          return;
      }
      setIsSearching(true);
      const userQuery = query(collection(db, 'users'), where('username', '>=', term.toLowerCase()), where('username', '<=', term.toLowerCase() + '\uf8ff'));
      const groupQuery = query(collection(db, 'groups'), where('name', '>=', term), where('name', '<=', term + '\uf8ff'));
      
      const [userSnap, groupSnap] = await Promise.all([getDocs(userQuery), getDocs(groupQuery)]);
      
      const users = userSnap.docs.map(doc => ({ ...doc.data(), id: doc.id, type: 'user' }));
      const groups = groupSnap.docs.map(doc => ({ ...doc.data(), id: doc.id, type: 'group' }));
      
      setSearchResults([...users, ...groups]);
  };
  
  const handleSelectChat = (item: any) => {
      // This is a placeholder. In a real app, you would navigate to the chat.
      alert(`Navigating to chat with ${item.name || item.username}`);
      setSearchTerm('');
      setIsSearching(false);
  }

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setFirebaseUser(user);
        const userDocRef = doc(db, "users", user.uid);
        const unsubProfile = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setProfile({ uid: docSnap.id, ...data });
                 const isProfileActuallyComplete = data.profileComplete || (data.dob && data.gender && data.location);
                 if (!isProfileActuallyComplete) {
                    setShowCompleteProfile(true);
                 } else if (data.profileComplete === false) {
                    updateDoc(userDocRef, { profileComplete: true });
                 }
            } else {
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
    async function fetchProfileData() {
        if (!firebaseUser) return;
        
        const uid = firebaseUser.uid;

        const postsQuery = query(collection(db, "posts"), where("userId", "==", uid), orderBy("createdAt", "desc"));
        const unsubPosts = onSnapshot(postsQuery, (snapshot) => {
            setUserPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setPostCount(snapshot.size);
        });
        
        return () => unsubPosts();
    }
    if (firebaseUser) fetchProfileData();
  }, [firebaseUser]);

  useEffect(() => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;

    const unsubFollowers = onSnapshot(collection(db, "users", uid, "followers"), snap => setFollowers(snap.size));
    const unsubFollowing = onSnapshot(collection(db, "users", uid, "following"), snap => setFollowing(snap.size));
    
    // Calculate friends
    const fetchFriends = async () => {
        const followersSnap = await getDocs(collection(db, "users", uid, "followers"));
        const followingSnap = await getDocs(collection(db, "users", uid, "following"));
        const followerIds = followersSnap.docs.map(d => d.id);
        const followingIds = followingSnap.docs.map(d => d.id);
        const friendsIds = followerIds.filter(id => followingIds.includes(id));
        setFriends(friendsIds.length);
    }
    fetchFriends();
    
    const q = query(collection(db, "users", uid, "starredPosts"), orderBy("starredAt", "desc"));
    const unsubStarred = onSnapshot(q, (snapshot) => {
        setStarredPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubFollowers();
      unsubFollowing();
      unsubStarred();
    };
  }, [firebaseUser]);
  
  if (loading) {
    return <div className="flex flex-col min-h-screen items-center justify-center text-accent-cyan">Loading profile...</div>;
  }
  if (!firebaseUser || !profile) {
    return <div className="flex flex-col items-center justify-center text-red-400">Not logged in or profile not found.</div>;
  }
  
  const initials = profile.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || profile.username?.slice(0, 2).toUpperCase() || "U";
  const isPremium = profile.isPremium && (!profile.premiumUntil || profile.premiumUntil.toDate() > new Date());
  const isDeveloper = Array.isArray(profile.role) && (profile.role.includes('developer') || profile.role.includes('founder'));


  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col w-full pb-24">
        {showFollowList && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setShowFollowList(null)} />}
        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="fixed top-6 right-6 z-50 btn-glass-icon"
          onClick={() => setShowSettings(true)}
          aria-label="Settings"
        >
          <Cog />
        </motion.button>
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
                {profile.phoneNumber && <span className="flex items-center gap-1.5"><Phone size={12}/> {profile.phoneNumber}</span>}
                {profile.location && <span className="flex items-center gap-1.5"><MapPin size={12}/> {profile.location}</span>}
                {profile.gender && <span className="flex items-center gap-1.5"><User size={12}/> {profile.gender}</span>}
                {profile.interests && <span className="flex items-center gap-1.5"><Tag size={12}/> {profile.interests}</span>}
            </div>
        </div>

        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-glass mt-6" onClick={() => setShowEdit(true)}>Edit Profile</motion.button>
      </motion.div>

       <div className="w-full max-w-2xl mx-auto my-8 relative">
        <div className="relative">
            <input
                type="text"
                className="input-glass w-full pl-10"
                placeholder="Search users or groups..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        </div>
        {isSearching && (
            <div className="absolute top-full mt-2 w-full glass-card max-h-80 overflow-y-auto z-30 p-2">
                {searchResults.length > 0 ? (
                    searchResults.map(item => (
                        <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent-cyan/10 cursor-pointer" onClick={() => handleSelectChat(item)}>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent-pink to-accent-cyan flex items-center justify-center text-white font-bold text-lg overflow-hidden shrink-0">
                                {item.avatar_url ? <img src={item.avatar_url} alt={item.name} className="w-full h-full object-cover" /> : (item.type === 'group' ? <Users/> : 'U')}
                            </div>
                            <div>
                                <div className="font-bold text-sm truncate">{item.name || item.username}</div>
                                <div className="text-xs text-gray-400">{item.type === 'user' ? `@${item.username}` : `${item.members?.length || 0} members`}</div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-4 text-center text-gray-400">No results found.</div>
                )}
            </div>
        )}
      </div>

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
          userPosts.length > 0 ? (
            <div className="w-full max-w-xl flex flex-col gap-6">
              {userPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-gray-400 text-center mt-16">
              <div className="text-4xl mb-2">🪐</div>
              <div className="text-lg font-semibold">No posts yet</div>
              <div className="text-sm">Your posts will appear here!</div>
            </div>
          )
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

       {/* Store FAB */}
       <div className="fixed bottom-24 left-4 z-30">
          <Link href="/store">
              <motion.button 
                  className="w-16 h-16 rounded-full flex items-center justify-center shadow-fab-glow bg-brand-gold/20 dark:bg-brand-gold/30 backdrop-blur-md"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  title="FlixTrend Store"
              >
                  <span className="text-3xl">🛍️</span>
              </motion.button>
          </Link>
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
      {showSettings && profile && firebaseUser && (
        <SettingsModal profile={profile} firebaseUser={firebaseUser} onClose={() => setShowSettings(false)} />
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

    