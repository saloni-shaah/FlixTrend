"use client";
import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera } from 'lucide-react';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
import { auth, app } from '@/utils/firebaseClient';

const db = getFirestore(app);
const storage = getStorage(app);

export function EditProfileModal({ profile, onClose }: { profile: any; onClose: () => void }) {
    const [form, setForm] = useState({
      name: profile.name || "",
      bio: profile.bio || "",
      interests: profile.interests || "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [uploading, setUploading] = useState<string | null>(null);

    const bannerInputRef = useRef<HTMLInputElement>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const [avatarPreview, setAvatarPreview] = useState(profile.avatar_url || null);
    const [bannerPreview, setBannerPreview] = useState(profile.banner_url || null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm({ ...form, [e.target.name]: e.target.value });
    };
  
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'avatar_url' | 'banner_url') => {
      const file = e.target.files?.[0];
      if (file) {
        setUploading(field);
        const previewUrl = URL.createObjectURL(file);
        if (field === 'avatar_url') {
            setAvatarPreview(previewUrl);
        } else {
            setBannerPreview(previewUrl);
        }

        try {
            const user = auth.currentUser;
            if (!user) throw new Error("Not logged in");

            const fileName = `${user.uid}-${Date.now()}-${file.name}`;
            const storageRef = ref(storage, `user_uploads/${fileName}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, { [field]: downloadURL });
            setSuccess(`${field === 'avatar_url' ? 'Profile picture' : 'Banner'} updated!`);

        } catch (err: any) {
            setError(err.message);
        }
        setUploading(null);
      }
    };
  
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError("");
      setSuccess("");
      try {
        const user = auth.currentUser;
        if (!user) throw new Error("Not logged in");
        const docRef = doc(db, "users", user.uid);
        await updateDoc(docRef, { ...form });
        setSuccess("Profile updated!");
        setTimeout(onClose, 1000);
      } catch (err: any) {
        setError(err.message);
      }
      setLoading(false);
    };
  
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-6 w-full max-w-md relative max-h-[90vh] flex flex-col"
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">&times;</button>
                <h2 className="text-xl font-headline font-bold mb-4 text-accent-cyan">Edit Profile</h2>
                
                <div className="flex-1 overflow-y-auto pr-2">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                      <div className="relative h-24 mb-12">
                        <button type="button" onClick={() => bannerInputRef.current?.click()} className="relative group h-full w-full rounded-lg bg-white/10 overflow-hidden">
                          {bannerPreview && <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover"/>}
                           <div className="absolute inset-0 w-full h-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera size={24} />
                           </div>
                        </button>
                        <input type="file" ref={bannerInputRef} onChange={(e) => handleFileChange(e, 'banner_url')} className="hidden" accept="image/*" />

                        <button type="button" onClick={() => avatarInputRef.current?.click()} className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full border-4 border-background bg-background group">
                          <div className="relative w-full h-full rounded-full overflow-hidden">
                            {avatarPreview && <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover"/>}
                             <div className="absolute inset-0 w-full h-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera size={24} />
                            </div>
                          </div>
                        </button>
                        <input type="file" ref={avatarInputRef} onChange={(e) => handleFileChange(e, 'avatar_url')} className="hidden" accept="image/*" />
                      </div>
                      
                      {uploading && (
                        <div className="text-center text-accent-cyan text-sm">Uploading {uploading === 'avatar_url' ? 'profile picture' : 'banner'}...</div>
                      )}

                      <input
                        type="text" name="name" placeholder="Full Name" className="input-glass w-full"
                        value={form.name} onChange={handleChange} required />
                      
                      <textarea
                        name="bio" placeholder="Bio" className="input-glass w-full rounded-2xl" rows={3}
                        value={form.bio} onChange={handleChange} />
                      
                      <input
                        type="text" name="interests" placeholder="Interests (e.g., tech, music, art)" className="input-glass w-full"
                        value={form.interests} onChange={handleChange} />
                      
                      {error && <div className="text-red-400 text-center">{error}</div>}
                      {success && <div className="text-green-400 text-center">{success}</div>}
                      
                      <button
                        type="submit" className="btn-glass bg-accent-cyan text-black mt-4"
                        disabled={loading || !!uploading}>
                        {loading ? "Saving..." : "Save Changes"}
                      </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}