"use client";
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft } from 'lucide-react';

// Since AI moderation is removed, this step is now just a pass-through.
// It could be used for other checks in the future (e.g., draft previews).
export default function Step2({ onNext, onBack, postData }: { onNext: (data: any) => void; onBack: () => void; postData: any }) {
    
    // Immediately trigger the next step as no check is needed.
    useEffect(() => {
        onNext({ category: 'General' }); // Pass a default category
    }, [onNext]);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="glass-card p-8 text-center min-h-[250px] flex flex-col items-center justify-center">
                 <h2 className="text-2xl font-headline text-accent-pink mb-4">Step 2: Finalizing</h2>
                 <p className="text-gray-400">Getting your post ready...</p>
                 {/* This content will only be seen for a brief moment */}
            </div>
            <div className="flex justify-between mt-8">
                <button className="btn-glass flex items-center gap-2" onClick={onBack}>
                    <ArrowLeft /> Back
                </button>
                <button 
                    className="btn-glass bg-accent-pink flex items-center gap-2" 
                    onClick={() => onNext({ category: 'General' })}
                >
                    Next Step <ArrowRight />
                </button>
            </div>
        </motion.div>
    );
}
