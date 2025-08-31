"use client";
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { auth } from './firebaseClient';
import { CallScreen } from '@/components/CallScreen';

const db = getFirestore();

interface Call {
  id: string;
  [key: string]: any;
}

interface AppState {
  isCalling: boolean;
  setIsCalling: (isCalling: boolean) => void;
  callTarget: any | null;
  setCallTarget: (target: any | null) => void;
  activeCall: Call | null;
}

const AppStateContext = createContext<AppState | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [isCalling, setIsCalling] = useState(false);
  const [callTarget, setCallTarget] = useState<any | null>(null);
  const [activeCall, setActiveCall] = useState<Call | null>(null);

  useEffect(() => {
    // This effect listens for incoming calls for the logged-in user
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        return onSnapshot(userDocRef, (snap) => {
          const data = snap.data();
          if (data?.currentCallId) {
            // User is in a call, listen to that call document
            return onSnapshot(doc(db, 'calls', data.currentCallId), (callSnap) => {
              if (callSnap.exists()) {
                const callData = callSnap.data();
                setActiveCall({ id: callSnap.id, ...callData });
                // If call has ended (e.g., offer is gone), clear it
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

  const value = {
    isCalling,
    setIsCalling,
    callTarget,
    setCallTarget,
    activeCall
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
