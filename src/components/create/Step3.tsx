
"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export default function Step3({ onBack, postData }: { onBack: () => void; postData: any }) {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
             <div className="glass-card p-8">
                <h2 className="text-2xl font-headline text-accent-pink mb-4">Step 3: Publish</h2>
                <p className="text-gray-400 mb-6">Review the content guidelines and schedule your post if you'd like.</p>
                 
                <div className="bg-black/20 p-4 rounded-lg space-y-3 text-sm text-gray-300">
                    <h4 className="font-bold text-accent-cyan">Content Guidelines</h4>
                    <p>✓ Be respectful. No harassment, hate speech, or bullying.</p>
                    <p>✓ Keep it safe. No explicit, violent, or illegal content.</p>
                    <p>✓ Respect copyright. Only post content you own or have rights to.</p>
                    <p>FlixTrend may remove posts that violate these guidelines to keep the community safe.</p>
                </div>

                <div className="mt-6">
                    <h4 className="font-bold text-accent-cyan mb-2">Scheduling (Coming Soon!)</h4>
                    <p className="text-gray-400 text-sm">The ability to schedule your posts for a future date and time will be available here.</p>
                </div>

            </div>
             <div className="flex justify-between mt-8">
                <button className="btn-glass flex items-center gap-2" onClick={onBack}>
                    <ArrowLeft /> Back
                </button>
                <button className="btn-glass bg-green-500 text-white flex items-center gap-2">
                    Publish Now <CheckCircle />
                </button>
            </div>
        </motion.div>
    );
}
