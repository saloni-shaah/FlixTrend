export type Song = {
    id: string;
    title: string;
    artist: string;
    album: string;
    year: string;
    description: string;
    albumArtUrl: string;
    audioUrl: string;
    lyricsUrl?: string;
    lyrics?: string;
    playCount?: number;
  };