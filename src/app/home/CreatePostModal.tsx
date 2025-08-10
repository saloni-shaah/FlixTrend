"use client";
import React, { useRef, useState } from "react";
import { getFirestore, collection, addDoc, serverTimestamp, getDoc, doc } from "firebase/firestore";
import { auth } from "@/utils/firebaseClient";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const db = getFirestore();

async function uploadToCloudinary(file: File, onProgress?: (percent: number) => void): Promise<string | null> {
  const url = `https://api.cloudinary.com/v1_1/drrzvi2jp/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "flixtrend_unsigned"); // Use your new preset name
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      const data = JSON.parse(xhr.responseText);
      if (xhr.status === 200 && data.secure_url) {
        resolve(data.secure_url);
      } else {
        reject(new Error(data.error?.message || "Upload failed"));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(formData);
  });
}

const spotifyClientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
const spotifyRedirectUri = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI;
const spotifyScopes = [
  'user-read-private',
  'user-read-email',
  'user-read-playback-state',
  'user-modify-playback-state',
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-library-read',
  'user-library-modify',
  'user-read-currently-playing',
  'user-read-recently-played',
  'user-top-read',
  'streaming',
].join(' ');
function getSpotifyAuthUrl() {
  const params = new URLSearchParams({
    client_id: spotifyClientId || '',
    response_type: 'code',
    redirect_uri: spotifyRedirectUri || '',
    scope: spotifyScopes,
    show_dialog: 'true',
  });
  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export default function CreatePostModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [type, setType] = useState<"text" | "media" | "poll" | "flash">("text");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null);
  const [songSearch, setSongSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedSong, setSelectedSong] = useState<any>(null);
  const [pendingSong, setPendingSong] = useState<any>(null);
  const [trimSong, setTrimSong] = useState(false);
  const [trimDuration, setTrimDuration] = useState<number>(5); // default 5s
  const [showSongSearch, setShowSongSearch] = useState(false);

  // On mount, fetch a Spotify token using client credentials
  useEffect(() => {
    fetch('/api/spotify-token')
      .then(res => res.json())
      .then(data => {
        if (data.access_token) setSpotifyToken(data.access_token);
      });
  }, []);

  // Song search handler
  async function handleSongSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!spotifyToken || !songSearch.trim()) return;
    const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(songSearch)}&type=track&limit=10`, {
      headers: { Authorization: `Bearer ${spotifyToken}` }
    });
    const data = await res.json();
    setSearchResults(data.tracks?.items || []);
  }

  // When a video is uploaded, set trimDuration to its length (max 30s)
  useEffect(() => {
    if (mediaFile && mediaFile.type.startsWith('video')) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        let duration = Math.round(video.duration);
        if (duration > 30) duration = 30;
        setTrimDuration(duration);
      };
      video.src = URL.createObjectURL(mediaFile);
    }
  }, [mediaFile]);

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMediaFile(e.target.files[0]);
      setMediaUrl(URL.createObjectURL(e.target.files[0]));
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
      let uploadedUrl = null;
      if ((type === "media" || type === "flash") && mediaFile) {
        uploadedUrl = await uploadToCloudinary(mediaFile, setUploadProgress);
        if (!uploadedUrl) throw new Error("Media upload failed");
      }
      // Fetch user profile for displayName and username
      let displayName = user.displayName || "";
      let username = "";
      let avatar_url = "";
      try {
        const profileSnap = await getDoc(doc(db, "users", user.uid));
        if (profileSnap.exists()) {
          const profileData = profileSnap.data();
          displayName = profileData.name || displayName;
          username = profileData.username || "";
          avatar_url = profileData.avatar_url || "";
        }
      } catch {}
      if (type === "flash") {
        await addDoc(collection(db, "flashes"), {
          userId: user.uid,
          displayName,
          username,
          avatar_url,
          mediaUrl: uploadedUrl,
          caption: content,
          createdAt: serverTimestamp(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          song: selectedSong ? {
            id: selectedSong.id,
            name: selectedSong.name,
            artists: selectedSong.artists.map((a: any) => a.name),
            album: selectedSong.album.name,
            albumArt: selectedSong.album.images[0]?.url,
            preview_url: selectedSong.preview_url,
            external_url: selectedSong.external_urls.spotify,
            trim: trimSong,
            trimDuration: trimSong ? trimDuration : null,
          } : null,
        });
      } else {
        const postData: any = {
          userId: user.uid,
          displayName,
          username,
          avatar_url,
          type,
          content: type === "text" ? content : type === "media" ? content : "",
          mediaUrl: uploadedUrl || null,
          pollOptions: type === "poll" ? pollOptions.filter((opt) => opt.trim()) : null,
          createdAt: serverTimestamp(),
          song: selectedSong ? {
            id: selectedSong.id,
            name: selectedSong.name,
            artists: selectedSong.artists.map((a: any) => a.name),
            album: selectedSong.album.name,
            albumArt: selectedSong.album.images[0]?.url,
            preview_url: selectedSong.preview_url,
            external_url: selectedSong.external_urls.spotify,
            trim: trimSong,
            trimDuration: trimSong ? trimDuration : null,
          } : null,
        };
        await addDoc(collection(db, "posts"), postData);
      }
      setContent("");
      setMediaUrl(null);
      setMediaFile(null);
      setPollOptions(["", ""]);
      setUploadProgress(null);
      setSelectedSong(null);
      setShowSongSearch(false);
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white dark:bg-card rounded-2xl p-6 w-full max-w-md relative animate-pop shadow-xl border border-gray-100 dark:border-accent-cyan/20">
        <button onClick={onClose} className="absolute top-2 right-2 text-accent-pink text-2xl">&times;</button>
        <h2 className="text-xl font-headline font-bold mb-4 text-accent-cyan">Create Post</h2>
        <div className="flex gap-2 mb-4">
          <button onClick={() => setType("text")}
            className={`px-3 py-1 rounded-full font-bold ${type === "text" ? "bg-accent-cyan text-primary" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}>Text</button>
          <button onClick={() => setType("media")}
            className={`px-3 py-1 rounded-full font-bold ${type === "media" ? "bg-accent-cyan text-primary" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}>Photo/Video</button>
          <button onClick={() => setType("flash")}
            className={`px-3 py-1 rounded-full font-bold ${type === "flash" ? "bg-accent-cyan text-primary" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}>Flash</button>
          <button onClick={() => setType("poll")}
            className={`px-3 py-1 rounded-full font-bold ${type === "poll" ? "bg-accent-cyan text-primary" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}>Poll</button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Show selected song confirmation above submit button */}
          {selectedSong && (
            <div className="mb-2 p-3 rounded-xl bg-accent-cyan/10 flex items-center gap-4">
              <img src={selectedSong.album.images[1]?.url || selectedSong.album.images[0]?.url} alt="album" className="w-12 h-12 rounded" />
              <div>
                <div className="font-bold text-accent-cyan text-base">{selectedSong.name}</div>
                <div className="text-xs text-gray-400 mb-1">{selectedSong.artists.map((a: any) => a.name).join(", ")}</div>
                <a href={selectedSong.external_urls.spotify} target="_blank" rel="noopener noreferrer" className="text-green-500 underline text-xs">Open in Spotify</a>
              </div>
              <button className="ml-auto px-2 py-1 rounded bg-red-200 text-red-700 text-xs font-bold" onClick={() => setSelectedSong(null)}>Remove</button>
            </div>
          )}
          <button
            type="submit"
            className="px-8 py-3 rounded-full bg-accent-cyan text-primary font-bold text-lg shadow-fab-glow hover:scale-105 hover:shadow-lg transition-all duration-200 disabled:opacity-60 mb-2"
            disabled={loading || ((type === "media" || type === "flash") && uploadProgress !== null && uploadProgress < 100)}
          >
            {loading ? (uploadProgress !== null ? `Uploading... ${uploadProgress}%` : "Submitting...") : "Submit"}
          </button>
          {error && <div className="text-red-400 text-center animate-bounce mt-2">{error}</div>}
          {type === "text" && (
            <textarea
              className="w-full rounded-xl p-3 bg-gray-100 dark:bg-black/40 text-gray-800 dark:text-white border-2 border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-pink"
              placeholder="What's on your mind?"
              value={content}
              onChange={e => setContent(e.target.value)}
              required
            />
          )}
          {type === "media" && (
            <>
              <textarea
                className="w-full rounded-xl p-3 bg-gray-100 dark:bg-black/40 text-gray-800 dark:text-white border-2 border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-pink"
                placeholder="Say something about your photo/video..."
                value={content}
                onChange={e => setContent(e.target.value)}
              />
              {/* Add Song Button */}
              <button
                type="button"
                className="w-full px-4 py-2 rounded-full bg-green-500 text-white font-bold mb-2 hover:bg-green-600 transition-all"
                onClick={() => setShowSongSearch(v => !v)}
              >
                {showSongSearch ? 'Hide Song Search' : 'Add Song'}
              </button>
              {/* Spotify Song Search & Attach for media (toggleable) */}
              {spotifyToken && showSongSearch && (
                <div className="my-4">
                  <form onSubmit={handleSongSearch} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      className="flex-1 rounded-full px-4 py-2 border border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-cyan"
                      placeholder="Search for a song on Spotify..."
                      value={songSearch}
                      onChange={e => setSongSearch(e.target.value)}
                    />
                    <button type="submit" className="px-4 py-2 rounded-full bg-green-500 text-white font-bold hover:bg-green-600 transition-all">Search</button>
                  </form>
                  {searchResults.length > 0 && (
                    <div className="max-h-48 overflow-y-auto bg-black/10 rounded-xl p-2">
                      {searchResults.map(track => (
                        <div key={track.id} className={`flex items-center gap-3 p-2 rounded cursor-pointer ${pendingSong && pendingSong.id === track.id ? 'bg-accent-cyan/20' : 'hover:bg-accent-cyan/10'}`}
                          onClick={() => setPendingSong(track)}>
                          <img src={track.album.images[2]?.url || track.album.images[0]?.url} alt="album" className="w-10 h-10 rounded" />
                          <div className="flex-1">
                            <div className="font-bold text-accent-cyan">{track.name}</div>
                            <div className="text-xs text-gray-400">{track.artists.map((a: any) => a.name).join(", ")}</div>
                          </div>
                          {track.preview_url && <audio controls src={track.preview_url} className="w-24" />}
                          {pendingSong && pendingSong.id === track.id ? (
                            <button type="button" className="ml-2 px-3 py-1 rounded-full bg-accent-cyan text-primary font-bold text-xs" onClick={e => { e.stopPropagation(); setSelectedSong(track); setPendingSong(null); }}>Add this song</button>
                          ) : selectedSong && selectedSong.id === track.id ? (
                            <span className="ml-2 text-green-500 font-bold">Added!</span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedSong && (
                    <div className="mt-4 p-3 rounded-xl bg-accent-cyan/10 flex items-center gap-4">
                      <img src={selectedSong.album.images[1]?.url || selectedSong.album.images[0]?.url} alt="album" className="w-16 h-16 rounded" />
                      <div>
                        <div className="font-bold text-accent-cyan text-lg">{selectedSong.name}</div>
                        <div className="text-xs text-gray-400 mb-1">{selectedSong.artists.map((a: any) => a.name).join(", ")}</div>
                        <a href={selectedSong.external_urls.spotify} target="_blank" rel="noopener noreferrer" className="text-green-500 underline text-xs">Open in Spotify</a>
                        {selectedSong.preview_url && (
                          <audio
                            controls
                            src={selectedSong.preview_url}
                            className="w-32 mt-2"
                            // If trimSong is enabled, only play up to trimDuration seconds
                            onTimeUpdate={e => {
                              if (trimSong && e.currentTarget.currentTime > trimDuration) {
                                e.currentTarget.pause();
                                e.currentTarget.currentTime = 0;
                              }
                            }}
                          />
                        )}
                      </div>
                      <button className="ml-auto px-2 py-1 rounded bg-red-200 text-red-700 text-xs font-bold" onClick={() => setSelectedSong(null)}>Remove</button>
                    </div>
                  )}
                  {selectedSong && mediaFile && mediaFile.type.startsWith('video') && (
                    <div className="mt-2 flex items-center gap-2">
                      <label className="text-xs text-accent-cyan font-bold flex items-center gap-1">
                        <input type="checkbox" checked={trimSong} onChange={e => setTrimSong(e.target.checked)} />
                        Trim song to match video duration ({trimDuration}s)
                      </label>
                    </div>
                  )}
                </div>
              )}
              <input
                type="file"
                accept="image/*,video/*"
                ref={fileInputRef}
                onChange={handleMediaChange}
                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent-cyan/20 file:text-accent-cyan hover:file:bg-accent-cyan/40"
                required
              />
              {mediaUrl && (
                <div className="mt-2">
                  {mediaFile?.type.startsWith("video") ? (
                    <video src={mediaUrl} controls className="w-full rounded-xl" />
                  ) : (
                    <img src={mediaUrl} alt="preview" className="w-full rounded-xl" />
                  )}
                </div>
              )}
              {uploadProgress !== null && (
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-accent-cyan h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}
            </>
          )}
          {type === "flash" && (
            <>
              <textarea
                className="w-full rounded-xl p-3 bg-gray-100 dark:bg-black/40 text-gray-800 dark:text-white border-2 border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-pink"
                placeholder="Add a caption for your flash..."
                value={content}
                onChange={e => setContent(e.target.value)}
                required
              />
              {/* Add Song Button */}
              <button
                type="button"
                className="w-full px-4 py-2 rounded-full bg-green-500 text-white font-bold mb-2 hover:bg-green-600 transition-all"
                onClick={() => setShowSongSearch(v => !v)}
              >
                {showSongSearch ? 'Hide Song Search' : 'Add Song'}
              </button>
              {/* Spotify Song Search & Attach for flash (toggleable) */}
              {spotifyToken && showSongSearch && (
                <div className="my-4">
                  <form onSubmit={handleSongSearch} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      className="flex-1 rounded-full px-4 py-2 border border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-cyan"
                      placeholder="Search for a song on Spotify..."
                      value={songSearch}
                      onChange={e => setSongSearch(e.target.value)}
                    />
                    <button type="submit" className="px-4 py-2 rounded-full bg-green-500 text-white font-bold hover:bg-green-600 transition-all">Search</button>
                  </form>
                  {searchResults.length > 0 && (
                    <div className="max-h-48 overflow-y-auto bg-black/10 rounded-xl p-2">
                      {searchResults.map(track => (
                        <div key={track.id} className={`flex items-center gap-3 p-2 rounded cursor-pointer ${pendingSong && pendingSong.id === track.id ? 'bg-accent-cyan/20' : 'hover:bg-accent-cyan/10'}`}
                          onClick={() => setPendingSong(track)}>
                          <img src={track.album.images[2]?.url || track.album.images[0]?.url} alt="album" className="w-10 h-10 rounded" />
                          <div className="flex-1">
                            <div className="font-bold text-accent-cyan">{track.name}</div>
                            <div className="text-xs text-gray-400">{track.artists.map((a: any) => a.name).join(", ")}</div>
                          </div>
                          {track.preview_url && <audio controls src={track.preview_url} className="w-24" />}
                          {pendingSong && pendingSong.id === track.id ? (
                            <button type="button" className="ml-2 px-3 py-1 rounded-full bg-accent-cyan text-primary font-bold text-xs" onClick={e => { e.stopPropagation(); setSelectedSong(track); setPendingSong(null); }}>Add this song</button>
                          ) : selectedSong && selectedSong.id === track.id ? (
                            <span className="ml-2 text-green-500 font-bold">Added!</span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedSong && (
                    <div className="mt-4 p-3 rounded-xl bg-accent-cyan/10 flex items-center gap-4">
                      <img src={selectedSong.album.images[1]?.url || selectedSong.album.images[0]?.url} alt="album" className="w-16 h-16 rounded" />
                      <div>
                        <div className="font-bold text-accent-cyan text-lg">{selectedSong.name}</div>
                        <div className="text-xs text-gray-400 mb-1">{selectedSong.artists.map((a: any) => a.name).join(", ")}</div>
                        <a href={selectedSong.external_urls.spotify} target="_blank" rel="noopener noreferrer" className="text-green-500 underline text-xs">Open in Spotify</a>
                        {selectedSong.preview_url && (
                          <audio
                            controls
                            src={selectedSong.preview_url}
                            className="w-32 mt-2"
                            // If trimSong is enabled, only play up to trimDuration seconds
                            onTimeUpdate={e => {
                              if (trimSong && e.currentTarget.currentTime > trimDuration) {
                                e.currentTarget.pause();
                                e.currentTarget.currentTime = 0;
                              }
                            }}
                          />
                        )}
                      </div>
                      <button className="ml-auto px-2 py-1 rounded bg-red-200 text-red-700 text-xs font-bold" onClick={() => setSelectedSong(null)}>Remove</button>
                    </div>
                  )}
                  {selectedSong && mediaFile && mediaFile.type.startsWith('video') && (
                    <div className="mt-2 flex items-center gap-2">
                      <label className="text-xs text-accent-cyan font-bold flex items-center gap-1">
                        <input type="checkbox" checked={trimSong} onChange={e => setTrimSong(e.target.checked)} />
                        Trim song to match video duration ({trimDuration}s)
                      </label>
                    </div>
                  )}
                </div>
              )}
              <input
                type="file"
                accept="image/*,video/*"
                ref={fileInputRef}
                onChange={handleMediaChange}
                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent-cyan/20 file:text-accent-cyan hover:file:bg-accent-cyan/40"
                required
              />
              {mediaUrl && (
                <div className="mt-2">
                  {mediaFile?.type.startsWith("video") ? (
                    <video src={mediaUrl} controls className="w-full rounded-xl" />
                  ) : (
                    <img src={mediaUrl} alt="preview" className="w-full rounded-xl" />
                  )}
                </div>
              )}
              {uploadProgress !== null && (
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-accent-cyan h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}
            </>
          )}
          {type === "poll" && (
            <div className="flex flex-col gap-2">
              <input
                className="w-full rounded-xl p-3 bg-gray-100 dark:bg-black/40 text-gray-800 dark:text-white border-2 border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-pink"
                placeholder="Ask a question..."
                value={content}
                onChange={e => setContent(e.target.value)}
                required
              />
              {pollOptions.map((opt, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    className="flex-1 rounded-xl p-2 bg-gray-100 dark:bg-black/40 text-gray-800 dark:text-white border-2 border-accent-cyan focus:outline-none"
                    placeholder={`Option ${idx + 1}`}
                    value={opt}
                    onChange={e => handlePollOptionChange(idx, e.target.value)}
                    required
                  />
                  {pollOptions.length > 2 && (
                    <button type="button" onClick={() => removePollOption(idx)} className="text-accent-pink text-xl">&times;</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addPollOption} className="text-xs text-accent-cyan mt-1">+ Add Option</button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
} 
