'use client';
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Paperclip, Smile, Mic, Send, Trash2, Pause, Play, X, Loader, CornerDownRight } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import Picker from 'emoji-picker-react';
import { GiphyPicker } from './GiphyPicker';
import { IGif } from '@giphy/js-types';
import imageCompression from 'browser-image-compression';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  chatId:        string;
  draft:         string;
  setDraft:      (t: string) => void;
  onSendMessage: (text: string, type?: 'text' | 'gif') => void;
  onSendFile:    (file: File, type: 'image' | 'audio' | 'video') => Promise<void> | void;
  onTyping?:     () => void;
  replyingTo?:   any;
  cancelReply?:  () => void;
}

export function ChatInput({
  chatId, draft, setDraft, onSendMessage, onSendFile, onTyping, replyingTo, cancelReply
}: ChatInputProps) {
  const [showEmoji,   setShowEmoji]   = useState(false);
  const [showGiphy,   setShowGiphy]   = useState(false);
  const [recState,    setRecState]    = useState<'idle' | 'recording' | 'paused'>('idle');
  const [recTime,     setRecTime]     = useState(0);
  const [isProcessing,setIsProcessing]= useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const textareaRef   = useRef<HTMLTextAreaElement>(null);
  const fileRef       = useRef<HTMLInputElement>(null);
  const recorderRef   = useRef<MediaRecorder | null>(null);
  const chunksRef     = useRef<Blob[]>([]);
  const recTimerRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    resize();
  }, [draft]);

  useEffect(() => {
    if (replyingTo) {
        textareaRef.current?.focus();
    }
  }, [replyingTo]);

  const resize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setDraft(v); setUploadError(null);
    resize();
    onTyping?.();
  };

  const onEmojiClick = (obj: any) => {
    const v = draft + obj.emoji;
    setDraft(v);
    setShowEmoji(false);
    textareaRef.current?.focus();
    setTimeout(resize, 0);
  };

  const handleGif = (gif: IGif) => {
    onSendMessage(gif.images.original.url, 'gif');
    setShowGiphy(false);
  };

  const send = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!draft.trim()) return;
    onSendMessage(draft.trim());
    setDraft('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  // ── Voice recording ──────────────────────────────────────────────────────
  const startRec = async () => {
    setUploadError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recorderRef.current = new MediaRecorder(stream, { audioBitsPerSecond: 64000 });
      chunksRef.current = [];
      recorderRef.current.ondataavailable = e => chunksRef.current.push(e.data);
      recorderRef.current.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        if (recTimerRef.current) clearInterval(recTimerRef.current);
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (blob.size > 10 * 1024 * 1024) {
          setUploadError('Voice message too large (max 10 MB).');
        } else if (blob.size > 0) {
          onSendFile(new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' }), 'audio');
        }
        setRecState('idle');
      };
      recorderRef.current.start();
      setRecState('recording');
      setRecTime(0);
      recTimerRef.current = setInterval(() => setRecTime(p => p + 1), 1000);
    } catch {
      setUploadError('Microphone access denied. Please enable it in browser settings.');
    }
  };

  const stopRec = () => {
    if (recorderRef.current && recState !== 'idle') recorderRef.current.stop();
  };
  const pauseRec = () => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.pause();
      if (recTimerRef.current) clearInterval(recTimerRef.current);
      setRecState('paused');
    }
  };
  const resumeRec = () => {
    if (recorderRef.current?.state === 'paused') {
      recorderRef.current.resume();
      setRecState('recording');
      recTimerRef.current = setInterval(() => setRecTime(p => p + 1), 1000);
    }
  };
  const cancelRec = () => {
    if (recorderRef.current) {
      recorderRef.current.onstop = null;
      recorderRef.current.stream?.getTracks().forEach(t => t.stop());
    }
    if (recTimerRef.current) clearInterval(recTimerRef.current);
    setRecState('idle'); setUploadError(null);
  };

  // ── File upload ──────────────────────────────────────────────────────────
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    if (file.size > 25 * 1024 * 1024) { setUploadError('File too large (max 25 MB).'); return; }

    let toSend = file;
    const type: 'image' | 'video' = file.type.startsWith('image/') ? 'image' : 'video';

    if (file.type.startsWith('image/')) {
      setIsProcessing(true);
      try {
        toSend = await imageCompression(file, { maxSizeMB: 0.4, maxWidthOrHeight: 1280, useWebWorker: true });
      } catch {
        setUploadError('Could not compress image.');
        setIsProcessing(false);
        return;
      } finally { setIsProcessing(false); }
    }

    setIsProcessing(true);
    try { await onSendFile(toSend, type); }
    catch { setUploadError('Upload failed. Please try again.'); }
    finally { setIsProcessing(false); if (e.target) e.target.value = ''; }
  };

  const fmtTime  = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const showSend = draft.trim() !== '' || recState !== 'idle';

  return (
    <footer className="fixed bottom-0 left-0 right-0 md:left-[360px] z-10 bg-black/50 backdrop-blur-2xl border-t border-white/[0.06] pb-16">
        {replyingTo && (
            <div className="bg-black/30 px-3 py-2.5 text-sm text-gray-300 flex justify-between items-center border-b border-white/[0.06]">
                <div className="flex items-center gap-3 min-w-0">
                    <CornerDownRight size={20} className="text-gray-400 flex-shrink-0" />
                    <div className="text-sm overflow-hidden">
                        <p className="font-semibold text-accent-cyan">
                            Replying
                        </p>
                        <p className="text-white/60 line-clamp-1 whitespace-pre-wrap">
                            {replyingTo.text || (replyingTo.type || 'message')}
                        </p>
                    </div>
                </div>
                <button onClick={cancelReply} className="p-1.5 rounded-full hover:bg-white/10 flex-shrink-0">
                    <X size={16} />
                </button>
            </div>
        )}

      {isProcessing && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent-pink to-accent-cyan animate-pulse" />
      )}

      {uploadError && (
        <p className="text-red-400 text-xs text-center py-1.5 px-4">{uploadError}</p>
      )}

      {showGiphy && (
         <div className="absolute bottom-full left-0 right-0 z-20 max-h-[60vh] overflow-y-auto">
          <GiphyPicker onGifClick={handleGif} />
          <button
            onClick={() => setShowGiphy(false)}
            className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-gray-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {showEmoji && (
        <div className="absolute bottom-full right-0 z-20 w-full sm:w-auto sm:right-2">
          <Picker onEmojiClick={onEmojiClick} pickerStyle={{ backgroundColor: '#0d0f1a', border: 'none' }} />
          <button
            onClick={() => setShowEmoji(false)}
            className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-gray-400"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2 px-3 py-2.5">

        {recState === 'idle' && (
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => { setUploadError(null); fileRef.current?.click(); }}
              disabled={isProcessing}
              className="p-2 text-gray-300 hover:text-white transition-colors disabled:opacity-40"
            >
              {isProcessing ? <Loader size={20} className="animate-spin" /> : <Paperclip size={20} />}
            </button>
            <button
              type="button"
              onClick={() => { setShowGiphy(false); setShowEmoji(v => !v); }}
              className="p-2 text-gray-300 hover:text-white transition-colors"
            >
              <Smile size={20} />
            </button>
            <button
              type="button"
              onClick={() => { setShowEmoji(false); setShowGiphy(v => !v); }}
              className="p-2 text-gray-300 hover:text-white transition-colors font-bold text-[11px]"
            >
              GIF
            </button>
          </div>
        )}

        <div className="flex-1 min-w-0">
          {recState !== 'idle' ? (
            <div className="flex items-center gap-2 bg-white/[0.07] rounded-2xl px-4 py-2.5 border border-white/[0.07]">
              <span className="w-2 h-2 rounded-full bg-accent-pink animate-pulse flex-shrink-0" />
              <span className="font-mono text-sm text-white tabular-nums">{fmtTime(recTime)}</span>
              <div className="flex-1" />
              {recState === 'recording'
                ? <button type="button" onClick={pauseRec}  className="p-1.5 rounded-full hover:bg-white/10 text-gray-300"><Pause size={18} /></button>
                : <button type="button" onClick={resumeRec} className="p-1.5 rounded-full hover:bg-white/10 text-gray-300"><Play  size={18} /></button>
              }
              <button type="button" onClick={cancelRec} className="p-1.5 rounded-full hover:bg-accent-pink/20 text-accent-pink">
                <Trash2 size={18} />
              </button>
            </div>
          ) : (
            <Textarea
              ref={textareaRef}
              value={draft}
              onChange={handleChange}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Message…"
              rows={1}
              disabled={isProcessing}
              className="w-full bg-white/[0.07] border border-white/[0.07] rounded-2xl px-4 py-2.5 text-white text-[14px] placeholder-gray-600 focus:outline-none focus:border-accent-cyan/30 resize-none max-h-32 transition-all"
            />
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept="image/*,video/*"
          onChange={handleFile}
        />

        <motion.button
          type="button"
          whileTap={{ scale: 0.85 }}
          onClick={showSend
            ? (recState !== 'idle' ? stopRec : send)
            : startRec
          }
          disabled={isProcessing}
          className={cn(
            'p-3 rounded-full flex-shrink-0 transition-all disabled:opacity-40 shadow-lg',
            showSend
              ? 'bg-gradient-to-br from-accent-pink to-purple-600 text-white shadow-accent-pink/30'
              : 'bg-white/[0.08] text-gray-400 hover:bg-white/[0.12] hover:text-white'
          )}
        >
          {showSend ? <Send size={20} /> : <Mic size={20} />}
        </motion.button>
      </div>
    </footer>
  );
}
