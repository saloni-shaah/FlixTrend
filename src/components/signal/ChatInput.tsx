'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Smile, Mic, Send, Trash2, Pause, Play, X, Loader } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import Picker from 'emoji-picker-react';
import { GiphyPicker } from './GiphyPicker';
import { IGif } from '@giphy/js-types';
import imageCompression from 'browser-image-compression';

interface ChatInputProps {
    chatId: string;
    draft: string;
    setDraft: (text: string) => void;
    onSendMessage: (text: string, type?: 'text' | 'gif') => void;
    onSendFile: (file: File, type: 'image' | 'audio' | 'video') => void;
}

export function ChatInput({ chatId, draft, setDraft, onSendMessage, onSendFile }: ChatInputProps) {
    const [text, setText] = useState(draft);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showGiphyPicker, setShowGiphyPicker] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'paused'>('idle');
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [isCompressing, setIsCompressing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => { setText(draft); }, [draft]);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newText = e.target.value;
        setText(newText);
        setDraft(newText);
        setUploadError(null);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    };
    
    const onEmojiClick = (emojiObject: any, event: MouseEvent) => {
        const newText = text + emojiObject.emoji;
        setText(newText);
        setDraft(newText);
        setShowEmojiPicker(false);
        textareaRef.current?.focus();
    };

    const handleGifClick = (gif: IGif) => {
        onSendMessage(gif.images.original.url, 'gif');
        setShowGiphyPicker(false);
    };

    const handleSendText = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (text.trim()) {
            onSendMessage(text.trim());
            setText('');
            setDraft('');
            if (textareaRef.current) textareaRef.current.style.height = 'auto';
        }
    };

    const startRecording = async () => {
        setUploadError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream, { audioBitsPerSecond: 64000 }); 
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => audioChunksRef.current.push(event.data);

            mediaRecorderRef.current.onstop = () => {
                stream.getTracks().forEach(track => track.stop());
                if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
                
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                 if (audioBlob.size > 10 * 1024 * 1024) { // 10MB limit
                    setUploadError(`Voice message is too large (max 10MB).`);
                } else if (audioBlob.size > 0) {
                     const audioFile = new File([audioBlob], `voice-message-${Date.now()}.webm`, { type: 'audio/webm' });
                     onSendFile(audioFile, 'audio');
                }
                setRecordingState('idle');
            };
            
            mediaRecorderRef.current.start();
            setRecordingState('recording');
            setRecordingTime(0);
            recordingTimerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);

        } catch (err) {
            console.error("Audio recording failed:", err);
            setUploadError("Microphone access denied. Please enable it in your browser settings.");
        }
    };

    const stopAndSendRecording = () => {
        if (mediaRecorderRef.current && (recordingState === 'recording' || recordingState === 'paused')) {
            mediaRecorderRef.current.stop();
        }
    };

    const pauseRecording = () => {
        if (mediaRecorderRef.current && recordingState === 'recording') {
            mediaRecorderRef.current.pause();
            if(recordingTimerRef.current) clearInterval(recordingTimerRef.current);
            setRecordingState('paused');
        }
    };

    const resumeRecording = () => {
        if (mediaRecorderRef.current && recordingState === 'paused') {
            mediaRecorderRef.current.resume();
            setRecordingState('recording');
            recordingTimerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.onstop = null; 
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        setRecordingState('idle');
        setUploadError(null);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          if (file.size > 25 * 1024 * 1024) { // 25MB limit
            setUploadError(`File is too large (max 25MB).`);
            return;
          }
          setUploadError(null);
          
          let fileToSend = file;
          let fileType: 'image' | 'video' = file.type.startsWith('image/') ? 'image' : 'video';

          if (file.type.startsWith('image/')) {
              setIsCompressing(true);
              try {
                  const options = {
                      maxSizeMB: 0.4,
                      maxWidthOrHeight: 1280,
                      useWebWorker: true,
                  }
                  fileToSend = await imageCompression(file, options);
              } catch (error) {
                  console.error("Image compression error: ", error);
                  setUploadError("Could not compress the image.");
                  setIsCompressing(false);
                  return;
              } finally {
                  setIsCompressing(false);
              }
          }

          setIsUploading(true);
          try {
            await onSendFile(fileToSend, fileType);
          } catch (error) {
            console.error("File send error: ", error);
            setUploadError("Could not send the file.");
          } finally {
            setIsUploading(false);
          }
      }
      if (e.target) e.target.value = ''; // Reset input
    };
    
    const showSendButton = text.trim() !== '' || recordingState !== 'idle';
    const isProcessingFile = isCompressing || isUploading;

    return (
        <footer className="fixed bottom-0 left-0 right-0 md:left-1/3 p-4 bg-black/60 border-t border-accent-cyan/10 z-10 pb-18">
            {(isProcessingFile) && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-accent-pink animate-pulse"></div>
            )}
            {uploadError && <p className="text-red-400 text-xs text-center pb-2">{uploadError}</p>}
            {showGiphyPicker && (
                <div className="absolute bottom-full right-0 left-0 z-10">
                     <GiphyPicker onGifClick={handleGifClick} />
                     <button onClick={() => setShowGiphyPicker(false)} className="absolute top-2 right-2 text-gray-400 hover:text-white bg-gray-800 rounded-full p-1">
                        <X size={20}/>
                    </button>
                </div>
            )}
            {showEmojiPicker && (
                <div className="absolute bottom-full right-2 z-10">
                    <Picker onEmojiClick={onEmojiClick} pickerStyle={{ width: '100%', backgroundColor: '#1f2937' }} />
                     <button onClick={() => setShowEmojiPicker(false)} className="absolute top-2 right-2 text-gray-400 hover:text-white">
                        <X size={20}/>
                    </button>
                </div>
            )}
            <form onSubmit={handleSendText} className="flex items-end gap-2">
                {recordingState === 'idle' && (
                    <div className="flex items-center">
                         <button type="button" onClick={() => { setUploadError(null); fileInputRef.current?.click(); }} className={`p-2 text-gray-400 hover:text-accent-cyan shrink-0 ${isProcessingFile ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={isProcessingFile}>
                            {isProcessingFile ? <Loader className="animate-spin" size={20} /> : <Paperclip size={20} />}
                        </button>
                         <button type="button" onClick={() => setShowEmojiPicker(v => !v)} className="p-2 text-gray-400 hover:text-accent-cyan shrink-0">
                            <Smile size={20}/>
                        </button>
                         <button type="button" onClick={() => setShowGiphyPicker(v => !v)} className="p-2 text-gray-400 hover:text-accent-cyan shrink-0 font-bold text-xs">
                            GIF
                        </button>
                    </div>
                )}
                
                <div className="flex-1 flex items-center">
                    {recordingState !== 'idle' ? (
                       <div className="w-full flex items-center gap-2 bg-gray-700 rounded-full px-4 py-2 text-white">
                             <Mic size={20} className="text-purple-400" />
                             <span className="font-mono text-sm">{Math.floor(recordingTime / 60).toString().padStart(2, '0')}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
                             <div className="flex-1"></div>
                             {recordingState === 'recording' && <button type="button" onClick={pauseRecording} className="p-2 rounded-full hover:bg-gray-600"><Pause size={20}/></button>}
                             {recordingState === 'paused' && <button type="button" onClick={resumeRecording} className="p-2 rounded-full hover:bg-gray-600"><Play size={20}/></button>}
                             <button type="button" onClick={cancelRecording} className="p-2 rounded-full hover:bg-red-500"><Trash2 size={20}/></button>
                        </div>
                    ) : (
                        <Textarea 
                            ref={textareaRef}
                            value={text} 
                            onChange={handleInputChange} 
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { handleSendText(e as any); } }}
                            placeholder="Type a message..." 
                            className="flex-1 bg-gray-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent-cyan w-full pr-10 resize-none max-h-32"
                            rows={1}
                            disabled={isProcessingFile}
                        />
                    )}
                </div>

                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*" />
                
                 {showSendButton ? (
                    <button 
                        type="button" 
                        onClick={recordingState !== 'idle' ? stopAndSendRecording : handleSendText} 
                        className="p-3 rounded-full bg-accent-cyan text-black shrink-0 self-end"
                        disabled={isProcessingFile}
                    >
                        <Send size={20}/>
                    </button>
                ) : (
                    <button 
                        type="button" 
                        onClick={startRecording} 
                        className="p-3 rounded-full bg-accent-pink text-white shrink-0 self-end"
                        disabled={isProcessingFile}
                    >
                        <Mic size={20}/>
                    </button>
                )}
            </form>
        </footer>
    );
}
