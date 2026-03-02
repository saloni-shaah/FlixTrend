
"use client";
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { UploadCloud, X, MapPin, Smile, Hash, Loader, Locate, Image as ImageIcon } from 'lucide-react';
import imageCompression from 'browser-image-compression';

export function MediaPostForm({ data, onDataChange }: { data: any, onDataChange: (data: any) => void }) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const thumbnailInputRef = useRef<HTMLInputElement>(null);
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(data.thumbnailUrl || null);

    useEffect(() => {
        // Keep the local thumbnail preview in sync with the parent state
        setThumbnailPreview(data.thumbnailUrl || null);
    }, [data.thumbnailUrl]);

    const handleImageCompression = async (file: File) => {
        try {
            const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1280, useWebWorker: true };
            return await imageCompression(file, options);
        } catch (error) {
            console.error("Image compression error: ", error);
            setUploadError("Could not compress the image.");
            return null;
        }
    };

    // FIXED: Rewritten thumbnail generation to use the video element directly and reliably
    const generateThumbnail = (videoFile: File, videoElement: HTMLVideoElement) => {
        const isPortrait = videoElement.videoHeight > videoElement.videoWidth;
        const duration = videoElement.duration;

        // This function is now called AFTER the video element has loaded its metadata
        videoElement.onseeked = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const targetAspectRatio = isPortrait ? 9 / 16 : 16 / 9;
            let sx = 0, sy = 0, sWidth = videoElement.videoWidth, sHeight = videoElement.videoHeight;
            const videoAspectRatio = videoElement.videoWidth / videoElement.videoHeight;

            if (videoAspectRatio > targetAspectRatio) {
                sWidth = videoElement.videoHeight * targetAspectRatio;
                sx = (videoElement.videoWidth - sWidth) / 2;
            } else {
                sHeight = videoElement.videoWidth / targetAspectRatio;
                sy = (videoElement.videoHeight - sHeight) / 2;
            }

            canvas.width = 1080;
            canvas.height = canvas.width / targetAspectRatio;
            ctx.drawImage(videoElement, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);

            canvas.toBlob(async (blob) => {
                if (!blob) return;
                const thumbnailFile = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' });
                const compressedFile = await handleImageCompression(thumbnailFile);
                if (!compressedFile) return;

                const thumbnailUrl = URL.createObjectURL(compressedFile);
                setThumbnailPreview(thumbnailUrl);
                
                // CRITICAL: Update the parent state only AFTER all processing is complete
                onDataChange({
                    ...data,
                    mediaUrl: [videoElement.src], // The original blob URL
                    files: [videoFile],
                    isVideo: true,
                    videoDuration: duration,
                    isPortrait: isPortrait,
                    isFlow: duration <= 240 && isPortrait,
                    thumbnailFile: compressedFile,
                    thumbnailUrl: thumbnailUrl
                });
                
                // Now it's safe to remove the temporary video element
                videoElement.remove();
            }, 'image/jpeg', 0.9);
        };
        
        // Seek to a frame that's likely to have content
        videoElement.currentTime = Math.min(3, duration / 2);
    };

    // FIXED: This function now correctly handles the video processing lifecycle
    const handleFileSelection = async (file: File) => {
        if (file.size > 250 * 1024 * 1024) {
            setUploadError(`File ${file.name} is too large (max 250MB).`);
            return;
        }
        removeMedia(); // Clear previous media first
        setUploadError(null);

        const isVideo = file.type.startsWith('video/');
        
        if (isVideo) {
            const videoElement = document.createElement('video');
            videoElement.preload = 'metadata';
            videoElement.muted = true;
            videoElement.playsInline = true;

            videoElement.onloadedmetadata = () => {
                // The bug was here. Now we correctly pass the loaded video element.
                generateThumbnail(file, videoElement);
            };
            videoElement.onerror = () => { 
                setUploadError("Couldn't process video. It may be corrupt or unsupported.");
                if (videoElement.src) URL.revokeObjectURL(videoElement.src);
                videoElement.remove();
            };
            videoElement.src = URL.createObjectURL(file);

        } else { // It's an image
            const compressedFile = await handleImageCompression(file);
            if(!compressedFile) return;
            const compressedUrl = URL.createObjectURL(compressedFile);
            onDataChange({ ...data, mediaUrl: [compressedUrl], files: [compressedFile], isVideo: false, thumbnailUrl: null, thumbnailFile: null });
        }
    };

    const processFiles = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const acceptedFile = Array.from(files).find(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
        if (!acceptedFile) {
            setUploadError("Please select a valid image or video file.");
            return;
        }
        handleFileSelection(acceptedFile);
    };

    const handleCustomThumbnail = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const compressedFile = await handleImageCompression(file);
        if (!compressedFile) return;
        if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
        const newThumbnailUrl = URL.createObjectURL(compressedFile);
        setThumbnailPreview(newThumbnailUrl);
        onDataChange({ ...data, thumbnailFile: compressedFile, thumbnailUrl: newThumbnailUrl });
    }

    const removeMedia = () => {
        (data.mediaUrl || []).forEach((url: string) => URL.revokeObjectURL(url));
        if (thumbnailPreview && thumbnailPreview !== data.thumbnailUrl) URL.revokeObjectURL(thumbnailPreview);
        
        onDataChange({ 
            ...data,
            mediaUrl: [], files: [], isVideo: false, videoDuration: undefined, 
            isPortrait: undefined, isFlow: undefined, thumbnailFile: null, 
            thumbnailUrl: null, description: '' 
        });
        setThumbnailPreview(null);
    };
    
    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onDataChange({ ...data, [e.target.name]: e.target.value });
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) { setUploadError("Geolocation is not supported."); return; }
        setIsFetchingLocation(true);
        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                const locData = await response.json();
                const city = locData.address.city || locData.address.town || locData.address.village;
                const country = locData.address.country;
                onDataChange({ ...data, location: city && country ? `${city}, ${country}` : 'Unknown Location' });
            } catch (error) { setUploadError('Could not fetch location name.'); }
            finally { setIsFetchingLocation(false); }
        }, (error) => {
            setUploadError(error.code === error.PERMISSION_DENIED ? 'Location permission denied.' : 'Could not get location.');
            setIsFetchingLocation(false);
        });
    };

    const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }, []);
    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);
    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); }, []);
    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); processFiles(e.dataTransfer.files); e.dataTransfer.clearData(); }, []);

    const hasMedia = data.files && data.files.length > 0;

    return (
        <div className="flex flex-col gap-4">
            <input type="text" name="content" placeholder="Write a caption..." className="input-glass text-lg" value={data.content || ''} onChange={handleTextChange} />

            {!hasMedia ? (
                <div className={`p-4 border-2 border-dashed rounded-2xl text-center transition-colors duration-300 ${isDragging ? 'border-accent-pink bg-accent-pink/10' : 'border-accent-cyan/30'}`} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}>
                    <div className="flex flex-col items-center justify-center gap-2 mx-auto">
                        <UploadCloud className={`transition-transform duration-300 ${isDragging ? 'scale-110' : ''}`} />
                        <p className="text-sm text-gray-400">{isDragging ? 'Drop your file here!' : 'Drag & drop a photo or video'}</p>
                        <button type="button" className="btn-glass mt-2" onClick={() => fileInputRef.current?.click()}>
                            Select from Device
                        </button>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={(e) => processFiles(e.target.files)} className="hidden" accept="image/*,video/*" />
                </div>
            ) : (
                <div className="relative group aspect-video w-full rounded-lg overflow-hidden bg-black">
                     {(thumbnailPreview || data.mediaUrl?.[0]) ? (
                        <img src={thumbnailPreview || data.mediaUrl?.[0]} alt="Media preview" className="w-full h-full object-cover" />
                    ) : <div className="w-full h-full bg-black flex items-center justify-center"><Loader className="animate-spin"/></div>}

                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        {data.isVideo && <button type="button" onClick={() => thumbnailInputRef.current?.click()} className="btn-glass"><ImageIcon size={16} /> Change Thumbnail</button>}
                        <button type="button" onClick={removeMedia} className="btn-glass bg-red-500/80"><X size={16} /> Remove</button>
                    </div>
                    <input type="file" ref={thumbnailInputRef} onChange={handleCustomThumbnail} className="hidden" accept="image/*" />
                </div>
            )}
            {uploadError && <p className="text-red-400 text-xs mt-2">{uploadError}</p>}

            {data.isVideo && (
                <textarea name="description" placeholder="Add a detailed description for your video..." className="input-glass min-h-[100px]" value={data.description || ''} onChange={handleTextChange} />
            )}

            <div className="relative"><Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input type="text" name="hashtags" placeholder="#trending #vibes" className="input-glass w-full pl-10" value={data.hashtags || ''} onChange={handleTextChange} /></div>

            <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input type="text" name="location" placeholder="Add location..." className="input-glass w-full pl-10" value={data.location || ''} onChange={handleTextChange} />
                <button type="button" onClick={handleGetLocation} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-accent-cyan" disabled={isFetchingLocation}>
                    {isFetchingLocation ? <Loader className="animate-spin" size={16} /> : <Locate size={16} />}
                </button>
            </div>

            <div className="relative"><Smile className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type="text" name="mood" placeholder="How are you feeling?" className="input-glass w-full pl-10" value={data.mood || ''} onChange={handleTextChange} /></div>
        </div>
    );
}
