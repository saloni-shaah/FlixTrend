
"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getFirestore, collection, addDoc, serverTimestamp, Timestamp, doc, getDoc } from "firebase/firestore";
import { auth, app } from '@/utils/firebaseClient';
import { useRouter } from 'next/navigation';

const db = getFirestore(app);

// Helper to upload a file to Cloudinary
async function uploadToCloudinary(file: File): Promise<string> {
    const url = `https://api.cloudinary.com/v1_1/drrzvi2jp/upload`;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "flixtrend_unsigned");
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", url);
        xhr.onload = () => {
            if (xhr.status === 200) {
                const data = JSON.parse(xhr.responseText);
                resolve(data.secure_url);
            } else {
                reject(new Error('Upload failed'));
            }
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.send(formData);
    });
}

export default function Step3({ onBack, postData }: { onBack: () => void; postData: any }) {
    const [isScheduling, setIsScheduling] = useState(false);
    const [scheduleDate, setScheduleDate] = useState<Date | undefined>();
    const [scheduleTime, setScheduleTime] = useState('12:00');
    const [isPublishing, setIsPublishing] = useState(false);
    const router = useRouter();

    const handleSubmit = async () => {
        setIsPublishing(true);
        const user = auth.currentUser;
        if (!user) {
            alert("You must be logged in to post.");
            setIsPublishing(false);
            return;
        }

        try {
             // Fetch user profile to embed info
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (!userDocSnap.exists()) {
                throw new Error("User profile not found!");
            }
            const userData = userDocSnap.data();

            // 1. Handle File Uploads first
            let finalMediaUrls: string[] = [];
            if (postData.mediaFiles && postData.mediaFiles.length > 0) {
                for (const file of postData.mediaFiles) {
                    const url = await uploadToCloudinary(file);
                    finalMediaUrls.push(url);
                }
            }
            
            let finalThumbnailUrl = postData.thumbnailUrl || null;
            if (postData.thumbnailFile) {
                finalThumbnailUrl = await uploadToCloudinary(postData.thumbnailFile);
            }

            // 2. Construct the final post object
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

            const finalPostData = {
                // Common fields
                userId: user.uid,
                displayName: userData.name || user.displayName,
                username: userData.username,
                avatar_url: userData.avatar_url,
                type: postData.postType,
                content: postData.caption || postData.content || postData.question || postData.title,
                hashtags: (postData.caption?.match(/#\w+/g) || []).map((h:string) => h.replace('#', '')),
                createdAt: serverTimestamp(),
                publishAt: publishAt,

                // Type-specific fields
                ...(postData.postType === 'text' && {
                    backgroundColor: postData.backgroundColor,
                    fontStyle: postData.fontStyle,
                }),
                ...(postData.postType === 'media' && {
                    mediaUrl: finalMediaUrls.length > 1 ? finalMediaUrls : finalMediaUrls[0],
                    title: postData.title,
                    description: postData.description,
                    thumbnailUrl: finalThumbnailUrl,
                }),
                ...(postData.postType === 'poll' && {
                    pollOptions: postData.options.map((opt:any) => opt.text), // Simplified for now
                }),
                 ...(postData.postType === 'live' && {
                    // Live specific fields, if any
                }),
            };
            
            // 3. Save to Firestore
            await addDoc(collection(db, 'posts'), finalPostData);
            
            // 4. Redirect on success
            router.push('/home');

        } catch (error) {
            console.error("Error publishing post:", error);
            alert("Failed to publish post. Please try again.");
        } finally {
            setIsPublishing(false);
        }
    };


    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
             <div className="glass-card p-8">
                <h2 className="text-2xl font-headline text-accent-pink mb-4">Step 3: Publish</h2>
                <p className="text-gray-400 mb-6">Review the content guidelines and schedule your post if you'd like.</p>
                 
                <div className="bg-black/20 p-4 rounded-lg space-y-3 text-sm text-gray-300">
                    <h4 className="font-bold text-accent-cyan">Content Guidelines</h4>
                    <p>✓ Be respectful. No harassment, hate speech, or bullying.</p>
                    <p>✓ Keep it safe. No explicit, violent, or illegal content.</p>
                    <p>✓ Respect copyright. Only post content you own or have rights to.</p>
                    <p>FlixTrend may remove posts that violate these guidelines to keep the community safe.</p>
                </div>

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
