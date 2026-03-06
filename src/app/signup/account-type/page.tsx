'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel
} from "@/components/ui/select";
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Users as UsersIcon, Brush, Gamepad2, GraduationCap, Popcorn } from "lucide-react";

const categories = [
    { id: 'daily', name: 'Daily', icon: <UsersIcon className="w-4 h-4 mr-2"/>, sub: ['Vlogs', 'Moments', 'Travel', 'Self'] },
    { id: 'creative', name: 'Creative', icon: <Brush className="w-4 h-4 mr-2"/>, sub: ['Art', 'Photos', 'Design', 'Writing'] },
    { id: 'play', name: 'Play', icon: <Gamepad2 className="w-4 h-4 mr-2"/>, sub: ['Gaming', 'Challenges', 'Comedy', 'Reactions'] },
    { id: 'learn', name: 'Learn', icon: <GraduationCap className="w-4 h-4 mr-2"/>, sub: ['Tips', 'Tech', 'Study', 'Explainers'] },
    { id: 'culture', name: 'Culture', icon: <Popcorn className="w-4 h-4 mr-2"/>, sub: ['Music', 'Movies', 'Trends', 'Community'] },
];

export default function AccountTypePage() {
  const [creatorType, setCreatorType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const auth = getAuth();
  const db = getFirestore();

  const handleContinue = async () => {
    if (!creatorType) {
      setError('Please select your creator type.');
      return;
    }
    
    const user = auth.currentUser;
    if (!user) {
        setError('You must be logged in to continue.');
        router.push('/login');
        return;
    }

    setLoading(true);
    setError('');

    try {
      const userDocRef = doc(db, 'users', user.uid);
      // Update the creatorType, but don't mark profile as complete yet.
      await updateDoc(userDocRef, {
        creatorType: creatorType,
      });
      // THE FIX: Redirect to the next step in the signup process.
      router.push('/signup/avatar-banner');
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card p-8 w-full max-w-md flex flex-col gap-6"
      >
        <h2 className="text-3xl font-headline font-bold text-accent-pink mb-2 text-center">What kind of creator are you?</h2>
        <p className="text-center text-gray-400 -mt-4 mb-4">Select the category that best describes your content.</p>
        
        <Select onValueChange={setCreatorType} value={creatorType}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a creator type..." />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectGroup key={category.id}>
                <SelectLabel>{category.name}</SelectLabel>
                <SelectItem value={category.name.toLowerCase()} className="font-bold">
                  <div className="flex items-center">{category.icon} Mix of All {category.name}</div>
                </SelectItem>
                {category.sub.map(subType => (
                  <SelectItem key={subType} value={subType.toLowerCase()}>
                    {subType}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>

        <motion.button
          whileHover={{ scale: loading ? 1 : 1.05 }}
          whileTap={{ scale: loading ? 1 : 0.95 }}
          onClick={handleContinue}
          className="btn-glass mt-4 bg-accent-cyan/80 text-black disabled:opacity-50"
          disabled={loading || !creatorType}
        >
          {loading ? 'Saving...' : 'Continue'}
        </motion.button>
        
        {error && <div className="text-red-400 text-center animate-bounce mt-2">{error}</div>}
      </motion.div>
    </div>
  );
}
