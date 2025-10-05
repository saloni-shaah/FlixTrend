"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getFirestore, collection, query, orderBy, limit, getDocs, startAfter, where } from "firebase/firestore";
import { app } from "@/utils/firebaseClient";
import { ShortVibesPlayer } from './ShortVibesPlayer';
import { VibeSpaceLoader } from './VibeSpaceLoader';


const db = getFirestore(app);

export function ShortsPlayer({ initialPost, onClose }: { initialPost?: any, onClose: () => void }) {
    const [shortVibes, setShortVibes] = useState<any[]>(initialPost ? [initialPost] : []);
    const [loading, setLoading] = useState(true);
    const [lastVisible, setLastVisible] = useState<any>(null);
    const [hasMore, setHasMore] = useState(true);

    const fetchShorts = useCallback(async (startAfterDoc: any = null) => {
        setLoading(true);
        try {
            const mediaTypeQuery = where("type", "==", "media"); // Only media posts

            let q;
            if (startAfterDoc) {
                q = query(collection(db, "posts"), mediaTypeQuery, orderBy("createdAt", "desc"), startAfter(startAfterDoc), limit(5));
            } else {
                q = query(collection(db, "posts"), mediaTypeQuery, orderBy("createdAt", "desc"), limit(5));
            }
            const documentSnapshots = await getDocs(q);
            
            const fetchedVibes = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];
            setLastVisible(lastDoc);
            setHasMore(documentSnapshots.docs.length > 0);

            setShortVibes(prev => {
                const existingIds = new Set(prev.map(p => p.id));
                const newVibes = fetchedVibes.filter(v => !existingIds.has(v.id));
                return [...prev, ...newVibes];
            });

        } catch (error) {
            console.error("Error fetching shorts:", error);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (!initialPost) {
            fetchShorts();
        } else {
            setLoading(false);
        }
    }, [fetchShorts, initialPost]);


    if (loading && shortVibes.length === 0) {
        return <VibeSpaceLoader />;
    }

    return (
        <div className="fixed inset-0 z-[100] bg-black">
            <button onClick={onClose} className="absolute top-4 right-4 z-50 text-white bg-black/30 rounded-full p-2">
                &times;
            </button>
            <ShortVibesPlayer shortVibes={shortVibes} onEndReached={() => fetchShorts(lastVisible)} hasMore={hasMore}/>
        </div>
    );
}
