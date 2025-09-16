
"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getFirestore, collection, addDoc, serverTimestamp, query, onSnapshot, orderBy } from 'firebase/firestore';
import { auth, app } from '@/utils/firebaseClient';
import { Plus, UploadCloud } from 'lucide-react';
import { GamePlayer } from './GamePlayer';

const db = getFirestore(app);

async function uploadToCloudinary(file: File, resourceType: 'image' | 'raw' = 'image', onProgress?: (percent: number) => void): Promise<string | null> {
  const url = `https://api.cloudinary.com/v1_1/drrzvi2jp/${resourceType}/upload`;
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

export function AddGameModal({ onClose }: { onClose: () => void }) {
    const [form, setForm] = useState({ title: '', description: '' });
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [gameFile, setGameFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'thumbnail' | 'game') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (type === 'thumbnail') {
                setThumbnailFile(file);
                setThumbnailPreview(URL.createObjectURL(file));
            } else if (type === 'game') {
                setGameFile(file);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!gameFile || !thumbnailFile || !form.title) {
            setError('Please fill in title and upload both a thumbnail and a game file.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("Not logged in");
            
            const thumbnailUrl = await uploadToCloudinary(thumbnailFile, 'image');
            const gameUrl = await uploadToCloudinary(gameFile, 'raw');

            if (!thumbnailUrl || !gameUrl) throw new Error("File upload failed.");

            await addDoc(collection(db, 'games'), {
                ...form,
                thumbnailUrl,
                gameUrl,
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
                <h2 className="text-xl font-headline font-bold mb-4 text-accent-cyan">Add Your Game</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-3 overflow-y-auto pr-2">
                    <div className="flex gap-4 items-start">
                         <div className="w-40 h-40 bg-black/20 rounded-lg flex items-center justify-center text-gray-400 overflow-hidden shrink-0">
                            {thumbnailPreview ? <img src={thumbnailPreview} alt="preview" className="w-full h-full object-cover" /> : <div className="text-center p-2"><UploadCloud size={40}/><p className="text-xs mt-2">Upload Thumbnail</p></div>}
                        </div>
                        <div className="flex flex-col gap-3 w-full">
                             <input type="text" name="title" placeholder="Game Title" className="input-glass w-full" value={form.title} onChange={handleChange} required />
                             <textarea name="description" placeholder="Describe your game..." className="input-glass w-full rounded-2xl" rows={4} value={form.description} onChange={handleChange} />
                        </div>
                    </div>
                   
                    <label className="text-sm font-bold text-accent-cyan mt-2">Upload Thumbnail Image</label>
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'thumbnail')} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent-pink/20 file:text-accent-pink hover:file:bg-accent-pink/40" required/>
                    
                    <label className="text-sm font-bold text-accent-cyan mt-2">Upload Game (.html file)</label>
                    <input type="file" accept=".html" onChange={(e) => handleFileChange(e, 'game')} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent-cyan/20 file:text-accent-cyan hover:file:bg-accent-cyan/40" required/>

                    {error && <div className="text-red-400 text-center">{error}</div>}
                    <button type="submit" className="btn-glass bg-accent-cyan text-black mt-4" disabled={loading}>
                        {loading ? "Uploading..." : "Add Game"}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}


export function GamesHub() {
    const [games, setGames] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGame, setSelectedGame] = useState<any | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    
    useEffect(() => {
        const q = query(collection(db, "games"), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, (snapshot) => {
            setGames(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsub();
    }, []);

    if (selectedGame) {
        return <GamePlayer game={selectedGame} onBack={() => setSelectedGame(null)} />;
    }

    return (
        <div className="w-full flex flex-col items-center">
            <h2 className="text-3xl font-headline bg-gradient-to-r from-accent-pink to-accent-green bg-clip-text text-transparent mb-8">Community Games</h2>
            
            {loading ? (
                <div className="text-center text-accent-cyan animate-pulse">Loading games...</div>
            ) : games.length === 0 ? (
                 <div className="text-center text-gray-400 mt-16">
                    <h3 className="text-xl font-bold">The Arcade is Empty</h3>
                    <p>Be the first to upload a game and share it with the community!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {games.map(game => (
                        <motion.div
                            key={game.id}
                            className="glass-card flex flex-col items-center text-center cursor-pointer group"
                            whileHover={{ scale: 1.05, y: -5 }}
                            onClick={() => setSelectedGame(game)}
                        >
                             <div className="relative w-full">
                                <img src={game.thumbnailUrl} alt={game.title} className="w-full h-40 rounded-t-2xl object-cover"/>
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-white font-bold text-lg">Play</span>
                                </div>
                            </div>
                            <div className="p-4 w-full">
                                <h3 className="font-headline text-xl font-bold mb-2 text-accent-cyan truncate">{game.title}</h3>
                                <p className="text-sm text-gray-400 line-clamp-2">{game.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            <button
              className="fixed bottom-24 right-4 z-50 btn-glass-icon w-16 h-16 bg-gradient-to-tr from-accent-pink to-accent-purple flex items-center justify-center"
              aria-label="Add Game"
              onClick={() => setShowAddModal(true)}
            >
                <Plus size={32} />
            </button>
            
            {showAddModal && <AddGameModal onClose={() => setShowAddModal(false)} />}
        </div>
    );
}
