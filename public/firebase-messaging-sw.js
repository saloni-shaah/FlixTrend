// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
const firebaseConfig = {
    apiKey: "AIzaSyD5pOxEFENSBHsBSCo8Fnq9bHP_vGQEIHs",
    authDomain: "flixtrendmvp-a2002.firebaseapp.com",
    projectId: "flixtrendmvp-a2002",
    storageBucket: "flixtrendmvp-a2002.appspot.com",
    messagingSenderId: "589343899228",
    appId: "1:589343899228:web:ca642b7a4390b357fdf099",
    measurementId: "G-TK8GF201Q7"
};


firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192x192.png' // Make sure you have an icon file in your public folder
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
