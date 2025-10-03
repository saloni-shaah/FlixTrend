
"use client";
import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { app } from '@/utils/firebaseClient';
import { UserPlus, LogIn } from 'lucide-react';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

const db = getFirestore(app);

const COMPANY_PASS_1 = "flixtrendlovesme";
const COMPANY_PASS_2 = "iloveflixtrend";

// Dynamically import the AdminDashboard to split the code
const AdminDashboard = dynamic(() => import('@/components/admin/AdminDashboard'), {
    loading: () => <div className="min-h-screen flex items-center justify-center">Loading Dashboard...</div>,
    ssr: false // This component is client-only
});

export default function AdminPage() {
    const [loggedInAdminProfile, setLoggedInAdminProfile] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('login');

    const [loginForm, setLoginForm] = useState({ username: '', pass1: '', pass2: '' });
    const [onboardForm, setOnboardForm] = useState({ username: '', pass1, '', pass2: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    
    const handleOnboardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setOnboardForm({ ...onboardForm, [e.target.name]: e.target.value });
    };

    const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
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
            const q = query(usersRef, where("username", "==", onboardForm.username));
            const userQuerySnap = await getDocs(q);

            if (userQuerySnap.empty) {
                setError("No user found with that username. The person must have a FlixTrend account first.");
                setIsProcessing(false);
                return;
            }

            const userDoc = userQuerySnap.docs[0];
            const dataToUpdate = { role: ['developer'] };
            const docRef = doc(db, "users", userDoc.id);
            
            updateDoc(docRef, dataToUpdate)
              .then(() => {
                setSuccess(`Success! ${onboardForm.username} has been granted the developer role.`);
                setOnboardForm({ username: '', pass1: '', pass2: '' });
              })
              .catch(async (serverError) => {
                const permissionError = new FirestorePermissionError({
                  path: docRef.path,
                  operation: 'update',
                  requestResourceData: dataToUpdate,
                });
                errorEmitter.emit('permission-error', permissionError);
                setError('Permission denied. You might need to bootstrap your own admin role first.');
              });
            
        } catch (err: any) {
            console.error("Onboarding error:", err);
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

             const userToLoginDoc = userQuerySnap.docs[0];
             const userToLoginData = userToLoginDoc.data();
             
             setLoggedInAdminProfile({uid: userToLoginDoc.id, ...userToLoginData});

        } catch (err: any) {
            setError(err.message);
        }
        setIsProcessing(false);
    }

    if (loggedInAdminProfile) {
        return <AdminDashboard userProfile={loggedInAdminProfile} onLogout={() => setLoggedInAdminProfile(null)} />;
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
                        <input name="username" placeholder="Your FlixTrend Username" className="input-glass" onChange={handleLoginChange} value={loginForm.username} required />
                        <input name="pass1" type="password" placeholder="Company Password 1" className="input-glass" onChange={handleLoginChange} value={loginForm.pass1} required />
                        <input name="pass2" type="password" placeholder="Company Password 2" className="input-glass" onChange={handleLoginChange} value={loginForm.pass2} required />
                         {error && <p className="text-red-400 text-center text-sm">{error}</p>}
                        <button type="submit" className="btn-glass bg-accent-cyan text-black mt-2" disabled={isProcessing}>{isProcessing ? "Verifying..." : "Login"}</button>
                    </form>
                ) : (
                    <form onSubmit={handleOnboardSubmit} className="p-6 flex flex-col gap-4">
                         <h2 className="text-2xl font-headline font-bold text-accent-pink mb-2 text-center flex items-center justify-center gap-2"><UserPlus/> Onboard New Hire</h2>
                         <input name="username" placeholder="Their FlixTrend Username" className="input-glass" onChange={handleOnboardChange} value={onboardForm.username} required />
                         <input name="pass1" type="password" placeholder="Company Password 1" className="input-glass" onChange={handleOnboardChange} value={onboardForm.pass1} required />
                         <input name="pass2" type="password" placeholder="Company Password 2" className="input-glass" onChange={handleOnboardChange} value={onboardForm.pass2} required />

                         {error && <p className="text-red-400 text-center text-sm">{error}</p>}
                         {success && <p className="text-green-400 text-center text-sm">{success}</p>}
                         <button type="submit" className="btn-glass bg-accent-pink text-white mt-2" disabled={isProcessing}>{isProcessing ? "Onboarding..." : "Onboard & Grant Role"}</button>
                    </form>
                )}
            </div>
        </div>
    );
}
