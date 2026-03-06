'use client';

import { useState } from 'react';
import { getAuth } from 'firebase/auth';
import { doc, updateDoc, getFirestore } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function CompleteProfilePage() {
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const auth = getAuth();
  const db = getFirestore();

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          name,
          dob,
          bio,
          interests: interests.split(',').map(item => item.trim()),
          location,
        });
      }
      router.push('/signup/account-type');
    } catch (error: any) {
      setError(error.message || 'Failed to complete profile.');
    } finally {
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
        <h2 className="text-3xl font-headline font-bold text-accent-pink mb-2 text-center">Complete Your Profile</h2>
        <form onSubmit={handleCompleteProfile} className="flex flex-col gap-4">
          <Input
            type="text"
            placeholder="Full Name"
            className="input-glass w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
          />
          <Input
            type="date"
            placeholder="Date of Birth"
            className="input-glass w-full"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            required
            disabled={loading}
          />
          <Textarea
            placeholder="Bio"
            className="input-glass w-full"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            disabled={loading}
          />
          <Input
            type="text"
            placeholder="Interests (comma-separated)"
            className="input-glass w-full"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            disabled={loading}
          />
          <Input
            type="text"
            placeholder="Location"
            className="input-glass w-full"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={loading}
          />
          <motion.button
            whileHover={{ scale: loading ? 1 : 1.05 }}
            whileTap={{ scale: loading ? 1 : 0.95 }}
            type="submit"
            className="btn-glass mt-2 bg-accent-pink/80 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save & Continue'}
          </motion.button>
        </form>
        {error && <div className="text-red-400 text-center animate-bounce mt-2">{error}</div>}
      </motion.div>
    </div>
  );
}
