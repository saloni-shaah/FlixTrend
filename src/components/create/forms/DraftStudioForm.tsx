'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  AudioLines,
  Clapperboard,
  Image as ImageIcon,
  Music4,
  Pause,
  Play,
  Plus,
  Scissors,
  Sparkles,
  Trash2,
  Volume2,
  WandSparkles,
  X,
} from 'lucide-react';

type EditorClip = {
  id: string;
  file: File;
  url: string;
  duration: number;
  start: number;
  end: number;
  width: number;
  height: number;
};

type DraftStudioFormProps = {
  data: any;
  onDataChange: (data: any) => void;
  onError: (error: string | null) => void;
};

const MAX_CLIPS = 8;
const IMAGE_HOLD_SECONDS = 3;
const effectOptions = ['None', 'Cinematic', 'Vintage', 'Neon', 'Warm', 'Soft'];
const aspectOptions = [
  { label: 'Original', value: 'original' },
  { label: 'Portrait 9:16', value: 'portrait' },
  { label: 'Square 1:1', value: 'square' },
  { label: 'Landscape 16:9', value: 'landscape' },
];
const stickerOptions = ['✨', '❤️', '🔥', '⭐', '🎉', '😎', '🌈', '💫'];

const effectFilters: Record<string, string> = {
  None: 'none',
  Cinematic: 'contrast(1.18) saturate(0.88)',
  Vintage: 'sepia(0.38) contrast(1.06) saturate(0.82)',
  Neon: 'saturate(1.8) hue-rotate(8deg) contrast(1.08)',
  Warm: 'sepia(0.16) saturate(1.3)',
  Soft: 'brightness(1.06) saturate(0.9)',
};

function waitForMediaEvent<T extends HTMLMediaElement>(
  media: T,
  successEvent: 'loadedmetadata' | 'seeked',
  failureMessage: string,
) {
  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      media.removeEventListener(successEvent, onSuccess);
      media.removeEventListener('error', onError);
    };
    const onSuccess = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error(failureMessage));
    };
    media.addEventListener(successEvent, onSuccess, { once: true });
    media.addEventListener('error', onError, { once: true });
  });
}

function waitForImage(image: HTMLImageElement) {
  return new Promise<void>((resolve, reject) => {
    if (image.complete) {
      if (image.naturalWidth > 0) resolve();
      else reject(new Error(`Could not read ${image.alt || 'an image'}.`));
      return;
    }
    image.onload = () => resolve();
    image.onerror = () => reject(new Error(`Could not read ${image.alt || 'an image'}.`));
  });
}

function drawCover(
  context: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  width: number,
  height: number,
) {
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const cropWidth = width / scale;
  const cropHeight = height / scale;
  const cropX = (sourceWidth - cropWidth) / 2;
  const cropY = (sourceHeight - cropHeight) / 2;
  context.drawImage(source, cropX, cropY, cropWidth, cropHeight, 0, 0, width, height);
}

function drawOverlay(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  text: string,
  textEffect: string,
  sticker: string,
  textPosition: string,
) {
  const trimmedText = text.trim();
  if (!trimmedText && !sticker) return;

  const fontSize = Math.max(28, Math.round(width * 0.055));
  const textY = textPosition === 'top' ? height * 0.16 : textPosition === 'center' ? height * 0.52 : height * 0.84;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = `700 ${fontSize}px system-ui, sans-serif`;
  context.lineWidth = Math.max(4, fontSize * 0.14);
  context.lineJoin = 'round';
  context.shadowColor = textEffect === 'Glow' ? '#27e9ff' : 'rgba(0,0,0,0.8)';
  context.shadowBlur = textEffect === 'Glow' ? 22 : 8;
  context.strokeStyle = 'rgba(0,0,0,0.72)';
  context.fillStyle = '#ffffff';
  if (trimmedText) {
    const words = trimmedText.split(/\s+/);
    const maxWidth = width * 0.84;
    const lines: string[] = [];
    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (context.measureText(candidate).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
    const lineHeight = fontSize * 1.2;
    const firstY = textY - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((lineText, index) => {
      const y = firstY + index * lineHeight;
      context.strokeText(lineText, width / 2, y, maxWidth);
      context.fillText(lineText, width / 2, y, maxWidth);
    });
  }
  if (sticker) {
    context.font = `${Math.round(width * 0.12)}px system-ui, sans-serif`;
    context.fillText(sticker, width * 0.82, height * 0.2);
  }
  context.shadowBlur = 0;
}

export function DraftStudioForm({ data, onDataChange, onError }: DraftStudioFormProps) {
  const imagePickerRef = useRef<HTMLInputElement>(null);
  const audioPickerRef = useRef<HTMLInputElement>(null);
  const onDataChangeRef = useRef(onDataChange);
  const [clips, setClips] = useState<EditorClip[]>(() => data.draftClips || []);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(() => data.draftClips?.[0]?.id || null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [songPreviewUrl, setSongPreviewUrl] = useState<string | null>(null);
  const clipsRef = useRef<EditorClip[]>([]);
  const hasInitializedClipsRef = useRef(false);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const previewAudioRef = useRef<HTMLAudioElement>(null);
  const selectedClip = clips.find((clip) => clip.id === selectedClipId) || clips[0] || null;
  const activeTools = useMemo(
    () => ['Trim', 'Mix clips', 'Mute original audio', 'Add music', 'Text overlays', 'Effects', 'Crop', 'Captions', 'Stickers', 'Image filters'],
    [],
  );
  const isSelectedVideo = Boolean(selectedClip && selectedClip.file.type.startsWith('video/'));
  const aspectRatio = data.aspectRatio || 'original';
  const filter = effectFilters[data.videoEffect || 'None'] || 'none';

  useEffect(() => {
    clipsRef.current = clips;
    onDataChangeRef.current = onDataChange;
    if (!hasInitializedClipsRef.current) {
      hasInitializedClipsRef.current = true;
      onDataChangeRef.current({ draftClips: clips });
      return;
    }
    onDataChangeRef.current({
      draftClips: clips,
      editedFile: null,
      editedThumbnailFile: null,
      editedIsVideo: false,
      editedDuration: null,
    });
  }, [clips]);

  useEffect(() => {
    return () => {
      clipsRef.current.forEach((clip) => URL.revokeObjectURL(clip.url));
    };
  }, []);

  useEffect(() => {
    onDataChangeRef.current = onDataChange;
  }, [onDataChange]);

  useEffect(() => {
    if (!(data.backgroundAudio instanceof File)) {
      setSongPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(data.backgroundAudio);
    setSongPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [data.backgroundAudio]);

  useEffect(() => {
    if (!selectedClipId && clips[0]) setSelectedClipId(clips[0].id);
    if (selectedClipId && !clips.some((clip) => clip.id === selectedClipId)) {
      setSelectedClipId(clips[0]?.id || null);
    }
  }, [clips, selectedClipId]);

  const updateDraft = (next: Record<string, any>) => {
    const editingProperties = [
      'backgroundAudio',
      'aspectRatio',
      'videoEffect',
      'overlayText',
      'textEffect',
      'textPosition',
      'sticker',
      'muteOriginalAudio',
      'musicVolume',
    ];
    const invalidatesExport = Object.keys(next).some((key) => editingProperties.includes(key));
    onDataChange({
      ...data,
      ...next,
      ...(invalidatesExport ? {
        editedFile: null,
        editedThumbnailFile: null,
        editedIsVideo: false,
        editedDuration: null,
      } : {}),
    });
  };

  const setFormError = (message: string | null) => {
    setEditorError(message);
    onError(null);
  };

  const addClips = async (files: FileList | null) => {
    if (!files?.length) return;
    setFormError(null);
    const availableSlots = MAX_CLIPS - clips.length;
    if (availableSlots <= 0) {
      setFormError(`You can add up to ${MAX_CLIPS} clips to one edit.`);
      return;
    }

    const selectedFiles = Array.from(files).slice(0, availableSlots);
    const unsupported = selectedFiles.find((file) => !file.type.startsWith('video/') && !file.type.startsWith('image/'));
    if (unsupported) {
      setFormError(`“${unsupported.name}” is not a supported image or video.`);
      return;
    }

    const newClips: EditorClip[] = [];
    for (const file of selectedFiles) {
      const url = URL.createObjectURL(file);
      let duration = IMAGE_HOLD_SECONDS;
      let width = 1280;
      let height = 720;
      if (file.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.preload = 'metadata';
        const metadataLoaded = waitForMediaEvent(video, 'loadedmetadata', `Could not read video metadata for “${file.name}”.`);
        video.src = url;
        try {
          await metadataLoaded;
          if (!Number.isFinite(video.duration) || video.duration <= 0) {
            throw new Error(`Could not read the duration of “${file.name}”.`);
          }
          duration = video.duration;
          width = video.videoWidth || width;
          height = video.videoHeight || height;
        } catch (error) {
          URL.revokeObjectURL(url);
          newClips.forEach((clip) => URL.revokeObjectURL(clip.url));
          setFormError(error instanceof Error ? error.message : 'Could not read the selected video.');
          return;
        }
        video.removeAttribute('src');
        video.load();
      } else {
        const image = new Image();
        image.src = url;
        try {
          await waitForImage(image);
          width = image.naturalWidth || width;
          height = image.naturalHeight || height;
        } catch (error) {
          URL.revokeObjectURL(url);
          newClips.forEach((clip) => URL.revokeObjectURL(clip.url));
          setFormError(error instanceof Error ? error.message : `Could not read “${file.name}”.`);
          return;
        }
      }
      const savedClip = (data.mediaItems || []).find((item: any) => item.name === file.name);
      const start = savedClip ? Math.min(Math.max(0, savedClip.start || 0), Math.max(0, duration - 0.1)) : 0;
      const end = savedClip
        ? Math.min(duration, Math.max(start + 0.1, savedClip.end || duration))
        : duration;
      newClips.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        url,
        duration,
        start,
        end,
        width,
        height,
      });
    }
    setClips((current) => [...current, ...newClips]);
    setSelectedClipId(newClips[0]?.id || selectedClipId);
    if (newClips.some((clip) => clip.file.type.startsWith('video/'))) {
      updateDraft({ isVideo: true });
    }
  };

  const updateClip = (clipId: string, changes: Partial<Pick<EditorClip, 'start' | 'end'>>) => {
    setClips((current) => current.map((clip) => {
      if (clip.id !== clipId) return clip;
      const start = Math.min(changes.start ?? clip.start, clip.end - 0.1);
      const end = Math.max(changes.end ?? clip.end, start + 0.1);
      return { ...clip, start: Math.max(0, start), end: Math.min(clip.duration, end) };
    }));
  };

  const removeClip = (clipId: string) => {
    const clip = clips.find((item) => item.id === clipId);
    if (clip) URL.revokeObjectURL(clip.url);
    setClips((current) => current.filter((item) => item.id !== clipId));
  };

  const moveClip = (clipId: string, direction: -1 | 1) => {
    setClips((current) => {
      const index = current.findIndex((clip) => clip.id === clipId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };

  const handleAudioSelection = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('audio/')) {
      setFormError('Choose an audio file for the music track.');
      return;
    }
    updateDraft({ backgroundAudio: file, backgroundAudioName: file.name });
    setFormError(null);
  };

  const handleExport = async () => {
    if (!clips.length) {
      setFormError('Add at least one photo or video clip before exporting.');
      return;
    }
    const invalidClip = clips.find((clip) => clip.end <= clip.start);
    if (invalidClip) {
      setFormError(`Choose a valid trim range for “${invalidClip.file.name}”.`);
      return;
    }

    setIsExporting(true);
    setExportProgress(0);
    setFormError(null);
    previewVideoRef.current?.pause();
    previewAudioRef.current?.pause();
    setIsPreviewPlaying(false);

    const ratio = aspectRatio === 'portrait' ? 9 / 16 : aspectRatio === 'square' ? 1 : aspectRatio === 'landscape' ? 16 / 9 : null;
    const firstClip = clips[0];
    const outputRatio = ratio || (firstClip.width && firstClip.height ? firstClip.width / firstClip.height : 16 / 9);
    const width = outputRatio >= 1 ? 1280 : 720;
    const height = outputRatio >= 1 ? Math.round(1280 / outputRatio) : Math.round(720 / outputRatio);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
      setFormError('This browser could not start the editor canvas.');
      setIsExporting(false);
      return;
    }

    const drawFrame = (source: CanvasImageSource, sourceW: number, sourceH: number) => {
      context.fillStyle = '#000';
      context.fillRect(0, 0, width, height);
      context.filter = filter;
      drawCover(context, source, sourceW, sourceH, width, height);
      context.filter = 'none';
      drawOverlay(
        context,
        width,
        height,
        data.overlayText || '',
        data.textEffect || 'Glow',
        data.sticker || '',
        data.textPosition || 'bottom',
      );
    };

    const renderStill = async () => {
      const clip = clips[0];
      const image = new Image();
      image.src = clip.url;
      await waitForImage(image);
      drawFrame(image, image.naturalWidth, image.naturalHeight);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
      if (!blob) throw new Error('The edited image could not be exported.');
      const output = new File([blob], `${clip.file.name.replace(/\.[^.]+$/, '')}-edited.jpg`, { type: 'image/jpeg' });
      updateDraft({ editedFile: output, editedThumbnailFile: null, editedIsVideo: false, editedDuration: null, isVideo: false });
      setExportProgress(100);
    };

    let recorder: MediaRecorder | null = null;
    let audioContext: AudioContext | null = null;
    let songElement: HTMLAudioElement | null = null;
    let outputStream: MediaStream | null = null;
    const activeVideos: HTMLVideoElement[] = [];

    try {
      const isSingleStill = clips.length === 1
        && clips[0].file.type.startsWith('image/')
        && !data.backgroundAudio;
      if (isSingleStill) {
        await renderStill();
        setFormError(null);
        return;
      }

      if (typeof MediaRecorder === 'undefined' || !canvas.captureStream) {
        throw new Error('Video export is not supported in this browser. Try the latest version of Chrome, Edge, or Firefox.');
      }

      const AudioContextConstructor = window.AudioContext
        || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextConstructor) throw new Error('Audio mixing is not supported in this browser.');
      audioContext = new AudioContextConstructor();
      await audioContext.resume();
      const destination = audioContext.createMediaStreamDestination();
      const canvasStream = canvas.captureStream(30);
      outputStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...destination.stream.getAudioTracks(),
      ]);
      const mimeType = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ].find((type) => MediaRecorder.isTypeSupported(type));
      if (!mimeType) {
        throw new Error('This browser does not support local video export.');
      }

      const chunks: BlobPart[] = [];
      recorder = new MediaRecorder(outputStream, { mimeType });
      const recorderStopped = new Promise<void>((resolve, reject) => {
        recorder!.addEventListener('stop', () => resolve(), { once: true });
        recorder!.addEventListener('error', () => reject(new Error('The browser could not finish recording the edit.')), { once: true });
      });
      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      });
      recorder.start(500);

      if (data.backgroundAudio instanceof File) {
        songElement = new Audio(URL.createObjectURL(data.backgroundAudio));
        songElement.loop = true;
        const songSource = audioContext.createMediaElementSource(songElement);
        const songGain = audioContext.createGain();
        songGain.gain.value = Number(data.musicVolume ?? 0.7);
        songSource.connect(songGain).connect(destination);
        await songElement.play();
      }

      const totalDuration = clips.reduce((sum, clip) => sum + (clip.end - clip.start), 0);
      let elapsed = 0;

      for (const clip of clips) {
        if (clip.file.type.startsWith('image/')) {
          const image = new Image();
          image.src = clip.url;
          await waitForImage(image);
          drawFrame(image, image.naturalWidth, image.naturalHeight);
          const holdDuration = clip.end - clip.start;
          const holdStartedAt = performance.now();
          while (performance.now() - holdStartedAt < holdDuration * 1000) {
            const frameProgress = Math.min(1, (performance.now() - holdStartedAt) / (holdDuration * 1000));
            setExportProgress(Math.min(99, Math.round(((elapsed + holdDuration * frameProgress) / totalDuration) * 100)));
            await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
          }
          elapsed += holdDuration;
          continue;
        }

        const video = document.createElement('video');
        video.preload = 'auto';
        video.playsInline = true;
        const metadataLoaded = waitForMediaEvent(video, 'loadedmetadata', `Could not load “${clip.file.name}” for export.`);
        video.src = clip.url;
        activeVideos.push(video);
        await metadataLoaded;
        if (!data.muteOriginalAudio) {
          const source = audioContext.createMediaElementSource(video);
          const gain = audioContext.createGain();
          gain.gain.value = 0.8;
          source.connect(gain).connect(destination);
        }
        if (Math.abs(video.currentTime - clip.start) > 0.05) {
          const seekComplete = waitForMediaEvent(video, 'seeked', `Could not trim “${clip.file.name}”.`);
          video.currentTime = clip.start;
          await seekComplete;
        }
        await video.play();
        const trimDuration = clip.end - clip.start;
        while (!video.ended && video.currentTime < clip.end) {
          drawFrame(video, video.videoWidth, video.videoHeight);
          const currentProgress = Math.max(0, video.currentTime - clip.start);
          setExportProgress(Math.min(99, Math.round(((elapsed + currentProgress) / totalDuration) * 100)));
          await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        }
        video.pause();
        elapsed += trimDuration;
      }

      recorder.stop();
      await recorderStopped;
      outputStream.getTracks().forEach((track) => track.stop());
      const outputBlob = new Blob(chunks, { type: mimeType });
      if (!outputBlob.size) throw new Error('The browser produced an empty video file.');
      const output = new File([outputBlob], `${(data.draftTitle || 'flixtrend-edit').replace(/[^\w-]+/g, '-')}.webm`, { type: mimeType });

      const thumbnailBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
      const thumbnailFile = thumbnailBlob ? new File([thumbnailBlob], 'edited-thumbnail.jpg', { type: 'image/jpeg' }) : null;
      updateDraft({
        editedFile: output,
        editedThumbnailFile: thumbnailFile,
        editedIsVideo: true,
        editedDuration: totalDuration,
        isVideo: true,
      });
      setExportProgress(100);
      setFormError(null);
    } catch (error) {
      console.error('Draft Studio export failed:', error);
      if (recorder?.state === 'recording') recorder.stop();
      const message = error instanceof Error ? error.message : 'Could not export this edit.';
      setFormError(message);
    } finally {
      activeVideos.forEach((video) => {
        video.pause();
        video.removeAttribute('src');
        video.load();
      });
      outputStream?.getTracks().forEach((track) => track.stop());
      songElement?.pause();
      if (songElement?.src) URL.revokeObjectURL(songElement.src);
      if (audioContext && audioContext.state !== 'closed') await audioContext.close();
      setIsExporting(false);
    }
  };

  const togglePreview = async () => {
    if (!selectedClip) return;
    if (isPreviewPlaying) {
      previewVideoRef.current?.pause();
      previewAudioRef.current?.pause();
      setIsPreviewPlaying(false);
      return;
    }
    if (isSelectedVideo && previewVideoRef.current) {
      previewVideoRef.current.currentTime = selectedClip.start;
      await previewVideoRef.current.play();
    }
    if (data.backgroundAudio && previewAudioRef.current) {
      previewAudioRef.current.currentTime = 0;
      await previewAudioRef.current.play();
    }
    setIsPreviewPlaying(true);
  };

  const previewStyle: React.CSSProperties = {
    aspectRatio: aspectRatio === 'portrait' ? '9 / 16' : aspectRatio === 'square' ? '1 / 1' : aspectRatio === 'landscape' ? '16 / 9' : undefined,
  };
  return (
    <div className="space-y-6">
      <div className="grid gap-3">
        <label className="text-sm font-semibold text-accent-cyan" htmlFor="draft-title">Draft title</label>
        <input
          id="draft-title"
          value={data.draftTitle || ''}
          onChange={(event) => updateDraft({ draftTitle: event.target.value })}
          placeholder="Weekend highlights"
          className="input-glass"
        />
      </div>

      <div className="grid gap-3">
        <label className="text-sm font-semibold text-accent-cyan" htmlFor="draft-caption">Post caption</label>
        <textarea
          id="draft-caption"
          value={data.content || ''}
          onChange={(event) => updateDraft({ content: event.target.value })}
          placeholder="Add a caption for your finished post..."
          className="input-glass min-h-[90px]"
        />
      </div>

      <section className="space-y-3 rounded-2xl border border-glass-border bg-black/20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 font-bold text-white"><Clapperboard size={18} className="text-accent-cyan" /> Local editor</h3>
            <p className="mt-1 text-xs text-gray-400">Your original photos and clips are edited in this browser.</p>
          </div>
          <button type="button" className="btn-glass flex items-center gap-2" onClick={() => imagePickerRef.current?.click()} disabled={clips.length >= MAX_CLIPS}>
            <Plus size={16} /> Add photos / clips
          </button>
          <input
            ref={imagePickerRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={(event) => {
              void addClips(event.target.files);
              event.currentTarget.value = '';
            }}
          />
        </div>

        {editorError && <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{editorError}</p>}

        {selectedClip ? (
          <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(220px,1fr)]">
            <div>
              <div className="relative mx-auto flex max-h-[520px] min-h-64 w-full max-w-md items-center justify-center overflow-hidden rounded-xl bg-black" style={previewStyle}>
                {isSelectedVideo ? (
                  <video
                    ref={previewVideoRef}
                    src={selectedClip.url}
                    className="h-full w-full object-contain"
                    controls
                    muted={Boolean(data.muteOriginalAudio)}
                    onPlay={() => setIsPreviewPlaying(true)}
                    onPause={() => setIsPreviewPlaying(false)}
                    onTimeUpdate={(event) => {
                      if (event.currentTarget.currentTime >= selectedClip.end) {
                        event.currentTarget.pause();
                        event.currentTarget.currentTime = selectedClip.start;
                      }
                    }}
                    onEnded={() => setIsPreviewPlaying(false)}
                    style={{ filter }}
                  />
                ) : (
                  <img src={selectedClip.url} alt={selectedClip.file.name} className="h-full w-full object-contain" style={{ filter }} />
                )}
                {(data.overlayText || data.sticker) && (
                  <div className={`pointer-events-none absolute left-4 right-4 text-center text-xl font-extrabold text-white [text-shadow:0_2px_6px_black,0_0_15px_#27e9ff] ${data.textPosition === 'top' ? 'top-8' : data.textPosition === 'center' ? 'top-1/2 -translate-y-1/2' : 'bottom-8'}`}>
                    {data.overlayText && <p>{data.overlayText}</p>}
                    {data.sticker && <span className="absolute right-2 top-0 text-4xl">{data.sticker}</span>}
                  </div>
                )}
                {isSelectedVideo && (
                  <button type="button" aria-label={isPreviewPlaying ? 'Pause preview' : 'Play preview'} onClick={() => void togglePreview()} className="absolute bottom-3 left-3 rounded-full bg-black/70 p-2 text-white">
                    {isPreviewPlaying ? <Pause size={18} /> : <Play size={18} />}
                  </button>
                )}
              </div>
              {data.backgroundAudio && (
                <>
                  <audio ref={previewAudioRef} src={songPreviewUrl || undefined} loop className="hidden" />
                  <p className="mt-2 flex items-center gap-2 text-xs text-gray-400"><Music4 size={14} /> Music preview: {data.backgroundAudioName}</p>
                </>
              )}
            </div>

            <div className="space-y-4">
              <label className="grid gap-2 text-sm text-gray-300">
                Crop / aspect ratio
                <select value={aspectRatio} onChange={(event) => updateDraft({ aspectRatio: event.target.value })} className="input-glass">
                  {aspectOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>

              <label className="grid gap-2 text-sm text-gray-300">
                Video / image effect
                <select value={data.videoEffect || 'None'} onChange={(event) => updateDraft({ videoEffect: event.target.value })} className="input-glass">
                  {effectOptions.map((effect) => <option key={effect} value={effect}>{effect}</option>)}
                </select>
              </label>

              <label className="grid gap-2 text-sm text-gray-300">
                Text overlay / caption
                <input value={data.overlayText || ''} onChange={(event) => updateDraft({ overlayText: event.target.value })} maxLength={160} placeholder="Your words appear on the media" className="input-glass" />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="grid gap-2 text-sm text-gray-300">
                  Text effect
                  <select value={data.textEffect || 'Glow'} onChange={(event) => updateDraft({ textEffect: event.target.value })} className="input-glass">
                    <option>Glow</option><option>Outline</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm text-gray-300">
                  Text position
                  <select value={data.textPosition || 'bottom'} onChange={(event) => updateDraft({ textPosition: event.target.value })} className="input-glass">
                    <option value="top">Top</option><option value="center">Center</option><option value="bottom">Bottom</option>
                  </select>
                </label>
              </div>

              <label className="grid gap-2 text-sm text-gray-300">
                Add a sticker
                <select value={data.sticker || ''} onChange={(event) => updateDraft({ sticker: event.target.value })} className="input-glass">
                  <option value="">No sticker</option>
                  {stickerOptions.map((sticker) => <option key={sticker} value={sticker}>{sticker}</option>)}
                </select>
              </label>

              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" checked={Boolean(data.muteOriginalAudio)} onChange={(event) => updateDraft({ muteOriginalAudio: event.target.checked })} />
                <Volume2 size={16} /> Mute original video audio
              </label>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {data.draftId && (data.mediaItems || []).length > 0 && (
              <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-200">
                This local project remembers your edit settings, but not the original media files. Select those files again to continue editing.
              </p>
            )}
            <button type="button" onClick={() => imagePickerRef.current?.click()} className="flex min-h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-accent-cyan/50 text-sm text-gray-300 hover:bg-accent-cyan/5">
              <ImageIcon className="text-accent-cyan" />
              Select photos or videos to start your edit
              <span className="text-xs text-gray-500">Add up to {MAX_CLIPS}; reorder clips with the arrows.</span>
            </button>
          </div>
        )}

        {selectedClip && isSelectedVideo && (
          <div className="grid gap-3 rounded-xl border border-glass-border p-3 sm:grid-cols-2">
            <label className="grid gap-2 text-sm text-gray-300">
              <span className="flex items-center gap-2"><Scissors size={15} /> Trim start: {selectedClip.start.toFixed(1)}s</span>
              <input type="range" min={0} max={Math.max(0, selectedClip.duration - 0.1)} step={0.1} value={selectedClip.start} onChange={(event) => updateClip(selectedClip.id, { start: Number(event.target.value) })} />
            </label>
            <label className="grid gap-2 text-sm text-gray-300">
              <span className="flex items-center gap-2"><Scissors size={15} /> Trim end: {selectedClip.end.toFixed(1)}s</span>
              <input type="range" min={Math.min(selectedClip.duration, selectedClip.start + 0.1)} max={selectedClip.duration} step={0.1} value={selectedClip.end} onChange={(event) => updateClip(selectedClip.id, { end: Number(event.target.value) })} />
            </label>
          </div>
        )}

        <div className="space-y-2">
          {clips.map((clip, index) => (
            <div key={clip.id} className={`flex items-center gap-3 rounded-xl border p-2 ${selectedClipId === clip.id ? 'border-accent-cyan/70 bg-accent-cyan/5' : 'border-glass-border'}`}>
              <button type="button" onClick={() => setSelectedClipId(clip.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                {clip.file.type.startsWith('image/')
                  ? <img src={clip.url} alt="" className="h-12 w-16 rounded object-cover" />
                  : <video src={clip.url} className="h-12 w-16 rounded bg-black object-cover" muted preload="metadata" />}
                <span className="min-w-0">
                  <span className="block truncate text-sm text-white">{index + 1}. {clip.file.name}</span>
                  <span className="text-xs text-gray-400">{clip.file.type.startsWith('image/') ? 'Image' : `${(clip.end - clip.start).toFixed(1)}s selected`}</span>
                </span>
              </button>
              <button type="button" aria-label={`Move ${clip.file.name} up`} onClick={() => moveClip(clip.id, -1)} disabled={index === 0} className="rounded p-1 text-gray-300 disabled:opacity-30"><ArrowUp size={16} /></button>
              <button type="button" aria-label={`Move ${clip.file.name} down`} onClick={() => moveClip(clip.id, 1)} disabled={index === clips.length - 1} className="rounded p-1 text-gray-300 disabled:opacity-30"><ArrowDown size={16} /></button>
              <button type="button" aria-label={`Remove ${clip.file.name}`} onClick={() => removeClip(clip.id)} className="rounded p-1 text-red-300"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => audioPickerRef.current?.click()} className="btn-glass flex items-center gap-2">
                <Music4 size={16} /> {data.backgroundAudioName || 'Choose music'}
              </button>
              {data.backgroundAudio && (
                <button type="button" aria-label="Remove music" onClick={() => updateDraft({ backgroundAudio: null, backgroundAudioName: '' })} className="rounded p-2 text-red-300"><X size={16} /></button>
              )}
              <input ref={audioPickerRef} type="file" accept="audio/*" className="hidden" onChange={(event) => { handleAudioSelection(event.target.files?.[0]); event.currentTarget.value = ''; }} />
            </div>
            {data.backgroundAudio && (
              <label className="flex items-center gap-3 text-xs text-gray-400">
                Music volume
                <input type="range" min={0} max={1} step={0.05} value={data.musicVolume ?? 0.7} onChange={(event) => updateDraft({ musicVolume: Number(event.target.value) })} />
              </label>
            )}
            <p className="text-xs text-gray-500">Captions are editable text overlays. The editor does not upload or transcribe your original files.</p>
          </div>
          <div className="flex items-center">
            <button type="button" onClick={() => void handleExport()} disabled={isExporting || clips.length === 0} className="btn-accent flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50">
              {isExporting ? <AudioLines className="animate-pulse" size={17} /> : <WandSparkles size={17} />}
              {isExporting ? `Rendering ${exportProgress}%` : 'Render edit'}
            </button>
          </div>
        </div>

        {isExporting && (
          <div className="h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={exportProgress} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full bg-accent-cyan transition-[width]" style={{ width: `${exportProgress}%` }} />
          </div>
        )}

        {data.editedFile && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-green-500/30 bg-green-500/5 p-3 text-sm">
            <span className="flex items-center gap-2 text-green-300"><Sparkles size={16} /> Ready to publish: {data.editedFile.name}</span>
            <button type="button" onClick={() => updateDraft({ editedFile: null, editedThumbnailFile: null, editedIsVideo: false, editedDuration: null })} className="btn-glass flex items-center gap-2 text-xs">
              <X size={14} /> Clear export
            </button>
          </div>
        )}
      </section>

      <div className="rounded-xl border border-glass-border p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Editor tools</p>
        <div className="flex flex-wrap gap-2">
          {activeTools.map((tool) => <span key={tool} className="rounded-full border border-glass-border px-3 py-1 text-xs text-gray-300">{tool}</span>)}
        </div>
      </div>
    </div>
  );
}
