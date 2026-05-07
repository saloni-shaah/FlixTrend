'use client';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Camera, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL, UploadTaskSnapshot } from "firebase/storage";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
import { auth, app } from '@/utils/firebaseClient';
import { updateProfile } from 'firebase/auth';
import imageCompression from 'browser-image-compression';

const db = getFirestore(app);
const storage = getStorage(app);

interface Profile {
   name: string;
   username: string;
   bio?: string;
   location?: string;
   interests?: string | string[];
   avatar_url?: string;
   banner_url?: string;
}

const getErrorMessage = (err: any) => {
    if (err.code) {
        switch (err.code) {
            case 'storage/unauthorized': return 'Upload permission denied.';
            case 'storage/canceled': return 'The upload was canceled.';
            case 'storage/quota-exceeded': return 'Your storage quota has been exceeded.';
        }
    }
    return err.message || 'An unexpected error occurred. Please try again.';
};

export function EditProfileModal({ profile, onClose }: { profile: Profile; onClose: () => void }) {
    // 9. Potential Type Issue -> Safer State Initialization
    const [formData, setFormData] = useState({
        name: profile.name || "",
        bio: profile.bio || "",
        location: profile.location || "",
    });
    
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url);
    const [bannerPreview, setBannerPreview] = useState<string | null>(profile.banner_url);
    
    const getInitialInterests = () => {
        const { interests } = profile;
        if (Array.isArray(interests)) return interests.filter(i => i && i.trim() !== '');
        if (typeof interests === 'string') return interests.split(',').filter(i => i && i.trim() !== '');
        return [];
    };
    const [interestChips, setInterestChips] = useState<string[]>(getInitialInterests());
    const [interestInput, setInterestInput] = useState("");

    const [loading, setLoading] = useState(false);
    const [isCompressing, setIsCompressing] = useState(false);
    // 2. HUGE ISSUE -> Accurate Upload Progress
    const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
    const [error, setError] = useState("");
    const [showConfirm, setShowConfirm] = useState(false); // 4. For custom confirmation modal

    const user = auth.currentUser;
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    const isChanged = useMemo(() => 
        formData.name !== (profile.name || "") ||
        formData.bio !== (profile.bio || "") ||
        formData.location !== (profile.location || "") ||
        interestChips.join(',') !== (Array.isArray(profile.interests) ? profile.interests.join(',') : profile.interests || "") ||
        avatarFile !== null ||
        bannerFile !== null
    , [formData, interestChips, avatarFile, bannerFile, profile]);

    const handleSafeClose = () => {
        if (loading || isCompressing) return;
        if (isChanged) {
            setShowConfirm(true); // 4. Use custom modal
        } else {
            onClose();
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleSafeClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isChanged, loading, isCompressing]);

    const handleFileSelect = async (file: File | null, type: 'avatar' | 'banner') => {
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            setError('Invalid file type. Only JPG, PNG, and WEBP are allowed.');
            return;
        }
        setError("");

        const imageURL = URL.createObjectURL(file);
        const image = document.createElement('img');
        image.src = imageURL;

        image.onload = async () => {
            const { naturalWidth: w, naturalHeight: h } = image;
            URL.revokeObjectURL(imageURL); // Revoke on success

            setIsCompressing(true);
            try {
                const compressedFile = await imageCompression(file, {
                    maxSizeMB: type === 'avatar' ? 0.2 : 0.8,
                    maxWidthOrHeight: type === 'avatar' ? 512 : 1600,
                });
                const previewUrl = URL.createObjectURL(compressedFile);

                if (type === 'avatar') {
                    setAvatarFile(compressedFile);
                    setAvatarPreview(p => { if (p?.startsWith('blob:')) URL.revokeObjectURL(p); return previewUrl; });
                } else {
                    setBannerFile(compressedFile);
                    setBannerPreview(p => { if (p?.startsWith('blob:')) URL.revokeObjectURL(p); return previewUrl; });
                }
            } catch (err) { setError("Failed to process image."); } 
            finally { setIsCompressing(false); }
        };

        // 3. Image Validation Has a Small Memory Leak -> Fix
        image.onerror = () => {
            URL.revokeObjectURL(imageURL); // Also revoke on error
            setError('Could not read image file. It may be corrupted.');
        };
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !isChanged) return;
        setLoading(true);
        setError("");
        setUploadProgress({});

        try {
            const dataToUpdate: Partial<Omit<Profile, 'interests'>> & { interests?: string } = {
                name: formData.name,
                bio: formData.bio,
                location: formData.location,
                interests: interestChips.join(','),
            };

            const uploadTasks: Promise<void>[] = [];
            const filesToUpload: {file: File, type: string}[] = [];
            if (avatarFile) filesToUpload.push({file: avatarFile, type: 'avatar'});
            if (bannerFile) filesToUpload.push({file: bannerFile, type: 'banner'});

            const uploadFile = (file: File, type: string): Promise<string> => {
                return new Promise((resolve, reject) => {
                    const path = `user_uploads/${user.uid}/${type}-${Date.now()}`;
                    const fileRef = storageRef(storage, path);
                    const task = uploadBytesResumable(fileRef, file);
                    task.on('state_changed',
                        (snapshot: UploadTaskSnapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            setUploadProgress(prev => ({ ...prev, [type]: progress }));
                        },
                        (error) => reject(error),
                        async () => {
                            const url = await getDownloadURL(task.snapshot.ref);
                            resolve(url);
                        }
                    );
                });
            };

            if (avatarFile) {
                uploadTasks.push(uploadFile(avatarFile, 'avatar').then(url => { dataToUpdate.avatar_url = url; }));
            }
            if (bannerFile) {
                uploadTasks.push(uploadFile(bannerFile, 'banner').then(url => { dataToUpdate.banner_url = url; }));
            }

            await Promise.all(uploadTasks);

            await updateDoc(doc(db, "users", user.uid), dataToUpdate);
            await updateProfile(user, { displayName: dataToUpdate.name, photoURL: dataToUpdate.avatar_url || user.photoURL });
            
            onClose();
        } catch (err: any) { setError(getErrorMessage(err)); } 
        finally { setLoading(false); }
    };

    const handleInterestKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            if (interestChips.length >= 10) { // 7. Add Interest Limit
                setError("You can add a maximum of 10 interests.");
                return;
            }
            // 6. Potential Duplicate Interest Bug -> Fix
            const newInterest = interestInput.trim();
            const normalizedInput = newInterest.toLowerCase();
            if (newInterest && !interestChips.map(c => c.toLowerCase()).includes(normalizedInput)) {
                setInterestChips([...interestChips, newInterest]);
            }
            setInterestInput("");
        }
    };

    const totalUploadProgress = Object.keys(uploadProgress).length > 0 
        ? Object.values(uploadProgress).reduce((acc, prog) => acc + prog, 0) / Object.keys(uploadProgress).length
        : 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4" onClick={handleSafeClose}>
            <AnimatePresence>
                {/* 4. Add custom confirmation modal */}
                {showConfirm && (
                     <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute z-20 glass-card p-6 w-full max-w-sm rounded-2xl flex flex-col items-center text-center">
                        <AlertTriangle className="w-12 h-12 text-amber-400 mb-4"/>
                        <h3 className="font-bold text-lg mb-2">Discard Changes?</h3>
                        <p className="text-sm text-gray-300 mb-6">You have unsaved changes. Are you sure you want to discard them?</p>
                        <div className="flex w-full gap-3">
                            <button onClick={() => setShowConfirm(false)} className="btn-glass flex-1">Cancel</button>
                            <button onClick={onClose} className="btn-glass bg-red-500/80 text-white flex-1">Discard</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "circOut" }}
                className="glass-card p-6 w-full max-w-lg relative flex flex-col rounded-3xl"
                onClick={(e) => e.stopPropagation()}
            >
                {(loading || isCompressing) && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-3xl z-10 gap-3">
                        <div className="w-10 h-10 border-4 border-accent-pink border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-white font-medium">
                            {isCompressing ? "Optimizing..." : (totalUploadProgress < 100) ? `Uploading... ${Math.round(totalUploadProgress)}%` : "Saving..."}
                        </p>
                    </div>
                )}

                <button onClick={handleSafeClose} aria-label="Close profile editor" className="absolute top-4 right-4 text-gray-400 hover:text-white z-10"><X size={20} /></button>
                <h2 className="text-xl font-headline font-bold mb-4 text-accent-cyan">Edit Profile</h2>
                
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto pr-2 -mr-2 max-h-[80vh]">
                    <div className="flex items-center gap-4">
                        <div className="relative group shrink-0">
                            <Image width={96} height={96} src={avatarPreview || `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${profile.username}`} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-accent-pink" />
                            <button type="button" aria-label="Upload new avatar" onClick={() => avatarInputRef.current?.click()} className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera /></button>
                            <input type="file" ref={avatarInputRef} onChange={(e) => handleFileSelect(e.target.files?.[0] || null, 'avatar')} accept="image/jpeg,image/png,image/webp" className="hidden" />
                        </div>
                        <div className="relative group w-full h-24 rounded-lg bg-black/20 overflow-hidden" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); handleFileSelect(e.dataTransfer.files?.[0] || null, 'banner'); }}>
                            {bannerPreview ? <Image fill className="object-cover" src={bannerPreview} alt="Banner" /> : <div className="flex items-center justify-center h-full text-gray-400 text-xs">Banner</div>} {/* 1. Modern next/image syntax */}
                            <button type="button" aria-label="Upload new banner" onClick={() => bannerInputRef.current?.click()} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera /></button>
                            <input type="file" ref={bannerInputRef} onChange={(e) => handleFileSelect(e.target.files?.[0] || null, 'banner')} accept="image/jpeg,image/png,image/webp" className="hidden" />
                        </div>
                    </div>
                    {error && <p className="text-red-400 text-xs my-2 text-center bg-red-500/10 p-2 rounded-lg">{error}</p>}
                    
                    <input type="text" name="name" placeholder="Full Name" className="input-glass w-full" value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))} required />
                    <div className="relative"><input type="text" name="username" value={`@${profile.username}`} readOnly className="input-glass w-full bg-gray-800/40 pr-20" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-green-400 font-semibold flex items-center gap-1"><CheckCircle size={12}/> locked</span></div>
                    <div>
                        <textarea name="bio" placeholder="Your Bio" className="input-glass w-full rounded-2xl min-h-[100px]" value={formData.bio} onChange={e => setFormData(p => ({...p, bio: e.target.value}))} maxLength={160} />
                        <p className="text-xs text-right text-gray-400 mt-1">{formData.bio?.length || 0}/160</p>
                    </div>
                    <input type="text" name="location" placeholder="Location" className="input-glass w-full" value={formData.location} onChange={e => setFormData(p => ({...p, location: e.target.value}))} />
                    
                    <div>
                        <div className="flex flex-wrap gap-2 p-2 rounded-lg bg-black/20 min-h-[44px]">
                            {interestChips.map(chip => (
                                <div key={chip} className="flex items-center gap-1 bg-accent-cyan/20 text-accent-cyan-light text-sm px-2 py-1 rounded-md">
                                    <span>{chip}</span>
                                    <button type="button" aria-label={`Remove interest: ${chip}`} onClick={() => setInterestChips(interestChips.filter(c => c !== chip))} className="text-accent-cyan/70 hover:text-accent-cyan">&times;</button>
                                </div>
                            ))}
                             <input 
                                type="text" 
                                value={interestInput}
                                onChange={(e) => setInterestInput(e.target.value)}
                                onKeyDown={handleInterestKeyDown}
                                placeholder={interestChips.length < 10 ? "Add interests..." : "10 interests max."}
                                disabled={interestChips.length >= 10}
                                className="flex-1 bg-transparent outline-none p-1 placeholder-gray-500 text-sm min-w-[120px] disabled:cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-4">
                        <button type="button" className="btn-glass" onClick={handleSafeClose}>Cancel</button>
                        <button type="submit" className="btn-glass bg-accent-pink text-white disabled:bg-gray-500 disabled:cursor-not-allowed" disabled={!isChanged || loading || isCompressing}>
                            Save Changes
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
