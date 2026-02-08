'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Smile, Mic, Send, Trash2, Pause, Play, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import Picker from 'emoji-picker-react';
import { GiphyPicker } from './GiphyPicker'; // Import the new GiphyPicker component
import { IGif } from '@giphy/js-types';

// Props definition for the ChatInput component
interface ChatInputProps {
    chatId: string;
    draft: string;
    setDraft: (text: string) => void;
    onSendMessage: (text: string, type?: 'text' | 'gif') => void; // Allow message type
    onSendFile: (file: File, type: 'image' | 'audio') => void;
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

    useEffect(() => { setText(draft); }, [draft]);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newText = e.target.value;
        setText(newText);
        setDraft(newText);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    };
    
    const onEmojiClick = (emojiObject: any, event: MouseEvent) => {
        setText(prevText => prevText + emojiObject.emoji);
        setDraft(text + emojiObject.emoji);
        setShowEmojiPicker(false);
        textareaRef.current?.focus();
    };

    const handleGifClick = (gif: IGif) => {
        // Send the GIF URL as a special message type
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

    // --- Voice Recording Logic (omitted for brevity, no changes here) ---
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => audioChunksRef.current.push(event.data);

            mediaRecorderRef.current.onstop = () => {
                stream.getTracks().forEach(track => track.stop());
                if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
                
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                if (audioBlob.size > 0) {
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
            alert("Microphone access denied. Please enable it in your browser settings.");
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
            mediaRecorderRef.current.onstop = null; // Prevent onstop from firing and sending
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        setRecordingState('idle');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          onSendFile(file, 'image');
      }
      if (e.target) e.target.value = ''; // Reset input
    };
    
    const showSendButton = text.trim() !== '' || recordingState !== 'idle';

    return (
        <footer className="shrink-0 p-2 border-t border-accent-cyan/10 bg-black/60 relative">
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
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-accent-cyan shrink-0">
                            <Paperclip size={20}/>
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
                        />
                    )}
                </div>

                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                
                 {showSendButton ? (
                    <button 
                        type="button" 
                        onClick={recordingState !== 'idle' ? stopAndSendRecording : handleSendText} 
                        className="p-3 rounded-full bg-accent-cyan text-black shrink-0 self-end"
                    >
                        <Send size={20}/>
                    </button>
                ) : (
                    <button 
                        type="button" 
                        onClick={startRecording} 
                        className="p-3 rounded-full bg-accent-pink text-white shrink-0 self-end"
                    >
                        <Mic size={20}/>
                    </button>
                )}
            </form>
        </footer>
    );
}
