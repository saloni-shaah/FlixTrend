
"use client";
import React, { useState, useRef } from 'react';
import { Radio, Loader2, UploadCloud, X } from 'lucide-react';
import { useAppState } from '@/utils/AppStateContext';
import { useRouter } from 'next/navigation';
import { storage } from '@/utils/firebaseClient';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export function LivePostForm({ data, onDataChange }: { data: any, onDataChange: (data: any) => void }) {
  const { currentUserProfile } = useAppState();
  const router = useRouter();
  const [isGoingLive, setIsGoingLive] = useState(false);
  const [error, setError] = useState('');
  
  // Thumbnail state
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onDataChange({ ...data, title: e.target.value });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Thumbnail image must be less than 5MB.');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file.');
        return;
      }
      setError('');
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveThumbnail = () => {
    setThumbnailFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadThumbnail = async (file: File, userId: string): Promise<string> => {
    const fileExtension = file.name.split('.').pop();
    const thumbnailRef = ref(storage, `thumbnails/${userId}-${Date.now()}.${fileExtension}`);
    const snapshot = await uploadBytes(thumbnailRef, file);
    return getDownloadURL(snapshot.ref);
  };

  const handleGoLive = async () => {
    if (!data.title) {
      setError('Please enter a title for your stream.');
      return;
    }
    if (!thumbnailFile) {
      setError('Please upload a thumbnail for your stream.');
      return;
    }
    if (!currentUserProfile) {
      setError('You must be logged in to go live.');
      return;
    }

    setIsGoingLive(true);
    setError('');

    try {
      // 1. Upload Thumbnail
      const thumbnailUrl = await uploadThumbnail(thumbnailFile, currentUserProfile.uid);

      // 2. Create the live post and get the token
      const response = await fetch('/api/posts/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          thumbnailUrl,
          authorId: currentUserProfile.uid,
          authorName: currentUserProfile.displayName,
          authorAvatar: currentUserProfile.photoURL
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create live stream.');
      }

      const { roomName } = result;
      
      // 3. Redirect to the broadcast page
      router.push(`/broadcast/${roomName}`);

    } catch (err: any) {
      console.error("Failed to go live:", err);
      setError(err.message || 'Something went wrong. Please try again.');
      setIsGoingLive(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
        <div className="flex flex-col items-center gap-4 text-center">
            <Radio className="text-red-500 animate-pulse" size={48} />
            <h3 className="text-xl font-bold text-white">Set Up Your Live Stream</h3>
            <p className="text-sm text-gray-400">Add a title and a thumbnail to attract viewers.</p>
        </div>

        {/* Thumbnail Uploader */}
        <div className="w-full">
            {previewUrl ? (
                <div className="relative group w-full aspect-video rounded-lg overflow-hidden border-2 border-dashed border-gray-600">
                    <img src={previewUrl} alt="Thumbnail preview" className="w-full h-full object-cover" />
                    <button onClick={handleRemoveThumbnail} className="absolute top-2 right-2 bg-black bg-opacity-50 p-1.5 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={18} />
                    </button>
                </div>
            ) : (
                <label htmlFor="thumbnail-upload" className="cursor-pointer w-full aspect-video bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-600 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-800/60 hover:border-gray-500 transition-colors">
                    <UploadCloud size={40} />
                    <span className="mt-2 text-sm font-semibold">Upload Thumbnail</span>
                    <span className="text-xs">Image (5MB Max)</span>
                </label>
            )}
            <input ref={fileInputRef} type="file" id="thumbnail-upload" accept="image/*" onChange={handleFileChange} className="hidden" />
        </div>

        {/* Title Input */}
        <input
            type="text"
            name="title"
            className="input-glass w-full mt-2"
            placeholder="Live Stream Title"
            value={data.title || ''}
            onChange={handleTitleChange}
        />

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <button 
          className="btn-primary bg-red-600 hover:bg-red-700 w-full mt-4 disabled:opacity-50"
          onClick={handleGoLive}
          disabled={isGoingLive}
        >
            {isGoingLive ? <Loader2 className="animate-spin mx-auto" /> : 'Go Live'}
        </button>
    </div>
  );
}
