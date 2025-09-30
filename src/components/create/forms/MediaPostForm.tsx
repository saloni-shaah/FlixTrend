
"use client";
import React, { useState, useRef, useCallback } from 'react';
import { ChevronDown, UploadCloud, X, MapPin, Smile, Music } from 'lucide-react';
import { motion } from 'framer-motion';

export function MediaPostForm({ data, onDataChange }: { data: any, onDataChange: (data: any) => void }) {
    const [mediaFiles, setMediaFiles] = useState<File[]>(data.mediaFiles || []);
    const [mediaPreviews, setMediaPreviews] = useState<string[]>(data.mediaPreviews || []);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(data.thumbnailPreview || null);
    const [showDescription, setShowDescription] = useState(false);
    const [isDragging, setIsDragging] = useState(false); // New state for drag-and-drop

    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- NEW: Consolidated function to handle file processing ---
    const processFiles = (files: File[]) => {
        const imageVideoAudioFiles = files.filter(file => 
            file.type.startsWith('image/') || 
            file.type.startsWith('video/') || 
            file.type.startsWith('audio/')
        );

        if (imageVideoAudioFiles.length === 0) return;

        const urls = imageVideoAudioFiles.map(file => URL.createObjectURL(file));
        const newFiles = [...mediaFiles, ...imageVideoAudioFiles];
        const newPreviews = [...mediaPreviews, ...urls];

        setMediaFiles(newFiles);
        setMediaPreviews(newPreviews);
        onDataChange({ ...data, mediaFiles: newFiles, mediaPreviews: newPreviews });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            processFiles(Array.from(e.target.files));
        }
    };
    
    const removeMedia = (index: number) => {
        const newFiles = mediaFiles.filter((_, i) => i !== index);
        const newPreviews = mediaPreviews.filter((_, i) => i !== index);
        setMediaFiles(newFiles);
        setMediaPreviews(newPreviews);
        onDataChange({ ...data, mediaFiles: newFiles, mediaPreviews: newPreviews });
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onDataChange({ ...data, [e.target.name]: e.target.value });
    };
    
    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setThumbnailPreview(URL.createObjectURL(file));
            onDataChange({ ...data, thumbnailFile: file, thumbnailPreview: URL.createObjectURL(file) });
        }
    }

    // --- NEW: Drag and Drop Event Handlers ---
    const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation(); // Necessary to allow dropping
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(Array.from(e.dataTransfer.files));
            e.dataTransfer.clearData();
        }
    }, [mediaFiles, mediaPreviews, data]); // Dependencies for processFiles

    const hasVideo = mediaFiles.some(f => f.type.startsWith('video/'));

    return (
        <div className="flex flex-col gap-4">
            <input type="text" name="title" placeholder="Title" className="input-glass text-lg" value={data.title || ''} onChange={handleTextChange} />
            
            <textarea
                name="caption"
                className="input-glass w-full rounded-2xl min-h-[100px]"
                placeholder="Add a caption, #hashtags, and mention @friends..."
                value={data.caption || ''}
                onChange={handleTextChange}
            />

            {/* --- MODIFIED: Added drag-drop handlers and dynamic styling --- */}
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
                {/* --- MODIFIED: Updated 'accept' to include audio files --- */}
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple accept="image/*,video/*,audio/*" />
                <p className="text-xs text-gray-500 mt-2">Also supports camera and gallery on mobile.</p>

                 {mediaPreviews.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 md:grid-cols-4 gap-2">
                        {mediaPreviews.map((url, index) => {
                            const file = mediaFiles[index];
                            let previewContent;

                            if (file.type.startsWith("video")) {
                                previewContent = <video src={url} className="w-full h-full object-cover rounded-lg" />;
                            } else if (file.type.startsWith("image")) {
                                previewContent = <img src={url} alt={`preview ${index}`} className="w-full h-full object-cover rounded-lg" />;
                            } else if (file.type.startsWith("audio")) {
                                // --- NEW: Preview for audio files ---
                                previewContent = (
                                    <div className="w-full h-full bg-background/50 rounded-lg flex flex-col items-center justify-center p-2 text-center">
                                        <Music className="text-accent-pink" size={32} />
                                        <p className="text-xs text-gray-300 mt-2 break-all">{file.name}</p>
                                    </div>
                                );
                            }

                            return (
                                <div key={index} className="relative group aspect-square">
                                    {previewContent}
                                    <button type="button" onClick={() => removeMedia(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <X size={16} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            
            <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input type="text" name="location" className="w-full rounded-xl p-3 pl-10 bg-black/20 text-white border-2 border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-pink" placeholder="Add location..." value={data.location || ''} onChange={handleTextChange} />
            </div>
             <div className="relative">
                <Smile className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input type="text" name="mood" className="w-full rounded-xl p-3 pl-10 bg-black/20 text-white border-2 border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-pink" placeholder="How are you feeling?" value={data.mood || ''} onChange={handleTextChange} />
            </div>
            
            {hasVideo && (
                 <div>
                    <label className="text-sm font-bold text-accent-cyan">Custom Thumbnail (Optional)</label>
                    <input type="file" name="thumbnail" accept="image/*" onChange={handleThumbnailChange} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent-pink/20 file:text-accent-pink hover:file:bg-accent-pink/40 mt-2"/>
                    {thumbnailPreview && <img src={thumbnailPreview} alt="thumbnail" className="w-32 h-auto rounded-lg mt-2" />}
                </div>
            )}
            
             <div className="mt-2">
                <button type="button" className="text-sm font-bold text-accent-cyan flex items-center gap-1" onClick={() => setShowDescription(!showDescription)}>
                    Read Description <ChevronDown className={`transition-transform ${showDescription ? 'rotate-180' : ''}`} size={16} />
                </button>
                <motion.div
                    initial={false}
                    animate={{ height: showDescription ? 'auto' : 0, opacity: showDescription ? 1 : 0 }}
                    className="overflow-hidden"
                >
                    <textarea name="description" placeholder="Add a detailed description..." className="input-glass rounded-2xl w-full mt-2" value={data.description || ''} onChange={handleTextChange} />
                </motion.div>
            </div>

        </div>
    );
}
