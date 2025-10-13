
"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/utils/firebaseClient";
import { FlixTrendLogo } from "@/components/FlixTrendLogo";
import { motion } from "framer-motion";
import { Music, ShieldCheck, Video, MessageSquare, Flame } from "lucide-react";
import { FaInstagram, FaYoutube, FaXTwitter, FaFacebook } from "react-icons/fa6";
import Head from 'next/head';


export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "name": "FlixTrend",
        "url": "https://flixtrend.in",
        "logo": "https://flixtrend.in/icons/icon-512x512.png",
        "sameAs": [
          "https://twitter.com/FlxTrnd",
          "https://instagram.com/FlxTrnd",
          "https://youtube.com/@FlxTrnd",
          "https://facebook.com/FlxTrnd"
        ]
      },
      {
        "@type": "WebSite",
        "name": "FlixTrend",
        "url": "https://flixtrend.in",
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://flixtrend.in/guest?q={search_term_string}"
          },
          "query-input": "required name=search_term_string"
        }
      }
    ]
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        router.replace('/home');
      } else {
        setTimeout(() => setLoading(false), 500);
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
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <FlixTrendLogo size={100} />
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-4xl font-headline text-accent-cyan font-bold mt-4 text-glow"
        >
          FlixTrend
        </motion.h1>
         <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-sm text-gray-400 mt-2 animate-pulse"
        >
          Loading your vibe...
        </motion.p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>
      <style jsx global>{`
        body {
          background: #0a0118;
          color: #E0E7FF;
        }
        
        .starry-bg {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: transparent;
            overflow: hidden;
            z-index: -2;
        }

        .stars {
            background-image: 
                radial-gradient(1px 1px at 20% 30%, #fff, transparent),
                radial-gradient(1px 1px at 80% 10%, #fff, transparent),
                radial-gradient(1px 1px at 50% 70%, #fff, transparent),
                radial-gradient(2px 2px at 90% 80%, #fff, transparent),
                radial-gradient(1px 1px at 10% 90%, #fff, transparent),
                radial-gradient(2px 2px at 40% 50%, #fff, transparent);
            animation: twinkle 20s infinite linear;
        }

        @keyframes twinkle {
            0% { transform: translateY(0); }
            100% { transform: translateY(-100vh); }
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
        
        .floating-shape {
            position: absolute;
            border-radius: 50%;
            filter: blur(80px);
            will-change: transform;
        }
        .shape1 { width: 300px; height: 300px; background: rgba(0, 240, 255, 0.2); animation: float 15s infinite alternate; top: 10%; left: 10%; }
        .shape2 { width: 400px; height: 400px; background: rgba(255, 60, 172, 0.25); animation: float 20s infinite alternate-reverse; bottom: 5%; right: 5%; }
        .shape3 { width: 250px; height: 250px; background: rgba(191, 0, 255, 0.2); animation: float 18s infinite alternate; top: 50%; right: 20%; }
        .shape4 { width: 200px; height: 200px; background: rgba(57, 255, 20, 0.15); animation: float 22s infinite alternate; bottom: 20%; left: 15%; }


        @keyframes float {
            0% { transform: translate(0, 0) scale(1); }
            100% { transform: translate(100px, 50px) scale(1.3); }
        }

        .btn-glow {
            box-shadow: 0 0 10px var(--glow-color, #fff), 0 0 20px var(--glow-color, #fff);
            transition: all 0.3s ease;
        }
        .btn-glow:hover {
            box-shadow: 0 0 20px var(--glow-color, #fff), 0 0 40px var(--glow-color, #fff), 0 0 60px var(--glow-color, #fff);
        }
        .text-glow {
            text-shadow: 0 0 8px currentColor;
        }
      `}</style>
      <div className="min-h-screen font-body relative">
        <div className="starry-bg">
            <div className="stars" style={{ height: '200vh' }}></div>
        </div>

        {/* Hero Section */}
        <section className="relative flex flex-col items-center justify-center h-screen text-center overflow-hidden px-4">
            <div className="hero-bg-animation">
                <div className="floating-shape shape1"></div>
                <div className="floating-shape shape2"></div>
                <div className="floating-shape shape3"></div>
                <div className="floating-shape shape4"></div>
            </div>

            <div className="relative z-10 flex flex-col items-center gap-6">
                <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    initial={{ opacity: 0, scale: 0.8, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 1, type: "spring", stiffness: 100 }}
                    className="animate-float"
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
                     <Link href="/signup" className="btn-glow px-8 py-3 rounded-full bg-accent-pink text-white font-bold text-lg hover:scale-105 transition-transform" style={{'--glow-color': '#FF3CAC'} as React.CSSProperties}>Sign Up</Link>
                    <Link href="/login" className="btn-glow px-8 py-3 rounded-full bg-accent-purple text-white font-bold text-lg hover:scale-105 transition-transform" style={{'--glow-color': '#BF00FF'} as React.CSSProperties}>Log In</Link>
                     <Link href="/guest" className="btn-glow px-8 py-3 rounded-full border-2 border-accent-cyan text-white font-bold text-lg hover:bg-accent-cyan hover:text-black transition-all" style={{'--glow-color': '#00F0FF'} as React.CSSProperties}>Continue as Guest</Link>
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
                We never track you. We never sell your data. Your privacy is our top priority. With end-to-end encryption and moderation, your space is yours.
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
                 <Link href="/ad-studio" className="text-lg font-semibold hover:text-accent-pink transition-colors">Ad Studio</Link>
                 <span className="text-gray-600">|</span>
                 <Link href="/hiring" className="text-lg font-semibold hover:text-accent-pink transition-colors">We're Hiring</Link>
            </div>
        </section>

        {/* Footer */}
        <footer className="w-full py-12 bg-black/30 text-center flex flex-col gap-8 items-center mt-8 border-t border-accent-cyan/10">
            <h2 className="font-calligraphy text-7xl md:text-8xl font-bold bg-gradient-to-r from-accent-pink to-accent-cyan bg-clip-text text-transparent text-glow opacity-70">
              FlixTrend
            </h2>
            <div className="flex gap-8">
                <SocialIcon href="https://instagram.com/FlxTrnd" icon={<FaInstagram />} />
                <SocialIcon href="https://youtube.com/@FlxTrnd" icon={<FaYoutube />} />
                <SocialIcon href="https://twitter.com/FlxTrnd" icon={<FaXTwitter />} />
                <SocialIcon href="https://facebook.com/FlxTrnd" icon={<FaFacebook />} />
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
