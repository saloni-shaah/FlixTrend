"use client";

import { useEffect, useRef } from 'react';
import { auth, db } from '@/utils/firebaseClient';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { subscribeToPush } from '@/utils/pushNotifications';

const PUSH_PROMPT_KEY = 'flixtrend_push_prompted';

export function NotificationRegistrar() {
  const registrationAttempted = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let unsubscribeUser: (() => void) | null = null;

    const authUnsubscribe = auth.onAuthStateChanged((user) => {
      if (unsubscribeUser) {
        unsubscribeUser();
        unsubscribeUser = null;
      }

      if (!user) {
        registrationAttempted.current = false;
        return;
      }

      const userRef = doc(db, 'users', user.uid);
      unsubscribeUser = onSnapshot(userRef, async (snapshot) => {
        const data = snapshot.data();
        if (registrationAttempted.current) return;
        if (data?.settings?.pushNotifications === false) return;

        const permission = Notification.permission;
        if (permission === 'granted') {
          registrationAttempted.current = true;
          subscribeToPush(user.uid).catch((error) => {
            console.warn('NotificationRegistrar failed to restore push token:', error);
          });
          return;
        }

        if (permission === 'default' && !sessionStorage.getItem(PUSH_PROMPT_KEY)) {
          sessionStorage.setItem(PUSH_PROMPT_KEY, '1');
          registrationAttempted.current = true;
          const token = await subscribeToPush(user.uid);
          if (!token && Notification.permission === 'denied') {
            updateDoc(userRef, { 'settings.pushNotifications': false }).catch((error) => {
              console.warn('Failed to persist disabled push setting after denial:', error);
            });
          }
        }
      });
    });

    return () => {
      authUnsubscribe();
      if (unsubscribeUser) unsubscribeUser();
    };
  }, []);

  return null;
}
