
import { useEffect, useRef, useState } from 'react';
import { getFirestore, doc, onSnapshot, updateDoc, collection, addDoc, deleteDoc } from 'firebase/firestore';
import { app } from '@/utils/firebaseClient';

const firestore = getFirestore(app);

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

        await updateDoc(callDoc, { offer });
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
        // Callee logic is now handled by the answerCall function in AppStateContext
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
