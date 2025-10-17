"use client";
import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query as firestoreQuery, onSnapshot, where, getDocs } from 'firebase/firestore';
import { app } from '@/utils/firebaseClient';
import { PostCard } from '@/components/PostCard';
import { Folder, Bookmark } from 'lucide-react';

const db = getFirestore(app);

function CollectionDetailView({ collection, onBack }: { collection: any, onBack: () => void }) {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            if (!collection.postIds || collection.postIds.length === 0) {
                setLoading(false);
                return;
            }
            // Firestore 'in' queries are limited to 30 items. For a real app, pagination would be needed here.
            const postsQuery = firestoreQuery(collection(db, "posts"), where("__name__", "in", collection.postIds.slice(0, 30)));
            const postsSnap = await getDocs(postsQuery);
            setPosts(postsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        };
        fetchPosts();
    }, [collection]);

    return (
        <div className="w-full max-w-xl flex flex-col gap-6">
            <button onClick={onBack} className="btn-glass self-start">{"< Back to Collections"}</button>
            <h2 className="text-2xl font-bold text-accent-cyan">{collection.name}</h2>
            {loading && <p className="text-center text-gray-400">Loading posts...</p>}
            {!loading && posts.length === 0 && <p className="text-center text-gray-400">This collection is empty.</p>}
            {posts.map(post => <PostCard key={post.id} post={post} />)}
        </div>
    );
}

export function UserCollections({ userId }: { userId: string }) {
    const [collections, setCollections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCollection, setSelectedCollection] = useState<any | null>(null);

    useEffect(() => {
        const q = firestoreQuery(collection(db, "collections"), where("ownerId", "==", userId));
        const unsub = onSnapshot(q, (snapshot) => {
            const collectionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            collectionsData.sort((a:any, b:any) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));
            setCollections(collectionsData);
            setLoading(false);
        });
        return () => unsub();
    }, [userId]);

    if (loading) return <div className="text-gray-400 text-center mt-16 animate-pulse">Loading collections...</div>;

    if (selectedCollection) {
        return <CollectionDetailView collection={selectedCollection} onBack={() => setSelectedCollection(null)} />
    }

    if (collections.length === 0) {
        return (
            <div className="text-gray-400 text-center mt-16">
                <div className="text-4xl mb-2"><Bookmark /></div>
                <div className="text-lg font-semibold">No collections yet</div>
                <div className="text-sm">Save posts to a collection to see them here.</div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-xl grid grid-cols-2 md:grid-cols-3 gap-4">
            {collections.map(collectionItem => (
                <div key={collectionItem.id} className="glass-card rounded-lg overflow-hidden cursor-pointer" onClick={() => setSelectedCollection(collectionItem)}>
                    <div className="w-full aspect-square bg-accent-pink/20 flex items-center justify-center">
                        <Folder className="text-accent-pink" size={48} />
                    </div>
                    <div className="p-3">
                        <h3 className="font-bold text-accent-cyan truncate">{collectionItem.name}</h3>
                        <p className="text-xs text-gray-400">{collectionItem.postIds?.length || 0} posts</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
