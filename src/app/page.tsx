"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/navigation";
import { auth } from "@/utils/firebaseClient";
import { FlixTrendLogo } from "@/components/FlixTrendLogo";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 }
};

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(user => {
      if (user) router.replace("/home");
      else setLoading(false);
    });
    return () => unsub();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0b0c]">
        <FlixTrendLogo size={88} />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>FlixTrend — The calm side of the internet</title>
        <meta
          name="description"
          content="FlixTrend is a calm, human-first social platform. A space where connection feels real, not performed."
        />
      </Head>

      {/* Grain Overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-50 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
        }}
      />

      <main className="min-h-screen bg-[#0b0b0c] text-zinc-200 flex flex-col relative">

        {/* HERO */}
        <section className="min-h-screen flex items-center justify-center px-6">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl text-center space-y-10"
          >
            <div className="flex justify-center">
              <FlixTrendLogo size={96} />
            </div>

            <h1 className="text-4xl md:text-5xl font-light tracking-tight text-zinc-100">
              The calm side of the internet.
            </h1>

            <p className="text-lg md:text-xl font-light text-zinc-400 leading-relaxed">
              To create a space where connection feels real, not performed.
            </p>

            <div className="flex justify-center gap-4 pt-4">
              <Link
                href="/signup"
                className="px-8 py-3 rounded-md bg-zinc-100 text-black text-sm font-medium hover:bg-white transition"
              >
                Sign up
              </Link>

              <Link
                href="/login"
                className="px-8 py-3 rounded-md border border-zinc-700 text-zinc-300 text-sm hover:border-zinc-500 transition"
              >
                Log in
              </Link>
            </div>
          </motion.div>
        </section>

        {/* BELIEF */}
        <section className="py-32 px-6">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1 }}
            className="max-w-xl mx-auto text-center space-y-8"
          >
            <p className="text-base md:text-lg text-zinc-400 font-light leading-relaxed">
              Social media wasn’t always loud.
            </p>

            <p className="text-base md:text-lg text-zinc-400 font-light leading-relaxed">
              Somewhere along the way, connection became performance.
            </p>

            <p className="text-base md:text-lg text-zinc-400 font-light leading-relaxed">
              We built FlixTrend for people who miss the quieter internet —
              where sharing felt human, not optimized.
            </p>
          </motion.div>
        </section>

        {/* DIFFERENCE */}
        <section className="py-24 px-6 border-t border-zinc-800/50">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            transition={{ staggerChildren: 0.15 }}
            className="max-w-3xl mx-auto grid gap-12 md:grid-cols-3 text-center"
          >
            {[
              {
                title: "Real over performed",
                desc: "No pressure to impress. Just be yourself."
              },
              {
                title: "Calm over chaos",
                desc: "No noise. No constant stimulation."
              },
              {
                title: "Meaning over metrics",
                desc: "Connections matter more than numbers."
              }
            ].map(item => (
              <motion.div
                key={item.title}
                variants={fadeUp}
                transition={{ duration: 0.8 }}
                className="space-y-3"
              >
                <h3 className="text-lg font-light text-zinc-100">
                  {item.title}
                </h3>
                <p className="text-sm text-zinc-500">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* FOOTER */}
        <footer className="py-12 px-6 border-t border-zinc-800/50">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6"
          >
            <p className="text-xs text-zinc-500">
              © {new Date().getFullYear()} FlixTrend
            </p>

            <div className="flex gap-6 text-xs text-zinc-500">
              <Link href="/about" className="hover:text-zinc-300">About</Link>
              <Link href="/privacy" className="hover:text-zinc-300">Privacy</Link>
              <Link href="/terms" className="hover:text-zinc-300">Terms</Link>
              <Link href="/contact" className="hover:text-zinc-300">Contact</Link>
            </div>
          </motion.div>
        </footer>
      </main>
    </>
  );
}