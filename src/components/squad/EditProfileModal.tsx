"use client";
import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, X } from 'lucide-react';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
import { auth, app } from '@/utils/firebaseClient';

const db = getFirestore(app);
const storage = getStorage(app);

// Renamed from EditProfileModal to EditPostModal
export function EditPostModal({ post, onClose }: { post: any; onClose: () => void }) {
    const [formData, setFormData] = useState({
        content: post.content || "",
        question: post.content || "", // For polls
        options: post.pollOptions?.map((text: string) => ({ text })) || [{ text: "" }, { text: "" }],
        // Add other relevant fields if they can be edited, e.g., title, caption for media
        title: post.title || "",
        caption: post.content || "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const user = auth.currentUser;

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleOptionChange = (index: number, text: string) => {
        const newOptions = [...formData.options];
        newOptions[index] = { text };
        setFormData(prev => ({ ...prev, options: newOptions }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        
        if (!user || user.uid !== post.userId) {
            setError("You do not have permission to edit this post.");
            setLoading(false);
            return;
        }

        try {
            const postRef = doc(db, "posts", post.id);
            let dataToUpdate: any = {};

            switch (post.type) {
                case 'text':
                    dataToUpdate.content = formData.content;
                    break;
                case 'poll':
                    dataToUpdate.content = formData.question; // The main question is stored in content field
                    dataToUpdate.pollOptions = formData.options.map(opt => opt.text);
                    break;
                case 'media':
                case 'flash':
                    dataToUpdate.content = formData.caption;
                    dataToUpdate.title = formData.title;
                    break;
                default:
                    dataToUpdate.content = formData.content;
            }
            
            await updateDoc(postRef, dataToUpdate);
            onClose();

        } catch (err: any) {
            setError(err.message);
        }
        setLoading(false);
    };

    const renderEditForm = () => {
        switch (post.type) {
            case 'poll':
                return (
                    <div className="flex flex-col gap-3">
                         <textarea name="question" placeholder="Poll Question" className="input-glass w-full rounded-2xl" value={formData.question} onChange={handleTextChange} rows={2} required />
                         {formData.options.map((opt, index) => (
                             <div key={index} className="flex items-center gap-2">
                                <input type="text" value={opt.text} onChange={(e) => handleOptionChange(index, e.target.value)} className="input-glass flex-1" placeholder={`Option ${index + 1}`} />
                             </div>
                         ))}
                    </div>
                );
            case 'media':
            case 'flash':
                return (
                     <div className="flex flex-col gap-3">
                        <input type="text" name="title" placeholder="Title" className="input-glass w-full" value={formData.title} onChange={handleTextChange} />
                        <textarea name="caption" placeholder="Caption" className="input-glass w-full rounded-2xl" value={formData.caption} onChange={handleTextChange} rows={4} />
                    </div>
                );
            case 'text':
            default:
                return (
                    <textarea name="content" placeholder="Your post content..." className="input-glass w-full rounded-2xl min-h-[150px]" value={formData.content} onChange={handleTextChange} required />
                );
        }
    };

    return (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-6 w-full max-w-md relative flex flex-col"
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">&times;</button>
                <h2 className="text-xl font-headline font-bold mb-4 text-accent-cyan">Edit Post</h2>
                
                <form onSubmit={handleSubmit}>
                    {renderEditForm()}
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
