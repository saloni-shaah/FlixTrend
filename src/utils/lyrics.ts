'use client';

export interface LyricLine {
    startTime: number;
    text: string;
}

const lyricsCache = new Map<string, LyricLine[]>();

function parseVttTimestamp(timestamp: string): number {
    const parts = timestamp.split(':');
    const seconds = parseFloat(parts.pop() || '0');
    const minutes = parseInt(parts.pop() || '0', 10);
    const hours = parseInt(parts.pop() || '0', 10);
    return (hours * 3600) + (minutes * 60) + seconds;
}

/**
 * A simple, dependency-free VTT parser.
 * @param vttContent The string content of the .vtt file.
 * @returns An array of LyricLine objects.
 */
export const parseVtt = (vttContent: string): LyricLine[] => {
    const lines = vttContent.trim().split(/\r?\n/);
    const lyrics: LyricLine[] = [];

    let i = 0;
    while (i < lines.length) {
        // Skip header and empty lines
        if (lines[i].startsWith('WEBVTT') || lines[i].trim() === '') {
            i++;
            continue;
        }

        // The line with the timestamp is usually after an optional cue identifier
        if (lines[i].includes('-->')) {
            const timestampLine = lines[i];
            const textLine = lines[i+1];
            
            if (timestampLine && textLine) {
                const [start] = timestampLine.split(' --> ');
                if (start) {
                    lyrics.push({
                        startTime: parseVttTimestamp(start),
                        text: textLine.trim()
                    });
                }
            }
            i += 2; // Move past timestamp and text lines
        } else {
          i++;
        }
    }
    return lyrics;
};


/**
 * Fetches a VTT file from a URL and parses it.
 * Implements caching to avoid redundant network requests.
 * @param url The URL of the .vtt file.
 * @returns A promise that resolves to an array of LyricLine objects or null.
 */
export const fetchAndParseLyrics = async (url: string): Promise<LyricLine[] | null> => {
    if (!url) return null;
    if (lyricsCache.has(url)) {
        return lyricsCache.get(url)!;
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Failed to fetch lyrics from ${url}: ${response.statusText}`);
            return null;
        }
        const vttContent = await response.text();
        const parsedLyrics = parseVtt(vttContent);
        lyricsCache.set(url, parsedLyrics);
        return parsedLyrics;
    } catch (error) {
        console.error(`Error fetching or parsing lyrics from ${url}:`, error);
        return null;
    }
};
