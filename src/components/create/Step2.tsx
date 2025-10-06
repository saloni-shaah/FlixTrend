"use client";
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Loader, CheckCircle, XCircle } from 'lucide-react';
// CORRECTED: Import the server action, not the raw flow.
import { runContentModerationAction } from '@/app/actions';

type ModerationStatus = 'checking' | 'safe' | 'unsafe';

// Helper to convert File to Data URI
function fileToDataUri(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export default function Step2({ onNext, onBack, postData }: { onNext: (data: any) => void; onBack: () => void; postData: any }) {
    const [status, setStatus] = useState<ModerationStatus>('checking');
    const [reason, setReason] = useState('');

    useEffect(() => {
        const runModeration = async () => {
            setStatus('checking');

            // Bypass AI check for 'flash' and 'live' posts as they don't require the same level of scrutiny.
            if (postData.postType === 'flash' || postData.postType === 'live') {
                setStatus('safe');
                setReason('Approved for posting!');
                return;
            }
            
            try {
                const textToModerate = [
                    postData.caption, postData.title, postData.description, postData.question, postData.content
                ].filter(Boolean).join(' \n ');

                const mediaToModerate: { url: string }[] = [];
                const filesToProcess: File[] = [];
                if (postData.thumbnailFile) filesToProcess.push(postData.thumbnailFile);
                if (postData.mediaFiles) filesToProcess.push(...postData.mediaFiles);

                for (const file of filesToProcess) {
                    if (file instanceof File && file.type.startsWith('image/')) {
                        const dataUri = await fileToDataUri(file);
                        mediaToModerate.push({ url: dataUri });
                    }
                }

                if (!textToModerate && mediaToModerate.length === 0) {
                    setStatus('safe');
                    setReason('Content looks good!');
                    return;
                }
                
                // CORRECTED: Call the server action instead of the flow directly.
                const result = await runContentModerationAction({
                    text: textToModerate,
                    media: mediaToModerate,
                });

                if (result.failure) {
                    throw new Error(result.failure);
                }

                if (result.success?.decision === 'approve') {
                    setStatus('safe');
                    setReason(result.success.reason || 'Content approved!');
                } else {
                    setStatus('unsafe');
                    setReason(result.success?.reason || 'Content violates our community guidelines.');
                }
            } catch (error: any) {
                console.error("Moderation error in Step2:", error);
                setStatus('unsafe');
                setReason(error.message || "An unexpected error occurred during the content check. Please try again.");
            }
        };
        
        runModeration();

    }, [postData]);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="glass-card p-8 text-center min-h-[250px] flex flex-col items-center justify-center">
                 <h2 className="text-2xl font-headline text-accent-pink mb-4">Step 2: AI Safety Check</h2>
                 
                 {status === 'checking' && (
                     <div className="flex flex-col items-center gap-4">
                        <Loader className="text-accent-cyan animate-spin" size={48} />
                        <p className="text-gray-400">Our AI is analyzing your content to ensure it's safe for the community...</p>
                     </div>
                 )}

                 {status === 'safe' && (
                     <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4">
                        <CheckCircle className="text-green-400" size={48} />
                        <p className="font-bold text-green-400">Content Approved!</p>
                        <p className="text-gray-400 text-sm">{reason}</p>
                     </motion.div>
                 )}

                 {status === 'unsafe' && (
                      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4">
                        <XCircle className="text-red-500" size={48} />
                        <p className="font-bold text-red-500">Content Flagged</p>
                        <p className="text-gray-300 text-sm max-w-sm">{reason}</p>
                        <p className="text-xs text-gray-500 mt-2">Please go back and edit your post to comply with our guidelines.</p>
                     </motion.div>
                 )}
            </div>
            <div className="flex justify-between mt-8">
                <button className="btn-glass flex items-center gap-2" onClick={onBack}>
                    <ArrowLeft /> Back
                </button>
                <button 
                    className="btn-glass bg-accent-pink flex items-center gap-2 disabled:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed" 
                    onClick={() => onNext({})}
                    disabled={status !== 'safe'}
                >
                    Next Step <ArrowRight />
                </button>
            </div>
        </motion.div>
    );
}
