
"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, ShieldOff, Calendar as CalendarIcon, Eye, Radio } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getFirestore, collection, addDoc, serverTimestamp, Timestamp, doc, getDoc } from "firebase/firestore";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, app } from '@/utils/firebaseClient';
import { useRouter } from 'next/navigation';
import { isAbusive } from '@/utils/moderation';
import { deletePostDraft, savePostDraft } from '@/lib/postDrafts';

const db = getFirestore(app);
const storage = getStorage(app);
const MAX_MEDIA_IMAGES = 65;

const creatorCategoryMap: Record<string, string> = {
    'vlogs': 'daily', 'moments': 'daily', 'travel': 'daily', 'self': 'daily',
    'art': 'creative', 'photos': 'creative', 'design': 'creative', 'writing': 'creative',
    'gaming': 'play', 'challenges': 'play', 'comedy': 'play', 'reactions': 'play',
    'tips': 'learn', 'tech': 'learn', 'study': 'learn', 'explainers': 'learn',
    'music': 'culture', 'movies': 'culture', 'trends': 'culture', 'community': 'culture'
};

const uploadFile = async (file: File, path: string) => {
    const fileRef = storageRef(storage, path);
    await uploadBytes(fileRef, file);
    return getDownloadURL(fileRef);
};

function PostPreview({ postData }: { postData: any }) {
    const [editedPreviewUrl, setEditedPreviewUrl] = useState<string | null>(null);
    useEffect(() => {
        if (typeof File === 'undefined' || !(postData?.editedFile instanceof File)) {
            setEditedPreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(postData.editedFile);
        setEditedPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [postData?.editedFile]);

    if (!postData) return null;
    const { postType, content, mediaUrl, thumbnailUrl, fontStyle, backgroundColor } = postData;
    const firstMediaUrl = Array.isArray(mediaUrl) ? mediaUrl[0] : mediaUrl;

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

                {postType === 'draft' && (
                    <div className="space-y-3">
                        <div className="rounded-lg border border-accent-cyan/40 bg-accent-cyan/10 p-3">
                            <p className="text-xs uppercase tracking-[0.2em] text-accent-cyan">Draft Studio</p>
                            <h5 className="mt-2 text-lg font-bold text-white">{postData.draftTitle || 'Untitled draft'}</h5>
                        </div>
                        {editedPreviewUrl && (
                            <div className="overflow-hidden rounded-lg bg-black">
                                {postData.editedIsVideo
                                    ? <video src={editedPreviewUrl} controls className="max-h-96 w-full" />
                                    : <img src={editedPreviewUrl} alt="Edited draft preview" className="max-h-96 w-full object-contain" />}
                            </div>
                        )}
                        <p className="text-xs text-accent-cyan">
                            {postData.editedFile ? `Rendered locally: ${postData.editedFile.name}` : `${postData.draftClips?.length || 0} source items selected. Render an edit to publish it.`}
                        </p>
                        {postData.content && <p className="text-sm text-gray-300">{postData.content}</p>}
                    </div>
                )}
                
                {(postType === 'media' || postType === 'flash') && (thumbnailUrl || firstMediaUrl) && (
                     <>
                        <p className="font-bold text-white pb-2">{postData.content || postData.caption}</p>
                        <div className="mt-2 aspect-video w-full rounded-md overflow-hidden bg-black flex items-center justify-center">
                            {Array.isArray(mediaUrl) && mediaUrl.length > 1 && !postData.isVideo ? (
                                <div className="grid w-full h-full grid-cols-2 gap-1">
                                    {mediaUrl.slice(0, 4).map((url: string, idx: number) => (
                                        <img key={url + idx} src={url} alt={`preview ${idx + 1}`} className="w-full h-full object-cover" />
                                    ))}
                                </div>
                            ) : postData.isVideo && !thumbnailUrl ? (
                                <video src={firstMediaUrl} controls className="w-full h-full object-contain" />
                            ) : (
                                <img src={thumbnailUrl || firstMediaUrl} alt="preview" className="w-full h-full object-cover" />
                            )}
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
                    <>
                         <p className="font-bold text-white pb-2">{postData.content}</p>
                         {postData.thumbnailUrl &&
                            <div className="mt-2 aspect-video w-full rounded-md overflow-hidden bg-black flex items-center justify-center">
                                <img src={postData.thumbnailUrl} alt="preview" className="w-full h-full object-cover" />
                            </div>
                         }
                    </>
                )}
            </div>
        </div>
    );
}

export default function Step3({ onBack, postData }: { onBack: () => void; postData: any }) {
    const [isScheduling, setIsScheduling] = useState(!!postData.scheduleDate);
    const [scheduleDate, setScheduleDate] = useState<Date | undefined>(postData.scheduleDate);
    const [scheduleTime, setScheduleTime] = useState(() => {
        const date = postData.scheduleDate ? new Date(postData.scheduleDate) : null;
        return date && !Number.isNaN(date.getTime())
            ? `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
            : '12:00';
    });
    const [isPublishing, setIsPublishing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const cleanupSavedDraft = async (userId: string) => {
        if (!postData.draftId) return;
        try {
            const failures = await deletePostDraft(userId, postData.draftId);
            if (failures.length) {
                console.error('Published post, but some saved draft media could not be removed:', failures);
            }
        } catch (cleanupError) {
            console.error('Published post, but its saved draft could not be removed:', cleanupError);
        }
    };
    
    useEffect(() => {
        setScheduleDate(postData.scheduleDate);
        setIsScheduling(!!postData.scheduleDate);
        if (postData.scheduleDate) {
            const date = new Date(postData.scheduleDate);
            if (!Number.isNaN(date.getTime())) {
                setScheduleTime(`${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`);
            }
        }
    }, [postData.scheduleDate]);

    const handleSubmit = async (action: 'saveDraft' | 'schedule' | 'publish' = 'publish') => {
        setIsPublishing(true);
        setError(null);
        const user = auth.currentUser;
        if (!user) { alert("You must be logged in to post."); setIsPublishing(false); return; }
        
        if (isAbusive(postData.content) || isAbusive(postData.hashtags) || isAbusive(postData.caption) || isAbusive(postData.description) || isAbusive(postData.question) || isAbusive(postData.overlayText) || isAbusive(postData.draftTitle)){
             setError("Your post contains inappropriate language and cannot be posted.");
             setIsPublishing(false);
             return;
        }

        if (action === 'saveDraft' || action === 'schedule') {
            try {
                if (action === 'schedule' && postData.postType === 'live') {
                    throw new Error('Live streams cannot be scheduled.');
                }

                let publishAt: Date | null = null;
                if (action === 'schedule') {
                    if (!scheduleDate) throw new Error('Please pick a date to schedule.');
                    const [hours, minutes] = scheduleTime.split(':').map(Number);
                    publishAt = new Date(scheduleDate);
                    publishAt.setHours(hours, minutes, 0, 0);
                    if (publishAt.getTime() <= Date.now()) throw new Error('Pick a future date and time.');
                    if (postData.postType === 'media' && !(postData.files || []).length) {
                        throw new Error('Select media before scheduling this post.');
                    }
                    if (postData.postType === 'flash' && !(postData.mediaFiles || []).length) {
                        throw new Error('Select media before scheduling this Flash.');
                    }
                    if (postData.postType === 'text' && !(postData.content || '').trim()) {
                        throw new Error('Add some text before scheduling this post.');
                    }
                    if (postData.postType === 'poll' && (!(postData.question || '').trim() || (postData.options || []).length < 2)) {
                        throw new Error('Add a poll question and at least two options before scheduling.');
                    }
                }

                const result = await savePostDraft(user.uid, postData, {
                    status: action === 'schedule' ? 'scheduled' : 'draft',
                    publishAt,
                });
                if (result.cleanupFailures.length) {
                    setError('Your draft was saved, but some replaced media could not be removed from storage.');
                    setIsPublishing(false);
                    return;
                }
                router.push('/squad?tab=drafts');
                return;
            } catch (error: any) {
                console.error('Could not save cloud draft:', error);
                setError(error instanceof Error ? error.message : 'We could not save this draft. Please try again.');
                setIsPublishing(false);
                return;
            }
        }

        if ((postData.postType === 'media' || postData.postType === 'draft') && !(postData.content || postData.draftTitle || '').trim()) {
            setError("Content is required for media posts.");
            setIsPublishing(false);
            return;
        }

        if (postData.postType === 'draft' && !postData.editedFile) {
            setError("Render your edit before publishing.");
            setIsPublishing(false);
            return;
        }

        try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (!userDocSnap.exists()) throw new Error("User profile not found!");
            const userData = userDocSnap.data();

            const creatorType = userData.creatorType || '';
            const mainCategory = creatorCategoryMap[creatorType] || null;
            const hashtags = (postData.hashtags || "").split(/[\s,]+/).map((h:string) => h.replace('#', '')).filter(Boolean);

            if (postData.postType === 'draft' && postData.editedFile) {
                let finalThumbnailUrl: string | null = null;
                if (postData.editedThumbnailFile) {
                    finalThumbnailUrl = await uploadFile(postData.editedThumbnailFile, `thumbnails/${user.uid}/edited_${Date.now()}.jpg`);
                }
                const mediaPath = `posts/${user.uid}/${Date.now()}_${postData.editedFile.name}`;
                const uploadedUrl = await uploadFile(postData.editedFile, mediaPath);
                const createdAt = serverTimestamp();
                await addDoc(collection(db, 'posts'), {
                    userId: user.uid,
                    displayName: userData.name || user.displayName,
                    username: userData.username,
                    avatar_url: userData.avatar_url || null,
                    type: 'media',
                    content: postData.content || postData.draftTitle || '',
                    hashtags,
                    createdAt,
                    publishAt: createdAt,
                    location: postData.location || null,
                    viewCount: 0,
                    creatorType,
                    category: mainCategory,
                    mediaUrl: postData.editedIsVideo ? uploadedUrl : [uploadedUrl],
                    rawMediaUrl: postData.editedIsVideo ? uploadedUrl : null,
                    thumbnailUrl: finalThumbnailUrl,
                    storagePath: postData.editedIsVideo ? mediaPath : null,
                    description: postData.description || '',
                    isFlow: Boolean(postData.editedIsVideo && postData.aspectRatio === 'portrait' && postData.editedDuration <= 240),
                    isVideo: Boolean(postData.editedIsVideo),
                    videoDuration: postData.editedDuration || null,
                    isPortrait: Boolean(postData.editedIsVideo && postData.aspectRatio === 'portrait'),
                    processingComplete: !postData.editedIsVideo,
                    videoQualities: {},
                    subtitleUrl: null,
                });
                await cleanupSavedDraft(user.uid);
                router.push('/vibespace');
                return;
            }

            if (postData.postType === 'flash') {
                const now = new Date();
                const publishAt = Timestamp.fromDate(now);
                const expiresAt = Timestamp.fromDate(new Date(now.getTime() + 24 * 60 * 60 * 1000));
                
                let finalMediaUrl: string | null = null;

                if (postData.mediaFiles && postData.mediaFiles.length > 0) {
                    const file = postData.mediaFiles[0];
                    const mediaPath = `flashes/${user.uid}/${Date.now()}_${file.name}`;
                    finalMediaUrl = await uploadFile(file, mediaPath);
                }

                if (!finalMediaUrl) {
                    throw new Error("Media is missing for the Flash post. Please go back and re-select your media.");
                }

                const flashData = {
                    userId: user.uid,
                    displayName: userData.name || user.displayName,
                    username: userData.username,
                    avatar_url: userData.avatar_url || null,
                    type: 'flash',
                    caption: postData.caption || "",
                    content: postData.caption || "",
                    hashtags,
                    createdAt: serverTimestamp(),
                    publishAt,
                    expiresAt,
                    location: postData.location || null,
                    mediaUrl: finalMediaUrl,
                    song: postData.song || null,
                    viewCount: 0,
                    creatorType,
                    category: mainCategory,
                };

                await addDoc(collection(db, 'flashes'), flashData);
                await cleanupSavedDraft(user.uid);
                router.push('/vibespace');
                return; 
            }

            // --- Existing logic for all other post types (media, text, poll, live) ---
            let finalThumbnailUrl: string | null = null;
            let finalMediaUrl: string | string[] | null = null;
            let finalRawMediaUrl: string | null = null;
            let finalSubtitleUrl: string | null = null;
            let storagePath: string | null = null;

            if (postData.thumbnailFile) {
                const thumbPath = `thumbnails/${user.uid}/thumb_${Date.now()}.jpg`;
                finalThumbnailUrl = await uploadFile(postData.thumbnailFile, thumbPath);
            }

            if (postData.files && postData.files.length > 0) {
                if (postData.isVideo) {
                    const file = postData.files[0];
                    const mediaPath = `posts/${user.uid}/${Date.now()}_${file.name}`;
                    storagePath = mediaPath;
                    const uploadedUrl = await uploadFile(file, mediaPath);
                    finalMediaUrl = uploadedUrl;
                    finalRawMediaUrl = uploadedUrl;
                    if (postData.subtitleFile) {
                        const subtitlePath = `posts/${user.uid}/subtitles/${Date.now()}_${postData.subtitleFile.name}`;
                        finalSubtitleUrl = await uploadFile(postData.subtitleFile, subtitlePath);
                    }
                } else {
                    if (postData.files.length > MAX_MEDIA_IMAGES) {
                        throw new Error(`Media posts can include up to ${MAX_MEDIA_IMAGES} images.`);
                    }
                    const uploads = await Promise.all(postData.files.map((file: File, index: number) => {
                        const mediaPath = `posts/${user.uid}/${Date.now()}_${index}_${file.name}`;
                        return uploadFile(file, mediaPath);
                    }));
                    finalMediaUrl = uploads;
                }
            }
            
            const createdAt = serverTimestamp();
            const publishAt = createdAt;

            const livekitRoomName = postData.postType === 'live' ? `${user.uid}-${Date.now()}` : null;
            const collectionName = 'posts';

            const dataToSave: any = {
                userId: user.uid,
                displayName: userData.name || user.displayName,
                username: userData.username,
                avatar_url: userData.avatar_url || null,
                type: postData.postType,
                content: postData.content || postData.question || "",
                hashtags: hashtags,
                createdAt: createdAt,
                publishAt: publishAt, 
                location: postData.location || null,
                mood: postData.mood || null,
                viewCount: 0,
                creatorType: creatorType,
                category: mainCategory,
                
                ...(postData.postType === 'text' && { 
                    backgroundColor: postData.backgroundColor || null, 
                    fontStyle: postData.fontStyle || 'font-body' 
                }),
                ...(postData.postType === 'media' && {
                    mediaUrl: finalMediaUrl,
                    rawMediaUrl: finalRawMediaUrl,
                    thumbnailUrl: finalThumbnailUrl,
                    storagePath: storagePath,
                    description: postData.description || "",
                    isFlow: postData.isFlow || false,
                    isVideo: postData.isVideo || false,
                    videoDuration: postData.videoDuration || null,
                    isPortrait: postData.isPortrait || false,
                    processingComplete: !postData.isVideo,
                    videoQualities: {},
                    subtitleUrl: finalSubtitleUrl,
                }),
                ...(postData.postType === 'poll' && { 
                    question: postData.question,
                    options: postData.options.map((opt:any) => ({ text: opt.text, votes: 0 })),
                    correctAnswerIndex: postData.correctAnswerIndex ?? null,
                 }),
                ...(postData.postType === 'live' && { 
                    livekitRoomName: livekitRoomName, 
                    thumbnailUrl: finalThumbnailUrl,
                    liveStatus: 'live'
                }),
            };
            
            await addDoc(collection(db, collectionName), dataToSave);
            await cleanupSavedDraft(user.uid);
            
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
        if (postData.postType === 'live') return 'Go Live';
        if (isScheduling) {
            if (!scheduleDate) return 'Pick a schedule date';
            return postData.postType === 'flash' ? 'Schedule Flash' : 'Schedule Post';
        }
        if (postData.postType === 'draft') return postData.editedFile ? 'Publish Edited Post' : 'Render an edit first';
        return 'Publish Now';
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
             <div className="glass-card p-8">
                <h2 className="text-2xl font-headline text-accent-pink mb-4">Step 3: Publish</h2>
                
                <PostPreview postData={postData} />

                <p className="text-gray-400 mb-6 text-sm">
                    {postData.postType === 'draft'
                        ? 'Save this editing project privately in your cloud drafts, or render and publish it.'
                        : "Save a private cloud draft, publish now, or schedule it for manual publishing later."}
                </p>
                 
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
                                        selected={scheduleDate}
                                        onSelect={setScheduleDate}
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
                        <p className="mt-2 text-xs text-gray-400">
                            Scheduled posts stay private and do not publish automatically. Open the item from Squad to edit it and publish manually.
                        </p>
                    </div>
                )}

            </div>
             <div className="flex justify-between mt-8">
                <button className="btn-glass flex items-center gap-2" onClick={onBack} disabled={isPublishing}>
                    <ArrowLeft /> Back
                </button>
                <div className="flex flex-wrap justify-end gap-2">
                    <button className="btn-glass" onClick={() => void handleSubmit('saveDraft')} disabled={isPublishing}>
                            Save Draft
                    </button>
                    <button
                        className={`btn-accent ${postData.postType === 'live' ? 'bg-red-600 hover:bg-red-700' : ''}`}
                        onClick={() => void handleSubmit(isScheduling ? 'schedule' : 'publish')}
                        disabled={
                            isPublishing ||
                            (postData.postType === 'draft' && !postData.editedFile && !isScheduling) ||
                            (postData.postType === 'live' && (!postData.content || !postData.thumbnailFile)) ||
                            (postData.postType === 'media' && !(postData.content || '').trim())
                        }
                    >
                        {getButtonText()} {postData.postType === 'live' ? <Radio /> :<CheckCircle />}
                    </button>
                    {isScheduling && postData.draftId && (
                        <button className="btn-glass" onClick={() => void handleSubmit('publish')} disabled={isPublishing}>
                            Publish Now
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
