"use client";
import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { app, auth } from '@/utils/firebaseClient';
import { onAuthStateChanged } from 'firebase/auth';
import { motion } from 'framer-motion';
import { ShieldCheck, UserPlus, KeyRound, LogIn, Trash2, Crown, Eye, EyeOff, Radio } from 'lucide-react';
import { getFunctions, httpsCallable } from "firebase/functions";

const db = getFirestore(app);
const functions = getFunctions(app);

// In a real app, these would be server-side checks, but for the MVP we do it client-side.
const COMPANY_PASS_1 = "flixtrendlovesme";
const COMPANY_PASS_2 = "iloveflixtrend";

const deletePostCallable = httpsCallable(functions, 'deletePost');

function AdminDashboard({ userProfile, onLogout }: { userProfile: any, onLogout: () => void }) {

    const handleDeletePost = async () => {
        const postId = prompt("Enter the ID of the post to delete:");
        if (postId) {
            try {
                await deletePostCallable({ postId });
                alert(`Post ${postId} has been successfully deleted.`);
            } catch(error: any) {
                 alert(`Failed to delete post: ${error.message}`);
            }
        }
    };

    const handleGrantPremium = async () => {
        const username = prompt("Enter the username of the user to grant premium to:");
        if (!username) return;

        try {
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("username", "==", username));
            const userQuerySnap = await getDocs(q);

            if (userQuerySnap.empty) {
                alert("User not found.");
                return;
            }
            const userToUpdateDoc = userQuerySnap.docs[0];
            await updateDoc(doc(db, "users", userToUpdateDoc.id), {
                isPremium: true,
                premiumUntil: null, // or set an expiry date
            });
            alert(`Premium status granted to ${username}.`);
        } catch(error: any) {
             alert(`Failed to grant premium: ${error.message}`);
        }
    };

    const handleToggleMaintenance = async () => {
        const maintenanceDocRef = doc(db, 'app_status', 'maintenance');
        try {
            const docSnap = await getDoc(maintenanceDocRef);
            const currentStatus = docSnap.exists() ? docSnap.data()?.isEnabled : false;
            const newStatus = !currentStatus;
            await setDoc(maintenanceDocRef, { isEnabled: newStatus }, { merge: true });
            alert(`Maintenance mode is now ${newStatus ? 'ON' : 'OFF'}.`);
        } catch (error: any) {
            alert(`Failed to toggle maintenance mode: ${error.message}`);
        }
    };
    
    const handleGoLive = () => {
        alert("This would open a special live stream page for admins during maintenance mode.");
    }

    return (
        <div className="min-h-screen w-full flex flex-col items-center pt-12 p-4">
            <div className="w-full max-w-4xl mx-auto flex flex-col gap-8">
                <div className="text-center">
                     <h1 className="text-3xl font-headline font-bold text-accent-cyan">Admin Dashboard</h1>
                     <p className="text-gray-400">Welcome, {userProfile.name}.</p>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Post Moderation */}
                    <div className="glass-card p-6 flex flex-col items-center text-center">
                        <Trash2 className="text-red-400 mb-2" size={32}/>
                        <h3 className="font-bold text-lg text-red-400">Content Moderation</h3>
                        <p className="text-xs text-gray-400 mb-4">Permanently delete a post from the database.</p>
                        <button onClick={handleDeletePost} className="btn-glass bg-red-500/20 text-red-400 w-full">Delete Post</button>
                    </div>
                    {/* User Management */}
                     <div className="glass-card p-6 flex flex-col items-center text-center">
                        <Crown className="text-yellow-400 mb-2" size={32}/>
                        <h3 className="font-bold text-lg text-yellow-400">Grant Premium</h3>
                        <p className="text-xs text-gray-400 mb-4">Give a user premium status for free.</p>
                        <button onClick={handleGrantPremium} className="btn-glass bg-yellow-500/20 text-yellow-400 w-full">Grant Premium</button>
                    </div>
                     {/* Maintenance Mode */}
                     <div className="glass-card p-6 flex flex-col items-center text-center">
                        <EyeOff className="text-accent-purple mb-2" size={32}/>
                        <h3 className="font-bold text-lg text-accent-purple">Maintenance Mode</h3>
                        <p className="text-xs text-gray-400 mb-4">Block user access and show a maintenance page.</p>
                        <button onClick={handleToggleMaintenance} className="btn-glass bg-purple-500/20 text-purple-400 w-full mb-2">Toggle Maintenance</button>
                        <button onClick={handleGoLive} className="btn-glass bg-green-500/20 text-green-400 w-full flex items-center justify-center gap-2"><Radio/>Go Live During Maint.</button>
                    </div>
                </div>
                 <button onClick={onLogout} className="btn-glass self-center mt-8">Log Out</button>
            </div>
        </div>
    )
}


export default function AdminPage() {
    const [user, setUser] = useState<any>(null);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('login');

    const [loginForm, setLoginForm] = useState({ username: '', pass1: '', pass2: '' });
    const [onboardForm, setOnboardForm] = useState({ username: '', email: '', companyEmail: '', code: '', pass1: '', pass2: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showCodeField, setShowCodeField] = useState(false);


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                if (userDoc.exists() && (userDoc.data().role === 'developer' || userDoc.data().role === 'founder')) {
                    setUser(currentUser);
                    setUserProfile(userDoc.data());
                } else {
                    setUser(null);
                    setUserProfile(null);
                }
            } else {
                 setUser(null);
                 setUserProfile(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);
    
    const handleOnboardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setOnboardForm({ ...onboardForm, [e.target.name]: e.target.value });
    };

    const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
    };
    
    const handleSendCode = async () => {
        setError('');
        // Temporarily removed validation to allow founder onboarding
        // if (!onboardForm.companyEmail.endsWith('@flixtrend.com')) { 
        //     setError('Please use a valid company email.');
        //     return;
        // }
        // In a real app, this would trigger a backend function to send an email.
        // For now, we'll just simulate it.
        setIsProcessing(true);
        await new Promise(res => setTimeout(res, 1000));
        setSuccess('A verification code has been sent to your company email.');
        setShowCodeField(true);
        setIsProcessing(false);
    };
    
    const handleOnboardSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsProcessing(true);

        if (onboardForm.pass1 !== COMPANY_PASS_1 || onboardForm.pass2 !== COMPANY_PASS_2) {
            setError("Company passwords do not match.");
            setIsProcessing(false);
            return;
        }

        try {
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("username", "==", onboardForm.username), where("email", "==", onboardForm.email));
            const userQuerySnap = await getDocs(q);

            if (userQuerySnap.empty) {
                setError("No user found with that username and email combination.");
                setIsProcessing(false);
                return;
            }

            const userToUpdateDoc = userQuerySnap.docs[0];
            const isFounder = onboardForm.email === 'next181489111@gmail.com';
            
            await updateDoc(doc(db, "users", userToUpdateDoc.id), {
                role: isFounder ? 'founder' : 'developer',
                companyEmail: onboardForm.companyEmail,
            });
            
            setSuccess(`Success! ${onboardForm.username} has been onboarded as a ${isFounder ? 'founder' : 'developer'}.`);
            setOnboardForm({ username: '', email: '', companyEmail: '', code: '', pass1: '', pass2: '' }); // Reset form
            setShowCodeField(false);
        } catch (err: any) {
            setError(err.message);
        }
        setIsProcessing(false);
    };
    
    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsProcessing(true);
         if (loginForm.pass1 !== COMPANY_PASS_1 || loginForm.pass2 !== COMPANY_PASS_2) {
            setError("Company passwords do not match.");
            setIsProcessing(false);
            return;
        }
        
        try {
             const usersRef = collection(db, "users");
             const q = query(usersRef, where("username", "==", loginForm.username));
             const userQuerySnap = await getDocs(q);

             if (userQuerySnap.empty) {
                 setError("No user found with that username.");
                 setIsProcessing(false);
                 return;
             }

             const userToLogin = userQuerySnap.docs[0].data();
             if (userToLogin.role !== 'developer' && userToLogin.role !== 'founder') {
                 setError("This account does not have developer privileges.");
                 setIsProcessing(false);
                 return;
             }
             
             // This is a simulated login. In a real app, we'd re-auth with Firebase.
             setUserProfile(userToLogin);
             setUser(auth.currentUser); // Assume they are already logged in via main app

        } catch (err: any) {
            setError(err.message);
        }
        setIsProcessing(false);
    }
    
    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (user && userProfile) {
        return <AdminDashboard userProfile={userProfile} onLogout={() => { setUser(null); setUserProfile(null); }} />;
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <div className="glass-card w-full max-w-md">
                 <div className="flex p-1 bg-black/20 rounded-t-2xl">
                    <button onClick={() => setActiveTab('login')} className={`flex-1 p-3 rounded-xl font-bold transition-colors ${activeTab === 'login' ? 'bg-accent-cyan text-black' : 'text-gray-300'}`}>Existing Dev</button>
                    <button onClick={() => setActiveTab('onboard')} className={`flex-1 p-3 rounded-xl font-bold transition-colors ${activeTab === 'onboard' ? 'bg-accent-cyan text-black' : 'text-gray-300'}`}>New Hire</button>
                </div>
                
                {activeTab === 'login' ? (
                     <form onSubmit={handleLoginSubmit} className="p-6 flex flex-col gap-4">
                        <h2 className="text-2xl font-headline font-bold text-accent-cyan mb-2 text-center flex items-center justify-center gap-2"><LogIn/> Developer Login</h2>
                        <input name="username" placeholder="FlixTrend Username" className="input-glass" onChange={handleLoginChange} value={loginForm.username} />
                        <input name="pass1" type="password" placeholder="Company Password 1" className="input-glass" onChange={handleLoginChange} value={loginForm.pass1} />
                        <input name="pass2" type="password" placeholder="Company Password 2" className="input-glass" onChange={handleLoginChange} value={loginForm.pass2} />
                         {error && <p className="text-red-400 text-center text-sm">{error}</p>}
                        <button type="submit" className="btn-glass bg-accent-cyan text-black mt-2" disabled={isProcessing}>{isProcessing ? "Verifying..." : "Login"}</button>
                    </form>
                ) : (
                    <form onSubmit={handleOnboardSubmit} className="p-6 flex flex-col gap-4">
                         <h2 className="text-2xl font-headline font-bold text-accent-pink mb-2 text-center flex items-center justify-center gap-2"><UserPlus/> Onboard New Hire</h2>
                         <input name="username" placeholder="FlixTrend Username" className="input-glass" onChange={handleOnboardChange} value={onboardForm.username} />
                         <input name="email" type="email" placeholder="FlixTrend Email" className="input-glass" onChange={handleOnboardChange} value={onboardForm.email} />
                         
                         {!showCodeField ? (
                            <div className="flex gap-2">
                                <input name="companyEmail" type="email" placeholder="Company or Personal Email" className="input-glass flex-1" onChange={handleOnboardChange} value={onboardForm.companyEmail} />
                                <button type="button" className="btn-glass px-4" onClick={handleSendCode} disabled={isProcessing}>{isProcessing ? '...' : 'Send'}</button>
                            </div>
                         ) : (
                             <>
                                <input name="code" placeholder="Verification Code" className="input-glass" onChange={handleOnboardChange} value={onboardForm.code} />
                                <input name="pass1" type="password" placeholder="Company Password 1" className="input-glass" onChange={handleOnboardChange} value={onboardForm.pass1} />
                                <input name="pass2" type="password" placeholder="Company Password 2" className="input-glass" onChange={handleOnboardChange} value={onboardForm.pass2} />
                             </>
                         )}

                         {error && <p className="text-red-400 text-center text-sm">{error}</p>}
                         {success && <p className="text-green-400 text-center text-sm">{success}</p>}
                         <button type="submit" className="btn-glass bg-accent-pink text-white mt-2" disabled={isProcessing || !showCodeField}>{isProcessing ? "Onboarding..." : "Onboard Team Member"}</button>
                    </form>
                )}
            </div>
        </div>
    );
}
