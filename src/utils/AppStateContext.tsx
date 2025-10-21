

"use client";
import React, { createContext, useState, useContext, ReactNode, useEffect, useRef } from 'react';
import { getFirestore, doc, onSnapshot, setDoc, serverTimestamp, Unsubscribe, updateDoc, collection, addDoc, getDoc, writeBatch, getDocs, deleteField } from 'firebase/firestore';
import { auth, app, requestNotificationPermission } from './firebaseClient';
import { CallScreen } from '@/components/CallScreen';
import { onMessage } from 'firebase/messaging';
import { messaging } from './firebaseClient';

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
  answerCall: () => Promise<void>; 
  handleEndCall: () => Promise<void>;
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
  selectedChat: any | null;
  setSelectedChat: React.Dispatch<React.SetStateAction<any | null>>;
  drafts: { [chatId: string]: string };
  setDraft: (chatId: string, text: string) => void;
  isScopeVideoPlaying: boolean;
  setIsScopeVideoPlaying: React.Dispatch<React.SetStateAction<boolean>>;
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

async function cleanUpCall(callId: string) {
    if (!callId) return;
    const callDocRef = doc(db, 'calls', callId);
    try {
        const callDocSnap = await getDoc(callDocRef);
        if (!callDocSnap.exists()) return;
        const batch = writeBatch(db);
        const offerCandidatesRef = collection(callDocRef, 'offerCandidates');
        const answerCandidatesRef = collection(callDocRef, 'answerCandidates');
        const offerCandidatesSnap = await getDocs(offerCandidatesRef);
        offerCandidatesSnap.forEach(doc => batch.delete(doc.ref));
        const answerCandidatesSnap = await getDocs(answerCandidatesRef);
        answerCandidatesSnap.forEach(doc => batch.delete(doc.ref));
        batch.delete(callDocRef);
        await batch.commit();
    } catch (error) {
        console.error(`Error cleaning up call ${callId}:`, error);
    }
}


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
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const [drafts, setDrafts] = useState<{ [chatId: string]: string }>({});
  const [isScopeVideoPlaying, setIsScopeVideoPlaying] = useState(false);


  useEffect(() => {
    let callUnsubscribe: Unsubscribe | null = null;
    let callDocUnsubscribe: Unsubscribe | null = null;
    let peerConnection: RTCPeerConnection | null = null;

    const managePresence = (user: any) => {
        if (!user) return;
        const userDocRef = doc(db, 'users', user.uid);

        const onlineData = { status: 'online', lastSeen: serverTimestamp() };
        const offlineData = { status: 'offline', lastSeen: serverTimestamp() };
        
        setDoc(userDocRef, onlineData, { merge: true });

        const onVisibilityChange = () => {
             if (document.visibilityState === 'hidden') {
                setDoc(userDocRef, offlineData, { merge: true });
            } else {
                setDoc(userDocRef, onlineData, { merge: true });
            }
        }
        
        window.addEventListener('visibilitychange', onVisibilityChange);
        window.addEventListener('beforeunload', () => setDoc(userDocRef, offlineData, { merge: true }));

        return () => {
             window.removeEventListener('visibilitychange', onVisibilityChange);
        }
    }

    const authUnsubscribe = auth.onAuthStateChanged(user => {
      if (callUnsubscribe) callUnsubscribe();
      if (callDocUnsubscribe) callDocUnsubscribe();
      
      if (user) {
        requestNotificationPermission(user.uid);
        managePresence(user);
        
        // Listen for incoming call notifications via FCM
        if (messaging) {
            onMessage(messaging, async (payload) => {
                console.log('FCM message received in foreground:', payload);
                const { type, callId } = payload.data || {};
                if (type === 'incoming_call' && callId) {
                    const userDocRef = doc(db, 'users', user.uid);
                    await updateDoc(userDocRef, { currentCallId: callId });
                    // The onSnapshot listener below will take care of joining the call.
                }
            });
        }
        
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
                closeCall(); // Use the state function to properly close down
              }
            });
          } else {
            closeCall();
          }
        });
      } else {
        closeCall();
      }
    });

    return () => {
        authUnsubscribe();
        if (callUnsubscribe) callUnsubscribe();
        if (callDocUnsubscribe) callDocUnsubscribe();
        if(pc) pc.close();
    };
  }, []);

  const answerCall = async () => {
    if (!pc || !activeCall) return;

    const callDocRef = doc(db, 'calls', activeCall.id);
    const answerCandidates = collection(callDocRef, 'answerCandidates');
    const offerCandidates = collection(callDocRef, 'offerCandidates');

    pc.onicecandidate = (event) => {
      event.candidate && addDoc(answerCandidates, event.candidate.toJSON());
    };

    const callData = (await getDoc(callDocRef)).data();
    if (callData?.offer) {
      await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));
    }

    const answerDescription = await pc.createAnswer();
    await pc.setLocalDescription(answerDescription);

    await updateDoc(callDocRef, { answer: { type: answerDescription.type, sdp: answerDescription.sdp } });

    onSnapshot(offerCandidates, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
        }
      });
    });
  };

  const handleEndCall = async () => {
      if (!activeCall) return;
      const user = auth.currentUser;
      if (!user) return;
      
      const callId = activeCall.id;
      
      // Update local state immediately for responsiveness
      closeCall(); 

      // Update user docs to remove call ID
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { currentCallId: deleteField() });
      
      const otherUserId = user.uid === activeCall.callerId ? activeCall.calleeId : activeCall.callerId;
      if(otherUserId) {
          const otherUserDocRef = doc(db, 'users', otherUserId);
          // Check if other user doc exists before trying to update
          const otherUserDocSnap = await getDoc(otherUserDocRef);
          if (otherUserDocSnap.exists()) {
              await updateDoc(otherUserDocRef, { currentCallId: deleteField() });
          }
      }

      // Clean up the call document and subcollections in the background
      await cleanUpCall(callId);
  };
  
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
    audio.addEventListener('ended', playNext);

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

  const setDraft = (chatId: string, text: string) => {
    setDrafts(prev => ({...prev, [chatId]: text}));
  }

  const value = {
    isCalling,
    setIsCalling,
    callTarget,
    setCallTarget,
    activeCall,
    answerCall,
    handleEndCall,
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
    selectedChat,
    setSelectedChat,
    drafts,
    setDraft,
    isScopeVideoPlaying,
    setIsScopeVideoPlaying,
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
