
"use client";
import React, { useState } from 'react';
import { Radio, Loader2 } from 'lucide-react';
import { useAppState } from '@/utils/AppStateContext';
import { useRouter } from 'next/navigation';

export function LivePostForm({ data, onDataChange }: { data: any, onDataChange: (data: any) => void }) {
  const { currentUserProfile } = useAppState();
  const router = useRouter();
  const [isGoingLive, setIsGoingLive] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onDataChange({ ...data, [e.target.name]: e.target.value });
  };

  const handleGoLive = async () => {
    if (!data.title) {
        setError('Please enter a title for your live stream.');
        return;
    }

    if (!currentUserProfile) {
        setError('You must be logged in to start a live stream.');
        return;
    }
    
    setIsGoingLive(true);
    setError('');

    try {
        const roomName = `${currentUserProfile.username}-${Date.now()}`;
        const response = await fetch('/api/livekit-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                roomName: roomName,
                identity: currentUserProfile.uid,
                name: currentUserProfile.displayName,
                isStreamer: true,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to get live kit token');
        }

        const { token } = await response.json();

        // Redirect to the broadcast page with the token and room name
        router.push(`/broadcast/${roomName}`);

    } catch (err) {
        setError('Something went wrong. Please try again.');
        setIsGoingLive(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
        <div className="flex flex-col items-center gap-4 text-center">
            <Radio className="text-red-500 animate-pulse" size={48} />
            <h3 className="text-xl font-bold text-white">You're about to go live!</h3>
            <p className="text-sm text-gray-400">Give your stream a title to let people know what's up.</p>
            <input
                type="text"
                name="title"
                className="input-glass w-full"
                placeholder="Live Stream Title (e.g., Sunset Vibes, Q&A)"
                value={data.title || ''}
                onChange={handleChange}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button 
              className="btn-primary bg-red-600 hover:bg-red-700 w-full mt-4 disabled:opacity-50"
              onClick={handleGoLive}
              disabled={isGoingLive}
            >
                {isGoingLive ? <Loader2 className="animate-spin mx-auto"/> : 'Go Live'}
            </button>
        </div>
    </div>
  );
}
