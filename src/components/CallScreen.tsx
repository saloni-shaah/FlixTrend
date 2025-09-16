
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { getFirestore, doc, onSnapshot, updateDoc, collection, addDoc } from 'firebase/firestore';
import { auth, app } from '@/utils/firebaseClient';
import { Mic, MicOff, Phone, Video, VideoOff } from 'lucide-react';
import { answerCall, endCall } from '@/utils/callService';
import { useAppState } from '@/utils/AppStateContext';

const db = getFirestore(app);

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

export function CallScreen({ call }: { call: any }) {
  const [pc, setPc] = useState<RTCPeerConnection | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const { closeCall } = useAppState();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const currentUser = auth.currentUser;
  const isCaller = currentUser?.uid === call.callerId;
  const isCallee = currentUser?.uid === call.calleeId;
  const hasAnswered = !!call.answer;

  useEffect(() => {
    const peerConnection = new RTCPeerConnection(servers);
    setPc(peerConnection);

    const startStreams = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const remote = new MediaStream();
      setRemoteStream(remote);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remote;
      }

      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
      });

      peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          remote.addTrack(track);
        });
      };
    };

    startStreams();

    return () => {
      peerConnection.close();
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Firestore signaling logic
  useEffect(() => {
    if (!pc || !currentUser) return;

    const callDocRef = doc(db, 'calls', call.id);
    const answerCandidates = collection(callDocRef, 'answerCandidates');
    const offerCandidates = collection(callDocRef, 'offerCandidates');

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const candidatesCollection = isCaller ? offerCandidates : answerCandidates;
        addDoc(candidatesCollection, event.candidate.toJSON());
      }
    };

    // Listen for remote answer
    if (isCaller && !hasAnswered) {
      const unsubscribe = onSnapshot(callDocRef, (snapshot) => {
        const data = snapshot.data();
        if (data?.answer && pc.currentRemoteDescription?.type !== 'answer') {
          const answerDescription = new RTCSessionDescription(data.answer);
          pc.setRemoteDescription(answerDescription);
        }
      });
      return unsubscribe;
    }
    
    // Listen for ICE candidates
    const candidatesCollection = isCaller ? answerCandidates : offerCandidates;
    const unsubscribeCandidates = onSnapshot(candidatesCollection, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const candidate = new RTCIceCandidate(change.doc.data());
          pc.addIceCandidate(candidate);
        }
      });
    });

    return () => unsubscribeCandidates();

  }, [pc, call.id, isCaller, hasAnswered, currentUser]);

  const handleAnswerCall = async () => {
    if (pc) {
      await answerCall(pc, call);
    }
  };

  const handleEndCall = async () => {
    if(pc && currentUser) {
        await endCall(pc, call.id, currentUser.uid);
        closeCall(); // Immediately close the UI
    }
  };

  const toggleMute = () => {
    if (localStream) {
        localStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
        setIsMuted(!isMuted);
    }
  }

  const toggleVideo = () => {
    if (localStream) {
        localStream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
        setIsVideoOff(!isVideoOff);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col text-white">
      {/* Remote Video */}
      <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />

      {/* Local Video */}
      <video ref={localVideoRef} autoPlay playsInline muted className="absolute bottom-6 right-6 w-32 h-48 object-cover rounded-lg border-2 border-accent-cyan" />
      
      {isCallee && !hasAnswered && (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-6">
            <h2 className="text-3xl font-bold animate-pulse">Incoming Call from {call.callerName}...</h2>
            <div className="flex gap-8">
                <button onClick={handleAnswerCall} className="p-4 bg-green-500 rounded-full text-white"><Phone size={32}/></button>
                <button onClick={handleEndCall} className="p-4 bg-red-500 rounded-full text-white"><Phone size={32}/></button>
            </div>
        </div>
      )}

      {/* Call Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-black/50 p-4 rounded-full">
        <button onClick={toggleMute} className={`p-3 rounded-full ${isMuted ? 'bg-red-500' : 'bg-gray-600'}`}>
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
        <button onClick={toggleVideo} className={`p-3 rounded-full ${isVideoOff ? 'bg-red-500' : 'bg-gray-600'}`}>
            {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
        </button>
        <button onClick={handleEndCall} className="p-4 bg-red-500 rounded-full">
          <Phone size={24} />
        </button>
      </div>
    </div>
  );
}
