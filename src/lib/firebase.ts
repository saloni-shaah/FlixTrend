import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyD5pOxEFENSBHsBSCo8Fnq9bHP_vGQEIHs",
  authDomain: "flixtrendmvp-a2002.firebaseapp.com",
  databaseURL: "https://flixtrendmvp-a2002-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "flixtrendmvp-a2002",
  storageBucket: "flixtrendmvp-a2002.appspot.com",
  messagingSenderId: "589343899228",
  appId: "1:589343899228:web:ca642b7a4390b357fdf099",
  measurementId: "G-TK8GF201Q7",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const rtdb = getDatabase(app);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;


export { app, auth, db, storage, rtdb, analytics };
