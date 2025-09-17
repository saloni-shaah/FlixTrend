
"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FlixTrendLogo } from "@/components/FlixTrendLogo";
import { Bot, CheckCircle, Diamond, ShieldCheck, Sparkles, UploadCloud, BarChart2 } from "lucide-react";
import { motion } from "framer-motion";
import { getFirestore, doc, updateDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "@/utils/firebaseClient";
import { useRouter } from "next/navigation";

const premiumFeatures = [
    { icon: <CheckCircle className="text-accent-cyan"/>, text: "Verified Blue Tick on your profile" },
    { icon: <Diamond className="text-accent-pink"/>, text: "Ad-Free Experience across the app" },
    { icon: <Bot className="text-accent-purple"/>, text: "Unlimited Almighty AI interactions" },
    { icon: <Sparkles className="text-brand-gold"/>, text: "Exclusive profile customization options" },
    { icon: <BarChart2 className="text-accent-green"/>, text: "Access to advanced profile analytics" },
    { icon: <UploadCloud className="text-white"/>, text: "Upload videos and photos in HD quality" },
    { icon: <ShieldCheck className="text-accent-cyan"/>, text: "Premium badge on your profile" },
    { icon: <Sparkles className="text-accent-pink"/>, text: "Early access to new features and games" },
];


export default function PremiumPage() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const user = auth.currentUser;

    const handleSubscribe = async () => {
        if (!user) {
            router.push('/login');
            return;
        }

        setLoading(true);
        // **THIS IS A SIMULATION**
        // In a real app, you would integrate Google Pay SDK here.
        // On successful payment, you get a callback from the payment gateway.
        console.log("Simulating payment with Google Pay...");

        // Simulate a delay for the payment process
        await new Promise(resolve => setTimeout(resolve, 2000));

        // On successful "payment", update the user's profile in Firestore.
        try {
            const userDocRef = doc(db, "users", user.uid);
            const premiumExpiryDate = new Date();
            premiumExpiryDate.setMonth(premiumExpiryDate.getMonth() + 1);

            await updateDoc(userDocRef, {
                isPremium: true,
                premiumSince: Timestamp.now(),
                premiumUntil: Timestamp.fromDate(premiumExpiryDate)
            });
            
            console.log("Premium activated successfully!");
            // Redirect to profile to see the new badge!
            router.push('/squad');

        } catch (error) {
            console.error("Failed to update premium status:", error);
            alert("Something went wrong. Please try again.");
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
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full px-10 py-4 rounded-full bg-accent-pink text-white font-bold text-xl shadow-fab-glow hover:scale-105 hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? "Processing..." : "Upgrade with Google Pay"}
            </button>
             <p className="text-xs text-gray-500 mt-4">
                This is a simulated payment. No real transaction will occur.
            </p>

        </motion.div>
      </div>
    </div>
  );
}
