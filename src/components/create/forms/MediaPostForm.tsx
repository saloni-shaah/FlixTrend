
"use client";
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { UploadCloud, X, MapPin, Smile, Hash, Loader, Locate, Image as ImageIcon, FileUp, AlertCircle } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { isAbusive } from '@/utils/moderation';

const MAX_MEDIA_IMAGES = 65;
const MAX_VIDEO_SIZE_MB = 250;
const MAX_SUBTITLE_SIZE_MB = 4;
const VIDEO_LONG_FORM_MIN_SECONDS = 180;
const IMAGE_TARGET_MAX_MB = 0.78;
const THUMBNAIL_TARGET_MAX_MB = 0.095;
const IMAGE_MAX_DIMENSION = 1600;
const THUMBNAIL_MAX_DIMENSION = 720;

export function MediaPostForm({ data, onDataChange, onError }: { data: any, onDataChange: (data: any) => void, onError: (error: string | null) => void }) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const thumbnailInputRef = useRef<HTMLInputElement>(null);
    const subtitleInputRef = useRef<HTMLInputElement>(null);
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(data.thumbnailUrl || null);
    const [selectedSubtitleName, setSelectedSubtitleName] = useState<string | null>(data.subtitleFile?.name || null);
    const [isProcessingMedia, setIsProcessingMedia] = useState(false);
    const [hasTouchedContent, setHasTouchedContent] = useState(false);

    useEffect(() => {
        setThumbnailPreview(data.thumbnailUrl || null);
    }, [data.thumbnailUrl]);

    useEffect(() => {
        setSelectedSubtitleName(data.subtitleFile?.name || null);
    }, [data.subtitleFile]);

    const mediaCount = useMemo(() => Array.isArray(data.files) ? data.files.length : 0, [data.files]);
    const isVideoPost = Boolean(data.isVideo);
    const canAttachSubtitles = isVideoPost && Boolean(data.videoDuration && data.videoDuration >= VIDEO_LONG_FORM_MIN_SECONDS) && !data.isFlow;
    const contentValue = data.content || '';
    const contentIsMissing = contentValue.trim().length === 0;

    useEffect(() => {
        if (contentIsMissing) {
            onError('Content is required for media posts.');
            return;
        }

        if (isAbusive(contentValue) || isAbusive(data.description || '') || isAbusive(data.hashtags || '')) {
            onError('Your post contains inappropriate language and cannot be posted.');
            return;
        }

        onError(null);
    }, [contentIsMissing, contentValue, data.description, data.hashtags, onError]);

    const handleImageCompression = async (file: File, maxSizeMB = IMAGE_TARGET_MAX_MB, maxWidthOrHeight = IMAGE_MAX_DIMENSION) => {
        try {
            const options = {
                maxSizeMB,
                maxWidthOrHeight,
                useWebWorker: true,
                fileType: 'image/jpeg',
                initialQuality: 0.86,
            };
            return await imageCompression(file, options);
        } catch (error) {
            console.error("Image compression error: ", error);
            setUploadError("Could not compress the image.");
            return null;
        }
    };

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
                const compressedFile = await handleImageCompression(thumbnailFile, THUMBNAIL_TARGET_MAX_MB, THUMBNAIL_MAX_DIMENSION);
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
                    thumbnailUrl: thumbnailUrl,
                    subtitleFile: data.subtitleFile || null,
                    subtitleUrl: data.subtitleUrl || null,
                });
                
                // Now it's safe to remove the temporary video element
                videoElement.remove();
                setIsProcessingMedia(false);
            }, 'image/jpeg', 0.9);
        };
        
        // Seek to a frame that's likely to have content
        videoElement.currentTime = Math.min(3, duration / 2);
    };

    const setMediaError = (message: string) => {
        setUploadError(message);
        onError(message);
    };

    const clearMediaError = () => {
        setUploadError(null);
        onError(null);
    };

    const openImagePicker = () => {
        if (!fileInputRef.current || mediaCount >= MAX_MEDIA_IMAGES || isProcessingMedia) return;
        fileInputRef.current.value = '';
        fileInputRef.current.click();
    };

    const handleFileSelection = async (file: File) => {
        if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
            setMediaError(`File ${file.name} is too large (max ${MAX_VIDEO_SIZE_MB}MB).`);
            return;
        }

        removeMedia();
        clearMediaError();
        setIsProcessingMedia(true);

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
                setIsProcessingMedia(false);
            };
            videoElement.src = URL.createObjectURL(file);

        } else { // It's an image
            const compressedFile = await handleImageCompression(file);
            if(!compressedFile) {
                setIsProcessingMedia(false);
                return;
            }
            const compressedUrl = URL.createObjectURL(compressedFile);
            onDataChange({
                mediaUrl: [compressedUrl],
                files: [compressedFile],
                isVideo: false,
                thumbnailUrl: null,
                thumbnailFile: null,
                videoDuration: undefined,
                isPortrait: undefined,
                isFlow: false,
                subtitleFile: null,
                subtitleUrl: null,
            });
            setIsProcessingMedia(false);
        }
    };

    const processFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        if (isProcessingMedia) {
            setMediaError("Please wait for the current media to finish processing.");
            return;
        }
        const videoFiles = Array.from(files).filter(f => f.type.startsWith('video/'));
        if (videoFiles.length > 0) {
            if (Array.isArray(data.files) && data.files.length > 0 && !data.isVideo) {
                setMediaError("You can only add more images to an image post.");
                return;
            }
            if (files.length > 1) {
                setMediaError("Please choose either one video or up to 65 images.");
                return;
            }
            handleFileSelection(videoFiles[0]);
            return;
        }

        const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
        if (imageFiles.length === 0) {
            setMediaError("Please select valid image or video files.");
            return;
        }
        const existingFiles = Array.isArray(data.files) ? data.files : [];
        const existingUrls = Array.isArray(data.mediaUrl) ? data.mediaUrl : [];
        const existingCount = existingFiles.length;
        if (existingCount + imageFiles.length > MAX_MEDIA_IMAGES) {
            setMediaError(`You can upload up to ${MAX_MEDIA_IMAGES} images per post.`);
            return;
        }

        clearMediaError();
        setIsProcessingMedia(true);

        const results = await Promise.all(imageFiles.map(async (file) => {
            const compressedFile = await handleImageCompression(file);
            if (!compressedFile) return null;
            return {
                file: compressedFile,
                url: URL.createObjectURL(compressedFile),
            };
        }));

        const accepted = results.filter(Boolean) as { file: File; url: string }[];
        if (accepted.length === 0) {
            setIsProcessingMedia(false);
            return;
        }

        onDataChange({
            mediaUrl: [...existingUrls, ...accepted.map(item => item.url)],
            files: [...existingFiles, ...accepted.map(item => item.file)],
            isVideo: false,
            thumbnailUrl: null,
            thumbnailFile: null,
            videoDuration: undefined,
            isPortrait: undefined,
            isFlow: false,
            subtitleFile: null,
            subtitleUrl: null,
        });
        setIsProcessingMedia(false);
    };

    const handleCustomThumbnail = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const compressedFile = await handleImageCompression(file, THUMBNAIL_TARGET_MAX_MB, THUMBNAIL_MAX_DIMENSION);
        if (!compressedFile) return;
        if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
        const newThumbnailUrl = URL.createObjectURL(compressedFile);
        setThumbnailPreview(newThumbnailUrl);
        onDataChange({ ...data, thumbnailFile: compressedFile, thumbnailUrl: newThumbnailUrl });
    }

    const handleSubtitleSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!data.isVideo) {
            setMediaError("Subtitles are only available for video posts.");
            e.target.value = '';
            return;
        }
        if (!canAttachSubtitles) {
            setMediaError("Subtitles are available only for non-Flow videos longer than about 3 minutes.");
            e.target.value = '';
            return;
        }
        if (!file.name.toLowerCase().endsWith('.vtt') || file.type !== 'text/vtt') {
            setMediaError("Please upload a valid WebVTT (.vtt) subtitle file.");
            e.target.value = '';
            return;
        }
        if (file.size > MAX_SUBTITLE_SIZE_MB * 1024 * 1024) {
            setMediaError(`Subtitle files must be ${MAX_SUBTITLE_SIZE_MB}MB or smaller.`);
            e.target.value = '';
            return;
        }

        clearMediaError();
        setSelectedSubtitleName(file.name);
        onDataChange({
            ...data,
            subtitleFile: file,
            subtitleUrl: URL.createObjectURL(file),
        });
        e.target.value = '';
    };

    const removeMedia = () => {
        (data.mediaUrl || []).forEach((url: string) => URL.revokeObjectURL(url));
        if (thumbnailPreview && thumbnailPreview !== data.thumbnailUrl) URL.revokeObjectURL(thumbnailPreview);
        if (data.subtitleUrl) URL.revokeObjectURL(data.subtitleUrl);
        
        onDataChange({ 
            ...data,
            mediaUrl: [], files: [], isVideo: false, videoDuration: undefined, 
            isPortrait: undefined, isFlow: undefined, thumbnailFile: null, 
            thumbnailUrl: null, description: '', subtitleFile: null, subtitleUrl: null
        });
        setThumbnailPreview(null);
        setSelectedSubtitleName(null);
    };
    
    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'content') setHasTouchedContent(true);

        onDataChange({ ...data, [name]: value });
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
    const hashtagsValue = data.hashtags || '';
    const locationValue = data.location || '';
    const moodValue = data.mood || '';
    const mediaUrls = Array.isArray(data.mediaUrl) ? data.mediaUrl : [];
    const imagePreviewUrls = mediaUrls.slice(0, MAX_MEDIA_IMAGES);
    const isMultiImagePost = hasMedia && !data.isVideo && imagePreviewUrls.length > 1;
    const mediaInputAccept = hasMedia && !data.isVideo ? 'image/*' : 'image/*,video/*';
    const iconFieldStyle = (value: string, hasTrailingAction = false): React.CSSProperties => ({
        paddingLeft: value ? '1.25rem' : '3rem',
        paddingRight: hasTrailingAction ? '3rem' : '1.25rem',
    });
    const clearField = (field: 'hashtags' | 'location' | 'mood') => {
        onDataChange({ ...data, [field]: '' });
    };

    return (
        <div className="flex flex-col gap-4">
            <input
                type="text"
                name="content"
                placeholder="Write a caption..."
                className="input-glass w-full text-lg"
                value={contentValue}
                onChange={handleTextChange}
                onBlur={() => setHasTouchedContent(true)}
                required
                aria-invalid={hasTouchedContent && contentIsMissing}
            />
            {hasTouchedContent && contentIsMissing && <p className="text-red-400 text-xs -mt-2">Content is required for media posts.</p>}

            {!hasMedia ? (
                <div className={`p-4 border-2 border-dashed rounded-2xl text-center transition-colors duration-300 ${isDragging ? 'border-accent-pink bg-accent-pink/10' : 'border-accent-cyan/30'}`} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}>
                    <div className="flex flex-col items-center justify-center gap-2 mx-auto">
                        <UploadCloud className={`transition-transform duration-300 ${isDragging ? 'scale-110' : ''}`} />
                        <p className="text-sm text-gray-400">{isDragging ? 'Drop your files here!' : `Drag & drop a video or up to ${MAX_MEDIA_IMAGES} photos`}</p>
                        <button type="button" className="btn-glass mt-2" onClick={openImagePicker} disabled={isProcessingMedia}>
                            {isProcessingMedia ? <Loader className="animate-spin" size={16} /> : null}
                            Select from Device
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="relative group overflow-hidden rounded-lg bg-black" style={{ aspectRatio: data.isVideo ? '16 / 9' : '1 / 1' }}>
                        {data.isVideo ? (
                            (thumbnailPreview || mediaUrls[0]) ? (
                                <img src={thumbnailPreview || mediaUrls[0]} alt="Media preview" className="h-full w-full object-cover" />
                            ) : <div className="flex h-full w-full items-center justify-center bg-black"><Loader className="animate-spin"/></div>
                        ) : isMultiImagePost ? (
                            <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-1">
                                {imagePreviewUrls.slice(0, 4).map((url: string, index: number) => (
                                    <img key={`${url}-${index}`} src={url} alt={`Media preview ${index + 1}`} className="h-full w-full object-cover" />
                                ))}
                                {imagePreviewUrls.length > 4 && (
                                    <div className="absolute bottom-3 right-3 rounded-full bg-black/70 px-3 py-1 text-sm font-semibold text-white">
                                        +{imagePreviewUrls.length - 4}
                                    </div>
                                )}
                            </div>
                        ) : (
                            (mediaUrls[0] || thumbnailPreview) ? (
                                <img src={mediaUrls[0] || thumbnailPreview || ''} alt="Media preview" className="h-full w-full object-cover" />
                            ) : <div className="flex h-full w-full items-center justify-center bg-black"><Loader className="animate-spin"/></div>
                        )}

                        <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 flex flex-wrap items-center justify-center gap-3 p-4">
                            {data.isVideo && <button type="button" onClick={() => thumbnailInputRef.current?.click()} className="btn-glass"><ImageIcon size={16} /> Change Thumbnail</button>}
                            {!data.isVideo && (
                                <button type="button" onClick={openImagePicker} className="btn-glass" disabled={mediaCount >= MAX_MEDIA_IMAGES || isProcessingMedia}>
                                    {isProcessingMedia ? <Loader className="animate-spin" size={16} /> : <FileUp size={16} />} Add More
                                </button>
                            )}
                            <button type="button" onClick={removeMedia} className="btn-glass bg-red-500/80"><X size={16} /> Remove</button>
                        </div>
                        <input type="file" ref={thumbnailInputRef} onChange={handleCustomThumbnail} className="hidden" accept="image/*" />
                    </div>
                    {!data.isVideo && (
                        <div className="flex flex-col gap-3 rounded-xl border border-white/10 p-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm font-semibold text-white">Selected images</p>
                                <p className="text-xs text-gray-400">
                                    {isProcessingMedia ? 'Compressing images...' : `${mediaCount} / ${MAX_MEDIA_IMAGES}`}
                                </p>
                            </div>
                            <button type="button" className="btn-glass" onClick={openImagePicker} disabled={mediaCount >= MAX_MEDIA_IMAGES || isProcessingMedia}>
                                {isProcessingMedia ? <Loader className="animate-spin" size={16} /> : <FileUp size={16} />} Add more
                            </button>
                        </div>
                    )}
                </div>
            )}
            <input type="file" ref={fileInputRef} onChange={(e) => processFiles(e.target.files)} className="hidden" accept={mediaInputAccept} multiple />
            {uploadError && <p className="text-red-400 text-xs mt-2">{uploadError}</p>}

            {data.isVideo && (
                <textarea name="description" placeholder="Add a detailed description for your video..." className="input-glass min-h-[100px]" value={data.description || ''} onChange={handleTextChange} />
            )}

            {canAttachSubtitles && (
                <div className="rounded-xl border border-white/10 p-4 space-y-2">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-semibold text-white">Subtitles</p>
                            <p className="text-xs text-gray-400">Upload a WebVTT file for this video.</p>
                        </div>
                        <button type="button" className="btn-glass" onClick={() => subtitleInputRef.current?.click()}>
                            <FileUp size={16} /> {selectedSubtitleName ? 'Replace' : 'Upload'}
                        </button>
                    </div>
                    <input type="file" ref={subtitleInputRef} onChange={handleSubtitleSelection} className="hidden" accept=".vtt,text/vtt" />
                    {selectedSubtitleName ? (
                        <div className="flex items-center justify-between rounded-lg bg-black/20 px-3 py-2 text-sm">
                            <span className="flex items-center gap-2"><AlertCircle size={14} className="text-accent-cyan" /> {selectedSubtitleName}</span>
                            <button type="button" className="text-xs text-red-300 hover:text-red-200" onClick={() => {
                                if (data.subtitleUrl) URL.revokeObjectURL(data.subtitleUrl);
                                setSelectedSubtitleName(null);
                                onDataChange({ ...data, subtitleFile: null, subtitleUrl: null });
                            }}>
                                Remove
                            </button>
                        </div>
                    ) : null}
                </div>
            )}

            {data.isVideo && !canAttachSubtitles && (
                <p className="text-xs text-gray-400">Subtitles are only available for non-Flow videos longer than about 3 minutes.</p>
            )}

            <div className="relative">
                {!hashtagsValue && <Hash className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />}
                <input type="text" name="hashtags" placeholder="#trending #vibes" className="input-glass w-full h-12 text-sm sm:text-base" style={iconFieldStyle(hashtagsValue, Boolean(hashtagsValue))} value={hashtagsValue} onChange={handleTextChange} />
                {hashtagsValue && (
                    <button type="button" onClick={() => clearField('hashtags')} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:text-white" aria-label="Clear hashtags">
                        <X size={16} />
                    </button>
                )}
            </div>

            <div className="relative">
                {!locationValue && <MapPin className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />}
                <input type="text" name="location" placeholder="Add location..." className="input-glass w-full h-12 text-sm sm:text-base" style={iconFieldStyle(locationValue, true)} value={locationValue} onChange={handleTextChange} />
                {locationValue ? (
                    <button type="button" onClick={() => clearField('location')} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:text-white" aria-label="Clear location">
                        <X size={16} />
                    </button>
                ) : (
                    <button type="button" onClick={handleGetLocation} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:text-accent-cyan" disabled={isFetchingLocation} aria-label="Use current location">
                        {isFetchingLocation ? <Loader className="animate-spin" size={16} /> : <Locate size={16} />}
                    </button>
                )}
            </div>

            <div className="relative">
                {!moodValue && <Smile className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />}
                <input type="text" name="mood" placeholder="How are you feeling?" className="input-glass w-full h-12 text-sm sm:text-base" style={iconFieldStyle(moodValue, Boolean(moodValue))} value={moodValue} onChange={handleTextChange} />
                {moodValue && (
                    <button type="button" onClick={() => clearField('mood')} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:text-white" aria-label="Clear mood">
                        <X size={16} />
                    </button>
                )}
            </div>
        </div>
    );
}
