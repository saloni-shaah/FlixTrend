
'use client';
import { useEffect, useState } from 'react';
import { auth } from '@/utils/firebaseClient'; // Corrected import path
import { generateLivekitToken } from '@/ai/flows/generate-livekit-token-flow';
import { LiveKitRoom, ParticipantTile } from '@livekit/components-react';
import '@livekit/components-styles';

/**
* LiveStream component for VIEWERS.
* This component connects to a LiveKit room and displays the broadcast.
*/
export function LiveStream({ roomName, streamerName }: { roomName: string, streamerName: string }) {
  const [user, setUser] = useState(auth.currentUser);
  const [token, setToken] = useState<string | null>(null);

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
        const { success, failure } = await generateLivekitToken({
          roomName: roomName,
          identity: user.uid,
          name: user.displayName || user.email || 'AnonymousViewer',
          isStreamer: false
        });

        if (failure) throw new Error(failure);
        setToken(success);

      } catch (error) {
        console.error('Error generating LiveKit token:', error);
      }
    };

    fetchToken();
  }, [user, roomName]);

  if (!token) {
    return <div className="w-full h-48 bg-black/50 flex items-center justify-center text-white">Connecting to stream...</div>;
  }

  return (
    <LiveKitRoom
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      token={token}
      connect={true}
      style={{ height: '100%' }}
    >
      <ParticipantTile />
    </LiveKitRoom>
  );
}
