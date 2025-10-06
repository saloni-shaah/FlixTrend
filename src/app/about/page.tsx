
"use client";
import React from "react";
import Link from "next/link";
import { FlixTrendLogo } from "@/components/FlixTrendLogo";
import { Bot, Music, ShieldCheck, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-transparent font-body text-white">
      {/* Top Navbar */}
      <nav className="w-full flex justify-between items-center px-8 py-4 bg-black/70 border-b border-accent-cyan/20 fixed top-0 left-0 z-50 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-3">
          <FlixTrendLogo size={40} />
          <span className="font-headline text-2xl text-accent-cyan font-bold tracking-wide">FlixTrend</span>
        </Link>
        <div className="flex gap-6 items-center">
          <Link href="/guest" className="px-5 py-2 rounded-full bg-accent-pink text-white font-bold shadow-fab-glow hover:scale-105 transition-all">Guest Feed</Link>
          <Link href="/login" className="px-5 py-2 rounded-full border-2 border-accent-cyan text-accent-cyan font-bold bg-black/30 hover:bg-accent-cyan hover:text-primary transition-all">Log In</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center min-h-screen text-center overflow-hidden pt-20">
        <div className="relative z-10 flex flex-col items-center gap-8">
            <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-5xl md:text-7xl font-headline font-bold text-shadow-glow animate-fade-in">The Founder's Journey of FlixTrend</motion.h1>
            <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="max-w-3xl text-lg md:text-xl font-semibold text-accent-cyan drop-shadow-[0_0_10px_#00fff7] animate-fade-in">
                I started FlixTrend with a clear ambition: to build India's first, truly secure social media app—a complete solution for connection, creativity, and entertainment. My vision is a platform built for Gen-Z and Gen-Alpha, where your vibe is what matters, not opaque algorithms. This is the story of that mission.
            </motion.p>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="max-w-4xl mx-auto py-20 px-4">
          <h2 className="text-4xl font-headline font-bold mb-12 text-center text-accent-cyan">Our Development Journey</h2>
          <div className="relative border-l-2 border-accent-purple/50 ml-6">
              <TimelineItem date="May 2025" title="The Idea Was Born" desc="The concept of FlixTrend was conceived with the mission to create India's own secure, all-in-one social media platform." />
              <TimelineItem date="July 24, 2025" title="The Birth of FlixTrend" desc="The first stable preview version was launched. This marked the official birth of FlixTrend and the beginning of our journey to redefine social media." />
              <TimelineItem date="Security First" title="Voltix Security" desc="Development began on Voltix, our proprietary security layer, to ensure user data and privacy are protected from day one." />
              <TimelineItem date="Today" title="Web Preview & Beyond" desc="We're launching our web preview to gather feedback as we build our native mobile apps. The journey is just beginning!" />
          </div>
      </section>

      {/* Call to Action */}
      <section className="text-center py-20">
          <h2 className="text-3xl font-headline font-bold mb-4 text-accent-pink">Join the Vibe</h2>
          <p className="text-lg text-accent-cyan mb-8">Ready to experience a different kind of social media? Sign up and find your squad.</p>
          <Link href="/signup" className="px-10 py-4 rounded-full bg-accent-pink text-white font-bold text-xl shadow-fab-glow hover:scale-105 hover:shadow-lg transition-all duration-200">Get Started</Link>
      </section>

      {/* Footer */}
      <footer className="w-full py-8 bg-black/60 text-center flex flex-col gap-2 items-center mt-8 border-t border-accent-cyan/20">
        <p className="text-sm">&copy; {new Date().getFullYear()} FlixTrend. All rights reserved.</p>
        <Link href="/" className="text-xs text-accent-cyan hover:underline">Home</Link>
      </footer>
    </div>
  );
}

function TimelineItem({ date, title, desc }: { date: string, title: string, desc: string }) {
  return (
    <motion.div
        className="mb-12 ml-10"
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
    >
        <div className="absolute -left-3.5 w-6 h-6 rounded-full bg-accent-purple border-4 border-background animate-pulse" />
        <p className="text-sm font-bold text-accent-pink">{date}</p>
        <h3 className="text-2xl font-headline font-bold text-accent-cyan mt-1">{title}</h3>
        <p className="text-gray-400 mt-2">{desc}</p>
    </motion.div>
  );
}
