"use client";
import React from "react";
import Link from "next/link";
import { FlixTrendLogo } from "@/components/FlixTrendLogo";

export default function PrivacyPolicyPage() {
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

      <div className="max-w-3xl mx-auto pt-32 pb-20 px-4">
        <div className="glass-card p-8 md:p-12 space-y-8">
            <header>
                <h1 className="text-4xl font-light text-zinc-100 mb-2">Privacy Policy</h1>
                <p className="text-sm text-zinc-500">Last Updated: September 2025</p>
            </header>

            <p className="text-zinc-400">
                At FlixTrend, your privacy is not just a checkbox—it’s a promise. We believe social media should feel safe, fun, and built for you, not against you. This policy explains what data we collect, how we use it, and most importantly, what we don’t do with it.
            </p>

            <section>
                <h2 className="text-2xl font-light text-zinc-100 mb-3">1. Information We Collect</h2>
                <ul className="list-disc list-inside space-y-2 text-zinc-400">
                    <li><strong className="text-zinc-200">Account Data:</strong> Username, email, password (encrypted).</li>
                    <li><strong className="text-zinc-200">Profile Data:</strong> Bio, profile photo, and your settings.</li>
                    <li><strong className="text-zinc-200">Your Content:</strong> Posts, comments, and messages you create.</li>
                    <li><strong className="text-zinc-200">Usage Data:</strong> App activity (like views or likes) to improve your experience.</li>
                    <li><strong className="text-zinc-200">Device Info:</strong> Browser type, device type, and crash logs (for fixing bugs).</li>
                </ul>
            </section>

            <section>
                <h2 className="text-2xl font-light text-zinc-100 mb-3">2. How We Use Your Data</h2>
                 <ul className="list-disc list-inside space-y-2 text-zinc-400">
                    <li>To let you sign up, log in, and use the features of the platform.</li>
                    <li>To keep FlixTrend safe and secure.</li>
                    <li>To improve app performance, fix bugs, and roll out new features.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-2xl font-light text-zinc-100 mb-3">3. What We Don’t Do</h2>
                <ul className="list-disc list-inside space-y-2 text-zinc-400">
                    <li>We <strong className="text-zinc-200">do not</strong> sell your data.</li>
                    <li>We <strong className="text-zinc-200">do not</strong> track you across other apps.</li>
                    <li>We <strong className="text-zinc-200">do not</strong> show you ads based on private conversations.</li>
                </ul>
            </section>
            
            <section>
                <h2 className="text-2xl font-light text-zinc-100 mb-3">4. Your Rights</h2>
                <ul className="list-disc list-inside space-y-2 text-zinc-400">
                    <li>You can download or delete your data anytime from your account settings.</li>
                    <li>You can edit your profile and privacy settings.</li>
                </ul>
            </section>
            
            <section>
                <h2 className="text-2xl font-light text-zinc-100 mb-3">5. Updates</h2>
                <p className="text-zinc-400">
                    We may update this Privacy Policy. If we do, we’ll notify you clearly in-app and on our website.
                </p>
            </section>
        </div>
      </div>
      <footer className="w-full py-8 text-center flex flex-col gap-2 items-center mt-8 border-t border-zinc-800/50">
        <p className="text-xs text-zinc-500">&copy; {new Date().getFullYear()} FlixTrend. All rights reserved.</p>
        <Link href="/" className="text-xs text-zinc-400 hover:underline">Home</Link>
      </footer>
    </div>
  );
}
