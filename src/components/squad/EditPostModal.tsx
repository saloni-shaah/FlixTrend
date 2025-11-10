"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/utils/firebaseClient';
import { useToast } from '@/hooks/use-toast';

const functions = getFunctions(app);
const updatePostCallable = httpsCallable(functions, 'updatePost');

export function EditPostModal({ post, onClose }: { post: any, onClose: () => void }) {
    const [content, setContent] = useState(post.content || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await updatePostCallable({ postId: post.id, newData: { content } });
            toast({
                title: "Post Updated",
                description: "Your post has been successfully updated.",
            });
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-6 w-full max-w-lg relative flex flex-col"
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">&times;</button>
                <h2 className="text-xl font-headline font-bold mb-4 text-accent-cyan">Edit Post</h2>
                
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <textarea 
                        name="content"
                        className="input-glass w-full min-h-[150px] rounded-2xl"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />
                    
                    {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
                    
                    <div className="flex justify-end gap-3 mt-4">
                        <button type="button" className="btn-glass" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-glass bg-accent-pink text-white" disabled={loading}>
                            {loading ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
