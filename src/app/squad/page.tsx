"use client";
import React, { useEffect, useState } from "react";
import { auth } from "@/utils/firebaseClient";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, onSnapshot, deleteDoc } from "firebase/firestore";
import { FaCog } from "react-icons/fa";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
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
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [postCount, setPostCount] = useState(0);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(user => {
      if (user) {
        setFirebaseUser(user);
      } else {
        router.push('/login');
      }
    });
    return () => unsubAuth();
  }, [router]);

  useEffect(() => {
    if (!firebaseUser) return;

    const fetchProfileData = async () => {
      setLoading(true);
      const uid = firebaseUser.uid;
      
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      setProfile(docSnap.exists() ? docSnap.data() : null);

      const postsQuery = query(collection(db, "posts"), where("userId", "==", uid));
      const postsSnapshot = await getDocs(postsQuery);
      setPostCount(postsSnapshot.size);
      setUserPosts(postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      
      const usersSnap = await getDocs(collection(db, "users"));
      setAllUsers(usersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() })).filter(u => u.uid !== uid));
      
      setLoading(false);
    };
    
    fetchProfileData();

    const unsubFollowers = onSnapshot(collection(db, "users", firebaseUser.uid, "followers"), snap => setFollowers(snap.size));
    const unsubFollowing = onSnapshot(collection(db, "users", firebaseUser.uid, "following"), snap => setFollowing(snap.size));
    
    return () => {
      unsubFollowers();
      unsubFollowing();
    };
  }, [firebaseUser, showEdit]);

  if (loading || !profile) {
    return <div className="flex flex-col min-h-screen items-center justify-center text-[var(--accent-cyan)]">Loading your squad...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen pt-6 pb-24 px-2 md:px-8">
      <button
        className="fixed top-6 right-6 z-50 bg-black/50 text-white p-3 rounded-full shadow-lg hover:scale-110 hover:text-[var(--accent-cyan)] transition-all duration-200"
        onClick={() => setShowSettings(true)}
        aria-label="Settings"
      >
        <FaCog size={20} />
      </button>

      <div className="relative h-48 w-full rounded-2xl overflow-hidden mb-8 glass-card">
        {profile.banner_url ? (
          <img src={profile.banner_url} alt="banner" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-[var(--accent-pink)]/40 to-[var(--accent-cyan)]/40" />
        )}
      </div>

      <div className="mx-auto w-full max-w-2xl glass-card p-6 -mt-24 flex flex-col items-center">
        <div className="w-32 h-32 rounded-full bg-[var(--accent-cyan)] border-4 border-[var(--accent-pink)] shadow-lg mb-2 overflow-hidden -mt-20">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-5xl text-white flex items-center justify-center h-full w-full">👤</span>
          )}
        </div>
        <h2 className="text-2xl font-headline font-bold mb-1 text-center text-white">{profile.name}</h2>
        <p className="text-[var(--accent-cyan)] mb-2 text-center">@{profile.username}</p>
        <p className="text-gray-300 text-center mb-4">{profile.bio || "This is your bio. Edit it to tell the world about your vibes!"}</p>
        <div className="flex justify-center gap-8 my-4 w-full">
          <div className="flex flex-col items-center">
            <span className="font-bold text-lg text-white">{postCount}</span>
            <span className="text-xs text-gray-400">Posts</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-lg text-white">{followers}</span>
            <span className="text-xs text-gray-400">Followers</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-lg text-white">{following}</span>
            <span className="text-xs text-gray-400">Following</span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-center mb-2">
          {profile.interests && profile.interests.split(",").map((interest: string) => (
            <span key={interest} className="px-3 py-1 rounded-full bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] text-xs font-bold">{interest.trim()}</span>
          ))}
        </div>
        <button className="px-6 py-2 rounded-full bg-[var(--accent-pink)] text-white font-bold pulse-glow mt-4" onClick={() => setShowEdit(true)}>Edit Profile</button>
      </div>

      <div className="flex justify-center gap-4 my-8">
        <button className={`px-4 py-2 rounded-full font-bold transition-colors ${activeTab === "posts" ? "bg-[var(--accent-cyan)] text-black" : "bg-black/30 text-white"}`} onClick={() => setActiveTab("posts")}>Posts</button>
        <button className={`px-4 py-2 rounded-full font-bold transition-colors ${activeTab === "trends" ? "bg-[var(--accent-cyan)] text-black" : "bg-black/30 text-white"}`} onClick={() => setActiveTab("trends")}>Trends</button>
        <button className={`px-4 py-2 rounded-full font-bold transition-colors ${activeTab === "drops" ? "bg-[var(--accent-cyan)] text-black" : "bg-black/30 text-white"}`} onClick={() => setActiveTab("drops")}>Drops</button>
      </div>

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
         {activeTab !== "posts" && (
            <div className="text-gray-400 text-center mt-16">
              <div className="text-4xl mb-2">🚧</div>
              <div className="text-lg font-semibold">Coming Soon!</div>
            </div>
          )}
      </div>
      
      <div className="mt-16 w-full max-w-2xl mx-auto">
        <h3 className="text-xl font-headline text-white neon-glow">Discover Users</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {allUsers.map((user) => (
              <Link key={user.uid} href={`/squad/${user.uid}`} className="block">
                <div className="glass-card flex items-center gap-4 rounded-xl p-4 hover:border-[var(--accent-pink)]/50 transition-all cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[var(--accent-pink)] to-[var(--accent-cyan)] flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <span>{user.name ? user.name[0] : "U"}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-headline text-white">{user.name}</div>
                    <div className="text-xs text-gray-400">@{user.username}</div>
                  </div>
                  <FollowButton user={user} currentUser={firebaseUser} />
                </div>
              </Link>
            ))}
          </div>
      </div>
      
      {showEdit && <EditProfileModal profile={profile} onClose={() => setShowEdit(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
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
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
      if (e.target.files && e.target.files[0]) {
          setUploading(true);
          setUploadProgress(0);
          const url = await uploadToCloudinary(e.target.files[0], setUploadProgress);
          if (url) {
              setForm(f => ({...f, [`${type}_url`]: url}));
          }
          setUploading(false);
      }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not logged in");
      const docRef = doc(db, "users", user.uid);
      await setDoc(docRef, { ...form }, { merge: true });
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-card rounded-2xl p-6 w-full max-w-md relative animate-pop">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 text-2xl">&times;</button>
        <h2 className="text-xl font-headline font-bold mb-4 text-[var(--accent-cyan)]">Edit Profile</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-h-[80vh] overflow-y-auto pr-2">
          <input type="text" name="name" placeholder="Full Name" className="input-style" value={form.name} onChange={handleChange} required />
          <input type="text" name="username" placeholder="Username" className="input-style" value={form.username} onChange={handleChange} required />
          <textarea name="bio" placeholder="Bio" className="input-style rounded-2xl min-h-[80px]" value={form.bio} onChange={handleChange} />
          <input type="number" name="age" placeholder="Age" className="input-style" value={form.age} onChange={handleChange} />
          <input type="tel" name="phone" placeholder="Phone Number" className="input-style" value={form.phone} onChange={handleChange} />
          <input type="text" name="interests" placeholder="Interests (comma separated)" className="input-style" value={form.interests} onChange={handleChange} />
          
          <div>
              <label className="text-sm font-medium text-gray-400">Profile Picture</label>
              <input type="file" accept="image/*" onChange={e => handleFileChange(e, 'avatar')} className="input-style file:text-[var(--accent-pink)] file:font-bold" />
              {form.avatar_url && <img src={form.avatar_url} alt="avatar" className="w-24 h-24 object-cover rounded-full mt-2" />}
          </div>
          <div>
              <label className="text-sm font-medium text-gray-400">Banner Image</label>
              <input type="file" accept="image/*" onChange={e => handleFileChange(e, 'banner')} className="input-style file:text-[var(--accent-cyan)] file:font-bold" />
              {form.banner_url && <img src={form.banner_url} alt="banner" className="w-full h-24 object-cover rounded-lg mt-2" />}
          </div>

          {uploading && <div className="w-full bg-gray-700 rounded-full h-2.5"><div className="bg-[var(--accent-cyan)] h-2.5 rounded-full" style={{width: `${uploadProgress || 0}%`}}></div></div>}
          {error && <div className="text-red-400 text-center mt-2">{error}</div>}
          
          <button type="submit" className="btn-primary mt-4" disabled={loading || uploading}>
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
         <style jsx>{`
            .input-style {
                width: 100%;
                padding: 0.75rem 1rem;
                background-color: rgba(0,0,0,0.4);
                color: white;
                border: 2px solid var(--accent-cyan);
                transition: all 0.3s;
                border-radius: 9999px;
            }
            .input-style:focus {
                outline: none;
                border-color: var(--accent-pink);
                box-shadow: 0 0 0 2px var(--accent-pink);
            }
            .btn-primary {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 0.75rem 1.5rem;
                border-radius: 9999px;
                background-color: var(--accent-pink);
                color: white;
                font-weight: bold;
                transition: all 0.3s;
            }
            .btn-primary:hover {
                transform: scale(1.05);
                box-shadow: 0 0 10px var(--accent-pink);
            }
        `}</style>
      </div>
    </div>
  );
}

function SettingsModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-card rounded-2xl p-6 w-full max-w-lg relative animate-pop">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 text-2xl">&times;</button>
        <h2 className="text-2xl font-headline font-bold mb-6 text-[var(--accent-cyan)] flex items-center gap-2"><FaCog /> Settings</h2>
        <div className="flex flex-col gap-4">
            <button className="w-full py-2 rounded-full bg-red-500/80 text-white font-bold hover:bg-red-500 transition-all">Delete Account</button>
            <button className="w-full py-2 rounded-full bg-[var(--accent-pink)] text-white font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2 mt-2" onClick={handleLogout}>Log Out</button>
        </div>
      </div>
    </div>
  );
}
function FollowButton({ user, currentUser }: { user: any; currentUser: any }) {
    const [isFollowing, setIsFollowing] = useState(false);
  
    useEffect(() => {
      if (!currentUser) return;
      const unsub = onSnapshot(doc(db, "users", user.uid, "followers", currentUser.uid), (doc) => {
        setIsFollowing(doc.exists());
      });
      return () => unsub();
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
      } else {
        await setDoc(followDocRef, { followedAt: new Date() });
        await setDoc(followingDocRef, { followedAt: new Date() });
      }
    };
  
    return (
      <button 
        className={`px-4 py-1 rounded-full font-bold text-xs ${isFollowing ? "bg-[var(--accent-cyan)] text-black" : "bg-[var(--accent-pink)] text-white"}`} 
        onClick={(e) => { e.preventDefault(); handleFollow(); }}>
        {isFollowing ? "Unfollow" : "Follow"}
      </button>
    );
  }
