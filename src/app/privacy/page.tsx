
"use client";
import React from "react";
import Link from "next/link";
import { FlixTrendLogo } from "@/components/FlixTrendLogo";

export default function PrivacyPolicyPage() {
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
            <h1 className="text-4xl font-headline font-bold text-accent-cyan mb-4">📜 FlixTrend Privacy Policy</h1>
            <p className="text-sm text-gray-400 mb-8">Last Updated: September 2025</p>

            <p className="mb-6 text-gray-300">
                At FlixTrend, your privacy is not just a checkbox—it’s a promise. We believe social media should feel safe, fun, and built for you, not against you. This policy explains what data we collect, how we use it, and most importantly, what we don’t do with it.
            </p>

            <section className="mb-8">
                <h2 className="text-2xl font-headline font-bold text-accent-pink mb-3">1. Information We Collect</h2>
                <p className="text-gray-400 mb-4">When you use FlixTrend, we may collect:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                    <li><strong className="text-accent-cyan">Account Data:</strong> Username, email, password (encrypted).</li>
                    <li><strong className="text-accent-cyan">Profile Data:</strong> Bio, profile photo, interests, and settings.</li>
                    <li><strong className="text-accent-cyan">Content:</strong> Vibes (posts), Flashes (stories), Scope (shorts), comments, and messages.</li>
                    <li><strong className="text-accent-cyan">Usage Data:</strong> App activity (like views, likes, or relays) to improve your experience.</li>
                    <li><strong className="text-accent-cyan">Device Info:</strong> Browser type, device type, crash logs (for fixing bugs).</li>
                </ul>
                <p className="mt-4 text-gray-500 italic">We do not collect unnecessary personal details like phone contacts, GPS tracking, or hidden background data.</p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-headline font-bold text-accent-pink mb-3">2. How We Use Your Data</h2>
                 <ul className="list-disc list-inside space-y-2 text-gray-300">
                    <li>To let you sign up, log in, and use features like VibeSpace, Flashes, Scope, and Signal.</li>
                    <li>To keep FlixTrend safe with Voltix Security (ledger-based protection + encryption).</li>
                    <li>To improve app performance, fix bugs, and roll out new features.</li>
                    <li>To personalize your feed based on your selected interests (not creepy tracking).</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-headline font-bold text-accent-pink mb-3">3. What We Don’t Do</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                    <li>We <strong className="text-accent-cyan">never</strong> sell your data.</li>
                    <li>We <strong className="text-accent-cyan">never</strong> stalk you across other apps.</li>
                    <li>We <strong className="text-accent-cyan">never</strong> show you ads based on private conversations.</li>
                </ul>
            </section>
            
            <section className="mb-8">
                <h2 className="text-2xl font-headline font-bold text-accent-pink mb-3">4. Security</h2>
                <p className="text-gray-300">
                    Your data is protected with Voltix Security, our proprietary ledger-based encryption system. Messages in Signal are end-to-end encrypted.
                </p>
            </section>
            
            <section className="mb-8">
                <h2 className="text-2xl font-headline font-bold text-accent-pink mb-3">5. Sharing Your Data</h2>
                <p className="text-gray-400 mb-4">We may share limited data only in these cases:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                    <li><strong className="text-accent-cyan">Legal reasons:</strong> If required by law or valid court order.</li>
                    <li><strong className="text-accent-cyan">With your consent:</strong> If you choose to connect third-party apps.</li>
                    <li><strong className="text-accent-cyan">Service providers:</strong> To help us run servers, security, or moderation.</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-headline font-bold text-accent-pink mb-3">6. Your Rights</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                    <li>You can download or delete your data anytime.</li>
                    <li>You can edit your profile and privacy settings.</li>
                    <li>You can deactivate your account permanently if you choose.</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-headline font-bold text-accent-pink mb-3">7. Children’s Privacy</h2>
                <p className="text-gray-300">
                    FlixTrend is designed for users 13+. We do not knowingly collect data from children under 13.
                </p>
            </section>
            
            <section>
                <h2 className="text-2xl font-headline font-bold text-accent-pink mb-3">8. Updates</h2>
                <p className="text-gray-300">
                    We may update this Privacy Policy. If we do, we’ll notify you clearly in-app and on our website.
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
