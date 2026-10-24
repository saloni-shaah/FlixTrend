'use client';

import { useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { deleteDoc, doc, onSnapshot, runTransaction, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/utils/firebaseClient';
import { getDeviceLabel, getDeviceSessionId } from '@/lib/deviceSessions';

const SESSION_EPOCH_KEY = 'flixtrend-session-epoch';
const SESSION_TOUCH_INTERVAL = 12 * 60 * 60 * 1000;

export function SessionTracker() {
  useEffect(() => {
    let stopCurrentSession: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      stopCurrentSession?.();
      stopCurrentSession = undefined;
      if (!user) return;

      const sessionId = getDeviceSessionId();
      const epochStorageKey = `${SESSION_EPOCH_KEY}:${user.uid}:${sessionId}`;
      const sessionRef = doc(db, 'users', user.uid, 'activeSessions', sessionId);
      const userRef = doc(db, 'users', user.uid);
      let active = true;
      let initialized = false;
      let lastTouchedAt = 0;
      let touchInterval: ReturnType<typeof setInterval> | undefined;
      let unsubscribeUser: (() => void) | undefined;

      const touchSession = async () => {
        if (!active || Date.now() - lastTouchedAt < SESSION_TOUCH_INTERVAL) return;
        lastTouchedAt = Date.now();
        try {
          await updateDoc(sessionRef, { lastSeen: serverTimestamp() });
        } catch (error) {
          if (active) console.error('Could not update this device session:', error);
        }
      };

      const registerSession = async (epoch: number) => {
        if (!active) return;
        let knownEpoch: string | null;
        try {
          knownEpoch = window.localStorage.getItem(epochStorageKey);
        } catch (error) {
          console.error('Could not read this device session state:', error);
          knownEpoch = null;
        }
        if (knownEpoch !== null && knownEpoch !== String(epoch)) {
          await signOut(auth);
          return;
        }

        try {
          window.localStorage.setItem(epochStorageKey, String(epoch));
        } catch (error) {
          console.error('Could not save this device session state:', error);
        }

        try {
          const registered = await runTransaction(db, async (transaction) => {
            const userSnapshot = await transaction.get(userRef);
            const currentEpoch = userSnapshot.data()?.sessionEpoch ?? 0;
            if (String(currentEpoch) !== String(epoch)) return false;

            transaction.set(sessionRef, {
              label: getDeviceLabel(),
              userAgent: navigator.userAgent,
              sessionEpoch: epoch,
              createdAt: serverTimestamp(),
              lastSeen: serverTimestamp(),
            }, { merge: true });
            return true;
          });
          if (!registered) {
            await signOut(auth);
            return;
          }
          lastTouchedAt = Date.now();
        } catch (error) {
          console.error('Could not register this device session:', error);
        }
      };

      unsubscribeUser = onSnapshot(userRef, (snapshot) => {
        const epoch = snapshot.data()?.sessionEpoch ?? 0;
        if (!initialized) {
          initialized = true;
          void registerSession(epoch);
          return;
        }

        const knownEpoch = window.localStorage.getItem(epochStorageKey);
        if (knownEpoch !== null && knownEpoch !== String(epoch)) {
          void signOut(auth);
        }
      }, (error) => {
        console.error('Could not monitor this device session:', error);
      });

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') void touchSession();
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      touchInterval = setInterval(() => void touchSession(), SESSION_TOUCH_INTERVAL);

      stopCurrentSession = () => {
        active = false;
        unsubscribeUser?.();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        if (touchInterval) clearInterval(touchInterval);
        void deleteDoc(sessionRef).catch((error) => {
          if ((error as { code?: string }).code !== 'not-found') {
            console.error('Could not remove this device session:', error);
          }
        });
        try {
          window.localStorage.removeItem(epochStorageKey);
        } catch (error) {
          console.error('Could not clear this device session state:', error);
        }
      };
    });

    return () => {
      unsubscribeAuth();
      stopCurrentSession?.();
    };
  }, []);

  return null;
}
