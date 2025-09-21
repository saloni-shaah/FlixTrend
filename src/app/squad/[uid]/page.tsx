
"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getFirestore, doc, getDoc, collection, query, where, getDocs, onSnapshot, orderBy } from "firebase/firestore";
import { auth, app } from "@/utils/firebaseClient";
import { PostCard } from "@/components/PostCard";
import { FollowButton } from "@/components/FollowButton";
import { Star, MapPin, User, Tag, ShieldCheck, Heart, CheckCircle, Award, Mic, Crown, Zap, Rocket, MoreVertical } from "lucide-react";
import { FollowListModal } from "@/components/FollowListModal";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { cn } from "@/lib/utils"


const db = getFirestore(app);


// START: Copied DropdownMenu components
const DropdownMenu = DropdownMenuPrimitive.Root
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger
const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName
const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName
// END: Copied DropdownMenu components

// Helper to get all users and their follower counts
const getAllUsersWithFollowerCounts = async () => {
    const usersSnap = await getDocs(collection(db, "users"));
    const users = usersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() }));

    const followerCounts = await Promise.all(users.map(async user => {
        const followersSnap = await getDocs(collection(db, "users", user.uid, "followers"));
        return { ...user, followerCount: followersSnap.size };
    }));
    
    return followerCounts;
}

function ProfileBadge({ profile, allUsers }: { profile: any, allUsers: any[] }) {
    if (!profile) return null;

    const isCreator = profile.accountType === 'creator';
    
    const sortedUsers = [...allUsers].sort((a, b) => b.followerCount - a.followerCount);
    const userRank = sortedUsers.findIndex(u => u.uid === profile.uid);

    let rankBadge = null;
    if (userRank === 0) {
        rankBadge = { text: "Global Icon", color: "bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 text-black shadow-lg", icon: <Crown size={14} /> };
    } else if (userRank === 1) {
        rankBadge = { text: "Trendsetter", color: "bg-gradient-to-r from-gray-400 to-gray-200 text-black shadow-md", icon: <Zap size={14} /> };
    } else if (userRank === 2) {
        rankBadge = { text: "Rising Star", color: "bg-gradient-to-r from-yellow-600 to-amber-400 text-white shadow-md", icon: <Rocket size={14} /> };
    }
    
    return (
        <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
            {isCreator && (
                <div className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r from-accent-purple to-accent-pink text-white shadow-md">
                    <Mic size={14}/> Vibe Creator
                </div>
            )}
            {rankBadge && (
                <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${rankBadge.color}`}>
                    {rankBadge.icon} {rankBadge.text}
                </div>
            )}
        </div>
    )
}

export default function UserProfilePage() {
  const params = useParams();
  const uid = typeof params?.uid === 'string' ? params.uid : Array.isArray(params?.uid) ? params.uid[0] : null;
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [postCount, setPostCount] = useState(0);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [starredPosts, setStarredPosts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [showFollowList, setShowFollowList] = useState<null | 'followers' | 'following'>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);


  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setFirebaseUser(user);
    });
    // Fetch all users once for ranking
    getAllUsersWithFollowerCounts().then(setAllUsers);
    return () => unsub();
  }, []);

  useEffect(() => {
    async function fetchProfile() {
      if (!uid) {
        setLoading(false);
        return;
      }
      setLoading(true);

      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      setProfile(docSnap.exists() ? { uid: docSnap.id, ...docSnap.data() } : null);

      // Fetch post count and posts
      const postsQuery = query(collection(db, "posts"), where("userId", "==", uid));
      const userPostsSnap = await getDocs(postsQuery);
      setPostCount(userPostsSnap.size);
      // Sort posts by creation date client-side
      const postsData = userPostsSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));
      setUserPosts(postsData);
      
      setLoading(false);
    }
    fetchProfile();
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    const unsubFollowers = onSnapshot(collection(db, "users", uid, "followers"), snap => setFollowers(snap.size));
    const unsubFollowing = onSnapshot(collection(db, "users", uid, "following"), snap => setFollowing(snap.size));
    
    // Fetch starred posts
    const q = query(collection(db, "users", uid, "starredPosts"), orderBy("starredAt", "desc"));
    const unsubStarred = onSnapshot(q, (snapshot) => {
        setStarredPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubFollowers();
      unsubFollowing();
      unsubStarred();
    }
  }, [uid])

  if (loading) {
    return <div className="flex flex-col min-h-screen items-center justify-center text-accent-cyan">Loading profile...</div>;
  }
  if (!profile) {
    return <div className="flex flex-col min-h-screen items-center justify-center text-red-400">User not found.</div>;
  }
  
  const initials = profile.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || profile.username?.slice(0, 2).toUpperCase() || "U";
  const isDeveloper = profile.email === 'next181489111@gmail.com';
  const isPremium = profile.isPremium && (!profile.premiumUntil || profile.premiumUntil.toDate() > new Date());
  
  return (
    <div className="flex flex-col w-full pb-24">
      {showFollowList && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setShowFollowList(null)} />}
      {/* Banner */}
      <div className="relative h-40 md:h-60 w-full rounded-2xl overflow-hidden mb-8 glass-card">
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
      {/* Profile Card */}
      <div className="mx-auto w-full max-w-2xl glass-card p-6 -mt-24 flex flex-col items-center text-center">
        <div className="w-32 h-32 rounded-full bg-accent-cyan border-4 border-accent-pink shadow-fab-glow mb-4 overflow-hidden -mt-20">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-5xl text-white flex items-center justify-center h-full w-full">{initials}</span>
          )}
        </div>
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
        
        <ProfileBadge profile={profile} allUsers={allUsers} />

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

        {/* Follow/Unfollow button for other users */}
        {firebaseUser && firebaseUser.uid !== uid && (
          <div className="mt-6">
            <FollowButton profileUser={profile} currentUser={firebaseUser} />
          </div>
        )}
      </div>
      {/* Tabs */}
      <div className="flex justify-center gap-4 my-8">
        <button className={`px-4 py-2 rounded-full font-bold transition-colors ${activeTab === "posts" ? "bg-accent-cyan text-black" : "bg-white/10 text-white"}`} onClick={() => setActiveTab("posts")}>Posts</button>
        <button className={`px-4 py-2 rounded-full font-bold transition-colors ${activeTab === "likes" ? "bg-accent-cyan text-black" : "bg-white/10 text-white"}`} onClick={() => setActiveTab("likes")}>Likes</button>
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
              <div className="text-sm">Their posts will appear here!</div>
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
                    <div className="text-4xl mb-2"><Heart/></div>
                    <div className="text-lg font-semibold">No liked posts</div>
                    <div className="text-sm">Their liked posts will appear here.</div>
                </div>
            )
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
  );
}

    