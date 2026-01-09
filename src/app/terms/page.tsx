"use client";
import React from "react";
import Link from "next/link";
import { FlixTrendLogo } from "@/components/FlixTrendLogo";

export default function TermsOfServicePage() {
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
                <h1 className="text-4xl font-light text-zinc-100 mb-2">Terms of Service</h1>
                <p className="text-sm text-zinc-500">Last Updated: September 2025</p>
            </header>

            <p className="text-zinc-400">
                Welcome to FlixTrend. These Terms of Service (“Terms”) explain your rights and responsibilities when using our platform. By signing up or using our app, you agree to follow these rules.
            </p>

            <section>
                <h2 className="text-2xl font-light text-zinc-100 mb-3">1. Your Account</h2>
                <ul className="list-disc list-inside space-y-2 text-zinc-400">
                    <li>You must be at least 13 years old to use FlixTrend.</li>
                    <li>You are responsible for keeping your account secure and confidential.</li>
                    <li>Don’t share your password with anyone.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-2xl font-light text-zinc-100 mb-3">2. Content Rules</h2>
                <p className="text-zinc-400 mb-4">When you post content:</p>
                <ul className="list-disc list-inside space-y-2 text-zinc-400">
                    <li>You own your content, but grant FlixTrend a license to display it on the platform.</li>
                    <li>Do not post illegal, harmful, violent, or hateful content.</li>
                    <li>Do not spam, hack, or harass other users.</li>
                    <li>Respect copyrights and trademarks. Only post content you own or have rights to.</li>
                </ul>
            </section>
            
            <section>
                <h2 className="text-2xl font-light text-zinc-100 mb-3">3. Termination</h2>
                <p className="text-zinc-400 mb-4">We reserve the right to suspend or remove accounts that:</p>
                <ul className="list-disc list-inside space-y-2 text-zinc-400">
                    <li>Violate these Terms.</li>
                    <li>Spread harmful or illegal content.</li>
                    <li>Attempt to exploit or attack the platform.</li>
                </ul>
                 <p className="text-zinc-400 mt-2">You can delete your account at any time in your settings.</p>
            </section>

            <section>
                <h2 className="text-2xl font-light text-zinc-100 mb-3">4. Limitation of Liability</h2>
                <p className="text-zinc-400">
                    FlixTrend is provided “as is.” We do not guarantee uninterrupted access, error-free operation, or complete immunity from security risks. By using our service, you accept this risk.
                </p>
            </section>

             <section>
                <h2 className="text-2xl font-light text-zinc-100 mb-3">5. Changes to Terms</h2>
                <p className="text-zinc-400">
                    We may update these Terms as FlixTrend grows. We’ll notify you of major changes.
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
