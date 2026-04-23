'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';

const FOUNDER_UID = "x04gu2AkBFVX4y6Iho6J713cJOy2";

export default function AdminDashboard() {
  const [user, isAuthLoading, authError] = useAuthState(auth);
  const [permissionState, setPermissionState] = useState('loading');
  const [debugInfo, setDebugInfo] = useState({}); // State to hold step-by-step debug info

  useEffect(() => {
    const checkPermission = async () => {
      // This object will trace the execution flow
      const dbg = {
          step: 'Initial',
          isAuthLoading,
          hasUser: !!user,
          userId: user?.uid || null,
          isFounderUID: user?.uid === FOUNDER_UID,
          finalPermission: 'loading',
          firestoreError: null,
          docExists: null,
          isFounderFlag: null,
      };

      if (isAuthLoading) {
        dbg.step = 'Auth state is loading...';
        setPermissionState('loading');
        setDebugInfo(dbg);
        return;
      }
      dbg.step = 'Auth state loaded';

      if (!user) {
        dbg.step = 'No user object found after auth loaded.';
        setPermissionState('denied');
        dbg.finalPermission = 'denied';
        setDebugInfo(dbg);
        return;
      }
      dbg.step = 'User object is present';

      if (user.uid === FOUNDER_UID) {
        dbg.step = 'User UID matches the Founder UID.';
        try {
          const userDocRef = doc(db, 'users', FOUNDER_UID);
          const userDoc = await getDoc(userDocRef);
          dbg.docExists = userDoc.exists();

          if (userDoc.exists()) {
            dbg.step = 'Firestore document was found.';
            const founderFlag = userDoc.data().isFounder;
            dbg.isFounderFlag = founderFlag;
            if (founderFlag === true) {
              dbg.step = 'SUCCESS: isFounder flag is true.';
              setPermissionState('allowed');
              dbg.finalPermission = 'allowed';
            } else {
              dbg.step = 'FAILURE: isFounder flag is NOT true.';
              setPermissionState('denied');
              dbg.finalPermission = 'denied';
            }
          } else {
            dbg.step = 'FAILURE: Firestore document not found at users/' + FOUNDER_UID;
            setPermissionState('denied');
            dbg.finalPermission = 'denied';
          }
        } catch (error) {
          dbg.step = 'FAILURE: An error occurred while fetching the Firestore document.';
          dbg.firestoreError = error.message;
          setPermissionState('denied');
          dbg.finalPermission = 'denied';
        }
      } else {
        dbg.step = 'FAILURE: The logged-in user\'s UID does not match the Founder UID.';
        setPermissionState('denied');
        dbg.finalPermission = 'denied';
      }
      setDebugInfo(dbg);
    };

    checkPermission();
  }, [user, isAuthLoading]);

  // Render the special diagnostic UI
  return (
    <div className="container mx-auto p-4 text-white">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard - Diagnostic Mode</h1>
        <p className='text-yellow-400'>Please copy and paste the entire content of the boxes below and send it to me.</p>
        
        <div className="bg-gray-800 p-4 rounded-lg mt-6">
            <h2 className="font-bold text-lg mb-2">1. Authentication Status</h2>
            <pre className='text-sm'>
                Auth Loading: {JSON.stringify(isAuthLoading)}
                <br />
                Auth Error: {authError ? authError.message : 'No Error'}
                <br />
                User UID: {user ? user.uid : 'NO USER LOGGED IN'}
            </pre>
        </div>

        <div className="bg-gray-900 p-4 rounded-lg mt-4">
            <h2 className="font-bold text-lg mb-2">2. Permission Check Trace</h2>
            <pre className='text-sm'>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>

        <div className="bg-blue-900 p-4 rounded-lg mt-4">
            <h2 className="font-bold text-lg mb-2">3. Final Result</h2>
            <p>Calculated Permission: <span className="font-bold text-xl">{permissionState.toUpperCase()}</span></p>
        </div>
    </div>
  );
}
