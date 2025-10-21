'use client';

import { getFirestore, collection, addDoc, serverTimestamp, doc, deleteDoc, writeBatch, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { app } from './firebaseClient';
import { auth } from './firebaseClient';

const db = getFirestore(app);

/**
 * Creates a new call document in Firestore and updates the caller's user document to initiate the signaling process.
 * The callee's document will be updated by the onCallCreated Cloud Function.
 * @param caller The user initiating the call.
 * @param callee The user being called.
 * @returns The ID of the newly created call document.
 */
export async function createCall(caller: any, callee: any): Promise<string | null> {
  const currentUser = auth.currentUser;
  if (!currentUser || !caller || !callee) return null;

  try {
    // 1. Create the call document in a `calls` collection
    const callCollection = collection(db, 'calls');
    const callDocRef = await addDoc(callCollection, {
      callerId: caller.uid,
      callerName: caller.displayName || caller.email,
      calleeId: callee.uid,
      calleeName: callee.name || callee.username,
      createdAt: serverTimestamp(),
      status: 'pending', // Status: pending, active, ended
    });

    // 2. Update ONLY the caller's user document with the currentCallId
    const callerUserDocRef = doc(db, 'users', caller.uid);
    await updateDoc(callerUserDocRef, { currentCallId: callDocRef.id });

    // The `onCallCreated` Cloud Function will now handle notifying the callee
    // and updating their `currentCallId`.

    return callDocRef.id;
  } catch (error) {
    console.error("Error creating call:", error);
    // If something fails, try to clean up the call document if it was created
    // (This part is complex and might be better handled by a cleanup function)
    return null;
  }
}

/**
 * Cleans up all Firestore data associated with a call after it has ended.
 * This includes the call document and its `offerCandidates` and `answerCandidates` subcollections.
 * @param callId The ID of the call to clean up.
 */
export async function cleanUpCall(callId: string) {
    if (!callId) return;

    const callDocRef = doc(db, 'calls', callId);

    try {
        // Check if doc exists before trying to delete, to prevent errors if already deleted
        const callDocSnap = await getDoc(callDocRef);
        if (!callDocSnap.exists()) {
            console.log(`Call document ${callId} does not exist. Already cleaned up.`);
            return;
        }

        const batch = writeBatch(db);

        // Delete subcollections
        const offerCandidatesRef = collection(callDocRef, 'offerCandidates');
        const answerCandidatesRef = collection(callDocRef, 'answerCandidates');

        const offerCandidatesSnap = await getDocs(offerCandidatesRef);
        offerCandidatesSnap.forEach(doc => batch.delete(doc.ref));

        const answerCandidatesSnap = await getDocs(answerCandidatesRef);
        answerCandidatesSnap.forEach(doc => batch.delete(doc.ref));
        
        // Delete the main call document
        batch.delete(callDocRef);
        
        await batch.commit();
    } catch (error) {
        console.error(`Error cleaning up call ${callId}:`, error);
    }
}
