'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getFirestore, collection, query, where, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth, app } from '@/utils/firebaseClient';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Sparkles, Clock, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { PostCard } from '@/components/PostCard'; // We'll reuse PostCard
import { VibeSpaceLoader } from '@/components/VibeSpaceLoader';

const db = getFirestore(app);

function CountdownTimer({ expiryDate }: { expiryDate: Date }) {
  const [timeLeft, setTimeLeft] = useState(expiryDate.getTime() - Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(expiryDate.getTime() - Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [expiryDate]);

  if (timeLeft <= 0) {
    return <span className="font-mono text-red-500">Prompt Expired</span>;
  }

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return (
    <div className="flex items-center gap-2 text-sm text-gray-400">
      <Clock size={16} />
      <span className="font-mono">{`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`}</span>
    </div>
  );
}

function DropPageContent() {
  const [prompt, setPrompt] = useState<{ id: string; text: string; expiresAt: Date } | null>(null);
  const [drops, setDrops] = useState<any[]>([]);
  const [userHasPosted, setUserHasPosted] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [user, authLoading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
        router.replace('/login');
        return;
    }

    const fetchPromptAndDrops = async () => {
        setLoading(true);
        const now = new Date();
        const q = query(
            collection(db, "dropPrompts"),
            where("expiresAt", ">", now),
            orderBy("expiresAt", "desc"),
            limit(1)
        );
        const promptSnapshot = await getDocs(q);

        if (!promptSnapshot.empty) {
            const promptDoc = promptSnapshot.docs[0];
            const data = promptDoc.data();
            const currentPrompt = { 
                id: promptDoc.id, 
                text: data.text, 
                expiresAt: data.expiresAt.toDate() 
            };
            setPrompt(currentPrompt);

            // Check if user has already posted for this prompt
            const dropQuery = query(
                collection(db, 'drops'), 
                where('userId', '==', user.uid),
                where('promptId', '==', currentPrompt.id)
            );
            const dropSnap = await getDocs(dropQuery);
            const hasPosted = !dropSnap.empty;
            setUserHasPosted(hasPosted);

            // If user has posted, fetch all drops for the feed
            if (hasPosted) {
                const allDropsQuery = query(
                    collection(db, 'drops'), 
                    where('promptId', '==', currentPrompt.id),
                    orderBy('createdAt', 'desc')
                );
                const allDropsSnap = await getDocs(allDropsQuery);
                setDrops(allDropsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            }
        } else {
            setPrompt(null);
        }
        setLoading(false);
    };

    fetchPromptAndDrops();

  }, [user, authLoading, router]);

  const handleCreateDrop = () => {
    if (prompt) {
      router.push(`/create/drop?promptId=${prompt.id}`);
    }
  };

  if (loading || authLoading) {
    return <VibeSpaceLoader />;
  }

  if (!prompt) {
     return (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]"
        >
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">No active drop right now.</h1>
              <p className="text-gray-400">Check back later for the next daily prompt!</p>
            </div>
        </motion.div>
      );
  }

  // "Posted" state: Show the feed of drops
  if (userHasPosted) {
    return (
         <div className="container mx-auto p-4 max-w-2xl">
            <div className="w-full glass-card p-6 mb-8 flex flex-col items-center text-center">
                <div className="flex items-center gap-3 text-lg font-bold text-accent-cyan mb-3">
                    <Sparkles className="h-6 w-6" />
                    <h1 className="font-headline">Daily Drop</h1>
                </div>
                <p className="text-white/90 text-xl">{prompt.text}</p>
                 <CountdownTimer expiryDate={prompt.expiresAt} />
            </div>

            <div className="flex flex-col gap-6">
                {drops.length > 0 ? (
                    drops.map(drop => <PostCard key={drop.id} post={drop} collectionName="drops" />)
                ) : (
                     <div className="text-center text-gray-400 p-8 glass-card">
                        <p>No drops have been submitted yet. Be the first!</p>
                    </div>
                )}
            </div>
        </div>
    );
  }

  // "Unposted" state: Show the prompt and create button
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]"
    >
      <div className="w-full max-w-2xl glass-card p-8 flex flex-col items-center text-center">
        <div className="flex items-center gap-3 text-2xl font-bold text-accent-cyan mb-3">
          <Sparkles className="h-7 w-7" />
          <h1 className="font-headline">Daily Drop</h1>
        </div>
        <p className="text-white/90 mb-4 text-xl md:text-2xl">{prompt.text}</p>
        <CountdownTimer expiryDate={prompt.expiresAt} />
        <button
          onClick={handleCreateDrop}
          className="btn-glass bg-accent-pink/90 font-bold py-3 px-8 rounded-full transition-transform hover:scale-105 mt-6 text-lg"
        >
          Create Your Drop
        </button>
      </div>
    </motion.div>
  );
}


export default function DropPage() {
    return (
        <Suspense fallback={<VibeSpaceLoader />}>
            <DropPageContent />
        </Suspense>
    )
}
