"use client";
import React from "react";
import Link from "next/link";
import { FlixTrendLogo } from "@/components/FlixTrendLogo";
import { motion } from "framer-motion";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#0b0b0c] font-body text-zinc-300">
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

      {/* Main Content */}
      <section className="min-h-screen flex items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="max-w-xl mx-auto text-center space-y-8"
          >
            <h1 className="text-4xl md:text-5xl font-light tracking-tight text-zinc-100">
              Contact Us
            </h1>
            <p className="text-base md:text-lg text-zinc-400 font-light leading-relaxed">
              For any inquiries, please reach out to us at <a href="mailto:hello@flixtrend.in" className="text-zinc-100 hover:underline">hello@flixtrend.in</a>. We'll get back to you as soon as possible.
            </p>
             <div className="pt-4">
               <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300 transition">← Back to Home</Link>
             </div>
          </motion.div>
        </section>

    </div>
  );
}
