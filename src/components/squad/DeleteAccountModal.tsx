
'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, AlertTriangle } from 'lucide-react';
import { auth, functions } from '@/utils/firebaseClient';
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { useRouter } from 'next/navigation';
import { httpsCallable } from 'firebase/functions';

const deleteUserAccountCallable = httpsCallable(functions, 'deleteUserAccount');

export function DeleteAccountModal({ profile, onClose }: { profile: any, onClose: () => void }) {
    const [password, setPassword] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const router = useRouter();

    const handleDelete = async () => {
        setError('');
        setLoading(true);

        const user = auth.currentUser;
        if (!user || !user.email) {
            setError('Could not verify user session. Please log in again.');
            setLoading(false);
            return;
        }

        try {
            // Step 1: Re-authenticate the user for security
            const credential = EmailAuthProvider.credential(user.email, password);
            await reauthenticateWithCredential(user, credential);

            // Step 2: If re-authentication is successful, call the Cloud Function to delete the user data and account
            await deleteUserAccountCallable();
            
            alert('Your account has been permanently deleted.');
            // The user will be signed out automatically after deletion, redirect them.
            router.push('/signup'); 

        } catch (err: any) {
            console.error('Account deletion error:', err);
            if (err.code === 'auth/wrong-password') {
                setError('Incorrect password. Please try again.');
            } else if (err.code === 'auth/requires-recent-login') {
                setError('This action requires a recent login. Please sign out and sign in again before deleting your account.');
            } else {
                setError('An unexpected error occurred. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    };

    const isConfirmationMatching = confirmation === `delete/${profile.username}`;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 w-full max-w-lg relative flex flex-col gap-4 border-2 border-red-500/50 shadow-lg shadow-red-500/10"
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">&times;</button>
                <h2 className="text-2xl font-headline font-bold text-red-400 flex items-center gap-3"><AlertTriangle /> Confirm Account Deletion</h2>
                
                {error && <div className="p-3 bg-red-900/50 text-red-300 rounded-lg text-sm text-center border border-red-800">{error}</div>}

                {step === 1 && (
                    <div className="flex flex-col gap-4">
                        <p className="text-center text-gray-300">
                            This is your final confirmation. This action is irreversible and will permanently delete all your data, including posts, comments, and profile information.
                        </p>
                        <p className='text-center text-gray-300'>
                            To proceed, please type <code className='bg-neutral-900 p-1 rounded-md text-red-400 font-bold'>delete/{profile.username}</code> in the box below.
                        </p>

                        <input 
                            type="text" 
                            name="confirmation"
                            placeholder={`delete/${profile.username}`}
                            className="input-glass w-full bg-neutral-900/50 text-center text-lg tracking-wider" 
                            value={confirmation}
                            onChange={(e) => setConfirmation(e.target.value)} 
                        />
                        <div className="flex justify-end gap-4 mt-4">
                            <button className="btn-glass" onClick={onClose}>Cancel</button>
                            <button 
                                className="btn-glass bg-red-500/80 text-white"
                                disabled={!isConfirmationMatching}
                                onClick={() => setStep(2)}
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                )}
                
                {step === 2 && (
                    <div className="flex flex-col gap-4">
                        <p>For your security, please enter your password to finalize the deletion.</p>
                        <input 
                            type="password" 
                            name="password" 
                            placeholder="Enter your password"
                            className="input-glass w-full" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                        />
                        <div className="flex justify-end gap-4 mt-4">
                             <button className="btn-glass" onClick={() => setStep(1)}>Back</button>
                             <button 
                                className={`btn-glass text-white ${!password || loading ? 'bg-red-900/50' : 'bg-red-800 hover:bg-red-700'}`}
                                disabled={!password || loading}
                                onClick={handleDelete}
                            >
                                {loading ? 'DELETING...' : 'Permanently Delete My Account'}
                            </button>
                        </div>
                    </div>
                )}

            </motion.div>
        </div>
    )
}

    