"use client";
import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

interface VideoContextType {
    activePlayer: HTMLVideoElement | null;
    setActivePlayer: (player: HTMLVideoElement | null) => void;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export const useVideoContext = () => {
    const context = useContext(VideoContext);
    if (!context) {
        throw new Error('useVideoContext must be used within a VideoProvider');
    }
    return context;
};

export const VideoProvider = ({ children }: { children: React.ReactNode }) => {
    const [activePlayer, setActivePlayerState] = useState<HTMLVideoElement | null>(null);

    const setActivePlayer = useCallback((player: HTMLVideoElement | null) => {
        if (activePlayer && activePlayer !== player) {
            activePlayer.pause();
        }
        setActivePlayerState(player);
    }, [activePlayer]);

    return (
        <VideoContext.Provider value={{ activePlayer, setActivePlayer }}>
            {children}
        </VideoContext.Provider>
    );
};
