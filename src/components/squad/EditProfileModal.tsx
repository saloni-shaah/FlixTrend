"use client";
import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, X } from 'lucide-react';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
import { auth, app } from '@/utils/firebaseClient';

const db = getFirestore(app);
const storage = getStorage(app);

export function EditProfileModal({ profile, onClose }: { profile: any; onClose: () => void }) {
    const [formData, setFormData] = useState({
        name: profile.name || "",
        username: profile.username || "",
        bio: profile.bio || "",
        location: profile.location || "",
        interests: profile.interests || "",
    });
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url);
    const [bannerPreview, setBannerPreview] = useState<string | null>(profile.banner_url);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const user = auth.currentUser;

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const previewUrl = URL.createObjectURL(file);
            if (type === 'avatar') {
                setAvatarFile(file);
                setAvatarPreview(previewUrl);
            } else {
                setBannerFile(file);
                setBannerPreview(previewUrl);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            setError("You must be logged in.");
            return;
        }
        setLoading(true);
        setError("");

        try {
            const dataToUpdate: any = { ...formData };
            const uploadFile = async (file: File, path: string) => {
                const fileRef = storageRef(storage, path);
                const snapshot = await uploadBytes(fileRef, file);
                return await getDownloadURL(snapshot.ref);
            };

            if (avatarFile) {
                dataToUpdate.avatar_url = await uploadFile(avatarFile, `user_uploads/${user.uid}/avatar-${Date.now()}`);
            }
            if (bannerFile) {
                dataToUpdate.banner_url = await uploadFile(bannerFile, `user_uploads/${user.uid}/banner-${Date.now()}`);
            }

            const docRef = doc(db, "users", user.uid);
            await updateDoc(docRef, dataToUpdate);
            
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
                <h2 className="text-xl font-headline font-bold mb-4 text-accent-cyan">Edit Profile</h2>
                
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto pr-2 max-h-[80vh]">
                    <div className="flex items-center gap-4">
                        <div className="relative group shrink-0">
                            <img src={avatarPreview || `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${profile.username}`} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-accent-pink" />
                             <button type="button" onClick={() => avatarInputRef.current?.click()} className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera />
                            </button>
                            <input type="file" ref={avatarInputRef} onChange={(e) => handleFileChange(e, 'avatar')} accept="image/*" className="hidden"/>
                        </div>
                        <div className="relative group w-full h-24 rounded-lg bg-black/20 overflow-hidden">
                            {bannerPreview ? <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-gray-400">Banner</div>}
                            <button type="button" onClick={() => bannerInputRef.current?.click()} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera />
                            </button>
                             <input type="file" ref={bannerInputRef} onChange={(e) => handleFileChange(e, 'banner')} accept="image/*" className="hidden"/>
                        </div>
                    </div>
                    <input type="text" name="name" placeholder="Full Name" className="input-glass w-full" value={formData.name} onChange={handleTextChange} required />
                    <input type="text" name="username" placeholder="Username" className="input-glass w-full bg-gray-800/50" value={formData.username} readOnly />
                    <textarea name="bio" placeholder="Your Bio" className="input-glass w-full rounded-2xl min-h-[100px]" value={formData.bio} onChange={handleTextChange} />
                    <input type="text" name="location" placeholder="Location" className="input-glass w-full" value={formData.location} onChange={handleTextChange} />
                    <input type="text" name="interests" placeholder="Interests (comma-separated)" className="input-glass w-full" value={formData.interests} onChange={handleTextChange} />

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
