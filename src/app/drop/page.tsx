'use client';

import { useState, useEffect } from 'react';
import Unposted from '@/components/drop/Unposted';
import Creating from '@/components/drop/Creating';
import Posted from '@/components/drop/Posted';

export default function DropPage() {
  const [userHasPosted, setUserHasPosted] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // In a real application, this would be determined by fetching user data
  useEffect(() => {
    // For now, we'll just simulate the user not having posted
    setUserHasPosted(false);
  }, []);

  if (isCreating) {
    return <Creating />;
  }

  if (userHasPosted) {
    return <Posted />;
  }

  return <Unposted setIsCreating={setIsCreating} />;
}
