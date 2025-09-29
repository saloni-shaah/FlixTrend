// src/utils/firebaseClient.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBAFigbMPTmbQzIWFlTNkZxrNo3ym51Tto",
  authDomain: "direct-hope-473110-r0.firebaseapp.com",
  projectId: "direct-hope-473110-r0",
  storageBucket: "direct-hope-473110-r0.appspot.com",
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
