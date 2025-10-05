
import { useEffect, useRef, useState } from 'react';
import { getFirestore } from 'firebase/firestore'; // Import getFirestore
import { app } from '@/utils/firebaseClient'; // Import your firebase app
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  collection,
  addDoc,
  deleteDoc,
} from 'firebase/firestore';

const firestore = getFirestore(app); // Initialize firestore

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

export const useSignal = ({ callId, isCaller }: { callId: string; isCaller: boolean }) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pc = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);
        setRemoteStream(new MediaStream());
      } catch (err: any) {
        setError(`Failed to get media devices: ${err.message}`);
      }
    };
    start();
  }, []);

  useEffect(() => {
    if (!localStream || !callId) return;

    pc.current = new RTCPeerConnection(servers);

    localStream.getTracks().forEach((track) => {
      pc.current?.addTrack(track, localStream);
    });

    pc.current.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream?.addTrack(track);
      });
    };

    const callDoc = doc(firestore, 'calls', callId);

    if (isCaller) {
      const answerCandidates = collection(callDoc, 'answerCandidates');
      const offerCandidates = collection(callDoc, 'offerCandidates');

      pc.current.onicecandidate = (event) => {
        event.candidate && addDoc(offerCandidates, event.candidate.toJSON());
      };

      const createOffer = async () => {
        const offerDescription = await pc.current?.createOffer();
        await pc.current?.setLocalDescription(offerDescription);

        const offer = {
          sdp: offerDescription?.sdp,
          type: offerDescription?.type,
        };

        await setDoc(callDoc, { offer });
      };

      createOffer();

      onSnapshot(callDoc, (snapshot) => {
        const data = snapshot.data();
        if (!pc.current?.currentRemoteDescription && data?.answer) {
          const answerDescription = new RTCSessionDescription(data.answer);
          pc.current?.setRemoteDescription(answerDescription);
        }
      });

      onSnapshot(answerCandidates, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const candidate = new RTCIceCandidate(change.doc.data());
            pc.current?.addIceCandidate(candidate);
          }
        });
      });
    } else {
      const offerCandidates = collection(callDoc, 'offerCandidates');
      const answerCandidates = collection(callDoc, 'answerCandidates');

      pc.current.onicecandidate = (event) => {
        event.candidate && addDoc(answerCandidates, event.candidate.toJSON());
      };

      const answerCall = async () => {
        const callSnapshot = await getDoc(callDoc);
        if (callSnapshot.exists()) {
          const callData = callSnapshot.data();
          if (callData.offer) {
            await pc.current?.setRemoteDescription(
              new RTCSessionDescription(callData.offer)
            );

            const answerDescription = await pc.current?.createAnswer();
            await pc.current?.setLocalDescription(answerDescription);

            const answer = {
              type: answerDescription?.type,
              sdp: answerDescription?.sdp,
            };

            await updateDoc(callDoc, { answer });
          }
        }
      };

      answerCall();

      onSnapshot(offerCandidates, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            let data = change.doc.data();
            pc.current?.addIceCandidate(new RTCIceCandidate(data));
          }
        });
      });
    }

    setIsConnecting(false);

    return () => {
      pc.current?.close();
    };
  }, [localStream, callId, isCaller, remoteStream]);

  const hangUp = async () => {
    pc.current?.close();
    localStream?.getTracks().forEach((track) => track.stop());
    remoteStream?.getTracks().forEach((track) => track.stop());

    const callDocRef = doc(firestore, 'calls', callId);
    await deleteDoc(callDocRef).catch((err) => {
        console.error("Error deleting call document:", err);
    });
    window.location.href = '/signal';
  };

  const toggleMute = () => {
    localStream?.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
  };

  const toggleVideo = () => {
    localStream?.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
  };

  return { localStream, remoteStream, isConnecting, error, hangUp, toggleMute, toggleVideo };
};
