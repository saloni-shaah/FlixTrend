
"use client";

import { getFirestore, doc, setDoc, collection, addDoc, updateDoc, onSnapshot, deleteDoc, writeBatch, getDoc, FieldValue, serverTimestamp, getDocs } from 'firebase/firestore';
import { app } from './firebaseClient';
import { useAppState } from '@/utils/AppStateContext';

const db = getFirestore(app);

// Function for the caller to initiate a call
export async function createCall(caller: any, callee: any) {
  const { pc } = useAppState.getState();
  if (!pc) {
      console.error("PeerConnection not initialized!");
      return;
  }
  
  const callDocRef = doc(collection(db, 'calls'));
  
  // Get local media
  const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

  // Collect ICE candidates
  const offerCandidatesCollection = collection(callDocRef, 'offerCandidates');
  pc.onicecandidate = event => {
    event?.candidate && addDoc(offerCandidatesCollection, event.candidate.toJSON());
  };

  // Create offer
  const offerDescription = await pc.createOffer();
  await pc.setLocalDescription(offerDescription);

  const offer = {
    sdp: offerDescription.sdp,
    type: offerDescription.type,
  };

  // Create the call document in Firestore
  await setDoc(callDocRef, {
    offer,
    callerId: caller.uid,
    callerName: caller.displayName || caller.email,
    calleeId: callee.uid,
    calleeName: callee.name || callee.username,
    createdAt: serverTimestamp(),
  });

  // Update user documents with the current call ID
  await updateDoc(doc(db, 'users', caller.uid), { currentCallId: callDocRef.id });
  await updateDoc(doc(db, 'users', callee.uid), { currentCallId: callDocRef.id });

  // Listen for the answer
  onSnapshot(callDocRef, (snapshot) => {
    const data = snapshot.data();
    if (pc.currentRemoteDescription?.type !== 'answer' && data?.answer) {
      const answerDescription = new RTCSessionDescription(data.answer);
      pc.setRemoteDescription(answerDescription);
    }
  });

  // Listen for ICE candidates from the callee
  const answerCandidatesCollection = collection(callDocRef, 'answerCandidates');
  onSnapshot(answerCandidatesCollection, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const candidate = new RTCIceCandidate(change.doc.data());
        pc.addIceCandidate(candidate);
      }
    });
  });

  return callDocRef.id;
}


// Function for the callee to answer a call
export async function answerCall(pc: RTCPeerConnection, callData: any) {
    const callDocRef = doc(db, 'calls', callData.id);

    pc.onicecandidate = event => {
        event?.candidate && addDoc(collection(callDocRef, 'answerCandidates'), event.candidate.toJSON());
    };
    
    await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));

    const answerDescription = await pc.createAnswer();
    await pc.setLocalDescription(answerDescription);

    const answer = {
        type: answerDescription.type,
        sdp: answerDescription.sdp,
    };

    await updateDoc(callDocRef, { answer });
}


// Function to end the call
export async function endCall(pc: RTCPeerConnection, callId: string, userId: string) {
    pc.close();

    const callDocRef = doc(db, 'calls', callId);
    const callDocSnap = await getDoc(callDocRef);

    if (!callDocSnap.exists()) {
        // Call document might have already been cleaned up by the other user.
        // Still try to clean up the local user's state.
        const userDocRef = doc(db, 'users', userId);
        try {
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists() && userDocSnap.data().currentCallId === callId) {
                await updateDoc(userDocRef, { currentCallId: null });
            }
        } catch (error) {
            console.error("Error cleaning up user state after call:", error);
        }
        return;
    }

    const callData = callDocSnap.data();

    // Use a batch write to perform multiple operations atomically
    const batch = writeBatch(db);

    // Delete ICE candidates
    const offerCandidatesQuery = await getDocs(collection(callDocRef, 'offerCandidates'));
    offerCandidatesQuery.forEach(doc => batch.delete(doc.ref));
    
    const answerCandidatesQuery = await getDocs(collection(callDocRef, 'answerCandidates'));
    answerCandidatesQuery.forEach(doc => batch.delete(doc.ref));

    // Delete the main call document
    batch.delete(callDocRef);

    // Update user docs to remove the call ID reference for both users
    if (callData?.callerId) {
        batch.update(doc(db, 'users', callData.callerId), { currentCallId: null });
    }
    if (callData?.calleeId) {
        batch.update(doc(db, 'users', callData.calleeId), { currentCallId: null });
    }

    try {
        await batch.commit();
    } catch (error) {
        console.error("Error committing batch delete for call:", error);
    }
}
