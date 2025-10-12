'use client';

import { getFirestore, collection, addDoc, serverTimestamp, doc, deleteDoc, writeBatch, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { app } from './firebaseClient';
import { auth } from './firebaseClient';

const db = getFirestore(app);

/**
 * Creates a new call document in Firestore and updates user documents to initiate the signaling process.
 * @param caller The user initiating the call.
 * @param callee The user being called.
 * @returns The ID of the newly created call document.
 */
export async function createCall(caller: any, callee: any): Promise<string | null> {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;

  try {
    // Use a batch write to ensure atomicity
    const batch = writeBatch(db);

    // 1. Create the call document
    const callCollection = collection(db, 'calls');
    const callDocRef = doc(callCollection); // Create a reference with a new ID
    batch.set(callDocRef, {
      callerId: caller.uid,
      callerName: caller.displayName || caller.email,
      calleeId: callee.uid,
      calleeName: callee.name || callee.username,
      createdAt: serverTimestamp(),
      status: 'pending',
    });

    // 2. Update both users' documents with the currentCallId
    const callerUserDocRef = doc(db, 'users', caller.uid);
    batch.update(callerUserDocRef, { currentCallId: callDocRef.id });

    const calleeUserDocRef = doc(db, 'users', callee.uid);
    batch.update(calleeUserDocRef, { currentCallId: callDocRef.id });

    await batch.commit();

    return callDocRef.id;
  } catch (error) {
    console.error("Error creating call:", error);
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
