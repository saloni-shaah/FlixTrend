"use client";
import React, { useEffect, useState, useRef } from "react";
import { auth } from "@/utils/firebaseClient";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getCountFromServer, getDocs, deleteDoc, onSnapshot } from "firebase/firestore";
import { FaCog, FaPalette, FaLock, FaUserShield, FaCommentDots, FaMobileAlt, FaTrash, FaSignOutAlt, FaInfoCircle } from "react-icons/fa";
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

    async function fetchProfileData() {
      setLoading(true);
      const uid = firebaseUser.uid;
      
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      setProfile(docSnap.exists() ? docSnap.data() : null);

      const postsQuery = query(collection(db, "posts"), where("userId", "==", uid));
      const postsSnapshot = await getDocs(postsQuery);
      setPostCount(postsSnapshot.size);
      setUserPosts(postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      
      const followersSnap = await getDocs(collection(db, "users", uid, "followers"));
      setFollowers(followersSnap.size);
      
      const followingSnap = await getDocs(collection(db, "users", uid, "following"));
      setFollowing(followingSnap.size);

      const usersSnap = await getDocs(collection(db, "users"));
      setAllUsers(usersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() })).filter(u => u.uid !== uid));
      
      setLoading(false);
    }
    
    fetchProfileData();

    const unsubFollowers = onSnapshot(collection(db, "users", firebaseUser.uid, "followers"), snap => setFollowers(snap.size));
    const unsubFollowing = onSnapshot(collection(db, "users", firebaseUser.uid, "following"), snap => setFollowing(snap.size));
    
    return () => {
        unsubFollowers();
        unsubFollowing();
    };

  }, [firebaseUser, showEdit]);


  if (loading || !profile) {
    return <div className="flex flex-col min-h-screen items-center justify-center text-accent-cyan">Loading your squad...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen pt-6 pb-24 px-2 md:px-8 bg-background">
      <button
        className="fixed top-6 right-6 z-50 bg-card/80 text-foreground p-3 rounded-full shadow-lg hover:scale-110 transition-all duration-200"
        onClick={() => setShowSettings(true)}
        aria-label="Settings"
      >
        <FaCog size={20} />
      </button>

      <div className="relative h-48 w-full rounded-2xl overflow-hidden mb-8">
        {profile.banner_url ? (
          <img src={profile.banner_url} alt="banner" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-accent-pink/40 to-accent-cyan/40" />
        )}
      </div>

      <div className="mx-auto w-full max-w-2xl bg-card rounded-2xl shadow-lg p-6 -mt-24 flex flex-col items-center border border-accent-cyan/20">
        <div className="w-32 h-32 rounded-full bg-accent-cyan border-4 border-accent-pink shadow-fab-glow mb-2 overflow-hidden -mt-20">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-5xl text-white flex items-center justify-center h-full w-full">👤</span>
          )}
        </div>
        <h2 className="text-2xl font-headline font-bold mb-1 text-center">{profile.name}</h2>
        <p className="text-accent-cyan mb-2 text-center">@{profile.username}</p>
        <p className="text-muted-foreground text-center mb-4">{profile.bio || "This is your bio. Edit it to tell the world about your vibes!"}</p>
        <div className="flex justify-center gap-8 my-4 w-full">
          <div className="flex flex-col items-center">
            <span className="font-bold text-lg">{postCount}</span>
            <span className="text-xs text-muted-foreground">Posts</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-lg">{followers}</span>
            <span className="text-xs text-muted-foreground">Followers</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-lg">{following}</span>
            <span className="text-xs text-muted-foreground">Following</span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-center mb-2">
          {profile.interests && profile.interests.split(",").map((interest: string) => (
            <span key={interest} className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-bold">{interest.trim()}</span>
          ))}
        </div>
        <button className="px-6 py-2 rounded-full bg-accent-pink text-white font-bold hover:scale-105 hover:shadow-lg transition-all duration-200 mt-4" onClick={() => setShowEdit(true)}>Edit Profile</button>
      </div>

      <div className="flex justify-center gap-4 my-8">
        <button className={`px-4 py-2 rounded-full font-bold ${activeTab === "posts" ? "bg-accent-cyan text-background" : "bg-card text-foreground"}`} onClick={() => setActiveTab("posts")}>Posts</button>
        <button className={`px-4 py-2 rounded-full font-bold ${activeTab === "trends" ? "bg-accent-cyan text-background" : "bg-card text-foreground"}`} onClick={() => setActiveTab("trends")}>Trends</button>
        <button className={`px-4 py-2 rounded-full font-bold ${activeTab === "drops" ? "bg-accent-cyan text-background" : "bg-card text-foreground"}`} onClick={() => setActiveTab("drops")}>Drops</button>
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
            <div className="text-muted-foreground text-center mt-16">
              <div className="text-4xl mb-2">🪐</div>
              <div className="text-lg font-semibold">No posts yet</div>
              <div className="text-sm">Your posts will appear here!</div>
            </div>
          )
        )}
         {activeTab !== "posts" && (
            <div className="text-muted-foreground text-center mt-16">
              <div className="text-4xl mb-2">🚧</div>
              <div className="text-lg font-semibold">Coming Soon!</div>
            </div>
          )}
      </div>
      
      <div className="mt-16 w-full max-w-2xl mx-auto">
        <h3 className="text-xl font-headline text-accent-cyan">Discover Users</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {allUsers.map((user) => (
              <Link key={user.uid} href={`/squad/${user.uid}`} className="block">
                <div className="flex items-center gap-4 rounded-xl p-4 shadow border border-border hover:bg-card/80 transition-all cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-accent-pink to-accent-cyan flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <span>{user.name ? user.name[0] : "U"}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-headline text-foreground">{user.name}</div>
                    <div className="text-xs text-muted-foreground">@{user.username}</div>
                  </div>
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
          setUploadProgress(null);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-card rounded-2xl p-6 w-full max-w-md relative animate-pop shadow-xl border border-border">
        <button onClick={onClose} className="absolute top-2 right-2 text-muted-foreground text-2xl">&times;</button>
        <h2 className="text-xl font-headline font-bold mb-4 text-accent-cyan">Edit Profile</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-h-[80vh] overflow-y-auto pr-2">
          <input type="text" name="name" placeholder="Full Name" className="input-style" value={form.name} onChange={handleChange} required />
          <input type="text" name="username" placeholder="Username" className="input-style" value={form.username} onChange={handleChange} required />
          <textarea name="bio" placeholder="Bio" className="input-style" value={form.bio} onChange={handleChange} />
          <input type="number" name="age" placeholder="Age" className="input-style" value={form.age} onChange={handleChange} />
          <input type="tel" name="phone" placeholder="Phone Number" className="input-style" value={form.phone} onChange={handleChange} />
          <input type="text" name="interests" placeholder="Interests (comma separated)" className="input-style" value={form.interests} onChange={handleChange} />
          
          <div>
              <label className="text-sm font-medium text-muted-foreground">Profile Picture</label>
              <input type="file" accept="image/*" onChange={e => handleFileChange(e, 'avatar')} className="input-style" />
              {form.avatar_url && <img src={form.avatar_url} alt="avatar" className="w-24 h-24 object-cover rounded-full mt-2" />}
          </div>
          <div>
              <label className="text-sm font-medium text-muted-foreground">Banner Image</label>
              <input type="file" accept="image/*" onChange={e => handleFileChange(e, 'banner')} className="input-style" />
              {form.banner_url && <img src={form.banner_url} alt="banner" className="w-full h-24 object-cover rounded-lg mt-2" />}
          </div>

          {uploading && <div className="w-full bg-secondary rounded-full h-2.5"><div className="bg-accent-cyan h-2.5 rounded-full" style={{width: `${uploadProgress || 0}%`}}></div></div>}
          {error && <div className="text-red-400 text-center mt-2">{error}</div>}
          
          <button type="submit" className="btn-primary mt-4" disabled={loading || uploading}>
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-card rounded-2xl p-6 w-full max-w-lg relative animate-pop shadow-xl border border-border">
        <button onClick={onClose} className="absolute top-2 right-2 text-muted-foreground text-2xl">&times;</button>
        <h2 className="text-2xl font-headline font-bold mb-6 text-accent-cyan flex items-center gap-2"><FaCog /> Settings</h2>
        <div className="flex flex-col gap-4">
            <button className="w-full py-2 rounded-full bg-red-800/50 text-red-300 font-bold hover:bg-red-800/70 transition-all">Delete Account</button>
            <button className="w-full py-2 rounded-full bg-accent-pink text-white font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2 mt-2" onClick={handleLogout}><FaSignOutAlt /> Log Out</button>
        </div>
      </div>
    </div>
  );
}

// Add some shared styles to avoid repetition
const styles = `
    .input-style {
        width: 100%;
        padding: 0.75rem 1rem;
        border-radius: 9999px;
        background-color: hsla(var(--card) / 0.5);
        color: hsl(var(--foreground));
        border: 2px solid hsl(var(--accent-cyan), 0.3);
        transition: all 0.3s;
    }
    .input-style:focus {
        outline: none;
        border-color: hsl(var(--accent-pink));
        box-shadow: 0 0 0 2px hsl(var(--accent-pink), 0.5);
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
        filter: brightness(1.1);
    }
`;

if (typeof window !== 'undefined') {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
}
