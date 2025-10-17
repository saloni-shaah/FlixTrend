
"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getFirestore, doc, setDoc, updateDoc } from "firebase/firestore";
import { auth, app } from "@/utils/firebaseClient";
import { RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider, linkWithCredential } from "firebase/auth";

const db = getFirestore(app);

declare global {
    interface Window {
        recaptchaVerifier?: RecaptchaVerifier;
        confirmationResult?: any;
    }
}

export function CompleteProfileModal({ profile, onClose }: { profile: any, onClose: () => void }) {
    const [form, setForm] = useState({
        dob: profile.dob || "",
        gender: profile.gender || "",
        location: profile.location || "",
        accountType: profile.accountType || "user",
        phoneNumber: profile.phoneNumber || "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [verificationId, setVerificationId] = useState('');
    const [code, setCode] = useState('');
    const [step, setStep] = useState(1);

    const isMissingDetails = !form.dob || !form.gender || !form.location;
    const isMissingPhone = !form.phoneNumber;

    useEffect(() => {
        if (!isMissingDetails && isMissingPhone) {
            setStep(2); // If only phone is missing, go straight to phone step
        } else if (!isMissingDetails && !isMissingPhone) {
            // All details are already present, just mark as complete and close
            handleSubmit(true); 
        } else {
            setStep(1); // Default to details step if anything is missing
        }
    }, [isMissingDetails, isMissingPhone]);

    const setupRecaptcha = () => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible',
                'callback': (response: any) => {
                    // reCAPTCHA solved, allow signInWithPhoneNumber.
                }
            });
        }
    };
    
    const onSendCode = async () => {
        if (!form.phoneNumber) {
            setError("Please enter a valid phone number.");
            return;
        }
        setLoading(true);
        setError("");
        try {
            setupRecaptcha();
            const appVerifier = window.recaptchaVerifier!;
            const confirmationResult = await signInWithPhoneNumber(auth, form.phoneNumber, appVerifier);
            window.confirmationResult = confirmationResult;
            setVerificationId(confirmationResult.verificationId);
            setStep(3); // Move to code verification step
        } catch (err: any) {
             setError(err.message);
             console.error(err);
        }
        setLoading(false);
    };
    
    const onVerifyCode = async () => {
        if (!code) {
            setError("Please enter the verification code.");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const credential = PhoneAuthProvider.credential(verificationId, code);
            const user = auth.currentUser;
            if (user) {
                // Link the phone number to the existing user account
                await linkWithCredential(user, credential);
                // Now save all data
                await handleSubmit(true);
            } else {
                throw new Error("No user is signed in.");
            }
        } catch (err: any) {
            setError("Invalid verification code. Please try again.");
            console.error(err);
        }
        setLoading(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (isVerified: boolean = false) => {
        setLoading(true);
        setError("");
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("Not logged in");
            
            const docRef = doc(db, "users", user.uid);
            const dataToUpdate: any = { ...form, profileComplete: true };
            if (!isVerified) {
                // If we are skipping phone verification because it already exists
                delete dataToUpdate.phoneNumber;
            }
            await updateDoc(docRef, dataToUpdate);
            onClose();
        } catch (err: any) {
            setError(err.message);
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-6 w-full max-w-md relative flex flex-col"
            >
                 <div id="recaptcha-container"></div>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">&times;</button>
                <h2 className="text-xl font-headline font-bold mb-4 text-accent-cyan">Complete Your Profile</h2>
                
                {error && <div className="text-red-400 text-center mb-2">{error}</div>}
                
                {step === 1 && (
                    <div className="flex flex-col gap-4">
                        <p className="text-sm text-gray-300 mb-4">Help others get to know you better by adding a few more details!</p>
                        {!form.location && <input type="text" name="location" placeholder="Location (e.g., City, Country)" className="input-glass w-full" value={form.location} onChange={handleChange}/>}
                        {!form.dob && <input type="date" name="dob" placeholder="Date of Birth" className="input-glass w-full" value={form.dob} onChange={handleChange}/>}
                        {!form.gender && (
                            <select name="gender" className="input-glass w-full" value={form.gender} onChange={handleChange}>
                                <option value="" disabled>Select Gender...</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="non-binary">Non-binary</option>
                                <option value="other">Other</option>
                                <option value="prefer-not-to-say">Prefer not to say</option>
                            </select>
                        )}
                        <button type="button" className="btn-glass bg-accent-cyan text-black mt-4" disabled={loading} onClick={() => handleSubmit(false)}>
                            {loading ? "Saving..." : "Save & Continue"}
                        </button>
                    </div>
                )}
                
                {step === 2 && (
                     <div className="flex flex-col gap-4">
                        <p className="text-sm text-gray-300 mb-4">Please enter and verify your phone number to secure your account.</p>
                        <input type="tel" name="phoneNumber" placeholder="+91 98765 43210" className="input-glass w-full" value={form.phoneNumber} onChange={handleChange} required />
                        <button type="button" className="btn-glass bg-accent-pink text-white mt-2" disabled={loading} onClick={onSendCode}>
                            {loading ? "Sending Code..." : "Send Verification Code"}
                        </button>
                    </div>
                )}
                
                {step === 3 && (
                    <div className="flex flex-col gap-4">
                        <p className="text-sm text-gray-300 mb-4">We've sent a code to {form.phoneNumber}. Please enter it below.</p>
                        <input type="text" name="code" placeholder="6-digit code" className="input-glass w-full" value={code} onChange={(e) => setCode(e.target.value)} required />
                        <button type="button" className="btn-glass bg-green-500 text-white mt-2" disabled={loading} onClick={onVerifyCode}>
                            {loading ? "Verifying..." : "Verify & Complete Profile"}
                        </button>
                         <button type="button" className="text-xs text-accent-cyan text-center mt-2" onClick={() => setStep(2)}>Change Number</button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
