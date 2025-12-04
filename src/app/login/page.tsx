
"use client";
import React, { useState, Suspense } from "react";
import { useSearchParams } from 'next/navigation';
import Link from "next/link";
import { auth } from "@/utils/firebaseClient";
import { signInWithEmailAndPassword, sendPasswordResetEmail, sendSignInLinkToEmail } from "firebase/auth";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import LoginWithEmail from "./LoginWithEmail"; // Import the new component

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
      await sendPasswordResetEmail(auth, email);
      setSuccess("Password reset email sent! Please check your inbox (and spam folder).");
    } catch (err: any) {
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

function LoginPageContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [passwordlessLoading, setPasswordlessLoading] = useState(false);
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

  const handlePasswordlessLogin = async () => {
    if (!email) {
      setError("Please enter your email to receive a sign-in link.");
      return;
    }
    setError("");
    setPasswordlessLoading(true);
    const actionCodeSettings = {
      url: `${window.location.origin}/login?finish=true`,
      handleCodeInApp: true,
    };
    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      alert('A sign-in link has been sent to your email address.');
    } catch (err: any) {
      setError(err.message);
    }
    setPasswordlessLoading(false);
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
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="input-glass w-full"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-white"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
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
        <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-600"></div>
            <span className="flex-shrink mx-4 text-gray-400">Or</span>
            <div className="flex-grow border-t border-gray-600"></div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={handlePasswordlessLogin}
          className="btn-glass bg-accent-cyan/80 text-black"
          disabled={passwordlessLoading}
        >
          {passwordlessLoading ? "Sending link..." : "Login with Email Link"}
        </motion.button>
        <div className="text-center mt-2">
          <span className="text-gray-400">Don\'t have an account? </span>
          <Link href="/signup" className="text-accent-cyan hover:underline">Sign up</Link>
        </div>
         <div className="text-center mt-2 text-xs text-gray-400">
            <Link href="/terms" className="hover:text-accent-cyan hover:underline">Terms of Service</Link>
            <span className="mx-2">|</span>
            <Link href="/privacy" className="hover:text-accent-cyan hover:underline">Privacy Policy</Link>
        </div>
      </motion.form>
      {showForgotPassword && <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />}
    </div>
  );
}

// This new component contains the logic that must be suspended.
function LoginHandler() {
    const searchParams = useSearchParams();
    const finish = searchParams.get('finish');

    if (finish) {
        return <LoginWithEmail />;
    }
    return <LoginPageContent />;
}

// The main page component now simply wraps the handler in Suspense.
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginHandler />
    </Suspense>
  );
}
