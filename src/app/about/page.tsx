"use client";
import React from "react";
import Link from "next/link";
import { FlixTrendLogo } from "@/components/FlixTrendLogo";
import { motion } from "framer-motion";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0b0b0c] font-body text-zinc-300">
      {/* Top Navbar */}
      <nav className="w-full flex justify-between items-center px-8 py-4 bg-black/50 border-b border-zinc-800/50 fixed top-0 left-0 z-50 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-3">
          <FlixTrendLogo size={40} />
          <span className="font-light text-2xl text-zinc-100 tracking-wide">FlixTrend</span>
        </Link>
        <div className="flex gap-6 items-center">
          <Link href="/login" className="btn-glass text-sm">Log In</Link>
          <Link href="/signup" className="px-5 py-2 rounded-full bg-zinc-100 text-black font-medium text-sm hover:bg-white transition-all">Sign Up</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center min-h-screen text-center overflow-hidden pt-20 px-6">
        <div className="relative z-10 flex flex-col items-center gap-8">
            <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-5xl md:text-7xl font-light tracking-tight text-zinc-100">The Founder's Journey</motion.h1>
            <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="max-w-3xl text-lg md:text-xl font-light text-zinc-400 leading-relaxed">
                FlixTrend was born from a simple observation: social media became a stage for performance, not a space for connection. We wanted to build a quiet corner of the internet where sharing felt human again. This is the story of that mission.
            </motion.p>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="max-w-4xl mx-auto py-20 px-4">
          <h2 className="text-4xl font-light mb-12 text-center text-zinc-100">Our Journey</h2>
          <div className="relative border-l-2 border-zinc-800/50 ml-6">
              <TimelineItem date="May 2025" title="The Idea Was Born" desc="The concept of FlixTrend was conceived to create a social platform prioritizing calm connection over chaotic engagement." />
              <TimelineItem date="January 11, 2026" title="Web Launch" desc="The full web version is launched, gathering feedback as we build our native mobile apps." />
              <TimelineItem date="January 24, 2026" title="Official Launch" desc="The first stable version for Web & Android is launched, marking the official start of our journey to redefine social media." />
          </div>
      </section>

      {/* Call to Action */}
      <section className="text-center py-20">
          <h2 className="text-3xl font-light text-zinc-100 mb-4">Find Your Space</h2>
          <p className="text-lg text-zinc-400 mb-8">Ready to experience a different kind of social media? Sign up and find your people.</p>
          <Link href="/signup" className="px-10 py-4 rounded-md bg-zinc-100 text-black font-medium text-lg shadow-lg hover:bg-white transition-all duration-200">Get Started</Link>
      </section>

      {/* Footer */}
      <footer className="w-full py-8 text-center flex flex-col gap-2 items-center mt-8 border-t border-zinc-800/50">
        <p className="text-xs text-zinc-500">&copy; {new Date().getFullYear()} FlixTrend. All rights reserved.</p>
        <Link href="/" className="text-xs text-zinc-400 hover:underline">Landing</Link>
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
        <div className="absolute -left-3.5 w-6 h-6 rounded-full bg-zinc-700 border-4 border-[#0b0b0c]" />
        <p className="text-sm font-medium text-zinc-400">{date}</p>
        <h3 className="text-2xl font-light text-zinc-100 mt-1">{title}</h3>
        <p className="text-zinc-500 mt-2">{desc}</p>
    </motion.div>
  );
}
