'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  getAuth,
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
} from 'firebase/auth';
import { doc, getFirestore, writeBatch, serverTimestamp, Timestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const auth = getAuth();
  const db = getFirestore();
  const functions = getFunctions();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      // Step 1: Check if email or username are already taken.
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      if (signInMethods.length > 0) {
        throw new Error('This email is already in use.');
      }

      const checkUsername = httpsCallable(functions, 'checkUsername');
      const result = await checkUsername({ username });
      if ((result.data as { exists: boolean }).exists) {
        throw new Error('This username is already taken.');
      }

      // Step 2: Create the user in Firebase Authentication.
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Step 3: Create all user documents in a single, atomic batch.
      const batch = writeBatch(db);

      // Document 1: The user's public profile in /users/{uid}
      const userDocRef = doc(db, 'users', user.uid);
      const premiumUntil = new Date();
      premiumUntil.setMonth(premiumUntil.getMonth() + 1);

      batch.set(userDocRef, {
        email: user.email,
        username: username,
        provider: 'email',
        createdAt: serverTimestamp(),
        profileComplete: false,
        accolades: [],
        isPremium: true,
        premiumUntil: Timestamp.fromDate(premiumUntil)
      });

      // Document 2: The unique username lock in /usernames/{username}
      const usernameDocRef = doc(db, 'usernames', username.toLowerCase());
      batch.set(usernameDocRef, { uid: user.uid });

      // Commit the batch.
      await batch.commit();

      // Step 4: Success - navigate to the next page.
      router.push('/signup/phone-verification');

    } catch (error: any) {
      // Step 5: Handle any errors, including the robust cleanup.
      const user = auth.currentUser;
      
      setError(error.message || 'An unexpected error occurred.');

      if (user) {
        try {
          const deleteUserAccount = httpsCallable(functions, 'deleteUserAccount');
          await deleteUserAccount(); 
          setError(error.message + " (Your incomplete account has been safely removed. Please try again.)");
        } catch (cleanupError: any) {
          setError("A critical error occurred. Please contact support.");
          console.error("CRITICAL: Failed to clean up orphaned user account: ", user.uid, cleanupError);
        }
      }
      
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
            <h2 className="text-3xl font-headline font-bold text-accent-pink mb-2 text-center">Create Your Account</h2>
            <form onSubmit={handleSignup} className="flex flex-col gap-4">
                <Input
                    type="email"
                    placeholder="Email"
                    className="input-glass w-full"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                />
                <Input
                    type="text"
                    placeholder="Username"
                    className="input-glass w-full"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={loading}
                />
                <div className="relative">
                    <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        className="input-glass w-full pr-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                    />
                    <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
                <div className="relative">
                    <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm Password"
                        className="input-glass w-full pr-10"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={loading}
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
                <motion.button
                    whileHover={{ scale: loading ? 1 : 1.05 }}
                    whileTap={{ scale: loading ? 1 : 0.95 }}
                    type="submit"
                    className="btn-glass mt-2 bg-accent-pink/80 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                >
                    {loading ? 'Creating Account...' : 'Create Account'}
                </motion.button>
            </form>
            {error && <div className="text-red-400 text-center animate-bounce mt-2">{error}</div>}
            <div className="text-center mt-2">
                <span className="text-gray-400">Already have an account? </span>
                <Link href="/login" className="text-accent-cyan hover:underline">Log in</Link>
            </div>
        </motion.div>
    </div>
  );
}
