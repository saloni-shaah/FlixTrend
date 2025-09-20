
"use client";
import React, { useState, useRef } from 'react';
import { ImagePlus, Video, X, UploadCloud, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

export function MediaPostForm({ data, onDataChange }: { data: any, onDataChange: (data: any) => void }) {
    const [mediaFiles, setMediaFiles] = useState<File[]>(data.mediaFiles || []);
    const [mediaPreviews, setMediaPreviews] = useState<string[]>(data.mediaPreviews || []);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(data.thumbnailPreview || null);
    const [showDescription, setShowDescription] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const urls = files.map(file => URL.createObjectURL(file));
            setMediaFiles(prev => [...prev, ...files]);
            setMediaPreviews(prev => [...prev, ...urls]);
            onDataChange({ ...data, mediaFiles: [...mediaFiles, ...files], mediaPreviews: [...mediaPreviews, ...urls] });
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

            <div className="p-4 border-2 border-dashed border-accent-cyan/30 rounded-2xl text-center">
                <button type="button" className="btn-glass flex items-center justify-center gap-2 mx-auto" onClick={() => fileInputRef.current?.click()}>
                    <UploadCloud /> Upload Media
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple accept="image/*,video/*" />

                 {mediaPreviews.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
                        {mediaPreviews.map((url, index) => (
                            <div key={index} className="relative group aspect-square">
                                {mediaFiles[index].type.startsWith("video") ? (
                                    <video src={url} className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                    <img src={url} alt={`preview ${index}`} className="w-full h-full object-cover rounded-lg" />
                                )}
                                <button type="button" onClick={() => removeMedia(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
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
            
            {mediaFiles.length > 0 && mediaFiles.some(f => f.type.startsWith('video/')) && (
                 <div>
                    <label className="text-sm font-bold text-accent-cyan">Custom Thumbnail (Optional)</label>
                    <input type="file" name="thumbnail" accept="image/*" onChange={handleThumbnailChange} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent-pink/20 file:text-accent-pink hover:file:bg-accent-pink/40 mt-2"/>
                    {thumbnailPreview && <img src={thumbnailPreview} alt="thumbnail" className="w-32 h-auto rounded-lg mt-2" />}
                </div>
            )}

        </div>
    );
}
