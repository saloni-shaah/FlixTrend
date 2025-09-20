
"use client";
import React, { useState, useEffect, useRef } from 'react';
import { generateLivekitToken } from '@/ai/flows/generate-livekit-token-flow';
import {
  Room,
} from 'livekit-client';
import { auth } from '@/utils/firebaseClient';
import { Video, Mic, MicOff, VideoOff, LogOut, Pause, Play } from 'lucide-react';

export function LiveStream({ title, onStreamEnd }: { title: string, onStreamEnd: () => void }) {
  const [room, setRoom] = useState<Room | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const user = auth.currentUser;
  
  useEffect(() => {
    if (!user) {
      setError("You must be logged in to stream.");
      return;
    }

    const roomName = `${user.uid}-${Date.now()}`;
    const identity = user.uid;
    const name = user.displayName || user.email || 'Streamer';

    generateLivekitToken({ roomName, identity, name, isStreamer: true })
      .then(data => setToken(data.token))
      .catch(err => {
        console.error("Error getting LiveKit token:", err);
        setError("Could not connect to the streaming service.");
      });
      
    const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
    });
    setRoom(newRoom);

    return () => {
        newRoom.disconnect();
    }
  }, [user]);

  useEffect(() => {
    if (token && room && room.state !== 'connected') {
      const connectToRoom = async () => {
        try {
          await room.connect(process.env.NEXT_PUBLIC_LIVEKIT_WS_URL!, token);
          await room.localParticipant.setCameraEnabled(true);
          await room.localParticipant.setMicrophoneEnabled(true);
          
          room.localParticipant.tracks.forEach(publication => {
              if (publication.track?.kind === 'video' && localVideoRef.current) {
                publication.track.attach(localVideoRef.current);
              }
          });

        } catch (err) {
          console.error("Failed to connect to LiveKit room", err);
          setError("Failed to connect to the stream.");
        }
      };
      connectToRoom();
    }
  }, [token, room]);

  const handleToggleAudio = async () => {
      if (room) {
          const isEnabled = room.localParticipant.isMicrophoneEnabled;
          await room.localParticipant.setMicrophoneEnabled(!isEnabled);
          setIsMuted(isEnabled);
      }
  };

  const handleToggleVideo = async () => {
      if (room) {
          const isEnabled = room.localParticipant.isCameraEnabled;
          await room.localParticipant.setCameraEnabled(!isEnabled);
          setIsVideoOff(isEnabled);
      }
  };
  
  const handleTogglePause = () => {
      if(room) {
          const isEnabled = room.localParticipant.isCameraEnabled;
          room.localParticipant.setCameraEnabled(isPaused); // re-enable if paused
          setIsPaused(!isPaused);
      }
  }

  const handleEndStream = async () => {
    if (room) {
      await room.disconnect();
    }
    onStreamEnd();
  };

  if (error) {
    return <div className="flex items-center justify-center h-screen bg-black text-red-500">{error}</div>;
  }
  
  if (!token) {
    return <div className="flex items-center justify-center h-screen bg-black text-white">Getting stream ready...</div>;
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white">
        <div className="absolute top-4 left-4 z-10">
            <h1 className="text-2xl font-bold drop-shadow-lg">{title}</h1>
            <div className="flex items-center gap-2 mt-1">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                <span className="font-bold">LIVE</span>
            </div>
        </div>

        <div className="relative w-full h-full">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-contain" />
            {isPaused && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center">
                    <Pause size={64} className="mb-4"/>
                    <h2 className="text-3xl font-bold">Stream Paused</h2>
                    <p className="text-lg text-gray-300">Be Right Back</p>
                </div>
            )}
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/50 p-3 rounded-full z-10">
            <button onClick={handleToggleAudio} className={`p-3 rounded-full ${isMuted ? 'bg-red-500' : 'bg-gray-600'}`}>
                {isMuted ? <MicOff /> : <Mic />}
            </button>
             <button onClick={handleToggleVideo} className={`p-3 rounded-full ${isVideoOff ? 'bg-red-500' : 'bg-gray-600'}`}>
                {isVideoOff ? <VideoOff /> : <Video />}
            </button>
             <button onClick={handleTogglePause} className={`p-3 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-gray-600'}`}>
                {isPaused ? <Play /> : <Pause />}
            </button>
            <button onClick={handleEndStream} className="p-4 bg-red-600 rounded-full">
                <LogOut />
            </button>
        </div>
    </div>
  );
}
