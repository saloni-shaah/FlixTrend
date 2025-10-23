
"use client";
import { usePathname, useRouter } from "next/navigation";
import { useAppState } from "@/utils/AppStateContext";
import { MessageSquare, ArrowLeft, Flame } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getFirestore, collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { auth, app, requestNotificationPermission } from "@/utils/firebaseClient";
import { getDownloadedPosts } from "@/utils/offline-db";

const db = getFirestore(app);

// Custom SVG for VibeSpace (Home)
const VibeSpaceIcon = ({ className }: { className?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <g>
      <path d="M3 8L12 3L21 8V19C21 19.5523 20.5523 20 20 20H4C3.44772 20 3 19.5523 3 19V8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M8 20V14H16V20" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M12 11L12 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </g>
  </svg>
);

// Custom SVG for Squad (Profile)
const SquadIcon = ({ className }: { className?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20.59 22C20.59 18.13 16.74 15 12 15C7.26 15 3.41 18.13 3.41 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Custom animated circular SVG for Scope
const ScopeIcon = ({ className }: { className?: string }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
            <linearGradient id="scopeGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--accent-pink)" />
                <stop offset="100%" stopColor="var(--accent-cyan)" />
            </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="12" fill="url(#scopeGradient)" className="group-hover:opacity-80 transition-opacity">
             <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
        </circle>
        <path d="M9.5 16V8L16.5 12L9.5 16Z" fill="white"/>
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
    <a href={href} onClick={handleClick} className="relative flex flex-col items-center gap-1 px-2 py-1 text-muted-foreground hover:text-foreground transition-colors group">
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
  const { activeCall, selectedChat, setSelectedChat, isScopeVideoPlaying } = useAppState();
  const [hasMounted, setHasMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setHasMounted(true);

    const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    const goOnline = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        goOffline();
    }

    return () => {
        window.removeEventListener('resize', checkIsMobile);
        window.removeEventListener('online', goOnline);
        window.removeEventListener('offline', goOffline);
    };
  }, []);

  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [hasUnreadNotifs, setHasUnreadNotifs] = useState(false);
  const currentUser = auth.currentUser;
  
  useEffect(() => {
    if (currentUser) {
      requestNotificationPermission(currentUser.uid);
    }
  }, [currentUser]);

  // Listener for unread messages
  useEffect(() => {
    if (!currentUser || isOffline) {
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

  }, [currentUser, isOffline]);

  // Listener for general notifications
  useEffect(() => {
    if (!currentUser || isOffline) {
        setHasUnreadNotifs(false);
        return;
    }
    const q = query(collection(db, "users", currentUser.uid, "notifications"), where("read", "==", false));
    const unsub = onSnapshot(q, (snapshot) => {
        setHasUnreadNotifs(!snapshot.empty);
    });
    return () => unsub();
  }, [currentUser, isOffline]);


  const isAuthPage = pathname === "/login" || pathname === "/signup" || pathname === "/";
  const isSpecialPage = pathname === "/guest" || pathname === "/about";
  const hideNav = isAuthPage || isSpecialPage || !!activeCall;
  const hideForScopeVideo = pathname.startsWith('/scope') && isScopeVideoPlaying;


  if (!hasMounted || hideNav || hideForScopeVideo) return null;

  const isSignalChatView = isMobile && pathname === '/signal' && selectedChat;

  return (
    <>
      {isOffline && (
        <div className="fixed bottom-0 left-0 w-full z-50 bg-yellow-500/90 backdrop-blur-md text-black font-bold p-2 text-center text-sm">
            You are offline. Some features may be limited.
        </div>
      )}
      <nav className={`fixed left-0 w-full z-40 bg-background/50 backdrop-blur-lg border-t border-glass-border flex justify-around items-center py-2 transition-all ${isOffline ? 'bottom-8' : 'bottom-0'}`}>
        {isSignalChatView ? (
          <button onClick={() => setSelectedChat(null)} className="flex flex-col items-center gap-1 px-2 py-1 text-foreground">
            <ArrowLeft />
            <span className="text-xs font-semibold">Back</span>
          </button>
        ) : (
          <>
            <NavButton href="/home" icon={VibeSpaceIcon} label="VibeSpace" />
            <NavButton href="/scope" icon={ScopeIcon} label="Scope" />
            <NavButton href="/squad" icon={SquadIcon} label="Squad" />
            <NavButton href="/signal" icon={MessageSquare} label="Signal" hasNotification={hasUnreadMessages} />
          </>
        )}
      </nav>
    </>
  );
}
