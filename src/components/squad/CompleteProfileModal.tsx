"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
import { auth, app } from "@/utils/firebaseClient";

const db = getFirestore(app);

export function CompleteProfileModal({ profile, onClose }: { profile: any, onClose: () => void }) {
    const [form, setForm] = useState({
        name: profile.name || "",
        bio: profile.bio || "",
        dob: profile.dob || "",
        gender: profile.gender || "",
        location: profile.location || "",
        accountType: profile.accountType || "user",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Age validation
        if (form.dob) {
            const today = new Date();
            const birthDate = new Date(form.dob);
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            if (age < 12) {
                setError("You must be at least 12 years old to use FlixTrend.");
                return;
            }
        }

        setLoading(true);
        setError("");

        try {
            const user = auth.currentUser;
            if (!user) throw new Error("Not logged in");
            
            const docRef = doc(db, "users", user.uid);
            await updateDoc(docRef, { ...form, profileComplete: true });
            
            onClose();

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-6 w-full max-w-md relative flex flex-col"
            >
                <h2 className="text-xl font-headline font-bold mb-2 text-accent-cyan">Let's Complete Your Profile</h2>
                <p className="text-sm text-gray-300 mb-6">A few more details will help personalize your experience.</p>
                
                {error && <div className="text-red-400 text-center mb-4 p-2 bg-red-900/50 rounded-md">{error}</div>}
                
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto pr-2 max-h-[70vh]">
                    <textarea name="bio" placeholder="Your Bio (tell us about yourself)" className="input-glass min-h-[80px]" value={form.bio} onChange={handleChange} />
                    <input type="text" name="location" placeholder="Location (e.g., City, Country)" className="input-glass w-full" value={form.location} onChange={handleChange} required/>
                    <div>
                        <label className="text-xs text-gray-400 ml-2">Date of Birth</label>
                        <input type="date" name="dob" className="input-glass w-full" value={form.dob} onChange={handleChange} required/>
                    </div>
                     <select name="gender" className="input-glass w-full" value={form.gender} onChange={handleChange} required>
                        <option value="" disabled>Select Gender...</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="non-binary">Non-binary</option>
                        <option value="other">Other</option>
                        <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                    <select name="accountType" className="input-glass w-full" value={form.accountType} onChange={handleChange} required>
                        <option value="user">General User</option>
                        <option value="creator">Creator</option>
                    </select>

                    <button type="submit" className="btn-glass bg-accent-pink text-white mt-4" disabled={loading}>
                        {loading ? "Saving..." : "Save & Enter FlixTrend"}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
