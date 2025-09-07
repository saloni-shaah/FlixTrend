
"use client";
import React, { createContext, useState, useContext, ReactNode, useEffect, useRef } from 'react';
import { getFirestore, doc, onSnapshot, setDoc, serverTimestamp, Unsubscribe } from 'firebase/firestore';
import { auth } from './firebaseClient';
import { CallScreen } from '@/components/CallScreen';
import { requestForToken } from './firebaseMessaging';

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
<<<<<<< HEAD
  closeCall: () => void;
  activeSong: Song | null;
  isPlaying: boolean;
  playSong: (song: Song, queue?: Song[], index?: number) => void;
  pauseSong: () => void;
  toggleSong: () => void;
  playNext: () => void;
  playPrevious: () => void;
=======
  closeCall: () => void; // New function to close the UI
  activeSong: Song | null;
  isPlaying: boolean;
  playSong: (song: Song) => void;
  pauseSong: () => void;
  toggleSong: () => void;
>>>>>>> 41a2162a78298df970810cb54c8ed33fc2c24ecf
  audioPlayer: HTMLAudioElement | null;
}

const AppStateContext = createContext<AppState | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [isCalling, setIsCalling] = useState(false);
  const [callTarget, setCallTarget] = useState<any | null>(null);
  const [activeCall, setActiveCall] = useState<Call | null>(null);
<<<<<<< HEAD
  
  const [activeSong, setActiveSong] = useState<Song | null>(null);
  const [songQueue, setSongQueue] = useState<Song[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(-1);
=======
  const [activeSong, setActiveSong] = useState<Song | null>(null);
>>>>>>> 41a2162a78298df970810cb54c8ed33fc2c24ecf
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Effect for handling push notification setup
  useEffect(() => {
    const handleToken = async (user: any) => {
        try {
            const token = await requestForToken();
            if (token && user) {
                console.log('FCM Token:', token);
<<<<<<< HEAD
=======
                // Save the token to the user's profile in Firestore
>>>>>>> 41a2162a78298df970810cb54c8ed33fc2c24ecf
                const userDocRef = doc(db, 'users', user.uid);
                await setDoc(userDocRef, { fcmToken: token, lastLogin: serverTimestamp() }, { merge: true });
            }
        } catch (error) {
            console.error('Error getting FCM token:', error);
        }
    };
    
    let callUnsubscribe: Unsubscribe | null = null;
    let callDocUnsubscribe: Unsubscribe | null = null;

    const authUnsubscribe = auth.onAuthStateChanged(user => {
<<<<<<< HEAD
=======
      // Clean up previous listeners on user change
>>>>>>> 41a2162a78298df970810cb54c8ed33fc2c24ecf
      if (callUnsubscribe) callUnsubscribe();
      if (callDocUnsubscribe) callDocUnsubscribe();
      
      if (user) {
        handleToken(user);
<<<<<<< HEAD
=======

>>>>>>> 41a2162a78298df970810cb54c8ed33fc2c24ecf
        const userDocRef = doc(db, 'users', user.uid);
        callUnsubscribe = onSnapshot(userDocRef, (snap) => {
          const data = snap.data();
          const currentCallId = data?.currentCallId;
          
<<<<<<< HEAD
          if (callDocUnsubscribe) callDocUnsubscribe();

          if (currentCallId) {
=======
          if (callDocUnsubscribe) callDocUnsubscribe(); // Clean up old call listener

          if (currentCallId) {
            // If there's a call ID, listen to that call document
>>>>>>> 41a2162a78298df970810cb54c8ed33fc2c24ecf
            const callDocRef = doc(db, 'calls', currentCallId);
            callDocUnsubscribe = onSnapshot(callDocRef, (callSnap) => {
              if (callSnap.exists()) {
                setActiveCall({ id: callSnap.id, ...callSnap.data() });
              } else {
<<<<<<< HEAD
=======
                // The call document was deleted, so the call has ended.
>>>>>>> 41a2162a78298df970810cb54c8ed33fc2c24ecf
                setActiveCall(null);
              }
            });
          } else {
<<<<<<< HEAD
            setActiveCall(null);
          }
        });
      } else {
=======
            // No current call ID, so clear the active call.
            setActiveCall(null);
          }
        });

      } else {
        // User logged out, clear everything
>>>>>>> 41a2162a78298df970810cb54c8ed33fc2c24ecf
        setActiveCall(null);
      }
    });

    return () => {
        authUnsubscribe();
        if (callUnsubscribe) callUnsubscribe();
        if (callDocUnsubscribe) callDocUnsubscribe();
    };
  }, []);
  
<<<<<<< HEAD
=======
  // Cleanup audio on component unmount
>>>>>>> 41a2162a78298df970810cb54c8ed33fc2c24ecf
  useEffect(() => {
    return () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
    }
  }, []);

<<<<<<< HEAD
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

=======
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
>>>>>>> 41a2162a78298df970810cb54c8ed33fc2c24ecf
    setActiveSong(song);
    setIsPlaying(true);
  };
  
<<<<<<< HEAD
  const playSong = (song: Song, queue: Song[] = [], index: number = -1) => {
    startSong(song);
    setSongQueue(queue);
    setCurrentSongIndex(index);
  };
  
  const pauseSong = () => {
    if(audioRef.current) {
        audioRef.current.pause();
=======
  const pauseSong = () => {
    if(audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
>>>>>>> 41a2162a78298df970810cb54c8ed33fc2c24ecf
    }
  };
  
  const toggleSong = () => {
      if (isPlaying) {
          pauseSong();
      } else if(audioRef.current) {
          audioRef.current.play();
<<<<<<< HEAD
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

=======
          setIsPlaying(true);
      }
  };

>>>>>>> 41a2162a78298df970810cb54c8ed33fc2c24ecf
  const closeCall = () => {
    setActiveCall(null);
  };

  const value = {
    isCalling,
    setIsCalling,
    callTarget,
    setCallTarget,
    activeCall,
<<<<<<< HEAD
    closeCall,
=======
    closeCall, // Provide the new function
>>>>>>> 41a2162a78298df970810cb54c8ed33fc2c24ecf
    activeSong,
    isPlaying,
    playSong,
    pauseSong,
    toggleSong,
<<<<<<< HEAD
    playNext,
    playPrevious,
=======
>>>>>>> 41a2162a78298df970810cb54c8ed33fc2c24ecf
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
