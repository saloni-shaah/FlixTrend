'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Music, Search, MoreHorizontal } from 'lucide-react';
import { getFirestore, collection, query, onSnapshot, orderBy, where, updateDoc, arrayUnion, doc, getDocs, limit, startAfter, serverTimestamp, addDoc } from 'firebase/firestore';
import { auth, app } from '@/utils/firebaseClient';
import { useMusicPlayer } from '@/utils/MusicPlayerContext';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";

const db = getFirestore(app);

function AddToPlaylistModal({ song, onClose }: { song: any; onClose: () => void }) {
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewPlaylist, setShowNewPlaylist] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const currentUser = auth.currentUser;

    useEffect(() => {
        if (!currentUser) return;
        const q = query(collection(db, "users", currentUser.uid, "playlists"), where("Playlist_Type", "==", "song"));
        const unsub = onSnapshot(q, (snapshot) => {
            setPlaylists(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsub();
    }, [currentUser]);

    const handleCreatePlaylist = async () => {
        if (!newPlaylistName.trim() || !currentUser) return;
        const newPlaylistRef = await addDoc(collection(db, "users", currentUser.uid, "playlists"), {
            name: newPlaylistName,
            owner: currentUser.uid,
            createdAt: serverTimestamp(),
            songIds: [song.id],
            Playlist_Type: "song"
        });
        console.log("New playlist created with ID:", newPlaylistRef.id);
        setNewPlaylistName('');
        setShowNewPlaylist(false);
        onClose();
    };
    
    const handleAddToPlaylist = async (playlistId: string) => {
        if (!currentUser) return;
        const playlistRef = doc(db, "users", currentUser.uid, "playlists", playlistId);
        await updateDoc(playlistRef, {
            songIds: arrayUnion(song.id)
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-6 w-full max-w-md relative flex flex-col max-h-[80vh]">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">&times;</button>
                <h2 className="text-xl font-headline font-bold mb-4 text-accent-cyan">Add to Playlist</h2>
                <div className="flex-1 overflow-y-auto mb-4 border-y border-accent-cyan/10 py-2">
                    {loading ? (
                        <p className="text-center text-gray-400">Loading playlists...</p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {playlists.map(p => (
                                <button key={p.id} onClick={() => handleAddToPlaylist(p.id)} className="text-left p-3 rounded-lg hover:bg-accent-cyan/10 w-full">
                                    {p.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                {showNewPlaylist ? (
                    <div className="flex gap-2">
                        <input type="text" placeholder="New playlist name..." value={newPlaylistName} onChange={(e) => setNewPlaylistName(e.target.value)} className="input-glass flex-1" />
                        <button onClick={handleCreatePlaylist} className="btn-glass bg-accent-pink">Create</button>
                    </div>
                ) : (
                    <button className="btn-glass bg-accent-cyan/50 text-white" onClick={() => setShowNewPlaylist(true)}>
                        Create New Playlist
                    </button>
                )}
            </motion.div>
        </div>
    );
}

const INITIAL_LOAD_SIZE = 20;
const SUBSEQUENT_LOAD_SIZE = 8;

export function MusicDiscovery() {
    const [songs, setSongs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastVisible, setLastVisible] = useState<any>(null);
    const [hasMore, setHasMore] = useState(true);
    const [showPlaylistModal, setShowPlaylistModal] = useState<any | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [openMenuSongId, setOpenMenuSongId] = useState<string | null>(null);
    const { activeSong, isPlaying, playSong, toggleSong, addToQueue } = useMusicPlayer();
    const router = useRouter();
    const { toast } = useToast();
    const observerRef = useRef(null);

    const fetchSongs = useCallback(async (initial = false) => {
        if (!hasMore && !initial) return;
        
        if (initial) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        let q = query(
            collection(db, "songs"), 
            orderBy("createdAt", "desc"),
            limit(initial ? INITIAL_LOAD_SIZE : SUBSEQUENT_LOAD_SIZE)
        );

        if (!initial && lastVisible) {
            q = query(
                collection(db, "songs"), 
                orderBy("createdAt", "desc"), 
                startAfter(lastVisible), 
                limit(SUBSEQUENT_LOAD_SIZE)
            );
        }

        try {
            const documentSnapshots = await getDocs(q);
            const newSongs = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];

            setSongs(prev => initial ? newSongs : [...prev, ...newSongs]);
            setLastVisible(lastDoc);
            setHasMore(documentSnapshots.docs.length === (initial ? INITIAL_LOAD_SIZE : SUBSEQUENT_LOAD_SIZE));
        } catch (error) {
            console.error("Error fetching songs: ", error);
        } finally {
            if (initial) setLoading(false);
            setLoadingMore(false);
        }
    }, [lastVisible, hasMore]);

    useEffect(() => {
        fetchSongs(true);
    }, []);

    const handleObserver = useCallback((entries: any) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !loadingMore && !loading) {
            fetchSongs();
        }
    }, [fetchSongs, hasMore, loadingMore, loading]);

    useEffect(() => {
        const option = {
            root: null,
            rootMargin: "20px",
            threshold: 0
        };
        const observer = new IntersectionObserver(handleObserver, option);
        if (observerRef.current) observer.observe(observerRef.current);
        
        return () => {
            if (observerRef.current) observer.unobserve(observerRef.current);
        };
    }, [handleObserver]);
    
    const handlePlayPause = (song: any, index: number) => {
        if (activeSong?.id === song.id) {
            toggleSong();
        } else {
            playSong(song, filteredSongs, index);
        }
    };

    const handleAddToQueue = (song: any) => {
        addToQueue(song);
        toast({ title: "Added to Queue", description: `${song.title} will play next.` });
    };

    const filteredSongs = searchTerm
        ? songs.filter(song =>
            song.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            song.artist?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            song.album?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : songs;

    if (loading) return <div className="text-center text-accent-cyan animate-pulse">Loading music library...</div>

    return (
        <div className="w-full flex flex-col items-center relative" onClick={() => setOpenMenuSongId(null)}>
            <h2 className="text-3xl font-headline bg-gradient-to-r from-accent-pink to-accent-green bg-clip-text text-transparent mb-6">Community Music</h2>
            
             <div className="relative mb-8 w-full max-w-lg mx-auto">
                <input
                    type="text"
                    className="input-glass w-full pl-12 pr-4 py-3"
                    placeholder="Search for songs, artists, albums..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-brand-gold pointer-events-none">
                    <Search />
                </span>
            </div>

            {filteredSongs.length === 0 && !loading && !loadingMore ? (
                <div className="text-center text-gray-400 mt-16">
                    <Music size={64} className="mx-auto mb-4"/>
                    <h3 className="text-xl font-bold">{searchTerm ? "No Results Found" : "The Stage is Empty"}</h3>
                    <p>{searchTerm ? "Try a different search term." : "No music has been uploaded yet."}</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredSongs.map((song, index) => (
                        <motion.div
                            key={song.id}
                            className="glass-card flex flex-col items-center text-center group"
                            whileHover={{ y: -5 }}
                        >
                            <div className="relative w-full cursor-pointer" onClick={() => router.push(`/music/${song.id}`)}>
                                <img src={song.albumArtUrl} alt={song.title} className="w-full h-auto rounded-t-2xl aspect-square object-cover"/>
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        className="p-3 rounded-full bg-black/50 hover:bg-accent-cyan/50 text-white transition-colors"
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            handlePlayPause(song, index); 
                                        }}
                                    >
                                        {activeSong?.id === song.id && isPlaying ? <Pause size={32} /> : <Play size={32} />} 
                                    </button>
                                </div>
                                
                                <button
                                    className="absolute top-2 right-2 p-2 bg-black/40 rounded-full text-white hover:bg-accent-pink/80 z-10"
                                    title="More options"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenMenuSongId(openMenuSongId === song.id ? null : song.id);
                                    }}
                                >
                                    <MoreHorizontal size={16}/>
                                </button>

                                {openMenuSongId === song.id && (
                                    <motion.div 
                                        initial={{opacity: 0, y: -10}}
                                        animate={{opacity: 1, y: 0}}
                                        className="absolute top-12 right-2 bg-gray-800/90 backdrop-blur-md rounded-lg shadow-xl z-20 overflow-hidden w-48">
                                        <button 
                                            className="w-full text-left px-4 py-2 hover:bg-accent-cyan/20"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleAddToQueue(song);
                                                setOpenMenuSongId(null);
                                            }}
                                        >
                                            Add to Queue
                                        </button>
                                        <button 
                                            className="w-full text-left px-4 py-2 hover:bg-accent-cyan/20"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowPlaylistModal(song);
                                                setOpenMenuSongId(null);
                                            }}
                                        >
                                           Add to Playlist
                                        </button>
                                    </motion.div>
                                )}
                            </div>
                            <div className="p-4 w-full">
                                <h3 className="font-headline text-base font-bold mb-1 text-accent-cyan truncate">{song.title}</h3>
                                <p className="text-xs text-gray-400 truncate">{song.artist}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
            <div ref={observerRef} style={{ height: '20px' }} />
            {loadingMore && <div className="text-center text-accent-cyan animate-pulse py-4">Loading more music...</div>}
            {!hasMore && songs.length > 0 && <div className="text-center text-gray-500 py-8">You've reached the end of the library.</div>}
            
            {showPlaylistModal && <AddToPlaylistModal song={showPlaylistModal} onClose={() => setShowPlaylistModal(null)} />}
        </div>
    );
}
