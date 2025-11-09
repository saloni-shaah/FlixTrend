
"use client";

import React, { useState, useEffect } from 'react';
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/utils/firebaseClient";
import { Loader, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const functions = getFunctions(app);
const updatePostCallable = httpsCallable(functions, 'updatePost');

export function EditPostModal({ post, onClose }: { post: any, onClose: () => void }) {
    const [formData, setFormData] = useState({
        title: '',
        caption: '',
        content: '', // Added content field
        hashtags: '',
        mentions: '',
        description: '',
        mood: '',
        location: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Pre-fill form with existing post data
        if (post) {
            setFormData({
                title: post.title || '',
                caption: post.caption || '',
                content: post.content || '', // Pre-fill content
                hashtags: Array.isArray(post.hashtags) ? post.hashtags.join(' ') : (post.hashtags || ''),
                mentions: Array.isArray(post.mentions) ? post.mentions.map((m:string) => `@${m}`).join(' ') : '',
                description: post.description || '',
                mood: post.mood || '',
                location: post.location || ''
            });
        }
    }, [post]);

    if (!post) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        // Prepare the data for the cloud function
        const newData = {
            ...formData,
            // Convert hashtags and mentions from strings back to arrays
            hashtags: formData.hashtags.split(' ').filter(h => h.startsWith('#')).map(h => h.substring(1)),
            mentions: formData.mentions.split(' ').filter(m => m.startsWith('@')).map(m => m.substring(1)),
        };

        try {
            await updatePostCallable({ postId: post.id, newData });
            alert("Post updated successfully!");
            onClose();
        } catch (err: any) {
            console.error("Error updating post:", err);
            setError(err.message || "An unknown error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 50, opacity: 0 }}
                    className="glass-card w-full max-w-lg rounded-2xl p-6 relative"
                    onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
                >
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                    <h2 className="text-xl font-bold mb-4">Edit Post</h2>
                    
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-2">
                        {/* Conditionally show fields based on post type if needed, for now showing all */}
                        {post.type === 'media' && <input type="text" name="title" placeholder="Title" className="input-glass" value={formData.title} onChange={handleInputChange} />}
                        
                        {/* Main content for text/poll posts */}
                        {(post.type === 'text' || post.type === 'poll') && (
                             <textarea name="content" placeholder="What's on your mind?" className="input-glass min-h-[100px] text-lg" value={formData.content} onChange={handleInputChange} />
                        )}

                        <textarea name="caption" placeholder="Caption" className="input-glass min-h-[80px]" value={formData.caption} onChange={handleInputChange} />
                        <input type="text" name="hashtags" placeholder="#hashtags" className="input-glass" value={formData.hashtags} onChange={handleInputChange} />
                        <input type="text" name="mentions" placeholder="@mentions" className="input-glass" value={formData.mentions} onChange={handleInputChange} />
                        <textarea name="description" placeholder="Detailed description" className="input-glass min-h-[120px]" value={formData.description} onChange={handleInputChange} />
                        <input type="text" name="mood" placeholder="Mood" className="input-glass" value={formData.mood} onChange={handleInputChange} />
                        <input type="text" name="location" placeholder="Location" className="input-glass" value={formData.location} onChange={handleInputChange} />
                        
                        {error && <p className="text-red-400 text-sm">{error}</p>}

                        <div className="flex justify-end gap-4 mt-4">
                            <button type="button" onClick={onClose} className="btn-secondary">
                                Cancel
                            </button>
                            <button type="submit" className="btn-primary flex items-center gap-2" disabled={isSubmitting}>
                                {isSubmitting ? <Loader className="animate-spin" size={20} /> : null}
                                Save Changes
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
