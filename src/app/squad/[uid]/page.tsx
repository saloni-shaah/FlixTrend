
"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getFirestore, doc, getDoc, collection, query, where, getDocs, onSnapshot, orderBy } from "firebase/firestore";
import { auth } from "@/utils/firebaseClient";
import { PostCard } from "@/components/PostCard";
import { FollowButton } from "@/components/FollowButton";
<<<<<<< HEAD
import { Star, MapPin, User, Tag, ShieldCheck, Heart } from "lucide-react";
import { FollowListModal } from "@/components/FollowListModal";
=======
import { Star } from "lucide-react";
>>>>>>> 41a2162a78298df970810cb54c8ed33fc2c24ecf

const db = getFirestore();

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
<<<<<<< HEAD
  const [showFollowList, setShowFollowList] = useState<null | 'followers' | 'following'>(null);
=======
>>>>>>> 41a2162a78298df970810cb54c8ed33fc2c24ecf

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setFirebaseUser(user);
    });
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
<<<<<<< HEAD
      const postsData = userPostsSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
=======
      // Manually sort by date client-side
      const postsData = userPostsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      postsData.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
>>>>>>> 41a2162a78298df970810cb54c8ed33fc2c24ecf
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
<<<<<<< HEAD
  const isDeveloper = profile.email === 'next181489111@gmail.com';
  
  return (
    <div className="flex flex-col w-full pb-24">
      {showFollowList && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setShowFollowList(null)} />}
=======

  return (
    <div className="flex flex-col min-h-screen pt-6 pb-24 px-2 md:px-8">
>>>>>>> 41a2162a78298df970810cb54c8ed33fc2c24ecf
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
<<<<<<< HEAD
      <div className="mx-auto w-full max-w-2xl glass-card p-6 -mt-24 flex flex-col items-center text-center">
        <div className="w-32 h-32 rounded-full bg-accent-cyan border-4 border-accent-pink shadow-fab-glow mb-4 overflow-hidden -mt-20">
=======
      <div className="mx-auto w-full max-w-2xl glass-card p-6 -mt-24 flex flex-col items-center">
        <div className="w-32 h-32 rounded-full bg-accent-cyan border-4 border-accent-pink shadow-fab-glow mb-2 overflow-hidden -mt-20">
>>>>>>> 41a2162a78298df970810cb54c8ed33fc2c24ecf
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-5xl text-white flex items-center justify-center h-full w-full">{initials}</span>
          )}
        </div>
<<<<<<< HEAD
        <div className="flex items-center justify-center gap-2">
            <h2 className="text-2xl font-headline font-bold text-center">{profile.name}</h2>
            {isDeveloper && (
                <ShieldCheck className="w-6 h-6 text-accent-purple" title="FlixTrend Developer"/>
            )}
        </div>
        <p className="text-accent-cyan font-semibold mb-3 text-center">@{profile.username || "username"}</p>
        
        {/* Stats */}
        <div className="flex justify-center gap-8 my-2 w-full">
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
=======
        <h2 className="text-2xl font-headline font-bold mb-1 text-center">{profile.name}</h2>
        <p className="text-accent-cyan mb-2 text-center">@{profile.username || "username"}</p>
        <p className="text-gray-300 text-center mb-2">{profile.bio || "This is their bio."}</p>
        <div className="flex justify-center gap-8 my-4 w-full">
          <div className="flex flex-col items-center">
            <span className="font-bold text-lg text-accent-cyan">{postCount}</span>
            <span className="text-xs text-gray-500">Posts</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-lg text-accent-cyan">{followers}</span>
            <span className="text-xs text-gray-500">Followers</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-lg text-accent-cyan">{following}</span>
            <span className="text-xs text-gray-500">Following</span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-center mb-2">
          {profile.interests && profile.interests.split(",").map((interest: string) => (
            <span key={interest} className="px-3 py-1 rounded-full bg-white/10 text-accent-cyan text-xs font-bold">{interest.trim()}</span>
          ))}
        </div>
        {/* Follow/Unfollow button for other users */}
        {firebaseUser && firebaseUser.uid !== uid && (
          <FollowButton profileUser={profile} currentUser={firebaseUser} />
>>>>>>> 41a2162a78298df970810cb54c8ed33fc2c24ecf
        )}
      </div>
      {/* Tabs */}
      <div className="flex justify-center gap-4 my-8">
        <button className={`px-4 py-2 rounded-full font-bold transition-colors ${activeTab === "posts" ? "bg-accent-cyan text-black" : "bg-white/10 text-white"}`} onClick={() => setActiveTab("posts")}>Posts</button>
<<<<<<< HEAD
        <button className={`px-4 py-2 rounded-full font-bold transition-colors ${activeTab === "likes" ? "bg-accent-cyan text-black" : "bg-white/10 text-white"}`} onClick={() => setActiveTab("likes")}>Likes</button>
=======
        <button className={`px-4 py-2 rounded-full font-bold transition-colors ${activeTab === "starred" ? "bg-accent-cyan text-black" : "bg-white/10 text-white"}`} onClick={() => setActiveTab("starred")}>Starred</button>
>>>>>>> 41a2162a78298df970810cb54c8ed33fc2c24ecf
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
<<<<<<< HEAD
        {activeTab === "likes" && (
=======
        {activeTab === "starred" && (
>>>>>>> 41a2162a78298df970810cb54c8ed33fc2c24ecf
            starredPosts.length > 0 ? (
                <div className="w-full max-w-xl flex flex-col gap-6">
                    {starredPosts.map((post) => (
                        <PostCard key={post.id} post={post} />
                    ))}
                </div>
            ) : (
                <div className="text-gray-400 text-center mt-16">
<<<<<<< HEAD
                    <div className="text-4xl mb-2"><Heart/></div>
                    <div className="text-lg font-semibold">No liked posts</div>
                    <div className="text-sm">Their liked posts will appear here.</div>
=======
                    <div className="text-4xl mb-2"><Star/></div>
                    <div className="text-lg font-semibold">No starred posts</div>
                    <div className="text-sm">Their starred posts will appear here.</div>
>>>>>>> 41a2162a78298df970810cb54c8ed33fc2c24ecf
                </div>
            )
        )}
      </div>
<<<<<<< HEAD
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

    
=======
    </div>
  );
}
>>>>>>> 41a2162a78298df970810cb54c8ed33fc2c24ecf
