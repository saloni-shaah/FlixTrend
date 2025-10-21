
"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Room } from 'livekit-client';
import { auth } from '@/utils/firebaseClient';
import { Volume2, VolumeX, Users } from 'lucide-react';

export function StreamViewer({ streamPost }: { streamPost: any }) {
  const [room, setRoom] = useState<Room | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [participantCount, setParticipantCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user || !streamPost) {
      setError("Stream information is missing.");
      return;
    }

    const roomName = streamPost.livekitRoom;
    const identity = user.uid;
    const name = user.displayName || user.email || 'Viewer';

    const fetchToken = async () => {
        try {
            const response = await fetch('/api/livekit-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomName: roomName,
                    identity: identity,
                    name: name,
                    isStreamer: false
                })
            });
            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }
            setToken(data.token);
        } catch (err: any) {
            console.error("Error getting LiveKit token for viewer:", err);
            setError("Could not connect to the stream.");
        }
    };
    
    fetchToken();

  }, [user, streamPost]);

  useEffect(() => {
    if (token) {
      const newRoom = new Room();
      setRoom(newRoom);

      newRoom.on('trackSubscribed', (track, publication, participant) => {
        if (track.kind === 'video' && videoRef.current) {
          track.attach(videoRef.current);
        }
      });
      
      newRoom.on('participantConnected', () => setParticipantCount(newRoom.numParticipants + 1));
      newRoom.on('participantDisconnected', () => setParticipantCount(newRoom.numParticipants + 1));

      const connectToRoom = async () => {
        try {
          await newRoom.connect(process.env.NEXT_PUBLIC_LIVEKIT_WS_URL!, token);
          setParticipantCount(newRoom.numParticipants + 1);
        } catch (err) {
          console.error("Failed to connect as viewer", err);
          setError("Stream not found or has ended.");
        }
      };

      connectToRoom();

      return () => {
        newRoom.disconnect();
      };
    }
  }, [token]);

  return (
    <div className="relative w-full h-full bg-black rounded-xl overflow-hidden">
        <video ref={videoRef} autoPlay playsInline muted={isMuted} className="w-full h-full object-contain"/>

        {error && <div className="absolute inset-0 flex items-center justify-center text-red-500 bg-black/70">{error}</div>}

        <div className="absolute top-2 left-2 flex items-center gap-4">
            <div className="flex items-center gap-2 p-2 bg-black/50 rounded-lg">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-white font-bold text-sm">LIVE</span>
            </div>
             <div className="flex items-center gap-2 p-2 bg-black/50 rounded-lg text-white text-sm">
                <Users size={16}/>
                <span>{participantCount}</span>
            </div>
        </div>

        <div className="absolute bottom-2 right-2 flex items-center gap-2">
            <button onClick={() => setIsMuted(m => !m)} className="p-2 bg-black/50 rounded-full text-white">
                {isMuted ? <VolumeX size={18}/> : <Volume2 size={18}/>}
            </button>
        </div>
    </div>
  );
}
