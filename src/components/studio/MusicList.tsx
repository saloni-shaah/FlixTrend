'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '@/utils/firebaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Play, Pause, MoreVertical, Trash2, Edit, Heart, PlayCircle, Loader2, X, AlertTriangle } from 'lucide-react';
import { useMusicPlayer } from '@/utils/MusicPlayerContext';
import { Song } from '@/types/music';
import { useToast } from '@/hooks/use-toast';

const ConfirmationDialog = ({ isOpen, onCancel, onConfirm, isDeleting }: { isOpen: boolean, onCancel: () => void, onConfirm: () => void, isDeleting: boolean }) => {
    if (!isOpen) return null;
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="glass-card-deep p-6 rounded-2xl max-w-sm w-full shadow-xl">
                <div className="flex flex-col items-center text-center">
                    <AlertTriangle className="text-red-400" size={48} />
                    <h3 className="text-xl font-bold mt-4 text-white/90">Are you sure?</h3>
                    <p className="text-gray-300 mt-2 text-sm">This will permanently delete the song and all its associated files. This action cannot be undone.</p>
                </div>
                <div className="flex justify-around mt-6">
                    <button onClick={onCancel} disabled={isDeleting} className="btn-secondary bg-white/10 w-2/5">Cancel</button>
                    <button onClick={onConfirm} disabled={isDeleting} className="btn-danger bg-red-500/80 w-2/5 flex items-center justify-center gap-2">
                        {isDeleting ? <Loader2 className="animate-spin"/> : <Trash2 size={16}/>} 
                        Delete
                    </button>
                </div>
            </motion.div>
        </motion.div>
    )
}

export const MusicList = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { activeSong, isPlaying, playSong, toggleSong } = useMusicPlayer();
  const currentUser = auth.currentUser;
  const { toast } = useToast();
  
  const [songToDelete, setSongToDelete] = useState<Song | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!currentUser) {
        setLoading(false);
        setError("Please sign in to see your music.");
        return;
    };

    const q = query(
        collection(db, "songs"), 
        where("userId", "==", currentUser.uid),
        orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const userSongs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Song));
        setSongs(userSongs);
        setLoading(false);
    }, (err) => {
        console.error("Error fetching songs:", err);
        setError("Could not load your music library.");
        setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handlePlayPause = (song: Song, index: number) => {
    const playlist = songs;
    if (activeSong?.id === song.id) {
        toggleSong();
    } else {
        playSong(song, playlist, index);
    }
  };

  const handleDeleteRequest = (song: Song) => {
      setSongToDelete(song);
  }

  const confirmDelete = async () => {
    if (!songToDelete || !currentUser) return;
    setIsDeleting(true);

    try {
        // 1. Delete files from Cloudinary
        const idToken = await currentUser.getIdToken(true);
        const publicIds = [songToDelete.audioPublicId, songToDelete.albumArtPublicId, songToDelete.lyricsPublicId].filter(Boolean);
        
        const cloudinaryResponse = await fetch('/api/delete-cloudinary-media', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({ publicIds, songId: songToDelete.id, userId: currentUser.uid })
        });

        if (!cloudinaryResponse.ok) {
            const { error } = await cloudinaryResponse.json();
            throw new Error(error || 'Failed to delete media files from cloud.');
        }

        // 2. Delete document from Firestore
        await deleteDoc(doc(db, "songs", songToDelete.id));

        toast({ title: "Song Deleted", description: `"${songToDelete.title}" has been removed.` });
        setSongToDelete(null);

    } catch (err: any) {
        console.error("Error deleting song:", err);
        toast({ title: "Deletion Failed", description: err.message, variant: 'destructive' });
    } finally {
        setIsDeleting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  if (loading) {
    return <div className="text-center p-8 flex items-center justify-center"><Loader2 className="animate-spin mr-2"/>Loading your music library...</div>;
  }

  if (error) {
      return <div className="text-center py-16 px-8 glass-card rounded-lg mt-8"><AlertTriangle className="mx-auto text-red-400" size={48}/><h3 className="text-xl font-semibold mt-4 text-white/90">An Error Occurred</h3><p className="text-gray-400 mt-2">{error}</p></div>
  }

  if (songs.length === 0) {
    return (
        <div className="text-center py-16 px-8 glass-card-soft rounded-2xl mt-8">
            <Music className="mx-auto text-white/30" size={48}/>
            <h3 className="text-xl font-semibold mt-4 text-white/80">Your stage is quiet.</h3>
            <p className="text-gray-400 mt-2">Upload your first track to see it here.</p>
        </div>
    );
  }

  return (
    <>
      <ConfirmationDialog 
        isOpen={!!songToDelete} 
        onCancel={() => setSongToDelete(null)} 
        onConfirm={confirmDelete} 
        isDeleting={isDeleting}
      />
      <motion.div 
        variants={containerVariants} 
        initial="hidden"
        animate="visible"
        className="mt-8"
      >
          <h3 className="text-2xl font-bold mb-4 text-white/90">Your Uploaded Music</h3>
          <AnimatePresence>
              {songs.map((song, index) => (
                  <motion.div
                      key={song.id}
                      variants={itemVariants}
                      exit={{ opacity: 0, x: -50, height: 0, transition: { duration: 0.3 }}}
                      layout
                      className="flex items-center p-3 rounded-xl transition-colors bg-white/5 hover:bg-white/10 mb-2"
                  >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="relative flex-shrink-0 w-16 h-16">
                              <img src={song.albumArtUrl} alt={song.title} className="w-full h-full rounded-md object-cover" />
                              <button 
                                  onClick={() => handlePlayPause(song, index)}
                                  className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity rounded-md text-accent-cyan"
                              >
                                  {activeSong?.id === song.id && isPlaying ? <Pause size={32} /> : <Play size={32} />}
                              </button>
                          </div>
                          <div className="min-w-0 flex-1">
                              <p className={`font-bold text-lg truncate ${activeSong?.id === song.id ? 'text-accent-cyan' : 'text-white/90'}`}>{song.title}</p>
                              <p className="text-sm text-gray-400 truncate">{song.artist}</p>
                              <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                                  <span className="flex items-center gap-1"><PlayCircle size={14}/> {song.playCount || 0}</span>
                                  <span className="flex items-center gap-1"><Heart size={14}/> {song.likesCount || 0}</span>
                              </div>
                          </div>
                      </div>
                      <div className="flex items-center gap-1 ml-4">
                           <p className="text-sm text-gray-500 hidden md:block mr-4">{new Date(song.createdAt?.toDate()).toLocaleDateString()}</p>
                           <button disabled className="p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title="Edit (Coming Soon)">
                              <Edit size={16} />
                           </button>
                           <button onClick={() => handleDeleteRequest(song)} className="p-2 rounded-full hover:bg-red-500/20 text-red-400 transition-colors">
                              <Trash2 size={16} />
                           </button>
                      </div>
                  </motion.div>
              ))}
          </AnimatePresence>
      </motion.div>
    </>
  );
};
