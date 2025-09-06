"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Plus, Music } from 'lucide-react';
import { getFirestore, collection, addDoc, serverTimestamp, query, onSnapshot, orderBy } from 'firebase/firestore';
import { auth } from '@/utils/firebaseClient';
import { useAppState } from '@/utils/AppStateContext';

const db = getFirestore();

async function uploadToCloudinary(file: File, onProgress?: (percent: number) => void): Promise<string | null> {
  const url = `https://api.cloudinary.com/v1_1/drrzvi2jp/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "flixtrend_unsigned");
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      const data = JSON.parse(xhr.responseText);
      if (xhr.status === 200 && data.secure_url) {
        resolve(data.secure_url);
      } else {
        reject(new Error(data.error?.message || "Upload failed"));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(formData);
  });
}

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
            
            const audioUrl = await uploadToCloudinary(audioFile);
            const albumArtUrl = await uploadToCloudinary(albumArtFile);

            if (!audioUrl || !albumArtUrl) throw new Error("File upload failed.");

            await addDoc(collection(db, 'songs'), {
                ...form,
                audioUrl,
                albumArtUrl,
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


export function MusicDiscovery() {
    const [songs, setSongs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const { activeSong, isPlaying, playSong, pauseSong } = useAppState();

    useEffect(() => {
        const q = query(collection(db, "songs"), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, (snapshot) => {
            setSongs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsub();
    }, []);
    
    const handlePlayPause = (song: any) => {
        if (activeSong?.id === song.id && isPlaying) {
            pauseSong();
        } else {
            playSong(song);
        }
    };

    if (loading) return <div className="text-center text-accent-cyan animate-pulse">Loading music library...</div>

    return (
        <div className="w-full flex flex-col items-center relative">
            <h2 className="text-3xl font-headline bg-gradient-to-r from-accent-pink to-accent-cyan bg-clip-text text-transparent mb-8">Community Music</h2>
            
            {songs.length === 0 ? (
                <div className="text-center text-gray-400 mt-16">
                    <Music size={64} className="mx-auto mb-4"/>
                    <h3 className="text-xl font-bold">The Stage is Empty</h3>
                    <p>Be the first to upload a song and share it with the community!</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {songs.map(song => (
                        <motion.div
                            key={song.id}
                            className="glass-card flex flex-col items-center text-center group cursor-pointer"
                            whileHover={{ scale: 1.05 }}
                            onClick={() => handlePlayPause(song)}
                        >
                            <div className="relative w-full">
                                <img src={song.albumArtUrl} alt={song.title} className="w-full h-auto rounded-t-2xl aspect-square object-cover"/>
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    {activeSong?.id === song.id && isPlaying ? <Pause size={48} className="text-white"/> : <Play size={48} className="text-white"/>}
                                </div>
                            </div>
                            <div className="p-4 w-full">
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
        </div>
    );
}
