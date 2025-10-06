"use client";
import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, X, MapPin, Smile, Hash, AtSign, Locate, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import { uploadFileToFirebaseStorage } from '@/app/actions';
import { auth } from '@/utils/firebaseClient';

export function MediaPostForm({ data, onDataChange }: { data: any, onDataChange: (data: any) => void }) {
    const [mediaPreviews, setMediaPreviews] = useState<(string)[]>(data.mediaUrl || []);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);

    // This effect ensures that if data comes from another source (like a remix), the previews are updated.
    React.useEffect(() => {
        if (data.mediaUrl) {
            setMediaPreviews(data.mediaUrl);
        }
    }, [data.mediaUrl]);
    
    const handleFileUpload = async (file: File) => {
        const user = auth.currentUser;
        if (!user) {
            setUploadError("You must be logged in to upload files.");
            return;
        }

        const previewUrl = URL.createObjectURL(file);
        setUploadingFiles(prev => [...prev, previewUrl]);
        setUploadError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('userId', user.uid);
            
            const result = await uploadFileToFirebaseStorage(formData);
            
            if (result.success?.url) {
                // IMPORTANT: The file is uploaded, and now we only deal with the URL.
                // This URL is a simple string and is serializable.
                const newUrls = [...(data.mediaUrl || []), result.success.url];
                onDataChange({ ...data, mediaUrl: newUrls });
                setMediaPreviews(newUrls); // Update local preview state with final URL
            } else {
                throw new Error(result.failure || "File upload failed.");
            }
        } catch (error: any) {
            console.error("Upload failed:", error);
            setUploadError(error.message);
        } finally {
            setUploadingFiles(prev => prev.filter(p => p !== previewUrl));
            // We don't need to revoke object URL because we are replacing previews with final URLs
        }
    };

    const processFiles = async (files: File[]) => {
        const imageVideoAudioFiles = files.filter(file => 
            file.type.startsWith('image/') || 
            file.type.startsWith('video/') || 
            file.type.startsWith('audio/')
        );
        if (imageVideoAudioFiles.length === 0) return;

        // Process uploads one by one to avoid race conditions
        for (const file of imageVideoAudioFiles) {
            await handleFileUpload(file);
        }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            processFiles(Array.from(e.target.files));
        }
    };
    
    const removeMedia = (urlToRemove: string) => {
        const newUrls = (data.mediaUrl || []).filter((url: string) => url !== urlToRemove);
        onDataChange({ ...data, mediaUrl: newUrls });
        setMediaPreviews(newUrls);
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onDataChange({ ...data, [e.target.name]: e.target.value });
    };

    const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }, []);
    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);
    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); }, []);
    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(Array.from(e.dataTransfer.files));
            e.dataTransfer.clearData();
        }
    }, [data, onDataChange]); // Dependencies updated

    const handleGetLocation = () => {
        if (navigator.geolocation) {
            setIsFetchingLocation(true);
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const locationData = await response.json();
                    const city = locationData.address.city || locationData.address.town || locationData.address.village;
                    const country = locationData.address.country;
                    if(city && country){
                        onDataChange({ ...data, location: `${city}, ${country}` });
                    } else {
                         onDataChange({ ...data, location: 'Unknown Location' });
                    }
                } catch (error) {
                    console.error("Error fetching location name:", error);
                    onDataChange({ ...data, location: 'Could not fetch name' });
                } finally {
                    setIsFetchingLocation(false);
                }
            }, (error) => {
                console.error("Geolocation error:", error.message);
                if (error.code !== error.PERMISSION_DENIED) {
                    alert("Could not get location. Please enable location services for this site.");
                }
                setIsFetchingLocation(false);
            });
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <input type="text" name="title" placeholder="Title" className="input-glass text-lg" value={data.title || ''} onChange={handleTextChange} />
            
            <textarea
                name="caption"
                className="input-glass w-full rounded-2xl"
                placeholder="Write a caption..."
                value={data.caption || ''}
                onChange={handleTextChange}
            />

            <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input type="text" name="hashtags" placeholder="#trending #vibes" className="input-glass w-full pl-10" value={data.hashtags || ''} onChange={handleTextChange} />
            </div>
            
            <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input type="text" name="mentions" placeholder="@friend1 @friend2" className="input-glass w-full pl-10" value={data.mentions || ''} onChange={handleTextChange} />
            </div>
            
            <div 
                className={`p-4 border-2 border-dashed rounded-2xl text-center transition-colors duration-300 ${isDragging ? 'border-accent-pink bg-accent-pink/10' : 'border-accent-cyan/30'}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <div className="flex flex-col items-center justify-center gap-2 mx-auto">
                    <UploadCloud className={`transition-transform duration-300 ${isDragging ? 'scale-110' : ''}`} />
                    <p className="text-sm text-gray-400">{isDragging ? 'Drop your files here!' : 'Drag & drop files or click to upload'}</p>
                    <button type="button" className="btn-glass mt-2" onClick={() => fileInputRef.current?.click()}>
                        Choose from Device
                    </button>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple accept="image/*,video/*,audio/*" />
                <p className="text-xs text-gray-500 mt-2">Also supports camera and gallery on mobile.</p>
                {uploadError && <p className="text-red-400 text-xs mt-2">{uploadError}</p>}
                
                 <div className="mt-4 grid grid-cols-3 md:grid-cols-4 gap-2">
                    {uploadingFiles.map((url, index) => (
                         <div key={`loading-${index}`} className="relative group aspect-square bg-black/50 rounded-lg flex items-center justify-center">
                            <Loader className="animate-spin text-accent-cyan" />
                        </div>
                    ))}
                    {mediaPreviews.length > 0 && mediaPreviews.map((url, index) => {
                        let previewContent;
                        const isVideo = url.includes('.mp4') || url.includes('.webm') || url.includes('.ogg') || url.includes('video');
                        if (isVideo) {
                            previewContent = <video src={url} className="w-full h-full object-cover rounded-lg" />;
                        } else {
                            previewContent = <img src={url} alt={`preview ${index}`} className="w-full h-full object-cover rounded-lg" />;
                        }

                        return (
                            <div key={url} className="relative group aspect-square">
                                {previewContent}
                                <button type="button" onClick={() => removeMedia(url)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <X size={16} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            <textarea
                name="description"
                placeholder="Add a detailed description (e.g., your video script, story behind the photo, or more info). This helps us feature your content!"
                className="input-glass w-full rounded-2xl min-h-[120px]"
                value={data.description || ''}
                onChange={handleTextChange}
            />
            
            <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input type="text" name="location" className="w-full rounded-xl p-3 pl-10 bg-black/20 text-white border-2 border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-pink" placeholder="Add location..." value={data.location || ''} onChange={handleTextChange} />
                <button type="button" onClick={handleGetLocation} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-accent-cyan" disabled={isFetchingLocation}>
                    {isFetchingLocation ? <Loader className="animate-spin" size={16} /> : <Locate size={16} />}
                </button>
            </div>
             <div className="relative">
                <Smile className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input type="text" name="mood" className="w-full rounded-xl p-3 pl-10 bg-black/20 text-white border-2 border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-pink" placeholder="How are you feeling?" value={data.mood || ''} onChange={handleTextChange} />
            </div>
        </div>
    );
}
