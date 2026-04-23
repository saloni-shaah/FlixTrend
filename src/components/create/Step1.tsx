
"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { TextPostForm } from './forms/TextPostForm';
import { MediaPostForm } from './forms/MediaPostForm';
import { PollPostForm } from './forms/PollPostForm';
import { LivePostForm } from './forms/LivePostForm';
import { FlashPostForm } from './forms/FlashPostForm';

export default function Step1({ onNext, postType, postData }: { onNext: (data: any) => void; postType: string; postData: any }) {
    const [formData, setFormData] = useState(postData);
    const [moderationError, setModerationError] = useState<string | null>(null);

    const handleDataChange = (data: any) => {
        setFormData((prev: any) => ({...prev, ...data}));
    };

    const handleModerationError = (error: string | null) => {
        setModerationError(error);
    };

    const renderForm = () => {
        switch(postType) {
            case 'text':
                return <TextPostForm data={formData} onDataChange={handleDataChange} onError={handleModerationError} />;
            case 'media':
                return <MediaPostForm data={formData} onDataChange={handleDataChange} onError={handleModerationError} />;
            case 'flash':
                return <FlashPostForm data={formData} onDataChange={handleDataChange} onError={handleModerationError} />;
            case 'poll':
                return <PollPostForm data={formData} onDataChange={handleDataChange} onError={handleModerationError} />;
            case 'live':
                return <LivePostForm data={formData} onDataChange={handleDataChange} onError={handleModerationError} />;
            default:
                return <p>Select a post type</p>;
        }
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="glass-card p-8">
                <h2 className="text-2xl font-headline text-accent-pink mb-4">Step 1: The Content</h2>
                <p className="text-gray-400 mb-6">Let's get the core of your vibe down. Fill in the details below.</p>
                {renderForm()}
                {moderationError && <p className="text-red-500 text-sm mt-4">{moderationError}</p>}
            </div>
            <div className="flex justify-end mt-8">
                <button className="btn-glass bg-accent-pink flex items-center gap-2" onClick={() => onNext(formData)} disabled={!!moderationError}>
                    Next Step <ArrowRight />
                </button>
            </div>
        </motion.div>
    );
}
