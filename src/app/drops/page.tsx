'use client';
import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { app } from '@/utils/firebaseClient';
import { useRouter } from 'next/navigation';
import { Sparkles, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

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


export default function DropsPage() {
  const [prompt, setPrompt] = useState<{ id: string; text: string; expiresAt: Date } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchPrompt = async () => {
      setLoading(true);
      const now = new Date();
      const q = query(
        collection(db, "dropPrompts"),
        where("expiresAt", ">", now),
        orderBy("expiresAt", "desc"),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const promptDoc = querySnapshot.docs[0];
        const data = promptDoc.data();
        setPrompt({ 
            id: promptDoc.id, 
            text: data.text, 
            expiresAt: data.expiresAt.toDate() 
        });
      } else {
        setPrompt(null);
      }
      setLoading(false);
    };

    fetchPrompt();
  }, []);

  const handleCreateDrop = () => {
    if (prompt) {
      router.push(`/create/drop?promptId=${prompt.id}`);
    }
  };

  if (loading) {
      return <div className="container mx-auto p-4 text-center">Loading...</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]"
    >
      {prompt ? (
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
      ) : (
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No active drop right now.</h1>
          <p className="text-gray-400">Check back later for the next daily prompt!</p>
        </div>
      )}
    </motion.div>
  );
}
