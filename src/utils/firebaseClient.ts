// src/utils/firebaseClient.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
import { getMessaging, getToken } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBAFigbMPTmbQzIWFlTNkZxrNo3ym51Tto",
  authDomain: "direct-hope-473110-r0.firebaseapp.com",
  projectId: "direct-hope-473110-r0",
  storageBucket: "direct-hope-473110-r0.firebasestorage.app",
  messagingSenderId: "1074226225704",
  appId: "1:1074226225704:web:b2a20d917eb2901b1acb1d",
  measurementId: "G-W34EF2WGHS"
};

const firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const app = firebaseApp;
export const auth = getAuth(firebaseApp);
export const db = getFirestore(app);

// Initialize Firebase Cloud Messaging and get a reference to the service
export const messaging = (typeof window !== 'undefined') ? getMessaging(firebaseApp) : null;

/**
 * Requests permission for notifications and saves the FCM token to Firestore.
 * This function should be called after a user logs in.
 * 
 * @param {string} userId The ID of the currently logged-in user.
 */
export const requestNotificationPermission = async (userId: string) => {
  if (!messaging || typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log("Firebase Messaging is not supported in this browser or environment.");
    return;
  }

  try {
    // 1. Request permission from the user
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission was not granted.');
      return;
    }

    // 2. Get the FCM token, which registers our service worker
    const fcmToken = await getToken(messaging, {
      // !! IMPORTANT !!
      // Replace this with your actual VAPID key from the Firebase Console
      vapidKey: 'BDzXeTQuuf5a_znsOPHUZlegNYRO4JpXd1Zua5tsN3ucWs3MnGD_x62aaKt7AFdyR4u3CCuZemkPilt-HdTSZpk',
    });

    if (fcmToken) {
      console.log('FCM Token retrieved:', fcmToken);
      // 3. Save the FCM token to the user's document in Firestore
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, { fcmToken: fcmToken });
      console.log('Successfully saved FCM token for user:', userId);
    } else {
      console.log('Could not retrieve FCM token. User may need to grant permission again.');
    }
  } catch (error) {
    console.error('An error occurred while requesting notification permission:', error);
  }
};