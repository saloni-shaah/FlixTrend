
"use client";
import React, { useEffect, useState, useRef } from "react";
import { auth } from "@/utils/firebaseClient";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getCountFromServer, getDocs, onSnapshot, orderBy, updateDoc, writeBatch, deleteDoc } from "firebase/firestore";
import { Cog, Palette, Lock, MessageCircle, LogOut, Camera, Star, Bell, Trash2, AtSign, Compass } from "lucide-react";
import { signOut, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { PostCard } from "@/components/PostCard";
import { FollowButton } from "@/components/FollowButton";
import { getFunctions, httpsCallable } from "firebase/functions";
import { FollowListModal } from "@/components/FollowListModal";

const db = getFirestore();
const functions = getFunctions();

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
      if (xhr.responseText) {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status === 200 && data.secure_url) {
          resolve(data.secure_url);
        } else {
          reject(new Error(data.error?.message || "Upload failed"));
        }
      } else {
        reject(new Error("Upload failed with empty response"));
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
  const [starredPosts, setStarredPosts] = useState<any[]>([]);
  const [showFollowList, setShowFollowList] = useState<null | 'followers' | 'following'>(null);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setFirebaseUser(user);
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (!userDocSnap.exists()) {
          await setDoc(userDocRef, {
            uid: user.uid,
            name: user.displayName || "",
            username: user.displayName ? user.displayName.replace(/\s+/g, "").toLowerCase() : "",
            email: user.email || "",
            avatar_url: `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${user.uid}`,
            bio: "",
            interests: "",
            createdAt: new Date(),
          });
        }
      } else {
        setFirebaseUser(null);
      }
    });

    return () => unsubAuth();
  }, []);

  useEffect(() => {
    async function fetchProfileData() {
        if (!firebaseUser) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const uid = firebaseUser.uid;

        const docRef = doc(db, "users", uid);
        const unsubProfile = onSnapshot(docRef, (docSnap) => {
          setProfile(docSnap.exists() ? docSnap.data() : null);
        });

        const postsQuery = query(collection(db, "posts"), where("userId", "==", uid), orderBy("createdAt", "desc"));
        const postsSnapshot = await getDocs(postsQuery);
        const userPostsData = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        setPostCount(userPostsData.length);
        setUserPosts(userPostsData);
        
        setLoading(false);

        return () => unsubProfile();
    }
    if (firebaseUser) fetchProfileData();
  }, [firebaseUser]);

  useEffect(() => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;

    const unsubFollowers = onSnapshot(collection(db, "users", uid, "followers"), snap => setFollowers(snap.size));
    const unsubFollowing = onSnapshot(collection(db, "users", uid, "following"), snap => setFollowing(snap.size));
    
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
  if (!firebaseUser) {
    return <div className="flex flex-col min-h-screen items-center justify-center text-red-400">Not logged in.</div>;
  }
  if (!profile) {
    return <div className="flex flex-col min-h-screen items-center justify-center text-red-400">Could not load profile.</div>;
  }
  
  const initials = profile.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || profile.username?.slice(0, 2).toUpperCase() || "U";

  return (
    <div className="flex flex-col min-h-screen pt-6 pb-24 px-2 md:px-8">
        <button
          className="fixed top-6 right-6 z-50 btn-glass-icon"
          onClick={() => setShowSettings(true)}
          aria-label="Settings"
        >
          <Cog />
        </button>
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
      <div className="mx-auto w-full max-w-2xl glass-card p-6 -mt-24 flex flex-col items-center">
        <div className="w-32 h-32 rounded-full bg-accent-cyan border-4 border-accent-pink shadow-fab-glow mb-2 overflow-hidden -mt-20">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-5xl text-white flex items-center justify-center h-full w-full">{initials}</span>
          )}
        </div>
        <h2 className="text-2xl font-headline font-bold mb-1 text-center">{profile.name}</h2>
        <p className="text-accent-cyan mb-2 text-center">@{profile.username || "username"}</p>
        <p className="text-gray-300 text-center mb-2">{profile.bio || "This is your bio. Edit it to tell the world about your vibes!"}</p>
        <div className="flex justify-center gap-8 my-4 w-full">
          <div className="flex flex-col items-center">
            <span className="font-bold text-lg text-accent-cyan">{postCount}</span>
            <span className="text-xs text-gray-500">Posts</span>
          </div>
          <button className="flex flex-col items-center" onClick={() => setShowFollowList('followers')}>
            <span className="font-bold text-lg text-accent-cyan">{followers}</span>
            <span className="text-xs text-gray-500 hover:underline">Followers</span>
          </button>
          <button className="flex flex-col items-center" onClick={() => setShowFollowList('following')}>
            <span className="font-bold text-lg text-accent-cyan">{following}</span>
            <span className="text-xs text-gray-500 hover:underline">Following</span>
          </button>
        </div>
        <div className="flex gap-2 flex-wrap justify-center mb-2">
          {profile.interests && profile.interests.split(",").map((interest: string) => (
            <span key={interest} className="px-3 py-1 rounded-full bg-white/10 text-accent-cyan text-xs font-bold">{interest.trim()}</span>
          ))}
        </div>
        <button className="btn-glass mt-4" onClick={() => setShowEdit(true)}>Edit Profile</button>
      </div>
      {/* Tabs */}
      <div className="flex justify-center gap-4 my-8">
        <button className={`px-4 py-2 rounded-full font-bold transition-colors ${activeTab === "posts" ? "bg-accent-cyan text-black" : "bg-white/10 text-white"}`} onClick={() => setActiveTab("posts")}>Posts</button>
        <button className={`px-4 py-2 rounded-full font-bold transition-colors ${activeTab === "starred" ? "bg-accent-cyan text-black" : "bg-white/10 text-white"}`} onClick={() => setActiveTab("starred")}>Starred</button>
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
        {activeTab === "starred" && (
            starredPosts.length > 0 ? (
                <div className="w-full max-w-xl flex flex-col gap-6">
                    {starredPosts.map((post) => (
                        <PostCard key={post.id} post={post} />
                    ))}
                </div>
            ) : (
                <div className="text-gray-400 text-center mt-16">
                    <div className="text-4xl mb-2"><Star /></div>
                    <div className="text-lg font-semibold">No starred posts</div>
                    <div className="text-sm">Your starred posts will appear here!</div>
                </div>
            )
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
    </div>
  );
}

function EditProfileModal({ profile, onClose }: { profile: any; onClose: () => void }) {
  const [form, setForm] = useState({
    name: profile.name || "",
    username: profile.username || "",
    bio: profile.bio || "",
    interests: profile.interests || "",
    avatar_url: profile.avatar_url || "",
    banner_url: profile.banner_url || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'avatar_url' | 'banner_url') => {
    if (e.target.files && e.target.files[0]) {
      setUploading(field);
      setUploadProgress(0);
      try {
        const url = await uploadToCloudinary(e.target.files[0], (p) => setUploadProgress(p));
        setForm((prev) => ({ ...prev, [field]: url || "" }));
      } catch (err: any) {
        setError(err.message);
      }
      setUploading(null);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-6 w-full max-w-md relative max-h-[90vh] flex flex-col"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">&times;</button>
        <h2 className="text-xl font-headline font-bold mb-4 text-accent-cyan">Edit Profile</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto pr-2">
          {/* Avatar and Banner */}
          <div className="relative h-24 mb-12">
            <div className="h-full w-full rounded-lg bg-white/10 overflow-hidden">
              {form.banner_url && <img src={form.banner_url} alt="Banner" className="w-full h-full object-cover"/>}
            </div>
            <button type="button" onClick={() => bannerInputRef.current?.click()} className="absolute bottom-1 right-1 btn-glass-icon w-8 h-8"><Camera size={16}/></button>
            <input type="file" ref={bannerInputRef} onChange={(e) => handleFileUpload(e, 'banner_url')} className="hidden" accept="image/*" />

            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full border-4 border-background bg-background">
              <div className="w-full h-full rounded-full overflow-hidden">
                {form.avatar_url && <img src={form.avatar_url} alt="Avatar" className="w-full h-full object-cover"/>}
              </div>
              <button type="button" onClick={() => avatarInputRef.current?.click()} className="absolute bottom-0 right-0 btn-glass-icon w-8 h-8"><Camera size={16}/></button>
              <input type="file" ref={avatarInputRef} onChange={(e) => handleFileUpload(e, 'avatar_url')} className="hidden" accept="image/*" />
            </div>
          </div>
          
          {(uploading || uploadProgress !== null) && (
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div className="bg-accent-cyan h-2.5 rounded-full" style={{width: `${uploadProgress || 0}%`}}></div>
              <p className="text-xs text-center mt-1">Uploading {uploading?.replace('_url','')}...</p>
            </div>
          )}

          <input
            type="text" name="name" placeholder="Full Name" className="input-glass w-full"
            value={form.name} onChange={handleChange} required />
          <input
            type="text" name="username" placeholder="Username" className="input-glass w-full"
            value={form.username} onChange={handleChange} required />
          <textarea
            name="bio" placeholder="Bio" className="input-glass w-full rounded-2xl" rows={3}
            value={form.bio} onChange={handleChange} />
          <input
            type="text" name="interests" placeholder="Interests (e.g., tech, music, art)" className="input-glass w-full"
            value={form.interests} onChange={handleChange} />
          
          {error && <div className="text-red-400 text-center">{error}</div>}
          {success && <div className="text-green-400 text-center">{success}</div>}
          
          <button
            type="submit" className="btn-glass bg-accent-cyan text-black mt-4"
            disabled={loading || !!uploading}>
            {loading ? "Saving..." : !!uploading ? "Uploading..." : "Save Changes"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function SettingsModal({ profile, firebaseUser, onClose }: { profile: any; firebaseUser: any; onClose: () => void }) {
  const [settings, setSettings] = useState({
    darkMode: false,
    accentColor: '#00F0FF',
    dmPrivacy: 'everyone',
    tagPrivacy: 'everyone',
    pushNotifications: true,
    emailNotifications: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Load initial settings from profile
    setSettings({
        darkMode: localStorage.getItem('theme') === 'dark',
        accentColor: profile.settings?.accentColor || '#00F0FF',
        dmPrivacy: profile.settings?.dmPrivacy || 'everyone',
        tagPrivacy: profile.settings?.tagPrivacy || 'everyone',
        pushNotifications: profile.settings?.pushNotifications ?? true,
        emailNotifications: profile.settings?.emailNotifications ?? false,
    });

    // Apply theme settings immediately
    document.documentElement.classList.toggle('dark', localStorage.getItem('theme') === 'dark');
    document.documentElement.style.setProperty('--accent-cyan', profile.settings?.accentColor || '#00F0FF');
    document.documentElement.style.setProperty('--brand-gold', profile.settings?.accentColor || '#FFB400');
  }, [profile]);
  
  const handleSettingChange = async (key: keyof typeof settings, value: any) => {
    setIsSaving(true);
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    if (key === 'darkMode') {
      document.documentElement.classList.toggle('dark', value);
      localStorage.setItem('theme', value ? 'dark' : 'light');
    }
    if (key === 'accentColor') {
      localStorage.setItem('accentColor', value);
      document.documentElement.style.setProperty('--accent-cyan', value);
      document.documentElement.style.setProperty('--brand-gold', value);
    }
    
    // Save to Firestore
    try {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        await updateDoc(userDocRef, {
            [`settings.${key}`]: value
        });
    } catch (error) {
        console.error("Failed to save settings:", error);
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-6 w-full max-w-lg relative max-h-[90vh] flex flex-col"
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">&times;</button>
          <h2 className="text-2xl font-headline font-bold mb-6 text-accent-cyan flex items-center gap-2"><Cog /> Settings</h2>
          
          <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4">
            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="flex items-center gap-2 mb-2 font-bold text-accent-cyan"><Palette /> Theme & UI</h3>
              <div className="flex items-center justify-between py-2">
                <span>Dark Mode</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={settings.darkMode} onChange={(e) => handleSettingChange('darkMode', e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-accent-cyan peer-checked:after:translate-x-full after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-cyan"></div>
                </label>
              </div>
              <div className="flex items-center justify-between py-2">
                  <span>Accent Color</span>
                  <input type="color" value={settings.accentColor} onChange={(e) => handleSettingChange('accentColor', e.target.value)} className="w-10 h-10 bg-transparent border-none rounded-full cursor-pointer"/>
              </div>
            </div>
            
            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="flex items-center gap-2 mb-2 font-bold text-accent-cyan"><Lock /> Privacy & Security</h3>
              <div className="flex items-center justify-between py-2">
                <span><MessageCircle className="inline-block mr-2"/> Who can DM you?</span>
                <select value={settings.dmPrivacy} onChange={(e) => handleSettingChange('dmPrivacy', e.target.value)} className="input-glass text-sm">
                  <option value="everyone">Everyone</option>
                  <option value="mutuals">Mutuals</option>
                  <option value="none">No one</option>
                </select>
              </div>
              <div className="flex items-center justify-between py-2">
                <span><AtSign className="inline-block mr-2"/> Who can tag you?</span>
                <select value={settings.tagPrivacy} onChange={(e) => handleSettingChange('tagPrivacy', e.target.value)} className="input-glass text-sm">
                  <option value="everyone">Everyone</option>
                  <option value="following">Following</option>
                  <option value="none">No one</option>
                </select>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="flex items-center gap-2 mb-2 font-bold text-accent-cyan"><Bell /> Notifications</h3>
              <div className="flex items-center justify-between py-2">
                <span>Push Notifications</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={settings.pushNotifications} onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-accent-cyan peer-checked:after:translate-x-full after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-cyan"></div>
                </label>
              </div>
              <div className="flex items-center justify-between py-2">
                <span>Email Notifications</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={settings.emailNotifications} onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-accent-cyan peer-checked:after:translate-x-full after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-cyan"></div>
                </label>
              </div>
            </div>
            
            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="flex items-center gap-2 mb-2 font-bold text-accent-cyan">Account</h3>
              <button className="btn-glass bg-red-500/20 text-red-400 hover:bg-red-500/40 hover:text-white w-full mt-4" onClick={() => setShowDeleteModal(true)}>
                  <Trash2 className="inline-block mr-2" /> Delete Account
              </button>
            </div>

            <button className="btn-glass bg-accent-pink/20 text-accent-pink hover:bg-accent-pink/40 hover:text-white w-full mt-4" onClick={handleLogout}>
              <LogOut className="inline-block mr-2" /> Log Out
            </button>
          </div>
        </motion.div>
      </div>
      {showDeleteModal && (
        <DeleteAccountModal 
            profile={profile}
            onClose={() => setShowDeleteModal(false)}
        />
      )}
    </>
  );
}

function DeleteAccountModal({ profile, onClose }: { profile: any, onClose: () => void }) {
    const [step, setStep] = useState(1);
    const [confirmationText, setConfirmationText] = useState("");
    const [credentials, setCredentials] = useState({ username: '', email: '', password: '' });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const deleteAccountCallable = httpsCallable(functions, 'deleteUserAccount');

    const handleCredentialsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleDelete = async () => {
        setError("");
        if (credentials.username.toLowerCase() !== profile.username.toLowerCase() || credentials.email.toLowerCase() !== profile.email.toLowerCase()) {
            setError("Username or email does not match.");
            return;
        }

        setLoading(true);
        const user = auth.currentUser;
        if (!user) {
            setError("You are not logged in.");
            setLoading(false);
            return;
        }

        try {
            // Re-authenticate user to confirm their identity
            const credential = EmailAuthProvider.credential(user.email!, credentials.password);
            await reauthenticateWithCredential(user, credential);
            
            // If re-authentication is successful, call the cloud function
            await deleteAccountCallable();
            
            alert("Account deleted successfully.");
            router.push('/signup'); // Redirect to signup page after deletion

        } catch (err: any) {
            console.error("Account deletion error:", err);
            setError(err.code === 'auth/wrong-password' ? "Incorrect password." : "An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };
    
    const isStep2Valid = confirmationText === 'delete my account';
    const isStep3Valid = credentials.username && credentials.email && credentials.password;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 w-full max-w-lg relative flex flex-col gap-4"
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">&times;</button>
                <h2 className="text-2xl font-headline font-bold text-red-500 flex items-center gap-2"><Trash2 /> Delete Account</h2>
                
                {error && <div className="p-3 bg-red-500/20 text-red-400 rounded-lg text-center">{error}</div>}

                {step === 1 && (
                    <div className="flex flex-col gap-4">
                        <p className="font-bold text-lg text-center">Are you absolutely sure?</p>
                        <p className="text-center text-gray-300">This action cannot be undone. This will permanently delete your account, posts, comments, chats, and all other associated data.</p>
                        <div className="flex justify-end gap-4 mt-4">
                            <button className="btn-glass" onClick={onClose}>Cancel</button>
                            <button className="btn-glass bg-red-500/80 text-white" onClick={() => setStep(2)}>I understand, proceed</button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="flex flex-col gap-4">
                        <p>To confirm, please type "<strong className="text-accent-cyan">delete my account</strong>" in the box below.</p>
                        <input 
                            type="text" 
                            className="input-glass w-full"
                            value={confirmationText}
                            onChange={(e) => setConfirmationText(e.target.value)}
                        />
                         <div className="flex justify-end gap-4 mt-4">
                            <button className="btn-glass" onClick={() => setStep(1)}>Back</button>
                            <button className="btn-glass bg-red-500/80 text-white" disabled={!isStep2Valid} onClick={() => setStep(3)}>Confirm & Proceed</button>
                        </div>
                    </div>
                )}
                
                {step === 3 && (
                    <div className="flex flex-col gap-4">
                        <p>For your security, please re-enter your account details to finalize the deletion.</p>
                        <input type="text" name="username" placeholder="Username" className="input-glass w-full" value={credentials.username} onChange={handleCredentialsChange} />
                        <input type="email" name="email" placeholder="Email" className="input-glass w-full" value={credentials.email} onChange={handleCredentialsChange} />
                        <input type="password" name="password" placeholder="Password" className="input-glass w-full" value={credentials.password} onChange={handleCredentialsChange} />
                        <div className="flex justify-end gap-4 mt-4">
                             <button className="btn-glass" onClick={() => setStep(2)}>Back</button>
                             <button 
                                className="btn-glass bg-red-900 text-white" 
                                disabled={!isStep3Valid || loading}
                                onClick={handleDelete}
                            >
                                {loading ? "Deleting..." : "Permanently Delete Account"}
                            </button>
                        </div>
                    </div>
                )}

            </motion.div>
        </div>
    )
}

    