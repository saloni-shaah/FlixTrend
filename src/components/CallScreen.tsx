
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Phone, Video, VideoOff } from 'lucide-react';
import { useAppState } from '@/utils/AppStateContext';
import { auth } from '@/utils/firebaseClient';

export function CallScreen({ call }: { call: any }) {
  // All call logic and state now comes from the central AppStateContext.
  const { pc, answerCall, handleEndCall } = useAppState();
  
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
            if (!pc.getSenders().find(s => s.track === track)) {
              pc.addTrack(track, stream);
            }
          });

          pc.ontrack = (event) => {
            event.streams[0].getTracks().forEach((track) => {
              remote.addTrack(track);
            });
          };
        }
      } catch (error) {
          console.error("Error accessing media devices:", error);
      }
    };

    startStreams();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pc]);

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
      
      {/* Show a placeholder until the remote stream is available */}
      {remoteStream?.getTracks().length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
              <div className="w-24 h-24 rounded-full bg-gray-700 animate-pulse"></div>
              <p className="mt-4 animate-pulse">Connecting to {call.calleeName || 'user'}...</p>
          </div>
      )}

      <video ref={localVideoRef} autoPlay playsInline muted className="absolute bottom-6 right-6 w-32 h-48 object-cover rounded-lg border-2 border-accent-cyan" />
      
      {isCallee && !hasAnswered && (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-6">
            <h2 className="text-3xl font-bold animate-pulse">Incoming Call from {call.callerName}...</h2>
            <div className="flex gap-8">
                <button onClick={answerCall} className="p-4 bg-green-500 rounded-full text-white"><Phone size={32}/></button>
                <button onClick={handleEndCall} className="p-4 bg-red-500 rounded-full text-white"><Phone size={32}/></button>
            </div>
        </div>
      )}

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
