'use client';
import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, getDocs, doc, writeBatch, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { auth, app } from '@/utils/firebaseClient';
import { X, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const db = getFirestore(app);

interface AddToPlaylistModalProps {
  post: any;
  onClose: () => void;
}

export function AddToPlaylistModal({ post, onClose }: AddToPlaylistModalProps) {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [creating, setCreating] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const fetchPlaylists = async () => {
      setLoading(true);
      try {
        const playlistsRef = collection(db, 'users', user.uid, 'playlists');
        const q = query(playlistsRef);
        const querySnapshot = await getDocs(q);
        const userPlaylists = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPlaylists(userPlaylists);
      } catch (error) {
        console.error("Error fetching playlists:", error);
      }
      setLoading(false);
    };

    fetchPlaylists();
  }, [user]);

  const handleCreatePlaylist = async () => {
    if (!user || !newPlaylistName.trim()) return;
    setCreating(true);
    try {
      const batch = writeBatch(db);
      const newPlaylistRef = doc(collection(db, 'users', user.uid, 'playlists'));
      
      batch.set(newPlaylistRef, {
        name: newPlaylistName,
        createdAt: serverTimestamp(),
        postIds: [post.id],
        owner: user.uid,
      });

      await batch.commit();
      setNewPlaylistName('');
      onClose();
    } catch (error) {
      console.error("Error creating playlist:", error);
    }
    setCreating(false);
  };

  const handleAddToExistingPlaylist = async (playlistId: string) => {
    if (!user) return;
    setAdding(playlistId);
    try {
        const playlistRef = doc(db, 'users', user.uid, 'playlists', playlistId);
        const batch = writeBatch(db);
        batch.update(playlistRef, { postIds: arrayUnion(post.id) });
        await batch.commit();
        onClose();
    } catch (error) {
        console.error("Error adding to playlist:", error);
    }
    setAdding(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-6 w-full max-w-md relative flex flex-col"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={20} />
        </button>
        <h2 className="text-xl font-headline font-bold mb-4 text-accent-cyan">Add to Playlist</h2>
        
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="New playlist name..."
              className="input-glass flex-grow"
            />
            <button onClick={handleCreatePlaylist} disabled={creating || !newPlaylistName.trim()} className="btn-glass bg-accent-pink text-white shrink-0">
              {creating ? <Loader2 className="animate-spin" /> : 'Create'}
            </button>
          </div>

          <div className="text-sm text-gray-400 text-center my-2">Or add to existing:</div>

          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-2">
            {loading ? (
                <div className="flex justify-center items-center h-24">
                    <Loader2 className="animate-spin text-accent-cyan" />
                </div>
            ) : playlists.length > 0 ? (
              playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  disabled={adding === playlist.id}
                  onClick={() => handleAddToExistingPlaylist(playlist.id)}
                  className="text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors w-full flex justify-between items-center"
                >
                  <span>{playlist.name}</span>
                  {adding === playlist.id && <Loader2 className="animate-spin" size={18}/>}
                </button>
              ))
            ) : (
                <p className="text-center text-gray-500 py-4">No playlists yet. Create one!</p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
