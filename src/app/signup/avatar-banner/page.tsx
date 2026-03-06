
'use client';

import { useState, useRef } from 'react';
import { getAuth } from 'firebase/auth';
import { doc, updateDoc, getFirestore } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Image as ImageIcon, UploadCloud } from 'lucide-react';

export default function AvatarBannerPage() {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const router = useRouter();
  const auth = getAuth();
  const db = getFirestore();
  const storage = getStorage();

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      if (type === 'avatar') {
        setAvatarFile(file);
        setAvatarPreview(previewUrl);
      } else {
        setBannerFile(file);
        setBannerPreview(previewUrl);
      }
    }
  };

  const uploadFile = (file: File, path: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const storageRef = ref(storage, path);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(progress);
            },
            (error) => {
                console.error("Upload failed:", error);
                reject('Failed to upload image. Please try again.');
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(downloadURL);
            }
        );
    });
  }

  const handleFinish = async () => {
    setLoading(true);
    setError('');

    const user = auth.currentUser;
    if (!user) {
        setError('You must be logged in to continue.');
        router.push('/login');
        setLoading(false);
        return;
    }

    if (!avatarFile || !bannerFile) {
        setError('Please select both an avatar and a banner image.');
        setLoading(false);
        return;
    }

    try {
        const avatarPath = `user_uploads/${user.uid}/avatar-${Date.now()}`;
        const bannerPath = `user_uploads/${user.uid}/banner-${Date.now()}`;

        const avatar_url = await uploadFile(avatarFile, avatarPath);
        const banner_url = await uploadFile(bannerFile, bannerPath);
        
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
            avatar_url,
            banner_url,
            profileComplete: true,
        });

        router.push('/vibespace?new=true');
    } catch (error: any) {
        setError(error.message || 'An unexpected error occurred during upload.');
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card p-8 w-full max-w-lg flex flex-col gap-6"
      >
        <h2 className="text-3xl font-headline font-bold text-accent-pink mb-4 text-center">Customize Your Profile</h2>
        
        <div 
          className="w-full rounded-xl overflow-hidden bg-gray-800/50 shadow-inner mb-4 cursor-pointer"
          onClick={() => bannerInputRef.current?.click()}
        >
            <div className={`h-32 w-full flex items-center justify-center relative ${bannerPreview ? '' : 'bg-gray-700/50'}`}>
                {bannerPreview ? 
                    <img src={bannerPreview} alt="Banner Preview" className="h-full w-full object-cover" /> : 
                    <div className="flex flex-col items-center text-gray-400"><UploadCloud size={30}/><span className="text-sm mt-1">Upload Banner</span></div>
                }
            </div>
            <div className="p-4 relative">
                <div 
                  className={`absolute -top-12 left-6 w-24 h-24 rounded-full flex items-center justify-center border-4 border-background overflow-hidden cursor-pointer ${avatarPreview ? '' : 'bg-gray-600'}`}
                  onClick={(e) => {e.stopPropagation(); avatarInputRef.current?.click();}}
                >
                      {avatarPreview ? 
                        <img src={avatarPreview} alt="Avatar Preview" className="h-full w-full object-cover" /> : 
                        <div className="flex flex-col items-center text-gray-400"><User size={30}/><span className="text-xs mt-1">Avatar</span></div>
                    }
                </div>
                <div className="h-12"></div>
            </div>
        </div>

        <input type="file" accept="image/*" ref={avatarInputRef} onChange={(e) => handleFileChange(e, 'avatar')} className="hidden" />
        <input type="file" accept="image/*" ref={bannerInputRef} onChange={(e) => handleFileChange(e, 'banner')} className="hidden" />

        {loading && (
            <div className="w-full bg-gray-700/50 rounded-full h-2.5">
                <div className="bg-accent-cyan h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
            </div>
        )}

        <motion.button
            whileHover={{ scale: loading ? 1 : 1.05 }}
            whileTap={{ scale: loading ? 1 : 0.95 }}
            onClick={handleFinish}
            disabled={loading || !avatarFile || !bannerFile}
            className="btn-glass mt-4 bg-accent-cyan/80 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? `Uploading... ${Math.round(uploadProgress)}%` : 'Finish & Enter VibeSpace'}
        </motion.button>

        {error && <div className="text-red-400 text-center animate-bounce mt-2">{error}</div>}
      </motion.div>
    </div>
  );
}
