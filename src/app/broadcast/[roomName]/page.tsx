
'use client';
import { useEffect, useState } from 'react';
import { auth } from '@/utils/firebaseClient';
import { generateLivekitToken } from '@/ai/flows/generate-livekit-token-flow';
import { LiveKitRoom, VideoConference, formatChatMessageLinks } from '@livekit/components-react';
import '@livekit/components-styles';

export default function BroadcastPage({ params }: { params: { roomName: string } }) {
  const [user, setUser] = useState(auth.currentUser);
  const [token, setToken] = useState<string | null>(null);
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
        const { token: generatedToken } = await generateLivekitToken({
          roomName: roomName,
          identity: user.uid,
          name: user.displayName || user.email || 'Anonymous',
          isStreamer: true, // This is the broadcaster
        });
        
        if (!generatedToken) throw new Error("Failed to generate a valid token.");
        setToken(generatedToken);

      } catch (error) {
        console.error('Failed to get LiveKit token:', error);
      }
    };

    fetchToken();
  }, [user, roomName]);

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
            <VideoConference 
                chatMessageFormatter={formatChatMessageLinks} 
            />
        </LiveKitRoom>
    </div>
  );
}
