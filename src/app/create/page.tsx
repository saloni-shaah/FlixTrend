
"use client";
import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AlignLeft, Image as ImageIcon, BarChart3, Radio, ArrowRight, ArrowLeft } from 'lucide-react';
import Step1 from '@/components/create/Step1';
import Step2 from '@/components/create/Step2';
import Step3 from '@/components/create/Step3';

function CreatePostPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const initialType = searchParams.get('type') as 'text' | 'media' | 'poll' | 'live' || 'text';
    const [postType, setPostType] = useState<'text' | 'media' | 'poll' | 'live'>(initialType);
    const [postData, setPostData] = useState({ postType: initialType });

    const handleNext = (data: any) => {
        setPostData(prev => ({ ...prev, ...data }));
        
        // Skip step 2 if the post is not media type
        if (postType !== 'media' && step === 1) {
            setStep(3);
        } else {
            setStep(s => s + 1);
        }
    };

    const handleBack = () => {
         // Skip step 2 if the post is not media type
        if (postType !== 'media' && step === 3) {
            setStep(1);
        } else {
            setStep(s => s - 1);
        }
    };
    
    const handleTypeChange = (type: 'text' | 'media' | 'poll' | 'live') => {
        setPostType(type);
        setPostData({ postType: type });
        setStep(1);
    };

    const steps = [
        <Step1 key="step1" onNext={handleNext} postType={postType} postData={postData} />,
        <Step2 key="step2" onNext={handleNext} onBack={handleBack} postData={postData} />,
        <Step3 key="step3" onBack={handleBack} postData={postData} />,
    ];
    
    const totalSteps = postType === 'media' ? 3 : 2;
    const currentStepLogic = step === 3 && totalSteps === 2 ? 2 : step;


    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center p-4 min-h-screen">
            <h1 className="text-3xl font-headline font-bold text-accent-cyan mb-8">Create Your Vibe</h1>

            {/* Post Type Selector */}
            <div className="flex gap-2 mb-8 p-2 rounded-full glass-card">
                <button onClick={() => handleTypeChange('text')} className={`relative px-4 py-2 rounded-full font-bold text-sm md:text-base flex items-center justify-center gap-2 transition-colors ${postType === 'text' ? 'text-black' : 'bg-transparent text-gray-300'}`}>
                    {postType === 'text' && <motion.div layoutId="activeCreateTab" className="absolute inset-0 bg-accent-cyan rounded-full z-0" />}
                    <span className="relative z-10 flex items-center gap-2"><AlignLeft />Text</span>
                </button>
                <button onClick={() => handleTypeChange('media')} className={`relative px-4 py-2 rounded-full font-bold text-sm md:text-base flex items-center justify-center gap-2 transition-colors ${postType === 'media' ? 'text-black' : 'bg-transparent text-gray-300'}`}>
                    {postType === 'media' && <motion.div layoutId="activeCreateTab" className="absolute inset-0 bg-accent-cyan rounded-full z-0" />}
                    <span className="relative z-10 flex items-center gap-2"><ImageIcon />Media</span>
                </button>
                <button onClick={() => handleTypeChange('poll')} className={`relative px-4 py-2 rounded-full font-bold text-sm md:text-base flex items-center justify-center gap-2 transition-colors ${postType === 'poll' ? 'text-black' : 'bg-transparent text-gray-300'}`}>
                    {postType === 'poll' && <motion.div layoutId="activeCreateTab" className="absolute inset-0 bg-accent-cyan rounded-full z-0" />}
                    <span className="relative z-10 flex items-center gap-2"><BarChart3 />Poll</span>
                </button>
                 <button onClick={() => handleTypeChange('live')} className={`relative px-4 py-2 rounded-full font-bold text-sm md:text-base flex items-center justify-center gap-2 transition-colors ${postType === 'live' ? 'text-black' : 'bg-transparent text-red-400'}`}>
                    {postType === 'live' && <motion.div layoutId="activeCreateTab" className="absolute inset-0 bg-red-500 rounded-full z-0" />}
                    <span className="relative z-10 flex items-center gap-2"><Radio />Live</span>
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
