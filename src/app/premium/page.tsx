
"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FlixTrendLogo } from "@/components/FlixTrendLogo";
import { CheckCircle, Diamond, ShieldCheck, Sparkles, UploadCloud, BarChart2, QrCode } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getFirestore, doc, updateDoc, Timestamp, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/utils/firebaseClient";
import { useRouter } from "next/navigation";

const premiumFeatures = [
    { icon: <CheckCircle className="text-accent-cyan"/>, text: "Verified Blue Tick on your profile" },
    { icon: <Diamond className="text-accent-pink"/>, text: "Ad-Free Experience across the app" },
    { icon: <Sparkles className="text-brand-gold"/>, text: "Exclusive profile customization options" },
    { icon: <BarChart2 className="text-accent-green"/>, text: "Access to advanced profile analytics" },
    { icon: <UploadCloud className="text-white"/>, text: "Upload videos and photos in HD quality" },
    { icon: <ShieldCheck className="text-accent-cyan"/>, text: "Premium badge on your profile" },
    { icon: <Sparkles className="text-accent-pink"/>, text: "Early access to new features and games" },
];

function PaymentStep({ onPaymentComplete }: { onPaymentComplete: (transactionId: string) => void }) {
    const [transactionId, setTransactionId] = useState('');
    
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full text-center mt-8"
        >
            <h3 className="text-xl font-bold text-accent-cyan mb-4">Step 1: Complete Payment</h3>
            <p className="text-gray-400 mb-4">Scan the QR code with your UPI app or pay to the UPI ID below.</p>
            <div className="flex flex-col items-center gap-4">
                {/* 
                  1. ACTION REQUIRED: Upload your QR code image to the `public/` folder.
                  Then, change `/placehoth of your image, e.g., `/my-upi-qr.png`.
                */}
                <div className="p-4 bg-white rounded-lg">
                   <img src="/placeholder-qr.png" alt="Your UPI QR Code" width={192} height={192} />
                </div>
                {/* 
                  2. UPI ID has been updated below.
                */}
                <p className="font-bold text-lg text-white">7319758411-2@ybl</p>
            </div>
            
             <h3 className="text-xl font-bold text-accent-cyan mt-8 mb-4">Step 2: Submit Transaction ID</h3>
             <p className="text-gray-400 mb-4">After payment, enter the UPI Transaction ID to verify your purchase.</p>
             <div className="flex gap-2">
                 <input 
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Enter UPI Transaction ID"
                    className="input-glass w-full text-center"
                 />
                 <button 
                    onClick={() => onPaymentComplete(transactionId)}
                    disabled={!transactionId.trim()}
                    className="btn-glass bg-accent-pink text-white disabled:opacity-50"
                >
                    Verify
                </button>
             </div>
        </motion.div>
    );
}

function ThankYouStep() {
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full text-center mt-8"
        >
            <div className="flex justify-center mb-4">
                 <CheckCircle size={64} className="text-green-400"/>
            </div>
            <h3 className="text-2xl font-bold text-green-400 mb-4">Verification Submitted!</h3>
            <p className="text-gray-300">
                Thank you! Your premium access will be activated within 6 hours after we confirm your payment. You can now close this page.
            </p>
        </motion.div>
    )
}


export default function PremiumPage() {
    const [step, setStep] = useState<'options' | 'payment' | 'thankyou'>('options');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const user = auth.currentUser;

    const handleUpgradeClick = () => {
        if (!user) {
            router.push('/login');
            return;
        }
        setStep('payment');
    };

    const handlePaymentComplete = async (transactionId: string) => {
        if (!user) return;
        setLoading(true);
        try {
            await addDoc(collection(db, 'pending_payments'), {
                userId: user.uid,
                email: user.email,
                displayName: user.displayName,
                transactionId: transactionId,
                plan: "monthly_80_inr",
                submittedAt: serverTimestamp(),
                status: 'pending' // pending, verified, rejected
            });
            setStep('thankyou');
        } catch (error) {
            console.error("Error submitting verification:", error);
            alert("Could not submit your verification. Please try again.");
        } finally {
            setLoading(false);
        }
    };


  return (
    <div className="min-h-screen font-body text-white">
      {/* Top Navbar */}
      <nav className="w-full flex justify-between items-center px-8 py-4 bg-black/70 border-b border-accent-cyan/20 fixed top-0 left-0 z-50 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-3">
          <FlixTrendLogo size={40} />
          <span className="font-headline text-2xl text-accent-cyan font-bold tracking-wide">FlixTrend</span>
        </Link>
        <div className="flex gap-6 items-center">
          <Link href="/home" className="px-5 py-2 rounded-full border-2 border-accent-cyan text-accent-cyan font-bold bg-black/30 hover:bg-accent-cyan hover:text-primary transition-all">Back to App</Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto pt-28 pb-20 px-4 flex flex-col items-center">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 md:p-12 w-full max-w-2xl text-center"
        >
            <AnimatePresence mode="wait">
                {step === 'options' && (
                    <motion.div key="options" exit={{ opacity: 0 }}>
                        <div className="flex justify-center mb-4">
                            <Diamond size={48} className="text-accent-pink animate-glow" />
                        </div>
                        <h1 className="text-4xl font-headline font-bold text-accent-cyan mb-4">FlixTrend Premium</h1>
                        <p className="text-gray-300 mb-8">
                            Elevate your experience. Unlock exclusive features and support the platform.
                        </p>

                        <div className="bg-black/20 p-6 rounded-2xl mb-8">
                            <ul className="space-y-4 text-left">
                                {premiumFeatures.map((feature, index) => (
                                    <motion.li 
                                        key={index} 
                                        className="flex items-center gap-4"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 + index * 0.1 }}
                                    >
                                        {feature.icon}
                                        <span className="text-gray-200">{feature.text}</span>
                                    </motion.li>
                                ))}
                            </ul>
                        </div>

                        <div className="mb-8">
                            <p className="text-5xl font-bold text-white">₹20 <span className="text-lg font-normal text-gray-400">/ first month</span></p>
                            <p className="text-gray-400 text-sm">Then ₹80/month. Cancel anytime.</p>
                        </div>

                        <button 
                            onClick={handleUpgradeClick}
                            disabled={loading}
                            className="w-full px-10 py-4 rounded-full bg-accent-pink text-white font-bold text-xl shadow-fab-glow hover:scale-105 hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Processing..." : "Upgrade with UPI"}
                        </button>
                    </motion.div>
                )}

                {step === 'payment' && (
                    <motion.div key="payment" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <PaymentStep onPaymentComplete={handlePaymentComplete} />
                    </motion.div>
                )}

                {step === 'thankyou' && (
                    <motion.div key="thankyou" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                         <ThankYouStep />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
