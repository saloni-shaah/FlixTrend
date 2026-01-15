'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Assuming you have a firebase config file

// This is a placeholder for a real authentication hook
const useAuth = () => {
  // In a real app, you'd get the user from your auth provider
  const [user, setUser] = useState({ uid: 'some-user-id', role: 'founder' }); //- FOR TESTING, REMOVE LATER
  return { user };
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isFounder, setIsFounder] = useState(false);

  useEffect(() => {
    async function checkUserRole() {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsFounder(userData.role === 'founder');
        }
      }
      setIsLoading(false);
    }

    checkUserRole();
  }, [user]);

  useEffect(() => {
    async function fetchPrompt() {
      const promptDocRef = doc(db, 'prompts', 'current');
      const promptDoc = await getDoc(promptDocRef);
      if (promptDoc.exists()) {
        setPrompt(promptDoc.data().text);
      }
    }

    fetchPrompt();
  }, []);

  const handleSavePrompt = async () => {
    const promptDocRef = doc(db, 'prompts', 'current');
    await setDoc(promptDocRef, { text: prompt });
    alert('Prompt saved!');
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isFounder) {
    return <div>You do not have permission to access this page.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div className="flex flex-col gap-4">
        <textarea
          className="p-2 border rounded"
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter the new prompt for the drop"
        />
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={handleSavePrompt}
        >
          Save Prompt
        </button>
      </div>
    </div>
  );
}
