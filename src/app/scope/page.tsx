
"use client";
import React, { useState, useEffect, useCallback } from "react";
import { getFirestore, collection, query, where, orderBy, onSnapshot, limit, getDocs, startAfter } from "firebase/firestore";
import { app } from "@/utils/firebaseClient";
import { VibeSpaceLoader } from "@/components/VibeSpaceLoader";
import { ShortsPlayer } from "@/components/ShortsPlayer";

const db = getFirestore(app);

export default function ScopePage() {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // This query fetches only posts that are videos, ordered by creation date.
        // The isVideo flag is set during the upload process.
        const q = query(
            collection(db, "posts"),
            where("isVideo", "==", true),
            orderBy("createdAt", "desc"),
            limit(20) // Let's start with a reasonable limit
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const videoPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPosts(videoPosts);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching video posts:", error);
            setLoading(false);
        });

        return () => unsub();
    }, []);

    if (loading) {
        return <VibeSpaceLoader />;
    }

    if (posts.length === 0) {
        return (
            <div className="flex flex-col min-h-screen items-center justify-center text-center">
                <h1 className="text-3xl font-headline font-bold text-accent-cyan">The Scope is Clear</h1>
                <p className="text-gray-400 mt-2">No short vibes have been posted yet. Be the first!</p>
            </div>
        )
    }

    return (
        <div className="w-full h-[calc(100vh-var(--nav-height,80px))] snap-y snap-mandatory overflow-y-scroll overflow-x-hidden">
            {posts.map((post, index) => (
                <div key={post.id} className="h-full w-full snap-start flex items-center justify-center">
                    <ShortsPlayer post={post} />
                </div>
            ))}
        </div>
    );
}
