"use client";
import React, { useState, useEffect } from "react";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { auth, app } from "@/utils/firebaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles } from 'lucide-react';

const db = getFirestore(app);

export function CreatePostPrompt({ onGoLive }: { onGoLive: (title: string) => void }) {
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
      </div>
  );
}
