// src/utils/firebaseMessaging.ts
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from './firebaseClient';

export const requestForToken = async () => {
  try {
    const messaging = getMessaging(app);
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      console.log('Notification permission granted.');
      // VAPID key is used to authorize send requests to web push services.
      const currentToken = await getToken(messaging, {
        vapidKey: 'BC98cPp33nBlHQBYGQ4k0bVozfxv4YBXjRu1o1JOT9xNtytpKmyA4ZWySzcQGG6V_Mm3XPpgyeaoVDtZnJuJaQg',
      });
      if (currentToken) {
        console.log('FCM Token generated:', currentToken);
        return currentToken;
      } else {
        console.log('No registration token available. Request permission to generate one.');
        return null;
      }
    } else {
      console.log('Unable to get permission to notify.');
      return null;
    }
  } catch (err) {
    console.error('An error occurred while retrieving token. ', err);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    const messaging = getMessaging(app);
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
