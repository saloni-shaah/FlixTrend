
"use client";
import React, { useState, Suspense, useEffect } from "react";
import { useSearchParams } from 'next/navigation';
import Link from "next/link";
import { auth } from "@/utils/firebaseClient";
import { 
    RecaptchaVerifier,
    signInWithPhoneNumber 
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import LoginWithEmail from "./LoginWithEmail";
import CountrySelector from "@/components/ui/CountrySelector";

// ... (ForgotPasswordModal remains the same)

function LoginPageContent() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible',
      'callback': (response: any) => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
      }
    });
  }, []);

  const handlePhoneSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const fullPhoneNumber = `${countryCode}${phoneNumber}`;
      const verifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, fullPhoneNumber, verifier);
      setConfirmationResult(result);
      setShowOtpInput(true);
    } catch (err: any) {
      setError("Failed to send OTP. Please check the phone number and try again.");
      console.error("Phone Sign In Error:", err);
    }
    setLoading(false);
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await confirmationResult.confirm(otp);
      router.push("/home?new=true");
    } catch (err: any) {
      setError("Invalid OTP. Please try again.");
      console.error("OTP Verification Error:", err);
    }
    setLoading(false);
  };


  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card p-8 w-full max-w-md flex flex-col gap-6"
      >
        <div id="recaptcha-container"></div>
        <h2 className="text-3xl font-headline font-bold text-accent-pink mb-2 text-center">Welcome Back</h2>
        <p className="text-accent-cyan text-center mb-4">Login with your phone number</p>
        
        {!showOtpInput ? (
          <form onSubmit={handlePhoneSignIn} className="flex flex-col gap-4">
            <CountrySelector onCountrySelect={setCountryCode} />
            <input
              type="tel"
              placeholder="Phone Number"
              className="input-glass w-full"
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
              required
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="btn-glass mt-4 bg-accent-pink/80"
              disabled={loading}
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </motion.button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Enter OTP"
              className="input-glass w-full"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              required
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="btn-glass mt-4 bg-accent-pink/80"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </motion.button>
          </form>
        )}

        {error && <div className="text-red-400 text-center animate-bounce mt-2">{error}</div>}

        <div className="text-center mt-2">
          <span className="text-gray-400">Don't have an account? </span>
          <Link href="/signup" className="text-accent-cyan hover:underline">Sign up</Link>
        </div>
         <div className="text-center mt-2 text-xs text-gray-400">
            <Link href="/terms" className="hover:text-accent-cyan hover:underline">Terms of Service</Link>
            <span className="mx-2">|</span>
            <Link href="/privacy" className="hover:text-accent-cyan hover:underline">Privacy Policy</Link>
        </div>
      </motion.div>
    </div>
  );
}

function LoginHandler() {
    const searchParams = useSearchParams();
    const finish = searchParams.get('finish');

    if (finish) {
        return <LoginWithEmail />;
    }
    return <LoginPageContent />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginHandler />
    </Suspense>
  );
}
