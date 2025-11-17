
// src/utils/firebaseClient.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
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

export { app, auth, db, storage, functions };
