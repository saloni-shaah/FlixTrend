
"use client";
import React, { createContext, useState, useContext, ReactNode, useEffect, useRef } from 'react';
import { getFirestore, doc, onSnapshot, setDoc, serverTimestamp, Unsubscribe, updateDoc } from 'firebase/firestore';
import { auth, app } from './firebaseClient';
import { CallScreen } from '@/components/CallScreen';
import { requestForToken } from './firebaseMessaging';

const db = getFirestore(app);

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
  closeCall: () => void;
  pc: RTCPeerConnection | null;
  activeSong: Song | null;
  isPlaying: boolean;
  playSong: (song: Song, queue?: Song[], index?: number) => void;
  pauseSong: () => void;
  toggleSong: () => void;
  playNext: () => void;
  playPrevious: () => void;
  audioPlayer: HTMLAudioElement | null;
}

const AppStateContext = createContext<AppState | undefined>(undefined);

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [isCalling, setIsCalling] = useState(false);
  const [callTarget, setCallTarget] = useState<any | null>(null);
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [pc, setPc] = useState<RTCPeerConnection | null>(null);
  
  const [activeSong, setActiveSong] = useState<Song | null>(null);
  const [songQueue, setSongQueue] = useState<Song[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Effect for handling user presence and push notifications
  useEffect(() => {
    let callUnsubscribe: Unsubscribe | null = null;
    let callDocUnsubscribe: Unsubscribe | null = null;
    let peerConnection: RTCPeerConnection | null = null;

    const handleToken = async (user: any) => {
        try {
            const token = await requestForToken();
            if (token && user) {
                const userDocRef = doc(db, 'users', user.uid);
                await setDoc(userDocRef, { fcmToken: token }, { merge: true });
            }
        } catch (error) {
            console.error('Error getting FCM token:', error);
        }
    };
    
    const managePresence = (user: any) => {
        if (!user) return;
        const userDocRef = doc(db, 'users', user.uid);

        const onlineData = { status: 'online', lastSeen: serverTimestamp() };
        const offlineData = { status: 'offline', lastSeen: serverTimestamp() };
        
        updateDoc(userDocRef, onlineData);

        const onVisibilityChange = () => {
             if (document.visibilityState === 'hidden') {
                updateDoc(userDocRef, offlineData);
            } else {
                updateDoc(userDocRef, onlineData);
            }
        }
        
        window.addEventListener('visibilitychange', onVisibilityChange);
        window.addEventListener('beforeunload', () => updateDoc(userDocRef, offlineData));

        return () => {
             window.removeEventListener('visibilitychange', onVisibilityChange);
        }
    }

    const authUnsubscribe = auth.onAuthStateChanged(user => {
      if (callUnsubscribe) callUnsubscribe();
      if (callDocUnsubscribe) callDocUnsubscribe();
      
      if (user) {
        handleToken(user);
        managePresence(user);
        
        const userDocRef = doc(db, 'users', user.uid);
        callUnsubscribe = onSnapshot(userDocRef, (snap) => {
          const data = snap.data();
          const currentCallId = data?.currentCallId;
          
          if (callDocUnsubscribe) callDocUnsubscribe();
          if(peerConnection) peerConnection.close();

          if (currentCallId) {
            peerConnection = new RTCPeerConnection(servers);
            setPc(peerConnection);
            
            const callDocRef = doc(db, 'calls', currentCallId);
            callDocUnsubscribe = onSnapshot(callDocRef, (callSnap) => {
              if (callSnap.exists()) {
                setActiveCall({ id: callSnap.id, ...callSnap.data() });
              } else {
                setActiveCall(null);
                if (peerConnection) peerConnection.close();
                setPc(null);
              }
            });
          } else {
            setActiveCall(null);
            if (peerConnection) peerConnection.close();
            setPc(null);
          }
        });
      } else {
        setActiveCall(null);
        if (peerConnection) peerConnection.close();
        setPc(null);
      }
    });

    return () => {
        authUnsubscribe();
        if (callUnsubscribe) callUnsubscribe();
        if (callDocUnsubscribe) callDocUnsubscribe();
        if(pc) pc.close();
    };
  }, []);
  
  useEffect(() => {
    return () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
    }
  }, []);

  const startSong = (song: Song) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(song.audioUrl);
    audioRef.current = audio;
    audio.play();

    audio.addEventListener('play', () => setIsPlaying(true));
    audio.addEventListener('pause', () => setIsPlaying(false));
    audio.addEventListener('ended', playNext); // Play next song when current one ends

    setActiveSong(song);
    setIsPlaying(true);
  };
  
  const playSong = (song: Song, queue: Song[] = [], index: number = -1) => {
    startSong(song);
    setSongQueue(queue);
    setCurrentSongIndex(index);
  };
  
  const pauseSong = () => {
    if(audioRef.current) {
        audioRef.current.pause();
    }
  };
  
  const toggleSong = () => {
      if (isPlaying) {
          pauseSong();
      } else if(audioRef.current) {
          audioRef.current.play();
      }
  };

  const playNext = () => {
    if (songQueue.length === 0) return;
    const nextIndex = (currentSongIndex + 1) % songQueue.length;
    setCurrentSongIndex(nextIndex);
    startSong(songQueue[nextIndex]);
  };

  const playPrevious = () => {
    if (songQueue.length === 0) return;
    const prevIndex = (currentSongIndex - 1 + songQueue.length) % songQueue.length;
    setCurrentSongIndex(prevIndex);
    startSong(songQueue[prevIndex]);
  };

  const closeCall = () => {
    if(pc) {
      pc.close();
    }
    setPc(null);
    setActiveCall(null);
  };

  const value = {
    isCalling,
    setIsCalling,
    callTarget,
    setCallTarget,
    activeCall,
    closeCall,
    pc,
    activeSong,
    isPlaying,
    playSong,
    pauseSong,
    toggleSong,
    playNext,
    playPrevious,
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
