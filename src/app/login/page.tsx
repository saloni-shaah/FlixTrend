"use client";
import React, { useState } from "react";
import Link from "next/link";
import { auth } from "@/utils/firebaseClient";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/home"); // Redirect immediately after login
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-secondary to-accent-cyan text-white font-body">
      <form
        onSubmit={handleSubmit}
        className="bg-card/80 rounded-2xl shadow-fab-glow p-8 w-full max-w-md flex flex-col gap-6 animate-fade-in"
      >
        <h2 className="text-3xl font-headline font-bold text-accent-pink mb-2 text-center drop-shadow">Welcome Back</h2>
        <p className="text-accent-cyan text-center mb-4">Login to FlixTrend</p>
        <div className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            className="px-4 py-3 rounded-full bg-black/40 text-white border-2 border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-pink"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="px-4 py-3 rounded-full bg-black/40 text-white border-2 border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-pink"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <div className="text-red-400 text-center animate-bounce mt-2">{error}</div>}
        <button
          type="submit"
          className="mt-4 px-8 py-3 rounded-full bg-accent-pink text-white font-bold text-lg shadow-fab-glow hover:scale-105 hover:shadow-lg transition-all duration-200 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        <div className="text-center mt-2">
          <span className="text-gray-400">Don't have an account? </span>
          <Link href="/signup" className="text-accent-cyan hover:underline">Sign up</Link>
        </div>
      </form>
    </div>
  );
} 
