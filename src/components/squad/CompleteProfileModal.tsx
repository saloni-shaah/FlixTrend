"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

function getIncompleteStep(profile: any): string {
    if (!profile.phoneNumber) return '/signup/phone-verification';
    if (!profile.name || !profile.bio || !profile.interests?.length || !profile.location || !profile.gender) return '/signup/complete-profile';
    if (!profile.accountType) return '/signup/account-type';
    if (!profile.avatar_url || !profile.banner_url) return '/signup/avatar-banner';
    return '/vibespace';
}

export function CompleteProfileModal({ profile, onClose }: { profile: any, onClose: () => void }) {
    const router = useRouter();
    const nextStep = getIncompleteStep(profile);

    const handleContinue = () => {
        onClose();
        router.push(nextStep);
    };

    const stepLabels: Record<string, string> = {
        '/signup/phone-verification': 'verify your phone number',
        '/signup/complete-profile': 'complete your profile details',
        '/signup/account-type': 'choose your account type',
        '/signup/avatar-banner': 'add your avatar and banner',
    };

    const missingStep = stepLabels[nextStep] ?? 'finish setting up';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-6 w-full max-w-md relative flex flex-col"
            >
                <h2 className="text-xl font-headline font-bold mb-2 text-accent-cyan">Your Profile Isn't Complete</h2>
                <p className="text-sm text-gray-300 mb-6">
                    You still need to <span className="text-accent-pink font-semibold">{missingStep}</span> to unlock the full FlixTrend experience.
                </p>

                <div className="flex justify-end gap-3 mt-4">
                    <button type="button" className="btn-glass" onClick={onClose}>Skip for Now</button>
                    <button type="button" className="btn-glass bg-accent-pink text-white" onClick={handleContinue}>
                        Continue Setup
                    </button>
                </div>
            </motion.div>
        </div>
    );
}