"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/utils/firebaseClient";
import Image from "next/image";
import { AlmightyLogo } from "@/components/AlmightyLogo";

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
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="text-2xl font-bold text-accent-cyan animate-pulse">FlixTrend</div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-accent-cyan font-body">
      {/* Top Navbar */}
      <nav className="w-full flex justify-between items-center px-8 py-4 bg-black/70 border-b border-accent-cyan/20 fixed top-0 left-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <AlmightyLogo size={40} />
          <span className="font-headline text-2xl text-accent-cyan font-bold tracking-wide">FlixTrend</span>
        </div>
        <div className="flex gap-6 items-center">
          <Link href="/signup" className="px-5 py-2 rounded-full bg-accent-pink text-white font-bold shadow-fab-glow hover:scale-105 transition-all">Sign Up</Link>
          <Link href="/login" className="px-5 py-2 rounded-full border-2 border-accent-cyan text-accent-cyan font-bold bg-black/30 hover:bg-accent-cyan hover:text-primary transition-all">Log In</Link>
        </div>
      </nav>
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center h-[90vh] text-center overflow-hidden pt-32">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 z-0 animate-gradient-flow bg-gradient-to-tr from-accent-pink/40 via-primary/80 to-accent-cyan/40 blur-2xl opacity-80" />
        {/* Floating shapes */}
        <div className="absolute left-1/4 top-1/3 w-40 h-40 bg-accent-pink rounded-full opacity-30 blur-2xl animate-float" />
        <div className="absolute right-1/4 bottom-1/4 w-32 h-32 bg-accent-cyan rounded-full opacity-30 blur-2xl animate-float" />
        <div className="relative z-10 flex flex-col items-center gap-8">
          <h1 className="text-6xl md:text-7xl font-headline font-bold drop-shadow-[0_0_20px_#e600ff] animate-fade-in">Where Trends Find You First</h1>
          <p className="max-w-2xl text-2xl md:text-3xl font-semibold text-accent-cyan drop-shadow-[0_0_10px_#00fff7] animate-fade-in delay-200">
            Over <span className="text-accent-pink font-bold">1,000+</span> posts shared in the first week. <br />
            The only Gen-Z social app with <span className="text-accent-green font-bold">AI-powered study mode</span>, <span className="text-accent-cyan font-bold">Spotify song flashes</span>, and <span className="text-accent-pink font-bold">real-time vibes</span>.
          </p>
          <div className="flex gap-6 mt-4 animate-fade-in delay-500">
            <Link href="/signup" className="px-10 py-4 rounded-full bg-accent-pink text-white font-bold text-xl shadow-fab-glow hover:scale-105 hover:shadow-lg transition-all duration-200">Get Started</Link>
          </div>
        </div>
      </section>
      {/* Why FlixTrend? */}
      <section className="max-w-5xl mx-auto py-12 px-4 text-center">
        <h2 className="text-4xl font-headline font-bold mb-6 text-accent-cyan drop-shadow">Why FlixTrend?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-card rounded-2xl p-6 shadow-fab-glow border border-accent-cyan/20">
            <h3 className="text-xl font-bold text-accent-pink mb-2">Real-Time, Not Algorithmic</h3>
            <p>See what’s trending <span className="font-bold text-accent-green">right now</span>—no hidden feeds, no FOMO. VibeSpace is always live.</p>
          </div>
          <div className="bg-card rounded-2xl p-6 shadow-fab-glow border border-accent-pink/20">
            <h3 className="text-xl font-bold text-accent-cyan mb-2">AI for You, Not for Ads</h3>
            <p>Almighty AI helps you study, create, and vibe. <span className="font-bold text-accent-pink">No creepy targeting</span>, just real help.</p>
          </div>
          <div className="bg-card rounded-2xl p-6 shadow-fab-glow border border-accent-green/20">
            <h3 className="text-xl font-bold text-accent-green mb-2">Gen-Z Designed</h3>
            <p>Neon, glass, and gradients. <span className="font-bold text-accent-cyan">9-color palette</span>, animated everything, and a UI that feels like the future.</p>
          </div>
        </div>
      </section>
      {/* Feature Highlights */}
      <section className="max-w-6xl mx-auto py-20 px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        <FeatureCard icon="✨" title="VibeSpace" desc="A real-time feed where posts are ordered by vibe — no confusing algorithms, just pure energy. Like BeReal, but with more hype." />
        <FeatureCard icon="⚡" title="Flashes" desc="Ephemeral stories that last 24 hours. Add Spotify songs, AI-generated images, or polls. Auto-disappear, no stress." />
        <FeatureCard icon="🤖" title="Almighty AI Suite" desc="Chat, study, summarize, generate images, and build projects. Powered by Google Gemini, made for Gen-Z." />
        <FeatureCard icon="🛰️" title="Scope (Explore)" desc="Global search, trending hashtags, and a Shorts grid. Discover creators and content instantly." />
        <FeatureCard icon="👥" title="Squad & Signal" desc="Follow, chat, and squad up. Private, encrypted DMs with only your mutuals. No random spam." />
        <FeatureCard icon="🛡️" title="FastCheck AI Filter" desc="Real-time AI filter for hate, spam, and misinformation. Get instant warnings and keep your feed safe." />
        <FeatureCard icon="🎵" title="Spotify Flashes" desc="Attach your favorite song to a flash. Search any track, preview, and share the vibe." />
        <FeatureCard icon="🎨" title="Custom Themes" desc="Personalize with 9 vibrant colors, dark mode, and animated backgrounds. Your space, your style." />
        <FeatureCard icon="🔒" title="Privacy First" desc="Your data, your rules. End-to-end encrypted chats and full control over your content." />
      </section>
      {/* How We Care */}
      <section className="max-w-5xl mx-auto py-12 px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-headline font-bold mb-6 text-accent-green drop-shadow">How We Care</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-card rounded-2xl p-6 shadow-fab-glow border border-accent-cyan/20">
            <h3 className="text-lg font-bold text-accent-cyan mb-2">Privacy by Default</h3>
            <p>We never sell your data. You control what you share, and all chats are encrypted.</p>
          </div>
          <div className="bg-card rounded-2xl p-6 shadow-fab-glow border border-accent-pink/20">
            <h3 className="text-lg font-bold text-accent-pink mb-2">Safety First</h3>
            <p>FastCheck AI blocks hate, spam, and fake news before it reaches you. Real-time warnings, always on.</p>
          </div>
          <div className="bg-card rounded-2xl p-6 shadow-fab-glow border border-accent-green/20">
            <h3 className="text-lg font-bold text-accent-green mb-2">Empowering Creators</h3>
            <p>FlixTrend is built for you. No shadowbans, no paywalls, just pure creative freedom and real reach.</p>
          </div>
        </div>
      </section>
      {/* Comparison Grid */}
      <section className="max-w-6xl mx-auto py-12 px-4">
        <h2 className="text-3xl md:text-4xl font-headline font-bold mb-8 text-accent-cyan drop-shadow text-center">FlixTrend vs. Other Apps</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-card/80 rounded-2xl shadow-fab-glow border border-accent-cyan/20 text-left">
            <thead>
              <tr>
                <th className="py-3 px-4">Feature</th>
                <th className="py-3 px-4 text-accent-cyan">FlixTrend</th>
                <th className="py-3 px-4">Instagram</th>
                <th className="py-3 px-4">Snapchat</th>
                <th className="py-3 px-4">BeReal</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-accent-cyan/10">
                <td className="py-2 px-4">AI Study Mode</td>
                <td className="py-2 px-4 font-bold text-accent-green">Yes</td>
                <td className="py-2 px-4">No</td>
                <td className="py-2 px-4">No</td>
                <td className="py-2 px-4">No</td>
              </tr>
              <tr className="border-t border-accent-cyan/10">
                <td className="py-2 px-4">Spotify Song Flashes</td>
                <td className="py-2 px-4 font-bold text-accent-cyan">Yes</td>
                <td className="py-2 px-4">No</td>
                <td className="py-2 px-4">No</td>
                <td className="py-2 px-4">No</td>
              </tr>
              <tr className="border-t border-accent-cyan/10">
                <td className="py-2 px-4">Real-Time Feed (No Algorithm)</td>
                <td className="py-2 px-4 font-bold text-accent-pink">Yes</td>
                <td className="py-2 px-4">No</td>
                <td className="py-2 px-4">No</td>
                <td className="py-2 px-4">Yes</td>
              </tr>
              <tr className="border-t border-accent-cyan/10">
                <td className="py-2 px-4">FastCheck AI Filter</td>
                <td className="py-2 px-4 font-bold text-accent-green">Yes</td>
                <td className="py-2 px-4">No</td>
                <td className="py-2 px-4">No</td>
                <td className="py-2 px-4">No</td>
              </tr>
              <tr className="border-t border-accent-cyan/10">
                <td className="py-2 px-4">End-to-End Encrypted DMs</td>
                <td className="py-2 px-4 font-bold text-accent-cyan">Yes</td>
                <td className="py-2 px-4">No</td>
                <td className="py-2 px-4">Yes</td>
                <td className="py-2 px-4">No</td>
              </tr>
              <tr className="border-t border-accent-cyan/10">
                <td className="py-2 px-4">No Shadowbans/Paywalls</td>
                <td className="py-2 px-4 font-bold text-accent-pink">Yes</td>
                <td className="py-2 px-4">No</td>
                <td className="py-2 px-4">No</td>
                <td className="py-2 px-4">Yes</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      {/* Social Proof / Testimonials */}
      <section className="max-w-4xl mx-auto py-16 px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-headline font-bold mb-8 text-accent-cyan drop-shadow">What Our Users Say</h2>
        <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
          <blockquote className="bg-card/80 rounded-2xl p-6 shadow-fab-glow border border-accent-pink/20 max-w-md mx-auto">
            <p className="text-lg italic mb-2">“FlixTrend is the only app where I feel my posts actually matter. The vibes are real!”</p>
            <span className="font-bold text-accent-pink">@genz_trender</span>
          </blockquote>
          <blockquote className="bg-card/80 rounded-2xl p-6 shadow-fab-glow border border-accent-cyan/20 max-w-md mx-auto">
            <p className="text-lg italic mb-2">“The Almighty AI is a game changer for my study sessions and creative projects.”</p>
            <span className="font-bold text-accent-cyan">@studyqueen</span>
          </blockquote>
        </div>
      </section>
      {/* Footer */}
      <footer className="w-full py-8 bg-black/60 text-center flex flex-col gap-2 items-center mt-8">
        <div className="flex gap-4 justify-center mb-2">
          <a href="#about" className="hover:text-accent-cyan">About</a>
          <a href="#contact" className="hover:text-accent-cyan">Contact</a>
          <a href="#terms" className="hover:text-accent-cyan">Terms</a>
          <a href="#privacy" className="hover:text-accent-cyan">Privacy Policy</a>
        </div>
        <div className="flex gap-3 justify-center">
          {/* Social icons placeholder */}
          <span className="hover:text-accent-pink cursor-pointer">🌐</span>
          <span className="hover:text-accent-pink cursor-pointer">🐦</span>
          <span className="hover:text-accent-pink cursor-pointer">📸</span>
        </div>
        <p className="text-xs">&copy; {new Date().getFullYear()} FlixTrend. All rights reserved.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="bg-card rounded-2xl p-6 shadow-fab-glow border border-accent-pink/20 flex flex-col items-center text-center hover:scale-105 hover:shadow-lg transition-all duration-200">
      <div className="text-4xl mb-3 drop-shadow-[0_0_10px_#e600ff]">{icon}</div>
      <h3 className="font-headline text-xl font-bold mb-2 text-accent-cyan">{title}</h3>
      <p className="text-base">{desc}</p>
    </div>
  );
}
