
"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/utils/firebaseClient";
import { FlixTrendLogo } from "@/components/FlixTrendLogo";
import { motion } from "framer-motion";
import { Bot, Music, ShieldCheck, Sparkles, Video, MessageSquare, Flame } from "lucide-react";
import { FaInstagram, FaYoutube, FaTwitter } from "react-icons/fa";


export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        router.replace('/home');
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-900">
        <style jsx global>{`
          body {
            background-color: #111827 !important;
          }
        `}</style>
        <FlixTrendLogo size={80} />
        <h1 className="text-3xl font-headline text-accent-cyan font-bold mt-4 animate-glow">
          FlixTrend
        </h1>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        body {
          background: linear-gradient(135deg, #0a0118, #100a20);
          color: #E0E7FF;
        }
        .hero-bg-animation {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            z-index: 0;
        }
        .hero-bg-animation::before {
            content: '';
            position: absolute;
            width: 400px;
            height: 400px;
            background: radial-gradient(circle, rgba(0, 240, 255, 0.2), transparent 60%);
            animation: pulse-glow-cyan 8s infinite alternate;
        }
         .hero-bg-animation::after {
            content: '';
            position: absolute;
            width: 400px;
            height: 400px;
            bottom: -100px;
            right: -100px;
            background: radial-gradient(circle, rgba(255, 60, 172, 0.2), transparent 60%);
            animation: pulse-glow-pink 10s infinite alternate;
        }

        @keyframes pulse-glow-cyan {
          0% { transform: translate(0, 0) scale(1); opacity: 0.8; }
          100% { transform: translate(100px, 100px) scale(1.5); opacity: 0.4; }
        }
         @keyframes pulse-glow-pink {
          0% { transform: translate(0, 0) scale(1.5); opacity: 0.4; }
          100% { transform: translate(-100px, -100px) scale(1); opacity: 0.8; }
        }
        .btn-glow {
            box-shadow: 0 0 10px var(--glow-color), 0 0 20px var(--glow-color);
        }
        .text-glow {
            text-shadow: 0 0 8px currentColor;
        }
      `}</style>
      <div className="min-h-screen font-body">
        {/* Hero Section */}
        <section className="relative flex flex-col items-center justify-center h-screen text-center overflow-hidden px-4">
            <div className="hero-bg-animation" />

            <div className="relative z-10 flex flex-col items-center gap-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, type: "spring" }}
                >
                    <FlixTrendLogo size={120} />
                </motion.div>
                
                <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-4xl md:text-5xl font-headline font-bold max-w-2xl text-glow" style={{ color: 'white' }}>
                    FlixTrend – The Future of Social, Built for Gen-Z. Secure. Creative. Connected.
                </motion.h1>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="flex flex-col md:flex-row gap-4 mt-4">
                     <Link href="/signup" className="px-8 py-3 rounded-full bg-accent-pink text-white font-bold text-lg shadow-lg hover:scale-105 transition-transform" style={{'--glow-color': '#FF3CAC'} as React.CSSProperties}>Sign Up</Link>
                    <Link href="/login" className="px-8 py-3 rounded-full bg-accent-cyan text-black font-bold text-lg shadow-lg hover:scale-105 transition-transform" style={{'--glow-color': '#00F0FF'} as React.CSSProperties}>Log In</Link>
                     <Link href="/guest" className="px-8 py-3 rounded-full border-2 border-accent-purple text-white font-bold text-lg shadow-lg hover:bg-accent-purple hover:scale-105 transition-all" style={{'--glow-color': '#BF00FF'} as React.CSSProperties}>Continue as Guest</Link>
                </motion.div>
                 <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="text-xs text-gray-400 max-w-sm mt-6">
                    We’re previewing FlixTrend for web right now. The Android app is in progress and will launch before the end of 2025 – crafted to be the best Gen-Z social app.
                </motion.p>
            </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 max-w-6xl mx-auto">
            <h2 className="text-4xl font-headline font-bold text-center mb-12 text-glow" style={{ color: 'var(--accent-cyan)'}}>What's the Vibe?</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <FeatureCard icon={<Flame />} title="VibeSpace" desc="Share your vibes, scroll fresh content, and live the moment." />
                <FeatureCard icon={<Music />} title="Flashes" desc="Quick, fun, and expressive story-style posts that vanish." />
                <FeatureCard icon={<Video />} title="Scope" desc="Dive into endless creativity, like shorts but smarter." />
                <FeatureCard icon={<MessageSquare />} title="Signal" desc="Private, secure, and fast messaging for your circle." />
                <FeatureCard icon={<ShieldCheck />} title="Voltix Security" desc="Proprietary ledger-based security providing top-layer encryption." />
            </div>
        </section>

        {/* Trust & Safety Section */}
        <section className="py-20 px-4 text-center">
            <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                className="text-3xl font-headline font-bold mb-4 max-w-3xl mx-auto">
                Built for Gen-Z. <span className="text-glow" style={{color: 'var(--accent-pink)'}}>Powered by Security.</span> Where Vibes Meet Future.
            </motion.h2>
            <motion.p 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                className="text-gray-400 mb-8 max-w-2xl mx-auto">
                We never track you. We never sell your data. Your privacy is our top priority. With end-to-end encryption and AI-powered moderation, your space is yours.
            </motion.p>
            <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                className="flex items-center justify-center gap-2 font-bold text-accent-cyan text-glow">
                <ShieldCheck size={40} />
                <span className="text-xl">Powered by Voltix Security</span>
            </motion.div>
        </section>
        
        {/* Community & Story Section */}
        <section className="py-12 px-4 text-center">
             <h2 className="text-4xl font-headline font-bold text-center mb-8 text-glow" style={{ color: 'var(--accent-purple)'}}>Join Our World</h2>
            <div className="flex justify-center gap-4 flex-wrap">
                 <Link href="/about" className="text-lg font-semibold hover:text-accent-pink transition-colors">Our Dev Story</Link>
                 <span className="text-gray-600">|</span>
                 <Link href="#" className="text-lg font-semibold hover:text-accent-pink transition-colors">FlixTrend News</Link>
                 <span className="text-gray-600">|</span>
                 <Link href="#" className="text-lg font-semibold hover:text-accent-pink transition-colors">We're Hiring</Link>
                 <span className="text-gray-600">|</span>
                 <Link href="/about" className="text-lg font-semibold hover:text-accent-pink transition-colors">About FlixTrend</Link>
            </div>
        </section>

        {/* Footer */}
        <footer className="w-full py-12 bg-black/30 text-center flex flex-col gap-8 items-center mt-8 border-t border-accent-cyan/10">
            <div className="flex gap-8">
                <SocialIcon href="#" icon={<FaInstagram />} />
                <SocialIcon href="#" icon={<FaYoutube />} />
                <SocialIcon href="#" icon={<FaTwitter />} />
            </div>
            <div className="flex gap-4 text-xs text-gray-500">
                <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-white">Terms of Service</Link>
                <Link href="#" className="hover:text-white">Contact</Link>
            </div>
            <p className="text-sm text-gray-600">&copy; {new Date().getFullYear()} FlixTrend. All rights reserved.</p>
        </footer>
      </div>
    </>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <motion.div 
      className="p-6 flex flex-col items-center text-center rounded-2xl transition-all"
      style={{ background: 'rgba(21, 21, 21, 0.5)', border: '1px solid rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)'}}
      whileHover={{ scale: 1.05, y: -5, borderColor: 'var(--accent-cyan)' }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-4xl mb-4 text-accent-pink">{icon}</div>
      <h3 className="font-headline text-xl font-bold mb-2 text-accent-cyan">{title}</h3>
      <p className="text-base text-gray-400">{desc}</p>
    </motion.div>
  );
}

function SocialIcon({ icon, href }: { icon: React.ReactNode, href: string }) {
    return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-3xl text-gray-400 hover:text-accent-pink transition-all hover:scale-110 hover:drop-shadow-[0_0_8px_var(--accent-pink)]">
            {icon}
        </a>
    )
}
