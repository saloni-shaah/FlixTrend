
"use client";
import React, { useState, useRef, useEffect } from 'react';
import { X, UploadCloud, Music as MusicIcon, MapPin, Smile, Camera, Image as ImageIcon, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { getFirestore, collection, onSnapshot, query, orderBy, getDoc, doc } from 'firebase/firestore';
import { app } from '@/utils/firebaseClient';
import { remixImageAction } from '@/app/actions';
import { Wand2, Loader } from 'lucide-react';


const db = getFirestore(app);

export function FlashPostForm({ data, onDataChange }: { data: any, onDataChange: (data: any) => void }) {
    const [mediaFile, setMediaFile] = useState<File | null>(data.mediaFiles?.[0] || null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(data.mediaPreviews?.[0] || null);
    const [showSongPicker, setShowSongPicker] = useState(false);
    const [appSongs, setAppSongs] = useState<any[]>([]);
    
    const [showCamera, setShowCamera] = useState(false);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const [capturedImageDataUrl, setCapturedImageDataUrl] = useState<string | null>(null);
    const [isRemixing, setIsRemixing] = useState(false);
    const [remixError, setRemixError] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

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
            setRemixError("Camera access denied.");
        }
    };
    
    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
    };
    
    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            
            const dataUrl = canvas.toDataURL('image/jpeg');
            setCapturedImageDataUrl(dataUrl);
            stopCamera();
            setShowCamera(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const url = URL.createObjectURL(file);
            setMediaFile(file);
            setMediaPreview(url);
            onDataChange({ ...data, mediaFiles: [file], mediaPreviews: [url] });
            setCapturedImageDataUrl(null); // Clear any captured image
        }
    };
    
    const removeMedia = () => {
        setMediaFile(null);
        setMediaPreview(null);
        setCapturedImageDataUrl(null);
        onDataChange({ ...data, mediaFiles: [], mediaPreviews: [] });
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
    
    const handleRemix = async (style: string) => {
      if (!capturedImageDataUrl) return;
      setIsRemixing(true);
      setRemixError("");
      try {
          const result = await remixImageAction({ photoDataUri: capturedImageDataUrl, prompt: `Convert this image into ${style} style.` });
          if(result.success) {
              setCapturedImageDataUrl(result.success.remixedPhotoDataUri);
          } else {
              throw new Error(result.failure || "Remix failed.");
          }
      } catch (err: any) {
          setRemixError(err.message);
      }
      setIsRemixing(false);
    };
    
    const confirmRemixedImage = () => {
        if (capturedImageDataUrl) {
            fetch(capturedImageDataUrl)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], `remixed-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
                    handleFileChange({ target: { files: [file] } } as any);
                });
        }
    };
    
    if (capturedImageDataUrl) {
        return (
            <div className="flex flex-col items-center gap-4">
                <h3 className="font-bold text-accent-purple flex items-center gap-2"><Wand2/> AI Remix Studio</h3>
                <div className="relative w-full max-w-sm aspect-[4/5] rounded-lg overflow-hidden border-2 border-accent-purple">
                    <img src={capturedImageDataUrl} alt="Captured preview" className="w-full h-full object-cover" />
                    {isRemixing && (
                         <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                            <Loader className="animate-spin text-accent-purple" size={48} />
                        </div>
                    )}
                </div>
                {remixError && <p className="text-red-400 text-sm">{remixError}</p>}
                <div className="flex flex-wrap gap-2 justify-center">
                    <button type="button" className="btn-glass text-xs" onClick={() => handleRemix('anime')} disabled={isRemixing}>Anime</button>
                    <button type="button" className="btn-glass text-xs" onClick={() => handleRemix('cartoon')} disabled={isRemixing}>Cartoon</button>
                    <button type="button" className="btn-glass text-xs" onClick={() => handleRemix('vintage film')} disabled={isRemixing}>Vintage</button>
                    <button type="button" className="btn-glass text-xs" onClick={() => handleRemix('neon punk')} disabled={isRemixing}>Neon</button>
                </div>
                 <div className="flex w-full justify-between mt-4">
                    <button type="button" className="text-sm text-gray-400 hover:underline" onClick={() => { setCapturedImageDataUrl(null); setShowCamera(true); }}>Retake</button>
                    <button type="button" className="btn-glass bg-green-500" onClick={confirmRemixedImage}>Confirm Image</button>
                </div>
            </div>
        )
    }
    
    if (showCamera) {
        return (
             <div className="flex flex-col items-center gap-4">
                <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
                    {cameraStream ? (
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            {remixError ? remixError : "Starting camera..."}
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
            <textarea
                name="caption"
                className="input-glass w-full rounded-2xl"
                placeholder="Add a caption..."
                value={data.caption || ''}
                onChange={handleTextChange}
            />

            <div className="p-4 border-2 border-dashed border-accent-cyan/30 rounded-2xl text-center min-h-[200px] flex flex-col items-center justify-center">
                {!mediaPreview ? (
                    <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                        <button type="button" className="btn-glass flex items-center justify-center gap-2" onClick={() => fileInputRef.current?.click()}>
                            <ImageIcon /> Gallery
                        </button>
                        <button type="button" className="btn-glass flex items-center justify-center gap-2" onClick={() => setShowCamera(true)}>
                            <Camera /> Camera
                        </button>
                    </div>
                ) : (
                     <div className="relative group aspect-video">
                        {mediaFile?.type.startsWith("video") ? (
                            <video src={mediaPreview} className="w-full h-full object-contain rounded-lg" />
                        ) : (
                            <img src={mediaPreview} alt="preview" className="w-full h-full object-contain rounded-lg" />
                        )}
                        <button type="button" onClick={removeMedia} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
                            <X size={16} />
                        </button>
                    </div>
                )}
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*" />
            </div>
            
             <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input type="text" name="location" className="w-full rounded-xl p-3 pl-10 bg-black/20 text-white border-2 border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-pink" placeholder="Add location..." value={data.location || ''} onChange={handleTextChange} />
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
