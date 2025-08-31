"use client";
import React, { createContext, useState, useContext, ReactNode, useEffect, useRef } from 'react';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { auth } from './firebaseClient';
import { CallScreen } from '@/components/CallScreen';

const db = getFirestore();

interface Call {
  id: string;
  [key: string]: any;
}

interface Song {
  id: string;
  audioUrl: string;
  [key: string]: any;
}

interface AppState {
  isCalling: boolean;
  setIsCalling: (isCalling: boolean) => void;
  callTarget: any | null;
  setCallTarget: (target: any | null) => void;
  activeCall: Call | null;
  activeSong: Song | null;
  isPlaying: boolean;
  playSong: (song: Song) => void;
  pauseSong: () => void;
  toggleSong: () => void;
  audioPlayer: HTMLAudioElement | null;
}

const AppStateContext = createContext<AppState | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [isCalling, setIsCalling] = useState(false);
  const [callTarget, setCallTarget] = useState<any | null>(null);
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [activeSong, setActiveSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // This effect listens for incoming calls for the logged-in user
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        return onSnapshot(userDocRef, (snap) => {
          const data = snap.data();
          if (data?.currentCallId) {
            return onSnapshot(doc(db, 'calls', data.currentCallId), (callSnap) => {
              if (callSnap.exists()) {
                const callData = callSnap.data();
                setActiveCall({ id: callSnap.id, ...callData });
                if (!callData.offer) {
                    setActiveCall(null);
                }
              } else {
                setActiveCall(null);
              }
            });
          } else {
            setActiveCall(null);
          }
        });
      } else {
        setActiveCall(null);
      }
    });

    return () => unsubscribe();
  }, []);
  
  // Cleanup audio on component unmount
  useEffect(() => {
    return () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
    }
  }, []);

  const playSong = (song: Song) => {
    if (audioRef.current && activeSong?.id !== song.id) {
        audioRef.current.pause();
        audioRef.current = null;
    }
    
    if (!audioRef.current) {
        const audio = new Audio(song.audioUrl);
        audioRef.current = audio;
        audio.play();

        audio.addEventListener('play', () => setIsPlaying(true));
        audio.addEventListener('pause', () => setIsPlaying(false));
        audio.addEventListener('ended', () => {
            setActiveSong(null);
            setIsPlaying(false);
        });
    } else {
        audioRef.current.play();
    }
    setActiveSong(song);
    setIsPlaying(true);
  };
  
  const pauseSong = () => {
    if(audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
    }
  };
  
  const toggleSong = () => {
      if (isPlaying) {
          pauseSong();
      } else if(audioRef.current) {
          audioRef.current.play();
          setIsPlaying(true);
      }
  };


  const value = {
    isCalling,
    setIsCalling,
    callTarget,
    setCallTarget,
    activeCall,
    activeSong,
    isPlaying,
    playSong,
    pauseSong,
    toggleSong,
    audioPlayer: audioRef.current,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
      {activeCall && <CallScreen call={activeCall} />}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}
