'use client';
import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { useRouter } from 'next/navigation';
import { OptimizedVideo } from '@/components/OptimizedVideo';
import { Watermark } from '@/components/video/Watermark';
import { ProgressBar } from '@/components/video/ProgressBar';
import { Play, ExternalLink, Star, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/hooks/useVideoPlayer';
import { getFirestore, doc, writeBatch, arrayUnion, arrayRemove, serverTimestamp } from "firebase/firestore";
import { auth, app } from '@/utils/firebaseClient';
import { useUserLikes } from '@/context/UserLikesContext';

const db = getFirestore(app);

export interface InFeedVideoPlayerHandle {
    /** Seek to a specific second in the video and resume playback. */
    seekTo: (seconds: number) => void;
}

interface InFeedVideoPlayerProps {
    mediaUrls: string[];
    post: any;
}

export const InFeedVideoPlayer = forwardRef<InFeedVideoPlayerHandle, InFeedVideoPlayerProps>(
    ({ mediaUrls, post }, ref) => {
        const router = useRouter();
        const [showLikeAnimation, setShowLikeAnimation] = useState(false);
        const videoUrl = mediaUrls.find((u) => /\.(mp4|webm|ogg)(\?.*)?$/i.test(u));
        const captionsUrl = post?.subtitleUrl || post?.captionsUrl || null;

        const { likedPosts: currentYearLikes, loading: likesLoading } = useUserLikes();
        const [isLiked, setIsLiked] = useState(false);
        const [isLoadingLike, setIsLoadingLike] = useState(true);
        const currentUser = auth.currentUser;

        const postDate = post.createdAt ? new Date(post.createdAt.seconds * 1000) : new Date();
        const postYear = postDate.getFullYear();

        useEffect(() => {
            if (!currentUser || likesLoading) { setIsLoadingLike(true); return; }
            setIsLiked(currentYearLikes.includes(post.id));
            setIsLoadingLike(false);
        }, [post.id, currentUser, currentYearLikes, likesLoading]);

        const {
            videoRef, isPlaying, isMuted, progress, buffered, isVertical,
            togglePlay, toggleMute, handleTap, videoEvents, seek, setIsSeeking,
        } = useVideoPlayer({ postId: post?.id, variant: 'feed' });

        // ─── Expose seekTo via ref ─────────────────────────────────────────
        useImperativeHandle(ref, () => ({
            seekTo: (seconds: number) => {
                const video = videoRef.current;
                if (!video) return;

                // If duration is known, seek directly
                const applySeek = () => {
                    if (video.duration && isFinite(video.duration)) {
                        video.currentTime = Math.min(seconds, video.duration);
                        // Use the hook's seek (percentage-based) as a fallback
                        // but direct currentTime assignment is more accurate
                    } else {
                        // Duration not ready yet — try percentage via hook as best-effort
                        seek(0);
                        video.currentTime = seconds;
                    }
                    // Ensure playback starts after seeking
                    video.play().catch(() => {});
                };

                if (video.readyState >= 1) {
                    applySeek();
                } else {
                    video.addEventListener('loadedmetadata', applySeek, { once: true });
                }
            },
        }), [videoRef, seek]);

        const handleLike = async () => {
            if (!currentUser || isLoadingLike) return;
            const optimisticLike = !isLiked;
            setIsLiked(optimisticLike);
            try {
                const batch = writeBatch(db);
                const postLikeRef = doc(db, "posts", post.id, 'likes', currentUser.uid);
                const yearlyLikesRef = doc(db, 'users', currentUser.uid, 'likedPosts', postYear.toString());
                if (optimisticLike) {
                    batch.set(postLikeRef, { userId: currentUser.uid, createdAt: serverTimestamp() });
                    batch.set(yearlyLikesRef, { postIds: arrayUnion(post.id) }, { merge: true });
                } else {
                    batch.delete(postLikeRef);
                    batch.update(yearlyLikesRef, { postIds: arrayRemove(post.id) });
                }
                await batch.commit();
            } catch {
                setIsLiked(!optimisticLike);
            }
        };

        const onSingleTap = () => togglePlay();
        const onDoubleTap = () => {
            if (isLoadingLike || isLiked) return;
            handleLike();
            setShowLikeAnimation(true);
            setTimeout(() => setShowLikeAnimation(false), 1200);
        };

        const handleNavigate = (e: React.MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();
            if (!post?.id) return;
            router.push(post.isFlow ? `/flow/${post.id}` : `/watch?v=${post.id}`);
        };

        if (!videoUrl) return null;

        return (
            <div
                onClick={handleTap(onSingleTap, onDoubleTap)}
                onContextMenu={(e) => e.preventDefault()}
                className="w-full h-[75vh] relative bg-black mt-2 rounded-xl overflow-hidden select-none"
            >
                <OptimizedVideo
                    ref={videoRef}
                    src={videoUrl}
                    className={`w-full h-full ${isVertical ? 'object-cover' : 'object-contain'} transition-transform duration-300 ${isPlaying ? 'scale-[1.01]' : 'scale-100'}`}
                    style={{ pointerEvents: 'none' }}
                    playsInline
                    preload="metadata"
                    muted={isMuted}
                    loop
                    {...videoEvents}
                    controlsList="nodownload"
                >
                    {captionsUrl && (
                        <track kind="subtitles" src={captionsUrl} label="Subtitles" srcLang="en" />
                    )}
                </OptimizedVideo>

                <AnimatePresence>
                    {showLikeAnimation && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                            {[...Array(8)].map((_, i) => (
                                <motion.div
                                    key={`particle-${i}`}
                                    initial={{ opacity: 0, scale: 0.5, rotate: i * 45 }}
                                    animate={{ opacity: [0, 0.8, 0], scale: [0.5, 1, 0], y: [0, -40, -80] }}
                                    transition={{ duration: 0.5, ease: 'easeOut', delay: 0.15 }}
                                    style={{ position: 'absolute' }}
                                >
                                    <div style={{ width: 3, height: 15, backgroundColor: 'white', borderRadius: 2 }} />
                                </motion.div>
                            ))}
                            <motion.div
                                key="shockwave"
                                initial={{ scale: 0, opacity: 1, border: '3px solid white' }}
                                animate={{ scale: 2, opacity: 0, border: '1px solid white' }}
                                transition={{ duration: 0.5, ease: 'easeOut' }}
                                style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%' }}
                            />
                            <motion.div
                                key="star"
                                initial={{ scale: 0, rotate: -90 }}
                                animate={{ scale: [0, 1.4, 1], rotate: [-90, 0, 0] }}
                                transition={{ duration: 0.5, ease: 'easeOut', times: [0, 0.6, 1] }}
                            >
                                <Star fill="#FACC15" stroke="white" strokeWidth={1.5} size={90} />
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <Watermark />

                {!isPlaying && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 pointer-events-none">
                        <Play size={60} className="text-white opacity-80" fill="white" />
                    </div>
                )}

                <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleMute(); }}
                    className="absolute bottom-14 right-4 z-20 bg-black/60 p-3 rounded-full text-white backdrop-blur-md hover:bg-black/80 transition"
                >
                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>

                <div className="absolute inset-x-0 bottom-0 z-10 p-4 bg-gradient-to-t from-black/60 to-transparent">
                    <ProgressBar
                        progress={progress}
                        buffered={buffered}
                        variant="feed"
                        onScrubStart={() => setIsSeeking(true)}
                        onScrubEnd={() => setIsSeeking(false)}
                        onScrub={(pct) => seek(pct)}
                    />
                </div>

                <button
                    onClick={handleNavigate}
                    className="absolute top-2 right-2 z-20 bg-black/60 p-2 rounded-full text-white hover:bg-black/90 transition"
                >
                    <ExternalLink size={18} />
                </button>
            </div>
        );
    }
);

InFeedVideoPlayer.displayName = 'InFeedVideoPlayer';
