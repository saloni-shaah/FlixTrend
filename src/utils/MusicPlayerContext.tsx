
"use client";
import React, { createContext, useContext, useState, useRef, useEffect, ReactNode, useCallback } from 'react';
import { Song } from '@/types/music';

// Define the context type
interface MusicPlayerContextType {
  activeSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isShuffle: boolean;
  repeatMode: 'none' | 'one' | 'all';
  currentPlaylist: Song[];
  playSong: (song: Song, playlist: Song[], index: number) => void;
  toggleSong: () => void;
  playNext: () => void;
  playPrevious: () => void;
  seek: (time: number) => void;
  toggleShuffle: () => void;
  setRepeatMode: (mode: 'none' | 'one' | 'all') => void;
  playSongFromPlaylist: (song: Song) => void;
  addToQueue: (song: Song) => void;
}

// Create the context
const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

// Provider component
export const MusicPlayerProvider = ({ children }: { children: ReactNode }) => {
  const [activeSong, setActiveSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none');
  const [currentPlaylist, setCurrentPlaylist] = useState<Song[]>([]);
  const [originalPlaylist, setOriginalPlaylist] = useState<Song[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(-1);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- Player Functions (defined before effects that use them) ---

  const playSong = useCallback((song: Song, playlist: Song[] = [], index: number = -1) => {
    setActiveSong(song);
    setIsPlaying(true);
    setOriginalPlaylist(playlist);
    setCurrentPlaylist(playlist);
    setCurrentSongIndex(index);
  }, []);

  const playNext = useCallback(() => {
    if (!activeSong) return;

    if (repeatMode === 'one') {
      if(audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
      return;
    }

    let nextIndex = currentSongIndex + 1;
    if (nextIndex >= currentPlaylist.length) {
        if (repeatMode === 'all') {
            nextIndex = 0; 
        } else {
            setIsPlaying(false);
            setActiveSong(null);
            return; 
        }
    }
    playSong(currentPlaylist[nextIndex], currentPlaylist, nextIndex);
  }, [activeSong, currentPlaylist, currentSongIndex, playSong, repeatMode]);

  // --- Core Audio Effects ---

  useEffect(() => {
    if (activeSong) {
      if (!audioRef.current) {
        audioRef.current = new Audio(activeSong.audioUrl);
      } else {
        audioRef.current.src = activeSong.audioUrl;
      }
      setCurrentTime(0);
      setDuration(0);

      audioRef.current.addEventListener('loadedmetadata', () => {
        if (audioRef.current) setDuration(audioRef.current.duration);
      });

      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Error playing audio:", e));
      }
    } else {
       if (audioRef.current) {
           audioRef.current.pause();
           audioRef.current = null;
       }
    }

    return () => {
        if(audioRef.current) {
            audioRef.current.pause();
        }
    }
}, [activeSong]);

  useEffect(() => {
    if (audioRef.current) {
        if (isPlaying) {
            audioRef.current.play().catch(e => console.error("Error playing audio:", e));
        } else {
            audioRef.current.pause();
        }
    }
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    const updateTime = () => {
        if (audio) setCurrentTime(audio.currentTime);
    };
    const handleSongEnd = () => {
        playNext();
    };

    if (audio) {
        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('ended', handleSongEnd);
    }

    return () => {
        if (audio) {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('ended', handleSongEnd);
        }
    };
  }, [activeSong, playNext]);

  // --- Remaining Player Functions ---

  const playSongFromPlaylist = useCallback((song: Song) => {
      const index = currentPlaylist.findIndex(s => s.id === song.id);
      if(index !== -1) {
        playSong(song, currentPlaylist, index);
      }
  }, [currentPlaylist, playSong]);

  const toggleSong = useCallback(() => {
    if (activeSong) {
      setIsPlaying(prev => !prev);
    }
  }, [activeSong]);

  const playPrevious = useCallback(() => {
    if (!activeSong || currentSongIndex <= 0) return;
    const prevIndex = currentSongIndex - 1;
    playSong(currentPlaylist[prevIndex], currentPlaylist, prevIndex);
  }, [activeSong, currentPlaylist, currentSongIndex, playSong]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffle(prev => {
        const newShuffleState = !prev;
        if(newShuffleState) {
            // When shuffling, include the active song in a new random order
            const otherSongs = originalPlaylist.filter(s => s.id !== activeSong?.id);
            const shuffled = otherSongs.sort(() => Math.random() - 0.5);
            const newPlaylist = activeSong ? [activeSong, ...shuffled] : shuffled;
            setCurrentPlaylist(newPlaylist);
            setCurrentSongIndex(0); // Current song is now at the start
        } else {
            // When turning shuffle off, resume from the original playlist order
            setCurrentPlaylist(originalPlaylist);
            const originalIndex = originalPlaylist.findIndex(s => s.id === activeSong?.id);
            setCurrentSongIndex(originalIndex);
        }
        return newShuffleState;
    });
  }, [originalPlaylist, activeSong]);

  const addToQueue = useCallback((song: Song) => {
    if (!activeSong) {
      playSong(song, [song], 0);
      return;
    }
    // Insert song right after the current one
    const newPlaylist = [...currentPlaylist];
    newPlaylist.splice(currentSongIndex + 1, 0, song);
    setCurrentPlaylist(newPlaylist);
    // also add to original playlist to keep it consistent when shuffle is toggled
    const newOriginalPlaylist = [...originalPlaylist];
    const activeIndexInOriginal = newOriginalPlaylist.findIndex(s => s.id === activeSong.id);
    newOriginalPlaylist.splice(activeIndexInOriginal + 1, 0, song);
    setOriginalPlaylist(newOriginalPlaylist);

    console.log(`Added ${song.title} to the queue.`);
}, [activeSong, currentPlaylist, currentSongIndex, originalPlaylist, playSong]);

  const value = {
    activeSong, isPlaying, currentTime, duration, isShuffle, repeatMode, currentPlaylist,
    playSong, toggleSong, playNext, playPrevious, seek, toggleShuffle, setRepeatMode, playSongFromPlaylist, addToQueue
  };

  return <MusicPlayerContext.Provider value={value}>{children}</MusicPlayerContext.Provider>;
};

export const useMusicPlayer = () => {
  const context = useContext(MusicPlayerContext);
  if (context === undefined) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
};
