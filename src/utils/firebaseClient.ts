// src/utils/firebaseClient.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyD5pOxEFENSBHsBSCo8Fnq9bHP_vGQEIHs",
  authDomain: "flixtrendmvp-a2002.firebaseapp.com",
  projectId: "flixtrendmvp-a2002",
  storageBucket: "flixtrendmvp-a2002.appspot.com",
  messagingSenderId: "589343899228",
  appId: "1:589343899228:web:ca642b7a4390b357fdf099",
  measurementId: "G-TK8GF201Q7"
};

const firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const app = firebaseApp;
export const auth = getAuth(firebaseApp);
export const db = getFirestore(app);

// Initialize Firebase Cloud Messaging and get a reference to the service
export const messaging = (typeof window !== 'undefined') ? getMessaging(firebaseApp) : null;
