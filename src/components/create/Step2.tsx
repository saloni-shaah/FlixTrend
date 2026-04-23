
"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ShieldAlert, ArrowLeft, ArrowRight } from 'lucide-react';
// Import the centralized isAbusive function
import { isAbusive } from '@/utils/moderation';

export default function Step2({ onBack, onNext, postData }: { onBack: () => void; onNext: () => void; postData: any }) {
    const { content, description, hashtags, question, options } = postData;

    // Use the imported function
    const contentIsAbusive = isAbusive(content);
    const descriptionIsAbusive = isAbusive(description);
    const hashtagsAreAbusive = isAbusive(hashtags);
    const questionIsAbusive = isAbusive(question);
    const optionsAreAbusive = options?.some((opt: any) => isAbusive(opt.text));

    const isClean = !contentIsAbusive && !descriptionIsAbusive && !hashtagsAreAbusive && !questionIsAbusive && !optionsAreAbusive;

    const getFieldFeedback = (isAbusive: boolean, fieldName: string) => {
        if (!isAbusive) {
            return <span className="flex items-center gap-2 text-green-400"><Shield size={16}/> {fieldName} is clean.</span>
        }
        return <span className="flex items-center gap-2 text-red-400"><ShieldAlert size={16}/> {fieldName} contains potentially abusive language.</span>
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="glass-card p-8">
                <h2 className="text-2xl font-headline text-accent-cyan mb-4">Step 2: Content Review</h2>
                <p className="text-gray-400 mb-6">We automatically check for abusive language to keep our community safe. Please review the results below.</p>
                
                <div className="space-y-3">
                    {content && <div>{getFieldFeedback(contentIsAbusive, "Caption/Content")}</div>}
                    {description && <div>{getFieldFeedback(descriptionIsAbusive, "Description")}</div>}
                    {hashtags && <div>{getFieldFeedback(hashtagsAreAbusive, "Hashtags")}</div>}
                    {question && <div>{getFieldFeedback(questionIsAbusive, "Poll Question")}</div>}
                    {options && <div>{getFieldFeedback(optionsAreAbusive, "Poll Options")}</div>}
                </div>

                {!isClean && (
                    <div className="mt-6 p-4 rounded-lg bg-red-900/50 border border-red-500/80 text-red-300">
                        <h3 className="font-bold">Action Required</h3>
                        <p>One or more fields contain language that violates our community guidelines. Please go back and revise your content before you can publish.</p>
                    </div>
                )}
            </div>

            <div className="flex justify-between mt-8">
                <button className="btn-glass bg-gray-700 flex items-center gap-2" onClick={onBack}>
                    <ArrowLeft /> Go Back
                </button>
                <button className="btn-glass bg-accent-pink flex items-center gap-2" onClick={onNext} disabled={!isClean}>
                    Next Step <ArrowRight />
                </button>
            </div>
        </motion.div>
    );
}
