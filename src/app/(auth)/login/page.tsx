"use client";
import React, { useState } from "react";
import Link from "next/link";
import { auth } from "@/utils/firebaseClient";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Mail, Phone, Lock } from "lucide-react";

export default function LoginPage() {
  const [login, setLogin] = useState(""); // Can be email or phone
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // For this MVP, we assume login is with email as Firebase phone auth requires more setup.
      await signInWithEmailAndPassword(auth, login, password);
      router.push("/home");
    } catch (err: any) {
      setError("Failed to sign in. Please check your credentials.");
      console.error(err);
    }
    setLoading(false);
  };

  const isEmail = login.includes('@');

  return (
    <div className="min-h-screen flex items-center justify-center font-body p-4">
      <form
        onSubmit={handleSubmit}
        className="glass-card rounded-2xl p-8 w-full max-w-md flex flex-col gap-6 animate-fade-in"
      >
        <div className="text-center">
            <h2 className="text-3xl font-headline font-bold text-[var(--accent-pink)] mb-2 drop-shadow-[0_0_10px_var(--accent-pink)]">Welcome Back</h2>
            <p className="text-[var(--accent-cyan)]">Sign in to continue your streak.</p>
        </div>
        
        <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--accent-cyan)]">
                {isEmail ? <Mail size={20} /> : <Phone size={20} />}
            </span>
            <input
                type="text"
                placeholder="Email or Phone Number"
                className="w-full pl-12 pr-4 py-3 rounded-full bg-black/40 text-white border-2 border-[var(--accent-cyan)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent-pink)]"
                value={login}
                onChange={e => setLogin(e.target.value)}
                required
            />
        </div>

        <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--accent-cyan)]">
                <Lock size={20} />
            </span>
            <input
                type="password"
                placeholder="Password"
                className="w-full pl-12 pr-4 py-3 rounded-full bg-black/40 text-white border-2 border-[var(--accent-cyan)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent-pink)]"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
            />
        </div>
        
        {error && <div className="text-red-400 text-center animate-bounce mt-2">{error}</div>}
        
        <button
          type="submit"
          className="mt-4 px-8 py-3 rounded-full bg-[var(--accent-pink)] text-white font-bold text-lg pulse-glow"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        
        <div className="text-center mt-2">
          <span className="text-gray-400">Don't have an account? </span>
          <Link href="/signup" className="text-[var(--accent-cyan)] hover:underline">Sign up</Link>
        </div>
      </form>
    </div>
  );
}
