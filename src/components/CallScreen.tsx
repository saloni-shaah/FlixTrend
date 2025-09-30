
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Phone, Video, VideoOff } from 'lucide-react';
import { useAppState } from '@/utils/AppStateContext';
import { auth } from '@/utils/firebaseClient';

export function CallScreen({ call }: { call: any }) {
  // CORRECTED: All call logic and state now comes from the central AppStateContext.
  const { pc, closeCall, answerCall, handleEndCall } = useAppState();
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const currentUser = auth.currentUser;
  const isCallee = currentUser?.uid === call.calleeId;
  const hasAnswered = !!call.answer;

  useEffect(() => {
    const startStreams = async () => {
      try {
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

        if (pc) {
          stream.getTracks().forEach((track) => {
            // Check if the track is already added before adding it
            if (!pc.getSenders().find(s => s.track === track)) {
              pc.addTrack(track, stream);
            }
          });

          pc.ontrack = (event) => {
            event.streams[0].getTracks().forEach((track) => {
              remote.addTrack(track);
            });
            if (remoteVideoRef.current) {
              remoteVideoRef.current.play().catch(e => console.error("Error playing remote stream:", e));
            }
          };
        }
      } catch (error) {
          console.error("Error accessing media devices:", error);
          // Handle errors (e.g., user denies permission) gracefully
      }
    };

    startStreams();

    // Cleanup function to stop tracks when the component unmounts or call ends
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  // We only want to run this once, pc is now stable from context
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pc]);

  // Simplified toggles
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
      <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
      <video ref={localVideoRef} autoPlay playsInline muted className="absolute bottom-6 right-6 w-32 h-48 object-cover rounded-lg border-2 border-accent-cyan" />
      
      {/* Incoming call screen for the person being called */}
      {isCallee && !hasAnswered && (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-6">
            <h2 className="text-3xl font-bold animate-pulse">Incoming Call from {call.callerName}...</h2>
            <div className="flex gap-8">
                {/* CORRECTED: Uses answerCall from context */}
                <button onClick={answerCall} className="p-4 bg-green-500 rounded-full text-white"><Phone size={32}/></button>
                {/* CORRECTED: Uses handleEndCall from context */}
                <button onClick={handleEndCall} className="p-4 bg-red-500 rounded-full text-white"><Phone size={32}/></button>
            </div>
        </div>
      )}

      {/* Call Controls visible to both users during the call */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-black/50 p-4 rounded-full">
        <button onClick={toggleMute} className={`p-3 rounded-full ${isMuted ? 'bg-red-500' : 'bg-gray-600'}`}>
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
        <button onClick={toggleVideo} className={`p-3 rounded-full ${isVideoOff ? 'bg-red-500' : 'bg-gray-600'}`}>
            {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
        </button>
        {/* CORRECTED: Uses handleEndCall from context */}
        <button onClick={handleEndCall} className="p-4 bg-red-500 rounded-full">
          <Phone size={24} />
        </button>
      </div>
    </div>
  );
}
