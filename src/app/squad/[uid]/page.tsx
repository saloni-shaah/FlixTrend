"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getFirestore, doc, getDoc, collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { auth } from "@/utils/firebaseClient";
import { PostCard } from "../../home/page";
import FollowButton from "../page";

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
  const [activeTab, setActiveTab] = useState("posts");

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      const user = auth.currentUser;
      setFirebaseUser(user);
      if (!uid) {
        setProfile(null);
        setLoading(false);
        return;
      }
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      setProfile(docSnap.exists() ? docSnap.data() : null);
      // Fetch post count
      const postsQuery = query(collection(db, "posts"), where("userId", "==", uid));
      const userPostsSnap = await getDocs(postsQuery);
      setPostCount(userPostsSnap.size);
      setUserPosts(userPostsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      // Fetch followers count
      const followersSnap = await getDocs(collection(db, "users", uid, "followers"));
      setFollowers(followersSnap.size);
      // Fetch following count
      const followingSnap = await getDocs(collection(db, "users", uid, "following"));
      setFollowing(followingSnap.size);
      setLoading(false);
    }
    fetchProfile();
  }, [uid]);

  if (loading) {
    return <div className="flex flex-col min-h-screen items-center justify-center text-accent-cyan">Loading profile...</div>;
  }
  if (!profile) {
    return <div className="flex flex-col min-h-screen items-center justify-center text-red-400">User not found.</div>;
  }

  return (
    <div className="flex flex-col min-h-screen pt-6 pb-24 px-2 md:px-8">
      {/* Banner */}
      <div className="relative h-40 w-full rounded-2xl overflow-hidden mb-8">
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
      <div className="mx-auto w-full max-w-2xl bg-white/80 dark:bg-black/60 rounded-2xl shadow-lg p-6 -mt-24 flex flex-col items-center border border-accent-cyan/20">
        <div className="w-32 h-32 rounded-full bg-accent-cyan border-4 border-accent-pink shadow-fab-glow mb-2 overflow-hidden -mt-20">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-5xl text-white flex items-center justify-center h-full w-full">👤</span>
          )}
        </div>
        <h2 className="text-2xl font-headline font-bold mb-1 text-center">{profile.name}</h2>
        <p className="text-accent-cyan mb-2 text-center">@{profile.username || "username"}</p>
        <p className="text-gray-500 dark:text-gray-300 text-center mb-2">{profile.bio || "This is your bio."}</p>
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
            <span key={interest} className="px-3 py-1 rounded-full bg-accent-cyan/20 text-accent-cyan text-xs font-bold">{interest.trim()}</span>
          ))}
        </div>
        {/* Follow/Unfollow button for other users */}
        {firebaseUser && firebaseUser.uid !== uid && (
          <FollowButton user={profile} currentUser={firebaseUser} />
        )}
      </div>
      {/* Tabs */}
      <div className="flex justify-center gap-4 my-8">
        <button className={`px-4 py-2 rounded-full font-bold ${activeTab === "posts" ? "bg-accent-cyan/20 text-accent-cyan" : "bg-accent-cyan/10 text-accent-cyan"}`} onClick={() => setActiveTab("posts")}>Posts</button>
        <button className={`px-4 py-2 rounded-full font-bold ${activeTab === "trends" ? "bg-accent-cyan/20 text-accent-cyan" : "bg-accent-cyan/10 text-accent-cyan"}`} onClick={() => setActiveTab("trends")}>Trends</button>
        <button className={`px-4 py-2 rounded-full font-bold ${activeTab === "drops" ? "bg-accent-cyan/20 text-accent-cyan" : "bg-accent-cyan/10 text-accent-cyan"}`} onClick={() => setActiveTab("drops")}>Drops</button>
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
        {activeTab === "trends" && (
          <div className="text-gray-400 text-center mt-16">
            <div className="text-4xl mb-2">📈</div>
            <div className="text-lg font-semibold">No trends yet</div>
            <div className="text-sm">Their trends will appear here!</div>
          </div>
        )}
        {activeTab === "drops" && (
          <div className="text-gray-400 text-center mt-16">
            <div className="text-4xl mb-2">💧</div>
            <div className="text-lg font-semibold">No drops yet</div>
            <div className="text-sm">Their drops will appear here!</div>
          </div>
        )}
      </div>
    </div>
  );
} 
