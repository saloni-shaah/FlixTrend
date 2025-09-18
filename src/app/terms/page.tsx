
"use client";
import React from "react";
import Link from "next/link";
import { FlixTrendLogo } from "@/components/FlixTrendLogo";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen font-body text-white">
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

      {/* Main Content */}
      <div className="max-w-4xl mx-auto pt-28 pb-20 px-4">
        <div className="glass-card p-8 md:p-12">
            <h1 className="text-4xl font-headline font-bold text-accent-cyan mb-4">📑 FlixTrend Terms of Service</h1>
            <p className="text-sm text-gray-400 mb-8">Last Updated: September 2025</p>

            <p className="mb-6 text-gray-300">
                Welcome to FlixTrend! These Terms of Service (“Terms”) explain your rights and responsibilities when using FlixTrend. By signing up or using our app, you agree to follow these rules.
            </p>

            <section className="mb-8">
                <h2 className="text-2xl font-headline font-bold text-accent-pink mb-3">1. Your Account</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                    <li>You must be at least 13 years old.</li>
                    <li>You are responsible for keeping your account secure.</li>
                    <li>Don’t share your password with others.</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-headline font-bold text-accent-pink mb-3">2. Content Rules</h2>
                 <p className="text-gray-400 mb-4">When you post Vibes, Flashes, Scope, or chat in Signal:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                    <li>You own your content, but grant FlixTrend a license to display it within the platform.</li>
                    <li>Don’t post illegal, harmful, violent, or hateful content.</li>
                    <li>Don’t spam, hack, or harass others.</li>
                    <li>Respect copyrights and trademarks.</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-headline font-bold text-accent-pink mb-3">3. AI Usage</h2>
                <p className="text-gray-400 mb-4">Our AI assistant is powerful, but:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                    <li>It’s not a human—sometimes it may make mistakes.</li>
                    <li>Don’t use it for harmful, abusive, or illegal purposes.</li>
                </ul>
            </section>
            
            <section className="mb-8">
                <h2 className="text-2xl font-headline font-bold text-accent-pink mb-3">4. Voltix Security</h2>
                <p className="text-gray-300">
                    We use ledger-based encryption to protect your data. Still, no system is 100% hack-proof. By using FlixTrend, you accept this risk.
                </p>
            </section>
            
            <section className="mb-8">
                <h2 className="text-2xl font-headline font-bold text-accent-pink mb-3">5. Termination</h2>
                <p className="text-gray-400 mb-4">We may suspend or remove accounts that:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                    <li>Break these Terms.</li>
                    <li>Spread harmful or illegal content.</li>
                    <li>Try to exploit or attack the platform.</li>
                </ul>
                 <p className="text-gray-300 mt-2">You can delete your account at any time in settings.</p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-headline font-bold text-accent-pink mb-3">6. Limitation of Liability</h2>
                <p className="text-gray-300">
                    FlixTrend is provided “as is.” We do not guarantee uninterrupted access, error-free operation, or complete immunity from security risks.
                </p>
            </section>

             <section className="mb-8">
                <h2 className="text-2xl font-headline font-bold text-accent-pink mb-3">7. Changes to Terms</h2>
                <p className="text-gray-300">
                    We may update these Terms as FlixTrend grows. We’ll notify you of major changes.
                </p>
            </section>
            
            <section>
                <h2 className="text-2xl font-headline font-bold text-accent-pink mb-3">8. Governing Law</h2>
                <p className="text-gray-300">
                    These Terms are governed by the laws of India.
                </p>
            </section>
        </div>
      </div>
       {/* Footer */}
      <footer className="w-full py-8 bg-black/60 text-center flex flex-col gap-2 items-center mt-8 border-t border-accent-cyan/20">
        <p className="text-sm">&copy; {new Date().getFullYear()} FlixTrend. All rights reserved.</p>
        <Link href="/" className="text-xs text-accent-cyan hover:underline">Home</Link>
      </footer>
    </div>
  );
}

