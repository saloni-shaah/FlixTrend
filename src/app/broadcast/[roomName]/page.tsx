
'use client';
import { useEffect, useState } from 'react';
import { auth } from '@/utils/firebaseClient';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';

export default function BroadcastPage({ params }: { params: { roomName: string } }) {
  const [user, setUser] = useState(auth.currentUser);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const roomName = params.roomName ? decodeURIComponent(params.roomName) : '';

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(currentUser => {
        setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !roomName) return;

    const fetchToken = async () => {
      try {
        const response = await fetch('/api/livekit-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                roomName: roomName,
                identity: user.uid,
                name: user.displayName || user.email || 'Anonymous',
                isStreamer: true, // This is the broadcaster
            }),
        });

        const result = await response.json();
        if (result.error || !result.token) {
            throw new Error(result.error || "Failed to generate a valid token.");
        }
        setToken(result.token);

      } catch (e: any) {
        console.error('Failed to get LiveKit token:', e);
        setError(e.message);
      }
    };

    fetchToken();
  }, [user, roomName]);

  if (error) {
    return <div className="w-full h-screen flex items-center justify-center bg-black text-red-400 p-4 text-center">Error connecting to broadcast: {error}</div>;
  }
  
  if (!token) {
    return <div className="w-full h-screen flex items-center justify-center bg-black text-white">Connecting to broadcast...</div>;
  }

  return (
    <div style={{ height: '100vh' }}>
        <LiveKitRoom
            video={true}
            audio={true}
            token={token}
            serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_WS_URL!}
            data-lk-theme="default"
            style={{ height: '100%' }}
        >
            <VideoConference />
        </LiveKitRoom>
    </div>
  );
}
