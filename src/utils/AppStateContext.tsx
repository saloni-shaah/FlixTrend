"use client";
import React, { createContext, useState, useContext, ReactNode, useEffect, useRef } from 'react';
import { getFirestore, doc, onSnapshot, setDoc, serverTimestamp, Unsubscribe, updateDoc, collection, query, where } from 'firebase/firestore';
import { auth, app } from './firebaseClient';
import { CallScreen } from '@/components/CallScreen';
import { playCallTone, stopCallTone } from './callAudio';

const db = getFirestore(app);

export interface ActiveCall {
  id: string;
  callerId: string;
  callerName: string;
  callerAvatar?: string | null;
  receiverId: string;
  receiverName: string;
  receiverAvatar?: string | null;
  type: 'voice' | 'video';
  status: 'ringing' | 'accepted' | 'rejected' | 'ended' | 'missed';
  [key: string]: unknown;
}

interface UserProfile {
    uid: string;
    displayName?: string;
    name?: string;
    username: string;
    avatar_url: string;
}

interface AppState {
  activeCall: ActiveCall | null;
  localCallPreview: MediaStream | null;
  startCall: (target: { uid: string; name?: string; username?: string; avatar_url?: string }, isVideo: boolean) => Promise<void>;
  answerCall: () => Promise<void>;
  rejectCall: () => Promise<void>;
  handleEndCall: () => Promise<void>;
  selectedChat: any | null;
  setSelectedChat: React.Dispatch<React.SetStateAction<any | null>>;
  drafts: { [chatId: string]: string };
  setDraft: (chatId: string, text: string) => void;
  isFlowVideoPlaying: boolean;
  setIsFlowVideoPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  currentUserProfile: UserProfile | null;
  videoPlaybackState: { [postId: string]: number };
  setVideoPlaybackState: (postId: string, currentTime: number) => void;
}

const AppStateContext = createContext<AppState | undefined>(undefined);

const terminalCallStatuses = new Set(['rejected', 'ended', 'missed']);

function getCallMediaError(error: unknown, isVideo: boolean): unknown {
  if (!(error instanceof DOMException)) return error;

  if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
    return new Error(
      `Allow ${isVideo ? 'camera and microphone' : 'microphone'} access for FlixTrend in your browser or device settings, then try again. No call was placed.`
    );
  }
  if (error.name === 'NotFoundError') {
    return new Error(`No ${isVideo ? 'camera or microphone' : 'microphone'} was found. Connect or enable a device, then try again.`);
  }
  if (error.name === 'NotReadableError' || error.name === 'AbortError') {
    return new Error('Your camera or microphone is busy or unavailable. Close other apps using it and try again.');
  }
  return error;
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [localCallPreview, setLocalCallPreview] = useState<MediaStream | null>(null);
  const localCallPreviewRef = useRef<MediaStream | null>(null);
  const activeCallRef = useRef<ActiveCall | null>(null);
  const callCreationInProgress = useRef(false);

  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const [drafts, setDrafts] = useState<{ [chatId: string]: string }>({});
  const [isFlowVideoPlaying, setIsFlowVideoPlaying] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [videoPlaybackState, setVideoPlaybackStateInternal] = useState<{ [postId: string]: number }>({});

  activeCallRef.current = activeCall;

  const clearLocalCallPreview = () => {
    localCallPreviewRef.current?.getTracks().forEach(track => track.stop());
    localCallPreviewRef.current = null;
    setLocalCallPreview(null);
  };

  useEffect(() => {
    let incomingCallsUnsubscribe: Unsubscribe | null = null;
    let userProfileUnsubscribe: Unsubscribe | null = null;

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
        };

        window.addEventListener('visibilitychange', onVisibilityChange);
        window.addEventListener('beforeunload', () => setDoc(userDocRef, offlineData, { merge: true }));

        return () => {
             window.removeEventListener('visibilitychange', onVisibilityChange);
        };
    };

    const authUnsubscribe = auth.onAuthStateChanged(user => {
        incomingCallsUnsubscribe?.();
        incomingCallsUnsubscribe = null;
        userProfileUnsubscribe?.();
        userProfileUnsubscribe = null;
        activeCallRef.current = null;
        setActiveCall(null);
        clearLocalCallPreview();
        setCurrentUserProfile(null);
        callCreationInProgress.current = false;

        if (!user) {
          return;
        }

        const userDocRef = doc(db, 'users', user.uid);
        userProfileUnsubscribe = onSnapshot(userDocRef, (snap) => {
            if (snap.exists()) {
                setCurrentUserProfile({ uid: snap.id, ...snap.data() } as UserProfile);
            }
        }, error => console.error('Failed to listen for the current user profile:', error));

        managePresence(user);

        const incomingCallsQuery = query(
          collection(db, 'calls'),
          where('receiverId', '==', user.uid),
          where('status', '==', 'ringing')
        );
        incomingCallsUnsubscribe = onSnapshot(incomingCallsQuery, snapshot => {
          if (activeCallRef.current || snapshot.empty) return;
          const incomingCall = snapshot.docs[0];
          const incomingCallData = { id: incomingCall.id, ...incomingCall.data() } as ActiveCall;
          activeCallRef.current = incomingCallData;
          setActiveCall(incomingCallData);
        }, error => console.error('Failed to listen for incoming calls:', error));
    });

    return () => {
        authUnsubscribe();
        incomingCallsUnsubscribe?.();
        userProfileUnsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (!activeCall) return;

    const callDocRef = doc(db, 'calls', activeCall.id);
    const unsubscribe = onSnapshot(callDocRef, snapshot => {
      if (!snapshot.exists()) {
        activeCallRef.current = null;
        setActiveCall(null);
        return;
      }
      const updatedCall = { id: snapshot.id, ...snapshot.data() } as ActiveCall;
      activeCallRef.current = updatedCall;
      setActiveCall(updatedCall);
      if (updatedCall.status !== 'ringing') {
        clearLocalCallPreview();
      }
    }, error => console.error(`Failed to listen for call ${activeCall.id}:`, error));

    return unsubscribe;
  }, [activeCall?.id]);

  useEffect(() => {
    if (!activeCall || activeCall.status !== 'ringing') return;

    const callId = activeCall.id;
    const timeout = window.setTimeout(() => {
      updateDoc(doc(db, 'calls', callId), {
        status: 'missed',
        endedAt: serverTimestamp(),
      }).catch(error => console.error(`Failed to mark call ${callId} as missed:`, error));
    }, 60_000);

    return () => window.clearTimeout(timeout);
  }, [activeCall?.id, activeCall?.status]);

  useEffect(() => {
    if (!activeCall || !terminalCallStatuses.has(activeCall.status)) return;
    const timeout = window.setTimeout(() => {
      activeCallRef.current = null;
      clearLocalCallPreview();
      setActiveCall(null);
    }, 2_100);
    return () => window.clearTimeout(timeout);
  }, [activeCall]);

  const startCall = async (
    target: { uid: string; name?: string; username?: string; avatar_url?: string },
    isVideo: boolean
  ) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Sign in to start a call.');
    if (!target?.uid || target.uid === user.uid) throw new Error('This user cannot be called.');
    if (activeCallRef.current || callCreationInProgress.current) throw new Error('Finish your current call before starting another.');
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      throw new Error('Calls require a secure connection and a browser that supports microphone and camera access.');
    }

    callCreationInProgress.current = true;
    let preview: MediaStream | null = null;
    playCallTone('outgoing', 0.6).catch(error => {
      console.warn('Outgoing call ringtone could not be played:', error);
    });
    try {
      preview = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo ? { facingMode: 'user' } : false,
      });
      preview.getAudioTracks().forEach(track => track.stop());

      const callRef = doc(collection(db, 'calls'));
      const callerName = currentUserProfile?.name || currentUserProfile?.displayName || user.displayName || user.email || 'User';
      const receiverName = target.name || target.username || 'User';
      const call: ActiveCall = {
        id: callRef.id,
        callerId: user.uid,
        callerName,
        callerAvatar: currentUserProfile?.avatar_url || user.photoURL,
        receiverId: target.uid,
        receiverName,
        receiverAvatar: target.avatar_url || null,
        type: isVideo ? 'video' : 'voice',
        status: 'ringing',
      };

      await setDoc(callRef, {
        callerId: call.callerId,
        callerName: call.callerName,
        callerAvatar: call.callerAvatar,
        receiverId: call.receiverId,
        receiverName: call.receiverName,
        receiverAvatar: call.receiverAvatar,
        type: call.type,
        status: call.status,
        createdAt: serverTimestamp(),
      });
      activeCallRef.current = call;
      if (isVideo) {
        localCallPreviewRef.current = preview;
        setLocalCallPreview(preview);
      } else {
        preview.getTracks().forEach(track => track.stop());
      }
      setActiveCall(call);
    } catch (error) {
      preview?.getTracks().forEach(track => track.stop());
      stopCallTone();
      throw getCallMediaError(error, isVideo);
    } finally {
      callCreationInProgress.current = false;
    }
  };

  const answerCall = async () => {
    const call = activeCallRef.current;
    const user = auth.currentUser;
    if (!call || !user || call.receiverId !== user.uid || call.status !== 'ringing') {
      throw new Error('This incoming call is no longer available.');
    }

    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      throw new Error('Calls require a secure connection and a browser that supports microphone and camera access.');
    }

    let preview: MediaStream;
    try {
      preview = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: call.type === 'video' ? { facingMode: 'user' } : false,
      });
    } catch (error) {
      throw getCallMediaError(error, call.type === 'video');
    }
    preview.getTracks().forEach(track => track.stop());

    await updateDoc(doc(db, 'calls', call.id), {
      status: 'accepted',
      acceptedAt: serverTimestamp(),
    });
  };

  const rejectCall = async () => {
    const call = activeCallRef.current;
    const user = auth.currentUser;
    if (!call || !user || call.receiverId !== user.uid || call.status !== 'ringing') return;

    await updateDoc(doc(db, 'calls', call.id), { status: 'rejected' });
  };

  const handleEndCall = async () => {
    const call = activeCallRef.current;
    if (!call || terminalCallStatuses.has(call.status)) return;

    await updateDoc(doc(db, 'calls', call.id), {
      status: 'ended',
      endedAt: serverTimestamp(),
    });
  };

  const setDraft = (chatId: string, text: string) => {
    setDrafts(prev => ({...prev, [chatId]: text}));
  };

  const setVideoPlaybackState = (postId: string, currentTime: number) => {
    setVideoPlaybackStateInternal(prev => ({ ...prev, [postId]: currentTime }));
  };

  const value = {
    activeCall,
    localCallPreview,
    startCall,
    answerCall,
    rejectCall,
    handleEndCall,
    selectedChat,
    setSelectedChat,
    drafts,
    setDraft,
    isFlowVideoPlaying,
    setIsFlowVideoPlaying,
    currentUserProfile,
    videoPlaybackState,
    setVideoPlaybackState,
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
