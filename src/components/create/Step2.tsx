
"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft } from 'lucide-react';

export default function Step2({ onNext, onBack, postData }: { onNext: (data: any) => void; onBack: () => void; postData: any }) {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="glass-card p-8 text-center">
                 <h2 className="text-2xl font-headline text-accent-pink mb-4">Step 2: AI Check</h2>
                 <p className="text-gray-400 mb-6">This is where the AI moderation would happen.</p>
                 <div className="text-4xl animate-pulse mb-6">🤖</div>
                 <p className="font-bold text-accent-cyan">Functionality Coming Soon!</p>
            </div>
            <div className="flex justify-between mt-8">
                <button className="btn-glass flex items-center gap-2" onClick={onBack}>
                    <ArrowLeft /> Back
                </button>
                <button className="btn-glass bg-accent-pink flex items-center gap-2" onClick={() => onNext({})}>
                    Next Step <ArrowRight />
                </button>
            </div>
        </motion.div>
    );
}
