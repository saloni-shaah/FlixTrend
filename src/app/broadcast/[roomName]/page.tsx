
'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation'; // Import useParams
import { auth } from '@/utils/firebaseClient';
import { getFirestore, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';

const db = getFirestore(auth.app);

export default function BroadcastPage() { // Remove params from props
  const params = useParams(); // Get params from the hook
  const [user, setUser] = useState(auth.currentUser);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Handle roomName being a string or string[]
  const roomNameParam = Array.isArray(params.roomName) ? params.roomName[0] : params.roomName;
  const roomName = roomNameParam ? decodeURIComponent(roomNameParam) : '';

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

  const handleDisconnect = async () => {
    if (!roomName) return;
    try {
      const postsRef = collection(db, 'posts');
      const q = query(postsRef, where('livekitRoomName', '==', roomName));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const postDoc = querySnapshot.docs[0];
        await updateDoc(postDoc.ref, { liveStatus: 'ended' });
      }
    } catch (error) {
      console.error("Error updating post status:", error);
    }
  };

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
            onDisconnected={handleDisconnect}
        >
            <VideoConference />
        </LiveKitRoom>
    </div>
  );
}
