
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

    const handleDataChange = (data: any) => {
        setFormData(prev => ({...prev, ...data}));
    };

    const renderForm = () => {
        switch(postType) {
            case 'text':
                return <TextPostForm data={formData} onDataChange={handleDataChange} />;
            case 'media':
                return <MediaPostForm data={formData} onDataChange={handleDataChange} />;
            case 'flash':
                return <FlashPostForm data={formData} onDataChange={handleDataChange} />;
            case 'poll':
                return <PollPostForm data={formData} onDataChange={handleDataChange} />;
            case 'live':
                return <LivePostForm data={formData} onDataChange={handleDataChange} />;
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
            </div>
            <div className="flex justify-end mt-8">
                <button className="btn-glass bg-accent-pink flex items-center gap-2" onClick={() => onNext(formData)}>
                    Next Step <ArrowRight />
                </button>
            </div>
        </motion.div>
    );
}
