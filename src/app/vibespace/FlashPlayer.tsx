
"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, Heart, Laugh, ThumbsUp, Volume2, VolumeX, Pause, Play, Music } from 'lucide-react';
import { auth, app } from '@/utils/firebaseClient';
import { getFirestore, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

const db = getFirestore(app);

// EXACT copy of the working FlashInteraction from your FlashModal
function FlashInteraction({ flash, currentUser, onClose }: { flash: any; currentUser: any; onClose: () => void }) {
    const [message, setMessage] = useState('');
    const emojis = ['❤️', '😂', '😮', '😢', '🔥', '👍'];

    const getChatId = (uid1: string, uid2: string) => [uid1, uid2].sort().join("_");

    const handleSend = async (text: string) => {
        if (!text.trim() || !currentUser || !flash) return;
        
        const chatId = getChatId(currentUser.uid, flash.userId);

        await addDoc(collection(db, "chats", chatId, "messages"), {
            text: text,
            sender: currentUser.uid,
            createdAt: serverTimestamp(),
            type: 'flash_reply',
            readBy: [currentUser.uid],
            flash_preview: {
                mediaUrl: flash.mediaUrl,
                caption: flash.caption || '',
            }
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
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && message.trim()) {
                            e.preventDefault();
                            handleSend(message);
                        }
                    }}
                     onFocus={() => (window as any).isTyping = true}
                     onBlur={() => (window as any).isTyping = false}
                />
                <button 
                    onClick={() => handleSend(message)}
                    disabled={!message.trim()}
                    className="p-3 rounded-full bg-accent-cyan text-black disabled:bg-gray-600"
                >
                    <Send size={16} />
                </button>
            </div>
            <div className="flex gap-2 justify-around items-center pt-3 px-2">
                {emojis.map(emoji => (
                    <motion.button 
                        key={emoji} 
                        className="text-2xl hover:scale-125 transition-transform"
                        onClick={() => handleSend(emoji)}
                        whileTap={{ scale: 0.9 }}
                    >
                        {emoji}
                    </motion.button>
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
    const [preloadUrl, setPreloadUrl] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    const currentUserFlashes = usersWithFlashes[currentUserIndex]?.flashes || [];
    const currentFlash = currentUserFlashes[currentFlashIndex];
    const currentUser = auth.currentUser;
    const isOwnFlash = currentUser?.uid === usersWithFlashes[currentUserIndex]?.id;
    const isVideo = currentFlash?.mediaUrl?.includes('.mp4') || currentFlash?.mediaUrl?.includes('.webm');

    const cleanup = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
        }
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        setIsLoading(true);
        setProgress(0);
    }, []);

    const goToNextFlash = useCallback(() => {
        if (currentFlashIndex < currentUserFlashes.length - 1) {
            setCurrentFlashIndex(prev => prev + 1);
        } else if (currentUserIndex < usersWithFlashes.length - 1) {
            setCurrentUserIndex(prev => prev + 1);
            setCurrentFlashIndex(0);
        } else {
            onClose();
        }
    }, [currentFlashIndex, currentUserFlashes.length, currentUserIndex, usersWithFlashes.length, onClose]);

    const goToPrevFlash = useCallback(() => {
        if (currentFlashIndex > 0) {
            setCurrentFlashIndex(prev => prev - 1);
        } else if (currentUserIndex > 0) {
            const prevUserIndex = currentUserIndex - 1;
            setCurrentUserIndex(prevUserIndex);
            setCurrentFlashIndex(usersWithFlashes[prevUserIndex].flashes.length - 1);
        }
    }, [currentFlashIndex, currentUserIndex, usersWithFlashes]);
    
    useEffect(() => {
        const isLastFlash = currentFlashIndex === currentUserFlashes.length - 1;
        const hasNextUser = currentUserIndex < usersWithFlashes.length - 1;
        setPreloadUrl(isLastFlash && hasNextUser ? usersWithFlashes[currentUserIndex + 1]?.flashes?.[0]?.mediaUrl || null : null);
    }, [currentFlashIndex, currentUserIndex, currentUserFlashes, usersWithFlashes]);

    useEffect(() => {
        cleanup();
        if (currentFlash?.song?.preview_url) {
            audioRef.current = new Audio(currentFlash.song.preview_url);
            audioRef.current.muted = isMuted;
            audioRef.current.volume = isVideo ? 0.2 : 1.0;
            if (!isPaused) audioRef.current.play().catch(e => {});
        }
        return () => cleanup();
    }, [currentFlash, isVideo, isPaused, isMuted, cleanup]);

    useEffect(() => {
        if (audioRef.current) audioRef.current.muted = isMuted;
        if (videoRef.current) videoRef.current.muted = isMuted;
    }, [isMuted]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((window as any).isTyping) return;
            if (e.key === 'ArrowRight') goToNextFlash();
            else if (e.key === 'ArrowLeft') goToPrevFlash();
            else if (e.key === 'Escape') onClose();
            else if (e.key === ' ') { e.preventDefault(); setIsPaused(p => !p); }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [goToNextFlash, goToPrevFlash, onClose]);

    useEffect(() => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (!isVideo && !isPaused && !isLoading) {
            const DURATION = 15000;
            let startTime: number;
            const animate = (timestamp: number) => {
                if (startTime === undefined) startTime = timestamp;
                const elapsed = timestamp - startTime;
                const newProgress = Math.min((elapsed / DURATION) * 100, 100);
                setProgress(newProgress);
                if (elapsed < DURATION) animationFrameRef.current = requestAnimationFrame(animate);
                else goToNextFlash();
            };
            animationFrameRef.current = requestAnimationFrame(animate);
        }
        return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
    }, [isVideo, isPaused, isLoading, goToNextFlash]);

    useEffect(() => {
        const video = videoRef.current;
        const audio = audioRef.current;
        if (isPaused) {
            video?.pause();
            audio?.pause();
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        } else if (!isLoading) {
            video?.play().catch(() => {});
            audio?.play().catch(() => {});
        }
    }, [isPaused, isLoading]);

    const handleMediaLoad = () => setIsLoading(false);
    const handleTimeUpdate = () => setProgress(videoRef.current ? (videoRef.current.currentTime / videoRef.current.duration) * 100 : 0);

    if (!currentFlash) return null;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center" onClick={(e) => { if(e.target === e.currentTarget) onClose(); }}>
            {preloadUrl && <link rel="preload" href={preloadUrl} as={preloadUrl.includes('.mp4') ? 'video' : 'image'} />}

            <div className="relative w-full max-w-sm h-[95vh] max-h-[800px] bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0 w-full h-full scale-110 blur-2xl opacity-50">
                     {isVideo ? <video src={currentFlash.mediaUrl} className="w-full h-full object-cover" autoPlay playsInline muted loop /> : <Image src={currentFlash.mediaUrl} alt="background" fill style={{ objectFit: 'cover' }} unoptimized />}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentUserIndex + currentFlashIndex}
                        initial={{ x: 300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -300, opacity: 0 }}
                        transition={{ type: "spring", damping: 20, stiffness: 100 }}
                        className="relative w-full h-full flex items-center justify-center"
                    >
                        {isLoading && <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div></div>}
                        {isPaused && !isLoading && <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-20"><Play size={48} className="text-white/80" /></div>}

                        {isVideo ? (
                            <video ref={videoRef} src={currentFlash.mediaUrl} className="relative z-10 w-full h-full object-contain" onCanPlay={handleMediaLoad} onTimeUpdate={handleTimeUpdate} onEnded={goToNextFlash} autoPlay playsInline muted={isMuted} />
                        ) : (
                            <Image src={currentFlash.mediaUrl} alt="flash content" fill style={{ objectFit: 'contain' }} className="relative z-10" onLoad={handleMediaLoad} unoptimized />
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* OVERLAYS at the top */}
                <div className="absolute top-0 left-0 right-0 p-3 z-40 bg-gradient-to-b from-black/50 to-transparent">
                    <div className="flex items-center gap-2 mb-3">
                       {currentUserFlashes.map((_, index) => <ProgressBar key={index} progress={index === currentFlashIndex ? progress : (index < currentFlashIndex ? 100 : 0)} active={index === currentFlashIndex}/>)}
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <HexAvatar src={usersWithFlashes[currentUserIndex]?.avatar_url || '/default-avatar.png'} />
                            <div className="flex flex-col overflow-hidden">
                                <span className="font-bold text-white text-shadow truncate">{usersWithFlashes[currentUserIndex]?.displayName || usersWithFlashes[currentUserIndex]?.name || 'User'}</span>
                                {currentFlash?.song && (
                                    <div className="text-xs text-white/80 text-shadow flex items-center gap-1.5 pt-0.5 whitespace-nowrap">
                                        <Music size={12} />
                                        <span className="truncate">{currentFlash.song.name} - {currentFlash.song.artists.join(', ')}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                         <div className="flex items-center gap-2 shrink-0">
                            <button onClick={() => setIsMuted(m => !m)} className="text-white">{isMuted ? <VolumeX /> : <Volume2 />}</button>
                            <button onClick={onClose} className="text-white"><X /></button>
                        </div>
                    </div>
                </div>

                <div className="absolute inset-0 z-30 flex">
                    <div className="w-1/3 h-full" onClick={goToPrevFlash} onMouseDown={() => setIsPaused(true)} onMouseUp={() => setIsPaused(false)} onTouchStart={() => setIsPaused(true)} onTouchEnd={() => setIsPaused(false)}></div>
                    <div className="w-1/3 h-full" onMouseDown={() => setIsPaused(true)} onMouseUp={() => setIsPaused(false)} onTouchStart={() => setIsPaused(true)} onTouchEnd={() => setIsPaused(false)}></div>
                    <div className="w-1/3 h-full" onClick={goToNextFlash} onMouseDown={() => setIsPaused(true)} onMouseUp={() => setIsPaused(false)} onTouchStart={() => setIsPaused(true)} onTouchEnd={() => setIsPaused(false)}></div>
                </div>

                {!isOwnFlash && <FlashInteraction flash={currentFlash} currentUser={currentUser} onClose={onClose} />}
            </div>
            <div className="hidden">
                {currentUserFlashes.slice(currentFlashIndex + 1, currentFlashIndex + 3).map((f, i) => f.mediaUrl.includes('.jpg') || f.mediaUrl.includes('.png') ? <img key={i} src={f.mediaUrl} alt=""/> : null)}
            </div>
        </motion.div>
    );
}
