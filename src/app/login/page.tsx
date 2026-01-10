
"use client";
import React, { useState, Suspense, useEffect } from "react";
import { useSearchParams } from 'next/navigation';
import Link from "next/link";
import { auth } from "@/utils/firebaseClient";
import { 
    signInWithEmailAndPassword,
    RecaptchaVerifier,
    signInWithPhoneNumber 
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import LoginWithEmail from "./LoginWithEmail";
import CountrySelector from "@/components/ui/CountrySelector";
import { Mail, Phone } from "lucide-react";

function LoginPageContent() {
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('phone');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // This function will initialize the recaptcha verifier, but only when needed for phone auth.
    // It's attached to the window object to be accessible within the phone sign-in handler.
    (window as any).initializeRecaptchaVerifier = () => {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible',
          'callback': (response: any) => {
            // reCAPTCHA solved.
          }
        });
      }
      return window.recaptchaVerifier;
    }
  }, []);

  const handlePhoneSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const fullPhoneNumber = `${countryCode}${phoneNumber}`;
      const appVerifier = (window as any).initializeRecaptchaVerifier();
      const result = await signInWithPhoneNumber(auth, fullPhoneNumber, appVerifier);
      setConfirmationResult(result);
      setShowOtpInput(true);
    } catch (err: any) {
      setError("Failed to send OTP. Please check the phone number or try again later.");
      console.error("Phone Sign In Error:", err);
    }
    setLoading(false);
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
        await signInWithEmailAndPassword(auth, email, password);
        router.push("/home");
    } catch (err: any) {
        setError("Invalid email or password.");
        console.error("Email Sign In Error:", err);
    }
    setLoading(false);
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await confirmationResult.confirm(otp);
      router.push("/home");
    } catch (err: any) {
      setError("Invalid OTP. Please try again.");
      console.error("OTP Verification Error:", err);
    }
    setLoading(false);
  };

  const renderPhoneForm = () => !showOtpInput ? (
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
  );

  const renderEmailForm = () => (
     <form onSubmit={handleEmailSignIn} className="flex flex-col gap-4">
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
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="btn-glass mt-4 bg-accent-pink/80"
            disabled={loading}
        >
            {loading ? "Logging In..." : "Log In"}
        </motion.button>
     </form>
  );

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
        
        <div className="flex bg-black/20 p-1 rounded-full">
            <button onClick={() => setLoginMethod('phone')} className={`flex-1 p-2 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-colors ${loginMethod === 'phone' ? 'bg-accent-cyan text-black' : 'text-gray-300'}`}>
                <Phone size={16}/> Phone
            </button>
             <button onClick={() => setLoginMethod('email')} className={`flex-1 p-2 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-colors ${loginMethod === 'email' ? 'bg-accent-cyan text-black' : 'text-gray-300'}`}>
                <Mail size={16}/> Email
            </button>
        </div>
        
        {loginMethod === 'phone' ? renderPhoneForm() : renderEmailForm()}

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
