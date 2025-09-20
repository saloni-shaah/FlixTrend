
"use client";
import React, { useState, Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AlignLeft, Image as ImageIcon, BarChart3, Radio, Zap } from 'lucide-react';
import Step1 from '@/components/create/Step1';
import Step2 from '@/components/create/Step2';
import Step3 from '@/components/create/Step3';

function CreatePostPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const initialType = searchParams.get('type') as 'text' | 'media' | 'poll' | 'flash' | 'live' || undefined;
    
    const [step, setStep] = useState(1);
    const [postType, setPostType] = useState<'text' | 'media' | 'poll' | 'flash' | 'live' | undefined>(initialType);
    const [postData, setPostData] = useState({ postType: initialType });
    const [typeSelected, setTypeSelected] = useState(!!initialType);

    useEffect(() => {
        if (initialType && !typeSelected) {
            handleTypeChange(initialType);
        }
    }, [initialType, typeSelected]);

    const handleNext = (data: any) => {
        setPostData(prev => ({ ...prev, ...data }));
        // Live posts are simple and can skip the AI check step
        if (postType === 'live' && step === 1) {
            setStep(3);
        } else {
            setStep(s => s + 1);
        }
    };

    const handleBack = () => {
        // Handle backing from publish to content for live posts
        if (postType === 'live' && step === 3) {
            setStep(1);
        } else {
            setStep(s => s - 1);
        }
    };
    
    const handleTypeChange = (type: 'text' | 'media' | 'poll' | 'flash' | 'live') => {
        setPostType(type);
        setPostData({ postType: type });
        setStep(1);
        setTypeSelected(true);
        // Update URL without reloading page
        router.push(`/create?type=${type}`, { scroll: false });
    };

    const steps = postType ? [
        <Step1 key="step1" onNext={handleNext} postType={postType} postData={postData} />,
        <Step2 key="step2" onNext={handleNext} onBack={handleBack} postData={postData} />,
        <Step3 key="step3" onBack={handleBack} postData={postData} />,
    ] : [];
    
    const totalSteps = postType === 'live' ? 2 : 3;
    const currentStepLogic = step;
    
    const stepLabels = ['Details', 'AI Check', 'Publish'];
    if (totalSteps === 2) {
        stepLabels.splice(1, 1); // Remove 'AI Check' for live
    }


    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center p-4 min-h-screen">
            <h1 className="text-3xl font-headline font-bold text-accent-cyan mb-8">Create Your Vibe</h1>

            {!typeSelected && (
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
            )}
            
            {typeSelected && postType && (
                <>
                    {/* Progress Bar */}
                    <div className="w-full max-w-lg mb-8">
                        <div className="flex justify-between items-center text-xs font-bold text-gray-400">
                           {stepLabels.map(label => <span key={label}>{label}</span>)}
                        </div>
                         <div className="relative w-full h-4 mt-1">
                            <svg width="100%" height="100%" viewBox="0 0 200 10" preserveAspectRatio="none" className="absolute top-0 left-0">
                                <defs>
                                    <clipPath id="heptagonClip">
                                        <path d="M0,5 L20,0 L90,2 L150,0 L200,5 L160,10 L80,9 L30,10 Z" />
                                    </clipPath>
                                    <linearGradient id="paint0_linear_7_9" x1="0" y1="5" x2="200" y2="5" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="var(--accent-pink)"/>
                                        <stop offset="1" stopColor="var(--accent-cyan)"/>
                                    </linearGradient>
                                </defs>
                                <g clipPath="url(#heptagonClip)">
                                    <rect x="0" y="0" width="200" height="10" className="text-black/20" fill="currentColor" />
                                    <motion.rect
                                        x="0"
                                        y="0"
                                        height="10"
                                        fill="url(#paint0_linear_7_9)"
                                        initial={{ width: 0 }}
                                        animate={{ width: ((currentStepLogic - 1) / (totalSteps - 1)) * 200 }}
                                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                                    />
                                </g>
                            </svg>
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
                </>
            )}
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
