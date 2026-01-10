"use client";
import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera } from 'lucide-react';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
import { auth, app } from '@/utils/firebaseClient';
import { updateProfile } from 'firebase/auth';

const db = getFirestore(app);
const storage = getStorage(app);

export function CompleteProfileModal({ profile, onClose }: { profile: any, onClose: () => void }) {
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url);
    const [bannerPreview, setBannerPreview] = useState<string | null>(profile.banner_url);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const user = auth.currentUser;

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

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
        if (!avatarFile && !bannerFile) {
            onClose(); // Nothing to upload, just close
            return;
        }

        setLoading(true);
        setError("");

        try {
            const dataToUpdate: any = { profileComplete: true };
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

            // Also update the Firebase Auth profile if avatar changes
            if (dataToUpdate.avatar_url) {
                await updateProfile(user, {
                    photoURL: dataToUpdate.avatar_url,
                });
            }
            
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
                className="glass-card p-6 w-full max-w-md relative flex flex-col"
            >
                <h2 className="text-xl font-headline font-bold mb-2 text-accent-cyan">Add Your Vibe</h2>
                <p className="text-sm text-gray-300 mb-6">Complete your profile by adding a profile picture and banner. You can always do this later.</p>
                
                {error && <div className="text-red-400 text-center mb-4 p-2 bg-red-900/50 rounded-md">{error}</div>}
                
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                    
                    <div className="flex justify-end gap-3 mt-4">
                        <button type="button" className="btn-glass" onClick={onClose}>Skip for Now</button>
                        <button type="submit" className="btn-glass bg-accent-pink text-white" disabled={loading}>
                            {loading ? "Saving..." : "Save & Continue"}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
