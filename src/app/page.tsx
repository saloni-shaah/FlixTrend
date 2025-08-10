"use client";
import React from "react";
import Link from "next/link";
import { Sparkles, Bot, ShieldCheck, Users, Zap, Music } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full bg-background font-body text-foreground overflow-x-hidden">
      {/* Top Navbar */}
      <nav className="w-full flex justify-between items-center px-8 py-4 bg-background/80 border-b border-accent-cyan/10 fixed top-0 left-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-accent-cyan animate-pulse" />
          <span className="font-headline text-2xl text-accent-cyan font-bold tracking-wide">FlixTrend</span>
        </div>
        <div className="flex gap-4 items-center">
          <Link href="/login" className="px-5 py-2 rounded-full border-2 border-accent-cyan text-accent-cyan font-bold bg-background/30 hover:bg-accent-cyan hover:text-background transition-all">Log In</Link>
          <Link href="/signup" className="px-5 py-2 rounded-full bg-accent-pink text-white font-bold shadow-fab-glow hover:scale-105 transition-all">Sign Up</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center min-h-screen text-center overflow-hidden pt-32 px-4">
        <div className="absolute inset-0 z-0 animate-gradient-flow bg-gradient-to-tr from-accent-pink/20 via-background/80 to-accent-cyan/20 blur-3xl opacity-90" />
        <div className="relative z-10 flex flex-col items-center gap-6">
          <h1 className="text-5xl md:text-7xl font-headline font-bold bg-gradient-to-r from-accent-pink via-accent-cyan to-accent-green bg-clip-text text-transparent drop-shadow-[0_0_20px_#bf00ff] animate-fade-in">
            Where Trends Find You First
          </h1>
          <p className="max-w-3xl text-lg md:text-xl font-semibold text-foreground/80 drop-shadow-[0_0_10px_#00fff7] animate-fade-in delay-200">
            Join the only Gen-Z social app with AI-powered study mode, Spotify-integrated Flashes, and a real-time, vibe-driven feed. Your new digital squad awaits.
          </p>
          <div className="flex gap-6 mt-4 animate-fade-in delay-500">
            <Link href="/signup" className="px-10 py-4 rounded-full bg-accent-pink text-white font-bold text-xl shadow-fab-glow hover:scale-105 hover:shadow-lg transition-all duration-200">
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="max-w-6xl mx-auto py-20 px-4">
        <h2 className="text-4xl font-headline font-bold mb-12 text-center">Next-Gen Features, Built For You</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard icon={<Zap className="h-8 w-8 text-accent-cyan" />} title="VibeSpace Feed" desc="A real-time feed ordered by pure energy and engagement—no confusing algorithms, just what's actually trending." />
          <FeatureCard icon={<Music className="h-8 w-8 text-accent-green" />} title="Spotify Flashes" desc="Ephemeral 24-hour stories that you can pair with any song from Spotify. Share your vibe, perfectly." />
          <FeatureCard icon={<Bot className="h-8 w-8 text-accent-pink" />} title="Almighty AI Suite" desc="Your creative co-pilot for studying, summarizing text, generating images, and brainstorming ideas, powered by Google Gemini." />
          <FeatureCard icon={<Users className="h-8 w-8 text-accent-cyan" />} title="Squad & Signal" desc="Encrypted, private DMs with your mutuals only. Follow your friends, build your squad, and chat securely." />
          <FeatureCard icon={<ShieldCheck className="h-8 w-8 text-accent-green" />} title="FastCheck AI Filter" desc="Stay safe with our real-time AI filter that blocks hate, spam, and misinformation before it hits your feed." />
          <FeatureCard icon={<Sparkles className="h-8 w-8 text-accent-pink" />} title="Custom Themes" desc="Personalize your space with vibrant color palettes, dark mode, and animated backgrounds. Your app, your rules." />
        </div>
      </section>
      
      {/* Testimonials */}
      <section className="bg-background/20 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-headline font-bold mb-8">What Our Users Say</h2>
          <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
            <blockquote className="bg-card/80 rounded-2xl p-6 shadow-lg border border-accent-pink/20 max-w-md mx-auto">
              <p className="text-lg italic mb-2">“FlixTrend is the only app where I feel my posts actually matter. The vibes are real!”</p>
              <span className="font-bold text-accent-pink">@genz_trender</span>
            </blockquote>
            <blockquote className="bg-card/80 rounded-2xl p-6 shadow-lg border border-accent-cyan/20 max-w-md mx-auto">
              <p className="text-lg italic mb-2">“The Almighty AI is a game changer for my study sessions and creative projects.”</p>
              <span className="font-bold text-accent-cyan">@studyqueen</span>
            </blockquote>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-8 bg-card text-center flex flex-col gap-2 items-center mt-8">
        <p>&copy; {new Date().getFullYear()} FlixTrend. All rights reserved.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-card/80 rounded-2xl p-6 shadow-lg border border-accent-pink/10 flex flex-col items-center text-center hover:scale-105 hover:shadow-accent-cyan/20 transition-all duration-300">
      <div className="mb-4">{icon}</div>
      <h3 className="font-headline text-xl font-bold mb-2 text-accent-cyan">{title}</h3>
      <p className="text-base text-foreground/80">{desc}</p>
    </div>
  );
}
