
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { recordDropView } from '@/lib/dropViewProcessor.client';

// Module-level Set to track viewed drops across component mounts.
const viewedDrops = new Set<string>();

export function useDropView(dropId: string) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !dropId || viewedDrops.has(dropId)) {
      return;
    }

    const timer = setTimeout(() => {
      viewedDrops.add(dropId);
      recordDropView(dropId, user.uid);
    }, 2000);

    return () => clearTimeout(timer);
  }, [dropId, user]);
}
