
"use client";
import React, { useEffect, useState, useRef, Suspense } from "react";
import { auth } from "@/utils/firebaseClient";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getCountFromServer, getDocs, onSnapshot, orderBy, updateDoc, writeBatch, deleteDoc, arrayUnion, arrayRemove, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Cog, Palette, Lock, MessageCircle, LogOut, Camera, Star, Bell, Trash2, AtSign, Compass, MapPin, User, Tag, ShieldCheck, Music, Bookmark, Heart, Folder, Download, CheckCircle, Award, Mic, Crown, Zap, Rocket, Search, Pin, Phone, Mail, X } from "lucide-react";
import { signOut, EmailAuthProvider, reauthenticateWithCredential, RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider, linkWithCredential, AuthCredential, sendEmailVerification } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { PostCard } from "@/components/PostCard";
import { FollowButton } from "@/components/FollowButton";
import { getFunctions, httpsCallable } from "firebase/functions";
import { FollowListModal } from "@/components/FollowListModal";
import { getDownloadedPosts } from "@/utils/offline-db";
import { app } from "@/utils/firebaseClient";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { cn } from "@/lib/utils"


const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

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
      "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:pointer-events-none [&>svg]:size-4 [&>svg]:shrink-0",
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


declare global {
    interface Window {
        recaptchaVerifier?: RecaptchaVerifier;
        confirmationResult?: any;
    }
}

function CompleteProfileModal({ profile, onClose }: { profile: any, onClose: () => void }) {
    const [form, setForm] = useState({
        dob: profile.dob || "",
        gender: profile.gender || "",
        location: profile.location || "",
        accountType: profile.accountType || "user",
        phoneNumber: profile.phoneNumber || "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [verificationId, setVerificationId] = useState('');
    const [code, setCode] = useState('');
    const [step, setStep] = useState(profile.profileComplete ? 2 : 1);

    const setupRecaptcha = () => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible',
                'callback': (response: any) => {
                    // reCAPTCHA solved, allow signInWithPhoneNumber.
                }
            });
        }
    };
    
    const onSendCode = async () => {
        if (!form.phoneNumber) {
            setError("Please enter a valid phone number.");
            return;
        }
        setLoading(true);
        setError("");
        try {
            setupRecaptcha();
            const appVerifier = window.recaptchaVerifier!;
            const confirmationResult = await signInWithPhoneNumber(auth, form.phoneNumber, appVerifier);
            window.confirmationResult = confirmationResult;
            setVerificationId(confirmationResult.verificationId);
            setStep(3); // Move to code verification step
        } catch (err: any) {
             setError(err.message);
             console.error(err);
        }
        setLoading(false);
    };
    
    const onVerifyCode = async () => {
        if (!code) {
            setError("Please enter the verification code.");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const credential = PhoneAuthProvider.credential(verificationId, code);
            const user = auth.currentUser;
            if (user) {
                // Link the phone number to the existing user account
                await linkWithCredential(user, credential);
                // Now save all data
                await handleSubmit(true);
            } else {
                throw new Error("No user is signed in.");
            }
        } catch (err: any) {
            setError("Invalid verification code. Please try again.");
            console.error(err);
        }
        setLoading(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (isVerified: boolean = false) => {
        setLoading(true);
        setError("");
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("Not logged in");
            
            const docRef = doc(db, "users", user.uid);
            const dataToUpdate: any = { ...form, profileComplete: true };
            if (!isVerified) {
                // If we are skipping phone verification because it already exists
                delete dataToUpdate.phoneNumber;
            }
            await setDoc(docRef, dataToUpdate, { merge: true });
            onClose();
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
                className="glass-card p-6 w-full max-w-md relative flex flex-col"
            >
                 <div id="recaptcha-container"></div>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">&times;</button>
                <h2 className="text-xl font-headline font-bold mb-4 text-accent-cyan">Complete Your Profile</h2>
                
                {error && <div className="text-red-400 text-center mb-2">{error}</div>}
                
                {step === 1 && (
                    <div className="flex flex-col gap-4">
                        <p className="text-sm text-gray-300 mb-4">Help others get to know you better by adding a few more details!</p>
                        <input type="text" name="location" placeholder="Location (e.g., City, Country)" className="input-glass w-full" value={form.location} onChange={handleChange}/>
                        <input type="date" name="dob" placeholder="Date of Birth" className="input-glass w-full" value={form.dob} onChange={handleChange}/>
                        <select name="gender" className="input-glass w-full" value={form.gender} onChange={handleChange}>
                            <option value="" disabled>Select Gender...</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="non-binary">Non-binary</option>
                            <option value="other">Other</option>
                            <option value="prefer-not-to-say">Prefer not to say</option>
                        </select>
                        <select name="accountType" className="input-glass w-full" value={form.accountType} onChange={handleChange}>
                            <option value="user">I'm a User</option>
                            <option value="creator">I'm a Creator</option>
                        </select>
                        <button type="button" className="btn-glass bg-accent-cyan text-black mt-4" disabled={loading} onClick={() => handleSubmit(false)}>
                            {loading ? "Saving..." : "Save Details"}
                        </button>
                    </div>
                )}
                
                {step === 2 && (
                     <div className="flex flex-col gap-4">
                        <p className="text-sm text-gray-300 mb-4">Please enter and verify your phone number to secure your account.</p>
                        <input type="tel" name="phoneNumber" placeholder="+91 98765 43210" className="input-glass w-full" value={form.phoneNumber} onChange={handleChange} required />
                        <button type="button" className="btn-glass bg-accent-pink text-white mt-2" disabled={loading} onClick={onSendCode}>
                            {loading ? "Sending Code..." : "Send Verification Code"}
                        </button>
                    </div>
                )}
                
                {step === 3 && (
                    <div className="flex flex-col gap-4">
                        <p className="text-sm text-gray-300 mb-4">We've sent a code to ${`formData.phoneNumber`}. Please enter it below.</p>
                        <input type="text" name="code" placeholder="6-digit code" className="input-glass w-full" value={code} onChange={(e) => setCode(e.target.value)} required />
                        <button type="button" className="btn-glass bg-green-500 text-white mt-2" disabled={loading} onClick={onVerifyCode}>
                            {loading ? "Verifying..." : "Verify & Complete Profile"}
                        </button>
                         <button type="button" className="text-xs text-accent-cyan text-center mt-2" onClick={() => setStep(2)}>Change Number</button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

function UserPlaylists({ userId }: { userId: string }) {
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "playlists"), where("ownerId", "==", userId));
        const unsub = onSnapshot(q, (snapshot) => {
            const playlistsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Sort client-side
            playlistsData.sort((a:any, b:any) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));
            setPlaylists(playlistsData);
            setLoading(false);
        });
        return () => unsub();
    }, [userId]);

    if (loading) return <div className="text-gray-400 text-center mt-16 animate-pulse">Loading playlists...</div>
    
    if (playlists.length === 0) {
        return (
            <div className="text-gray-400 text-center mt-16">
                <div className="text-4xl mb-2"><Music /></div>
                <div className="text-lg font-semibold">No playlists yet</div>
                <div className="text-sm">Your created playlists will appear here.</div>
            </div>
        );
    }
    
    return (
      <div className="w-full max-w-xl flex flex-col gap-4">
        {playlists.map(playlist => (
          <div key={playlist.id} className="glass-card p-4 flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-accent-purple/20 flex items-center justify-center">
              <Music className="text-accent-purple" size={32} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-accent-cyan">${`playlist.name`}</h3>
              <p className="text-sm text-gray-400">${`playlist.songIds?.length || 0`} songs</p>
            </div>
          </div>
        ))}
      </div>
    );
}

function UserCollections({ userId }: { userId: string }) {
    const [collections, setCollections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCollection, setSelectedCollection] = useState<any | null>(null);

    useEffect(() => {
        const q = query(collection(db, "collections"), where("ownerId", "==", userId));
        const unsub = onSnapshot(q, (snapshot) => {
            const collectionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            collectionsData.sort((a:any, b:any) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));
            setCollections(collectionsData);
            setLoading(false);
        });
        return () => unsub();
    }, [userId]);

    if (loading) return <div className="text-gray-400 text-center mt-16 animate-pulse">Loading collections...</div>;

    if (selectedCollection) {
        return <CollectionDetailView collection={selectedCollection} onBack={() => setSelectedCollection(null)} />
    }

    if (collections.length === 0) {
        return (
            <div className="text-gray-400 text-center mt-16">
                <div className="text-4xl mb-2"><Bookmark /></div>
                <div className="text-lg font-semibold">No collections yet</div>
                <div className="text-sm">Save posts to a collection to see them here.</div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-xl grid grid-cols-2 md:grid-cols-3 gap-4">
            {collections.map(collectionItem => (
                <div key={collectionItem.id} className="glass-card rounded-lg overflow-hidden cursor-pointer" onClick={() => setSelectedCollection(collectionItem)}>
                    <div className="w-full aspect-square bg-accent-pink/20 flex items-center justify-center">
                        <Folder className="text-accent-pink" size={48} />
                    </div>
                    <div className="p-3">
                        <h3 className="font-bold text-accent-cyan truncate">${`collectionItem.name`}</h3>
                        <p className="text-xs text-gray-400">${`collectionItem.postIds?.length || 0`} posts</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

function CollectionDetailView({ collection, onBack }: { collection: any, onBack: () => void }) {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            if (!collection.postIds || collection.postIds.length === 0) {
                setLoading(false);
                return;
            }
            // Firestore 'in' queries are limited to 10 items. For a real app, pagination would be needed here.
            const postsQuery = query(collection(db, "posts"), where("__name__", "in", collection.postIds.slice(0, 10)));
            const postsSnap = await getDocs(postsQuery);
            setPosts(postsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        };
        fetchPosts();
    }, [collection]);

    return (
        <div className="w-full max-w-xl flex flex-col gap-6">
            <button onClick={onBack} className="btn-glass self-start">{"< Back to Collections"}</button>
            <h2 className="text-2xl font-bold text-accent-cyan">${`collection.name`}</h2>
            {loading && <p className="text-center text-gray-400">Loading posts...</p>}
            {!loading && posts.length === 0 && <p className="text-center text-gray-400">This collection is empty.</p>}
            {posts.map(post => <PostCard key={post.id} post={post} />)}
        </div>
    );
}

function UserDownloads() {
    const [downloadedPosts, setDownloadedPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadDownloads() {
            setLoading(true);
            const posts = await getDownloadedPosts();
            setDownloadedPosts(posts);
            setLoading(false);
        }
        loadDownloads();
    }, []);

    if (loading) return <div className="text-gray-400 text-center mt-16 animate-pulse">Loading downloads...</div>;

    if (downloadedPosts.length === 0) {
        return (
            <div className="text-gray-400 text-center mt-16">
                <div className="text-4xl mb-2"><Download /></div>
                <div className="text-lg font-semibold">No downloaded posts</div>
                <div className="text-sm">Download posts to view them offline.</div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-xl flex flex-col gap-6">
            {downloadedPosts.map(post => (
                <PostCard key={post.id} post={post} />
            ))}
        </div>
    );
}

function SquadPageContent() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [postCount, setPostCount] = useState(0);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'posts');
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [starredPosts, setStarredPosts] = useState<any[]>([]);
  const [showFollowList, setShowFollowList] = useState<null | 'followers' | 'following'>(null);
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
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
      alert(`Navigating to chat with ${`item.name || item.username`}`);
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
                 // CORRECTED LOGIC: Check if profile is truly incomplete before showing modal.
                 const isProfileActuallyComplete = data.profileComplete || (data.dob && data.gender && data.location);
                 if (!isProfileActuallyComplete) {
                    setShowCompleteProfile(true);
                 } else if (data.profileComplete === false) {
                    // If it's false but data exists, update it to true
                    updateDoc(userDocRef, { profileComplete: true });
                 }
            } else {
                 // Create profile if it doesn't exist
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
        
        getAllUsersWithFollowerCounts().then(setAllUsers);
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
  const isDeveloper = profile.email === 'next181489111@gmail.com';
  const isPremium = profile.isPremium && (!profile.premiumUntil || profile.premiumUntil.toDate() > new Date());


  return (
    <div className="flex flex-col w-full pb-24">
        {showFollowList && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setShowFollowList(null)} />}
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
                {profile.phoneNumber && <span className="flex items-center gap-1.5"><Phone size={12}/> {profile.phoneNumber}</span>}
                {profile.location && <span className="flex items-center gap-1.5"><MapPin size={12}/> {profile.location}</span>}
                {profile.gender && <span className="flex items-center gap-1.5"><User size={12}/> {profile.gender}</span>}
                {profile.interests && <span className="flex items-center gap-1.5"><Tag size={12}/> {profile.interests}</span>}
            </div>
        </div>

        <button className="btn-glass mt-6" onClick={() => setShowEdit(true)}>Edit Profile</button>
      </div>

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
                                <div className="text-xs text-gray-400">{item.type === 'user' ? `@${item.username}` : `${`item.members?.length || 0`} members`}</div>
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
    </div>
  );
}


export default function SquadPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SquadPageContent />
        </Suspense>
    );
}

function EditProfileModal({ profile, onClose }: { profile: any; onClose: () => void }) {
    const [form, setForm] = useState({
      name: profile.name || "",
      bio: profile.bio || "",
      interests: profile.interests || "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [uploading, setUploading] = useState<string | null>(null);

    const bannerInputRef = useRef<HTMLInputElement>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const [avatarPreview, setAvatarPreview] = useState(profile.avatar_url || null);
    const [bannerPreview, setBannerPreview] = useState(profile.banner_url || null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm({ ...form, [e.target.name]: e.target.value });
    };
  
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'avatar_url' | 'banner_url') => {
      const file = e.target.files?.[0];
      if (file) {
        setUploading(field);
        const previewUrl = URL.createObjectURL(file);
        if (field === 'avatar_url') {
            setAvatarPreview(previewUrl);
        } else {
            setBannerPreview(previewUrl);
        }

        try {
            const fileName = `${auth.currentUser!.uid}-${Date.now()}-${file.name}`;
            const storageRef = ref(storage, `user_uploads/${fileName}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            const userDocRef = doc(db, 'users', auth.currentUser!.uid);
            await updateDoc(userDocRef, { [field]: downloadURL });
            setSuccess(`${field === 'avatar_url' ? 'Profile picture' : 'Banner'} updated!`);

        } catch (err: any) {
            setError(err.message);
        }
        setUploading(null);
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
        await setDoc(docRef, { ...form }, { merge: true });
        setSuccess("Profile updated!");
        setTimeout(onClose, 1000);
      } catch (err: any) {
        setError(err.message);
      }
      setLoading(false);
    };
  
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-6 w-full max-w-md relative max-h-[90vh] flex flex-col"
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">&times;</button>
                <h2 className="text-xl font-headline font-bold mb-4 text-accent-cyan">Edit Profile</h2>
                
                <div className="flex-1 overflow-y-auto pr-2">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                      <div className="relative h-24 mb-12">
                        <button type="button" onClick={() => bannerInputRef.current?.click()} className="relative group h-full w-full rounded-lg bg-white/10 overflow-hidden">
                          {bannerPreview && <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover"/>}
                           <div className="absolute inset-0 w-full h-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera size={24} />
                           </div>
                        </button>
                        <input type="file" ref={bannerInputRef} onChange={(e) => handleFileChange(e, 'banner_url')} className="hidden" accept="image/*" />

                        <button type="button" onClick={() => avatarInputRef.current?.click()} className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full border-4 border-background bg-background group">
                          <div className="relative w-full h-full rounded-full overflow-hidden">
                            {avatarPreview && <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover"/>}
                             <div className="absolute inset-0 w-full h-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera size={24} />
                            </div>
                          </div>
                        </button>
                        <input type="file" ref={avatarInputRef} onChange={(e) => handleFileChange(e, 'avatar_url')} className="hidden" accept="image/*" />
                      </div>
                      
                      {uploading && (
                        <div className="text-center text-accent-cyan text-sm">Uploading ${`uploading === 'avatar_url' ? 'profile picture' : 'banner'`}...</div>
                      )}

                      <input
                        type="text" name="name" placeholder="Full Name" className="input-glass w-full"
                        value={form.name} onChange={handleChange} required />
                      
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
                        {loading ? "Saving..." : "Save Changes"}
                      </button>
                    </form>
                </div>
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
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
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

  const handleResendVerification = async () => {
    if (firebaseUser) {
        setResendStatus('sending');
        try {
            await sendEmailVerification(firebaseUser);
            setResendStatus('sent');
            setTimeout(() => setResendStatus('idle'), 3000);
        } catch (error) {
            console.error("Error resending verification email:", error);
            setResendStatus('idle');
        }
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
                <Link href="/premium">
                    <div className="w-full p-4 rounded-2xl bg-gradient-to-r from-accent-purple via-accent-pink to-brand-gold cursor-pointer mb-4">
                        <h3 className="font-headline font-bold text-white">Manage Premium</h3>
                        <p className="text-xs text-white/80">Upgrade or manage your subscription.</p>
                    </div>
                </Link>
            </div>

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
                {firebaseUser?.emailVerified ? (
                    <div className="flex items-center justify-between py-2 text-green-400">
                        <span className="flex items-center gap-2"><Mail /> Email Verified</span>
                        <CheckCircle />
                    </div>
                ) : (
                    <div className="flex items-center justify-between py-2">
                        <span className="flex items-center gap-2 text-yellow-400"><Mail /> Email not verified</span>
                        <button 
                            className="btn-glass text-xs"
                            onClick={handleResendVerification}
                            disabled={resendStatus !== 'idle'}
                        >
                            {resendStatus === 'sending' ? 'Sending...' : resendStatus === 'sent' ? 'Sent!' : 'Resend Email'}
                        </button>
                    </div>
                )}
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
                  <option value="everyone">Following</option>
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

    