
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
import { ArrowRight, ArrowLeft, Gift, Eye, EyeOff } from 'lucide-react';
import CountrySelector from "@/components/ui/CountrySelector";

const db = getFirestore(app);

async function isUsernameUnique(username: string): Promise<boolean> {
    if (!username || username.length < 3) return false;
    const usernameDocRef = doc(db, "usernames", username.toLowerCase());
    const docSnap = await getDoc(usernameDocRef);
    return !docSnap.exists();
}

declare global {
    interface Window {
        recaptchaVerifier?: RecaptchaVerifier;
    }
}

const creatorTypes = [
    { id: 'vlogs', name: 'Vlogs' },
    { id: 'gaming', name: 'Gaming' },
    { id: 'music', name: 'Music' },
    { id: 'comedy', name: 'Comedy' },
    { id: 'tech', name: 'Tech' },
    { id: 'education', name: 'Education' },
    { id: 'other', name: 'Other' },
];

export default function SignupPage() {
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        phoneNumber: "",
        countryCode: "+91",
        username: "",
        bio: "",
        location: "",
        dob: "",
        gender: "",
        accountType: "user",
        creatorType: ""
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [otp, setOtp] = useState("");
    const [confirmationResult, setConfirmationResult] = useState<any>(null);
    
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
              'size': 'invisible',
              'callback': (response: any) => {}
            });
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleCountryChange = (dialCode: string) => {
        setForm({ ...form, countryCode: dialCode });
    };

    const nextStep = async () => {
        setError("");
        setLoading(true);

        if (step === 1) {
            if (form.password !== form.confirmPassword) {
                setError("Passwords do not match");
                setLoading(false);
                return;
            }
            if (form.password.length < 6) {
                setError("Password must be at least 6 characters long.");
                setLoading(false);
                return;
            }
        }
        
        if (step === 3) {
            if (!form.username) {
                setError("Username is required.");
                setLoading(false);
                return;
            }
            const unique = await isUsernameUnique(form.username);
            if (!unique) {
                setError("This username is already taken.");
                setLoading(false);
                return;
            }
            if (form.dob) {
                const today = new Date();
                const birthDate = new Date(form.dob);
                let age = today.getFullYear() - birthDate.getFullYear();
                const m = today.getMonth() - birthDate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
                if (age < 12) {
                    setError("You must be at least 12 years old to use FlixTrend.");
                    setLoading(false);
                    return;
                }
            }
            if(form.accountType === 'creator' && !form.creatorType) {
                setError("Please select a creator type.");
                setLoading(false);
                return;
            }
        }
        
        setLoading(false);
        setStep(s => s + 1);
    };

    const prevStep = () => setStep(s => s - 1);

    const handleSendOtp = async () => {
        if (!form.phoneNumber) {
            setError("Please enter a valid phone number.");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const fullPhoneNumber = `${form.countryCode}${form.phoneNumber}`;
            const verifier = window.recaptchaVerifier!;
            const result = await signInWithPhoneNumber(auth, fullPhoneNumber, verifier);
            setConfirmationResult(result);
            setStep(3); 
        } catch (err: any) {
            setError("Failed to send OTP. Please check the phone number and try again.");
            console.error("OTP send error:", err);
        }
        setLoading(false);
    };

    const handleFinalSubmit = async () => {
        if (step !== 4) return;
        
        setLoading(true);
        setError("");
        try {
            const credential = PhoneAuthProvider.credential(confirmationResult.verificationId, otp);
            const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
            const user = userCredential.user;
            await linkWithCredential(user, credential);

            const avatarUrl = `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${form.username}`;
            await updateProfile(user, { displayName: form.name, photoURL: avatarUrl });
            
            const randomSuffix = Math.floor(100 + Math.random() * 900);
            const referralCode = `${form.username.toLowerCase().replace(/\s/g, '')}${randomSuffix}`;

            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                email: form.email,
                phoneNumber: `${form.countryCode}${form.phoneNumber}`,
                name: form.name,
                username: form.username.toLowerCase(),
                bio: form.bio,
                location: form.location,
                dob: form.dob,
                gender: form.gender,
                accountType: form.accountType,
                creatorType: form.accountType === 'creator' ? form.creatorType : null,
                avatar_url: avatarUrl,
                createdAt: serverTimestamp(),
                profileComplete: false, 
                referralCode: referralCode,
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
                        <div className="relative">
                            <input type={showPassword ? "text" : "password"} name="password" placeholder="Password (min. 6 characters)" className="input-glass w-full pr-10" value={form.password} onChange={handleChange} required />
                            <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                            </button>
                        </div>
                         <div className="relative">
                            <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" placeholder="Confirm Password" className="input-glass w-full pr-10" value={form.confirmPassword} onChange={handleChange} required />
                             <button type="button" onClick={() => setShowConfirmPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                {showConfirmPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                            </button>
                        </div>
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
                     <motion.div key="step3" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex flex-col gap-4">
                        <h3 className="text-xl font-bold text-accent-cyan text-center">Step 3: Profile Details</h3>
                         <input type="text" name="username" placeholder="Username" className="input-glass w-full" value={form.username} onChange={handleChange} required />
                         <textarea name="bio" placeholder="Bio" className="input-glass w-full min-h-[80px]" value={form.bio} onChange={handleChange} />
                         <input type="text" name="location" placeholder="Location (e.g. City, Country)" className="input-glass w-full" value={form.location} onChange={handleChange} />
                         <div>
                            <label className="text-xs text-gray-400 ml-2">Date of Birth</label>
                            <input type="date" name="dob" className="input-glass w-full" value={form.dob} onChange={handleChange} required/>
                        </div>
                         <select name="gender" className="input-glass w-full" value={form.gender} onChange={handleChange} required>
                            <option value="" disabled>Select Gender...</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="non-binary">Non-binary</option>
                            <option value="other">Other</option>
                            <option value="prefer-not-to-say">Prefer not to say</option>
                        </select>
                         <select name="accountType" className="input-glass w-full" value={form.accountType} onChange={handleChange} required>
                            <option value="user">General User</option>
                            <option value="creator">Creator</option>
                        </select>
                        {form.accountType === 'creator' && (
                            <select name="creatorType" className="input-glass w-full" value={form.creatorType} onChange={handleChange} required>
                                <option value="" disabled>Select Creator Type...</option>
                                {creatorTypes.map(type => (
                                    <option key={type.id} value={type.id}>{type.name}</option>
                                ))}
                            </select>
                        )}
                     </motion.div>
                );
            case 4:
                return (
                    <motion.div key="step4" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex flex-col gap-4 items-center">
                        <h3 className="text-xl font-bold text-accent-cyan text-center">Step 4: Verify Your Account</h3>
                        <p className="text-sm text-gray-300 text-center">Enter the code sent to {form.countryCode} {form.phoneNumber}</p>
                         <input type="text" name="otp" placeholder="6-digit code" className="input-glass w-full text-center tracking-widest text-lg" value={otp} onChange={e => setOtp(e.target.value)} required />
                    </motion.div>
                );
            default: return null;
        }
    }
    
    const handleNextButton = () => {
        if (step === 2) {
            handleSendOtp();
        } else if (step === 4) {
            handleFinalSubmit();
        } else {
            nextStep();
        }
    }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in">
       <div id="recaptcha-container"></div>
      <div
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
                            animate={{ width: `${(step / 4) * 100}%` }}
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

                        <button type="button" className="btn-glass bg-accent-pink flex items-center gap-2" disabled={loading} onClick={handleNextButton}>
                            {loading ? 'Processing...' : step === 4 ? 'Verify & Sign Up' : step === 2 ? 'Send OTP' : 'Next'}
                            {(step < 4) && <ArrowRight size={16} />}
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
      </div>
    </div>
  );
}
