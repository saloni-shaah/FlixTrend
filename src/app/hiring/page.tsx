
"use client";
import React, { useState } from "react";
import Link from "next/link";
import { FlixTrendLogo } from "@/components/FlixTrendLogo";
import { motion } from "framer-motion";
import { Bot, Code, Gamepad2, Send, CheckCircle } from "lucide-react";

const roles = [
    { name: "Web Developer (Next.js)", icon: <Code /> },
    { name: "App Developer (React Native/Flutter)", icon: <Code /> },
    { name: "Game Developer (Unity/Unreal)", icon: <Gamepad2 /> },
    { name: "AI Engineer (Genkit/Python)", icon: <Bot /> },
    { name: "UI/UX Designer", icon: <Code /> },
    { name: "Community Manager", icon: <Code /> },
];

export default function HiringPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        portfolio: "",
        role: "",
        message: ""
    });
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, this would send data to a backend (e.g., via a server action)
        console.log("Application Submitted:", formData);
        setSubmitted(true);
    };

  return (
    <div className="min-h-screen font-body text-white">
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

      <section className="max-w-4xl mx-auto pt-28 pb-20 px-4 text-center">
        <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-headline font-bold text-accent-pink text-shadow-glow">
            Join Our Vibe. Build the Future.
        </motion.h1>
        <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-3xl mx-auto mt-4 text-lg text-accent-cyan">
            We're not just building an app; we're building a new era of social media. Our mission is to assemble a visionary team of 200 passionate creators, developers, and builders who believe in a more authentic digital world.
        </motion.p>
      </section>

      <section className="max-w-5xl mx-auto px-4">
        <div className="glass-card p-8 md:p-12">
            <h2 className="text-3xl font-headline text-center font-bold text-accent-cyan mb-8">Who We're Looking For</h2>
            <div className="grid md:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-xl font-bold text-accent-pink mb-3">Our Philosophy</h3>
                    <p className="text-gray-300 space-y-4">
                        <span>We're a team that values raw talent over fancy papers. If you have the skills, the passion, and the drive, we want you.</span>
                        <span className="block mt-2"><strong className="text-accent-cyan">Real Skills > Degrees:</strong> Your portfolio, your projects, and your problem-solving abilities matter most.</span>
                        <span className="block mt-2"><strong className="text-accent-cyan">Experience That Counts:</strong> We're seeking builders with 2-5 years of real-world experience who can hit the ground running.</span>
                        <span className="block mt-2"><strong className="text-accent-cyan">Long-Term Vision:</strong> We want pioneers who are in it for the long haul, ready to grow with us and shape the future of FlixTrend and beyond.</span>
                    </p>
                </div>
                 <div>
                    <h3 className="text-xl font-bold text-accent-pink mb-3">Open Roles</h3>
                    <div className="flex flex-wrap gap-3">
                        {roles.map(role => (
                            <div key={role.name} className="flex items-center gap-2 p-2 rounded-lg bg-black/30">
                                {role.icon}
                                <span className="text-sm font-semibold text-gray-300">{role.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto py-20 px-4">
        <h2 className="text-3xl font-headline text-center font-bold text-accent-pink mb-8">Apply Now</h2>
        {submitted ? (
            <motion.div initial={{opacity: 0, scale: 0.9}} animate={{opacity: 1, scale: 1}} className="glass-card p-8 text-center">
                <CheckCircle className="mx-auto text-green-400 mb-4" size={48} />
                <h3 className="text-2xl font-bold text-green-400">Application Received!</h3>
                <p className="text-gray-300 mt-2">Thanks for your interest. We'll review your application and be in touch if there's a good fit.</p>
            </motion.div>
        ) : (
            <form onSubmit={handleSubmit} className="glass-card p-8 flex flex-col gap-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <input type="text" name="name" placeholder="Full Name" className="input-glass w-full" required onChange={handleChange} />
                    <input type="email" name="email" placeholder="Email Address" className="input-glass w-full" required onChange={handleChange} />
                </div>
                <input type="text" name="portfolio" placeholder="Portfolio / LinkedIn / GitHub URL" className="input-glass w-full" required onChange={handleChange} />
                <select name="role" className="input-glass w-full" required onChange={handleChange} value={formData.role}>
                    <option value="" disabled>Select Role of Interest...</option>
                    {roles.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                </select>
                <textarea name="message" placeholder="Why do you want to join FlixTrend?" className="input-glass w-full rounded-2xl min-h-[120px]" required onChange={handleChange} />
                <button type="submit" className="btn-glass bg-accent-pink mt-4 flex items-center justify-center gap-2">
                    Submit Application <Send size={16}/>
                </button>
            </form>
        )}
      </section>

       <footer className="w-full py-8 bg-black/60 text-center flex flex-col gap-2 items-center mt-8 border-t border-accent-cyan/20">
            <p className="text-sm">&copy; {new Date().getFullYear()} FlixTrend. All rights reserved.</p>
            <Link href="/" className="text-xs text-accent-cyan hover:underline">Home</Link>
        </footer>
    </div>
  );
}
