
"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { auth, app } from "@/utils/firebaseClient";
import { 
    createUserWithEmailAndPassword, 
    sendEmailVerification, 
    updateProfile,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    PhoneAuthProvider,
    linkWithCredential
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Gift } from 'lucide-react';
import CountrySelector from "@/components/ui/CountrySelector";

const db = getFirestore(app);

// Helper to check for username uniqueness
async function isUsernameUnique(username: string): Promise<boolean> {
    const usernameDocRef = doc(db, "usernames", username.toLowerCase());
    const docSnap = await getDoc(usernameDocRef);
    return !docSnap.exists();
}

declare global {
    interface Window {
        recaptchaVerifier?: RecaptchaVerifier;
    }
}

export default function SignupPage() {
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        username: "",
        name: "",
        phoneNumber: "",
        countryCode: "+91"
    });
    const [otp, setOtp] = useState("");
    const [confirmationResult, setConfirmationResult] = useState<any>(null);
    
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible',
          'callback': (response: any) => {}
        });
      }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleCountryChange = (dialCode: string) => {
        setForm({ ...form, countryCode: dialCode });
    };
    
    const nextStep = async () => {
        setError("");
        if (step === 1) { // Validate email, username, password
            if (form.password !== form.confirmPassword) {
                setError("Passwords do not match");
                return;
            }
            if (form.password.length < 6) {
                setError("Password must be at least 6 characters long.");
                return;
            }
            if (form.username.length < 3) {
                setError("Username must be at least 3 characters long.");
                return;
            }
            setLoading(true);
            const unique = await isUsernameUnique(form.username);
            setLoading(false);
            if (!unique) {
                setError("This username is already taken. Please choose another.");
                return;
            }
        }
        setStep(s => s + 1);
    };
    
    const prevStep = () => setStep(s => s - 1);

    const handleSendOtp = async () => {
        setLoading(true);
        setError("");
        try {
            const fullPhoneNumber = `${form.countryCode}${form.phoneNumber}`;
            const verifier = window.recaptchaVerifier!;
            const result = await signInWithPhoneNumber(auth, fullPhoneNumber, verifier);
            setConfirmationResult(result);
            setStep(3); // Move to OTP step
        } catch (err: any) {
            setError("Failed to send OTP. Please check the phone number.");
            console.error("OTP send error:", err);
        }
        setLoading(false);
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (step === 1) {
            nextStep();
            return;
        }
        if (step === 2) {
            handleSendOtp();
            return;
        }
        // Final step (Step 3: OTP verification and account creation)
        setLoading(true);
        setError("");
        try {
            const credential = PhoneAuthProvider.credential(confirmationResult.verificationId, otp);

            const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
            const user = userCredential.user;
            
            // Link the phone credential to the newly created email/password account
            await linkWithCredential(user, credential);

            const avatarUrl = `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${form.username}`;

            await updateProfile(user, {
                displayName: form.name,
                photoURL: avatarUrl,
            });
            
            const randomSuffix = Math.floor(100 + Math.random() * 900);
            const referralCode = `${form.username.toLowerCase().replace(/\s/g, '')}${randomSuffix}`;

            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                email: form.email,
                phoneNumber: `${form.countryCode}${form.phoneNumber}`,
                name: form.name,
                username: form.username.toLowerCase(),
                avatar_url: avatarUrl,
                createdAt: serverTimestamp(),
                profileComplete: false, // Prompt user to complete profile later
                referralCode: referralCode,
                accountType: "user",
            });

            await setDoc(doc(db, "usernames", form.username.toLowerCase()), { uid: user.uid });

            await sendEmailVerification(user);

            setSuccess("Welcome! Your account is created. Redirecting...");
            setTimeout(() => router.push("/home?new=true"), 3000);
        } catch (err: any) {
            if(err.code === 'auth/email-already-in-use') {
                setError("This email is already in use. Please log in.");
            } else if (err.code === 'auth/invalid-verification-code') {
                setError("Invalid OTP. Please try again.");
            } else {
                setError(err.message);
                console.error("Final signup error:", err);
            }
        }
        setLoading(false);
    };

    const renderStep = () => {
        switch(step) {
            case 1:
                return (
                    <motion.div key="step1" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex flex-col gap-4">
                        <h3 className="text-xl font-bold text-accent-cyan text-center">Step 1: Account Details</h3>
                        <input type="text" name="name" placeholder="Full Name" className="input-glass w-full" value={form.name} onChange={handleChange} required />
                        <input type="email" name="email" placeholder="Email" className="input-glass w-full" value={form.email} onChange={handleChange} required />
                        <input type="text" name="username" placeholder="Username" className="input-glass w-full" value={form.username} onChange={handleChange} required />
                        <input type="password" name="password" placeholder="Password (min. 6 characters)" className="input-glass w-full" value={form.password} onChange={handleChange} required />
                        <input type="password" name="confirmPassword" placeholder="Confirm Password" className="input-glass w-full" value={form.confirmPassword} onChange={handleChange} required />
                    </motion.div>
                );
            case 2:
                return (
                     <motion.div key="step2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex flex-col gap-4">
                        <h3 className="text-xl font-bold text-accent-cyan text-center">Step 2: Phone Verification</h3>
                         <CountrySelector onCountrySelect={handleCountryChange} />
                         <input type="tel" name="phoneNumber" placeholder="Phone Number" className="input-glass w-full" value={form.phoneNumber} onChange={handleChange} required />
                     </motion.div>
                );
            case 3:
                return (
                    <motion.div key="step3" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex flex-col gap-4 items-center">
                        <h3 className="text-xl font-bold text-accent-cyan text-center">Step 3: Enter OTP</h3>
                        <p className="text-sm text-gray-300 text-center">Enter the code sent to {form.countryCode} {form.phoneNumber}</p>
                         <input type="text" name="otp" placeholder="6-digit code" className="input-glass w-full text-center tracking-widest text-lg" value={otp} onChange={e => setOtp(e.target.value)} required />
                    </motion.div>
                );
            default: return null;
        }
    }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in">
       <div id="recaptcha-container"></div>
      <form
        onSubmit={handleSubmit}
        className="glass-card p-8 w-full max-w-lg flex flex-col gap-4"
      >
        <AnimatePresence mode="wait">
            {success ? (
                <motion.div key="success" initial={{ opacity: 0}} animate={{ opacity: 1}} className="text-center flex flex-col items-center gap-4">
                     <Gift className="text-brand-gold animate-bounce" size={48} />
                     <h2 className="text-2xl font-headline font-bold text-brand-gold">Welcome to Premium!</h2>
                     <p className="text-accent-cyan mt-2">{success}</p>
                </motion.div>
            ) : (
                <motion.div key="form">
                    <h2 className="text-3xl font-headline font-bold text-accent-pink mb-2 text-center">Join FlixTrend</h2>
                    <p className="text-center text-brand-gold font-bold mb-4 text-sm">Every new user gets free premium access!</p>
                    
                    <div className="w-full bg-black/20 rounded-full h-2.5 mb-4">
                        <motion.div 
                            className="bg-gradient-to-r from-accent-pink to-accent-cyan h-2.5 rounded-full"
                            animate={{ width: `${(step / 3) * 100}%` }}
                            transition={{ duration: 0.5, ease: 'easeInOut' }}
                        />
                    </div>
                    
                    <AnimatePresence mode="wait">
                        {renderStep()}
                    </AnimatePresence>

                    {error && <div className="text-red-400 text-center animate-bounce mt-2">{error}</div>}
                    
                    <div className="flex justify-between items-center mt-6">
                        {step > 1 ? (
                            <button type="button" className="btn-glass flex items-center gap-2" onClick={prevStep} disabled={loading}>
                                <ArrowLeft size={16} /> Back
                            </button>
                        ) : <div />}

                        <button type="submit" className="btn-glass bg-accent-pink flex items-center gap-2" disabled={loading}>
                            {loading ? 'Processing...' : step === 3 ? 'Verify & Sign Up' : step === 2 ? 'Send OTP' : 'Next'}
                            {(step < 3) && <ArrowRight size={16} />}
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        <div className="text-center mt-4">
          <span className="text-gray-400">Already have an account? </span>
          <Link href="/login" className="text-accent-cyan hover:underline">Log In</Link>
        </div>
         <div className="text-center mt-2 text-xs text-gray-400">
            <p className="text-xs text-gray-400 text-center mt-2">
                By creating an account, you agree to our{' '}
                <Link href="/terms" className="underline hover:text-accent-cyan">Terms</Link> and{' '}
                <Link href="/privacy" className="underline hover:text-accent-cyan">Privacy Policy</Link>.
            </p>
        </div>
      </form>
    </div>
  );
}

