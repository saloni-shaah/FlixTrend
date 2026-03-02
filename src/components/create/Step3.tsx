
"use client";
import React, { useState, useEffect } from 'react';
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

const creatorCategoryMap: { [key: string]: string } = {
    'vlogs': 'daily', 'moments': 'daily', 'travel': 'daily', 'self': 'daily',
    'art': 'creative', 'photos': 'creative', 'design': 'creative', 'writing': 'creative',
    'gaming': 'play', 'challenges': 'play', 'comedy': 'play', 'reactions': 'play',
    'tips': 'learn', 'tech': 'learn', 'study': 'learn', 'explainers': 'learn',
    'music': 'culture', 'movies': 'culture', 'trends': 'culture', 'community': 'culture'
};

function PostPreview({ postData }: { postData: any }) {
    if (!postData) return null;
    
    const { postType, content, mediaUrl, thumbnailUrl, fontStyle, backgroundColor } = postData;

    return (
        <div className="mb-6">
            <h4 className="font-bold text-sm text-accent-cyan mb-2 flex items-center gap-2"><Eye size={16}/> Post Preview</h4>
            <div className="border border-glass-border rounded-2xl p-4 bg-black/20">
                {postType === 'text' && (
                     <div 
                        className={`w-full min-h-[100px] p-4 rounded-lg flex items-center justify-center text-center ${fontStyle || 'font-body'}`}
                        style={{ backgroundColor: backgroundColor || 'transparent', backgroundImage: postData.backgroundImage ? `url(${postData.backgroundImage})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}
                    >
                        <p className="text-lg">{content}</p>
                    </div>
                )}
                
                {(postType === 'media' || postType === 'flash') && (thumbnailUrl || mediaUrl?.[0]) && (
                     <>
                        <p className="font-bold text-white pb-2">{postData.content}</p>
                        <div className="mt-2 aspect-video w-full rounded-md overflow-hidden bg-black flex items-center justify-center">
                            <img src={thumbnailUrl || mediaUrl[0]} alt="preview" className="w-full h-full object-cover" />
                        </div>
                        {postData.description && <p className="text-sm text-gray-300 mt-2">{postData.description}</p>}
                    </>
                )}

                {postType === 'poll' && (
                    <>
                        <p className="font-bold mb-2">{postData.question}</p>
                        <div className="flex flex-col gap-2">
                            {postData.options?.map((opt: any, idx: number) => (
                                <div key={idx} className="p-2 border border-glass-border rounded-full text-sm text-center">{opt.text}</div>
                            ))}
                        </div>
                    </>
                )}
                 {postType === 'live' && (
                    <div className="text-center">
                        <p className="font-bold text-red-500">LIVE</p>
                        <p>{postData.title || "Live Stream"}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Step3({ onBack, postData }: { onBack: () => void; postData: any }) {
    const [isScheduling, setIsScheduling] = useState(!!postData.scheduleDate);
    const [scheduleDate, setScheduleDate] = useState<Date | undefined>(postData.scheduleDate);
    const [scheduleTime, setScheduleTime] = useState('12:00');
    const [isPublishing, setIsPublishing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    
    useEffect(() => {
        setScheduleDate(postData.scheduleDate);
        setIsScheduling(!!postData.scheduleDate);
    }, [postData.scheduleDate]);

    const uploadFile = async (file: File, path: string) => {
        const fileRef = storageRef(storage, path);
        await uploadBytes(fileRef, file);
        return getDownloadURL(fileRef);
    };

    const handleSubmit = async () => {
        setIsPublishing(true);
        setError(null);
        const user = auth.currentUser;
        if (!user) { alert("You must be logged in to post."); setIsPublishing(false); return; }

        try {
            let finalThumbnailUrl: string | null = null;
            let finalMediaUrl: string | null = null;
            let finalRawMediaUrl: string | null = null;
            let storagePath: string | null = null; // ARCHITECTURAL FIX: Variable to hold the exact storage path

            if (postData.thumbnailFile && postData.thumbnailUrl?.startsWith('blob:')) {
                // Storing thumbnails in a separate, dedicated path
                const thumbPath = `thumbnails/${user.uid}/thumb_${Date.now()}.jpg`;
                finalThumbnailUrl = await uploadFile(postData.thumbnailFile, thumbPath);
            }

            if (postData.files && postData.files.length > 0) {
                const file = postData.files[0];
                const collectionName = postData.postType === 'flash' ? 'flashes' : 'posts';
                const mediaPath = `${collectionName}/${user.uid}/${Date.now()}_${file.name}`;
                storagePath = mediaPath; // ARCHITECTURAL FIX: Save the exact path for later lookup
                
                const uploadedUrl = await uploadFile(file, mediaPath);
                
                if (postData.isVideo) {
                    finalMediaUrl = uploadedUrl;
                    finalRawMediaUrl = uploadedUrl;
                } else {
                    finalMediaUrl = uploadedUrl;
                }
            }
            
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (!userDocSnap.exists()) throw new Error("User profile not found!");
            const userData = userDocSnap.data();

            const creatorType = userData.creatorType || '';
            const mainCategory = creatorCategoryMap[creatorType] || null;

            let createdAt, expiresAt;
            if (postData.postType === 'flash' && scheduleDate) {
                const flashDate = new Date(scheduleDate);
                flashDate.setHours(0, 0, 0, 0); 
                createdAt = Timestamp.fromDate(flashDate);
                expiresAt = new Date(flashDate.getTime() + 24 * 60 * 60 * 1000);
            } else if (postData.postType === 'flash') {
                createdAt = serverTimestamp();
                expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
            } else {
                createdAt = serverTimestamp();
            }

            let publishAt;
            if (isScheduling && scheduleDate && postData.postType !== 'live' && postData.postType !== 'flash') {
                const [hours, minutes] = scheduleTime.split(':');
                const finalDate = new Date(scheduleDate);
                finalDate.setHours(parseInt(hours, 10));
                finalDate.setMinutes(parseInt(minutes, 10));
                publishAt = Timestamp.fromDate(finalDate);
            } else {
                publishAt = createdAt;
            }

            const livekitRoomName = postData.postType === 'live' ? `${user.uid}-${Date.now()}` : null;
            const collectionName = postData.postType === 'flash' ? 'flashes' : 'posts';
            const hashtags = (postData.hashtags || "").split(/[\s,]+/).map((h:string) => h.replace('#', '')).filter(Boolean);

            const dataToSave: any = {
                userId: user.uid,
                displayName: userData.name || user.displayName,
                username: userData.username,
                avatar_url: userData.avatar_url || null,
                type: postData.postType,
                content: postData.content || postData.caption || postData.question || postData.title || "",
                hashtags: hashtags,
                createdAt: createdAt,
                publishAt: publishAt, 
                location: postData.location || null,
                mood: postData.mood || null,
                viewCount: 0,
                creatorType: creatorType,
                category: mainCategory,
                processingComplete: !postData.isVideo,
                videoQualities: {},
                
                ...(postData.postType === 'text' && { 
                    backgroundColor: postData.backgroundColor || null, 
                    fontStyle: postData.fontStyle || 'font-body' 
                }),
                ...(postData.postType === 'media' && {
                    mediaUrl: finalMediaUrl,
                    rawMediaUrl: finalRawMediaUrl,
                    thumbnailUrl: finalThumbnailUrl,
                    storagePath: storagePath, // ARCHITECTURAL FIX: Storing the path
                    title: postData.title || "",
                    description: postData.description || "",
                    isFlow: postData.isFlow || false,
                    isVideo: postData.isVideo || false,
                    videoDuration: postData.videoDuration || null,
                    isPortrait: postData.isPortrait || false,
                }),
                ...(postData.postType === 'flash' && { 
                    mediaUrl: finalMediaUrl, 
                    rawMediaUrl: finalRawMediaUrl,
                    thumbnailUrl: finalThumbnailUrl,
                    storagePath: storagePath, // ARCHITECTURAL FIX: Storing the path
                    song: postData.song || null, 
                    expiresAt: expiresAt,
                    caption: postData.caption || "" 
                }),
                ...(postData.postType === 'poll' && { 
                    question: postData.question,
                    options: postData.options.map((opt:any) => ({ text: opt.text, votes: 0 })),
                    correctAnswerIndex: postData.correctAnswerIndex ?? null,
                 }),
                ...(postData.postType === 'live' && { 
                    livekitRoomName: livekitRoomName, 
                    title: postData.title || "Live Stream", 
                    status: (isScheduling && publishAt > serverTimestamp()) ? 'scheduled' : 'live'
                }),
            };
            
            await addDoc(collection(db, collectionName), dataToSave);
            
            if (postData.postType === 'live' && livekitRoomName) {
                router.push(`/broadcast/${encodeURIComponent(livekitRoomName)}`);
            } else {
                router.push('/vibespace');
            }

        } catch (error: any) {
            console.error("Error publishing post:", error);
            setError(error.message);
        } finally {
            setIsPublishing(false);
        }
    };
    
    const shouldShowScheduling = postData.postType !== 'live';
    const getButtonText = () => {
        if (isPublishing) return 'Publishing...';
        if (isScheduling && scheduleDate) {
            if(postData.postType === 'flash') return 'Schedule Flash';
            return 'Schedule Post';
        }
        return 'Publish Now';
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
             <div className="glass-card p-8">
                <h2 className="text-2xl font-headline text-accent-pink mb-4">Step 3: Publish</h2>
                
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
                            <motion.div initial={{ opacity: 0, height: 'auto' }} animate={{ opacity: 1, height: 'auto' }} className="flex flex-col md:flex-row gap-4 mt-4">
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
                                {postData.postType !== 'flash' && (
                                    <input 
                                        type="time"
                                        value={scheduleTime}
                                        onChange={(e) => setScheduleTime(e.target.value)}
                                        className="input-glass"
                                    />
                                )}
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
                    className="btn-accent" 
                    onClick={handleSubmit}
                    disabled={isPublishing}
                >
                    {getButtonText()} <CheckCircle />
                </button>
            </div>
        </motion.div>
    );
}
