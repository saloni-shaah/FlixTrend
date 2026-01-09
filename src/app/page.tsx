
"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/utils/firebaseClient";
import { FlixTrendLogo } from "@/components/FlixTrendLogo";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import Head from 'next/head';
import '@fontsource/cinzel/700.css';
import '@fontsource/cinzel/400.css';
import '@fontsource/great-vibes';

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
        "logo": "https://flixtrend.in/logo.svg",
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
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0b0b0c]">
        <style jsx global>{`
          body {
            background: #0b0b0c !important;
          }
        `}</style>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <FlixTrendLogo size={100} />
        </motion.div>
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
        .font-tagline {
            font-family: 'Cinzel', serif;
        }
        .font-calligraphy {
            font-family: 'Great Vibes', cursive;
        }
      `}</style>
      <div className="min-h-screen font-body text-zinc-200">

        {/* Hero Section */}
        <motion.section 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeIn" }}
          className="relative flex flex-col items-center justify-center min-h-[80vh] text-center px-4"
        >
            <div className="relative z-10 flex flex-col items-center gap-8">
                <FlixTrendLogo size={100} />
                
                <h1 className="font-tagline text-4xl md:text-6xl font-bold max-w-2xl text-zinc-100">
                    The calm side of the internet.
                </h1>
                <p className="font-calligraphy text-2xl md:text-4xl text-zinc-400">
                    To create a space where connection feels real, not performed.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mt-6">
                    <Link href="/signup" className="px-8 py-3 rounded-full bg-zinc-100 text-zinc-900 font-bold text-lg hover:bg-zinc-200 transition-colors">Sign Up</Link>
                    <Link href="/login" className="px-8 py-3 rounded-full border border-zinc-700 text-zinc-300 font-bold text-lg hover:bg-zinc-800 transition-colors">Log In</Link>
                </div>
            </div>
        </motion.section>

        {/* Belief Section */}
        <section className="py-24 px-4 max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-tagline font-bold mb-8">
                No trends.
                <br/>
                No performance.
                <br/>
                No noise.
            </h2>
            <p className="text-4xl md:text-6xl font-calligraphy text-zinc-400">Just people.</p>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4 text-center">
            <h2 className="text-3xl font-tagline font-bold mb-4">Find your space.</h2>
            <p className="text-lg text-zinc-400 mb-8">Ready to experience a different kind of social media?</p>
            <Link href="/signup" className="px-10 py-4 rounded-full bg-zinc-100 text-zinc-900 font-bold text-xl hover:scale-105 hover:bg-zinc-200 transition-transform duration-200">
                Get Started
            </Link>
        </section>
        
        {/* Footer */}
        <footer className="w-full py-12 text-center flex flex-col gap-6 items-center mt-8 border-t border-zinc-800">
            <div className="flex gap-6 text-zinc-500">
                <Link href="/about" className="hover:text-zinc-300 transition-colors">Our Story</Link>
                <Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-zinc-300 transition-colors">Terms of Service</Link>
            </div>
            <p className="text-sm text-zinc-600">&copy; {new Date().getFullYear()} FlixTrend. All rights reserved.</p>
        </footer>
      </div>
    </>
  );
}
