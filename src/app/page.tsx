
"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/utils/firebaseClient";
import { AlmightyLogo } from "@/components/AlmightyLogo";
import { motion } from "framer-motion";
import { Bot, Music, ShieldCheck, Sparkles } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        // User is signed in, redirect to home page.
        router.replace('/home');
      } else {
        // User is signed out, show the landing page.
        setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background">
        <AlmightyLogo size={80} />
        <h1 className="text-3xl font-headline text-accent-cyan font-bold mt-4 animate-glow">
          FlixTrend
        </h1>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-transparent font-body text-white">
      {/* Top Navbar */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full flex justify-between items-center px-8 py-4 bg-black/70 border-b border-accent-cyan/20 fixed top-0 left-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <AlmightyLogo size={40} />
          <span className="font-headline text-2xl text-accent-cyan font-bold tracking-wide">FlixTrend</span>
        </div>
        <div className="flex gap-6 items-center">
          <Link href="/signup" className="px-5 py-2 rounded-full bg-accent-pink text-white font-bold shadow-fab-glow hover:scale-105 transition-all">Sign Up</Link>
          <Link href="/login" className="px-5 py-2 rounded-full border-2 border-accent-cyan text-accent-cyan font-bold bg-black/30 hover:bg-accent-cyan hover:text-primary transition-all">Log In</Link>
        </div>
      </motion.nav>
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center h-screen text-center overflow-hidden">
        {/* Animated Gradient Background is now in globals.css body */}
        <div className="relative z-10 flex flex-col items-center gap-8">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-6xl md:text-8xl font-headline font-bold text-shadow-glow animate-fade-in">Where Trends Find You First</motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="max-w-3xl text-xl md:text-2xl font-semibold text-accent-cyan drop-shadow-[0_0_10px_#00fff7] animate-fade-in">
            The only Gen-Z social app with an <span className="text-accent-green font-bold">AI-powered study mode</span>, <span className="text-accent-cyan font-bold">Spotify song flashes</span>, and <span className="text-accent-pink font-bold">real-time vibes</span>.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex gap-6 mt-4 animate-fade-in">
            <Link href="/signup" className="px-10 py-4 rounded-full bg-accent-pink text-white font-bold text-xl shadow-fab-glow hover:scale-105 hover:shadow-lg transition-all duration-200">Get Started</Link>
          </motion.div>
        </div>
      </section>
      
      {/* Feature Highlights Section */}
      <section className="max-w-6xl mx-auto py-20 px-4">
          <h2 className="text-4xl font-headline font-bold mb-12 text-center text-accent-cyan">The Future of Social is Here</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <FeatureCard icon={<Sparkles />} title="VibeSpace" desc="A real-time feed where posts are ordered by vibe—no confusing algorithms, just pure energy." />
              <FeatureCard icon={<Music />} title="Spotify Flashes" desc="Ephemeral stories that last 24 hours. Add any Spotify song to share the vibe. Auto-disappears, no stress." />
              <FeatureCard icon={<Bot />} title="Almighty AI Suite" desc="Chat, study, summarize, and generate images. Powered by Google Gemini, made for Gen-Z." />
              <FeatureCard icon={<ShieldCheck />} title="FastCheck AI Filter" desc="Real-time AI filter for hate, spam, and misinformation. Get instant warnings and keep your feed safe." />
          </div>
      </section>

      {/* Comparison Grid */}
      <section className="max-w-6xl mx-auto py-12 px-4">
        <h2 className="text-3xl md:text-4xl font-headline font-bold mb-8 text-accent-cyan drop-shadow text-center">FlixTrend vs. Other Apps</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full glass-card text-left">
            <thead>
              <tr className="border-b border-accent-cyan/20">
                <th className="py-3 px-4">Feature</th>
                <th className="py-3 px-4 text-accent-cyan">FlixTrend</th>
                <th className="py-3 px-4 text-gray-400">Instagram</th>
                <th className="py-3 px-4 text-gray-400">Snapchat</th>
                <th className="py-3 px-4 text-gray-400">BeReal</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-accent-cyan/10">
                <td className="py-2 px-4">AI Study Mode</td>
                <td className="py-2 px-4 font-bold text-accent-green">Yes</td>
                <td className="py-2 px-4 text-red-400">No</td>
                <td className="py-2 px-4 text-red-400">No</td>
                <td className="py-2 px-4 text-red-400">No</td>
              </tr>
              <tr className="border-t border-accent-cyan/10">
                <td className="py-2 px-4">Spotify Song Flashes</td>
                <td className="py-2 px-4 font-bold text-accent-cyan">Yes</td>
                <td className="py-2 px-4 text-red-400">No</td>
                <td className="py-2 px-4 text-red-400">No</td>
                <td className="py-2 px-4 text-red-400">No</td>
              </tr>
              <tr className="border-t border-accent-cyan/10">
                <td className="py-2 px-4">Real-Time Feed (No Algorithm)</td>
                <td className="py-2 px-4 font-bold text-accent-pink">Yes</td>
                <td className="py-2 px-4 text-red-400">No</td>
                <td className="py-2 px-4 text-red-400">No</td>
                <td className="py-2 px-4 font-bold text-accent-green">Yes</td>
              </tr>
              <tr className="border-t border-accent-cyan/10">
                <td className="py-2 px-4">FastCheck AI Filter</td>
                <td className="py-2 px-4 font-bold text-accent-green">Yes</td>
                <td className="py-2 px-4 text-red-400">No</td>
                <td className="py-2 px-4 text-red-400">No</td>
                <td className="py-2 px-4 text-red-400">No</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="w-full py-8 bg-black/60 text-center flex flex-col gap-2 items-center mt-8 border-t border-accent-cyan/20">
        <p className="text-sm">&copy; {new Date().getFullYear()} FlixTrend. All rights reserved.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <motion.div 
      className="glass-card p-6 flex flex-col items-center text-center hover:border-accent-cyan transition-all"
      whileHover={{ scale: 1.05 }}
    >
      <div className="text-4xl mb-4 text-accent-pink">{icon}</div>
      <h3 className="font-headline text-xl font-bold mb-2 text-accent-cyan">{title}</h3>
      <p className="text-base text-gray-400">{desc}</p>
    </motion.div>
  );
}

    
