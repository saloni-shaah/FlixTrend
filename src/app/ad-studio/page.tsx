
"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Building, User, Mail, Briefcase, Target, CheckCircle, DollarSign } from "lucide-react";
import Link from "next/link";
import { auth, db } from "@/utils/firebaseClient";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { VibeSpaceLoader } from "@/components/VibeSpaceLoader";

const AdStudioDashboard = ({ user, userProfile }: { user: any, userProfile: any }) => {
    const router = useRouter();

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center p-4">
             <h2 className="text-3xl font-headline font-bold text-accent-pink mb-2 text-center">Ad Studio Dashboard</h2>
             <p className="text-center text-gray-400 mb-8">Welcome back, {user.displayName}!</p>

            <div className="w-full grid md:grid-cols-2 gap-6 mb-6">
                 <div className="glass-card p-6">
                    <h3 className="text-xl font-bold text-accent-cyan flex items-center gap-2"><DollarSign/> Ad Credits</h3>
                    <p className="text-4xl font-bold mt-2">₹{userProfile?.credits?.toLocaleString('en-IN') || '800'}</p>
                    <p className="text-xs text-gray-400">Your remaining ad balance.</p>
                     <button 
                        onClick={() => router.push('/ad-studio/billing')}
                        className="btn-glass bg-accent-green text-black mt-4 text-sm"
                    >
                        Add Funds
                    </button>
                </div>
                 <div className="glass-card p-6">
                    <h3 className="text-2xl font-bold text-accent-cyan mb-4">Your Campaigns</h3>
                    <p className="text-gray-400 mb-6">You don't have any active campaigns yet.</p>
                    <button 
                        onClick={() => router.push('/ad-studio/create')}
                        className="btn-glass bg-accent-pink text-white"
                    >
                        Create Your First Ad
                    </button>
                </div>
            </div>
        </div>
    )
}

const AdStudioSignupPage = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        // Step 1
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        userRoleInCompany: "",
        // Step 2
        companyName: "",
        companyWebsite: "",
        industry: "",
        companyAddress: "",
        companyCity: "",
        companyState: "",
        companyZip: "",
        companyCountry: "India",
        // Step 3
        campaignGoals: [] as string[],
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const router = useRouter();
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleGoalToggle = (goal: string) => {
        setFormData(prev => {
            const newGoals = prev.campaignGoals.includes(goal)
                ? prev.campaignGoals.filter(g => g !== goal)
                : [...prev.campaignGoals, goal];
            return { ...prev, campaignGoals: newGoals };
        });
    };

    const nextStep = () => {
        setError("");
        if (step === 1) {
            if (formData.password !== formData.confirmPassword) {
                setError("Passwords do not match.");
                return;
            }
            if (formData.password.length < 6) {
                setError("Password must be at least 6 characters.");
                return;
            }
        }
        setStep(s => s + 1);
    };

    const prevStep = () => setStep(s => s - 1);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (step < 3) {
            nextStep();
            return;
        }

        setLoading(true);
        setError("");

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            await updateProfile(user, { displayName: formData.name });

            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: formData.name,
                email: formData.email,
                username: formData.email.split('@')[0], // Create a simple username
                accountType: 'business',
                credits: 800, // Free starting credit
                createdAt: new Date(),
                businessProfile: {
                    userRoleInCompany: formData.userRoleInCompany,
                    companyName: formData.companyName,
                    companyWebsite: formData.companyWebsite,
                    industry: formData.industry,
                    companyAddress: formData.companyAddress,
                    companyCity: formData.companyCity,
                    companyState: formData.companyState,
                    companyZip: formData.companyZip,
                    companyCountry: formData.companyCountry,
                    campaignGoals: formData.campaignGoals,
                }
            });

            setSuccess(true);
            setTimeout(() => {
                router.push("/ad-studio");
            }, 3000);

        } catch (err: any) {
            setError(err.code === 'auth/email-already-in-use' ? 'An account with this email already exists. Please log in to upgrade your account.' : err.message);
        } finally {
            setLoading(false);
        }
    };
    
    const campaignGoalsOptions = ["Brand Awareness", "Website Visits", "Lead Generation", "App Installs", "Sales"];

    const renderStep = () => {
        switch(step) {
            case 1:
                return (
                    <motion.div key="step1" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex flex-col gap-4">
                        <h3 className="text-xl font-bold text-accent-cyan flex items-center gap-2"><User /> Your Information</h3>
                        <input type="text" name="name" placeholder="Your Full Name" className="input-glass w-full" value={formData.name} onChange={handleChange} required />
                        <input type="email" name="email" placeholder="Work Email Address" className="input-glass w-full" value={formData.email} onChange={handleChange} required />
                        <input type="password" name="password" placeholder="Password (min. 6 characters)" className="input-glass w-full" value={formData.password} onChange={handleChange} required />
                        <input type="password" name="confirmPassword" placeholder="Confirm Password" className="input-glass w-full" value={formData.confirmPassword} onChange={handleChange} required />
                         <input type="text" name="userRoleInCompany" placeholder="Your Role (e.g., Marketing Manager)" className="input-glass w-full" value={formData.userRoleInCompany} onChange={handleChange} required />
                    </motion.div>
                );
            case 2:
                 return (
                    <motion.div key="step2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex flex-col gap-4">
                        <h3 className="text-xl font-bold text-accent-cyan flex items-center gap-2"><Building /> Business Details</h3>
                        <input type="text" name="companyName" placeholder="Company Name" className="input-glass w-full" value={formData.companyName} onChange={handleChange} required />
                        <input type="url" name="companyWebsite" placeholder="https://yourcompany.com" className="input-glass w-full" value={formData.companyWebsite} onChange={handleChange} />
                        <input type="text" name="industry" placeholder="Industry (e.g., E-commerce, Tech)" className="input-glass w-full" value={formData.industry} onChange={handleChange} />
                        <input type="text" name="companyAddress" placeholder="Street Address" className="input-glass w-full" value={formData.companyAddress} onChange={handleChange} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" name="companyCity" placeholder="City" className="input-glass w-full" value={formData.companyCity} onChange={handleChange} />
                            <input type="text" name="companyState" placeholder="State / Province" className="input-glass w-full" value={formData.companyState} onChange={handleChange} />
                            <input type="text" name="companyZip" placeholder="ZIP / Postal Code" className="input-glass w-full" value={formData.companyZip} onChange={handleChange} />
                            <input type="text" name="companyCountry" placeholder="Country" className="input-glass w-full" value={formData.companyCountry} onChange={handleChange} />
                        </div>
                    </motion.div>
                );
            case 3:
                return (
                     <motion.div key="step3" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex flex-col gap-4">
                         <h3 className="text-xl font-bold text-accent-cyan flex items-center gap-2"><Target /> Campaign Goals</h3>
                         <p className="text-sm text-gray-400">What do you want to achieve with your ads? (Select all that apply)</p>
                         <div className="flex flex-wrap gap-3">
                             {campaignGoalsOptions.map(goal => (
                                <button
                                    key={goal}
                                    type="button"
                                    onClick={() => handleGoalToggle(goal)}
                                    className={`btn-glass text-sm ${formData.campaignGoals.includes(goal) ? 'bg-accent-cyan text-black' : 'bg-transparent'}`}
                                >
                                    {goal}
                                </button>
                             ))}
                         </div>
                    </motion.div>
                );
            default: return null;
        }
    }
    
    if (success) {
        return (
             <div className="glass-card p-8 w-full max-w-lg flex flex-col gap-4 items-center text-center">
                <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: 'spring' }}>
                    <CheckCircle className="text-green-400" size={64}/>
                </motion.div>
                <h2 className="text-2xl font-headline font-bold text-green-400">Welcome to Ad Studio!</h2>
                <p className="text-gray-300">Your business account has been created with ₹800 in free credits! Redirecting you to the dashboard...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="glass-card p-8 w-full max-w-lg flex flex-col gap-4">
                 <h2 className="text-3xl font-headline font-bold text-accent-pink mb-2 text-center">FlixTrend Ad Studio</h2>
                 <p className="text-center text-gray-400 -mt-4 mb-4 text-sm">Create a new business account to get started.</p>

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
                        {loading ? 'Processing...' : step === 3 ? 'Finish & Create Account' : 'Next'}
                        {step < 3 && <ArrowRight size={16} />}
                    </button>
                </div>
                 <div className="text-center mt-4">
                    <span className="text-gray-400 text-sm">Already have an account? </span>
                    <Link href="/login" className="text-accent-cyan hover:underline text-sm">Log In</Link>
                </div>
            </form>
        </div>
    );
};

const AdStudioUpgradePage = ({ user }: { user: any }) => {
    const [step, setStep] = useState(2); // Start from business details
    const [formData, setFormData] = useState({
        userRoleInCompany: "",
        companyName: "",
        companyWebsite: "",
        industry: "",
        companyAddress: "",
        companyCity: "",
        companyState: "",
        companyZip: "",
        companyCountry: "India",
        campaignGoals: [] as string[],
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

     const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleGoalToggle = (goal: string) => {
        setFormData(prev => {
            const newGoals = prev.campaignGoals.includes(goal)
                ? prev.campaignGoals.filter(g => g !== goal)
                : [...prev.campaignGoals, goal];
            return { ...prev, campaignGoals: newGoals };
        });
    };

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    const handleUpgrade = async (e: React.FormEvent) => {
        e.preventDefault();
        if (step < 3) {
            nextStep();
            return;
        }

        setLoading(true);
        setError("");

        try {
            const userDocRef = doc(db, "users", user.uid);
            await updateDoc(userDocRef, {
                accountType: 'business',
                credits: 800, // Free starting credit for upgrading users
                businessProfile: formData
            });

            router.push('/ad-studio');

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    const campaignGoalsOptions = ["Brand Awareness", "Website Visits", "Lead Generation", "App Installs", "Sales"];

    const renderStep = () => {
        switch(step) {
            case 2:
                 return (
                    <motion.div key="step2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex flex-col gap-4">
                        <h3 className="text-xl font-bold text-accent-cyan flex items-center gap-2"><Building /> Business Details</h3>
                        <input type="text" name="companyName" placeholder="Company Name" className="input-glass w-full" value={formData.companyName} onChange={handleChange} required />
                        <input type="url" name="companyWebsite" placeholder="https://yourcompany.com" className="input-glass w-full" value={formData.companyWebsite} onChange={handleChange} />
                        <input type="text" name="industry" placeholder="Industry (e.g., E-commerce, Tech)" className="input-glass w-full" value={formData.industry} onChange={handleChange} />
                        <input type="text" name="userRoleInCompany" placeholder="Your Role (e.g., Marketing Manager)" className="input-glass w-full" value={formData.userRoleInCompany} onChange={handleChange} required />
                        <input type="text" name="companyAddress" placeholder="Street Address" className="input-glass w-full" value={formData.companyAddress} onChange={handleChange} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" name="companyCity" placeholder="City" className="input-glass w-full" value={formData.companyCity} onChange={handleChange} />
                            <input type="text" name="companyState" placeholder="State / Province" className="input-glass w-full" value={formData.companyState} onChange={handleChange} />
                            <input type="text" name="companyZip" placeholder="ZIP / Postal Code" className="input-glass w-full" value={formData.companyZip} onChange={handleChange} />
                            <input type="text" name="companyCountry" placeholder="Country" className="input-glass w-full" value={formData.companyCountry} onChange={handleChange} />
                        </div>
                    </motion.div>
                );
            case 3:
                return (
                     <motion.div key="step3" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex flex-col gap-4">
                         <h3 className="text-xl font-bold text-accent-cyan flex items-center gap-2"><Target /> Campaign Goals</h3>
                         <p className="text-sm text-gray-400">What do you want to achieve with your ads? (Select all that apply)</p>
                         <div className="flex flex-wrap gap-3">
                             {campaignGoalsOptions.map(goal => (
                                <button
                                    key={goal}
                                    type="button"
                                    onClick={() => handleGoalToggle(goal)}
                                    className={`btn-glass text-sm ${formData.campaignGoals.includes(goal) ? 'bg-accent-cyan text-black' : 'bg-transparent'}`}
                                >
                                    {goal}
                                </button>
                             ))}
                         </div>
                    </motion.div>
                );
            default: return null;
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <form onSubmit={handleUpgrade} className="glass-card p-8 w-full max-w-lg flex flex-col gap-4">
                 <h2 className="text-3xl font-headline font-bold text-accent-pink mb-2 text-center">Upgrade to Business Account</h2>
                 <p className="text-center text-gray-400 -mt-4 mb-4 text-sm">Welcome, {user.displayName}! Let's get your business details.</p>

                <div className="w-full bg-black/20 rounded-full h-2.5 mb-4">
                    <motion.div 
                        className="bg-gradient-to-r from-accent-pink to-accent-cyan h-2.5 rounded-full"
                        animate={{ width: `${((step - 1) / 2) * 100}%` }}
                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                    />
                </div>
                
                <AnimatePresence mode="wait">
                    {renderStep()}
                </AnimatePresence>

                {error && <div className="text-red-400 text-center animate-bounce mt-2">{error}</div>}

                <div className="flex justify-between items-center mt-6">
                    {step > 2 ? (
                        <button type="button" className="btn-glass flex items-center gap-2" onClick={prevStep} disabled={loading}>
                            <ArrowLeft size={16} /> Back
                        </button>
                    ) : <div />}

                    <button type="submit" className="btn-glass bg-accent-pink flex items-center gap-2" disabled={loading}>
                        {loading ? 'Upgrading...' : step === 3 ? 'Finish & Upgrade' : 'Next'}
                        {step < 3 && <ArrowRight size={16} />}
                    </button>
                </div>
            </form>
        </div>
    );
}


export default function AdStudioPage() {
    const [user, authLoading] = useAuthState(auth);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [profileLoading, setProfileLoading] = useState(true);
    
    useEffect(() => {
        if (user) {
            const userDocRef = doc(db, 'users', user.uid);
            const unsub = onSnapshot(userDocRef, (doc) => {
                if (doc.exists()) {
                    setUserProfile(doc.data());
                }
                setProfileLoading(false);
            });
            return () => unsub();
        } else if (!authLoading) {
            setProfileLoading(false);
        }
    }, [user, authLoading]);

    if (authLoading || profileLoading) {
        return <VibeSpaceLoader />;
    }

    if (user && userProfile) {
        if (userProfile.accountType === 'business') {
            return <AdStudioDashboard user={user} userProfile={userProfile} />;
        } else {
            return <AdStudioUpgradePage user={user} />;
        }
    }

    return <AdStudioSignupPage />;
};
