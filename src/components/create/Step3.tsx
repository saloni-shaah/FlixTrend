
"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, ShieldOff, Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getFirestore, collection, addDoc, serverTimestamp, Timestamp, doc, getDoc } from "firebase/firestore";
import { auth, app } from '@/utils/firebaseClient';
import { useRouter } from 'next/navigation';
import { uploadFileToFirebaseStorage, runContentModerationAction } from '@/app/actions';
import { categorizePost } from '@/ai/flows/categorize-post-flow';

const db = getFirestore(app);

// Helper to convert a File object to a Base64 Data URI for the AI
const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};

export default function Step3({ onBack, postData }: { onBack: () => void; postData: any }) {
    const [isScheduling, setIsScheduling] = useState(false);
    const [scheduleDate, setScheduleDate] = useState<Date | undefined>();
    const [scheduleTime, setScheduleTime] = useState('12:00');
    const [isPublishing, setIsPublishing] = useState(false);
    const [moderationError, setModerationError] = useState<string | null>(null);
    const router = useRouter();

    const handleSubmit = async () => {
        setIsPublishing(true);
        setModerationError(null);
        const user = auth.currentUser;
        if (!user) {
            alert("You must be logged in to post.");
            setIsPublishing(false);
            return;
        }

        try {
            // --- AI CONTENT MODERATION --- //
            const textToModerate = [
                postData.title, postData.caption, postData.content, postData.description,
                postData.mood, postData.location, postData.question,
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
            
            const moderationResult = await runContentModerationAction({
                text: textToModerate,
                media: mediaToModerate,
            });

            if (moderationResult.failure) {
                throw new Error(moderationResult.failure);
            }

            if (moderationResult.success?.decision === 'deny') {
                setModerationError(moderationResult.success.reason || 'Your post violates our content guidelines.');
                setIsPublishing(false);
                return; // STOP execution
            }
            
            // --- AI CATEGORIZATION --- //
            const category = await categorizePost(textToModerate);

            // --- MODERATION PASSED - PROCEED --- //

            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (!userDocSnap.exists()) throw new Error("User profile not found!");
            const userData = userDocSnap.data();

            let finalMediaUrls: string[] = [];
            if (postData.mediaFiles && postData.mediaFiles.length > 0) {
                for (const file of postData.mediaFiles) {
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('userId', user.uid);
                    const result = await uploadFileToFirebaseStorage(formData);
                    if (result.success?.url) {
                        finalMediaUrls.push(result.success.url);
                    } else {
                        throw new Error(result.failure || "File upload failed.");
                    }
                }
            }
            
            let finalThumbnailUrl = postData.thumbnailUrl || null;
            if (postData.thumbnailFile) {
                 const formData = new FormData();
                formData.append('file', postData.thumbnailFile);
                 formData.append('userId', user.uid);
                const result = await uploadFileToFirebaseStorage(formData);
                if (result.success?.url) {
                    finalThumbnailUrl = result.success.url;
                } else {
                    throw new Error(result.failure || "Thumbnail upload failed.");
                }
            }

            let publishAt;
            if (isScheduling && scheduleDate) {
                const [hours, minutes] = scheduleTime.split(':');
                const finalDate = new Date(scheduleDate);
                finalDate.setHours(parseInt(hours, 10));
                finalDate.setMinutes(parseInt(minutes, 10));
                publishAt = Timestamp.fromDate(finalDate);
            } else {
                publishAt = serverTimestamp();
            }

            const livekitRoomName = postData.postType === 'live' ? `${user.uid}-${Date.now()}` : null;
            const collectionName = postData.postType === 'flash' ? 'flashes' : 'posts';

            const finalPostData: any = {
                userId: user.uid,
                displayName: userData.name || user.displayName,
                username: userData.username,
                avatar_url: userData.avatar_url,
                type: postData.postType,
                content: postData.content || postData.caption || postData.question || postData.title || "",
                hashtags: (postData.caption?.match(/#\w+/g) || []).map((h:string) => h.replace('#', '')),
                category: category, // SAVING THE CATEGORY
                createdAt: serverTimestamp(),
                publishAt: publishAt,
                location: postData.location || null,
                mood: postData.mood || null,
                ...(postData.postType === 'text' && { backgroundColor: postData.backgroundColor, fontStyle: postData.fontStyle }),
                ...(postData.postType === 'media' && { mediaUrl: finalMediaUrls.length > 0 ? (finalMediaUrls.length > 1 ? finalMediaUrls : finalMediaUrls[0]) : null, title: postData.title || "", description: postData.description || "", thumbnailUrl: finalThumbnailUrl }),
                ...(postData.postType === 'flash' && { mediaUrl: finalMediaUrls.length > 0 ? finalMediaUrls[0] : null, song: postData.song || null, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), caption: postData.caption || "" }),
                ...(postData.postType === 'poll' && { pollOptions: postData.options.map((opt:any) => opt.text) }),
                ...(postData.postType === 'live' && { livekitRoom: livekitRoomName, title: postData.title || "Live Stream" }),
            };
            
            await addDoc(collection(db, collectionName), finalPostData);
            
            if (postData.postType === 'live' && livekitRoomName) {
                router.push(`/broadcast/${encodeURIComponent(livekitRoomName)}`);
            } else {
                router.push('/home');
            }

        } catch (error: any) {
            console.error("Error publishing post:", error);
            if (error.message.includes("moderation")) {
                 setModerationError(error.message);
            } else {
                alert("Failed to publish post. Please try again.");
            }
        } finally {
            setIsPublishing(false);
        }
    };

    const shouldShowScheduling = postData.postType !== 'flash' && postData.postType !== 'live';

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
             <div className="glass-card p-8">
                <h2 className="text-2xl font-headline text-accent-pink mb-4">Step 3: Publish</h2>
                <p className="text-gray-400 mb-6">Your post will be checked by our AI for compliance with our content guidelines before it goes live.</p>
                 
                {moderationError && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-lg mb-6 flex items-center gap-3"
                    >
                        <ShieldOff size={24} />
                        <div>
                            <h4 className="font-bold">Post Rejected</h4>
                            <p className="text-sm">{moderationError}</p>
                        </div>
                    </motion.div>
                )}

                <div className="bg-black/20 p-4 rounded-lg space-y-3 text-sm text-gray-300">
                    <h4 className="font-bold text-accent-cyan">Content Guidelines</h4>
                    <p>✓ Be respectful. No harassment, hate speech, or bullying.</p>
                    <p>✓ Keep it safe. No explicit, violent, or illegal content.</p>
                    <p>✓ Respect copyright. Only post content you own or have rights to.</p>
                </div>

                {shouldShowScheduling && (
                    <div className="mt-6">
                        <div className="flex items-center justify-between">
                            <h4 className="font-bold text-accent-cyan mb-2">Scheduling</h4>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={isScheduling} onChange={(e) => setIsScheduling(e.target.checked)} className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-accent-cyan peer-checked:after:translate-x-full after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-cyan"></div>
                            </label>
                        </div>

                        {isScheduling && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex flex-col md:flex-row gap-4 mt-4">
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <button className="btn-glass flex-1 justify-start text-left font-normal">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {scheduleDate ? scheduleDate.toLocaleDateString() : <span>Pick a date</span>}
                                    </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 glass-card">
                                    <Calendar
                                        mode="single"
                                        selected={scheduleDate}
                                        onSelect={setScheduleDate}
                                        initialFocus
                                        disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))}
                                    />
                                    </PopoverContent>
                                </Popover>
                                <input 
                                    type="time"
                                    value={scheduleTime}
                                    onChange={(e) => setScheduleTime(e.target.value)}
                                    className="input-glass"
                                />
                            </motion.div>
                        )}
                    </div>
                )}

            </div>
             <div className="flex justify-between mt-8">
                <button className="btn-glass flex items-center gap-2" onClick={onBack} disabled={isPublishing}>
                    <ArrowLeft /> Back
                </button>
                <button 
                    className="btn-glass bg-green-500 text-white flex items-center gap-2 disabled:bg-gray-500" 
                    onClick={handleSubmit}
                    disabled={isPublishing}
                >
                    {isPublishing ? 'Publishing...' : 'Publish Now'} <CheckCircle />
                </button>
            </div>
        </motion.div>
    );
}
