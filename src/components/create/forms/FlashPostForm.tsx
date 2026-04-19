'use client';
import React, { useState, useRef, useEffect } from 'react';
import { X, UploadCloud, Music as MusicIcon, MapPin, Camera, Image as ImageIcon, Locate, Loader, Calendar as CalendarIcon, Zap, Search, Play, Pause } from 'lucide-react';
import { motion } from 'framer-motion';
import { getFirestore, collection, onSnapshot, query, orderBy, getDoc, doc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { auth, app } from '@/utils/firebaseClient';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import imageCompression from 'browser-image-compression';

const db = getFirestore(app);
const storage = getStorage(app);

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_VIDEO_DURATION = 180; // 3 minutes

const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
};

export function FlashPostForm({ data, onDataChange }: { data: any, onDataChange: (data: any) => void }) {
    const [mediaPreview, setMediaPreview] = useState<string | null>(data.mediaUrl ? (Array.isArray(data.mediaUrl) ? data.mediaUrl[0] : data.mediaUrl) : null);
    const [showSongPicker, setShowSongPicker] = useState(false);
    const [appSongs, setAppSongs] = useState<any[]>([]);
    const [songSearchTerm, setSongSearchTerm] = useState('');
    const [hasFetchedSongs, setHasFetchedSongs] = useState(false);
    
    const [showCamera, setShowCamera] = useState(false);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isCameraSupported, setIsCameraSupported] = useState(false);

    const [songDuration, setSongDuration] = useState(0);
    const [isSnippetPlaying, setIsSnippetPlaying] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const snippetAudioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.songId]);

    useEffect(() => {
        if (showSongPicker && !hasFetchedSongs) {
            const q = query(collection(db, "songs"), orderBy("createdAt", "desc"));
            const unsub = onSnapshot(q, (snapshot) => {
                setAppSongs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                setHasFetchedSongs(true);
            });
            return () => unsub();
        }
    }, [showSongPicker, hasFetchedSongs]);

    const handleFileChange = async (file: File) => {
        // Reset errors and set processing state
        setUploadError('');
        setIsProcessing(true);

        // 1. Validate file type and size
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');

        if (!isImage && !isVideo) {
            setUploadError("Only images and videos are allowed.");
            setIsProcessing(false);
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            setUploadError(`File is too large. Max size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
            setIsProcessing(false);
            return;
        }

        // 2. Validate video duration if it's a video
        if (isVideo) {
            try {
                const duration = await new Promise<number>((resolve, reject) => {
                    const videoElement = document.createElement('video');
                    videoElement.preload = 'metadata';
                    videoElement.onloadedmetadata = () => {
                        window.URL.revokeObjectURL(videoElement.src);
                        resolve(videoElement.duration);
                    };
                    videoElement.onerror = () => reject('Could not read video file.');
                    videoElement.src = URL.createObjectURL(file);
                });

                if (duration > MAX_VIDEO_DURATION) {
                    setUploadError(`Video is too long. Max is ${MAX_VIDEO_DURATION / 60} minutes.`);
                    setIsProcessing(false);
                    return;
                }
            } catch (videoError) {
                setUploadError(String(videoError));
                setIsProcessing(false);
                return;
            }
        }

        // 3. Process the file (image compression)
        let processedFile = file;
        if (isImage) {
            try {
                processedFile = await imageCompression(file, { 
                    maxSizeMB: 0.5, 
                    maxWidthOrHeight: 1920, 
                    useWebWorker: true 
                });
            } catch (compressionError) {
                console.error("Image compression error: ", compressionError);
                setUploadError("Could not compress the image.");
                setIsProcessing(false);
                return;
            }
        }

        // 4. Create a temporary local URL for previewing
        const previewUrl = URL.createObjectURL(processedFile);

        // 5. Update local state to show the preview in this component
        setMediaPreview(previewUrl);

        // 6. Update parent state for the next steps
        // The `mediaUrl` MUST be an array for Step3 to correctly read it.
        // This was the source of the "b" text bug.
        const updatedData = {
            ...data,
            mediaFiles: [processedFile], // The raw file for the final upload
            mediaUrl: [previewUrl],      // The temporary URL for previews, wrapped in an array
            isVideo: isVideo
        };
        onDataChange(updatedData);

        // 7. Finish processing
        setIsProcessing(false);
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
                        const capturedFile = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
                        handleFileChange(capturedFile);
                    }
                }, 'image/jpeg');
            }
        }
        setShowCamera(false);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileChange(file);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragOver(true); };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragOver(false); };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFileChange(file);
        }
    };
    
    const removeMedia = () => {
        setMediaPreview(null);
        onDataChange({ ...data, mediaUrl: null, mediaFiles: [], isVideo: false });
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        onDataChange({ ...data, [e.target.name]: e.target.value });
    };
    
    const handleDateChange = (date: Date | undefined) => {
        onDataChange({ ...data, scheduleDate: date });
    }

    const handleSelectSong = (song: any) => {
        onDataChange({ ...data, song: { 
            id: song.id, 
            name: song.title, 
            artists: [song.artist], 
            album: song.album, 
            albumArt: song.albumArtUrl, 
            preview_url: song.audioUrl,
            snippetStart: 0, // Default snippet
            snippetEnd: 15
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

    const handleAudioMetadata = () => {
        if (snippetAudioRef.current) {
            setSongDuration(snippetAudioRef.current.duration);
        }
    };

    const toggleSnippetPreview = () => {
        if (!snippetAudioRef.current) return;
        if (isSnippetPlaying) {
            snippetAudioRef.current.pause();
        } else {
            snippetAudioRef.current.currentTime = data.song.snippetStart || 0;
            snippetAudioRef.current.play();
        }
        setIsSnippetPlaying(!isSnippetPlaying);
    };

    const handleSnippetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const startTime = parseFloat(e.target.value);
        onDataChange({ ...data, song: { ...data.song, snippetStart: startTime, snippetEnd: startTime + 15 } });
        if (snippetAudioRef.current) {
            snippetAudioRef.current.currentTime = startTime;
        }
    };

    const handleSnippetTimeUpdate = () => {
        if (snippetAudioRef.current && snippetAudioRef.current.currentTime >= (data.song.snippetStart || 0) + 15) {
            snippetAudioRef.current.pause();
            setIsSnippetPlaying(false);
        }
    };

    const songsToShow = songSearchTerm
        ? appSongs.filter(s => s.title?.toLowerCase().includes(songSearchTerm.toLowerCase()) || s.artist?.toLowerCase().includes(songSearchTerm.toLowerCase())).slice(0, 10)
        : appSongs.slice(0, 10);

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

            <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className={`p-4 border-2 border-dashed rounded-2xl text-center min-h-[200px] flex flex-col items-center justify-center ${isDragOver ? 'border-accent-cyan bg-accent-cyan/10' : 'border-gray-600'}`}>
                {isProcessing ? (
                    <div className="flex flex-col items-center gap-2"><Loader className="animate-spin text-accent-cyan"/><p className="text-sm text-accent-cyan">Processing...</p></div>
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
                        <p className="text-xs text-gray-500 mt-2">Max 50MB & 3 minutes</p>
                    </div>
                ) : (
                     <div className="relative group w-full h-full">
                        <div className="aspect-video w-full h-full">
                             {data.isVideo ? (
                                <video src={mediaPreview} className="w-full h-full object-contain rounded-lg" controls/>
                            ) : (
                                <img src={mediaPreview} alt="preview" className="w-full h-full object-contain rounded-lg" />
                            )}
                        </div>
                        <button type="button" onClick={removeMedia} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 z-10"><X size={16} /></button>
                    </div>
                )}
                <input type="file" ref={fileInputRef} onChange={handleFileInputChange} className="hidden" accept="image/*,video/*" />
                {uploadError && <p className="text-red-400 text-xs mt-2">{uploadError}</p>}
            </div>
            
             <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input type="text" name="location" className="w-full rounded-xl p-3 pl-10 bg-black/20 text-white border-2 border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-pink" placeholder="Add location..." value={data.location || ''} onChange={handleTextChange} />
                 <button type="button" onClick={handleGetLocation} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-accent-cyan" disabled={isFetchingLocation}>{isFetchingLocation ? <Loader size={20} className="animate-spin" /> : <Locate size={20} />}</button>
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
                    <Calendar mode="single" selected={data.scheduleDate} onSelect={handleDateChange} initialFocus disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))} />
                    </PopoverContent>
                </Popover>
            </div>

            <div className="mt-2">
                <button type="button" className="w-full btn-glass flex justify-between items-center" onClick={() => setShowSongPicker(v => !v)}>
                    <span>{data.song ? `Song: ${data.song.name}` : 'Add a Song (Optional)'}</span>
                    <MusicIcon size={16}/>
                </button>
                <motion.div initial={false} animate={{ height: showSongPicker ? 'auto' : 0, opacity: showSongPicker ? 1 : 0 }} className="overflow-hidden bg-black/20 rounded-b-lg">
                    <div className="p-2">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search songs..."
                                className="input-glass w-full pl-8 text-sm"
                                value={songSearchTerm}
                                onChange={(e) => setSongSearchTerm(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            />
                            <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                    </div>
                    <div className="p-2 max-h-48 overflow-y-auto">
                        {!hasFetchedSongs ? (
                           <div className="flex justify-center items-center p-4"><Loader className="animate-spin text-accent-cyan"/></div>
                        ) : songsToShow.length > 0 ? (
                            songsToShow.map(song => (
                                <div key={song.id} className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-accent-cyan/10" onClick={() => handleSelectSong(song)}>
                                    <img src={song.albumArtUrl} alt="album" className="w-10 h-10 rounded" />
                                    <div>
                                        <div className="font-bold text-sm text-accent-cyan">{song.title}</div>
                                        <div className="text-xs text-gray-400">{song.artist}</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-400 text-sm py-4">No songs found.</p>
                        )}
                    </div>
                </motion.div>
            </div>

            {data.song && !data.isVideo && (
                <div className="p-3 bg-black/20 rounded-lg mt-2">
                    <p className="text-sm font-bold text-accent-pink mb-2">Trim Song Snippet (15s)</p>
                    <div className="flex items-center gap-3">
                        <button onClick={toggleSnippetPreview} className="p-2 btn-glass">
                            {isSnippetPlaying ? <Pause size={18} /> : <Play size={18} />}
                        </button>
                        <div className='flex-1'>
                            <input
                                type="range"
                                min="0"
                                max={songDuration > 15 ? songDuration - 15 : 0}
                                step="0.1"
                                value={data.song.snippetStart || 0}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-thumb-pink"
                                onChange={handleSnippetChange}
                            />
                            <div className="flex justify-between text-xs font-mono text-gray-400 mt-1">
                                <span>{formatTime(data.song.snippetStart || 0)}</span>
                                <span>{formatTime(songDuration)}</span>
                            </div>
                        </div>
                    </div>
                    <audio
                        ref={snippetAudioRef}
                        src={data.song.preview_url}
                        onLoadedMetadata={handleAudioMetadata}
                        onTimeUpdate={handleSnippetTimeUpdate}
                        onEnded={() => setIsSnippetPlaying(false)}
                    />
                </div>
            )}
        </div>
    );
}