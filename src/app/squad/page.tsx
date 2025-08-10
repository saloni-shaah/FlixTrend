"use client";
import React, { useEffect, useState, useRef } from "react";
import { auth } from "@/utils/firebaseClient";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getCountFromServer, getDocs, deleteDoc, onSnapshot } from "firebase/firestore";
import { FaCog, FaPalette, FaLock, FaUserShield, FaCommentDots, FaMobileAlt, FaTrash, FaSignOutAlt, FaInfoCircle } from "react-icons/fa";
import { signOut } from "firebase/auth";
import { useRouter, useParams } from "next/navigation";
import { PostCard } from "../home/page";
import Link from "next/link";

const db = getFirestore();

async function uploadToCloudinary(file: File, onProgress?: (percent: number) => void): Promise<string | null> {
  const url = `https://api.cloudinary.com/v1_1/drrzvi2jp/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "flixtrend_unsigned");
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      const data = JSON.parse(xhr.responseText);
      if (xhr.status === 200 && data.secure_url) {
        resolve(data.secure_url);
      } else {
        reject(new Error(data.error?.message || "Upload failed"));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(formData);
  });
}

export default function SquadPage() {
  const params = useParams();
  const viewingUid = typeof params?.uid === 'string' ? params.uid : Array.isArray(params?.uid) ? params.uid[0] : null;
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [postCount, setPostCount] = useState(0);
  // Placeholder for followers/following
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  useEffect(() => {
    // Robust user doc auto-create logic
    async function ensureUserDoc() {
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (!userDocSnap.exists()) {
          await setDoc(userDocRef, {
            uid: user.uid,
            name: user.displayName || "",
            username: user.displayName ? user.displayName.replace(/\s+/g, "").toLowerCase() : "",
            email: user.email || "",
            avatar_url: user.photoURL || "",
            bio: "",
            interests: "",
            createdAt: new Date(),
          });
        }
      }
    }
    ensureUserDoc();
    async function fetchProfile() {
      setLoading(true);
      const user = auth.currentUser;
      setFirebaseUser(user);
      const uid = viewingUid || user?.uid;
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
      const postsSnapshot = await getCountFromServer(postsQuery);
      setPostCount(postsSnapshot.data().count || 0);
      // Fetch user posts
      const postsCol = collection(db, "posts");
      const userPostsQuery = query(postsCol, where("userId", "==", uid));
      const userPostsSnap = await getDocs(userPostsQuery);
      setUserPosts(userPostsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      // Fetch followers/following
      if (user && uid !== user.uid) {
        // Check if current user is following this profile
        const followersCol = collection(db, "users", uid, "followers");
        const followDocRef = doc(followersCol, user.uid);
        const followDocSnap = await getDoc(followDocRef);
        setIsFollowing(followDocSnap.exists());
      }
      // Fetch followers count
      const followersSnap = await getDocs(collection(db, "users", uid, "followers"));
      setFollowers(followersSnap.size);
      // Fetch following count
      const followingSnap = await getDocs(collection(db, "users", uid, "following"));
      setFollowing(followingSnap.size);
      setLoading(false);
    }
    fetchProfile();
    // Real-time followers count
    let unsubFollowers: any = null;
    let unsubFollowing: any = null;
    if (viewingUid || firebaseUser?.uid) {
      const uid = viewingUid || firebaseUser?.uid;
      unsubFollowers = onSnapshot(collection(db, "users", uid, "followers"), snap => setFollowers(snap.size));
      unsubFollowing = onSnapshot(collection(db, "users", uid, "following"), snap => setFollowing(snap.size));
    }
    return () => {
      if (unsubFollowers) unsubFollowers();
      if (unsubFollowing) unsubFollowing();
    };
    // Fetch all users for discovery
    async function fetchAllUsers() {
      const usersSnap = await getDocs(collection(db, "users"));
      setAllUsers(usersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() })));
      console.log('Fetched users:', usersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() })));
    }
    fetchAllUsers();
  }, [showEdit, viewingUid]);

  const handleFollow = async () => {
    if (!firebaseUser || !profile) return;
    const uid = viewingUid;
    if (!uid) return;
    const followersCol = collection(db, "users", uid, "followers");
    const followingCol = collection(db, "users", firebaseUser.uid, "following");
    const followDocRef = doc(followersCol, firebaseUser.uid);
    const followingDocRef = doc(followingCol, uid);
    if (isFollowing) {
      await deleteDoc(followDocRef);
      await deleteDoc(followingDocRef);
      setIsFollowing(false);
    } else {
      await setDoc(followDocRef, { followedAt: new Date() });
      await setDoc(followingDocRef, { followedAt: new Date() });
      setIsFollowing(true);
    }
  };

  if (loading) {
    return <div className="flex flex-col min-h-screen items-center justify-center text-accent-cyan">Loading profile...</div>;
  }
  if (!firebaseUser) {
    return <div className="flex flex-col min-h-screen items-center justify-center text-red-400">Not logged in.</div>;
  }

  const displayProfile = profile || {
    name: firebaseUser.displayName || "Your Name",
    email: firebaseUser.email,
    avatar_url: firebaseUser.photoURL,
    banner_url: "",
    username: "",
    bio: "",
    age: "",
    phone: "",
    interests: "",
  };

  return (
    <div className="flex flex-col min-h-screen pt-6 pb-24 px-2 md:px-8 bg-white transition-colors">
      {/* Settings FAB (only for own profile) */}
      {(!viewingUid || viewingUid === firebaseUser?.uid) && (
        <button
          className="fixed top-6 right-6 z-50 bg-green-400 text-primary p-4 rounded-full shadow-fab-glow hover:scale-110 transition-all duration-200"
          onClick={() => setShowSettings(true)}
          aria-label="Settings"
        >
          <FaCog size={24} />
        </button>
      )}
      {/* Banner */}
      <div className="relative h-40 w-full rounded-2xl overflow-hidden mb-8 bg-yellow-100">
        {displayProfile.banner_url ? (
          <img
            src={displayProfile.banner_url}
            alt="banner"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-accent-pink/40 to-accent-cyan/40" />
        )}
      </div>
      {/* Profile Card */}
      <div className="mx-auto w-full max-w-2xl bg-blue-100 dark:bg-black/60 rounded-2xl shadow-lg p-6 -mt-24 flex flex-col items-center border border-accent-cyan/20">
        <div className="w-32 h-32 rounded-full bg-accent-cyan border-4 border-accent-pink shadow-fab-glow mb-2 overflow-hidden -mt-20">
          {displayProfile.avatar_url ? (
            <img src={displayProfile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-5xl text-white flex items-center justify-center h-full w-full">👤</span>
          )}
        </div>
        <h2 className="text-2xl font-headline font-bold mb-1 text-center">{displayProfile.name}</h2>
        <p className="text-accent-cyan mb-2 text-center">@{displayProfile.username || "username"}</p>
        <p className="text-gray-500 dark:text-gray-300 text-center mb-2">{displayProfile.bio || "This is your bio. Edit it to tell the world about your vibes!"}</p>
        <div className="flex justify-center gap-8 my-4 w-full">
          <div className="flex flex-col items-center">
            <span className="font-bold text-lg text-orange-500">{postCount}</span>
            <span className="text-xs text-gray-500">Posts</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-lg text-cyan-500">{followers}</span>
            <span className="text-xs text-gray-500">Followers</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-lg text-red-500">{following}</span>
            <span className="text-xs text-gray-500">Following</span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-center mb-2">
          {displayProfile.interests && displayProfile.interests.split(",").map((interest: string, i: number) => (
            <span key={interest} className={`px-3 py-1 rounded-full bg-gradient-to-r from-pink-500 via-yellow-400 to-blue-400 text-white text-xs font-bold`}>{interest.trim()}</span>
          ))}
        </div>
        {/* Follow/Unfollow button for other users */}
        {viewingUid && viewingUid !== firebaseUser?.uid && (
          <button className={`px-6 py-2 rounded-full font-bold mt-4 ${isFollowing ? "bg-accent-cyan text-primary" : "bg-accent-pink text-white"}`} onClick={handleFollow}>
            {isFollowing ? "Unfollow" : "Follow"}
          </button>
        )}
        {/* Edit Profile button only for own profile */}
        {(!viewingUid || viewingUid === firebaseUser?.uid) && (
          <button className="px-6 py-2 rounded-full bg-accent-pink text-white font-bold hover:scale-105 hover:shadow-lg transition-all duration-200 mt-4" onClick={() => setShowEdit(true)}>Edit Profile</button>
        )}
      </div>
      {/* Tabs */}
      <div className="flex justify-center gap-4 my-8">
        <button className={`px-4 py-2 rounded-full font-bold ${activeTab === "posts" ? "bg-purple-400 text-white" : "bg-purple-100 text-purple-700"}`} onClick={() => setActiveTab("posts")}>Posts</button>
        <button className={`px-4 py-2 rounded-full font-bold ${activeTab === "trends" ? "bg-purple-400 text-white" : "bg-purple-100 text-purple-700"}`} onClick={() => setActiveTab("trends")}>Trends</button>
        <button className={`px-4 py-2 rounded-full font-bold ${activeTab === "drops" ? "bg-purple-400 text-white" : "bg-purple-100 text-purple-700"}`} onClick={() => setActiveTab("drops")}>Drops</button>
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
        {activeTab === "trends" && (
          <div className="text-gray-400 text-center mt-16">
            <div className="text-4xl mb-2">📈</div>
            <div className="text-lg font-semibold">No trends yet</div>
            <div className="text-sm">Your trends will appear here!</div>
          </div>
        )}
        {activeTab === "drops" && (
          <div className="text-gray-400 text-center mt-16">
            <div className="text-4xl mb-2">💧</div>
            <div className="text-lg font-semibold">No drops yet</div>
            <div className="text-sm">Your drops will appear here!</div>
          </div>
        )}
      </div>
      {/* Discover Other Users */}
      <div className="mt-16 w-full max-w-2xl mx-auto">
        <h3 className="text-xl font-headline bg-gradient-to-r from-pink-500 via-yellow-400 to-blue-400 bg-clip-text text-transparent">Discover Users</h3>
        {allUsers.filter(u => u.uid !== (viewingUid || firebaseUser?.uid)).length === 0 ? (
          <div className="text-gray-400 text-center py-8">No users found. Invite your friends to join!</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allUsers.filter(u => u.uid !== (viewingUid || firebaseUser?.uid)).map((user, i) => (
              <Link key={user.uid} href={`/squad/${user.uid}`} className="block">
                <div className={`flex items-center gap-4 rounded-xl p-4 shadow border border-accent-cyan/10 hover:bg-accent-cyan/10 transition-all cursor-pointer ${i % 3 === 0 ? 'bg-pink-100' : i % 3 === 1 ? 'bg-yellow-100' : 'bg-blue-100'}`}>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-accentPink to-accentCyan flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <span>{user.name ? user.name[0] : user.username?.[0] || "U"}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-headline text-accent-cyan">{user.name}</div>
                    <div className="text-xs text-gray-500">@{user.username}</div>
                    <div className="text-xs text-gray-400">{user.bio}</div>
                    <div className="flex gap-4 mt-1 text-xs text-accent-cyan">
                      <span>Posts: {user.postCount || 0}</span>
                      <span>Followers: {user.followersCount || 0}</span>
                      <span>Following: {user.followingCount || 0}</span>
                    </div>
                    <div className="flex gap-1 flex-wrap mt-1">
                      {user.interests && user.interests.split(",").map((interest: string) => (
                        <span key={interest} className="px-2 py-0.5 rounded-full bg-accent-cyan/20 text-accent-cyan text-xs font-bold">{interest.trim()}</span>
                      ))}
                    </div>
                  </div>
                  <FollowButton user={user} currentUser={firebaseUser} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      {showEdit && (
        <EditProfileModal profile={displayProfile} onClose={() => setShowEdit(false)} />
      )}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}

function EditProfileModal({ profile, onClose }: { profile: any; onClose: () => void }) {
  const [form, setForm] = useState({
    name: profile.name || "",
    username: profile.username || "",
    bio: profile.bio || "",
    age: profile.age || "",
    phone: profile.phone || "",
    interests: profile.interests || "",
    avatar_url: profile.avatar_url || "",
    banner_url: profile.banner_url || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploading(true);
      setUploadProgress(null);
      try {
        const url = await uploadToCloudinary(e.target.files[0], setUploadProgress);
        setForm((prev) => ({ ...prev, banner_url: url || "" }));
      } catch (err: any) {
        setError(err.message);
      }
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploading(true);
      setUploadProgress(null);
      try {
        const url = await uploadToCloudinary(e.target.files[0], setUploadProgress);
        setForm((prev) => ({ ...prev, avatar_url: url || "" }));
      } catch (err: any) {
        setError(err.message);
      }
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not logged in");
      const docRef = doc(db, "users", user.uid);
      await setDoc(docRef, { ...form }, { merge: true }); // Upsert profile
      setSuccess("Profile updated!");
      setTimeout(onClose, 1000);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white dark:bg-card rounded-2xl p-6 w-full max-w-md relative animate-pop shadow-xl border border-gray-100 dark:border-accent-cyan/20">
        <button onClick={onClose} className="absolute top-2 right-2 text-accent-pink text-2xl">&times;</button>
        <h2 className="text-xl font-headline font-bold mb-4 text-accent-cyan">Edit Profile</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pb-24">
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            className="px-4 py-3 rounded-full bg-gray-100 dark:bg-black/40 text-gray-800 dark:text-white border-2 border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-pink"
            value={form.name}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="username"
            placeholder="Username"
            className="px-4 py-3 rounded-full bg-gray-100 dark:bg-black/40 text-gray-800 dark:text-white border-2 border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-pink"
            value={form.username}
            onChange={handleChange}
            required
          />
          <textarea
            name="bio"
            placeholder="Bio"
            className="px-4 py-3 rounded-2xl bg-gray-100 dark:bg-black/40 text-gray-800 dark:text-white border-2 border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-pink resize-none"
            value={form.bio}
            onChange={handleChange}
          />
          <input
            type="number"
            name="age"
            placeholder="Age"
            className="px-4 py-3 rounded-full bg-gray-100 dark:bg-black/40 text-gray-800 dark:text-white border-2 border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-pink"
            value={form.age}
            onChange={handleChange}
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            className="px-4 py-3 rounded-full bg-gray-100 dark:bg-black/40 text-gray-800 dark:text-white border-2 border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-pink"
            value={form.phone}
            onChange={handleChange}
          />
          <input
            type="text"
            name="interests"
            placeholder="Your Interests (comma separated)"
            className="px-4 py-3 rounded-full bg-gray-100 dark:bg-black/40 text-gray-800 dark:text-white border-2 border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-pink"
            value={form.interests}
            onChange={handleChange}
          />
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-500">Profile Picture</label>
            <input
              type="file"
              accept="image/*"
              ref={avatarInputRef}
              onChange={handleAvatarUpload}
              className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent-pink/20 file:text-accent-pink hover:file:bg-accent-pink/40"
            />
            {form.avatar_url && (
              <img src={form.avatar_url} alt="avatar preview" className="w-20 h-20 object-cover rounded-full mt-2 mx-auto" />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-500">Profile Banner</label>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleBannerUpload}
              className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent-cyan/20 file:text-accent-cyan hover:file:bg-accent-cyan/40"
            />
            {form.banner_url && (
              <img src={form.banner_url} alt="banner preview" className="w-full h-24 object-cover rounded-xl mt-2" />
            )}
            {uploadProgress !== null && (
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div className="bg-accent-cyan h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
            )}
          </div>
          {error && <div className="text-red-400 text-center animate-bounce mt-2">{error}</div>}
          {success && <div className="text-accent-cyan text-center animate-glow mt-2">{success}</div>}
          <div className="fixed left-0 right-0 bottom-0 z-50 flex justify-center items-center bg-gradient-to-t from-white/90 dark:from-black/90 to-transparent p-4 rounded-b-2xl" style={{maxWidth: '100vw'}}>
            <button
              type="submit"
              className="px-8 py-3 rounded-full bg-accent-cyan text-primary font-bold text-lg shadow-fab-glow hover:scale-105 hover:shadow-lg transition-all duration-200 disabled:opacity-60 mb-2 w-full max-w-xs"
              disabled={loading || uploading}
            >
              {loading ? "Saving..." : uploading ? "Uploading..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SettingsModal({ onClose }: { onClose: () => void }) {
  const [darkMode, setDarkMode] = useState(false);
  const [fontStyle, setFontStyle] = useState("default");
  const [fontSize, setFontSize] = useState("md");
  const [dmSetting, setDmSetting] = useState("Everyone");
  const [tagSetting, setTagSetting] = useState(true);
  const [flashPrivacy, setFlashPrivacy] = useState("Everyone");
  const router = useRouter();

  // Load theme/UI preferences from localStorage on mount
  useEffect(() => {
    const theme = localStorage.getItem("theme");
    const font = localStorage.getItem("fontStyle");
    const size = localStorage.getItem("fontSize");
    if (theme) setDarkMode(theme === "dark");
    if (font) setFontStyle(font);
    if (size) setFontSize(size);
  }, []);

  // Persist theme/UI preferences to localStorage
  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
    localStorage.setItem("fontStyle", fontStyle);
    localStorage.setItem("fontSize", fontSize);
    document.documentElement.classList.toggle("dark", darkMode);
    document.body.setAttribute("data-font-style", fontStyle);
    document.body.setAttribute("data-font-size", fontSize);
  }, [darkMode, fontStyle, fontSize]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white dark:bg-card rounded-2xl p-6 w-full max-w-lg relative animate-pop shadow-xl border border-gray-100 dark:border-accent-cyan/20 overflow-y-auto max-h-[90vh]">
        <button onClick={onClose} className="absolute top-2 right-2 text-accent-pink text-2xl">&times;</button>
        <h2 className="text-2xl font-headline font-bold mb-6 text-accent-cyan flex items-center gap-2"><FaCog /> Settings</h2>
        <div className="flex flex-col gap-4">
          {/* Theme & UI Preferences */}
          <div className="rounded-xl bg-accent-cyan/10 p-4 flex flex-col gap-2 shadow">
            <div className="flex items-center gap-2 mb-2 font-bold text-accent-cyan"><FaPalette /> Theme & UI Preferences</div>
            <div className="flex items-center justify-between py-2">
              <span>Dark Mode</span>
              <label className="switch">
                <input type="checkbox" checked={darkMode} onChange={() => setDarkMode(v => !v)} />
                <span className="slider round"></span>
              </label>
            </div>
            <div className="flex items-center justify-between py-2">
              <span>Font Style</span>
              <select value={fontStyle} onChange={e => setFontStyle(e.target.value)} className="rounded-full px-3 py-1 border border-accent-cyan">
                <option value="default">Default</option>
                <option value="grotesk">Grotesk</option>
                <option value="mono">Mono</option>
              </select>
            </div>
            <div className="flex items-center justify-between py-2">
              <span>Font Size</span>
              <select value={fontSize} onChange={e => setFontSize(e.target.value)} className="rounded-full px-3 py-1 border border-accent-cyan">
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
              </select>
            </div>
          </div>
          {/* Privacy & Security */}
          <div className="rounded-xl bg-accent-cyan/10 p-4 flex flex-col gap-2 shadow">
            <div className="flex items-center gap-2 mb-2 font-bold text-accent-cyan"><FaLock /> Privacy & Security</div>
            <div className="flex items-center justify-between py-2">
              <span>Two-factor Authentication</span>
              <label className="switch">
                <input type="checkbox" disabled />
                <span className="slider round"></span>
              </label>
            </div>
            <div className="flex items-center justify-between py-2">
              <span>Change Password</span>
              <button className="text-accent-pink font-bold">Change</button>
            </div>
            <div className="flex items-center justify-between py-2">
              <span>Active Sessions</span>
              <button className="text-accent-pink font-bold">View</button>
            </div>
            <div className="flex items-center justify-between py-2">
              <span>Who can DM you?</span>
              <select value={dmSetting} onChange={e => setDmSetting(e.target.value)} className="rounded-full px-3 py-1 border border-accent-cyan">
                <option>Everyone</option>
                <option>Followers</option>
                <option>No one</option>
              </select>
            </div>
            <div className="flex items-center justify-between py-2">
              <span>Allow tags in posts</span>
              <label className="switch">
                <input type="checkbox" checked={tagSetting} onChange={() => setTagSetting(v => !v)} />
                <span className="slider round"></span>
              </label>
            </div>
            <div className="flex items-center justify-between py-2">
              <span>Who can see your Flashes/Drops?</span>
              <select value={flashPrivacy} onChange={e => setFlashPrivacy(e.target.value)} className="rounded-full px-3 py-1 border border-accent-cyan">
                <option>Everyone</option>
                <option>Followers</option>
                <option>No one</option>
              </select>
            </div>
          </div>
          {/* Account Management */}
          <div className="rounded-xl bg-accent-cyan/10 p-4 flex flex-col gap-2 shadow">
            <div className="flex items-center gap-2 mb-2 font-bold text-accent-cyan"><FaTrash /> Account Management</div>
            <button className="w-full py-2 rounded-full bg-red-100 text-red-600 font-bold hover:bg-red-200 transition-all">Deactivate Account</button>
            <button className="w-full py-2 rounded-full bg-red-200 text-red-800 font-bold hover:bg-red-300 transition-all">Delete Account</button>
            <button className="w-full py-2 rounded-full bg-accent-cyan text-primary font-bold hover:bg-accent-pink hover:text-white transition-all flex items-center justify-center gap-2 mt-2" onClick={handleLogout}><FaSignOutAlt /> Log Out</button>
          </div>
          {/* About FlixTrend */}
          <div className="rounded-xl bg-accent-cyan/10 p-4 flex flex-col gap-2 shadow">
            <div className="flex items-center gap-2 mb-2 font-bold text-accent-cyan"><FaInfoCircle /> About FlixTrend</div>
            <div className="flex items-center justify-between py-2">
              <span>App Version</span>
              <span className="font-mono">v1.0.0</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <a href="#" className="text-accent-cyan underline">Privacy Policy</a>
              <a href="#" className="text-accent-cyan underline">Terms & Conditions</a>
            </div>
            <div className="flex items-center justify-between py-2">
              <a href="#" className="text-accent-cyan underline">Contact / Support</a>
            </div>
          </div>
        </div>
        {/* Bottom nav for quick return */}
        <div className="flex justify-center gap-4 mt-8">
          <button onClick={onClose} className="px-6 py-2 rounded-full bg-accent-cyan text-primary font-bold hover:bg-accent-pink hover:text-white transition-all">Back to Profile</button>
          <a href="/home" className="px-6 py-2 rounded-full bg-accent-pink text-white font-bold hover:scale-105 hover:shadow-lg transition-all duration-200">Go to Feed</a>
        </div>
      </div>
      {/* Toggle switch styles */}
      <style jsx>{`
        .switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
        }
        .switch input { display: none; }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0; left: 0; right: 0; bottom: 0;
          background: #ccc;
          transition: .4s;
          border-radius: 24px;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background: #fff;
          transition: .4s;
          border-radius: 50%;
        }
        input:checked + .slider {
          background: #00fff7;
        }
        input:checked + .slider:before {
          transform: translateX(20px);
        }
      `}</style>
    </div>
  );
}

function FollowButton({ user, currentUser }: { user: any; currentUser: any }) {
  const [isFollowing, setIsFollowing] = useState(false);
  useEffect(() => {
    if (!currentUser) return;
    async function checkFollow() {
      const followersCol = collection(db, "users", user.uid, "followers");
      const followDocRef = doc(followersCol, currentUser.uid);
      const followDocSnap = await getDoc(followDocRef);
      setIsFollowing(followDocSnap.exists());
    }
    checkFollow();
  }, [user.uid, currentUser]);
  const handleFollow = async () => {
    if (!currentUser) return;
    const followersCol = collection(db, "users", user.uid, "followers");
    const followingCol = collection(db, "users", currentUser.uid, "following");
    const followDocRef = doc(followersCol, currentUser.uid);
    const followingDocRef = doc(followingCol, user.uid);
    if (isFollowing) {
      await deleteDoc(followDocRef);
      await deleteDoc(followingDocRef);
      setIsFollowing(false);
    } else {
      await setDoc(followDocRef, { followedAt: new Date() });
      await setDoc(followingDocRef, { followedAt: new Date() });
      setIsFollowing(true);
    }
  };
  return (
    <button className={`px-4 py-2 rounded-full font-bold ${isFollowing ? "bg-accent-cyan text-primary" : "bg-accent-pink text-white"}`} onClick={e => { e.preventDefault(); handleFollow(); }}>
      {isFollowing ? "Unfollow" : "Follow"}
    </button>
  );
}
