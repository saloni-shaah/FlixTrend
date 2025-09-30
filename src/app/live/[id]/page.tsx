
'use client';
import { useEffect, useRef, useState } from 'react';
import { useSignal } from '@/hooks/useSignal';
import { useSearchParams } from 'next/navigation';

export default function LivePage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const isCaller = searchParams.get('caller') === 'true';
  const callId = params.id;

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const {
    localStream,
    remoteStream,
    isConnecting,
    error,
    toggleMute,
    toggleVideo,
    hangUp,
  } = useSignal({
    callId,
    isCaller,
  });

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleToggleMute = () => {
    toggleMute();
    setIsMuted((prev) => !prev);
  };

  const handleToggleVideo = () => {
    toggleVideo();
    setIsVideoOff((prev) => !prev);
  };

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
      <div className="relative w-full h-full">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="absolute bottom-4 right-4 w-1/4 max-w-xs rounded-lg shadow-lg"
        />
      </div>
      <div className="absolute bottom-10 flex gap-4">
        <button
          onClick={handleToggleMute}
          className={`px-4 py-2 rounded-full ${
            isMuted ? 'bg-red-500' : 'bg-gray-700'
          }`}
        >
          {isMuted ? 'Unmute' : 'Mute'}
        </button>
        <button
          onClick={handleToggleVideo}
          className={`px-4 py-2 rounded-full ${
            isVideoOff ? 'bg-red-500' : 'bg-gray-700'
          }`}
        >
          {isVideoOff ? 'Video On' : 'Video Off'}
        </button>
        <button
          onClick={hangUp}
          className="px-4 py-2 bg-red-600 rounded-full"
        >
          Hang Up
        </button>
      </div>
      {isConnecting && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <p>Connecting...</p>
        </div>
      )}
    </div>
  );
}
