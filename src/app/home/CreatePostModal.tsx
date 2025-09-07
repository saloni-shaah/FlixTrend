
"use client";
import React, { useRef, useState, useEffect } from "react";
import { getFirestore, collection, addDoc, serverTimestamp, getDoc, doc, query, onSnapshot, orderBy } from "firebase/firestore";
import { auth } from "@/utils/firebaseClient";
import { useRouter } from "next/navigation";

const db = getFirestore();

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

export default function CreatePostModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [type, setType] = useState<"text" | "media" | "audio" | "poll" | "flash">("text");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [scheduleDate, setScheduleDate] = useState<Date | null>(null);
  
  const [appSongs, setAppSongs] = useState<any[]>([]);
  const [selectedSong, setSelectedSong] = useState<any>(null);
  const [showSongPicker, setShowSongPicker] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "songs"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
        setAppSongs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);


  useEffect(() => {
    if (mediaFile && mediaFile.type.startsWith('video')) {
       // logic for video thumbnail can be added here
    }
  }, [mediaFile]);

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMediaFile(e.target.files[0]);
      setMediaUrl(URL.createObjectURL(e.target.files[0]));
    }
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
      
      let uploadedMediaUrl = null;
      if ((type === "media" || type === "flash" || type === "audio") && mediaFile) {
        uploadedMediaUrl = await uploadToCloudinary(mediaFile, (p) => setUploadProgress(p));
        if (!uploadedMediaUrl) throw new Error("Media upload failed");
      }

      let uploadedThumbnailUrl = null;
      if (type === "media" && mediaFile?.type.startsWith('video') && thumbnailFile) {
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
        type,
        content: content,
        mediaUrl: uploadedMediaUrl,
        thumbnailUrl: uploadedThumbnailUrl,
        hashtags: postHashtags,
        backgroundColor: type === 'text' ? backgroundColor : null,
        pollOptions: type === "poll" ? pollOptions.filter((opt) => opt.trim()) : null,
        createdAt: serverTimestamp(),
        publishAt: scheduleDate || serverTimestamp(),
        song: songData,
      };

      if (type === "flash") {
        await addDoc(collection(db, "flashes"), {
          ...postData,
          caption: content,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
      } else {
        const collectionRef = scheduleDate ? collection(db, "scheduledPosts") : collection(db, "posts");
        await addDoc(collectionRef, postData);
      }
      
      // Reset form
      setContent("");
      setMediaUrl(null);
      setMediaFile(null);
      setPollOptions(["", ""]);
      setUploadProgress(null);
      setHashtags("");
      setBackgroundColor("#ffffff");
      setThumbnailFile(null);
      setThumbnailUrl(null);
      setScheduleDate(null);
      setSelectedSong(null);
      setShowSongPicker(false);
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white dark:bg-card rounded-2xl p-6 w-full max-w-md relative animate-pop shadow-xl border border-gray-100 dark:border-accent-cyan/20 flex flex-col max-h-[90vh]">
        <button onClick={onClose} className="absolute top-2 right-2 text-accent-pink text-2xl">&times;</button>
        <h2 className="text-xl font-headline font-bold mb-4 text-accent-cyan">Create Post</h2>
        <div className="flex gap-2 mb-4 flex-wrap">
          <button onClick={() => setType("text")} className={`px-3 py-1 rounded-full font-bold ${type === "text" ? "bg-accent-cyan text-primary" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}>Text</button>
          <button onClick={() => setType("media")} className={`px-3 py-1 rounded-full font-bold ${type === "media" ? "bg-accent-cyan text-primary" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}>Media</button>
          <button onClick={() => setType("audio")} className={`px-3 py-1 rounded-full font-bold ${type === "audio" ? "bg-accent-cyan text-primary" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}>Audio</button>
          <button onClick={() => setType("flash")} className={`px-3 py-1 rounded-full font-bold ${type === "flash" ? "bg-accent-cyan text-primary" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}>Flash</button>
          <button onClick={() => setType("poll")} className={`px-3 py-1 rounded-full font-bold ${type === "poll" ? "bg-accent-cyan text-primary" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}>Poll</button>
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
              <input type="file" accept="image/*,video/*" ref={fileInputRef} onChange={handleMediaChange} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent-cyan/20 file:text-accent-cyan hover:file:bg-accent-cyan/40" required />
              {mediaUrl && (
                <div className="mt-2">
                  {mediaFile?.type.startsWith("video") ? <video src={mediaUrl} controls className="w-full rounded-xl" /> : <img src={mediaUrl} alt="preview" className="w-full rounded-xl" />}
                </div>
              )}
            </>
          )}
          {type === "audio" && (
            <>
              <textarea className="w-full rounded-xl p-3 bg-gray-100 dark:bg-black/40 text-gray-800 dark:text-white border-2 border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-pink" placeholder="Describe your audio..." value={content} onChange={e => setContent(e.target.value)} />
              <input type="file" accept="audio/*" ref={fileInputRef} onChange={handleMediaChange} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent-cyan/20 file:text-accent-cyan hover:file:bg-accent-cyan/40" required />
              {mediaUrl && mediaFile?.type.startsWith("audio") && <div className="mt-2"><audio src={mediaUrl} controls className="w-full" /></div>}
            </>
          )}
          {type === 'media' && mediaFile?.type.startsWith('video') && (
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

           <input type="text" className="w-full rounded-xl p-3 bg-gray-100 dark:bg-black/40 text-gray-800 dark:text-white border-2 border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-pink" placeholder="Add hashtags, e.g., #tech, #music" value={hashtags} onChange={e => setHashtags(e.target.value)} />

          <div className="flex items-center gap-2">
            {/* DatePicker removed */}
          </div>

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
          
          <div className="mt-auto">
            <button type="submit" className="px-8 py-3 w-full rounded-full bg-accent-cyan text-primary font-bold text-lg shadow-fab-glow hover:scale-105 hover:shadow-lg transition-all duration-200 disabled:opacity-60" disabled={loading || (uploadProgress !== null && uploadProgress < 100)}>
              {loading ? (uploadProgress !== null ? `Uploading... ${uploadProgress}%` : "Submitting...") : (scheduleDate ? "Schedule" : "Submit")}
            </button>
            {error && <div className="text-red-400 text-center animate-bounce mt-2">{error}</div>}
          </div>
        </form>
      </div>
    </div>
  );
}

    
