
'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/utils/firebaseClient';
import { Button } from "@/components/ui/button";

export default function Unposted({ setIsCreating }: { setIsCreating: (isCreating: boolean) => void }) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPrompt() {
      const promptDocRef = doc(db, 'prompts', 'current');
      const promptDoc = await getDoc(promptDocRef);
      if (promptDoc.exists()) {
        setPrompt(promptDoc.data().text);
      }
      setIsLoading(false);
    }

    fetchPrompt();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-4xl font-bold">The Drop</h1>
      <p className="text-lg text-muted-foreground">A new challenge awaits.</p>
      
      <div className="my-8 p-8 border rounded-lg">
        {isLoading ? (
          <p className="text-center">Loading prompt...</p>
        ) : (
          <p className="text-center">{prompt || 'No prompt set yet.'}</p>
        )}
      </div>
      
      {/* This will be a real countdown timer */}
      <div className="my-4 text-2xl font-bold">
        12:00:00
      </div>

      <Button onClick={() => setIsCreating(true)}>Create Drop</Button>
    </div>
  );
}
