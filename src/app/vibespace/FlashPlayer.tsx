'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, Volume2, VolumeX, Play, Music, Eye } from 'lucide-react';
import { auth, app } from '@/utils/firebaseClient';
import { getFirestore, addDoc, collection, serverTimestamp, doc, updateDoc, increment, getDocs, query, where, documentId } from 'firebase/firestore';
import Image from 'next/image';
import { motion } from 'framer-motion';

const db = getFirestore(app);

const getChatId = (uid1: string, uid2: string) => [uid1, uid2].sort().join("_");

function FlashInteraction({ flash, currentUser, onClose }: { flash: any; currentUser: any; onClose: () => void }) {
    const [message, setMessage] = useState('');
    const emojis = ['❤️', '😂', '😮', '😢', '🔥', '👍'];

    const handleSend = async (text: string) => {
        if (!text.trim() || !currentUser || !flash) return;
        const chatId = getChatId(currentUser.uid, flash.userId);
        await addDoc(collection(db, "chats", chatId, "messages"), {
            text: text,
            sender: currentUser.uid,
            createdAt: serverTimestamp(),
            type: 'flash_reply',
            readBy: [currentUser.uid],
            flash_preview: { mediaUrl: flash.mediaUrl, caption: flash.caption || '' }
        });
        onClose(); 
    };

    return (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent z-40" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2">
                <input 
                    type="text"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Send a message..."
                    className="input-glass flex-1 text-sm bg-black/50 border-white/20 focus:ring-accent-cyan"
                    onKeyDown={(e) => { if (e.key === 'Enter' && message.trim()) { e.preventDefault(); handleSend(message); } }}
                     onFocus={() => (window as any).isTyping = true}
                     onBlur={() => (window as any).isTyping = false}
                />
                <button onClick={() => handleSend(message)} disabled={!message.trim()} className="p-3 rounded-full bg-accent-cyan text-black disabled:bg-gray-600"><Send size={16} /></button>
            </div>
            <div className="flex gap-2 justify-around items-center pt-3 px-2">
                {emojis.map(emoji => (
                    <motion.button key={emoji} className="text-2xl hover:scale-125 transition-transform" onClick={() => handleSend(emoji)} whileTap={{ scale: 0.9 }}>{emoji}</motion.button>
                ))}
            </div>
        </div>
    );
}

const ProgressBar = ({ progress, active }: { progress: number; active: boolean }) => (
    <div className={`w-full bg-gray-500/50 h-1 rounded-full ${!active && 'bg-gray-500/20'}`}>
        <div className="h-1 bg-white rounded-full" style={{ width: `${progress}%` }} />
    </div>
);

const HexAvatar = ({ src }: { src: string }) => (
    <div style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} className="w-10 h-10 bg-black/50 shrink-0">
        <Image src={src} alt="avatar" width={40} height={40} className="w-full h-full object-cover" unoptimized />
    </div>
);

export default function FlashPlayer({ usersWithFlashes, onClose, initialUserIndex = 0 }: { usersWithFlashes: any[], onClose: () => void, initialUserIndex: number }) {
    const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex);
    const [currentFlashIndex, setCurrentFlashIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [viewers, setViewers] = useState<any[]>([]);
    const [showViewers, setShowViewers] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const preloadedVideosRef = useRef<HTMLVideoElement[]>([]);
    const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isHoldingRef = useRef(false);
    const startTimeRef = useRef<number | undefined>(undefined);
    const elapsedBeforePauseRef = useRef(0);
    const isMutedRef = useRef(isMuted);

    const currentUserFlashes = usersWithFlashes[currentUserIndex]?.flashes || [];
    const currentFlash = currentUserFlashes[currentFlashIndex];
    const currentUser = auth.currentUser;
    const isOwnFlash = currentUser?.uid === usersWithFlashes[currentUserIndex]?.id;

    const urlString = currentFlash?.mediaUrl;
    let isVideo = false;
    if (urlString) {
        try {
            const path = new URL(urlString).pathname;
            isVideo = path.endsWith('.mp4') || path.endsWith('.webm');
        } catch (e) {
            console.error("Invalid URL for media:", urlString);
            isVideo = urlString.includes('.mp4') || urlString.includes('.webm');
        }
    }

    const isVideoRef = useRef(isVideo);
    useEffect(() => { isVideoRef.current = isVideo; }, [isVideo]);
    useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

    const stopCurrentAudio = useCallback(() => {
        if (!audioRef.current) return;
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
        audioRef.current = null;
    }, []);

    const closePlayer = useCallback(() => {
        stopCurrentAudio();
        onClose();
    }, [onClose, stopCurrentAudio]);

    useEffect(() => {
        if (!currentFlash || !currentUser || isOwnFlash || !currentFlash.id) {
            return;
        }
        const flashRef = doc(db, 'flashes', currentFlash.id);
        if (currentFlash.viewedBy && currentFlash.viewedBy[currentUser.uid]) {
            return;
        }
        updateDoc(flashRef, {
            viewCount: increment(1),
            [`viewedBy.${currentUser.uid}`]: true
        }).catch(err => {
            console.error("Error updating view count:", err);
        });

    }, [currentFlash, currentUser, isOwnFlash]);

    const goToNextFlash = useCallback(() => {
        if (isHoldingRef.current) return;
        if (currentFlashIndex < currentUserFlashes.length - 1) {
            setCurrentFlashIndex(prev => prev + 1);
        } else if (currentUserIndex < usersWithFlashes.length - 1) {
            setCurrentUserIndex(prev => prev + 1);
            setCurrentFlashIndex(0);
        } else {
            closePlayer();
        }
    }, [currentFlashIndex, currentUserFlashes.length, currentUserIndex, usersWithFlashes.length, closePlayer]);

    const goToPrevFlash = useCallback(() => {
        if (isHoldingRef.current) return;
        if (currentFlashIndex > 0) {
            setCurrentFlashIndex(prev => prev - 1);
        } else if (currentUserIndex > 0) {
            const prevUserIndex = currentUserIndex - 1;
            setCurrentUserIndex(prevUserIndex);
            setCurrentFlashIndex(usersWithFlashes[prevUserIndex].flashes.length - 1);
        }
    }, [currentFlashIndex, currentUserIndex, usersWithFlashes]);
    
    useEffect(() => {
        setIsLoading(true);
        startTimeRef.current = undefined;
        elapsedBeforePauseRef.current = 0;
        setViewers([]);
        setProgress(0);
    }, [currentFlash]);
    
    useEffect(() => {
        preloadedVideosRef.current.forEach(v => {
            v.src = '';
            v.remove();
        });
        preloadedVideosRef.current = [];
        
        const nextFlashes: any[] = [];
        if (currentFlashIndex + 1 < currentUserFlashes.length) {
            nextFlashes.push(currentUserFlashes[currentFlashIndex + 1]);
        }
        if (currentUserIndex + 1 < usersWithFlashes.length) {
            nextFlashes.push(usersWithFlashes[currentUserIndex + 1]?.flashes?.[0]);
        }

        nextFlashes.filter(Boolean).forEach(flash => {
            if (!flash.mediaUrl) return;
            let isPreloadVideo = false;
            try {
                const path = new URL(flash.mediaUrl).pathname;
                isPreloadVideo = path.endsWith('.mp4') || path.endsWith('.webm');
            } catch (e) {
                isPreloadVideo = flash.mediaUrl.includes('.mp4') || flash.mediaUrl.includes('.webm');
            }

            if (isPreloadVideo) {
                const v = document.createElement('video');
                v.src = flash.mediaUrl;
                v.preload = 'auto';
                preloadedVideosRef.current.push(v);
            } else {
                const img = new window.Image();
                img.src = flash.mediaUrl;
            }
        });
    }, [currentFlashIndex, currentUserIndex, currentUserFlashes, usersWithFlashes]);

    useEffect(() => {
        stopCurrentAudio();
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

        if (currentFlash?.song?.preview_url) {
            const audio = new Audio(currentFlash.song.preview_url);
            const snippetEnd = currentFlash.song.snippetEnd;
            audio.volume = isVideoRef.current ? 0.2 : 1.0;
            audio.muted = isMutedRef.current;
            audio.loop = false;
            audio.currentTime = currentFlash.song.snippetStart || 0;
            audio.addEventListener('timeupdate', () => {
                if (snippetEnd && audio.currentTime >= snippetEnd) {
                    audio.pause();
                }
            });
            if (!isPaused) {
                audio.play().catch(() => {});
            }
            audioRef.current = audio;
        }
        return () => stopCurrentAudio();
    }, [currentFlash, stopCurrentAudio]);

    useEffect(() => {
        if (audioRef.current) audioRef.current.muted = isMuted;
        if (videoRef.current) videoRef.current.muted = isMuted;
    }, [isMuted]);

    useEffect(() => {
        if (isPaused) {
            if (startTimeRef.current !== undefined && !isVideo) {
                elapsedBeforePauseRef.current += performance.now() - startTimeRef.current;
                startTimeRef.current = undefined;
            }
            videoRef.current?.pause();
            audioRef.current?.pause();
        } else if (!isLoading) {
            videoRef.current?.play().catch(() => {});
            audioRef.current?.play().catch(() => {});
        }
    }, [isPaused, isLoading, isVideo]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((window as any).isTyping) return;
            if (e.key === 'ArrowRight') goToNextFlash();
            else if (e.key === 'ArrowLeft') goToPrevFlash();
            else if (e.key === 'Escape') closePlayer();
            else if (e.key === ' ') { e.preventDefault(); setIsPaused(p => !p); }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [goToNextFlash, goToPrevFlash, closePlayer]);

    useEffect(() => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        startTimeRef.current = undefined;

        if (!isVideo && !isPaused && !isLoading) {
            const DURATION = (currentFlash.song?.snippetEnd && currentFlash.song?.snippetStart) 
                ? (currentFlash.song.snippetEnd - currentFlash.song.snippetStart) * 1000
                : 15000;
            
            const animate = (timestamp: number) => {
                if (startTimeRef.current === undefined) startTimeRef.current = timestamp;
                const elapsed = (timestamp - startTimeRef.current) + elapsedBeforePauseRef.current;
                const newProgress = Math.min((elapsed / DURATION) * 100, 100);
                setProgress(newProgress);
                if (elapsed < DURATION) {
                    animationFrameRef.current = requestAnimationFrame(animate);
                } else {
                    goToNextFlash();
                }
            };
            animationFrameRef.current = requestAnimationFrame(animate);
        }

        return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
    }, [isVideo, isPaused, isLoading, goToNextFlash, currentFlash]);

    const handleMediaLoad = () => setIsLoading(false);
    const handleTimeUpdate = () => {
        if (videoRef.current && videoRef.current.duration) {
            setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
        }
    };
    
    const handlePressStart = () => {
        isHoldingRef.current = false;
        holdTimerRef.current = setTimeout(() => {
            isHoldingRef.current = true;
            setIsPaused(true);
        }, 150);
    };

    const handlePressEnd = () => {
        if (holdTimerRef.current) {
            clearTimeout(holdTimerRef.current);
            holdTimerRef.current = null;
        }
        if (isHoldingRef.current) {
            isHoldingRef.current = false;
            setIsPaused(false);
        }
    };

    const fetchViewers = async () => {
        if (!currentFlash || !currentFlash.viewedBy) return;
        const viewerIds = Object.keys(currentFlash.viewedBy);
        if (viewerIds.length === 0) return;

        const usersRef = collection(db, "users");
        const chunks: string[][] = [];
        for (let i = 0; i < viewerIds.length; i += 30) {
            chunks.push(viewerIds.slice(i, i + 30));
        }

        try {
            const results = await Promise.all(
                chunks.map(chunk => getDocs(query(usersRef, where(documentId(), "in", chunk))))
            );
            const viewersData = results.flatMap(snap => snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setViewers(viewersData);
        } catch (error) {
            console.error("Error fetching viewers:", error);
        }
    };

    const handleDragEnd = (event: any, info: any) => {
        if (info.offset.y > 100 && info.velocity.y > 20 && isOwnFlash) {
            if (viewers.length === 0) fetchViewers();
            setShowViewers(true);
            setIsPaused(true);
        }
    };
    
    const captionBottomClass = () => {
        const hasHashtags = currentFlash?.hashtags?.length > 0;
        if (isOwnFlash) {
            return hasHashtags ? 'bottom-24' : 'bottom-16';
        } else {
            return hasHashtags ? 'bottom-40' : 'bottom-32';
        }
    }

    if (!currentFlash) return null;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center" onClick={(e) => { if(e.target === e.currentTarget) closePlayer(); }}>

            <motion.div 
                className="relative w-full max-w-sm h-[95vh] max-h-[800px] bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl"
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.1}
                dragMomentum={false}
                onDragEnd={handleDragEnd}
            >
                <div className="absolute inset-0 w-full h-full scale-110 blur-2xl opacity-50">
                     {isVideo ? <div className="w-full h-full bg-black" /> : <Image src={currentFlash.mediaUrl} alt="background" fill style={{ objectFit: 'cover' }} unoptimized />}
                </div>

                <div className="relative w-full h-full flex items-center justify-center">
                    {isLoading && <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div></div>}
                    {isPaused && !isLoading && <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-20"><Play size={48} className="text-white/80" /></div>}

                    {isVideo && (
                        <video
                            ref={videoRef}
                            src={currentFlash.mediaUrl}
                            className="relative z-10 w-full h-full object-contain"
                             onCanPlay={() => {
                                if (isLoading) { // only act on first canplay
                                    handleMediaLoad();
                                    if (!isPaused && !isHoldingRef.current) videoRef.current?.play().catch(() => {});
                                }
                            }}
                            onTimeUpdate={handleTimeUpdate}
                            onEnded={() => { if (!isHoldingRef.current) goToNextFlash(); }}
                            onError={() => setIsLoading(false)}
                            autoPlay
                            playsInline
                            muted={isMuted}
                            preload="auto"
                        />
                    )}
                    {!isVideo && currentFlash && (
                        <Image
                            src={currentFlash.mediaUrl}
                            alt="flash content"
                            fill
                            style={{ objectFit: 'contain' }}
                            className="relative z-10"
                            onLoad={handleMediaLoad}
                            onError={() => setIsLoading(false)}
                            unoptimized
                            priority
                        />
                    )}
                </div>

                <div className="absolute top-0 left-0 right-0 p-3 z-40 bg-gradient-to-b from-black/50 to-transparent">
                    <div className="flex items-center gap-2 mb-3">
                       {currentUserFlashes.map((_: any, index: number) => <ProgressBar key={index} progress={index === currentFlashIndex ? progress : (index < currentFlashIndex ? 100 : 0)} active={index === currentFlashIndex}/>)}
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <HexAvatar src={currentFlash?.avatar_url || usersWithFlashes[currentUserIndex]?.avatar_url || '/default-avatar.png'} />
                            <div className="flex flex-col overflow-hidden">
                                 <div className="flex items-center gap-2">
                                     <span className="font-bold text-white text-shadow truncate">
                                        {isOwnFlash ? 'You' : (currentFlash?.displayName || usersWithFlashes[currentUserIndex]?.displayName || usersWithFlashes[currentUserIndex]?.name || 'User')}
                                    </span>
                                     {currentFlash?.location && (
                                        <span className="text-xs bg-white/20 text-white rounded-full px-2 py-0.5 shrink-0">{currentFlash?.location}</span>
                                    )}
                                </div>
                                {currentFlash?.song && (
                                    <div className="flex items-center gap-2 text-xs text-white/80 text-shadow pt-0.5 whitespace-nowrap">
                                        {currentFlash.song.albumArt ? <Image src={currentFlash.song.albumArt} alt={currentFlash.song.name} width={20} height={20} className="rounded shrink-0" unoptimized /> : <Music size={12} />}
                                        <span className="truncate">{currentFlash.song.name} - {currentFlash.song.artists.join(', ')}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                         <div className="flex items-center gap-2 shrink-0">
                            <button onClick={() => setIsMuted(m => !m)} className="text-white">{isMuted ? <VolumeX /> : <Volume2 />}</button>
                            <button onClick={closePlayer} className="text-white"><X /></button>
                        </div>
                    </div>
                </div>

                <div className="absolute inset-0 z-30 flex">
                     <div className="w-1/3 h-full" onClick={goToPrevFlash} onMouseDown={handlePressStart} onMouseUp={handlePressEnd} onTouchStart={handlePressStart} onTouchEnd={handlePressEnd}></div>
                     <div className="w-1/3 h-full" onMouseDown={handlePressStart} onMouseUp={handlePressEnd} onTouchStart={handlePressStart} onTouchEnd={handlePressEnd}></div>
                     <div className="w-1/3 h-full" onClick={goToNextFlash} onMouseDown={handlePressStart} onMouseUp={handlePressEnd} onTouchStart={handlePressStart} onTouchEnd={handlePressEnd}></div>
                </div>

                {currentFlash?.hashtags?.length > 0 && (
                    <div className="absolute bottom-20 left-4 right-4 z-40 flex flex-wrap gap-1 justify-center">
                        {currentFlash.hashtags.map((tag: string) => (
                            <span key={tag} className="text-xs text-accent-cyan/80">#{tag}</span>
                        ))}
                    </div>
                )}

                {currentFlash?.caption && (
                    <p className={`absolute ${captionBottomClass()} left-4 right-4 text-white text-sm text-shadow z-40 text-center`}>
                        {currentFlash.caption}
                    </p>
                )}

                {isOwnFlash && (currentFlash.viewCount > 0 || currentFlash.viewedBy) && (
                     <motion.div 
                        className="absolute bottom-4 left-4 z-40 text-white text-sm flex items-center gap-2 bg-black/40 backdrop-blur-sm p-1.5 rounded-lg"
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        <Eye size={16} />
                        <span>{currentFlash.viewCount ?? Object.keys(currentFlash.viewedBy || {}).length}</span>
                        <span className="text-xs opacity-80">Swipe down to see viewers</span>
                    </motion.div>
                )}


                {!isOwnFlash && <FlashInteraction flash={currentFlash} currentUser={currentUser} onClose={closePlayer} />}

                {isOwnFlash && (
                <motion.div
                    className={`absolute bottom-0 left-0 right-0 h-1/2 bg-black/50 backdrop-blur-md rounded-t-2xl z-50 p-4 overflow-y-auto ${!showViewers ? 'pointer-events-none' : ''}`}
                    variants={{
                        hidden: { y: "100%" },
                        visible: { y: 0 }
                    }}
                    initial="hidden"
                    animate={showViewers ? 'visible' : 'hidden'}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                    <button onClick={() => { setShowViewers(false); setIsPaused(false); }} className="absolute top-2 right-2 text-white"><X /></button>
                    <h3 className="text-lg font-bold text-white mb-4">Viewers</h3>
                    <div className="flex flex-col gap-3">
                        {viewers.length === 0 
                            ? <p className="text-white/50 text-sm text-center mt-4">No viewers yet</p>
                            : viewers.map(viewer => (
                                <div key={viewer.id} className="flex items-center gap-3">
                                    <Image src={viewer.avatar_url || '/default-avatar.png'} alt={viewer.displayName || viewer.name} width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
                                    <span className="text-white">{viewer.displayName || viewer.name}</span>
                                </div>
                            ))
                        }
                    </div>
                </motion.div>
            )}
            </motion.div>
        </motion.div>
    );
}
