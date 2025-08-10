"use client";
import React from "react";
import Link from "next/link";
import { Sparkles, Bot, ShieldCheck, Users, Zap, Music, Database, BrainCircuit, Tv } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full font-body overflow-x-hidden">
      {/* Top Navbar */}
      <nav className="w-full flex justify-between items-center px-8 py-4 fixed top-0 left-0 z-50 bg-background/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-primary animate-pulse" />
          <span className="font-headline text-2xl font-bold tracking-wide bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">FlixTrend</span>
        </div>
        <div className="flex gap-4 items-center">
          <Link href="/login" className="px-5 py-2 rounded-full border-2 border-primary text-primary font-bold hover:bg-primary hover:text-primary-foreground transition-all">Log In</Link>
          <Link href="/signup" className="px-5 py-2 rounded-full bg-primary text-primary-foreground font-bold btn-glow">Sign Up</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center min-h-screen text-center overflow-hidden pt-32 px-4">
        <div className="absolute inset-0 z-0" />
        <div className="relative z-10 flex flex-col items-center gap-6">
          <h1 className="text-5xl md:text-7xl font-headline font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent drop-shadow-[0_0_20px_hsl(var(--primary)/0.5)] animate-fade-in">
            Where Trends Find You First
          </h1>
          <p className="max-w-3xl text-lg md:text-xl font-semibold text-foreground/80 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Join the only Gen-Z social app with AI-powered study mode, Spotify-integrated Flashes, and a real-time, vibe-driven feed. Your new digital squad awaits.
          </p>
          <div className="flex gap-6 mt-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Link href="/signup" className="px-10 py-4 rounded-full bg-primary text-primary-foreground font-bold text-xl btn-glow">
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="max-w-6xl mx-auto py-20 px-4">
        <h2 className="text-4xl font-headline font-bold mb-12 text-center">Next-Gen Features, Built For You</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard icon={<Zap className="h-8 w-8 text-secondary animated-icon" />} title="VibeSpace Feed" desc="A real-time feed ordered by pure energy and engagement—no confusing algorithms, just what's actually trending." />
          <FeatureCard icon={<Music className="h-8 w-8 text-secondary animated-icon" />} title="Spotify Flashes" desc="Ephemeral 24-hour stories that you can pair with any song from Spotify. Share your vibe, perfectly." />
          <FeatureCard icon={<Bot className="h-8 w-8 text-primary animated-icon" />} title="Almighty AI Suite" desc="Your creative co-pilot for studying, summarizing text, generating images, and brainstorming ideas, powered by Google Gemini." />
          <FeatureCard icon={<Users className="h-8 w-8 text-secondary animated-icon" />} title="Squad & Signal" desc="Encrypted, private DMs with your mutuals only. Follow your friends, build your squad, and chat securely." />
          <FeatureCard icon={<ShieldCheck className="h-8 w-8 text-accent animated-icon" />} title="FastCheck AI Filter" desc="Stay safe with our real-time AI filter that blocks hate, spam, and misinformation before it hits your feed." />
          <FeatureCard icon={<Tv className="h-8 w-8 text-primary animated-icon" />} title="Curated Content Channels" desc="Subscribe to channels, watch curated video content, and discover new creators in a dedicated, immersive player." />
        </div>
      </section>
      
      {/* How We're Built Section */}
      <section className="bg-card/40 py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-headline font-bold mb-4">The Most Secure & Advanced Social Platform</h2>
          <p className="text-lg text-foreground/70 mb-12 max-w-3xl mx-auto">We've engineered FlixTrend from the ground up with cutting-edge technology to protect your data and deliver a seamless, AI-powered experience.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TechDetailCard 
              icon={<ShieldCheck className="h-10 w-10 text-accent animated-icon" />}
              title="End-to-End Encryption"
              description="Your 'Signal' messages are secured with military-grade end-to-end encryption, meaning only you and the person you're talking to can read them. Not even we can see your private conversations."
            />
            <TechDetailCard 
              icon={<BrainCircuit className="h-10 w-10 text-primary animated-icon" />}
              title="Advanced AI Moderation"
              description="Our platform is powered by a multi-layered AI system, combining models like Google Gemini and custom-trained classifiers from the community to detect and neutralize harmful content in real-time before it reaches you."
            />
            <TechDetailCard 
              icon={<Database className="h-10 w-10 text-secondary animated-icon" />}
              title="Decentralized Identity (Coming Soon)"
              description="We are building towards a future where you own your social identity. Our work on decentralized protocols will give you full control over your data and social graph, independent of our servers."
            />
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
    <div className="glass-card rounded-2xl p-6 flex flex-col items-center text-center hover:scale-105 hover:border-primary/50 transition-all duration-300">
      <div className="mb-4">{icon}</div>
      <h3 className="font-headline text-xl font-bold mb-2 text-primary">{title}</h3>
      <p className="text-base text-foreground/80">{desc}</p>
    </div>
  );
}

function TechDetailCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string; }) {
    return (
        <div className="glass-card p-6 rounded-lg text-left">
            <div className="flex items-center gap-4 mb-3">
                {icon}
                <h3 className="text-xl font-bold font-headline">{title}</h3>
            </div>
            <p className="text-foreground/80">{description}</p>
        </div>
    )
}
