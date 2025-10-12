
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getFirestore, collection, query, where, orderBy, getDocs, limit, startAfter } from 'firebase/firestore';
import { app } from '@/utils/firebaseClient';
import { VibeSpaceLoader } from '@/components/VibeSpaceLoader';
import { ShortsPlayer } from '@/components/ShortsPlayer';

const db = getFirestore(app);

function ScopePageContent() {
  const [shortVibes, setShortVibes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchVibes = useCallback(async () => {
    setLoading(true);
    // Corrected query to use `isVideo` which is more efficient and avoids indexing issues.
    const q = query(
      collection(db, 'posts'),
      where('isVideo', '==', true),
      orderBy('publishAt', 'desc'),
      limit(5)
    );
    const documentSnapshots = await getDocs(q);
    const vibes = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    setShortVibes(vibes);
    setLastVisible(documentSnapshots.docs[documentSnapshots.docs.length - 1]);
    setHasMore(vibes.length > 0);
    setLoading(false);
  }, []);

  const fetchMoreVibes = useCallback(async () => {
    if (!lastVisible || !hasMore) return;

    // Corrected query to use `isVideo`
    const q = query(
      collection(db, 'posts'),
      where('isVideo', '==', true),
      orderBy('publishAt', 'desc'),
      startAfter(lastVisible),
      limit(5)
    );
    const documentSnapshots = await getDocs(q);
    const newVibes = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    setShortVibes(prev => [...prev, ...newVibes]);
    setLastVisible(documentSnapshots.docs[documentSnapshots.docs.length - 1]);
    setHasMore(newVibes.length > 0);
  }, [lastVisible, hasMore]);

  useEffect(() => {
    fetchVibes();
  }, [fetchVibes]);

  if (loading && shortVibes.length === 0) {
    return <VibeSpaceLoader />;
  }

  if (shortVibes.length === 0) {
    return (
      <div className="text-gray-400 text-center mt-16">
        <div className="text-4xl mb-2">🎬</div>
        <div className="text-lg font-semibold">No Short Vibes Yet</div>
        <div className="text-sm">Be the first to create one!</div>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-theme(spacing.20))] md:h-[calc(100vh-theme(spacing.6))] flex items-center justify-center">
        <ShortsPlayer initialPosts={shortVibes} loadMorePosts={fetchMoreVibes} hasMore={hasMore} />
    </div>
  );
}

export default function ScopePage() {
    return <ScopePageContent />;
}
