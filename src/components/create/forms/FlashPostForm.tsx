
"use client";
import React, { useState, useRef, useEffect } from 'react';
import { X, UploadCloud, Music as MusicIcon, MapPin, Smile } from 'lucide-react';
import { motion } from 'framer-motion';
import { getFirestore, collection, onSnapshot, query, orderBy, getDoc, doc } from 'firebase/firestore';
import { app } from '@/utils/firebaseClient';

const db = getFirestore(app);

export function FlashPostForm({ data, onDataChange }: { data: any, onDataChange: (data: any) => void }) {
    const [mediaFile, setMediaFile] = useState<File | null>(data.mediaFiles?.[0] || null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(data.mediaPreviews?.[0] || null);
    const [showSongPicker, setShowSongPicker] = useState(false);
    const [appSongs, setAppSongs] = useState<any[]>([]);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Pre-fetch song if songId is provided
        if (data.songId && !data.song) {
            const fetchSong = async () => {
                const songDoc = await getDoc(doc(db, "songs", data.songId));
                if (songDoc.exists()) {
                    const songData = songDoc.data();
                    handleSelectSong({ id: songDoc.id, ...songData });
                }
            };
            fetchSong();
        }

        const q = query(collection(db, "songs"), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, (snapshot) => {
            setAppSongs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsub();
    }, [data.songId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const url = URL.createObjectURL(file);
            setMediaFile(file);
            setMediaPreview(url);
            onDataChange({ ...data, mediaFiles: [file], mediaPreviews: [url] });
        }
    };
    
    const removeMedia = () => {
        setMediaFile(null);
        setMediaPreview(null);
        onDataChange({ ...data, mediaFiles: [], mediaPreviews: [] });
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        onDataChange({ ...data, [e.target.name]: e.target.value });
    };

    const handleSelectSong = (song: any) => {
        onDataChange({ ...data, song: {
            id: song.id,
            name: song.title,
            artists: [song.artist],
            album: song.album,
            albumArt: song.albumArtUrl,
            preview_url: song.audioUrl,
            snippetStart: 0,
            snippetEnd: 15,
        } });
        setShowSongPicker(false);
    };

    return (
        <div className="flex flex-col gap-4">
            <textarea
                name="caption"
                className="input-glass w-full rounded-2xl"
                placeholder="Add a caption..."
                value={data.caption || ''}
                onChange={handleTextChange}
            />

            <div className="p-4 border-2 border-dashed border-accent-cyan/30 rounded-2xl text-center min-h-[200px] flex items-center justify-center">
                {!mediaPreview ? (
                    <button type="button" className="btn-glass flex items-center justify-center gap-2" onClick={() => fileInputRef.current?.click()}>
                        <UploadCloud /> Upload Media
                    </button>
                ) : (
                     <div className="relative group aspect-video">
                        {mediaFile?.type.startsWith("video") ? (
                            <video src={mediaPreview} className="w-full h-full object-contain rounded-lg" />
                        ) : (
                            <img src={mediaPreview} alt="preview" className="w-full h-full object-contain rounded-lg" />
                        )}
                        <button type="button" onClick={removeMedia} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
                            <X size={16} />
                        </button>
                    </div>
                )}
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*" />
            </div>
            
             <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input type="text" name="location" className="w-full rounded-xl p-3 pl-10 bg-black/20 text-white border-2 border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-pink" placeholder="Add location..." value={data.location || ''} onChange={handleTextChange} />
            </div>
            <div className="relative">
                <Smile className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input type="text" name="mood" className="w-full rounded-xl p-3 pl-10 bg-black/20 text-white border-2 border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-pink" placeholder="How are you feeling?" value={data.mood || ''} onChange={handleTextChange} />
            </div>

            <div className="mt-2">
                <button type="button" className="w-full btn-glass flex justify-between items-center" onClick={() => setShowSongPicker(v => !v)}>
                    <span>{data.song ? `Song: ${data.song.name}` : 'Add a Song (Optional)'}</span>
                    <MusicIcon size={16}/>
                </button>
                <motion.div
                    initial={false}
                    animate={{ height: showSongPicker ? 'auto' : 0, opacity: showSongPicker ? 1 : 0 }}
                    className="overflow-hidden bg-black/20 rounded-b-lg"
                >
                    <div className="p-2 max-h-48 overflow-y-auto">
                        {appSongs.map(song => (
                            <div key={song.id} className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-accent-cyan/10" onClick={() => handleSelectSong(song)}>
                                <img src={song.albumArtUrl} alt="album" className="w-10 h-10 rounded" />
                                <div>
                                    <div className="font-bold text-sm text-accent-cyan">{song.title}</div>
                                    <div className="text-xs text-gray-400">{song.artist}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
            
        </div>
    );
}
