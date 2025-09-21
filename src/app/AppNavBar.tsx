
"use client";
import { usePathname, useRouter } from "next/navigation";
import { useAppState } from "@/utils/AppStateContext";
import { Home, Users, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getFirestore, collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { auth, app } from "@/utils/firebaseClient";
import { getDownloadedPosts } from "@/utils/offline-db";

const db = getFirestore(app);

// Custom SVG Icon for Scope
const ScopeIcon = ({ className }: { className?: string }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
            <linearGradient id="scopeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--accent-pink)" />
                <stop offset="100%" stopColor="var(--accent-cyan)" />
            </linearGradient>
        </defs>
        <path d="M12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4Z" stroke="url(#scopeGradient)" strokeWidth="1.5"/>
        <path d="M15 12L10.5 9.11325V14.8868L15 12Z" fill="url(#scopeGradient)"/>
        <g style={{ transformOrigin: 'center' }}>
            <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="10s" repeatCount="indefinite" />
            <path d="M12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6ZM12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12C16 14.2091 14.2091 16 12 16Z" fill="currentColor" fillOpacity="0.3"/>
        </g>
    </svg>
);


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
      <NavButton href="/scope" icon={ScopeIcon} label="Scope" />
      <NavButton href="/squad" icon={Users} label="Squad" />
      <NavButton href="/signal" icon={MessageSquare} label="Signal" hasNotification={hasUnreadMessages} />
    </nav>
  );
}
