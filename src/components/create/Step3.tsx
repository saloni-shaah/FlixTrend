
"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, ShieldOff, Calendar as CalendarIcon, Eye } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getFirestore, collection, addDoc, serverTimestamp, Timestamp, doc, getDoc } from "firebase/firestore";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, app } from '@/utils/firebaseClient';
import { useRouter } from 'next/navigation';

const db = getFirestore(app);
const storage = getStorage(app);

// Mapping from sub-category (creatorType) to main category
const creatorCategoryMap: { [key: string]: string } = {
    'vlogs': 'daily', 'moments': 'daily', 'travel': 'daily', 'self': 'daily',
    'art': 'creative', 'photos': 'creative', 'design': 'creative', 'writing': 'creative',
    'gaming': 'play', 'challenges': 'play', 'comedy': 'play', 'reactions': 'play',
    'tips': 'learn', 'tech': 'learn', 'study': 'learn', 'explainers': 'learn',
    'music': 'culture', 'movies': 'culture', 'trends': 'culture', 'community': 'culture'
};

function PostPreview({ postData }: { postData: any }) {
    if (!postData) return null;
    
    const {
        postType, content, question, pollOptions, mediaUrl, backgroundColor, fontStyle, title, caption,
    } = postData;

    return (
        <div className="mb-6">
            <h4 className="font-bold text-sm text-accent-cyan mb-2 flex items-center gap-2"><Eye size={16}/> Post Preview</h4>
            <div className="border border-glass-border rounded-2xl p-4 bg-black/20">
                {postType === 'text' && (
                     <div 
                        className={`w-full min-h-[100px] p-4 rounded-lg flex items-center justify-center text-center ${fontStyle || 'font-body'}`}
                        style={{
                            backgroundColor: backgroundColor || 'transparent',
                            backgroundImage: postData.backgroundImage ? `url(${postData.backgroundImage})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    >
                        <p className="text-lg">{content}</p>
                    </div>
                )}

                {(postType === 'media' || postType === 'flash') && mediaUrl && mediaUrl.length > 0 && (
                    <>
                        <p className="font-bold">{title}</p>
                        <p className="text-sm text-gray-400">{caption}</p>
                        <div className="mt-2 grid grid-cols-3 gap-2">
                            {mediaUrl.map((url: string, index: number) => {
                                const isVideo = postData.mediaFiles[index]?.type.startsWith('video/');
                                if (isVideo) {
                                    return <video key={index} src={url} className="w-full h-auto rounded-md aspect-square object-cover" />;
                                }
                                return <img key={index} src={url} alt="preview" className="w-full h-auto rounded-md aspect-square object-cover" />
                            })}
                        </div>
                    </>
                )}

                {postType === 'poll' && (
                    <>
                        <p className="font-bold mb-2">{question}</p>
                        <div className="flex flex-col gap-2">
                            {postData.options?.map((opt: any, idx: number) => (
                                <div key={idx} className="p-2 border border-glass-border rounded-full text-sm text-center">
                                    {opt.text}
                                </div>
                            ))}
                        </div>
                    </>
                )}
                 {postType === 'live' && (
                    <div className="text-center">
                        <p className="font-bold text-red-500">LIVE</p>
                        <p>{title || "Live Stream"}</p>
                    </div>
                )}
            </div>
        </div>
    );
}


export default function Step3({ onNext, onBack, postData }: { onNext?: (data: any) => void; onBack: () => void; postData: any }) {
    const [isScheduling, setIsScheduling] = useState(false);
    const [scheduleDate, setScheduleDate] = useState<Date | undefined>();
    const [scheduleTime, setScheduleTime] = useState('12:00');
    const [isPublishing, setIsPublishing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const uploadMedia = async (files: File[]) => {
        const user = auth.currentUser;
        if (!user) throw new Error("User not logged in");

        const uploadPromises = files.map(async (file) => {
            const fileName = `${user.uid}-${Date.now()}-${file.name}`;
            const fileRef = storageRef(storage, `posts/${user.uid}/${fileName}`);
            const snapshot = await uploadBytes(fileRef, file);
            return getDownloadURL(snapshot.ref);
        });

        return Promise.all(uploadPromises);
    };

    const handleSubmit = async () => {
        setIsPublishing(true);
        setError(null);
        const user = auth.currentUser;
        if (!user) {
            alert("You must be logged in to post.");
            setIsPublishing(false);
            return;
        }

        try {
            let uploadedMediaUrls: string[] = [];
            if (postData.mediaFiles && postData.mediaFiles.length > 0) {
                uploadedMediaUrls = await uploadMedia(postData.mediaFiles);
            }

            const finalPostData = { ...postData, mediaUrl: uploadedMediaUrls };
            
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (!userDocSnap.exists()) throw new Error("User profile not found!");
            const userData = userDocSnap.data();

            // Determine the main category from the creator's sub-category type
            const creatorType = userData.creatorType || '';
            const mainCategory = creatorCategoryMap[creatorType] || null;

            let publishAt;
            if (isScheduling && scheduleDate && postData.postType !== 'live') {
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
            const hashtags = (postData.hashtags || "").split(' ').map((h:string) => h.replace('#', '')).filter(Boolean);
            
            const dataToSave: any = {
                userId: user.uid,
                displayName: userData.name || user.displayName,
                username: userData.username,
                avatar_url: userData.avatar_url,
                type: postData.postType,
                content: postData.content || postData.caption || postData.question || postData.title || "",
                hashtags: hashtags,
                createdAt: serverTimestamp(),
                publishAt: publishAt,
                notificationSent: false,
                location: postData.location || null,
                mood: postData.mood || null,
                isPortrait: postData.isPortrait || false,
                videoDuration: postData.videoDuration || 0,
                isVideo: postData.isVideo || false,
                viewCount: 0,
                creatorType: creatorType, // Save the creator's specific type
                category: mainCategory, // **NEW: Save the derived main category**
                ...(postData.postType === 'text' && { 
                    backgroundColor: postData.backgroundColor || null, 
                    backgroundImage: postData.backgroundImage || null, 
                    fontStyle: postData.fontStyle || null 
                }),
                ...(postData.postType === 'media' && { 
                    mediaUrl: finalPostData.mediaUrl && finalPostData.mediaUrl.length > 0 ? (finalPostData.mediaUrl.length > 1 ? finalPostData.mediaUrl : finalPostData.mediaUrl[0]) : null, 
                    title: postData.title || "", 
                    description: postData.description || "", 
                }),
                ...(postData.postType === 'flash' && { 
                    mediaUrl: finalPostData.mediaUrl && finalPostData.mediaUrl.length > 0 ? finalPostData.mediaUrl[0] : null, 
                    song: postData.song || null, 
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), 
                    caption: postData.caption || "" 
                }),
                ...(postData.postType === 'poll' && { pollOptions: postData.options.map((opt:any) => opt.text) }),
                ...(postData.postType === 'live' && { 
                    livekitRoom: livekitRoomName, 
                    title: postData.title || "Live Stream", 
                    status: (isScheduling && postData.postType !== 'live') ? 'scheduled' : 'live'
                }),
            };
            
            await addDoc(collection(db, collectionName), dataToSave);
            
            if (postData.postType === 'live' && livekitRoomName) {
                router.push(`/broadcast/${encodeURIComponent(livekitRoomName)}`);
            } else {
                router.push('/home');
            }

        } catch (error: any) {
            console.error("Error publishing post:", error);
            setError(error.message);
        } finally {
            setIsPublishing(false);
        }
    };

    const shouldShowScheduling = postData.postType !== 'flash' && postData.postType !== 'live';

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
             <div className="glass-card p-8">
                <h2 className="text-2xl font-headline text-accent-pink mb-4">Step 2: Publish</h2>
                
                <PostPreview postData={postData} />

                <p className="text-gray-400 mb-6 text-sm">You're ready to publish now or schedule your post for later.</p>
                 
                {error && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-lg mb-6 flex items-center gap-3"
                    >
                        <ShieldOff size={24} />
                        <div>
                            <h4 className="font-bold">Publishing Error</h4>
                            <p className="text-sm">{error}</p>
                        </div>
                    </motion.div>
                )}

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
                    {isPublishing ? 'Publishing...' : (isScheduling && scheduleDate && shouldShowScheduling) ? 'Schedule Post' : 'Publish Now'} <CheckCircle />
                </button>
            </div>
        </motion.div>
    );
}
