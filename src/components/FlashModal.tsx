

"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FlixTrendLogo } from './FlixTrendLogo';
import { X, Send, Smile } from 'lucide-react';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, app } from '@/utils/firebaseClient';
import { useAppState } from '@/utils/AppStateContext';

const db = getFirestore(app);

const Watermark = ({ isAnimated = false }: { isAnimated?: boolean }) => (
    <div
      className={`absolute flex items-center gap-1.5 bg-black/40 text-white py-1 px-2 rounded-full text-xs pointer-events-none z-10 ${
        isAnimated ? 'animate-[float-watermark_10s_ease-in-out_infinite]' : 'bottom-2 right-2'
      }`}
    >
        <FlixTrendLogo size={16} />
        <span className="font-bold">FlixTrend</span>
    </div>
);

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
        // Potentially close the modal or show a "Sent!" confirmation
        onClose(); 
    };

    return (
        <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <input 
                type="text"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Send a message..."
                className="input-glass flex-1 text-sm"
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && message.trim()) {
                        handleSend(message);
                    }
                }}
            />
            <button 
                onClick={() => handleSend(message)}
                disabled={!message.trim()}
                className="p-3 rounded-full bg-accent-cyan text-black disabled:bg-gray-600"
            >
                <Send size={16} />
            </button>
            <div className="flex gap-1">
                {emojis.map(emoji => (
                    <button 
                        key={emoji} 
                        className="text-2xl hover:scale-125 transition-transform"
                        onClick={() => handleSend(emoji)}
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default function FlashModal({ userFlashes, onClose }: { userFlashes: any; onClose: (viewedUserId?: string) => void }) {
  const [currentUserFlashesIndex, setCurrentUserFlashesIndex] = useState(0);
  const [currentFlashIndex, setCurrentFlashIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef(0);
  const { setSelectedChat } = useAppState();
  const currentUser = auth.currentUser;

  const allFlashes = Array.isArray(userFlashes) ? userFlashes : [userFlashes];

  const handleClose = () => {
    onClose(allFlashes[currentUserFlashesIndex]?.userId);
  };

  const goToNext = useCallback(() => {
    const currentUserFlashGroup = allFlashes[currentUserFlashesIndex];
    if (currentFlashIndex < currentUserFlashGroup.flashes.length - 1) {
        setCurrentFlashIndex(i => i + 1);
    } else {
        if (currentUserFlashesIndex < allFlashes.length - 1) {
            setCurrentUserFlashesIndex(i => i + 1);
            setCurrentFlashIndex(0);
        } else {
            handleClose(); // End of all flashes
        }
    }
  }, [allFlashes, currentFlashIndex, currentUserFlashesIndex, handleClose]);

  const goToPrev = useCallback(() => {
    if (currentFlashIndex > 0) {
        setCurrentFlashIndex(i => i - 1);
    } else if (currentUserFlashesIndex > 0) {
        const prevUserIndex = currentUserFlashesIndex - 1;
        setCurrentUserFlashesIndex(prevUserIndex);
        setCurrentFlashIndex(allFlashes[prevUserIndex].flashes.length - 1);
    }
  }, [allFlashes, currentFlashIndex, currentUserFlashesIndex]);

  useEffect(() => {
    const flash = allFlashes[currentUserFlashesIndex]?.flashes[currentFlashIndex];
    if (!flash) return;

    const isVideo = flash.mediaUrl && (flash.mediaUrl.includes('.mp4') || flash.mediaUrl.includes('.webm') || flash.mediaUrl.includes('.ogg'));
    setProgress(0);

    if (timerRef.current) clearTimeout(timerRef.current);
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
    }

    if (flash.song?.preview_url) {
        const audio = new Audio(flash.song.preview_url);
        audioRef.current = audio;
        audio.currentTime = flash.song.snippetStart || 0;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                if (error.name !== 'AbortError') {
                    console.error("Audio play failed", error);
                }
            });
        }
        audio.addEventListener('ended', goToNext);
    }

    if (!isVideo) {
        timerRef.current = setTimeout(goToNext, 15000);
        requestAnimationFrame(() => {
            setProgress(100);
        });
    } else {
        setProgress(0);
    }

    return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.removeEventListener('ended', goToNext);
        }
    };
  }, [currentUserFlashesIndex, currentFlashIndex, allFlashes, goToNext]);
  
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'ArrowRight') goToNext();
          if (e.key === 'ArrowLeft') goToPrev();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev]);

  const handleContainerClick = (e: React.MouseEvent) => {
      const { clientX, currentTarget } = e;
      const { left, width } = currentTarget.getBoundingClientRect();
      const clickPosition = clientX - left;
      if (clickPosition < width / 3) {
          goToPrev();
      } else {
          goToNext();
      }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartX.current;
    if (Math.abs(deltaX) > 50) {
      if (deltaX < 0) goToNext();
      else goToPrev();
    }
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    }
  };
  const handleVideoEnded = () => {
      goToNext();
  };

  const currentFlashUser = allFlashes[currentUserFlashesIndex];
  if (!currentFlashUser) return null;
  const currentFlash = currentFlashUser.flashes[currentFlashIndex];
  if (!currentFlash) return null;

  const isVideo = currentFlash.mediaUrl && (currentFlash.mediaUrl.includes('.mp4') || currentFlash.mediaUrl.includes('.webm') || currentFlash.mediaUrl.includes('.ogg'));
  const duration = isVideo ? (videoRef.current?.duration || 15) : 15;


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="relative w-full max-w-lg h-[90vh] flex flex-col items-center justify-center cursor-pointer" onClick={handleContainerClick}>
        <button onClick={(e) => { e.stopPropagation(); handleClose();}} className="absolute top-2 right-2 text-white text-3xl z-20">&times;</button>
        {/* Progress Bars */}
        <div className="absolute top-4 left-2 right-2 flex gap-1 z-20">
            {currentFlashUser.flashes.map((_:any, idx:number) => (
                <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-white rounded-full"
                        style={{
                            width: `${idx < currentFlashIndex ? 100 : idx === currentFlashIndex ? progress : 0}%`,
                            transition: idx === currentFlashIndex && !isVideo ? `width ${duration}s linear` : 'none',
                        }}
                    />
                </div>
            ))}
        </div>
        
        <div className="w-full h-full relative">
            {isVideo ? (
                <div className="relative w-full h-full">
                    <video
                        ref={videoRef}
                        src={currentFlash.mediaUrl}
                        className="w-full h-full object-contain"
                        autoPlay
                        onTimeUpdate={handleVideoTimeUpdate}
                        onEnded={handleVideoEnded}
                    />
                    <Watermark isAnimated={true} />
                </div>
            ) : (
                <div className="relative w-full h-full">
                    {currentFlash.mediaUrl && <img src={currentFlash.mediaUrl} alt="flash" className="w-full h-full object-contain" />}
                    <Watermark />
                </div>
            )}
        </div>

        {currentFlash.caption && (
          <div className="absolute bottom-20 left-4 right-4 text-white text-center font-semibold p-2 bg-black/50 rounded-lg">
            {currentFlash.caption}
          </div>
        )}

        <FlashInteraction flash={currentFlash} currentUser={currentUser} onClose={handleClose} />
      </div>
    </div>
  );
}
