
'use client';

import { useEffect, useState } from 'react';
import { getFirestore, collection, query, where, getDocs, doc, onSnapshot } from 'firebase/firestore';
import { app, auth } from '@/utils/firebaseClient';
import { livekitStreamUrl } from '@/utils/livekit';
import { usePathname, useRouter } from 'next/navigation';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';
import { VibeSpaceLoader } from '@/components/VibeSpaceLoader';

const db = getFirestore(app);

export default function LiveStreamPage() {
  const pathname = usePathname();
  const router = useRouter();
  const roomName = pathname.split('/').pop() || '';

  const [post, setPost] = useState<any>(null);
  const [token, setToken] = useState<string | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(currentUser => {
        if (!currentUser) {
            router.push('/login');
        }
        setUser(currentUser);
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!roomName || !user) {
        return;
    }

    let cancelled = false;
    let unsubscribePost: (() => void) | undefined;

    const fetchPost = async () => {
      try {
        const postsRef = collection(db, 'posts');
        const q = query(postsRef, where('livekitRoomName', '==', roomName), where('type', '==', 'live'));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          throw new Error('This live stream does not exist or has ended.');
        }

        if (cancelled) return;

        const postDoc = querySnapshot.docs[0];
        const postData = { id: postDoc.id, ...postDoc.data() };
        setPost(postData);

        unsubscribePost = onSnapshot(doc(db, "posts", postDoc.id), (postSnapshot) => {
            if (!cancelled && postSnapshot.exists()) {
                const updatedPost = postSnapshot.data();
                if (updatedPost.liveStatus === 'ended') router.push('/vibespace');
            }
        });
      } catch (e: any) {
        if (!cancelled) {
          console.error(e);
          setError(e.message);
        }
      } 
    };

    fetchPost();

    return () => {
      cancelled = true;
      unsubscribePost?.();
    };
  }, [roomName, user, router]);

  useEffect(() => {
    if (!post || !user) return;

    const fetchToken = async () => {
      // Prevent duplicate token fetches
      if (token) return;
      
      try {
        const response = await fetch('/api/livekit-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomName: post.livekitRoomName,
            identity: user.uid,
            name: user.displayName || 'Anonymous Viewer',
            isStreamer: post.userId === user.uid,
          }),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Server error occurred.');
        }

        const result = await response.json();
        setToken(result.token);

      } catch (e: any) {
        console.error('Token fetch error:', e);
        setError('Could not connect to the stream.');
      } finally {
        setLoading(false);
      }
    };

    fetchToken();

  }, [post, user, token]);

  if (loading) {
    return <VibeSpaceLoader message="Connecting to stream..." />;
  }

  if (error) {
    return (
        <div className="w-full h-screen flex flex-col items-center justify-center bg-black text-white p-4 text-center">
            <h2 className="text-2xl font-bold text-red-500 mb-4">Stream Unavailable</h2>
            <p className="text-gray-400 mb-8">{error}</p>
            <button onClick={() => router.push('/vibespace')} className="btn-primary">
                Back to VibeSpace
            </button>
        </div>
    );
  }

  if (!token) {
     return <VibeSpaceLoader message="Joining stream..." />;
  }

  return (
    <div className="w-full h-screen bg-black">
      <LiveKitRoom
        token={token}
        serverUrl={livekitStreamUrl}
        data-lk-theme="default"
        style={{ height: '100%' }}
        onDisconnected={() => router.push('/vibespace')}
      >
        <VideoConference />
      </LiveKitRoom>
    </div>
  );
}
