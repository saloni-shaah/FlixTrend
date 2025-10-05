
"use client";
import React, { useState } from "react";
import Link from "next/link";
import { auth, app } from "@/utils/firebaseClient";
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from "firebase/auth";
import { getFirestore, doc, setDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Camera, UploadCloud, Gift } from 'lucide-react';

const db = getFirestore(app);
const storage = getStorage(app);

// Helper to check for username uniqueness
async function isUsernameUnique(username: string): Promise<boolean> {
    const q = query(collection(db, "users"), where("username", "==", username.toLowerCase()));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
}

export default function SignupPage() {
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        username: "",
        name: "",
        bio: "",
        dob: "",
        gender: "",
        location: "",
        phoneNumber: "",
        accountType: "user",
    });
    const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
    const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);
    
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const previewUrl = URL.createObjectURL(file);
            if (type === 'avatar') {
                setProfilePictureFile(file);
                setProfilePicturePreview(previewUrl);
            } else {
                setBannerFile(file);
                setBannerPreview(previewUrl);
            }
        }
    };
    
    const nextStep = async () => {
        setError("");
        if (step === 1) {
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        
        if(step !== 3) {
            nextStep();
            return;
        }

        setLoading(true);
        try {
            // User creation will now be handled by the Cloud Function, 
            // but we still create the auth user here to trigger the function.
            const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
            
            // Upload files to Firebase Storage
            let avatarUrl = `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${form.username}`;
            let bannerUrl = "";

            const uploadFile = async (file: File) => {
                const fileName = `${userCredential.user.uid}-${Date.now()}-${file.name}`;
                const storageRef = ref(storage, `user_uploads/${fileName}`);
                const snapshot = await uploadBytes(storageRef, file);
                return await getDownloadURL(snapshot.ref);
            };

            if (profilePictureFile) {
                avatarUrl = await uploadFile(profilePictureFile);
            }
            if (bannerFile) {
                bannerUrl = await uploadFile(bannerFile);
            }

            // Update Auth Profile
            await updateProfile(userCredential.user, {
                displayName: form.name,
                photoURL: avatarUrl,
            });

            // Update user profile in Firestore (the cloud function will add premium details)
            await setDoc(doc(db, "users", userCredential.user.uid), {
                name: form.name,
                username: form.username.toLowerCase(),
                bio: form.bio,
                dob: form.dob,
                gender: form.gender,
                location: form.location,
                phoneNumber: form.phoneNumber,
                accountType: form.accountType,
                avatar_url: avatarUrl,
                banner_url: bannerUrl,
                profileComplete: !!(form.dob && form.gender && form.location),
            }, { merge: true });

            // Send verification email
            await sendEmailVerification(userCredential.user);

            setSuccess("Welcome to the Vibe! Your account is created & premium access is activated. Redirecting...");
            setTimeout(() => router.push("/home"), 3000);
        } catch (err: any) {
            if(err.code === 'auth/email-already-in-use') {
                setError("This email is already in use. Please use another email or log in.");
            } else {
                setError(err.message);
            }
        }
        setLoading(false);
    };

    const renderStep = () => {
        switch(step) {
            case 1:
                return (
                    <motion.div key="step1" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex flex-col gap-4">
                        <h3 className="text-xl font-bold text-accent-cyan text-center">Step 1: Account Credentials</h3>
                        <input type="email" name="email" placeholder="Email" className="input-glass w-full" value={form.email} onChange={handleChange} required />
                        <input type="text" name="username" placeholder="Username" className="input-glass w-full" value={form.username} onChange={handleChange} required />
                        <input type="password" name="password" placeholder="Password (min. 6 characters)" className="input-glass w-full" value={form.password} onChange={handleChange} required />
                        <input type="password" name="confirmPassword" placeholder="Confirm Password" className="input-glass w-full" value={form.confirmPassword} onChange={handleChange} required />
                    </motion.div>
                );
            case 2:
                return (
                     <motion.div key="step2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex flex-col gap-4">
                        <h3 className="text-xl font-bold text-accent-cyan text-center">Step 2: Tell Us About Yourself</h3>
                         <input type="text" name="name" placeholder="Full Name" className="input-glass w-full" value={form.name} onChange={handleChange} required />
                         <textarea name="bio" placeholder="Your Bio" className="input-glass w-full rounded-2xl min-h-[80px]" value={form.bio} onChange={handleChange} />
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="date" name="dob" placeholder="Date of Birth" className="input-glass w-full" value={form.dob} onChange={handleChange} />
                            <select name="gender" className="input-glass w-full" value={form.gender} onChange={handleChange}>
                                <option value="" disabled>Select Gender...</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="non-binary">Non-binary</option>
                                <option value="other">Other</option>
                                <option value="prefer-not-to-say">Prefer not to say</option>
                            </select>
                            <input type="text" name="location" placeholder="Location (e.g., City, Country)" className="input-glass w-full" value={form.location} onChange={handleChange} />
                            <input type="tel" name="phoneNumber" placeholder="Phone Number (Optional)" className="input-glass w-full" value={form.phoneNumber} onChange={handleChange} />
                         </div>
                         <select name="accountType" className="input-glass w-full" value={form.accountType} onChange={handleChange}>
                            <option value="user">I'm a User</option>
                            <option value="creator">I'm a Creator</option>
                            <option value="business">I'm a Business</option>
                        </select>
                     </motion.div>
                );
            case 3:
                return (
                    <motion.div key="step3" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex flex-col gap-4 items-center">
                        <h3 className="text-xl font-bold text-accent-cyan text-center">Step 3: Customize Your Look</h3>
                        
                        <div className="relative w-32 h-32 rounded-full border-4 border-accent-pink bg-black/20 flex items-center justify-center cursor-pointer overflow-hidden">
                             <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, 'avatar')} accept="image/*"/>
                             {profilePicturePreview ? <img src={profilePicturePreview} alt="avatar" className="w-full h-full object-cover" /> : <Camera className="text-gray-400" />}
                        </div>
                        <p className="text-sm text-gray-300">Upload a Profile Picture</p>

                        <div className="w-full h-32 rounded-lg bg-black/20 flex items-center justify-center cursor-pointer overflow-hidden relative">
                             <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, 'banner')} accept="image/*"/>
                             {bannerPreview ? <img src={bannerPreview} alt="banner" className="w-full h-full object-cover" /> : <div className="text-gray-400 flex items-center gap-2"><UploadCloud/> <span>Upload Banner</span></div>}
                        </div>
                         <p className="text-sm text-gray-300">Upload a Banner Image</p>
                    </motion.div>
                );
            default: return null;
        }
    }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
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
                    
                    {/* Progress Bar */}
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
                            {loading ? 'Processing...' : step === 3 ? 'Finish & Sign Up' : 'Next'}
                            {step < 3 && <ArrowRight size={16} />}
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        <div className="text-center mt-4">
          <span className="text-gray-400">Already have an account? </span>
          <Link href="/login" className="text-accent-cyan hover:underline">Login</Link>
        </div>
      </form>
    </div>
  );
}
