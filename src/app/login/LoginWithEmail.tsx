
"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/utils/firebaseClient';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { motion } from 'framer-motion';

export default function LoginWithEmail() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const finishSignIn = async () => {
      if (isSignInWithEmailLink(auth, window.location.href)) {
        let email = window.localStorage.getItem('emailForSignIn');
        if (!email) {
          email = window.prompt('Please provide your email for confirmation');
        }
        try {
          if (email) {
            await signInWithEmailLink(auth, email, window.location.href);
            window.localStorage.removeItem('emailForSignIn');
            router.push('/home?new=true');
          }
        } catch (err: any) {
          setError('Failed to sign in. The link may have expired or been used already.');
          console.error('Sign In With Email Link Error:', err);
        }
      } else {
        setError('Invalid sign-in link.');
      }
      setLoading(false);
    };

    finishSignIn();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card p-8 w-full max-w-md flex flex-col items-center gap-6"
      >
        <h2 className="text-3xl font-headline font-bold text-accent-pink mb-2 text-center">
          {loading ? 'Completing Sign In...' : 'Sign In Complete'}
        </h2>
        {loading && <div className="text-accent-cyan">Please wait while we sign you in.</div>}
        {error && <div className="text-red-400 text-center animate-bounce mt-2">{error}</div>}
        {!loading && !error && <div className="text-accent-cyan">You have been successfully signed in!</div>}
      </motion.div>
    </div>
  );
}
