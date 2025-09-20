
"use client";
import React, { useRef, useState, useEffect } from "react";
import { getFirestore, collection, addDoc, serverTimestamp, getDoc, doc, query, onSnapshot, orderBy } from "firebase/firestore";
import { auth, app } from "@/utils/firebaseClient";
import { useRouter } from "next/navigation";
import { MapPin, Smile, UploadCloud, X, Camera, Zap, Radio } from "lucide-react";

const db = getFirestore(app);

async function uploadToCloudinary(file: File, onProgress?: (percent: number) => void): Promise<string | null> {
  const url = `https://api.cloudinary.com/v1_1/drrzvi2jp/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "flixtrend_unsigned");
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.responseText) {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status === 200 && data.secure_url) {
          resolve(data.secure_url);
        } else {
          reject(new Error(data.error?.message || "Upload failed"));
        }
      } else {
        reject(new Error("Upload failed with empty response"));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(formData);
  });
}

const backgroundColors = [
  '#ffffff', '#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff',
  '#a0c4ff', '#bdb2ff', '#ffc6ff', '#fffffc', '#f1f1f1', '#e0e0e0'
];

export default function CreatePostModal({ open, onClose, initialType = 'text' }: { open: boolean; onClose: () => void; initialType?: "text" | "media" | "poll" | "flash" | "camera" | "live" }) {
  const [type, setType] = useState<"text" | "media" | "poll" | "flash" | "camera" | "live">(initialType);
  const [content, setContent] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [location, setLocation] = useState("");
  const [mood, setMood] = useState("");
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  
  const [appSongs, setAppSongs] = useState<any[]>([]);
  const [selectedSong, setSelectedSong] = useState<any>(null);
  const [showSongPicker, setShowSongPicker] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    setType(initialType);
    if (initialType === 'camera' && open) {
        startCamera();
    } else {
        stopCamera();
    }
  }, [initialType, open]);

  useEffect(() => {
    if (type !== 'camera') {
        stopCamera();
    }
  }, [type]);

  const startCamera = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setCameraStream(stream);
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    } catch (err) {
        setError("Camera access was denied. Please enable it in your browser settings.");
        console.error("Camera error:", err);
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
        
        canvas.toBlob(blob => {
            if (blob) {
                const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
                setMediaFiles(prev => [...prev, file]);
                setMediaUrls(prev => [...prev, URL.createObjectURL(file)]);
                setType('media'); // Switch back to media view to show preview
            }
        }, 'image/jpeg');
    }
  };

  useEffect(() => {
    const q = query(collection(db, "songs"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
        setAppSongs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  // Fetch location when modal opens
  useEffect(() => {
    if (open && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Using a free reverse geocoding API. In a production app, you might want a more robust, keyed service.
          const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
          const data = await response.json();
          if (data.city && data.countryName) {
            setLocation(`${data.city}, ${data.countryName}`);
          }
        } catch (err) {
          console.error("Failed to fetch location name:", err);
        }
      }, (err) => {
        console.warn(`Location access denied: ${err.message}`);
      });
    }
  }, [open]);

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        const files = Array.from(e.target.files);
        setMediaFiles(prev => [...prev, ...files]);
        const urls = files.map(file => URL.createObjectURL(file));
        setMediaUrls(prev => [...prev, ...urls]);
    }
  };
  
  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaUrls(prev => prev.filter((_, i) => i !== index));
  };


  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setThumbnailFile(e.target.files[0]);
      setThumbnailUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handlePollOptionChange = (idx: number, value: string) => {
    setPollOptions((opts) => opts.map((opt, i) => (i === idx ? value : opt)));
  };

  const addPollOption = () => setPollOptions((opts) => [...opts, ""]);
  const removePollOption = (idx: number) => setPollOptions((opts) => opts.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setUploadProgress(null);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not logged in");
      
      let uploadedMediaUrls: string[] = [];
      if ((type === "media" || type === "flash") && mediaFiles.length > 0) {
          for (let i = 0; i < mediaFiles.length; i++) {
              const file = mediaFiles[i];
              setUploadProgress(Math.round(((i + 1) / mediaFiles.length) * 100));
              const url = await uploadToCloudinary(file);
              if (url) {
                  uploadedMediaUrls.push(url);
              }
          }
          if (uploadedMediaUrls.length === 0) throw new Error("Media upload failed");
      }

      let uploadedThumbnailUrl = null;
      if (type === 'media' && mediaFiles[0]?.type.startsWith('video') && thumbnailFile) {
        uploadedThumbnailUrl = await uploadToCloudinary(thumbnailFile);
        if (!uploadedThumbnailUrl) throw new Error("Thumbnail upload failed");
      }

      const profileSnap = await getDoc(doc(db, "users", user.uid));
      const profileData = profileSnap.exists() ? profileSnap.data() : {};

      const postHashtags = hashtags.split(',').map(h => h.trim().replace('#','')).filter(h => h);
      
      const songData = selectedSong ? {
        id: selectedSong.id,
        name: selectedSong.title,
        artists: [selectedSong.artist],
        album: selectedSong.album,
        albumArt: selectedSong.albumArtUrl,
        preview_url: selectedSong.audioUrl,
      } : null;

      const postData: any = {
        userId: user.uid,
        displayName: profileData.name || user.displayName,
        username: profileData.username,
        avatar_url: profileData.avatar_url,
        type: type === 'camera' ? 'media' : type,
        content: content,
        mediaUrl: uploadedMediaUrls.length > 0 ? (type === 'flash' ? uploadedMediaUrls[0] : uploadedMediaUrls) : null,
        thumbnailUrl: uploadedThumbnailUrl,
        hashtags: postHashtags,
        location: location,
        mood: mood,
        backgroundColor: type === 'text' ? backgroundColor : null,
        pollOptions: type === "poll" ? pollOptions.filter((opt) => opt.trim()) : null,
        createdAt: serverTimestamp(),
        publishAt: serverTimestamp(), // Removed schedule date for simplicity
        song: type === "flash" ? songData : null, // Only save song for flashes
      };

      if (type === "flash") {
        await addDoc(collection(db, "flashes"), {
          ...postData,
          caption: content,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
      } else {
        const collectionRef = collection(db, "posts");
        await addDoc(collectionRef, postData);
      }
      
      // Reset form
      setContent("");
      setMediaUrls([]);
      setMediaFiles([]);
      setPollOptions(["", ""]);
      setUploadProgress(null);
      setHashtags("");
      setLocation("");
      setMood("");
      setBackgroundColor("#ffffff");
      setThumbnailFile(null);
      setThumbnailUrl(null);
      setSelectedSong(null);
      setShowSongPicker(false);
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };
  
  const handleGoLive = () => {
      // Placeholder for now
      alert("Going Live! (UI/Logic to be built)");
      onClose();
  }

  const handleModalClose = () => {
    stopCamera();
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white dark:bg-card rounded-2xl p-6 w-full max-w-md relative animate-pop shadow-xl border border-gray-100 dark:border-accent-cyan/20 flex flex-col max-h-[90vh]">
        <button onClick={handleModalClose} className="absolute top-2 right-2 text-accent-pink text-2xl">&times;</button>
        <h2 className="text-xl font-headline font-bold mb-4 text-accent-cyan">Create Post</h2>
        <div className="flex gap-2 mb-4 flex-wrap">
          <button onClick={() => setType("text")} className={`px-3 py-1 rounded-full font-bold ${type === "text" ? "bg-accent-cyan text-primary" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}>Text</button>
          <button onClick={() => setType("media")} className={`px-3 py-1 rounded-full font-bold ${type === "media" ? "bg-accent-cyan text-primary" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}>Media</button>
          <button onClick={() => { setType("camera"); startCamera(); }} className={`px-3 py-1 rounded-full font-bold ${type === "camera" ? "bg-accent-cyan text-primary" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}>Camera</button>
          <button onClick={() => setType("flash")} className={`px-3 py-1 rounded-full font-bold ${type === "flash" ? "bg-accent-cyan text-primary" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}>Flash</button>
          <button onClick={() => setType("poll")} className={`px-3 py-1 rounded-full font-bold ${type === "poll" ? "bg-accent-cyan text-primary" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}>Poll</button>
          <button onClick={() => setType("live")} className={`px-3 py-1 rounded-full font-bold ${type === "live" ? "bg-accent-cyan text-primary" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}>Live</button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1 overflow-y-auto pr-2">
          {type === "text" && (
            <div className="flex flex-col gap-4 flex-1">
              <textarea 
                className="w-full rounded-xl p-3 bg-gray-100 dark:bg-black/40 text-gray-800 dark:text-white border-2 border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-pink flex-1 min-h-[120px]" 
                placeholder="What's on your mind?" 
                value={content} 
                onChange={e => setContent(e.target.value)} 
                required 
                style={{ backgroundColor: backgroundColor, color: backgroundColor === '#ffffff' ? '' : '#000000' }} 
              />
              <div className="flex flex-wrap gap-2">
                {backgroundColors.map(color => (
                  <button type="button" key={color} onClick={() => setBackgroundColor(color)} className="w-8 h-8 rounded-full border-2" style={{ backgroundColor: color, borderColor: backgroundColor === color ? 'var(--accent-pink)' : 'transparent' }} />
                ))}
              </div>
            </div>
          )}
          {(type === "media" || type === "flash") && (
            <>
              <textarea className="w-full rounded-xl p-3 bg-gray-100 dark:bg-black/40 text-gray-800 dark:text-white border-2 border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-pink" placeholder={type === 'flash' ? "Add a caption..." : "Say something..."} value={content} onChange={e => setContent(e.target.value)} />
              
               <div 
                    className="w-full p-6 border-2 border-dashed border-accent-cyan/50 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer hover:bg-accent-cyan/10"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <UploadCloud className="text-accent-cyan" size={40} />
                    <p className="mt-2 text-sm text-gray-400">
                        Drag & drop files or <span className="font-bold text-accent-cyan">browse</span>
                    </p>
                    <p className="text-xs text-gray-500">Supports images and videos</p>
                </div>

                <input 
                    type="file" 
                    accept="image/*,video/*" 
                    ref={fileInputRef} 
                    onChange={handleMediaChange} 
                    className="hidden" 
                    multiple={type !== 'flash'}
                />

                {mediaUrls.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-2">
                        {mediaUrls.map((url, index) => {
                            const file = mediaFiles[index];
                            return (
                                <div key={index} className="relative group">
                                    {file.type.startsWith("video") ? (
                                        <video src={url} className="w-full h-24 object-cover rounded-lg" />
                                    ) : (
                                        <img src={url} alt={`preview ${index}`} className="w-full h-24 object-cover rounded-lg" />
                                    )}
                                    <button 
                                        type="button" 
                                        onClick={() => removeMedia(index)}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </>
          )}

          {type === 'camera' && (
            <div className="flex flex-col items-center gap-4">
                <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
                    {cameraStream ? (
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            {error ? error : "Starting camera..."}
                        </div>
                    )}
                </div>
                <button type="button" className="btn-glass bg-accent-pink text-white w-20 h-20 rounded-full flex items-center justify-center" onClick={handleCapture} disabled={!cameraStream}>
                    <Zap size={32} />
                </button>
                <canvas ref={canvasRef} className="hidden"></canvas>
            </div>
          )}

          {type === 'live' && (
            <div className="flex flex-col items-center gap-4 text-center">
                <Radio className="text-red-500 animate-pulse" size={48} />
                <h3 className="text-xl font-bold text-white">You're about to go live!</h3>
                <p className="text-sm text-gray-400">Give your stream a title to let people know what's up.</p>
                <input
                    type="text"
                    className="input-glass w-full"
                    placeholder="Live Stream Title (e.g., Sunset Vibes, Q&A)"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
            </div>
          )}

          {type === 'media' && mediaFiles.length > 0 && mediaFiles[0].type.startsWith('video') && (
             <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-accent-cyan">Upload Thumbnail (Optional)</label>
                <input type="file" accept="image/*" onChange={handleThumbnailChange} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent-pink/20 file:text-accent-pink hover:file:bg-accent-pink/40" />
                {thumbnailUrl && <img src={thumbnailUrl} alt="thumbnail preview" className="w-full rounded-xl mt-2" />}
            </div>
          )}
          {type === "poll" && (
            <div className="flex flex-col gap-2">
              <input className="w-full rounded-xl p-3 bg-gray-100 dark:bg-black/40 text-gray-800 dark:text-white border-2 border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-pink" placeholder="Ask a question..." value={content} onChange={e => setContent(e.target.value)} required />
              {pollOptions.map((opt, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input className="flex-1 rounded-xl p-2 bg-gray-100 dark:bg-black/40 text-gray-800 dark:text-white border-2 border-accent-cyan focus:outline-none" placeholder={`Option ${idx + 1}`} value={opt} onChange={e => handlePollOptionChange(idx, e.target.value)} required />
                  {pollOptions.length > 2 && <button type="button" onClick={() => removePollOption(idx)} className="text-accent-pink text-xl">&times;</button>}
                </div>
              ))}
              <button type="button" onClick={addPollOption} className="text-xs text-accent-cyan mt-1">+ Add Option</button>
            </div>
          )}

            {(type === 'text' || type === 'media') && (
                <>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input type="text" className="w-full rounded-xl p-3 pl-10 bg-gray-100 dark:bg-black/40 text-gray-800 dark:text-white border-2 border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-pink" placeholder="Add location..." value={location} onChange={e => setLocation(e.target.value)} />
                    </div>
                     <div className="relative">
                        <Smile className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input type="text" className="w-full rounded-xl p-3 pl-10 bg-gray-100 dark:bg-black/40 text-gray-800 dark:text-white border-2 border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-pink" placeholder="How are you feeling?" value={mood} onChange={e => setMood(e.target.value)} />
                    </div>
                </>
            )}

           <input type="text" className="w-full rounded-xl p-3 bg-gray-100 dark:bg-black/40 text-gray-800 dark:text-white border-2 border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-pink" placeholder="Add hashtags, e.g., #tech, #music" value={hashtags} onChange={e => setHashtags(e.target.value)} />

          {type === 'flash' && (
            <>
              <button
                type="button"
                className="w-full px-4 py-2 rounded-full bg-green-500 text-white font-bold mb-2 hover:bg-green-600 transition-all"
                onClick={() => setShowSongPicker(v => !v)}
              >
                {selectedSong ? `Song: ${selectedSong.title}` : (showSongPicker ? 'Cancel' : 'Add Song')}
              </button>
              
              {showSongPicker && !selectedSong && (
                <div className="my-4 p-2 bg-gray-100 dark:bg-black/40 rounded-lg">
                  {appSongs.length > 0 ? (
                    <div className="max-h-48 overflow-y-auto bg-black/10 rounded-xl p-2">
                      {appSongs.map(song => (
                        <div key={song.id} className={`flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-accent-cyan/10`}
                          onClick={() => {
                            setSelectedSong(song);
                            setShowSongPicker(false);
                          }}>
                          <img src={song.albumArtUrl} alt="album" className="w-10 h-10 rounded" />
                          <div>
                            <div className="font-bold text-accent-cyan">{song.title}</div>
                            <div className="text-xs text-gray-400">{song.artist}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-400 p-4">No songs have been uploaded to the app yet.</p>
                  )}
                </div>
              )}

              {selectedSong && (
                <div className="mb-2 p-3 rounded-xl bg-accent-cyan/10 flex items-center gap-4">
                  <img src={selectedSong.albumArtUrl} alt="album" className="w-12 h-12 rounded" />
                  <div>
                    <div className="font-bold text-accent-cyan text-base">{selectedSong.title}</div>
                    <div className="text-xs text-gray-400 mb-1">{selectedSong.artist}</div>
                  </div>
                  <button type="button" className="ml-auto px-2 py-1 rounded bg-red-200 text-red-700 text-xs font-bold" onClick={() => setSelectedSong(null)}>Remove</button>
                </div>
              )}
            </>
          )}
          
          <div className="mt-auto">
            {type === 'live' ? (
                <button type="button" onClick={handleGoLive} className="px-8 py-3 w-full rounded-full bg-red-500 text-white font-bold text-lg shadow-fab-glow hover:scale-105 hover:shadow-lg transition-all duration-200 disabled:opacity-60" disabled={loading || !content.trim()}>
                    Go Live Now
                </button>
            ) : (
                <button type="submit" className="px-8 py-3 w-full rounded-full bg-accent-cyan text-primary font-bold text-lg shadow-fab-glow hover:scale-105 hover:shadow-lg transition-all duration-200 disabled:opacity-60" disabled={loading || (uploadProgress !== null && uploadProgress < 100)}>
                    {loading ? (uploadProgress !== null ? `Uploading... ${uploadProgress}%` : "Submitting...") : "Submit"}
                </button>
            )}
            {error && <div className="text-red-400 text-center animate-bounce mt-2">{error}</div>}
          </div>
        </form>
      </div>
    </div>
  );
}
