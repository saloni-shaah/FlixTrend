"use client";
import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query as firestoreQuery, onSnapshot, where } from 'firebase/firestore';
import { app } from '@/utils/firebaseClient';
import { Music } from 'lucide-react';

const db = getFirestore(app);

export function UserPlaylists({ userId }: { userId: string }) {
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = firestoreQuery(collection(db, "playlists"), where("ownerId", "==", userId));
        const unsub = onSnapshot(q, (snapshot) => {
            const playlistsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Sort client-side
            playlistsData.sort((a:any, b:any) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));
            setPlaylists(playlistsData);
            setLoading(false);
        });
        return () => unsub();
    }, [userId]);

    if (loading) return <div className="text-gray-400 text-center mt-16 animate-pulse">Loading playlists...</div>
    
    if (playlists.length === 0) {
        return (
            <div className="text-gray-400 text-center mt-16">
                <div className="text-4xl mb-2"><Music /></div>
                <div className="text-lg font-semibold">No playlists yet</div>
                <div className="text-sm">Your created playlists will appear here.</div>
            </div>
        );
    }
    
    return (
      <div className="w-full max-w-xl flex flex-col gap-4">
        {playlists.map(playlist => (
          <div key={playlist.id} className="glass-card p-4 flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-accent-purple/20 flex items-center justify-center">
              <Music className="text-accent-purple" size={32} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-accent-cyan">{playlist.name}</h3>
              <p className="text-sm text-gray-400">{playlist.songIds?.length || 0} songs</p>
            </div>
          </div>
        ))}
      </div>
    );
}
