
"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getFirestore, collection, addDoc, serverTimestamp, query, onSnapshot, where, updateDoc, arrayUnion, doc } from 'firebase/firestore';
import { auth, app } from '@/utils/firebaseClient';

const db = getFirestore(app);

export function AddToCollectionModal({ post, onClose }: { post: any; onClose: () => void }) {
    const [collections, setCollections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewCollection, setShowNewCollection] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState('');
    const currentUser = auth.currentUser;

    useEffect(() => {
        if (!currentUser) return;
        const q = query(collection(db, "collections"), where("ownerId", "==", currentUser.uid));
        const unsub = onSnapshot(q, (snapshot) => {
            setCollections(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsub();
    }, [currentUser]);

    const handleCreateCollection = async () => {
        if (!newCollectionName.trim() || !currentUser) return;
        await addDoc(collection(db, "collections"), {
            name: newCollectionName,
            ownerId: currentUser.uid,
            createdAt: serverTimestamp(),
            postIds: [post.id] // Add current post to new collection
        });
        setNewCollectionName('');
        setShowNewCollection(false);
        onClose(); // Close modal after creating and adding
    };
    
    const handleAddToCollection = async (collectionId: string) => {
        const collectionRef = doc(db, "collections", collectionId);
        await updateDoc(collectionRef, {
            postIds: arrayUnion(post.id)
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
                <h2 className="text-xl font-headline font-bold mb-4 text-accent-cyan">Save to Collection</h2>
                <div className="flex-1 overflow-y-auto mb-4 border-y border-accent-cyan/10 py-2">
                    {loading ? (
                        <p className="text-center text-gray-400">Loading collections...</p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {collections.map(c => (
                                <button key={c.id} onClick={() => handleAddToCollection(c.id)} className="text-left p-3 rounded-lg hover:bg-accent-cyan/10 w-full">
                                    {c.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                {showNewCollection ? (
                    <div className="flex gap-2">
                        <input 
                            type="text"
                            placeholder="New collection name..."
                            value={newCollectionName}
                            onChange={(e) => setNewCollectionName(e.target.value)}
                            className="input-glass flex-1"
                        />
                        <button onClick={handleCreateCollection} className="btn-glass bg-accent-pink">Create</button>
                    </div>
                ) : (
                    <button className="btn-glass bg-accent-cyan/50 text-white" onClick={() => setShowNewCollection(true)}>
                        Create New Collection
                    </button>
                )}
            </motion.div>
        </div>
    );
}

    
