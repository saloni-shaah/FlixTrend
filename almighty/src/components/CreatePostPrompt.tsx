
"use client";
import React, { useState, useEffect } from "react";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { auth, app } from "@/utils/firebaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ImageIcon, BarChart3, Radio, Zap } from 'lucide-react';
import { Sparkles } from 'lucide-react';
import CreatePostModal from "../app/home/CreatePostModal";

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
  const [modalOpen, setModalOpen] = useState(false);
  const [initialPostType, setInitialPostType] = useState<'text' | 'media' | 'poll' | 'flash' | 'live'>('text');

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

  const openModal = (type: 'text' | 'media' | 'poll' | 'flash' | 'live') => {
      setInitialPostType(type);
      setModalOpen(true);
  }

  return (
      <div className="w-full max-w-xl mb-6">
        <div className="glass-card p-4 text-center w-full">
          <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-accent-cyan">
                  {userProfile?.avatar_url ? (
                      <img src={userProfile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  ): <div className="w-full h-full bg-black/20"/>}
              </div>
              <button className="flex-1 text-left text-gray-400" onClick={() => openModal('text')}>
                  What's on your mind, @{userProfile?.username || 'user'}?
              </button>
          </div>
            <div className="flex justify-around items-center mt-4 pt-4 border-t border-glass-border">
                <button onClick={() => openModal('media')} className="flex items-center gap-2 text-sm font-semibold text-accent-green hover:text-accent-green/80"><ImageIcon size={20}/> Photo/Video</button>
                <button onClick={() => openModal('flash')} className="flex items-center gap-2 text-sm font-semibold text-accent-pink hover:text-accent-pink/80"><Zap size={20}/> Flash</button>
                <button onClick={() => openModal('poll')} className="flex items-center gap-2 text-sm font-semibold text-accent-cyan hover:text-accent-cyan/80"><BarChart3 size={20}/> Poll</button>
                <button onClick={() => openModal('live')} className="flex items-center gap-2 text-sm font-semibold text-red-400 hover:text-red-300"><Radio size={20}/> Go Live</button>
            </div>
        </div>
        {!isPremium && <PremiumUpgradeBanner />}
        {modalOpen && <CreatePostModal open={modalOpen} onClose={() => setModalOpen(false)} initialType={initialPostType} onGoLive={onGoLive} />}
      </div>
  );
}
