
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, DollarSign, CheckCircle } from 'lucide-react';
import { auth, db } from '@/utils/firebaseClient';
import { doc, onSnapshot, updateDoc, increment } from 'firebase/firestore';
import { VibeSpaceLoader } from '@/components/VibeSpaceLoader';

export default function BillingPage() {
    const [user, setUser] = useState(auth.currentUser);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState('1000');
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setUser(user);
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                const unsubProfile = onSnapshot(userDocRef, (doc) => {
                    if (doc.exists()) {
                        setUserProfile(doc.data());
                    }
                    setLoading(false);
                });
                return () => unsubProfile();
            } else {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    // Effect to handle the Google Pay button rendering and payment success event
    useEffect(() => {
        // The `onGooglePayLoaded` function is in the global scope from payment.js
        if (typeof (window as any).onGooglePayLoaded === 'function') {
            (window as any).onGooglePayLoaded();
        }

        const handlePayment = async (event: CustomEvent) => {
            setPaymentProcessing(true);
            const { token, amount: paidAmount } = event.detail;
            console.log("Processing payment on client...", { token, paidAmount });

            // In a real app, you would send this token to your backend to be processed by Razorpay.
            // For this simulation, we'll just update the user's credits directly.
            if (user && paidAmount) {
                try {
                    const userDocRef = doc(db, 'users', user.uid);
                    await updateDoc(userDocRef, {
                        credits: increment(parseFloat(paidAmount))
                    });
                    setPaymentSuccess(true);
                } catch (error) {
                    console.error("Error updating credits:", error);
                    alert("There was an error updating your credits.");
                }
            }
            setPaymentProcessing(false);
        };
        
        window.addEventListener('paymentSuccess', handlePayment as EventListener);
        return () => window.removeEventListener('paymentSuccess', handlePayment as EventListener);

    }, [user]); // Re-run if user changes


    if (loading) {
        return <VibeSpaceLoader />;
    }

    if (!user || !userProfile) {
        return <div>Please log in to manage billing.</div>;
    }
    
     if (paymentSuccess) {
        return (
            <div className="w-full max-w-lg mx-auto flex flex-col items-center p-4 text-center">
                 <div className="glass-card p-8">
                    <CheckCircle className="mx-auto text-green-400 mb-4" size={64}/>
                    <h2 className="text-2xl font-headline font-bold text-green-400">Payment Successful!</h2>
                    <p className="text-gray-300 mt-2">Your ad credits have been updated.</p>
                    <Link href="/ad-studio">
                        <span className="btn-glass bg-accent-cyan text-black mt-6 inline-block">Back to Dashboard</span>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full max-w-lg mx-auto flex flex-col items-center p-4">
            <Link href="/ad-studio">
                <span className="btn-glass flex items-center gap-2 mb-8 self-start">
                    <ArrowLeft /> Back to Dashboard
                </span>
            </Link>

            <div className="w-full glass-card p-8">
                <h2 className="text-3xl font-headline font-bold text-accent-pink mb-2 text-center">Add Funds</h2>
                <p className="text-center text-gray-400 mb-8">Add credits to your advertising account.</p>

                <div className="mb-6">
                    <p className="font-bold text-accent-cyan">Current Balance</p>
                    <p className="text-4xl font-bold">₹{userProfile?.credits?.toLocaleString('en-IN') || '800'}</p>
                </div>
                
                <div>
                    <label htmlFor="amount" className="font-bold text-accent-cyan">Amount to Add (INR)</label>
                    <div className="relative mt-2">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                        <input
                            type="number"
                            id="amount"
                            name="amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="input-glass w-full pl-12 text-lg"
                            min="100"
                            step="100"
                        />
                    </div>
                </div>

                <div className="mt-8 flex justify-center">
                    <div id="gpay-container" data-amount={amount}>
                        {/* The Google Pay button will be rendered here by payment.js */}
                    </div>
                </div>

                 {paymentProcessing && (
                    <div className="text-center text-accent-cyan mt-4 animate-pulse">Processing payment...</div>
                )}
            </div>
        </div>
    );
}

