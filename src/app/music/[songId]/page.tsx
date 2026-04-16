
"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/utils/firebaseClient';
import { useMusicPlayer } from '@/utils/MusicPlayerContext';
import { Song } from '@/types/music';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, MoreHorizontal } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { motion } from 'framer-motion';

const SongPage = () => {
    const params = useParams();
    const songId = params.songId as string;
    const [song, setSong] = useState<Song | null>(null);
    const [relatedSongs, setRelatedSongs] = useState<Song[]>([]);
    const [menuOpen, setMenuOpen] = useState(false);
    const { toast } = useToast();
    
    const {
        activeSong,
        isPlaying,
        playSong,
        toggleSong,
        playNext,
        playPrevious,
        currentPlaylist,
        playSongFromPlaylist,
        isShuffle,
        toggleShuffle,
        repeatMode,
        setRepeatMode,
        addToQueue,
    } = useMusicPlayer();

    const originalPlaylist = useMemo(() => song ? [song, ...relatedSongs] : [], [song, relatedSongs]);

    useEffect(() => {
        const fetchSongAndRelated = async () => {
            if (songId) {
                const songRef = doc(db, 'songs', songId);
                const songSnap = await getDoc(songRef);

                if (songSnap.exists()) {
                    const songData = { id: songSnap.id, ...songSnap.data() } as Song;
                    setSong(songData);

                    const q = query(
                        collection(db, 'songs'),
                        where('artist', '==', songData.artist)
                    );
                    const relatedSongsSnap = await getDocs(q);
                    const related = relatedSongsSnap.docs
                        .map(doc => ({ id: doc.id, ...doc.data() } as Song))
                        .filter(s => s.id !== songData.id);
                    setRelatedSongs(related);

                    // Only play the song if it's not already the active one.
                    // This prevents re-starting the song on navigation.
                    if (activeSong?.id !== songData.id) {
                        playSong(songData, [songData, ...related], 0);
                    }
                }
            }
        };

        fetchSongAndRelated();
    }, [songId]); // Dependency array is now safe.

    const handlePlayPause = () => {
        if (activeSong?.id === song?.id) {
            toggleSong();
        } else if (song) {
            playSong(song, originalPlaylist, 0);
        }
    };

    const handleAddToQueue = () => {
        if (song) {
            addToQueue(song);
            toast({
                title: "Added to Queue",
                description: `${song.title} by ${song.artist} will play next.`
            });
            setMenuOpen(false);
        }
    };

    const handleRepeatToggle = () => {
        const modes = ['none', 'all', 'one'];
        const nextIndex = (modes.indexOf(repeatMode) + 1) % modes.length;
        setRepeatMode(modes[nextIndex] as 'none' | 'one' | 'all');
    };

    if (!song) {
        return <div className="flex items-center justify-center h-screen"><p>Loading song...</p></div>;
    }

    // --- Highly Robust "Up Next" Queue Logic ---
    let upNextQueue: Song[] = [];
    if (activeSong && currentPlaylist && currentPlaylist.length > 0) {
        const activeSongIndex = currentPlaylist.findIndex(s => s && s.id === activeSong.id);

        if (activeSongIndex !== -1) {
            upNextQueue = currentPlaylist.slice(activeSongIndex + 1);
        }
    }
    const safeUpNextQueue = upNextQueue.filter(Boolean);

    const handleUpNextClick = (nextSong: Song) => {
        if (activeSong?.id === nextSong.id) {
            toggleSong();
        } else {
            playSongFromPlaylist(nextSong);
        }
    };

    return (
        <div className="container mx-auto p-4" onClick={() => setMenuOpen(false)}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 relative">
                    <img src={song.albumArtUrl} alt={song.title} className="w-full rounded-lg shadow-lg aspect-square object-cover" />
                    <div className="absolute top-3 right-3">
                        <button onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }} className="p-2 bg-black/50 rounded-full text-white hover:bg-accent-pink/80 z-10 transition-all hover:scale-110 active:scale-95">
                            <MoreHorizontal size={20} />
                        </button>
                        {menuOpen && (
                            <motion.div initial={{opacity: 0, scale: 0.9, y: -10}} animate={{opacity: 1, scale: 1, y: 0}} className="absolute top-12 right-0 bg-gray-800/90 backdrop-blur-md rounded-lg shadow-xl z-20 overflow-hidden w-48 origin-top-right">
                                <button
                                    className="w-full text-left px-4 py-3 hover:bg-accent-cyan/20 transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddToQueue();
                                    }}
                                >
                                    Add to Queue
                                </button>
                            </motion.div>
                        )}
                    </div>
                    <div className="mt-4 text-center">
                        <h1 className="text-3xl font-bold text-white">{song.title}</h1>
                        <p className="text-xl text-gray-400">{song.artist}</p>
                        <p className="text-gray-500">{song.album} ({song.year})</p>
                        <p className="text-sm text-gray-300 mt-4 text-left">{song.description}</p>
                    </div>
                </div>
                <div className="md:col-span-2">
                    <div className="glass-card p-6 rounded-lg">
                        <div className="flex items-center justify-center space-x-6">
                            <button onClick={toggleShuffle} className={`p-2 rounded-full transition-colors ${isShuffle ? 'text-accent-green' : 'text-gray-400 hover:text-white'}`}>
                                <Shuffle />
                            </button>
                            <button onClick={playPrevious} className="p-2 rounded-full text-gray-300 hover:text-white transition-colors">
                                <SkipBack size={28}/>
                            </button>
                            <button onClick={handlePlayPause} className="p-4 bg-accent-cyan text-black rounded-full shadow-lg hover:scale-110 transition-transform">
                                {isPlaying && activeSong?.id === song.id ? <Pause size={32} /> : <Play size={32} />}
                            </button>
                            <button onClick={playNext} className="p-2 rounded-full text-gray-300 hover:text-white transition-colors">
                                <SkipForward size={28}/>
                            </button>
                             <button onClick={handleRepeatToggle} className="p-2 rounded-full text-gray-400 hover:text-white transition-colors">
                                {repeatMode === 'one' ? <Repeat1 className="text-accent-green" /> : <Repeat className={repeatMode === 'all' ? 'text-accent-green' : ''}/>}
                            </button>
                        </div>
                         <div className="mt-6">
                            <div className="h-2 bg-black/20 rounded-full">
                                <div className="h-2 bg-accent-cyan rounded-full" style={{width: '30%'}}></div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-8">
                        <h2 className="text-2xl font-bold mb-4 text-white">Up Next</h2>
                        <ul className="flex flex-col gap-2">
                            {safeUpNextQueue.map((nextSong, index) => (
                                <li 
                                    key={`${nextSong.id}-${index}`}
                                    className="flex items-center justify-between p-2 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
                                    onClick={() => playSongFromPlaylist(nextSong)}
                                >
                                    <div className="flex items-center space-x-4">
                                        <img src={nextSong.albumArtUrl} alt={nextSong.title} className="w-14 h-14 rounded-md object-cover" />
                                        <div>
                                            <p className={`font-semibold ${activeSong?.id === nextSong.id ? 'text-accent-green' : 'text-white'}`}>{nextSong.title}</p>
                                            <p className="text-sm text-gray-400">{nextSong.artist}</p>
                                        </div>
                                    </div>
                                    <button className="p-2 rounded-full hover:bg-white/20 transition-colors" onClick={(e) => {e.stopPropagation(); handleUpNextClick(nextSong)}}>
                                        {activeSong?.id === nextSong.id && isPlaying ? <Pause/> : <Play />}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SongPage;
