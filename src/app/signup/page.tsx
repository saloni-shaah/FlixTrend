
"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { auth, app, storage } from "@/utils/firebaseClient";
import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
    updateProfile,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    PhoneAuthProvider,
    ConfirmationResult
} from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Eye, EyeOff, CheckCircle, AlertCircle, Loader, User, Camera, Image as ImageIcon, Sparkles, ShieldCheck } from 'lucide-react';
import CountrySelector from "@/components/ui/CountrySelector";

const db = getFirestore(app);
const functions = getFunctions(app);
const checkUsernameCallable = httpsCallable(functions, 'checkUsername');

function useDebounce(value: string, delay: number) {    
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

export default function SignupPage() {
    const [step, setStep] = useState(1);

    // Step 1
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [username, setUsername] = useState("");
    const [isUsernameValid, setIsUsernameValid] = useState<boolean | null>(null);
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    const debouncedUsername = useDebounce(username, 500);

    // Step 2
    const [name, setName] = useState("");
    const [bio, setBio] = useState("");
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);

    // Step 3
    const [phoneNumber, setPhoneNumber] = useState("");
    const [countryCode, setCountryCode] = useState("+91");
    const [otp, setOtp] = useState("");
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [isPhoneVerified, setIsPhoneVerified] = useState(false);
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

    // Step 4
    const [accountType, setAccountType] = useState("user");
    const [creatorType, setCreatorType] = useState("");
    
    // General
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible',
                'callback': (response: any) => {},
            });
        }
    }, []);
    
    useEffect(() => {
        const checkUsernameFunc = async () => {
            if (debouncedUsername.length < 3) {
                setIsUsernameValid(null);
                return;
            }
            setIsCheckingUsername(true);
            try {
                const result = await checkUsernameCallable({ username: debouncedUsername.toLowerCase() });
                const data = result.data as { exists: boolean };
                setIsUsernameValid(!data.exists);
            } catch (e) {
                setIsUsernameValid(null);
                setError("Could not verify username. Please try again.");
            } finally {
                setIsCheckingUsername(false);
            }
        };
        if (debouncedUsername) checkUsernameFunc();
    }, [debouncedUsername]);

    useEffect(() => {
        if (!avatarFile) { setAvatarPreview(null); return; }
        const objectUrl = URL.createObjectURL(avatarFile);
        setAvatarPreview(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [avatarFile]);

    useEffect(() => {
        if (!bannerFile) { setBannerPreview(null); return; }
        const objectUrl = URL.createObjectURL(bannerFile);
        setBannerPreview(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [bannerFile]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
        const file = e.target.files?.[0];
        if (file) {
            if (type === 'avatar') setAvatarFile(file);
            else setBannerFile(file);
        }
    };

    const nextStep = () => {
        setError("");
        if (step === 1 && (!email || password.length < 6 || isUsernameValid !== true)) {
            setError("Please fill all fields correctly.");
            return;
        }
        if (step === 2 && !name) {
            setError("Please enter your full name.");
            return;
        }
        if (step === 3 && !isPhoneVerified) {
             setError("Please verify your phone number before proceeding.");
             return;
        }
        setStep(s => s < 4 ? s + 1 : s);
    };

    const prevStep = () => setStep(s => s > 1 ? s - 1 : s);

    const handleSendOtp = async () => {
        setError("");
        if (phoneNumber.length < 10) {
            setError("Please enter a valid phone number.");
            return;
        }
        setLoading(true);
        try {
            const fullPhoneNumber = `${countryCode}${phoneNumber}`;
            const appVerifier = (window as any).recaptchaVerifier;
            const result = await signInWithPhoneNumber(auth, fullPhoneNumber, appVerifier);
            setConfirmationResult(result);
            setIsOtpSent(true);
            setSuccess("OTP sent successfully!");
        } catch (err: any) {
            setError("Failed to send OTP. Is the phone number correct? You may need to refresh and try again.");
            console.error("Phone Sign In Error:", err);
            if ((window as any).recaptchaVerifier) {
                (window as any).recaptchaVerifier.render().then((widgetId: any) => {
                    (window as any).grecaptcha.reset(widgetId);
                });
            }
        } finally {
            setLoading(false);
        }
    };
    
    const handleVerifyOtp = async () => {
        setError("");
        setSuccess("");
        if (otp.length !== 6 || !confirmationResult) {
            setError("Please enter the 6-digit OTP.");
            return;
        }
        setLoading(true);
        try {
            await confirmationResult.confirm(otp);
            setSuccess("Phone number verified successfully!");
            setIsPhoneVerified(true);
            setTimeout(() => {
                nextStep();
            }, 1000);
        } catch (err) {
            setError("Invalid OTP. Please try again.");
            setOtp("");
        } finally {
            setLoading(false);
        }
    }

    const handleFinalSubmit = async () => {
        setError("");
        if (accountType === 'creator' && !creatorType) {
            setError("Please select a creator category.");
            return;
        }
        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            let avatarUrl = `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${username}`;
            let bannerUrl = "";

            if (avatarFile) {
                const avatarRef = ref(storage, `users/${user.uid}/profile/avatar.jpg`);
                await uploadBytes(avatarRef, avatarFile);
                avatarUrl = await getDownloadURL(avatarRef);
            }
            if (bannerFile) {
                const bannerRef = ref(storage, `users/${user.uid}/profile/banner.jpg`);
                await uploadBytes(bannerRef, bannerFile);
                bannerUrl = await getDownloadURL(bannerRef);
            }

            await updateProfile(user, { displayName: name, photoURL: avatarUrl });
            
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                email: email.toLowerCase(),
                name,
                username: username.toLowerCase(),
                bio,
                photoURL: avatarUrl,
                bannerURL: bannerUrl,
                phoneNumber: `${countryCode}${phoneNumber}`,
                accountType,
                creatorType: accountType === 'creator' ? creatorType : null,
                createdAt: serverTimestamp(),
                isProfileComplete: true,
            });

            await setDoc(doc(db, "usernames", username.toLowerCase()), { uid: user.uid });
            
            await sendEmailVerification(user);

            setSuccess("Welcome! Your account is created. Redirecting...");
            router.push("/vibespace?new=true");

        } catch (err: any) {
            console.error("Final signup error:", err);
            if(err.code === 'auth/email-already-in-use') {
                setError("This email is already registered. Please log in.");
                setStep(1);
            } else {
                setError("An unexpected error occurred. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };
    
    const handleNextButton = () => {
        if (step === 4) handleFinalSubmit();
        else if (step === 3) {
            if (!isOtpSent) handleSendOtp();
            else if (!isPhoneVerified) handleVerifyOtp();
            else nextStep();
        } else {
            nextStep();
        }
    }
    
    const isNextDisabled = () => {
        if (loading) return true;
        if (step === 1) return !email || password.length < 6 || isUsernameValid !== true;
        if (step === 2) return !name;
        if (step === 3) {
            if (!isOtpSent) return phoneNumber.length < 10;
            if (!isPhoneVerified) return otp.length !== 6;
            return false;
        }
        if (step === 4) return accountType === 'creator' && !creatorType;
        return false;
    }

    const getButtonText = () => {
        if(loading) return <Loader className="animate-spin" size={20} />;
        if (step === 4) return 'Create Account';
        if (step === 3) {
            if (!isOtpSent) return 'Send OTP';
            if (!isPhoneVerified) return 'Verify & Continue';
            return 'Next';
        }
        return 'Next';
    };

    const renderStep = () => {
        switch(step) {
            case 1: return <SignupStep1 
                email={email} onEmailChange={setEmail}
                username={username} onUsernameChange={setUsername}
                password={password} onPasswordChange={setPassword}
                isUsernameValid={isUsernameValid}
                isCheckingUsername={isCheckingUsername}
                showPassword={showPassword} onShowPasswordChange={setShowPassword}
            />;
            case 2: return <SignupStep2 
                name={name} onNameChange={setName}
                bio={bio} onBioChange={setBio}
                avatarPreview={avatarPreview}
                bannerPreview={bannerPreview}
                onFileChange={handleFileChange}
            />;
            case 3: return <SignupStep3 
                phoneNumber={phoneNumber} onPhoneNumberChange={setPhoneNumber}
                countryCode={countryCode} onCountryCodeChange={setCountryCode}
                otp={otp} onOtpChange={setOtp}
                isOtpSent={isOtpSent}
                isPhoneVerified={isPhoneVerified}
                onResend={handleSendOtp}
            />;
            case 4: return <SignupStep4 
                accountType={accountType} onAccountTypeChange={setAccountType}
                creatorType={creatorType} onCreatorTypeChange={setCreatorType}
            />;
            default: return null;
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-900 text-white">
            <div id="recaptcha-container"></div>
            <div className="w-full max-w-lg">
                <AnimatePresence mode="wait">
                {success && step !== 3 ? (
                     <motion.div key="success" initial={{ opacity: 0}} animate={{ opacity: 1}} className="text-center flex flex-col items-center gap-4">
                        <Sparkles className="text-accent-pink animate-pulse" size={48} />
                        <h2 className="text-2xl font-headline font-bold text-accent-pink">{success}</h2>
                    </motion.div>
                ) : (
                <motion.div key="form-container" className="glass-card p-8 flex flex-col gap-4">
                    <div className="text-center">
                        <h2 className="text-3xl font-headline font-bold text-accent-pink">Join FlixTrend</h2>
                        <p className="text-sm text-gray-400">Step {step} of 4</p>
                    </div>

                    <div className="w-full bg-gray-700 rounded-full h-1.5">
                        <motion.div 
                            className="bg-gradient-to-r from-accent-pink to-accent-cyan h-1.5 rounded-full"
                            initial={{ width: '0%' }}
                            animate={{ width: `${(step / 4) * 100}%` }}
                            transition={{ duration: 0.5, ease: 'easeInOut' }}
                        />
                    </div>
                    
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.3 }}
                        >
                            {renderStep()}
                        </motion.div>
                    </AnimatePresence>

                    {error && <div className="text-red-400 text-center text-sm font-bold mt-2">{error}</div>}
                    {success && step === 3 && <div className="text-green-400 text-center text-sm font-bold mt-2">{success}</div>}
                    
                    <div className="flex justify-between items-center mt-6">
                        {step > 1 ? (
                            <button type="button" className="btn-glass flex items-center gap-2" onClick={prevStep} disabled={loading}>
                                <ArrowLeft size={16} /> Back
                            </button>
                        ) : <div />}

                        <button type="button" className="btn-glass bg-accent-pink flex items-center gap-2" disabled={isNextDisabled()} onClick={handleNextButton}>
                            {getButtonText()}
                            {(!loading && step < 4 && !(step === 3 && !isPhoneVerified)) && <ArrowRight size={16} />}
                        </button>
                    </div>

                     <div className="text-center mt-4">
                        <span className="text-gray-400">Already have an account? </span>
                        <Link href="/login" className="text-accent-cyan hover:underline">Log In</Link>
                    </div>
                </motion.div>
                )}
                </AnimatePresence>
            </div>
        </div>
    );
}

const SignupStep1 = ({ email, onEmailChange, username, onUsernameChange, password, onPasswordChange, isUsernameValid, isCheckingUsername, showPassword, onShowPasswordChange }: any) => (
    <div className="flex flex-col gap-4">
        <h3 className="text-xl font-bold text-accent-cyan text-center">Account Credentials</h3>
        <input type="email" placeholder="Email" className="input-glass" value={email} onChange={e => onEmailChange(e.target.value)} required />
        <div className="relative">
            <input type="text" placeholder="Username" className="input-glass w-full pr-10" value={username} onChange={e => onUsernameChange(e.target.value)} required />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isCheckingUsername ? <Loader className="animate-spin" size={20}/> : 
                 isUsernameValid === true ? <CheckCircle className="text-green-500" size={20}/> :
                 isUsernameValid === false ? <AlertCircle className="text-red-500" size={20}/> : null}
            </div>
        </div>
        <div className="relative">
            <input type={showPassword ? "text" : "password"} placeholder="Password (min. 6 characters)" className="input-glass w-full pr-10" value={password} onChange={e => onPasswordChange(e.target.value)} required />
            <button type="button" onClick={() => onShowPasswordChange((p:any) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
            </button>
        </div>
    </div>
);

const SignupStep2 = ({ name, onNameChange, bio, onBioChange, avatarPreview, bannerPreview, onFileChange }: any) => (
    <div className="flex flex-col gap-4 items-center">
         <h3 className="text-xl font-bold text-accent-cyan text-center">Profile Details</h3>
        <div className="w-full h-36 rounded-lg bg-gray-800 relative flex items-center justify-center">
            {bannerPreview ? <img src={bannerPreview} className="w-full h-full object-cover rounded-lg"/> : <ImageIcon className="text-gray-500" size={40}/>}
            <label htmlFor="banner-upload" className="absolute inset-0 cursor-pointer bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <Camera/>
                <input id="banner-upload" type="file" accept="image/*" className="hidden" onChange={e => onFileChange(e, 'banner')} />
            </label>
        </div>
        <div className="w-24 h-24 rounded-full bg-gray-800 -mt-12 border-4 border-gray-900 relative flex items-center justify-center">
            {avatarPreview ? <img src={avatarPreview} className="w-full h-full object-cover rounded-full"/> : <User className="text-gray-500" size={40}/>}
            <label htmlFor="avatar-upload" className="absolute inset-0 cursor-pointer bg-black/30 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <Camera/>
                <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={e => onFileChange(e, 'avatar')} />
            </label>
        </div>
        <input type="text" placeholder="Full Name" className="input-glass w-full" value={name} onChange={e => onNameChange(e.target.value)} required />
        <textarea placeholder="Bio" className="input-glass w-full min-h-[80px]" value={bio} onChange={e => onBioChange(e.target.value)} />
    </div>
);

const SignupStep3 = ({ phoneNumber, onPhoneNumberChange, countryCode, onCountryCodeChange, otp, onOtpChange, isOtpSent, isPhoneVerified, onResend }: any) => (
    <div className="flex flex-col gap-4">
        <h3 className="text-xl font-bold text-accent-cyan text-center flex items-center justify-center gap-2">
            {isPhoneVerified ? <ShieldCheck className="text-green-500"/> : null} Secure Your Account
        </h3>
        <p className="text-sm text-gray-400 text-center">
            {isPhoneVerified ? "Your phone number has been successfully verified!" : "Verify your phone number. This helps keep your account safe."}
        </p>
        <div className={`flex gap-2 ${isPhoneVerified ? 'opacity-50' : ''}`}>
            <CountrySelector onCountrySelect={onCountryCodeChange} initialSelection={countryCode} disabled={isOtpSent || isPhoneVerified} />
            <input type="tel" placeholder="Phone Number" className="input-glass w-full" value={phoneNumber} onChange={e => onPhoneNumberChange(e.target.value)} required disabled={isOtpSent || isPhoneVerified} />
        </div>
        {isOtpSent && !isPhoneVerified && (
            <div className="flex flex-col gap-2">
                <p className="text-sm text-green-400 text-center">We've sent a 6-digit code to your number.</p>
                <input type="text" placeholder="- - - - - -" className="input-glass w-full text-center tracking-[0.5em] font-mono" value={otp} onChange={e => onOtpChange(e.target.value)} maxLength={6} required />
                <button type="button" onClick={onResend} className="text-xs text-accent-cyan hover:underline text-center mt-2">Resend Code</button>
            </div>
        )}
    </div>
);

const SignupStep4 = ({ accountType, onAccountTypeChange, creatorType, onCreatorTypeChange }: any) => {
    const categories = ['Daily', 'Creative', 'Play', 'Learn', 'Culture'];
    return (
        <div className="flex flex-col gap-4">
            <h3 className="text-xl font-bold text-accent-cyan text-center">Personalize Your Experience</h3>
            <div className="grid grid-cols-2 gap-4">
                <div onClick={() => onAccountTypeChange('user')} className={`p-4 rounded-lg cursor-pointer border-2 flex flex-col items-center gap-2 ${accountType === 'user' ? 'border-accent-pink bg-accent-pink/10' : 'border-gray-700 bg-gray-800'}`}>
                    <User/>
                    <span className="font-bold">User</span>
                </div>
                <div onClick={() => onAccountTypeChange('creator')} className={`p-4 rounded-lg cursor-pointer border-2 flex flex-col items-center gap-2 ${accountType === 'creator' ? 'border-accent-pink bg-accent-pink/10' : 'border-gray-700 bg-gray-800'}`}>
                    <Sparkles/>
                    <span className="font-bold">Creator</span>
                </div>
            </div>
            <AnimatePresence>
            {accountType === 'creator' && (
                <motion.div initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}} exit={{opacity: 0, height: 0}} className="flex flex-col gap-2 overflow-hidden">
                    <h4 className="font-semibold text-center">What kind of content do you create?</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                       {categories.map(cat => (
                           <button key={cat} type="button" onClick={() => onCreatorTypeChange(cat.toLowerCase())} className={`p-2 rounded-lg text-sm ${creatorType === cat.toLowerCase() ? 'btn-glass bg-accent-pink' : 'btn-glass'}`}>
                               {cat}
                           </button>
                       ))}
                    </div>
                </motion.div>
            )}
            </AnimatePresence>
        </div>
    );
};
