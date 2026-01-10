// src/utils/firebaseClient.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type Storage } from "firebase/storage";
import { getFunctions, type Functions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyBP1VyEIjPzt43DJokCj9WhPbTrZXbEVb8",
  authDomain: "flixtrend-24072025.firebaseapp.com",
  projectId: "flixtrend-24072025",
  storageBucket: "flixtrend-24072025.firebasestorage.app",
  messagingSenderId: "200803738308",
  appId: "1:200803738308:web:ed7942db23395b0d101f91",
  measurementId: "G-H48LZPV9QZ"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

// Add this block for local development to bypass reCAPTCHA
if (typeof window !== 'undefined' && window.location.hostname === "localhost") {
  // Point to the Auth Emulator running on a different port
  // connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
  // Set a test phone number and SMS code
  auth.settings.appVerificationDisabledForTesting = true;
}


export { app, auth, db, storage, functions };
