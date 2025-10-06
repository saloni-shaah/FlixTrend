
"use client";
import React, { useState } from "react";
import Link from "next/link";
import { auth } from "@/utils/firebaseClient";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      // Firebase handles the link generation and sending via its backend.
      // The user will receive an email with a link to reset their password.
      await sendPasswordResetEmail(auth, email);
      setSuccess("Password reset email sent! Please check your inbox (and spam folder).");
    } catch (err: any) {
      // Provide more user-friendly error messages
      if (err.code === 'auth/user-not-found') {
        setError("No account found with that email address.");
      } else {
        setError("Failed to send reset email. Please try again.");
      }
      console.error("Password Reset Error:", err);
    }
    setLoading(false);
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <motion.form 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            onSubmit={handleSubmit}
            className="glass-card p-8 w-full max-w-md flex flex-col gap-4"
            onClick={e => e.stopPropagation()}
        >
            <h2 className="text-2xl font-headline font-bold text-accent-cyan mb-2 text-center">Reset Password</h2>
            <p className="text-gray-400 text-center text-sm mb-4">Enter your email to receive a password reset link.</p>
            <input
                type="email"
                placeholder="Email"
                className="input-glass w-full"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
            />
            {error && <div className="text-red-400 text-center animate-bounce mt-2">{error}</div>}
            {success && <div className="text-accent-cyan text-center mt-2">{success}</div>}
            <button
              type="submit"
              className="btn-glass mt-4 bg-accent-cyan/80 text-black"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
            <button type="button" className="text-center text-sm text-gray-400 mt-2 hover:underline" onClick={onClose}>
                Back to Login
            </button>
        </motion.form>
    </div>
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/home?new=true");
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in">
      <motion.form
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        onSubmit={handleSubmit}
        className="glass-card p-8 w-full max-w-md flex flex-col gap-6"
      >
        <h2 className="text-3xl font-headline font-bold text-accent-pink mb-2 text-center">Welcome Back</h2>
        <p className="text-accent-cyan text-center mb-4">Login to FlixTrend</p>
        <div className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            className="input-glass w-full"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="input-glass w-full"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="text-right -mt-2">
            <button 
                type="button" 
                onClick={() => setShowForgotPassword(true)}
                className="text-xs text-accent-cyan hover:underline"
            >
                Forgot Password?
            </button>
        </div>
        {error && <div className="text-red-400 text-center animate-bounce mt-2">{error}</div>}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          className="btn-glass mt-4 bg-accent-pink/80"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </motion.button>
        <div className="text-center mt-2">
          <span className="text-gray-400">Don't have an account? </span>
          <Link href="/signup" className="text-accent-cyan hover:underline">Sign up</Link>
        </div>
      </motion.form>
      {showForgotPassword && <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />}
    </div>
  );
}
