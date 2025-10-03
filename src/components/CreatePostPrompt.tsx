
"use client";
import React, { useState, useEffect } from "react";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { auth, app } from "@/utils/firebaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles } from 'lucide-react';

const db = getFirestore(app);

const PremiumUpgradeBanner = () => (
    <Link href="/premium">
        <motion.div 
            className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-accent-purple via-accent-pink to-brand-gold cursor-pointer"
            whileHover={{ scale: 1.02 }}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                     <Sparkles className="text-white" />
                    <div>
                        <h4 className="font-headline font-bold text-white">Go Premium!</h4>
                        <p className="text-xs text-white/80">Unlock blue tick, an ad-free experience & more.</p>
                    </div>
                </div>
                <span className="px-4 py-2 rounded-full bg-white/20 text-white font-bold text-sm">Upgrade</span>
            </div>
        </motion.div>
    </Link>
);


export function CreatePostPrompt({ isPremium, onGoLive }: { isPremium: boolean, onGoLive: (title: string) => void }) {
  const [userProfile, setUserProfile] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }
      }
    });
    return () => unsub();
  }, []);

  return (
      <div className="w-full max-w-xl mb-6">
        <button className="glass-card p-4 text-center w-full" onClick={() => router.push('/create')}>
          <h3 className="font-bold text-lg">Flix Your Fit by dropping a post</h3>
          <span className="text-accent-cyan hover:underline text-sm">
            click here to make a post
          </span>
        </button>
        {!isPremium && <PremiumUpgradeBanner />}
      </div>
  );
}
