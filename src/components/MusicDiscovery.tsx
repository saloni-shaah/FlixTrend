"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Plus, Music, Search } from 'lucide-react';
import { getFirestore, collection, addDoc, serverTimestamp, query, onSnapshot, orderBy, where, updateDoc, arrayUnion, doc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, app } from '@/utils/firebaseClient';
import { useAppState } from '@/utils/AppStateContext';
import AdModal from './AdModal';


const db = getFirestore(app);
const storage = getStorage(app);

function AddMusicModal({ onClose }: { onClose: () => void }) {
    const [form, setForm] = useState({
        title: '',
        artist: '',
        album: '',
        genre: '',
        year: '',
        description: '',
    });
    const [albumArtFile, setAlbumArtFile] = useState<File | null>(null);
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [albumArtPreview, setAlbumArtPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'art' | 'audio') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (type === 'art') {
                setAlbumArtFile(file);
                setAlbumArtPreview(URL.createObjectURL(file));
            } else {
                setAudioFile(file);
            }
        }
    };
    
    const uploadFile = async (file: File, path: string) => {
        const fileRef = ref(storage, path);
        await uploadBytes(fileRef, file);
        return await getDownloadURL(fileRef);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!audioFile || !albumArtFile || !form.title || !form.artist) {
            setError('Please fill in all required fields and upload both files.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("Not logged in");

            const audioUrl = await uploadFile(audioFile, `music/${user.uid}/${Date.now()}_${audioFile.name}`);
            const artUrl = await uploadFile(albumArtFile, `album_art/${user.uid}/${Date.now()}_${albumArtFile.name}`);

            await addDoc(collection(db, 'songs'), {
                ...form,
                audioUrl: audioUrl,
                albumArtUrl: artUrl,
                userId: user.uid,
                username: user.displayName,
                createdAt: serverTimestamp(),
            });

            onClose();
        } catch (err: any) {
            setError(err.message);
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-6 w-full max-w-lg relative max-h-[90vh] flex flex-col"
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">&times;</button>
                <h2 className="text-xl font-headline font-bold mb-4 text-accent-cyan">Add a New Song</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-3 overflow-y-auto pr-2">
                    <div className="flex gap-4 items-center">
                        <div className="w-32 h-32 bg-black/20 rounded-lg flex items-center justify-center text-gray-400 overflow-hidden shrink-0">
                            {albumArtPreview ? <img src={albumArtPreview} alt="preview" className="w-full h-full object-cover" /> : "Album Art"}
                        </div>
                        <div className="flex flex-col gap-3 w-full">
                             <input type="text" name="title" placeholder="Song Title" className="input-glass w-full" value={form.title} onChange={handleChange} required />
                             <input type="text" name="artist" placeholder="Artist Name" className="input-glass w-full" value={form.artist} onChange={handleChange} required />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <input type="text" name="album" placeholder="Album Name" className="input-glass w-full" value={form.album} onChange={handleChange} />
                        <input type="text" name="genre" placeholder="Genre" className="input-glass w-full" value={form.genre} onChange={handleChange} />
                        <input type="number" name="year" placeholder="Year" className="input-glass w-full" value={form.year} onChange={handleChange} />
                    </div>
                    <textarea name="description" placeholder="Describe the song, its vibe, or a story behind it..." className="input-glass w-full rounded-2xl" rows={4} value={form.description} onChange={handleChange} />
                    
                    <label className="text-sm font-bold text-accent-cyan mt-2">Upload Album Art</label>
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'art')} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent-pink/20 file:text-accent-pink hover:file:bg-accent-pink/40" required/>
                    
                    <label className="text-sm font-bold text-accent-cyan mt-2">Upload Audio File</label>
                    <input type="file" accept="audio/*" onChange={(e) => handleFileChange(e, 'audio')} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent-cyan/20 file:text-accent-cyan hover:file:bg-accent-cyan/40" required/>

                    {error && <div className="text-red-400 text-center">{error}</div>}
                    <button type="submit" className="btn-glass bg-accent-cyan text-black mt-4" disabled={loading}>
                        {loading ? "Uploading..." : "Add Song"}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}

function AddToPlaylistModal({ song, onClose }: { song: any; onClose: () => void }) {
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewPlaylist, setShowNewPlaylist] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const currentUser = auth.currentUser;

    useEffect(() => {
        if (!currentUser) return;
        const q = query(collection(db, "playlists"), where("ownerId", "==", currentUser.uid));
        const unsub = onSnapshot(q, (snapshot) => {
            setPlaylists(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsub();
    }, [currentUser]);

    const handleCreatePlaylist = async () => {
        if (!newPlaylistName.trim() || !currentUser) return;
        await addDoc(collection(db, "playlists"), {
            name: newPlaylistName,
            ownerId: currentUser.uid,
            createdAt: serverTimestamp(),
            songIds: [song.id] // Add current song to new playlist
        });
        setNewPlaylistName('');
        setShowNewPlaylist(false);
        onClose(); // Close modal after creating and adding
    };
    
    const handleAddToPlaylist = async (playlistId: string) => {
        const playlistRef = doc(db, "playlists", playlistId);
        await updateDoc(playlistRef, {
            songIds: arrayUnion(song.id)
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-6 w-full max-w-md relative flex flex-col max-h-[80vh]"
            >
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
                        <input 
                            type="text"
                            placeholder="New playlist name..."
                            value={newPlaylistName}
                            onChange={(e) => setNewPlaylistName(e.target.value)}
                            className="input-glass flex-1"
                        />
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

export function MusicDiscovery() {
    const [songs, setSongs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showPlaylistModal, setShowPlaylistModal] = useState<any | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { activeSong, isPlaying, playSong, pauseSong } = useAppState();
    const [showAd, setShowAd] = useState(false);
    const songChangeCounter = useRef(0);
    const listeningTimer = useRef<NodeJS.Timeout | null>(null);

    const startListeningTimer = () => {
        if (listeningTimer.current) clearTimeout(listeningTimer.current);
        listeningTimer.current = setTimeout(() => {
            setShowAd(true);
        }, 20 * 60 * 1000); // 20 minutes
    };

    useEffect(() => {
        const q = query(collection(db, "songs"), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, (snapshot) => {
            setSongs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsub();
    }, []);
    
    const handlePlayPause = (song: any, index: number) => {
        if (activeSong?.id !== song.id) { // This is a new song
            songChangeCounter.current += 1;
            if (songChangeCounter.current >= 3) {
                setShowAd(true);
                songChangeCounter.current = 0;
            }
        }
        
        if (activeSong?.id === song.id && isPlaying) {
            pauseSong();
            if(listeningTimer.current) clearTimeout(listeningTimer.current);
        } else {
            playSong(song, filteredSongs, index);
            startListeningTimer();
        }
    };
    
    const onAdComplete = () => {
        setShowAd(false);
        startListeningTimer(); // Restart timer after ad
    }

    const filteredSongs = searchTerm
        ? songs.filter(song =>
            song.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            song.artist?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            song.album?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : songs;

    if (loading) return <div className="text-center text-accent-cyan animate-pulse">Loading music library...</div>

    return (
        <div className="w-full flex flex-col items-center relative">
            {showAd && <AdModal onComplete={onAdComplete} />}
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

            {filteredSongs.length === 0 ? (
                <div className="text-center text-gray-400 mt-16">
                    <Music size={64} className="mx-auto mb-4"/>
                    <h3 className="text-xl font-bold">{searchTerm ? "No Results Found" : "The Stage is Empty"}</h3>
                    <p>{searchTerm ? "Try a different search term." : "Be the first to upload a song!"}</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredSongs.map((song, index) => (
                        <motion.div
                            key={song.id}
                            className="glass-card flex flex-col items-center text-center group"
                            whileHover={{ y: -5 }}
                        >
                            <div className="relative w-full">
                                <img src={song.albumArtUrl} alt={song.title} className="w-full h-auto rounded-t-2xl aspect-square object-cover"/>
                                <div 
                                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    onClick={() => handlePlayPause(song, index)}
                                >
                                    {activeSong?.id === song.id && isPlaying ? <Pause size={48} className="text-white"/> : <Play size={48} className="text-white"/>}
                                </div>
                                <button
                                    className="absolute top-2 right-2 p-2 bg-black/40 rounded-full text-white hover:bg-accent-pink"
                                    title="Add to playlist"
                                    onClick={(e) => { e.stopPropagation(); setShowPlaylistModal(song); }}
                                >
                                    <Plus size={16}/>
                                </button>
                            </div>
                            <div className="p-4 w-full cursor-pointer" onClick={() => handlePlayPause(song, index)}>
                                <h3 className="font-headline text-base font-bold mb-1 text-accent-cyan truncate">{song.title}</h3>
                                <p className="text-xs text-gray-400 truncate">{song.artist}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
            
            <button
              className="fixed bottom-24 right-4 z-50 btn-glass-icon w-16 h-16 bg-gradient-to-tr from-accent-pink to-accent-purple flex items-center justify-center"
              aria-label="Add Song"
              onClick={() => setShowAddModal(true)}
            >
                <Plus size={32} />
            </button>

            {showAddModal && <AddMusicModal onClose={() => setShowAddModal(false)} />}
            {showPlaylistModal && <AddToPlaylistModal song={showPlaylistModal} onClose={() => setShowPlaylistModal(null)} />}
        </div>
    );
}
