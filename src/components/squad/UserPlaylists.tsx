'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  getFirestore, collection, doc,
  query as firestoreQuery, onSnapshot, getDoc, DocumentData
} from 'firebase/firestore';
import { app } from '@/utils/firebaseClient';
import { PostCard } from '@/components/PostCard';
import { ListMusic, Loader2, Play, ArrowLeft } from 'lucide-react';
import { motion } from "framer-motion";

const db = getFirestore(app);

type Post = { id: string; } & DocumentData;
type Playlist = { id: string; name: string; postIds: string[]; createdAt?: any; };

// --- Updated PlaylistCard Component Logic ---
const PlaylistCard = ({ playlist, onClick }: { playlist: Playlist; onClick: () => void; }) => {
    const [coverImages, setCoverImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCoverImages = async () => {
            setLoading(true);
            const postIds = playlist.postIds || [];
            const imagePromises: Promise<string | null>[] = postIds.slice(0, 4).map(async (postId) => {
                try {
                    const postSnap = await getDoc(doc(db, 'posts', postId));
                    if (postSnap.exists()) {
                        const postData = postSnap.data();
                        if (postData.thumbnailUrl) return postData.thumbnailUrl;
                        const mediaUrl = Array.isArray(postData.mediaUrl) ? postData.mediaUrl[0] : postData.mediaUrl;
                        if (mediaUrl && typeof mediaUrl === 'string' && !mediaUrl.endsWith('.mp4')) return mediaUrl;
                    }
                } catch (err) {
                  console.error(`Failed to fetch post ${postId} for cover art`, err);
                }
                return null;
            });

            const urls = (await Promise.all(imagePromises)).filter((url): url is string => !!url);
            setCoverImages(urls);
            setLoading(false);
        };

        fetchCoverImages();
    }, [playlist.id, playlist.postIds]);

    const imageGridClass = `grid gap-0.5 ${coverImages.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`;

    return (
        <motion.div
            whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.07)' }}
            transition={{ duration: 0.2 }}
            onClick={onClick}
            className="glass-card p-3 rounded-xl cursor-pointer flex flex-row items-center gap-4"
        >
            <div className="w-24 h-24 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                {loading ? (
                    <div className="w-full h-full flex items-center justify-center"><Loader2 className="animate-spin text-gray-500" /></div>
                ) : coverImages.length > 0 ? (
                    <div className={`w-full h-full ${imageGridClass}`}>
                        {coverImages.slice(0,4).map((url, index) => (
                           <img key={index} src={url} alt={`Playlist cover ${index + 1}`} className="w-full h-full object-cover" />
                        ))}
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-accent-purple/10">
                       <ListMusic className="text-accent-purple/50" size={32} />
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                 <h3 className="font-bold text-lg text-white truncate">{playlist.name}</h3>
                 <p className="text-sm text-gray-400">{playlist.postIds?.length || 0} posts</p>
            </div>
        </motion.div>
    );
};


// --- Main UserPlaylists Component ---
export function UserPlaylists({ userId }: { userId: string }) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [openPlaylist, setOpenPlaylist] = useState<Playlist | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    const q = firestoreQuery(collection(db, "users", userId, "playlists"));

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Playlist));
      data.sort((a, b) => (b.createdAt?.toDate?.() ?? 0) - (a.createdAt?.toDate?.() ?? 0));
      setPlaylists(data);
      setLoading(false);
    }, (err) => {
      console.error("Playlist fetch error:", err);
      setLoading(false);
    });

    return () => unsub();
  }, [userId]);

  const openAndLoadPlaylist = useCallback(async (playlist: Playlist) => {
    setOpenPlaylist(playlist);
    setPosts([]);
    setPostsLoading(true);

    const postIds = playlist.postIds || [];
    if (postIds.length === 0) { setPostsLoading(false); return; }

    try {
        const fetched = await Promise.all(
          postIds.map(async (id) => {
            const snap = await getDoc(doc(db, "posts", id));
            return snap.exists() ? { id: snap.id, ...snap.data() } as Post : null;
          })
        );
        setPosts(fetched.filter((p): p is Post => p !== null));
    } catch (error) {
        console.error("Error loading playlist posts:", error);
    } finally {
        setPostsLoading(false);
    }
  }, []);

  // --- Playlist Detail View ---
  if (openPlaylist) {
    return (
      <div className="w-full max-w-xl flex flex-col gap-4">
        <motion.button
          onClick={() => setOpenPlaylist(null)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-2 font-semibold"
          whileHover={{ x: -2 }}
        >
          <ArrowLeft size={18} /> Back to playlists
        </motion.button>
        <h2 className="text-3xl font-bold text-white">{openPlaylist.name}</h2>
        
        {postsLoading ? (
            <div className="flex justify-center mt-20"><Loader2 className="animate-spin text-accent-cyan"/></div>
        ) : posts.length > 0 ? (
             <div className="flex flex-col gap-6 mt-4">
                {posts.map(post => <PostCard key={post.id} post={post} collectionName="posts" />)}
            </div>
        ) : (
            <div className="text-gray-400 text-center mt-16 p-8 bg-white/5 rounded-2xl">
                <div className="text-lg font-semibold">No posts to display.</div>
                <p className="text-sm">The posts in this playlist may have been deleted.</p>
            </div>
        )}
      </div>
    );
  }

  // --- Playlist List View ---
  if (loading) {
    return (
        <div className="flex flex-col gap-4 w-full max-w-xl">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="glass-card p-3 rounded-xl flex flex-row items-center gap-4">
                    <div className="w-24 h-24 rounded-lg bg-white/5 animate-pulse"></div>
                    <div className="flex-1">
                        <div className="h-5 w-3/4 rounded bg-white/5 animate-pulse"></div>
                        <div className="h-4 w-1/2 rounded mt-2 bg-white/5 animate-pulse"></div>
                    </div>
                </div>
            ))}
        </div>
    );
  }

  if (playlists.length === 0) {
    return (
      <div className="text-gray-400 text-center mt-16">
        <div className="flex justify-center mb-4"><ListMusic size={48} className="text-gray-600"/></div>
        <div className="text-lg font-semibold">No playlists yet</div>
        <div className="text-sm">Your created playlists will appear here.</div>
      </div>
    );
  }

  return (
    <motion.div 
        className="flex flex-col gap-4 w-full max-w-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
    >
      {playlists.map(playlist => (
        <PlaylistCard key={playlist.id} playlist={playlist} onClick={() => openAndLoadPlaylist(playlist)} />
      ))}
    </motion.div>
  );
}