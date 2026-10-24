
"use client";
import React, { useState, Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AlignLeft, Image as ImageIcon, BarChart3, Zap, Radio, FilePenLine, Loader2 } from 'lucide-react';
import Step1 from '@/components/create/Step1';
import Step2 from '@/components/create/Step2';
import Step3 from '@/components/create/Step3';
import { auth } from '@/utils/firebaseClient';
import { loadPostDraft } from '@/lib/postDrafts';

const POST_TYPES = [
  { id: 'text', label: 'Text Post', icon: AlignLeft },
  { id: 'media', label: 'Media', icon: ImageIcon },
  { id: 'poll', label: 'Poll', icon: BarChart3 },
  { id: 'flash', label: 'Flash', icon: Zap },
  { id: 'live', label: 'Live', icon: Radio },
  { id: 'draft', label: 'Draft Studio', icon: FilePenLine },
];

function CreatePostPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const initialType = searchParams.get('type') as 'text' | 'media' | 'poll' | 'flash' | 'live' | 'draft' || undefined;
    const initialImageUrl = searchParams.get('imageUrl');
    const draftId = searchParams.get('draftId');

    const [postData, setPostData] = useState<any>({
        postType: initialType,
        songId: searchParams.get('songId'),
        mediaUrl: initialImageUrl ? [initialImageUrl] : [],
        mediaFiles: []
    });

    const [step, setStep] = useState(1);
    const [postType, setPostType] = useState<'text' | 'media' | 'poll' | 'flash' | 'live' | 'draft' | undefined>(initialType);
    const [typeSelected, setTypeSelected] = useState(!!initialType);
    const [isLoadingDraft, setIsLoadingDraft] = useState(Boolean(draftId));
    const [draftLoadError, setDraftLoadError] = useState<string | null>(null);

    useEffect(() => {
        if (initialType && !typeSelected) {
            handleTypeChange(initialType);
        }
    }, [initialType, typeSelected]);

    useEffect(() => {
        if (!draftId) return;
        let cancelled = false;
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (!user) {
                setDraftLoadError('Sign in to open this saved draft.');
                setIsLoadingDraft(false);
                return;
            }

            void loadPostDraft(user.uid, draftId).then(({ data }) => {
                if (cancelled) return;
                setPostData((current: any) => ({ ...current, ...data }));
                setPostType(data.postType);
                setTypeSelected(true);
            }).catch((error) => {
                if (cancelled) return;

                try {
                    const savedDrafts = JSON.parse(window.localStorage.getItem('flixtrend:drafts') || '[]');
                    const savedDraft = Array.isArray(savedDrafts)
                        ? savedDrafts.find((draft: any) => draft.id === draftId)
                        : null;
                    if (savedDraft && initialType === 'draft') {
                        setPostData((current: any) => ({
                            ...current,
                            ...savedDraft,
                            postType: 'draft',
                            draftId: savedDraft.id,
                            draftTitle: savedDraft.title || '',
                            draftClips: [],
                            backgroundAudio: null,
                            backgroundAudioName: savedDraft.musicName || '',
                            editedFile: null,
                            editedThumbnailFile: null,
                            editedIsVideo: false,
                            editedDuration: null,
                        }));
                        setPostType('draft');
                        setTypeSelected(true);
                        return;
                    }
                } catch (localError) {
                    console.error('Could not read a legacy local draft:', localError);
                }

                console.error('Could not reopen cloud draft:', error);
                setDraftLoadError(error instanceof Error ? error.message : 'Could not open this draft.');
            }).finally(() => {
                if (!cancelled) setIsLoadingDraft(false);
            });
        });

        return () => {
            cancelled = true;
            unsubscribe();
        };
    }, [draftId]);

    const handleNext = (data: any = {}) => {
        setPostData((prev: any) => ({ ...prev, ...data }));
        setStep((s: number) => s + 1);
    };

    const handleBack = () => {
        setStep((s: number) => s - 1);
    };

    const handleDataChange = (newData: any) => {
        setPostData((prev: any) => ({...prev, ...newData}));
    }

    const handleTypeChange = (type: 'text' | 'media' | 'poll' | 'flash' | 'live' | 'draft') => {
        setPostType(type);
        setPostData({ postType: type, songId: searchParams.get('songId'), mediaUrl: [], mediaFiles: [] }); // Reset data
        setStep(1);
        setTypeSelected(true);
        router.push(`/create?type=${type}${searchParams.get('songId') ? `&songId=${searchParams.get('songId')}`: ''}`, { scroll: false });
    };

    const steps = [
        <Step1 key="step1" onNext={handleNext} postType={postType!} postData={postData} onDataChange={handleDataChange} />,
        <Step2 key="step2" onBack={handleBack} onNext={handleNext} postData={postData} />,
        <Step3 key="step3" onBack={handleBack} postData={postData} />,
    ];

    const totalSteps = 3;
    const currentStepLogic = step;

    const stepLabels = ['Details', 'Review', 'Publish'];


    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center p-4 min-h-screen">
            <h1 className="text-3xl font-headline font-bold text-accent-cyan mb-8">Create Your Vibe</h1>

            {isLoadingDraft && <Loader2 className="animate-spin text-accent-cyan" aria-label="Loading draft" />}
            {draftLoadError && <p role="alert" className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">{draftLoadError}</p>}

            {!typeSelected && (
                 <motion.div
                    className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 w-full"
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: {},
                        visible: { transition: { staggerChildren: 0.05 }}
                    }}
                >
                    {POST_TYPES.map(type => (
                        <motion.button 
                            key={type.id}
                            variants={{hidden: {opacity:0, y:20}, visible: {opacity:1, y:0}}}
                            onClick={() => handleTypeChange(type.id as any)}
                            className={`w-full p-4 rounded-lg font-bold text-lg flex items-center justify-start gap-4 transition-colors glass-card ${postType === type.id ? 'bg-accent-cyan text-black' : 'bg-transparent text-gray-300'}`}>
                            <type.icon />{type.label}
                        </motion.button>
                    ))}
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
