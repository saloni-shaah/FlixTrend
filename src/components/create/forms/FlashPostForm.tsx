
"use client";
import React, { useState, useRef, useEffect } from 'react';
import { X, UploadCloud, Music as MusicIcon, MapPin, Camera, Image as ImageIcon, Locate, Loader, Calendar as CalendarIcon, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { getFirestore, collection, onSnapshot, query, orderBy, getDoc, doc } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, app } from '@/utils/firebaseClient';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';

const db = getFirestore(app);
const storage = getStorage(app);

export function FlashPostForm({ data, onDataChange }: { data: any, onDataChange: (data: any) => void }) {
    const [mediaPreview, setMediaPreview] = useState<string | null>(data.mediaUrl ? (Array.isArray(data.mediaUrl) ? data.mediaUrl[0] : data.mediaUrl) : null);
    const [showSongPicker, setShowSongPicker] = useState(false);
    const [appSongs, setAppSongs] = useState<any[]>([]);
    
    const [showCamera, setShowCamera] = useState(false);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isCameraSupported, setIsCameraSupported] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        // Check for camera support on component mount
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.enumerateDevices()
                .then(devices => {
                    if (devices.some(device => device.kind === 'videoinput')) {
                        setIsCameraSupported(true);
                    }
                });
        }
    }, []);

    useEffect(() => {
        if (showCamera) startCamera();
        else stopCamera();
    }, [showCamera]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            setCameraStream(stream);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Camera error:", err);
            setCameraError("Camera access denied. Please enable it in your browser settings.");
        }
    };
    
    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
    };

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

        if (file.size > 20 * 1024 * 1024) { // 20MB limit
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

            onDataChange({ ...data, mediaUrl: [downloadURL], mediaFiles: [file] });
            setMediaPreview(downloadURL);

        } catch (error: any) {
            console.error("Upload failed:", error);
            setUploadError(error.message);
            setMediaPreview(null);
        } finally {
            setIsUploading(false);
        }
    };
    
    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
                        handleFileUpload(file);
                    }
                }, 'image/jpeg');
            }
        }
        setShowCamera(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragOver(true); };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragOver(false); };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    };
    
    const removeMedia = () => {
        setMediaPreview(null);
        onDataChange({ ...data, mediaUrl: [], mediaFiles: [] });
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        onDataChange({ ...data, [e.target.name]: e.target.value });
    };
    
    const handleDateChange = (date: Date | undefined) => {
        onDataChange({ ...data, scheduleDate: date });
    }

    const handleSelectSong = (song: any) => {
        onDataChange({ ...data, song: { id: song.id, name: song.title, artists: [song.artist], album: song.album, albumArt: song.albumArtUrl, preview_url: song.audioUrl } });
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
                    onDataChange({ ...data, location: city && country ? `${city}, ${country}` : 'Unknown Location' });
                } catch (error) {
                    setUploadError("Could not fetch location name.");
                } finally {
                    setIsFetchingLocation(false);
                }
            }, (error) => {
                setUploadError(error.code === error.PERMISSION_DENIED ? "Location permission denied." : "Could not get location.");
                setIsFetchingLocation(false);
            });
        } else {
            setUploadError("Geolocation is not supported by this browser.");
        }
    };

    if (showCamera) {
        return (
            <div className="flex flex-col items-center gap-4">
                <div className="w-full aspect-video bg-black rounded-lg overflow-hidden relative">
                    {cameraStream ? (
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            {cameraError ? cameraError : "Starting camera..."}
                        </div>
                    )}
                </div>
                <button type="button" className="btn-glass bg-accent-pink text-white w-20 h-20 rounded-full flex items-center justify-center" onClick={handleCapture} disabled={!cameraStream}>
                    <Zap size={32} />
                </button>
                <button type="button" className="text-sm text-gray-400" onClick={() => setShowCamera(false) }>Back to upload</button>
                <canvas ref={canvasRef} className="hidden"></canvas>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4">
            <textarea name="caption" className="input-glass w-full rounded-2xl" placeholder="Add a caption..." value={data.caption || ''} onChange={handleTextChange} />

            <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className={`p-4 border-2 border-dashed rounded-2xl text-center min-h-[200px] flex flex-col items-center justify-center transition-colors ${isDragOver ? 'border-accent-pink bg-accent-pink/10' : 'border-accent-cyan/30'}`}>
                {isUploading ? (
                    <div className="flex flex-col items-center gap-2"><Loader className="animate-spin text-accent-cyan"/><p className="text-sm text-accent-cyan">Uploading...</p></div>
                ) : !mediaPreview ? (
                    <div className="flex flex-col items-center gap-4">
                        <UploadCloud className="text-gray-500" size={40}/>
                        <p className="text-gray-400">Drag & drop media here</p>
                        <p className="text-gray-500 text-xs">or</p>
                        <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                            <button type="button" className="btn-glass flex items-center justify-center gap-2" onClick={() => fileInputRef.current?.click()}><ImageIcon /> Gallery</button>
                            {isCameraSupported && (
                                <button type="button" className="btn-glass flex items-center justify-center gap-2" onClick={() => setShowCamera(true)}><Camera /> Camera</button>
                            )}
                        </div>
                    </div>
                ) : (
                     <div className="relative group w-full h-full">
                        <div className="aspect-video w-full h-full">
                             {(mediaPreview.includes('.mp4') || mediaPreview.includes('.webm') || data.mediaFiles[0]?.type.startsWith('video/')) ? (
                                <video src={mediaPreview} className="w-full h-full object-contain rounded-lg" controls/>
                            ) : (
                                <img src={mediaPreview} alt="preview" className="w-full h-full object-contain rounded-lg" />
                            )}
                        </div>
                        <button type="button" onClick={removeMedia} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 z-10"><X size={16} /></button>
                    </div>
                )}
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*" />
                {uploadError && <p className="text-red-400 text-xs mt-2">{uploadError}</p>}
            </div>
            
             <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input type="text" name="location" className="w-full rounded-xl p-3 pl-10 bg-black/20 text-white border-2 border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-pink" placeholder="Add location..." value={data.location || ''} onChange={handleTextChange} />
                 <button type="button" onClick={handleGetLocation} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-accent-cyan" disabled={isFetchingLocation}>{isFetchingLocation ? <Loader className="animate-spin" size={16} /> : <Locate size={16} />}</button>
            </div>
            
             <div>
                <Popover>
                    <PopoverTrigger asChild>
                    <button className="w-full btn-glass flex justify-between items-center">
                        <span>{data.scheduleDate ? `Scheduled for: ${format(data.scheduleDate, 'PPP')}` : 'Schedule Flash (Optional)'}</span>
                        <CalendarIcon size={16}/>
                    </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 glass-card">
                    <Calendar mode="single" selected={data.scheduleDate} onSelect={handleDateChange} initialFocus disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))}/>
                    </PopoverContent>
                </Popover>
            </div>

            <div className="mt-2">
                <button type="button" className="w-full btn-glass flex justify-between items-center" onClick={() => setShowSongPicker(v => !v)}>
                    <span>{data.song ? `Song: ${data.song.name}` : 'Add a Song (Optional)'}</span>
                    <MusicIcon size={16}/>
                </button>
                <motion.div initial={false} animate={{ height: showSongPicker ? 'auto' : 0, opacity: showSongPicker ? 1 : 0 }} className="overflow-hidden bg-black/20 rounded-b-lg">
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
