'use client';

import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/utils/firebaseClient';
import { PostCard } from '@/components/PostCard';
import { GuestPostCard } from '@/components/GuestPostCard';
import { VibeSpaceLoader } from '@/components/VibeSpaceLoader';
import Link from 'next/link';
import { FlixTrendLogo } from '@/components/FlixTrendLogo';
import { ArrowLeft, LogIn } from 'lucide-react';

export default function PostClient({ post, postId }) {
  const [user, loading, error] = useAuthState(auth);

  const renderNavbar = () => {
    if (loading) return null;
    if (user) {
        return (
             <nav className="w-full flex justify-between items-center px-4 sm:px-8 py-4 bg-black/70 border-b border-accent-cyan/20 fixed top-0 left-0 z-50 backdrop-blur-md">
                <Link href="/vibespace" className="flex items-center gap-2 text-accent-cyan hover:text-white transition-colors">
                    <ArrowLeft size={24} />
                    <span className="hidden sm:inline">Back to VibeSpace</span>
                </Link>
                <Link href="/" className="flex items-center gap-3">
                    <FlixTrendLogo size={40} />
                    <span className="font-headline text-2xl text-accent-cyan font-bold tracking-wide">FlixTrend</span>
                </Link>
                {/* Placeholder for user profile icon or other nav items */}
                <div className="w-12"></div> 
            </nav>
        )
    }
    return (
        <nav className="w-full flex justify-between items-center px-4 sm:px-8 py-4 bg-black/70 border-b border-accent-cyan/20 fixed top-0 left-0 z-50 backdrop-blur-md">
            <Link href="/" className="flex items-center gap-3">
              <FlixTrendLogo size={40} />
              <span className="font-headline text-2xl text-accent-cyan font-bold tracking-wide">FlixTrend</span>
            </Link>
            <div className="flex gap-4 sm:gap-6 items-center">
              <Link href="/signup" className="px-5 py-2 rounded-full bg-accent-pink text-white font-bold shadow-fab-glow hover:scale-105 transition-all">Sign Up</Link>
              <Link href="/login" className="hidden sm:block px-5 py-2 rounded-full border-2 border-accent-cyan text-accent-cyan font-bold bg-black/30 hover:bg-accent-cyan hover:text-primary transition-all">Log In</Link>
            </div>
        </nav>
    );
}

  if (loading) {
    return <VibeSpaceLoader />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        {renderNavbar()}
        <main className="w-full max-w-xl mx-auto pt-24 sm:pt-28 pb-12 px-4">
            <h1 className="text-2xl font-headline font-bold text-red-500 mb-4">Authentication Error</h1>
            <p className="text-gray-300 mb-4">{error.message}</p>
            <Link href="/login" className="btn-glass bg-accent-cyan text-black">
              Try Logging In Again
            </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-primary">
        {renderNavbar()}
      <main className="w-full max-w-xl mx-auto pt-24 sm:pt-28 pb-12 px-4">
        {user ? (
          <PostCard post={post} />
        ) : (
          <>
            <GuestPostCard post={post} />
            <div className="glass-card mt-6 p-5 text-center">
              <h3 className="text-xl font-headline font-bold text-accent-cyan mb-3">Want to join the conversation?</h3>
              <p className="text-gray-300 mb-4">Log in to like, comment, and share this post.</p>
              <Link href={`/login?redirect=/post/${postId}`} className="btn-glass bg-accent-cyan text-black flex items-center justify-center gap-2">
                <LogIn size={20} />
                Log In to Comment
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
