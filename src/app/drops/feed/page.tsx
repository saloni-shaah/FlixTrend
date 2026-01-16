'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getFirestore, collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { app } from '@/utils/firebaseClient';
import { PostCard } from '@/components/PostCard';
import { Sparkles, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { VibeSpaceLoader } from '@/components/VibeSpaceLoader';

const db = getFirestore(app);

function DropFeedContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const promptId = searchParams.get('promptId');
    const [drops, setDrops] = useState<any[]>([]);
    const [prompt, setPrompt] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!promptId) {
            router.push('/drop');
            return;
        }

        const fetchDropsAndPrompt = async () => {
            setLoading(true);
            try {
                // Fetch Prompt
                const promptDocRef = doc(db, 'dropPrompts', promptId);
                const promptDoc = await getDoc(promptDocRef);
                if (promptDoc.exists()) {
                    setPrompt(promptDoc.data());
                }

                // Fetch Drops from the 'posts' collection
                const dropsQuery = query(
                    collection(db, 'posts'), 
                    where('promptId', '==', promptId),
                    where('type', '==', 'drop'),
                    orderBy('createdAt', 'desc')
                );
                const dropsSnapshot = await getDocs(dropsQuery);
                setDrops(dropsSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));

            } catch (error) {
                console.error("Error fetching drops feed:", error);
            }
            setLoading(false);
        };

        fetchDropsAndPrompt();
    }, [promptId, router]);
    
    if (loading) {
        return <VibeSpaceLoader />;
    }

    return (
        <div className="container mx-auto p-4 max-w-2xl">
            <Link href="/drop" className="btn-glass mb-8 inline-flex items-center gap-2">
                <ArrowLeft /> Back to Prompt
            </Link>

            {prompt && (
                 <div className="w-full glass-card p-6 mb-8 flex flex-col items-center text-center">
                    <div className="flex items-center gap-3 text-lg font-bold text-accent-cyan mb-3">
                        <Sparkles className="h-6 w-6" />
                        <h1 className="font-headline">Daily Drop</h1>
                    </div>
                    <p className="text-white/90 text-xl">{prompt.text}</p>
                 </div>
            )}

            <div className="flex flex-col gap-6">
                {drops.length > 0 ? (
                    drops.map(drop => <PostCard key={drop.id} post={drop} />)
                ) : (
                     <div className="text-center text-gray-400 p-8 glass-card">
                        <p>No drops have been submitted for this prompt yet. Be the first!</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function DropFeedPage() {
    return (
        <Suspense fallback={<VibeSpaceLoader />}>
            <DropFeedContent />
        </Suspense>
    )
}
