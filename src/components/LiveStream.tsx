
"use client";
import React, { useState, useEffect, useRef } from 'react';
import { generateLivekitToken } from '@/ai/flows/generate-livekit-token-flow';
import {
  Room, LocalVideoTrack, Participant,
} from 'livekit-client';
import { auth, db } from '@/utils/firebaseClient';
import { Video, Mic, MicOff, VideoOff, LogOut, Pause, Play, ArrowLeft } from 'lucide-react';
import { doc, addDoc, collection, serverTimestamp, deleteDoc } from 'firebase/firestore';

export function LiveStream({ title, onStreamEnd }: { title: string, onStreamEnd: () => void }) {
  const [room, setRoom] = useState<Room | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const user = auth.currentUser;
  const [livePostId, setLivePostId] = useState<string | null>(null);
  
  useEffect(() => {
    if (!user) {
      setError("You must be logged in to stream.");
      return;
    }

    const roomName = `${user.uid}-${Date.now()}`;
    const identity = user.uid;
    const name = user.displayName || user.email || 'Streamer';
    
    const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
    });
    setRoom(newRoom);
    
    // Request camera access first
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
         if (localVideoRef.current) {
            const videoTrack = stream.getVideoTracks()[0];
            const localVideo = new LocalVideoTrack(videoTrack);
            localVideo.attach(localVideoRef.current);
        }
        
        // Only get token if camera access is successful
        generateLivekitToken({ roomName, identity, name, isStreamer: true })
          .then(data => setToken(data.token))
          .catch(err => {
            console.error("Error getting LiveKit token:", err);
            setError("Could not connect to the streaming service.");
          });

      })
      .catch(err => {
        console.error("Camera/Mic access error:", err);
        setError("Camera and Microphone access is required to go live. Please check your browser permissions.");
      });

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
          
          room.localParticipant.videoTracks.forEach(publication => {
              if (publication.track?.kind === 'video' && localVideoRef.current) {
                publication.track.attach(localVideoRef.current);
              }
          });
          
          // Create the "live" post in Firestore only after successful connection
           const postDocRef = await addDoc(collection(db, "posts"), {
                userId: user!.uid,
                displayName: user!.displayName,
                username: user!.displayName, // Fallback, replace with actual username if available
                avatar_url: user!.photoURL,
                type: 'live',
                content: title,
                livekitRoom: room.name,
                createdAt: serverTimestamp(),
            });
            setLivePostId(postDocRef.id);

        } catch (err) {
          console.error("Failed to connect to LiveKit room", err);
          setError("Failed to connect to the stream.");
        }
      };
      connectToRoom();
    }
  }, [token, room, user, title]);

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
    if (livePostId) {
      await deleteDoc(doc(db, "posts", livePostId));
    }
    onStreamEnd();
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-center text-red-400 p-4">
          <h2 className="text-2xl font-bold mb-4">Stream Error</h2>
          <p>{error}</p>
          <button onClick={onStreamEnd} className="btn-glass mt-8 flex items-center gap-2">
            <ArrowLeft size={16}/> Back to Home
          </button>
      </div>
    );
  }
  
  if (!token) {
    return <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-4 text-center">
        <h2 className="text-2xl font-bold animate-pulse">Checking permissions...</h2>
        <p className="mt-2 text-gray-300">Requesting camera and microphone access to start your live stream.</p>
    </div>;
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
