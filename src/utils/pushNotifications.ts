import { getMessaging, getToken, deleteToken } from 'firebase/messaging';
import { app, db } from '@/utils/firebaseClient';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

const STORAGE_KEY = 'flixtrend_fcm_token';
const SERVICE_WORKER_PATH = '/firebase-messaging-sw.js';
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export function isPushSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window;
}

export function isPushPermissionGranted(): boolean {
  return typeof window !== 'undefined' && Notification.permission === 'granted';
}

async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!isPushSupported()) {
    throw new Error('Push is not supported in this browser.');
  }

  const registration = await navigator.serviceWorker.register(SERVICE_WORKER_PATH);

  if (registration.active) {
    return registration;
  }

  return await new Promise<ServiceWorkerRegistration>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      if (registration.active) {
        resolve(registration);
      } else {
        resolve(registration);
      }
    }, 5000);

    const checkState = () => {
      if (registration.active) {
        window.clearTimeout(timeout);
        resolve(registration);
      }
    };

    if (registration.installing) {
      registration.installing.addEventListener('statechange', checkState);
    }
    if (registration.waiting) {
      registration.waiting.addEventListener('statechange', checkState);
    }

    navigator.serviceWorker.ready
      .then(() => {
        window.clearTimeout(timeout);
        resolve(registration);
      })
      .catch((error) => {
        window.clearTimeout(timeout);
        reject(error);
      });
  });
}

export async function requestPushPermission(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!isPushSupported()) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export async function subscribeToPush(userId: string): Promise<string | null> {
  if (!isPushSupported()) {
    console.warn('Push notifications are not supported in this browser.');
    return null;
  }

  if (!VAPID_KEY) {
    console.warn('Missing NEXT_PUBLIC_FIREBASE_VAPID_KEY. Cannot request FCM token.');
    return null;
  }

  const granted = await requestPushPermission();
  if (!granted) {
    console.warn('Push notification permission was not granted.');
    return null;
  }

  try {
    const registration = await registerServiceWorker();
    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      console.warn('FCM token could not be generated.');
      return null;
    }

    await updateDoc(doc(db, 'users', userId), {
      fcmTokens: arrayUnion(token),
    });

    localStorage.setItem(STORAGE_KEY, token);
    return token;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return null;
  }
}

export async function unsubscribeFromPush(userId: string): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const messaging = getMessaging(app);
    const existingToken = localStorage.getItem(STORAGE_KEY);

    if (existingToken) {
      await updateDoc(doc(db, 'users', userId), {
        fcmTokens: arrayRemove(existingToken),
      });
    }

    await deleteToken(messaging);
  } catch (error) {
    console.warn('Failed to unsubscribe from push notifications:', error);
  } finally {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}
