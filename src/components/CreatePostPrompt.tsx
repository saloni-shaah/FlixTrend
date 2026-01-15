'use client';
import React, { useState, useEffect } from 'react';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { auth, app } from '@/utils/firebaseClient';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Image as ImageIcon,
  Video as VideoIcon,
  Mic,
  Plus,
  AlignLeft,
  BarChart3,
  Zap,
} from 'lucide-react';

const db = getFirestore(app);

export function CreatePostPrompt() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }
      }
    });
    return () => unsub();
  }, []);

  const initials =
    userProfile?.name
      ?.split(' ')
      .map((n: string) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ||
    userProfile?.username?.slice(0, 2).toUpperCase() ||
    'U';

  return (
    <div className="w-full max-w-xl mb-8 glass-card p-4 flex flex-col">
      <div className="flex items-start w-full">
        <div className="w-12 h-12 rounded-full bg-accent-cyan flex-shrink-0 mr-4">
          {userProfile?.avatar_url ? (
            <img
              src={userProfile.avatar_url}
              alt="avatar"
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <span className="text-xl text-white flex items-center justify-center h-full w-full">
              {initials}
            </span>
          )}
        </div>
        <textarea
          className="flex-1 bg-transparent text-lg placeholder-gray-400 focus:outline-none resize-none"
          placeholder="flix yor fit by dropping a post"
          rows={2}
          onClick={() => router.push('/create')}
        />
      </div>
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-glass-border">
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/create?type=text')}
            className="flex items-center gap-2 text-gray-400 hover:text-accent-cyan transition-colors"
          >
            <AlignLeft size={20} />
            <span className="text-sm font-medium">Text</span>
          </button>
          <button
            onClick={() => router.push('/create?type=media')}
            className="flex items-center gap-2 text-gray-400 hover:text-accent-pink transition-colors"
          >
            <ImageIcon size={20} />
            <span className="text-sm font-medium">Media</span>
          </button>
          <button
            onClick={() => router.push('/create?type=poll')}
            className="flex items-center gap-2 text-gray-400 hover:text-brand-saffron transition-colors"
          >
            <BarChart3 size={20} />
            <span className="text-sm font-medium">Poll</span>
          </button>
          <button
            onClick={() => router.push('/create?type=flash')}
            className="flex items-center gap-2 text-gray-400 hover:text-yellow-400 transition-colors"
          >
            <Zap size={20} />
            <span className="text-sm font-medium">Flash</span>
          </button>
        </div>
      </div>
    </div>
  );
}
