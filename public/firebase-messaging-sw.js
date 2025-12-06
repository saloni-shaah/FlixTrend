
importScripts("https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "AIzaSyBP1VyEIjPzt43DJokCj9WhPbTrZXbEVb8",
  authDomain: "flixtrend-24072025.firebaseapp.com",
  projectId: "flixtrend-24072025",
  storageBucket: "flixtrend-24072025.firebasestorage.app",
  messagingSenderId: "200803738308",
  appId: "1:200803738308:web:ed7942db23395b0d101f91",
  measurementId: "G-H48LZPV9QZ"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();
// This service worker script handles incoming push notifications, specifically for calls.

// IMPORTANT: This script will not work until you initialize Firebase in your main app.
// Make sure you have a firebase.js or firebaseClient.js file that configures Firebase
// and requests notification permission from the user.
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    // Activate the new service worker as soon as it's installed.
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    // Take control of all open clients (tabs) to ensure the new service worker is used.
    event.waitUntil(self.clients.claim());
});

let ringtone;
let ringtoneTimer;

/**
 * Main event listener for push notifications from Firebase Cloud Messaging.
 */
self.addEventListener('push', (event) => {
    console.log('Service Worker: Push Received.', event.data.text());
    const payload = event.data.json();

    // Check if this is our custom incoming call notification
    if (payload.data && payload.data.type === 'incoming_call') {
        handleIncomingCall(payload.data);
    } else {
        // Handle standard notifications (likes, comments, etc.)
        const notificationTitle = payload.notification.title;
        const notificationOptions = {
            body: payload.notification.body,
            icon: payload.notification.icon || '/icon-192x192.png'
        };
        event.waitUntil(self.registration.showNotification(notificationTitle, notificationOptions));
    }
});

/**
 * Handles the logic for an incoming call notification.
 * @param {object} callData - The data object from the push payload.
 */
function handleIncomingCall(callData) {
    // Start playing the ringtone
    playRingtone();

    const notificationTitle = callData.title || 'Incoming Call';
    const notificationOptions = {
        body: callData.body || 'Someone is calling you.',
        icon: callData.icon || '/icon-192x192.png',
        // Make the notification sticky until the user interacts with it
        requireInteraction: true,
        // Define the 'Answer' and 'Decline' buttons
        actions: [
            { action: 'answer', title: 'Answer' },
            { action: 'decline', title: 'Decline' }
        ],
        // Store call data in the notification tag to use it later
        tag: 'incoming-call'
    };

    // Show the notification and keep the service worker alive
    self.registration.showNotification(notificationTitle, notificationOptions);
}

/**
 * Event listener for when a user clicks on a notification button.
 */
self.addEventListener('notificationclick', (event) => {
    console.log('Service Worker: Notification clicked.');
    // Always close the notification when a button is pressed.
    event.notification.close();
    stopRingtone();

    const action = event.action;

    if (action === 'answer') {
        // Focus the existing FlixTrend tab or open a new one to the call page.
        // This URL should lead to your call handling page.
        self.clients.openWindow('/signal'); 
    } else if (action === 'decline') {
        // Here you could add logic to notify the backend that the call was rejected.
        console.log('Call declined.');
    }
});

/**
 * Event listener for when a user dismisses a notification.
 */
self.addEventListener('notificationclose', (event) => {
    // Stop the ringtone if the notification is closed
    if (event.notification.tag === 'incoming-call') {
        console.log('Service Worker: Call notification closed.');
        stopRingtone();
    }
});

/**
 * Plays the ringtone audio file on a loop.
 */
function playRingtone() {
    try {
        ringtone = new Audio('/ringtone.mp3');
        ringtone.loop = true;
        ringtone.play();
        
        // As a fallback, stop the ringtone after 30 seconds to prevent it from playing indefinitely.
        ringtoneTimer = setTimeout(stopRingtone, 30000);
    } catch (e) {
        console.error('Could not play ringtone:', e);
    }
}

/**
 * Stops the ringtone audio file from playing.
 */
function stopRingtone() {
    if (ringtone) {
        ringtone.pause();
        ringtone.currentTime = 0;
    }
    if (ringtoneTimer) {
        clearTimeout(ringtoneTimer);
    }
}
