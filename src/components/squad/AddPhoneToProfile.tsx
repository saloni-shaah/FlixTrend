"use client";
import React, { useState, useEffect } from 'react';
import { Phone, CheckCircle, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    RecaptchaVerifier,
    PhoneAuthProvider,
    linkWithCredential,
} from 'firebase/auth';
import { auth, db } from '@/utils/firebaseClient';
import { doc, updateDoc } from 'firebase/firestore';
import CountrySelector from '@/components/ui/CountrySelector';

declare global {
    interface Window {
        recaptchaVerifier?: RecaptchaVerifier;
    }
}

export function AddPhoneToProfile({ user }: { user: any }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [step, setStep] = useState(1); // 1: Form, 2: OTP, 3: Success
    const [phoneNumber, setPhoneNumber] = useState('');
    const [countryCode, setCountryCode] = useState('+91');
    const [otp, setOtp] = useState('');
    const [confirmationResult, setConfirmationResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isExpanded && !window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible',
                'callback': () => {},
            });
        }
    }, [isExpanded]);

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const fullPhoneNumber = `${countryCode}${phoneNumber}`;
            const verifier = window.recaptchaVerifier!;
            const phoneProvider = new PhoneAuthProvider(auth);
            const result = await phoneProvider.verifyPhoneNumber(fullPhoneNumber, verifier);
            setConfirmationResult(result);
            setStep(2);
        } catch (err: any) {
            setError('Failed to send OTP. Please check the number.');
            console.error("OTP send error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const credential = PhoneAuthProvider.credential(confirmationResult, otp);
            await linkWithCredential(user, credential);
            
            // Update Firestore user document
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, {
                phoneNumber: `${countryCode}${phoneNumber}`
            });

            setStep(3); // Success step
            setTimeout(() => setIsExpanded(false), 3000); // Close after 3 seconds

        } catch (err: any) {
            setError('Invalid OTP. Please try again.');
            console.error("OTP verification error:", err);
        } finally {
            setLoading(false);
        }
    };


    if (!isExpanded) {
        return (
            <div className="w-full mt-6">
                <button 
                    onClick={() => setIsExpanded(true)}
                    className="w-full p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 flex items-center justify-center gap-3 hover:bg-yellow-500/20 transition-colors"
                >
                    <Shield size={20} />
                    <span className="font-bold">Secure Your Account</span>
                </button>
            </div>
        );
    }
    
    return (
        <div className="w-full mt-6 glass-card p-4">
             <div id="recaptcha-container"></div>
            <AnimatePresence mode="wait">
                {step === 1 && (
                     <motion.form key="step1" onSubmit={handleSendOtp} className="flex flex-col gap-3" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
                        <p className="text-sm text-gray-300 text-center">Add your phone number for enhanced security and account recovery.</p>
                        <CountrySelector onCountrySelect={setCountryCode} />
                        <input
                            type="tel"
                            placeholder="Phone Number"
                            className="input-glass w-full"
                            value={phoneNumber}
                            onChange={e => setPhoneNumber(e.target.value)}
                            required
                        />
                        <button type="submit" className="btn-glass bg-accent-cyan text-black" disabled={loading}>
                            {loading ? "Sending..." : "Send OTP"}
                        </button>
                     </motion.form>
                )}
                 {step === 2 && (
                     <motion.form key="step2" onSubmit={handleVerifyOtp} className="flex flex-col gap-3" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
                        <p className="text-sm text-gray-300 text-center">Enter the OTP sent to {countryCode} {phoneNumber}</p>
                        <input
                            type="text"
                            placeholder="6-digit code"
                            className="input-glass w-full text-center tracking-widest"
                            value={otp}
                            onChange={e => setOtp(e.target.value)}
                            required
                        />
                        <button type="submit" className="btn-glass bg-accent-cyan text-black" disabled={loading}>
                             {loading ? "Verifying..." : "Verify & Link"}
                        </button>
                     </motion.form>
                )}
                {step === 3 && (
                     <motion.div key="step3" className="text-center p-4" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
                        <CheckCircle className="mx-auto text-green-400 mb-2" size={40} />
                        <p className="font-bold text-green-400">Phone Number Added!</p>
                        <p className="text-sm text-gray-300">Your account is now more secure.</p>
                     </motion.div>
                )}
            </AnimatePresence>
            {error && <p className="text-red-400 text-xs text-center mt-2">{error}</p>}
        </div>
    )
}
