'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Music, X, Loader, Image as ImageIcon, FileText, Upload, Info } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from '@/utils/firebaseClient';
import { useToast } from "@/hooks/use-toast";

async function getCloudinarySignature(paramsToSign: any) {
  const response = await fetch('/api/sign-cloudinary-params', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paramsToSign }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to get signature: ${error.error}`);
  }
  const { signature } = await response.json();
  return signature;
}

async function uploadToCloudinary(file: File, onProgress: (progress: number) => void): Promise<{ success: boolean; url: string; public_id: string; resource_type: string; }> {
    const timestamp = Math.round((new Date).getTime() / 1000);
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
    if (!cloudName || !apiKey) {
        throw new Error("Cloudinary environment variables are not set.");
    }
    const paramsToSign = { timestamp };
    const signature = await getCloudinarySignature(paramsToSign);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp.toString());
    formData.append("signature", signature);
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, true);
        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) onProgress((event.loaded / event.total) * 100);
        };
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                const result = JSON.parse(xhr.responseText);
                resolve({ success: true, url: result.secure_url, public_id: result.public_id, resource_type: result.resource_type });
            } else {
                try {
                    const errorResult = JSON.parse(xhr.responseText);
                    reject(new Error(`Cloudinary upload failed: ${errorResult.error.message}`));
                } catch (e) {
                    reject(new Error(`Cloudinary upload failed with status ${xhr.status}: ${xhr.statusText}`));
                }
            }
        };
        xhr.onerror = () => reject(new Error("Network error during upload."));
        xhr.send(formData);
    });
}

export const MusicUploadForm = ({ onUploadSuccess }: { onUploadSuccess: () => void }) => {
  const [form, setForm] = useState({ title: '', artist: '', album: '', genre: '', year: '', description: '' });
  const [albumArtFile, setAlbumArtFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [lyricsFile, setLyricsFile] = useState<File | null>(null);
  const [albumArtPreview, setAlbumArtPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ audio: 0, art: 0, lyrics: 0 });
  const [error, setError] = useState('');
  const { toast } = useToast();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (currentUser?.displayName) {
      setForm(f => ({ ...f, artist: currentUser.displayName || '' }));
    }
  }, [currentUser]);

  const onDrop = useCallback((acceptedFiles: File[], type: 'audio' | 'art' | 'lyrics') => {
    const file = acceptedFiles[0];
    if (!file) return;
    if (type === 'audio') {
      if (file.size > 50 * 1024 * 1024) { setError('Audio file max size is 50MB'); return; }
      setAudioFile(file);
    } else if (type === 'art') {
      if (file.size > 5 * 1024 * 1024) { setError('Album art max size is 5MB'); return; }
      setAlbumArtFile(file);
      setAlbumArtPreview(URL.createObjectURL(file));
    } else if (type === 'lyrics') {
        if (file.size > 1 * 1024 * 1024) { setError('Lyrics file max size is 1MB'); return; }
        setLyricsFile(file);
    }
    setError('');
  }, []);

  const { getRootProps: audioRootProps, getInputProps: audioInputProps, isDragActive: isAudioDragActive } = useDropzone({ onDrop: f => onDrop(f, 'audio'), accept: { 'audio/*': ['.mp3', '.wav', '.m4a', '.webm'] } });
  const { getRootProps: artRootProps, getInputProps: artInputProps, isDragActive: isArtDragActive } = useDropzone({ onDrop: f => onDrop(f, 'art'), accept: { 'image/*': ['.png', '.jpg', '.jpeg'] } });
  const { getRootProps: lyricsRootProps, getInputProps: lyricsInputProps, open: openLyricsDialog } = useDropzone({ onDrop: f => onDrop(f, 'lyrics'), accept: { 'text/vtt': ['.vtt'] }, noClick: true, noKeyboard: true });

  const resetForm = () => {
      setForm({ title: '', artist: currentUser?.displayName || '', album: '', genre: '', year: '', description: '' });
      setAudioFile(null);
      setAlbumArtFile(null);
      setLyricsFile(null);
      setAlbumArtPreview(null);
      setError('');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile || !albumArtFile || !lyricsFile || !form.title || !form.artist) {
        setError('Title, artist, audio, album art, and a VTT lyrics file are required.');
        return;
    }
    if (!currentUser) {
        setError("Authentication error. Please sign in again.");
        return;
    }
    setLoading(true);
    setError('');
    try {
      const [artResult, audioResult, lyricsResult] = await Promise.all([
        uploadToCloudinary(albumArtFile, (p) => setUploadProgress(prog => ({ ...prog, art: p }))),
        uploadToCloudinary(audioFile, (p) => setUploadProgress(prog => ({ ...prog, audio: p }))),
        uploadToCloudinary(lyricsFile, (p) => setUploadProgress(prog => ({ ...prog, lyrics: p })))
      ]);
      if (!audioResult.success || !artResult.success || !lyricsResult.success) {
        throw new Error("File upload failed. Please try again.");
      }
      await addDoc(collection(db, "songs"), {
          ...form,
          audioUrl: audioResult.url,
          audioPublicId: audioResult.public_id,
          albumArtUrl: artResult.url,
          albumArtPublicId: artResult.public_id,
          lyricsUrl: lyricsResult.url,
          lyricsPublicId: lyricsResult.public_id,
          userId: currentUser.uid,
          username: currentUser.displayName,
          createdAt: serverTimestamp(),
          playCount: 0,
          likesCount: 0,
      });
      toast({ title: "Upload Successful!", description: `"${form.title}" is now live.` });
      resetForm();
      onUploadSuccess();
    } catch (err: any) {
      setError(err.message);
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
      setUploadProgress({ audio: 0, art: 0, lyrics: 0 });
    }
  };

  const totalProgress = (uploadProgress.audio + uploadProgress.art + uploadProgress.lyrics) / 3;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 sm:p-8 mb-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 flex flex-col gap-6">
                 <div {...artRootProps()} className={`relative aspect-square border-2 border-dashed rounded-2xl cursor-pointer flex items-center justify-center transition-all duration-200 ${isArtDragActive ? 'border-accent-cyan bg-accent-cyan/10' : 'border-white/20 hover:border-accent-cyan'}`}>
                    <input {...artInputProps()} />
                    {albumArtPreview ? (
                        <>
                            <img src={albumArtPreview} alt="Album art preview" className="absolute h-full w-full object-cover rounded-xl"/>
                            <button type="button" onClick={(e) => { e.stopPropagation(); setAlbumArtFile(null); setAlbumArtPreview(null); }} className="absolute top-2 right-2 bg-black/70 rounded-full p-1.5 z-10 hover:bg-black transition-colors"><X size={18}/></button>
                        </>
                    ) : (
                        <div className='text-center text-gray-400 p-4'>
                            <ImageIcon className="mx-auto mb-2 text-white/50" size={36}/>
                            <p className='text-sm font-semibold text-white/80'>Drop Album Art *</p>
                            <p className='text-xs text-white/50'>PNG, JPG up to 5MB</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="md:col-span-2 flex flex-col gap-4">
                <input type="text" placeholder="Song Title *" className="input-glass text-lg" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} required disabled={loading} />
                <input type="text" placeholder="Artist Name *" className="input-glass" value={form.artist} onChange={(e) => setForm({...form, artist: e.target.value})} required disabled={loading} />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <input type="text" placeholder="Album (optional)" className="input-glass sm:col-span-2" value={form.album} onChange={(e) => setForm({...form, album: e.target.value})} disabled={loading} />
                    <input type="text" placeholder="Year (e.g. 2024)" className="input-glass" value={form.year} onChange={(e) => setForm({...form, year: e.target.value})} disabled={loading} />
                </div>
                 <input type="text" placeholder="Genre (e.g. Pop, Rock)" className="input-glass" value={form.genre} onChange={(e) => setForm({...form, genre: e.target.value})} disabled={loading} />
                 <div {...audioRootProps()} className={`p-4 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isAudioDragActive ? 'border-accent-cyan bg-accent-cyan/10' : 'border-white/20 hover:border-accent-cyan'}`}>
                    <input {...audioInputProps()} />
                    <div className="flex items-center justify-center text-gray-400">
                        <Music className="text-accent-cyan mr-3" size={24}/>
                        {audioFile ? <p className='text-green-400 truncate'>{audioFile.name}</p> : <p className='font-semibold text-white/80'>Click or drag Audio File *</p>}
                    </div>
                </div>
                 <div {...lyricsRootProps()} className={`bg-white/5 rounded-lg p-3 transition-colors hover:bg-white/10 ${loading ? 'opacity-50' : ''}`}>
                    <input {...lyricsInputProps()} disabled={loading}/>
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <FileText className="text-accent-cyan" size={22} />
                            <div>
                                <p className="font-semibold text-white/90">Lyrics File *</p>
                                {lyricsFile ? (
                                    <p className='text-green-400 text-sm truncate max-w-[200px]'>{lyricsFile.name}</p>
                                ) : (
                                    <p className="text-xs text-white/60">Upload a .vtt file for synchronized lyrics.</p>
                                )}
                            </div>
                        </div>
                        {!lyricsFile ? (
                            <button type="button" onClick={openLyricsDialog} disabled={loading} className="btn-secondary text-sm flex gap-2 items-center disabled:opacity-50">
                                <Upload size={16}/> Choose File
                            </button>
                        ) : (
                             <button type="button" onClick={(e) => { e.stopPropagation(); setLyricsFile(null);}} disabled={loading} className="text-red-500 hover:text-red-400 p-1 rounded-full hover:bg-red-500/10 disabled:opacity-50">
                               <X size={18}/>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>

        <div className="col-span-full">
            <label htmlFor="description" className="flex items-center gap-2 text-md font-semibold text-white/80 mb-2">
                <Info size={20} className="text-accent-cyan"/>
                Description (Optional)
            </label>
            <textarea
                id="description"
                placeholder="Tell listeners about your song..."
                className="input-glass w-full min-h-[120px] text-sm"
                value={form.description}
                onChange={(e) => setForm({...form, description: e.target.value})}
                disabled={loading}
            />
        </div>

        {loading && (
            <div className="w-full bg-white/10 rounded-full h-2.5 mt-2">
                <div className="bg-gradient-to-r from-accent-cyan/50 to-accent-cyan h-2.5 rounded-full transition-all duration-300" style={{ width: `${totalProgress}%` }}></div>
            </div>
        )}

        {error && <p className="text-red-400 text-sm text-center mt-2">{error}</p>}

        <motion.button
          whileHover={{ scale: loading ? 1 : 1.05 }}
          whileTap={{ scale: loading ? 1 : 0.95 }}
          type="submit"
          className="btn-primary w-full mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
          disabled={loading || !audioFile || !albumArtFile || !lyricsFile || !form.title}
        >
          {loading ? <><Loader className="animate-spin" size={20}/> Publishing Song...</> : 'Publish Song'}
        </motion.button>
      </form>
    </motion.div>
  );
};
