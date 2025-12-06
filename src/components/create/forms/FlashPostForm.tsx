
"use client";
import React, { useState, useRef, useEffect } from 'react';
import { X, UploadCloud, Music as MusicIcon, MapPin, Smile, Camera, Image as ImageIcon, Zap, Locate, Loader, Wand2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { getFirestore, collection, onSnapshot, query, orderBy, getDoc, doc } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, app } from '@/utils/firebaseClient';
import { FilterCamera } from './FilterCamera';

const db = getFirestore(app);
const storage = getStorage(app);

export function FlashPostForm({ data, onDataChange }: { data: any, onDataChange: (data: any) => void }) {
    const [mediaPreview, setMediaPreview] = useState<string | null>(data.mediaUrl ? (Array.isArray(data.mediaUrl) ? data.mediaUrl[0] : data.mediaUrl) : null);
    const [showSongPicker, setShowSongPicker] = useState(false);
    const [appSongs, setAppSongs] = useState<any[]>([]);
    
    const [showFilterCamera, setShowFilterCamera] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (data.songId && !data.song) {
            const fetchSong = async () => {
                const songDoc = await getDoc(doc(db, "songs", data.songId));
                if (songDoc.exists()) {
                    handleSelectSong({ id: songDoc.id, ...songDoc.data() });
                }
            };
            fetchSong();
        }

        const q = query(collection(db, "songs"), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, (snapshot) => {
            setAppSongs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsub();
    }, [data.songId]);

    const handleFileUpload = async (file: File) => {
        const user = auth.currentUser;
        if (!user) {
            setUploadError("You must be logged in to upload files.");
            return;
        }

        if (file.size > 20 * 1024 * 1024) { // 20MB limit for Flashes
            setUploadError("File is too large for a Flash (max 20MB).");
            return;
        }

        setIsUploading(true);
        setUploadError('');
        const previewUrl = URL.createObjectURL(file);
        setMediaPreview(previewUrl);

        try {
            const fileName = `${user.uid}-${Date.now()}-${file.name}`;
            const fileRef = storageRef(storage, `flashes/${user.uid}/${fileName}`);
            
            const snapshot = await uploadBytes(fileRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            onDataChange({ ...data, mediaUrl: [downloadURL] });
            setMediaPreview(downloadURL);

        } catch (error: any) {
            console.error("Upload failed:", error);
            setUploadError(error.message);
            setMediaPreview(null); // Clear preview on error
        } finally {
            setIsUploading(false);
            // URL.revokeObjectURL(previewUrl); // Keep for display
        }
    };

    const handleCaptureFromFilter = (image: string) => {
        const byteString = atob(image.split(',')[1]);
        const mimeString = image.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeString });
        const file = new File([blob], `filter-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        handleFileUpload(file);
        setShowFilterCamera(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
        }
    };
    
    const removeMedia = () => {
        setMediaPreview(null);
        onDataChange({ ...data, mediaUrl: [] });
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        onDataChange({ ...data, [e.target.name]: e.target.value });
    };

    const handleSelectSong = (song: any) => {
        onDataChange({ ...data, song: {
            id: song.id,
            name: song.title,
            artists: [song.artist],
            album: song.album,
            albumArt: song.albumArtUrl,
            preview_url: song.audioUrl,
            snippetStart: 0,
            snippetEnd: 15,
        } });
        setShowSongPicker(false);
    };

     const handleGetLocation = () => {
        setUploadError("");
        if (navigator.geolocation) {
            setIsFetchingLocation(true);
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const locationData = await response.json();
                    const city = locationData.address.city || locationData.address.town || locationData.address.village;
                    const country = locationData.address.country;
                    if(city && country){
                        onDataChange({ ...data, location: `${city}, ${country}` });
                    } else {
                         onDataChange({ ...data, location: 'Unknown Location' });
                    }
                } catch (error) {
                    setUploadError("Could not fetch location name.");
                } finally {
                    setIsFetchingLocation(false);
                }
            }, (error) => {
                if (error.code === error.PERMISSION_DENIED) {
                    setUploadError("Location permission denied.");
                } else {
                    setUploadError("Could not get location.");
                }
                setIsFetchingLocation(false);
            });
        } else {
            setUploadError("Geolocation is not supported by this browser.");
        }
    };

    if (showFilterCamera) {
        return <FilterCamera onCapture={handleCaptureFromFilter} />
    }

    return (
        <div className="flex flex-col gap-4">
            <textarea
                name="caption"
                className="input-glass w-full rounded-2xl"
                placeholder="Add a caption..."
                value={data.caption || ''}
                onChange={handleTextChange}
            />

            <div className="p-4 border-2 border-dashed border-accent-cyan/30 rounded-2xl text-center min-h-[200px] flex flex-col items-center justify-center">
                {isUploading && (
                    <div className="flex flex-col items-center gap-2">
                        <Loader className="animate-spin text-accent-cyan"/>
                        <p className="text-sm text-accent-cyan">Uploading...</p>
                    </div>
                )}
                {!isUploading && !mediaPreview && (
                    <div className="grid grid-cols-3 gap-2 w-full max-w-sm">
                        <button type="button" className="btn-glass flex items-center justify-center gap-2" onClick={() => fileInputRef.current?.click()}>
                            <ImageIcon /> Gallery
                        </button>
                        <button type="button" className="btn-glass flex items-center justify-center gap-2" onClick={() => setShowFilterCamera(true)}>
                            <Camera /> Camera
                        </button>
                        <button type="button" className="btn-glass flex items-center justify-center gap-2" onClick={() => setShowFilterCamera(true)}>
                            <Wand2 /> Filters
                        </button>
                    </div>
                )}
                {mediaPreview && !isUploading && (
                     <div className="relative group aspect-video">
                        {(mediaPreview.includes('.mp4') || mediaPreview.includes('.webm') || mediaPreview.startsWith('blob:')) ? (
                            <video src={mediaPreview} className="w-full h-full object-contain rounded-lg" controls/>
                        ) : (
                            <img src={mediaPreview} alt="preview" className="w-full h-full object-contain rounded-lg" />
                        )}
                        <button type="button" onClick={removeMedia} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 z-10">
                            <X size={16} />
                        </button>
                    </div>
                )}
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*" />
                {uploadError && <p className="text-red-400 text-xs mt-2">{uploadError}</p>}
            </div>
            
             <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input type="text" name="location" className="w-full rounded-xl p-3 pl-10 bg-black/20 text-white border-2 border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-pink" placeholder="Add location..." value={data.location || ''} onChange={handleTextChange} />
                 <button type="button" onClick={handleGetLocation} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-accent-cyan" disabled={isFetchingLocation}>
                    {isFetchingLocation ? <Loader className="animate-spin" size={16} /> : <Locate size={16} />}
                </button>
            </div>
            <div className="relative">
                <Smile className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input type="text" name="mood" className="w-full rounded-xl p-3 pl-10 bg-black/20 text-white border-2 border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-pink" placeholder="How are you feeling?" value={data.mood || ''} onChange={handleTextChange} />
            </div>

            <div className="mt-2">
                <button type="button" className="w-full btn-glass flex justify-between items-center" onClick={() => setShowSongPicker(v => !v)}>
                    <span>{data.song ? `Song: ${data.song.name}` : 'Add a Song (Optional)'}</span>
                    <MusicIcon size={16}/>
                </button>
                <motion.div
                    initial={false}
                    animate={{ height: showSongPicker ? 'auto' : 0, opacity: showSongPicker ? 1 : 0 }}
                    className="overflow-hidden bg-black/20 rounded-b-lg"
                >
                    <div className="p-2 max-h-48 overflow-y-auto">
                        {appSongs.map(song => (
                            <div key={song.id} className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-accent-cyan/10" onClick={() => handleSelectSong(song)}>
                                <img src={song.albumArtUrl} alt="album" className="w-10 h-10 rounded" />
                                <div>
                                    <div className="font-bold text-sm text-accent-cyan">{song.title}</div>
                                    <div className="text-xs text-gray-400">{song.artist}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
            
        </div>
    );
}
