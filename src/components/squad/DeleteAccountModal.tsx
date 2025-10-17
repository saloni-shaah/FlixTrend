"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { auth } from '@/utils/firebaseClient';
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useRouter } from 'next/navigation';
import { app } from '@/utils/firebaseClient';

const functions = getFunctions(app);

export function DeleteAccountModal({ profile, onClose }: { profile: any, onClose: () => void }) {
    const [step, setStep] = useState(1);
    const [credentials, setCredentials] = useState({ username: '', email: '', password: '' });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const deleteAccountCallable = httpsCallable(functions, 'deleteUserAccount');

    const handleCredentialsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleDelete = async () => {
        setError("");
        if (credentials.username.toLowerCase() !== profile.username.toLowerCase() || credentials.email.toLowerCase() !== profile.email.toLowerCase()) {
            setError("Username or email does not match.");
            return;
        }

        setLoading(true);
        const user = auth.currentUser;
        if (!user || !user.email) {
            setError("You are not logged in or your user profile is missing an email.");
            setLoading(false);
            return;
        }

        try {
            // Re-authenticate user to confirm their identity
            const credential = EmailAuthProvider.credential(user.email, credentials.password);
            await reauthenticateWithCredential(user, credential);
            
            // If re-authentication is successful, call the cloud function
            await deleteAccountCallable();
            
            alert("Account deleted successfully.");
            router.push('/signup'); // Redirect to signup page after deletion

        } catch (err: any) {
            console.error("Account deletion error:", err);
            setError(err.code === 'auth/wrong-password' ? "Incorrect password." : "An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };
    
    const isStep2Valid = credentials.username && credentials.email && credentials.password;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 w-full max-w-lg relative flex flex-col gap-4"
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">&times;</button>
                <h2 className="text-2xl font-headline font-bold text-red-500 flex items-center gap-2"><Trash2 /> Delete Account</h2>
                
                {error && <div className="p-3 bg-red-500/20 text-red-400 rounded-lg text-center">{error}</div>}

                {step === 1 && (
                    <div className="flex flex-col gap-4">
                        <p className="font-bold text-lg text-center">Are you absolutely sure?</p>
                        <p className="text-center text-gray-300">This action cannot be undone. This will permanently delete your account, posts, comments, chats, and all other associated data.</p>
                        <div className="flex justify-end gap-4 mt-4">
                            <button className="btn-glass" onClick={onClose}>Cancel</button>
                            <button className="btn-glass bg-red-500/80 text-white" onClick={() => setStep(2)}>I understand, proceed</button>
                        </div>
                    </div>
                )}
                
                {step === 2 && (
                    <div className="flex flex-col gap-4">
                        <p>For your security, please re-enter your account details to finalize the deletion.</p>
                        <input type="text" name="username" placeholder="Username" className="input-glass w-full" value={credentials.username} onChange={handleCredentialsChange} />
                        <input type="email" name="email" placeholder="Email" className="input-glass w-full" value={credentials.email} onChange={handleCredentialsChange} />
                        <input type="password" name="password" placeholder="Password" className="input-glass w-full" value={credentials.password} onChange={handleCredentialsChange} />
                        <div className="flex justify-end gap-4 mt-4">
                             <button className="btn-glass" onClick={() => setStep(1)}>Back</button>
                             <button 
                                className="btn-glass bg-red-900 text-white" 
                                disabled={!isStep2Valid || loading}
                                onClick={handleDelete}
                            >
                                {loading ? "Deleting..." : "Permanently Delete Account"}
                            </button>
                        </div>
                    </div>
                )}

            </motion.div>
        </div>
    )
}