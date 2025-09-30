
'use client';
import { useEffect, useState } from 'react';
import { auth } from '@/utils/firebaseClient'; // Corrected import
import { generateLivekitToken } from '@/ai/flows/generate-livekit-token-flow';
import { LiveKitRoom, VideoConference, formatChatMessageLinks } from '@livekit/components-react';
import '@livekit/components-styles';

export default function BroadcastPage({ params }: { params: { roomName: string } }) {
  const [user, setUser] = useState(auth.currentUser);
  const [token, setToken] = useState<string | null>(null);
  const roomName = decodeURIComponent(params.roomName);

  useEffect(() => {
    // Listen to auth state changes to get the user
    const unsubscribe = auth.onAuthStateChanged(currentUser => {
        setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchToken = async () => {
      try {
        // Correctly call the token generation flow
        const { success, failure } = await generateLivekitToken({
          roomName: roomName,
          identity: user.uid,
          name: user.displayName || user.email || 'Anonymous',
          isStreamer: true, // This is the broadcaster
        });
        
        if (failure) throw new Error(failure);
        setToken(success); // Set the token from the 'success' field

      } catch (error) {
        console.error('Failed to get LiveKit token:', error);
        // Handle error (e.g., show a message to the user)
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
            {/* The VideoConference component provides a full-featured broadcast UI */}
            <VideoConference 
                chatMessageFormatter={formatChatMessageLinks} 
            />
        </LiveKitRoom>
    </div>
  );
}
