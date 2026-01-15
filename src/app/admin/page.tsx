'use client';

import { useState, useEffect } from 'react';
import { doc, setDoc, getDoc, collection } from 'firebase/firestore';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { db, auth } from '@/utils/firebaseClient';
import { Button } from "@/components/ui/button";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function Admin() {
  const [prompt, setPrompt] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [isFounder, setIsFounder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data().role === 'founder') {
          setIsFounder(true);
        } else {
          setIsFounder(false);
        }
      } else {
        setIsFounder(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, { email: user.email, displayName: user.displayName }, { merge: true });
    } catch (error) {
      console.error("Error signing in:", error);
    }
  };

  const handleSavePrompt = async () => {
    if (!user) {
      alert("You must be logged in to save a prompt.");
      return;
    }
    setIsSaving(true);
    const promptDocRef = doc(collection(db, 'dropPrompts'));
    
    const now = new Date();
    const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

    const promptData = { 
      text: prompt, 
      createdAt: now, 
      expiresAt: expires 
    };

    try {
      await setDoc(promptDocRef, promptData);
      alert('Prompt saved successfully!');
    } catch (error) {
      console.error("Error saving prompt:", error);

      // Emit a detailed error for the listener to catch
      const permissionError = new FirestorePermissionError({
        path: promptDocRef.path,
        operation: 'write',
        requestResourceData: promptData,
      });
      errorEmitter.emit('permission-error', permissionError);

    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4"><p>Loading...</p></div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
      {user ? (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p>Welcome, {user.displayName} ({user.email})</p>
            <Button onClick={() => auth.signOut()}>Sign Out</Button>
          </div>
          {isFounder ? (
            <div className="flex flex-col gap-4">
              <textarea
                className="w-full p-2 border rounded"
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter the new prompt here..."
              />
              <Button onClick={handleSavePrompt} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Prompt'}
              </Button>
            </div>
          ) : (
            <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
              <p className="font-bold">Permission Denied</p>
              <p>You have signed in, but you do not have the 'founder' role required to post a prompt. Please go to the Firebase console and add the field `role` with the value `founder` to your user document in the `users` collection.</p>
            </div>
          )}
        </div>
      ) : (
        <div>
          <p>Please sign in to manage the prompt.</p>
          <Button onClick={handleSignIn}>Sign in with Google</Button>
        </div>
      )}
    </div>
  );
}
