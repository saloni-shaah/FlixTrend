
"use client";
import "regenerator-runtime/runtime";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { getFirestore, collection, query, orderBy, onSnapshot, limit, startAfter, getDocs } from "firebase/firestore";
import { app } from "@/utils/firebaseClient";
import AdBanner from "@/components/AdBanner";
import { VibeSpaceLoader } from "@/components/VibeSpaceLoader";
import { GuestPostCard } from "@/components/GuestPostCard";
import Link from "next/link";
import { FlixTrendLogo } from "@/components/FlixTrendLogo";
import { Search, Bot, Mic } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';


const db = getFirestore(app);
const POSTS_PER_PAGE = 2;

export default function GuestPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const feedEndRef = useRef<HTMLDivElement>(null);
  const observer = useRef<IntersectionObserver>();
  const [isClient, setIsClient] = useState(false);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!listening && transcript) {
      setSearchTerm(transcript);
      resetTranscript();
    }
  }, [listening, transcript, resetTranscript]);


  const fetchMorePosts = useCallback(async () => {
      if (!lastVisible || !hasMore || loadingMore) return;
      setLoadingMore(true);

      const next = query(
          collection(db, "posts"),
          orderBy("createdAt", "desc"),
          startAfter(lastVisible),
          limit(POSTS_PER_PAGE)
      );

      const documentSnapshots = await getDocs(next);
      const nextBatch = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];

      setPosts(prevPosts => [...prevPosts, ...nextBatch]);
      setLastVisible(lastDoc);
      setLoadingMore(false);
      setHasMore(documentSnapshots.docs.length === POSTS_PER_PAGE);
  }, [lastVisible, hasMore, loadingMore]);


  useEffect(() => {
    const q = query(
        collection(db, "posts"), 
        orderBy("createdAt", "desc"), 
        limit(POSTS_PER_PAGE)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const firstBatch = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const lastDoc = snapshot.docs[snapshot.docs.length - 1];
        
        setPosts(firstBatch);
        setLastVisible(lastDoc);
        setHasMore(snapshot.docs.length === POSTS_PER_PAGE);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching posts:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

   useEffect(() => {
    if (searchTerm) return; // Don't fetch more if searching
    if (loading) return;

    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchMorePosts();
        }
      },
      { threshold: 1.0 }
    );

    const currentRef = feedEndRef.current;
    if (currentRef) {
      observer.current.observe(currentRef);
    }

    return () => {
      if (currentRef && observer.current) {
        observer.current.unobserve(currentRef);
      }
    };
  }, [loading, hasMore, loadingMore, searchTerm, fetchMorePosts]);
  
  const handleVoiceSearch = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      SpeechRecognition.startListening();
    }
  };


  // Filtered posts for search
  const filteredPosts = searchTerm.trim()
    ? posts.filter(
        (post) =>
          (post.content && post.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (post.username && post.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (post.hashtags && post.hashtags.some((h: string) => h.toLowerCase().includes(searchTerm.toLowerCase())))
      )
    : posts;

  if (!browserSupportsSpeechRecognition && isClient) {
      console.log("Browser doesn't support speech recognition.");
  }


  return (
    <div className="flex flex-col w-full">
      {/* Navbar for Guest */}
       <nav className="w-full flex justify-between items-center px-8 py-4 bg-black/70 border-b border-accent-cyan/20 fixed top-0 left-0 z-50 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-3">
          <FlixTrendLogo size={40} />
          <span className="font-headline text-2xl text-accent-cyan font-bold tracking-wide">FlixTrend (Guest)</span>
        </Link>
        <div className="flex gap-6 items-center">
          <Link href="/signup" className="px-5 py-2 rounded-full bg-accent-pink text-white font-bold shadow-fab-glow hover:scale-105 transition-all">Sign Up</Link>
          <Link href="/login" className="px-5 py-2 rounded-full border-2 border-accent-cyan text-accent-cyan font-bold bg-black/30 hover:bg-accent-cyan hover:text-primary transition-all">Log In</Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="w-full max-w-2xl mx-auto pt-24">
        <div className="text-center mb-8 p-4 glass-card">
            <h1 className="text-3xl font-headline font-bold text-accent-cyan">Welcome to the VibeSpace</h1>
            <p className="text-gray-300 mt-2">You're viewing as a guest. <Link href="/login" className="text-accent-pink underline">Log in or sign up</Link> to join the conversation!</p>
        </div>

        {/* Search Bar */}
        <div className="flex justify-center items-center mb-6 w-full">
            <div className="input-glass w-full flex items-center px-4">
              <button
                  onClick={handleVoiceSearch}
                  className={`p-1 rounded-full transition-colors text-gray-400 hover:text-brand-gold ${listening ? 'animate-pulse bg-red-500/50' : ''}`}
                  aria-label="Voice search"
                  disabled={isClient && !browserSupportsSpeechRecognition}
              >
                  <Mic size={20} />
              </button>
              <div className="w-px h-6 bg-glass-border mx-3"></div>
               <input
                type="text"
                className="flex-1 bg-transparent py-3 text-lg font-body focus:outline-none"
                placeholder={listening ? "Listening..." : "Search posts..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus={false}
              />
              <button className="p-2 rounded-full text-brand-gold hover:bg-brand-gold/10">
                <Search />
              </button>
            </div>
        </div>


        <section className="flex-1 flex flex-col items-center">
          {loading ? (
            <VibeSpaceLoader />
          ) : (
            <div className="w-full max-w-xl flex flex-col gap-6">
              {filteredPosts.map((post, index) => (
                <React.Fragment key={post.id}>
                  <GuestPostCard post={post} />
                  {(index + 1) % 2 === 0 && <AdBanner key={`ad-${post.id}`} />}
                </React.Fragment>
              ))}

              {!searchTerm && <div ref={feedEndRef} className="h-10 w-full" />}

                {loadingMore && !searchTerm && (
                  <div className="flex justify-center my-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-cyan"></div>
                  </div>
                )}
                
                {!hasMore && !searchTerm && (
                  <div className="text-center text-gray-500 my-8">
                    <p>You've reached the end! Sign up to see more.</p>
                  </div>
                )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
