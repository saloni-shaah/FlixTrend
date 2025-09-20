
"use client";
import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AlignLeft, Image as ImageIcon, BarChart3, Radio, Zap, ArrowRight, ArrowLeft } from 'lucide-react';
import Step1 from '@/components/create/Step1';
import Step2 from '@/components/create/Step2';
import Step3 from '@/components/create/Step3';

function CreatePostPageContent() {
    const searchParams = useSearchParams();
    const [step, setStep] = useState(1);
    const initialType = searchParams.get('type') as 'text' | 'media' | 'poll' | 'flash' | 'live' || 'text';
    const [postType, setPostType] = useState<'text' | 'media' | 'poll' | 'flash' | 'live'>(initialType);
    const [postData, setPostData] = useState({ postType: initialType });

    const handleNext = (data: any) => {
        setPostData(prev => ({ ...prev, ...data }));
        
        const nonMediaTypes = ['text', 'poll', 'live', 'flash'];
        if (nonMediaTypes.includes(postType) && step === 1) {
            setStep(3);
        } else {
            setStep(s => s + 1);
        }
    };

    const handleBack = () => {
        const nonMediaTypes = ['text', 'poll', 'live', 'flash'];
        if (nonMediaTypes.includes(postType) && step === 3) {
            setStep(1);
        } else {
            setStep(s => s - 1);
        }
    };
    
    const handleTypeChange = (type: 'text' | 'media' | 'poll' | 'flash' | 'live') => {
        setPostType(type);
        setPostData({ postType: type });
        setStep(1);
    };

    const steps = [
        <Step1 key="step1" onNext={handleNext} postType={postType} postData={postData} />,
        <Step2 key="step2" onNext={handleNext} onBack={handleBack} postData={postData} />,
        <Step3 key="step3" onBack={handleBack} postData={postData} />,
    ];
    
    const totalSteps = ['text', 'poll', 'live', 'flash'].includes(postType) ? 2 : 3;
    const currentStepLogic = step === 3 && totalSteps === 2 ? 2 : step;

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center p-4 min-h-screen">
            <h1 className="text-3xl font-headline font-bold text-accent-cyan mb-8">Create Your Vibe</h1>

            {/* Post Type Selector */}
            <div className="flex flex-col md:flex-row gap-4 mb-8 w-full md:w-auto">
                <button onClick={() => handleTypeChange('text')} className={`w-full p-4 rounded-lg font-bold text-lg flex items-center justify-start gap-4 transition-colors glass-card ${postType === 'text' ? 'bg-accent-cyan text-black' : 'bg-transparent text-gray-300'}`}>
                    <AlignLeft />Text Post
                </button>
                 <button onClick={() => handleTypeChange('flash')} className={`w-full p-4 rounded-lg font-bold text-lg flex items-center justify-start gap-4 transition-colors glass-card ${postType === 'flash' ? 'bg-accent-cyan text-black' : 'bg-transparent text-gray-300'}`}>
                    <Zap />Flash
                </button>
                <button onClick={() => handleTypeChange('media')} className={`w-full p-4 rounded-lg font-bold text-lg flex items-center justify-start gap-4 transition-colors glass-card ${postType === 'media' ? 'bg-accent-cyan text-black' : 'bg-transparent text-gray-300'}`}>
                    <ImageIcon />Media
                </button>
                <button onClick={() => handleTypeChange('live')} className={`w-full p-4 rounded-lg font-bold text-lg flex items-center justify-start gap-4 transition-colors glass-card ${postType === 'live' ? 'bg-red-500 text-black' : 'bg-transparent text-red-400'}`}>
                    <Radio />Live
                </button>
                <button onClick={() => handleTypeChange('poll')} className={`w-full p-4 rounded-lg font-bold text-lg flex items-center justify-start gap-4 transition-colors glass-card ${postType === 'poll' ? 'bg-accent-cyan text-black' : 'bg-transparent text-gray-300'}`}>
                   <BarChart3 />Poll
                </button>
            </div>
            
            {/* Progress Bar */}
             <div className="w-full max-w-lg mb-8">
                <div className="flex justify-between items-center text-xs font-bold text-gray-400">
                    <span>Details</span>
                    {totalSteps === 3 && <span>AI Check</span>}
                    <span>Publish</span>
                </div>
                <div className="w-full h-2 bg-black/20 rounded-full mt-1">
                    <motion.div 
                        className="h-2 bg-gradient-to-r from-accent-pink to-accent-cyan rounded-full"
                        animate={{ width: `${(currentStepLogic / totalSteps) * 100}%` }}
                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                    />
                </div>
            </div>

            {/* Steps Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-2xl"
                >
                    {steps[step-1]}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

export default function CreatePostPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CreatePostPageContent />
        </Suspense>
    );
}
