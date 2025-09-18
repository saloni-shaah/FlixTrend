"use client";
import { usePathname, useRouter } from "next/navigation";
import { useAppState } from "@/utils/AppStateContext";
import { Home, Search, Users, MessageSquare, Bell } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getFirestore, collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { auth, app } from "@/utils/firebaseClient";
import { getDownloadedPosts } from "@/utils/offline-db";

const db = getFirestore(app);

function NavButton({ href, icon: Icon, label, hasNotification }: { href: string; icon: React.ElementType; label: string; hasNotification?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const isActive = pathname === href;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(href);
  };

  return (
    <a href={href} onClick={handleClick} className="relative flex flex-col items-center gap-1 px-2 py-1 text-muted-foreground hover:text-foreground transition-colors">
      <Icon className={`${isActive ? 'text-brand-gold' : ''}`} />
      <span className={`text-xs font-semibold ${isActive ? 'text-foreground' : ''}`}>{label}</span>
      {isActive && (
        <motion.div 
          className="h-[2px] w-full bg-brand-gold rounded-full mt-1"
          layoutId="nav-underline"
        />
      )}
      {hasNotification && (
        <div className="absolute top-0 right-1 w-2 h-2 bg-accent-pink rounded-full" />
      )}
    </a>
  );
}

export default function AppNavBar() {
  const pathname = usePathname();
  const { isCalling } = useAppState();
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [hasUnreadNotifs, setHasUnreadNotifs] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [downloadedPosts, setDownloadedPosts] = useState<any[]>([]);
  const currentUser = auth.currentUser;
  const router = useRouter();
  
  // Listener for unread messages
  useEffect(() => {
    if (!currentUser) {
        setHasUnreadMessages(false);
        return;
    }

    const fetchMutualsAndListen = async () => {
        const followingRef = collection(db, "users", currentUser.uid, "following");
        const followersRef = collection(db, "users", currentUser.uid, "followers");
        const [followingSnap, followersSnap] = await Promise.all([getDocs(followingRef), getDocs(followersRef)]);
        
        const followingIds = followingSnap.docs.map(doc => doc.id);
        const followersIds = followersSnap.docs.map(doc => doc.id);
        const mutualUids = Array.from(new Set([...followingIds, ...followersIds]));

        if (mutualUids.length === 0) return;
        
        const unsubscribers = mutualUids.map(uid => {
            const chatId = [currentUser.uid, uid].sort().join("_");
            const q = query(
                collection(db, "chats", chatId, "messages"),
                where("sender", "!=", currentUser.uid)
            );
            return onSnapshot(q, (snapshot) => {
                const hasUnread = snapshot.docs.some(doc => {
                    const data = doc.data();
                    // Check if readBy exists and if the current user's UID is NOT in it
                    return !data.readBy || !data.readBy.includes(currentUser.uid)
                });
                if (hasUnread) {
                    setHasUnreadMessages(true);
                }
            });
        });
        return () => unsubscribers.forEach(unsub => unsub());
    };
    
    const groupsQuery = query(collection(db, "groups"), where("members", "array-contains", currentUser.uid));
    const unsubGroups = onSnapshot(groupsQuery, (groupsSnap) => {
        groupsSnap.docs.forEach(groupDoc => {
             const q = query(
                collection(db, "chats", groupDoc.id, "messages"),
                where("sender", "!=", currentUser.uid)
            );
             onSnapshot(q, (snapshot) => {
                const hasUnread = snapshot.docs.some(doc => {
                    const data = doc.data();
                    return !data.readBy || !data.readBy.includes(currentUser.uid)
                });
                if (hasUnread) {
                    setHasUnreadMessages(true);
                }
            });
        })
    });
    
    fetchMutualsAndListen();
    return () => unsubGroups();

  }, [currentUser]);

  // Listener for general notifications
  useEffect(() => {
    if (!currentUser) {
        setHasUnreadNotifs(false);
        return;
    }
    const q = query(collection(db, "notifications", currentUser.uid, "user_notifications"), where("read", "==", false));
    const unsub = onSnapshot(q, (snapshot) => {
        setHasUnreadNotifs(!snapshot.empty);
    });
    return () => unsub();
  }, [currentUser]);

  // Listener for offline status
    useEffect(() => {
        const goOnline = () => setIsOffline(false);
        const goOffline = async () => {
            setIsOffline(true);
            const posts = await getDownloadedPosts();
            setDownloadedPosts(posts);
            // When going offline, redirect to the downloads tab on the squad page.
            if (currentUser) {
                router.push('/squad?tab=downloads');
            }
        };

        window.addEventListener('online', goOnline);
        window.addEventListener('offline', goOffline);

        // Initial check
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            goOffline();
        }

        return () => {
            window.removeEventListener('online', goOnline);
            window.removeEventListener('offline', goOffline);
        };
    }, [currentUser, router]);


  const hideNav = pathname === "/login" || pathname === "/signup" || pathname === "/" || isCalling || pathname === "/guest" || pathname === "/about";

  if (hideNav) return null;

  if (isOffline) {
    return (
        <div className="fixed bottom-0 left-0 w-full z-40 bg-yellow-500/80 backdrop-blur-lg text-black font-bold p-4 text-center">
            You are offline. Showing downloaded content.
        </div>
    );
  }

  return (
    <nav className="fixed bottom-0 left-0 w-full z-40 bg-background/50 backdrop-blur-lg border-t border-glass-border flex justify-around items-center py-2">
      <NavButton href="/home" icon={Home} label="VibeSpace" />
      <NavButton href="/scope" icon={Search} label="Scope" />
      <NavButton href="/squad" icon={Users} label="Squad" />
      <NavButton href="/signal" icon={MessageSquare} label="Signal" hasNotification={hasUnreadMessages} />
    </nav>
  );
}
