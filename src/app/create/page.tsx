
"use client";
import React, { useState, Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AlignLeft, Image as ImageIcon } from 'lucide-react';
import Step1 from '@/components/create/Step1';
import Step3 from '@/components/create/Step3';

function CreatePostPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const initialType = searchParams.get('type') as 'text' | 'media' || undefined;
    const initialImageUrl = searchParams.get('imageUrl');

    const [postData, setPostData] = useState<any>({
        postType: initialType,
        songId: searchParams.get('songId'),
        mediaUrl: initialImageUrl ? [initialImageUrl] : [],
        mediaFiles: []
    });

    const [step, setStep] = useState(1);
    const [postType, setPostType] = useState<'text' | 'media' | undefined>(initialType);
    const [typeSelected, setTypeSelected] = useState(!!initialType);

    useEffect(() => {
        if (initialType && !typeSelected) {
            handleTypeChange(initialType);
        }
    }, [initialType, typeSelected]);

    const handleNext = (data: any) => {
        setPostData(prev => ({ ...prev, ...data }));
        setStep(s => s + 1);
    };

    const handleBack = () => {
        setStep(s => s - 1);
    };

    const handleDataChange = (newData: any) => {
        setPostData(prev => ({...prev, ...newData}));
    }

    const handleTypeChange = (type: 'text' | 'media') => {
        setPostType(type);
        setPostData({ postType: type, songId: searchParams.get('songId'), mediaUrl: [], mediaFiles: [] }); // Reset data
        setStep(1);
        setTypeSelected(true);
        router.push(`/create?type=${type}${searchParams.get('songId') ? `&songId=${searchParams.get('songId')}`: ''}`, { scroll: false });
    };

    const steps = [
        <Step1 key="step1" onNext={handleNext} postType={postType!} postData={postData} onDataChange={handleDataChange} />,
        <Step3 key="step2" onBack={handleBack} postData={postData} />,
    ];

    const totalSteps = 2;
    const currentStepLogic = step;

    const stepLabels = ['Details', 'Publish'];


    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center p-4 min-h-screen">
            <h1 className="text-3xl font-headline font-bold text-accent-cyan mb-8">Create Your Vibe</h1>

            {!typeSelected && (
                 <motion.div
                    className="flex flex-col md:flex-row gap-4 mb-8 w-full md:w-auto"
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: {},
                        visible: { transition: { staggerChildren: 0.1 }}
                    }}
                >
                    <motion.button variants={{hidden: {opacity:0, y:20}, visible: {opacity:1, y:0}}} onClick={() => handleTypeChange('text')} className={`w-full p-4 rounded-lg font-bold text-lg flex items-center justify-start gap-4 transition-colors glass-card ${postType === 'text' ? 'bg-accent-cyan text-black' : 'bg-transparent text-gray-300'}`}>
                        <AlignLeft />Text Post
                    </motion.button>
                    <motion.button variants={{hidden: {opacity:0, y:20}, visible: {opacity:1, y:0}}} onClick={() => handleTypeChange('media')} className={`w-full p-4 rounded-lg font-bold text-lg flex items-center justify-start gap-4 transition-colors glass-card ${postType === 'media' ? 'bg-accent-cyan text-black' : 'bg-transparent text-gray-300'}`}>
                        <ImageIcon />Media
                    </motion.button>
                </motion.div>
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
