
"use client";
import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, X, MapPin, Smile, Hash, Loader, Locate } from 'lucide-react';

export function MediaPostForm({ data, onDataChange }: { data: any, onDataChange: (data: any) => void }) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const mediaPreviews = data.mediaUrl || [];

    const handleFileSelection = (file: File) => {
        if (file.size > 200 * 1024 * 1024) { // 200MB limit
            setUploadError(`File ${file.name} is too large (max 200MB).`);
            return;
        }
        setUploadError(null);

        const previewUrl = URL.createObjectURL(file);
        const newMediaUrls = [...(data.mediaUrl || []), previewUrl];
        const newMediaFiles = [...(data.mediaFiles || []), file];

        const isVideo = file.type.startsWith('video/');
        const updateData: any = { 
            mediaUrl: newMediaUrls, 
            mediaFiles: newMediaFiles, 
            isVideo: newMediaFiles.some(f => f.type.startsWith('video/')) 
        };

        if (isVideo) {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.onloadedmetadata = () => {
                window.URL.revokeObjectURL(video.src);
                updateData.isPortrait = video.videoHeight > video.videoWidth;
                updateData.videoDuration = video.duration;
                onDataChange({ ...data, ...updateData });
            };
            video.onerror = () => {
                window.URL.revokeObjectURL(video.src);
                setUploadError(`Couldn't process video "${file.name}". It might be corrupt or in an unsupported format.`);
                // Clean up the failed upload from the state
                const updatedMediaUrls = newMediaUrls.filter(url => url !== previewUrl);
                const updatedMediaFiles = newMediaFiles.filter(f => f !== file);
                onDataChange({
                    ...data,
                    mediaUrl: updatedMediaUrls,
                    mediaFiles: updatedMediaFiles,
                    isVideo: updatedMediaFiles.some(f => f.type.startsWith('video/'))
                });
            };
            video.src = previewUrl;
        } else {
             onDataChange({ ...data, ...updateData });
        }
    }
    
    const processFiles = (files: FileList | null) => {
        if (!files) return;
        const filesToProcess = Array.from(files).filter(file => 
            file.type.startsWith('image/') || 
            file.type.startsWith('video/')
        );
        if (filesToProcess.length === 0) return;

        for (const file of filesToProcess) {
            handleFileSelection(file);
        }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        processFiles(e.target.files);
    };
    
    const removeMedia = (urlToRemove: string) => {
        const indexToRemove = data.mediaUrl.findIndex((url: string) => url === urlToRemove);
        if (indexToRemove === -1) return;

        URL.revokeObjectURL(urlToRemove);

        const newMediaUrls = data.mediaUrl.filter((_: any, index: number) => index !== indexToRemove);
        const newMediaFiles = data.mediaFiles.filter((_: any, index: number) => index !== indexToRemove);
        
        const isVideo = newMediaFiles.some(f => f.type.startsWith('video/'));

        onDataChange({ ...data, mediaUrl: newMediaUrls, mediaFiles: newMediaFiles, isVideo });
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
        processFiles(e.dataTransfer.files);
        e.dataTransfer.clearData();
    }, []);

    const handleGetLocation = () => {
        setUploadError(null);
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
                    setUploadError('Could not fetch location name.');
                } finally {
                    setIsFetchingLocation(false);
                }
            }, (error) => {
                if (error.code === error.PERMISSION_DENIED) {
                    setUploadError('Location permission denied.');
                } else {
                     setUploadError('Could not get location.');
                }
                setIsFetchingLocation(false);
            });
        } else {
            setUploadError("Geolocation is not supported by this browser.");
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <input type="text" name="content" placeholder="Write a caption..." className="input-glass text-lg" value={data.content || ''} onChange={handleTextChange} />

            <div 
                className={`p-4 border-2 border-dashed rounded-2xl text-center transition-colors duration-300 ${isDragging ? 'border-accent-pink bg-accent-pink/10' : 'border-accent-cyan/30'}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <div className="flex flex-col items-center justify-center gap-2 mx-auto">
                    <UploadCloud className={`transition-transform duration-300 ${isDragging ? 'scale-110' : ''}`} />
                    <p className="text-sm text-gray-400">{isDragging ? 'Drop your files here!' : 'Drag & drop photos or videos'}</p>
                     <div className="flex gap-2 mt-2">
                        <button type="button" className="btn-glass" onClick={() => fileInputRef.current?.click()}>
                            Select from Device
                        </button>
                    </div>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple accept="image/*,video/*" />
                {uploadError && <p className="text-red-400 text-xs mt-2">{uploadError}</p>}
                
                 <div className="mt-4 grid grid-cols-3 md:grid-cols-4 gap-2">
                    {mediaPreviews.map((url: string, index: number) => {
                        const file = data.mediaFiles[index];
                        if (!file) return null;
                        const isVideo = file.type.startsWith('video/');
                        return (
                            <div key={url} className="relative group aspect-square">
                                {isVideo ? (
                                    <video src={url} className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                    <img src={url} alt={`preview ${index}`} className="w-full h-full object-cover rounded-lg" />
                                )}
                                <button type="button" onClick={() => removeMedia(url)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <X size={16} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            {data.isVideo && (
                <textarea
                    name="description"
                    placeholder="Add a detailed description for your video..."
                    className="input-glass w-full rounded-2xl min-h-[100px] transition-all"
                    value={data.description || ''}
                    onChange={handleTextChange}
                />
            )}

            <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input type="text" name="hashtags" placeholder="#trending #vibes" className="input-glass w-full pl-10" value={data.hashtags || ''} onChange={handleTextChange} />
            </div>

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
