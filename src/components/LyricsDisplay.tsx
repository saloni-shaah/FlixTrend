'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { fetchAndParseLyrics, parseVtt, LyricLine } from '@/utils/lyrics';
import { Loader2, MicOff } from 'lucide-react';

interface LyricsDisplayProps {
  lyricsUrl?: string;
  lyrics?: string;
  currentTime: number;
  seek: (time: number) => void;
  isInteractive?: boolean;
}

export const LyricsDisplay = ({
  lyricsUrl,
  lyrics: lyricsProp,
  currentTime,
  seek,
  isInteractive = true,
}: LyricsDisplayProps) => {
  const [lyrics, setLyrics] = useState<LyricLine[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // The component owns its scroll container now — no more relying on the parent
  const containerRef = useRef<HTMLDivElement>(null);
  // One ref slot per lyric line so we can measure any of them at any time
  const lineRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  useEffect(() => {
    const loadLyrics = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let parsedLyrics: LyricLine[] | null = null;
        if (lyricsUrl) {
          parsedLyrics = await fetchAndParseLyrics(lyricsUrl);
        } else if (lyricsProp) {
          parsedLyrics = parseVtt(lyricsProp);
        }

        if (parsedLyrics && parsedLyrics.length > 0) {
          setLyrics(parsedLyrics);
        } else {
          setLyrics(null);
          setError('No lyrics available for this song.');
        }
      } catch (err) {
        console.error(err);
        setError('An error occurred while processing lyrics.');
      } finally {
        setIsLoading(false);
      }
    };

    loadLyrics();
  }, [lyricsUrl, lyricsProp]);

  const activeLineIndex = useMemo(() => {
    if (!lyrics) return -1;
    let currentLine = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (lyrics[i].startTime <= currentTime) {
        currentLine = i;
      } else {
        break;
      }
    }
    return currentLine;
  }, [lyrics, currentTime]);

  useEffect(() => {
    if (activeLineIndex < 0) return;

    const container = containerRef.current;
    const activeLine = lineRefs.current[activeLineIndex];
    if (!container || !activeLine) return;

    // getBoundingClientRect gives positions relative to the viewport.
    // The difference between the line's top and the container's top tells us
    // where the line sits inside the visible portion of the container right now.
    // Adding container.scrollTop converts that into an absolute offset within
    // the full scrollable content, then we subtract half the container height
    // and add half the line height to land the line dead-center.
    const containerRect = container.getBoundingClientRect();
    const lineRect = activeLine.getBoundingClientRect();

    const targetScrollTop =
      container.scrollTop +          // current scroll offset
      lineRect.top - containerRect.top + // line's position inside visible area
      lineRect.height / 2 -          // go to line's center
      containerRect.height / 2;     // pull back by half the container

    container.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
  }, [activeLineIndex]);

  const handleLineClick = (startTime: number) => {
    if (isInteractive) seek(startTime);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <Loader2 className="animate-spin mr-2" /> Loading Lyrics...
      </div>
    );
  }

  if (error || !lyrics || lyrics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <MicOff size={32} className="mb-2" />
        <p>{error ?? 'No lyrics available for this song.'}</p>
      </div>
    );
  }

  return (
    // h-full + overflow-y-auto: this div IS the scroll container.
    // [scrollbar-width:none] hides the native scrollbar cleanly.
    <div
      ref={containerRef}
      className="h-full overflow-y-auto text-center [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {/* Top/bottom padding lets the first and last lines reach the center */}
      <div className="py-[40vh]">
        {lyrics.map((line, index) => {
          const isActive = index === activeLineIndex;
          return (
            <motion.p
              key={`${line.startTime}-${index}`}
              // Ref callback fills the slot for this index; clears it on unmount
              ref={(el) => { lineRefs.current[index] = el; }}
              animate={{
                opacity: isActive ? 1 : 0.4,
                scale: isActive ? 1.05 : 1,
                color: isActive ? '#2dd4bf' : '#E5E7EB',
              }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              onClick={() => handleLineClick(line.startTime)}
              className={`
                font-semibold text-xl md:text-2xl leading-relaxed my-6
                ${isInteractive ? 'cursor-pointer hover:bg-white/10 p-2 rounded-lg' : ''}
              `}
            >
              {line.text}
            </motion.p>
          );
        })}
      </div>
    </div>
  );
};