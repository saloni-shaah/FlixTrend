
'use client';
import { useEffect, useState } from 'react';
import { auth } from '@/utils/firebaseClient';
import { LiveKitRoom, ParticipantTile } from '@livekit/components-react';
import '@livekit/components-styles';

/**
* LiveStreamViewer component for VIEWERS.
* This component connects to a LiveKit room and displays the broadcast.
*/
export function LiveStreamViewer({ roomName, streamerName }: { roomName: string, streamerName: string }) {
  const [user, setUser] = useState(auth.currentUser);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Listen to auth state changes
    const unsubscribe = auth.onAuthStateChanged(currentUser => {
        setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

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
            name: user.displayName || user.email || 'AnonymousViewer',
            isStreamer: false
          }),
        });

        const result = await response.json();
        if (result.error || !result.token) {
          throw new Error(result.error || "Failed to generate token.");
        }

        setToken(result.token);

      } catch (error) {
        console.error('Error generating LiveKit token:', error);
        setError("Could not connect to the stream.");
      }
    };

    fetchToken();
  }, [user, roomName]);

  if (error) {
    return <div className="w-full h-48 bg-black/50 flex items-center justify-center text-red-500">{error}</div>;
  }

  if (!token) {
    return <div className="w-full h-48 bg-black/50 flex items-center justify-center text-white">Connecting to stream...</div>;
  }

  return (
    <LiveKitRoom
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_WS_URL}
      token={token}
      connect={true}
      style={{ height: '100%' }}
    >
      <ParticipantTile />
    </LiveKitRoom>
  );
}
