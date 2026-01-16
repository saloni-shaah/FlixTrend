
'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getFirestore, doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, app } from '@/utils/firebaseClient';
import { User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Loader, CheckCircle } from 'lucide-react';

const db = getFirestore(app);
const storage = getStorage(app);

function CreateDropPage() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [prompt, setPrompt] = useState<{ id: string; text: string } | null>(null);
  const [details, setDetails] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAlreadyDropped, setHasAlreadyDropped] = useState(false);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams();
  const promptId = searchParams.get('promptId');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        setUserProfile(userDoc.data());
      }

      if (promptId) {
          const dropsQuery = query(
              collection(db, 'drops'), 
              where('userId', '==', currentUser.uid),
              where('promptId', '==', promptId)
          );
          const dropsSnapshot = await getDocs(dropsQuery);
          if (!dropsSnapshot.empty) {
              setHasAlreadyDropped(true);
          }
      }
    });
    return () => unsubscribe();
  }, [router, promptId]);

  useEffect(() => {
    const fetchPrompt = async () => {
      if (promptId) {
        const promptDocRef = doc(db, 'dropPrompts', promptId);
        const promptDoc = await getDoc(promptDocRef);
        if (promptDoc.exists()) {
          setPrompt({ id: promptDoc.id, text: promptDoc.data().text });
        }
      }
      setLoading(false);
    };
    
    if (promptId) {
        fetchPrompt();
    }

  }, [promptId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!user || !promptId || !image || !userProfile) {
      alert('User data not loaded or file not selected. Please try again.');
      return;
    }
    if (hasAlreadyDropped) return;

    setIsSubmitting(true);

    try {
      const imageRef = ref(storage, `drops/${user.uid}/drop_${Date.now()}_${image.name}`);
      await uploadBytes(imageRef, image);
      const imageUrl = await getDownloadURL(imageRef);

      await addDoc(collection(db, 'drops'), {
        userId: user.uid,
        username: userProfile.username || 'anonymous',
        avatar_url: userProfile.avatar_url || null,
        promptId: promptId,
        promptText: prompt?.text,
        content: details,
        mediaUrl: [imageUrl],
        createdAt: serverTimestamp(),
        publishAt: serverTimestamp(),
        likes: {},
        commentCount: 0,
        isVideo: false,
        viewCount: 0,
      });

      router.push(`/drop`); // Redirect back to the drop page to see the feed

    } catch (error) {
      console.error("Error creating drop:", error);
      alert("There was an error creating your drop. Please check the console and try again.");
      setIsSubmitting(false);
    }
  };

  if (loading) {
      return <div className="container mx-auto p-4 text-center">Loading...</div>;
  }

  if (!promptId || !prompt) {
    return <div className="container mx-auto p-4 text-center">Invalid or missing prompt. Please go back to the Drops page.</div>;
  }

  if (hasAlreadyDropped) {
    return (
        <div className="container mx-auto p-4 max-w-2xl text-center">
            <div className="glass-card p-8">
                <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                <h1 className="text-2xl font-bold mb-2">You've already dropped!</h1>
                <p className="text-gray-400 mb-6">You can only submit one drop per prompt. Check out the feed to see what others created!</p>
                <Button onClick={() => router.push('/drop')} className="bg-accent-cyan hover:bg-accent-cyan/80">
                    Back to Drops
                </Button>
            </div>
        </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">Create a Drop</h1>
      <p className="text-gray-400 mb-6">Responding to: <span className='font-semibold text-accent-cyan'>{prompt.text}</span></p>

      <div className="flex flex-col gap-6">
        <textarea
          className="input-glass w-full rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-pink"
          rows={4}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Add some details about your drop... (optional)"
        />

        <div>
          <label htmlFor="image-upload" className="cursor-pointer w-full h-48 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center hover:border-accent-pink transition-colors">
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
            ) : (
              <div className="text-center">
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                <span className="mt-2 block text-sm font-medium text-gray-400">Click to upload your drop image</span>
              </div>
            )}
          </label>
          <input id="image-upload" type="file" accept="image/*" className="sr-only" onChange={handleImageChange} />
        </div>

        <Button onClick={handleSubmit} disabled={isSubmitting || !image} className="w-full bg-accent-pink hover:bg-accent-pink/80 text-lg font-bold py-6">
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <Loader className="animate-spin h-5 w-5" />
              <span>Submitting Drop...</span>
            </div>
          ) : 'Submit Drop'}
        </Button>
      </div>
    </div>
  );
}

export default function CreateDropPageWrapper() {
    return (
        <Suspense fallback={<div className="container mx-auto p-4 text-center">Loading Drop...</div>}>
            <CreateDropPage />
        </Suspense>
    );
}
