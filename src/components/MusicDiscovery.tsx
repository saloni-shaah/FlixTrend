"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

export function MusicDiscovery() {
    const [token, setToken] = useState<string | null>(null);
    const [newReleases, setNewReleases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeAudio, setActiveAudio] = useState<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Fetch client-credentials token
        fetch('/api/spotify-token')
            .then(res => res.json())
            .then(data => {
                if (data.access_token) {
                    setToken(data.access_token);
                } else {
                    throw new Error('Could not authenticate with Spotify. Please ensure your SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are set in your .env.local file.');
                }
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        if (!token) return;

        // Fetch new releases from Spotify
        fetch('https://api.spotify.com/v1/browse/new-releases?limit=20', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(res => res.json())
        .then(data => {
            if (data.albums && data.albums.items) {
                setNewReleases(data.albums.items);
            } else if (data.error) {
                setError(`Spotify API Error: ${data.error.message}`);
            }
            else {
                setError('Could not fetch new releases.');
            }
            setLoading(false);
        })
        .catch(err => {
            setError(err.message);
            setLoading(false);
        });
    }, [token]);

    const playPreview = (previewUrl: string) => {
        if (activeAudio) {
            activeAudio.pause();
        }
        if (activeAudio && activeAudio.src === previewUrl) {
            setActiveAudio(null); // Stop if it's the same song
            return;
        }

        const audio = new Audio(previewUrl);
        audio.play();
        setActiveAudio(audio);
        audio.onended = () => setActiveAudio(null);
    }
    
    useEffect(() => {
      // Cleanup audio on component unmount
      return () => {
        activeAudio?.pause();
      }
    }, [activeAudio]);

    if (loading) return <div className="text-center text-accent-cyan animate-pulse">Loading new music...</div>
    if (error) {
        return (
            <div className="text-center text-red-400 glass-card p-6">
                <h3 className="font-bold text-lg mb-2">Spotify Integration Error</h3>
                <p className="text-sm">{error}</p>
                <p className="text-xs mt-4 text-gray-400">Please make sure you have created a `.env.local` file and added your Spotify API credentials.</p>
            </div>
        )
    }

    return (
        <div className="w-full flex flex-col items-center">
            <h2 className="text-3xl font-headline bg-gradient-to-r from-accent-pink to-accent-cyan bg-clip-text text-transparent mb-8">New Releases</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {newReleases.map(album => (
                    <motion.div
                        key={album.id}
                        className="glass-card flex flex-col items-center text-center group"
                        whileHover={{ scale: 1.05 }}
                    >
                        <div className="relative w-full">
                            <img src={album.images[0].url} alt={album.name} className="w-full h-auto rounded-t-2xl"/>
                            {album.preview_url && (
                                <div 
                                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    onClick={() => playPreview(album.preview_url)}
                                >
                                    <Play size={48} className="text-white"/>
                                </div>
                            )}
                        </div>
                        <div className="p-4">
                            <h3 className="font-headline text-base font-bold mb-1 text-accent-cyan truncate">{album.name}</h3>
                            <p className="text-xs text-gray-400 truncate">{album.artists.map((a: any) => a.name).join(', ')}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
