
import { getMessaging, getToken, onMessage, Unsubscribe } from "firebase/messaging";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
import { app } from "./firebaseClient"; // Import the initialized app

const db = getFirestore(app);

/**
 * Requests permission for notifications and saves the FCM token to Firestore.
 * This function should only be called on the client-side.
 *
 * @param {string} userId The ID of the currently logged-in user.
 */
export const requestNotificationPermission = async (userId: string) => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log("Firebase Messaging is not supported in this browser or environment.");
    return;
  }

  try {
    const messaging = getMessaging(app);
    // 1. Request permission from the user
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission was not granted.');
      return;
    }

    // 2. Get the FCM token
    const fcmToken = await getToken(messaging, {
      vapidKey: 'BOZOSsvokpmFqM8muN8GCm-KO59C08AFZrgrTRwxsppS-SLwoUvLc81hRFIKtgWCXu7kpBw03JMuiPApGYdGZdc',
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


/**
 * Sets up a listener for foreground FCM messages.
 * This function should only be called on the client-side.
 * @param callback The function to execute when a message is received.
 * @returns An unsubscribe function or undefined if not in a browser environment.
 */
export const onForegroundMessage = (callback: (payload: any) => void): Unsubscribe | undefined => {
  if (typeof window === 'undefined') {
      console.log("Cannot set up foreground message listener in this environment.");
      return;
  };
  const messaging = getMessaging(app);
  return onMessage(messaging, callback);
}