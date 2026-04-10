
'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getFirestore, doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs, limit } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, app } from '@/utils/firebaseClient';
import { User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Video, Loader, CheckCircle, X } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { DropPollForm } from '@/components/create/forms/DropPollForm';

const db = getFirestore(app);
const storage = getStorage(app);

function CreateDropPage() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [prompt, setPrompt] = useState<{ id: string; text: string } | null>(null);
  const [details, setDetails] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAlreadyDropped, setHasAlreadyDropped] = useState(false);
  const [hasPollBeenCreated, setHasPollBeenCreated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const promptId = searchParams.get('promptId');
  const formType = searchParams.get('type');

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
          
          const pollQuery = query(collection(db, 'drop_polls'), where('promptId', '==', promptId), limit(1));
          const pollSnapshot = await getDocs(pollQuery);
          if (!pollSnapshot.empty) {
            setHasPollBeenCreated(true);
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      let currentTotalSize = files.reduce((acc, file) => acc + file.size, 0);
      const MAX_TOTAL_SIZE = 75 * 1024 * 1024; // 75MB
      const MAX_FILES = 50;

      const acceptedFiles: File[] = [];
      const acceptedPreviews: string[] = [];

      for (const file of newFiles) {
        if (files.length + acceptedFiles.length >= MAX_FILES) {
          setUploadError(`You can upload a maximum of ${MAX_FILES} files.`);
          break;
        }

        let processedFile = file;
        if (file.type.startsWith('image/')) {
            try {
              const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
              };
              processedFile = await imageCompression(file, options);
            } catch (error) {
              console.error('Image compression error: ', error);
              // Keep original file if compression fails
            }
        }

        if (currentTotalSize + processedFile.size > MAX_TOTAL_SIZE) {
          setUploadError(`Total file size cannot exceed 75MB.`);
          break; 
        }

        currentTotalSize += processedFile.size;
        acceptedFiles.push(processedFile);
        acceptedPreviews.push(URL.createObjectURL(processedFile));
      }

      if (acceptedFiles.length > 0) {
        setFiles([...files, ...acceptedFiles]);
        setPreviews([...previews, ...acceptedPreviews]);
      }
      
      e.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user || !promptId || files.length === 0 || !userProfile) {
      alert('User data not loaded or no files selected. Please try again.');
      return;
    }
    if (hasAlreadyDropped) return;

    setIsSubmitting(true);

    try {
      const mediaUrls = await Promise.all(
        files.map(async (file) => {
          const storageRef = ref(storage, `drops/${user.uid}/drop_${Date.now()}_${file.name}`);
          await uploadBytes(storageRef, file);
          return await getDownloadURL(storageRef);
        })
      );

      await addDoc(collection(db, 'drops'), {
        userId: user.uid,
        username: userProfile.username || 'anonymous',
        avatar_url: userProfile.avatar_url || null,
        promptId: promptId,
        promptText: prompt?.text,
        content: details,
        mediaUrl: mediaUrls,
        rawMediaUrl: mediaUrls,
        processingComplete: false,
        createdAt: serverTimestamp(),
        publishAt: serverTimestamp(),
        likes: {},
        commentCount: 0,
        isVideo: files.some(file => file.type.startsWith('video/')),
        viewCount: 0,
      });

      router.push(`/drop`);

    } catch (error) {
      console.error('Error creating drop:', error);
      alert('There was an error creating your drop. Please check the console and try again.');
      setIsSubmitting(false);
    }
  };
  
  const handlePollSubmit = async (pollData: any) => {
    if (!user || !promptId || !userProfile || hasPollBeenCreated || !hasAlreadyDropped) {
        alert("You are not eligible to create a poll.");
        return;
    }

    setIsSubmitting(true);
    try {
        await addDoc(collection(db, "drop_polls"), {
            ...pollData,
            promptId: promptId,
            userId: user.uid,
            username: userProfile.username,
            createdAt: serverTimestamp(),
        });
        router.push("/drop");
    } catch (error) {
        console.error("Error creating poll:", error);
        alert("Failed to create poll. Please try again.");
        setIsSubmitting(false);
    }
  };

  if (loading) {
      return <div className="container mx-auto p-4 text-center">Loading...</div>;
  }

  if (!promptId || !prompt) {
    return <div className="container mx-auto p-4 text-center">Invalid or missing prompt. Please go back to the Drops page.</div>;
  }

  if (formType === 'poll') {
    if (hasPollBeenCreated) {
        return (
            <div className="container mx-auto p-4 max-w-2xl text-center">
                <div className="glass-card p-8">
                    <h1 className="text-2xl font-bold mb-2">Poll Already Created!</h1>
                    <p className="text-gray-400 mb-6">A poll for this drop has already been created. Thanks for participating!</p>
                    <Button onClick={() => router.push('/drop')} className="bg-accent-cyan hover:bg-accent-cyan/80">
                        Back to Drops
                    </Button>
                </div>
            </div>
        );
    }
     if (!hasAlreadyDropped) {
        return (
            <div className="container mx-auto p-4 max-w-2xl text-center">
                <div className="glass-card p-8">
                    <h1 className="text-2xl font-bold mb-2">Create a Drop First!</h1>
                    <p className="text-gray-400 mb-6">You need to post your own drop for this prompt before you can create a poll.</p>
                    <Button onClick={() => router.push(`/drop/create?promptId=${promptId}`)} className="bg-accent-cyan hover:bg-accent-cyan/80">
                        Create a Drop
                    </Button>
                </div>
            </div>
        );
    }
    return <DropPollForm onSubmit={handlePollSubmit} isSubmitting={isSubmitting} />;
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
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 mb-4">
            {previews.map((preview, index) => (
              <div key={index} className="relative group">
                <div className="aspect-w-1 aspect-h-1">
                  {files[index].type.startsWith('video/') ? (
                    <video src={preview} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <img src={preview} alt={`Preview ${index}`} className="w-full h-full object-cover rounded-lg" />
                  )}
                </div>
                <button 
                  onClick={() => removeFile(index)} 
                  className="absolute top-1 right-1 bg-black bg-opacity-50 rounded-full p-1 text-white hover:bg-opacity-75 transition-opacity opacity-0 group-hover:opacity-100"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            {files.length < 50 && (
              <label htmlFor="file-upload" className="cursor-pointer w-full h-24 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center hover:border-accent-pink transition-colors">
                <div className="text-center">
                  <ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
                  <span className="mt-1 block text-xs font-medium text-gray-400">Add Photos/Video</span>
                </div>
              </label>
            )}
          </div>
          <input id="file-upload" type="file" accept="image/*,video/*" multiple className="sr-only" onChange={handleFileChange} />
        </div>

        {uploadError && <p className="text-red-500 text-xs mt-2">{uploadError}</p>}

        <Button onClick={handleSubmit} disabled={isSubmitting || files.length === 0} className="w-full bg-accent-pink hover:bg-accent-pink/80 text-lg font-bold py-6">
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
