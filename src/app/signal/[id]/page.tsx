'use client';
import React, { useEffect, useState, useRef, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { getFirestore, collection, query, onSnapshot, orderBy, doc, getDoc, setDoc, addDoc, serverTimestamp, where, writeBatch, getDocs, updateDoc, deleteDoc, arrayUnion, arrayRemove, deleteField, Unsubscribe, limit } from "firebase/firestore";
import { auth, app } from "@/utils/firebaseClient";
import { Phone, Video, Paperclip, Mic, Send, ArrowLeft, Image as ImageIcon, X, Smile, Trash2, Users, UserPlus, UserX, Edit, Shield, EyeOff, LogOut, UploadCloud, UserCircle, Cake, MapPin, AtSign, User, Bot, Search, Check, Camera, Loader, Lock, Eye } from "lucide-react";
import { useAppState } from "@/utils/AppStateContext";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { MessageItem } from '@/components/signal/MessageItem';

const db = getFirestore(app);
const storage = getStorage(app);


function formatDateSeparator(date: Date) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (targetDate.getTime() === today.getTime()) return 'Today';
  if (targetDate.getTime() === yesterday.getTime()) return 'Yesterday';
  
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}


function ChatPage({ firebaseUser, userProfile, chatId }: { firebaseUser: any, userProfile: any, chatId: string }) {
    const router = useRouter();
    const { drafts, setDraft } = useAppState();
    const [selectedChat, setSelectedChat] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    
    const [isRecording, setIsRecording] = useState(false);
    const [isRecordingLocked, setIsRecordingLocked] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
    const micButtonRef = useRef<HTMLButtonElement>(null);
    const lockIconControls = useAnimation();


    const [selectionMode, setSelectionMode] = useState<'messages' | null>(null);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
    const [showCameraView, setShowCameraView] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);

    useEffect(() => {
        const draftForThisChat = drafts[chatId] || '';
        setNewMessage(draftForThisChat);
    }, [chatId, drafts]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newText = e.target.value;
        setNewMessage(newText);
        if (selectedChat) {
            setDraft(chatId, newText);

            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            
            const updateRef = doc(db, selectedChat.isGroup ? "groups" : "users", selectedChat.id);
            updateDoc(updateRef, {
                typing: arrayUnion(firebaseUser.uid)
            }).catch(() => {});

            typingTimeoutRef.current = setTimeout(() => {
                updateDoc(updateRef, {
                    typing: arrayRemove(firebaseUser.uid)
                }).catch(() => {});
            }, 3000);
        }
    };

    useEffect(() => {
        if (!chatId || !firebaseUser) return;
    
        const isGroupChat = !chatId.includes('_');
        let unsub: Unsubscribe;
    
        if (isGroupChat) {
            unsub = onSnapshot(doc(db, "groups", chatId), (doc) => {
                if (doc.exists()) {
                    setSelectedChat({ id: doc.id, ...doc.data(), isGroup: true });
                }
            });
        } else {
            const otherUserId = chatId.replace(firebaseUser.uid, '').replace('_', '');
            unsub = onSnapshot(doc(db, "users", otherUserId), (doc) => {
                if(doc.exists()) {
                    setSelectedChat({ id: doc.id, ...doc.data(), isGroup: false });
                }
            });
        }
    
        const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));
        const unsubMessages = onSnapshot(q, (snap) => {
             const newMessages = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
             const unreadMessages = newMessages.filter(msg => {
                return msg.sender !== firebaseUser.uid && !(msg.readBy || []).includes(firebaseUser.uid);
             });

             if (unreadMessages.length > 0) {
                 const batch = writeBatch(db);
                 unreadMessages.forEach(msg => {
                     const msgRef = doc(db, "chats", chatId, "messages", msg.id);
                     batch.update(msgRef, { readBy: arrayUnion(firebaseUser.uid) });
                 });
                 batch.commit().catch(e => console.error("Error marking messages as read:", e));
             }

            setMessages(newMessages);
        });
    
        return () => {
            unsub();
            unsubMessages();
        };
    }, [chatId, firebaseUser]);


    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

     const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            setCameraStream(stream);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Camera error:", err);
            alert("Camera access denied. Please enable it in your browser settings.");
            setShowCameraView(false);
        }
    };
    
    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
    };

    useEffect(() => {
        if (showCameraView) {
            startCamera();
        } else {
            stopCamera();
        }
        return stopCamera;
    }, [showCameraView]);
    
    const handleSend = async (e?: React.FormEvent, mediaUrl: string | null = null, type: 'text' | 'image' | 'video' | 'audio' = 'text') => {
        e?.preventDefault();
        if ((!newMessage.trim() && !mediaUrl) || !firebaseUser || !selectedChat) return;
        
        const textToSend = newMessage;
        setNewMessage("");
        setDraft(selectedChat.id, '');
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
        const messageData: any = {
            sender: firebaseUser.uid,
            createdAt: serverTimestamp(),
            type: type,
            readBy: [firebaseUser.uid],
            reactions: {},
            deletedFor: []
        };
    
        if (mediaUrl) {
            messageData.mediaUrl = mediaUrl;
            if (textToSend) messageData.text = textToSend; 
        } else {
            messageData.text = textToSend;
        }
    
        await addDoc(collection(db, "chats", chatId, "messages"), messageData);
    };

    const handleDeleteMessages = async (mode: 'me' | 'everyone') => {
        if (selectedItems.size === 0) return;
        
        const batch = writeBatch(db);
        selectedItems.forEach(messageId => {
            const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
            if (mode === 'me') {
                batch.update(msgRef, { deletedFor: arrayUnion(firebaseUser.uid) });
            } else {
                batch.delete(msgRef); // Firestore rules should prevent unauthorized deletion
            }
        });

        try {
            await batch.commit();
        } catch (error) {
            console.error("Error deleting messages:", error);
            alert("Could not delete messages.");
        } finally {
            setSelectionMode(null);
            setSelectedItems(new Set());
        }
    };
    
    const handleFileUpload = async (file: File, typeOverride?: 'audio') => {
        const user = auth.currentUser;
        if (!user) {
            setUploadError("You must be logged in to upload files.");
            return;
        }

        setIsUploading(true);
        setUploadError('');
        
        let previewUrl: string | null = null;
        if (!typeOverride) {
            previewUrl = URL.createObjectURL(file);
            setMediaPreview(previewUrl);
        }

        try {
            const path = typeOverride === 'audio' ? `voice_messages/${user.uid}` : `user_uploads/${user.uid}`;
            const fileName = `${Date.now()}-${file.name}`;
            const fileRef = storageRef(storage, `${path}/${fileName}`);
            
            const snapshot = await uploadBytes(fileRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            let type: 'image' | 'video' | 'audio' = typeOverride || (file.type.startsWith('video/') ? 'video' : 'image');
            
            await handleSend(undefined, downloadURL, type);

        } catch (error: any) {
            console.error("Upload failed:", error);
            setUploadError(error.message);
        } finally {
            setIsUploading(false);
            if(previewUrl) {
                URL.revokeObjectURL(previewUrl); 
                setMediaPreview(null);
            }
        }
    };


     const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setShowAttachmentMenu(false);
      const file = e.target.files?.[0];
      if (file) {
          handleFileUpload(file);
      }
      if (e.target) e.target.value = '';
    };

     const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            
            canvas.toBlob(async (blob) => {
                if (blob) {
                    const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
                    setShowCameraView(false);
                    await handleFileUpload(file);
                }
            }, 'image/jpeg');
        }
    };
    
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const audioFile = new File([audioBlob], `voice-message-${Date.now()}.webm`, { type: 'audio/webm' });
                await handleFileUpload(audioFile, 'audio');
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setRecordingTime(0);
            recordingTimerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (err) {
            console.error("Audio recording failed:", err);
            setUploadError("Microphone access denied.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
        }
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        setIsRecording(false);
        setIsRecordingLocked(false);
    };
    
    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.onstop = () => {
                 mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
            };
            mediaRecorderRef.current.stop();
        }
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        setIsRecording(false);
        setIsRecordingLocked(false);
    };

    const handleMicButtonTouchStart = (e: React.TouchEvent) => {
        e.preventDefault();
        lockIconControls.start({ y: 0, opacity: 1 });
        startRecording();
    };

    const handleMicButtonTouchMove = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        const lockElement = document.getElementById('lock-icon');
        if (lockElement) {
            const { top, right, bottom, left } = lockElement.getBoundingClientRect();
            if (touch.clientX > left && touch.clientX < right && touch.clientY > top && touch.clientY < bottom) {
                setIsRecordingLocked(true);
                 if (mediaRecorderRef.current && isRecording) {
                    lockIconControls.start({ y: -100, opacity: 0 });
                 }
            }
        }
    };

    const handleMicButtonTouchEnd = () => {
        lockIconControls.start({ y: -100, opacity: 0 });
        if (!isRecordingLocked) {
            stopRecording();
        }
    };
    
    const renderMessagesWithSeparators = () => {
        let lastDate: string | null = null;
        const messageElements = [];

        messages
            .filter(msg => !(msg.deletedFor || []).includes(firebaseUser.uid))
            .forEach(msg => {
                const msgDate = msg.createdAt?.toDate();
                if (msgDate) {
                    const dateString = msgDate.toDateString();
                    if (dateString !== lastDate) {
                        messageElements.push(
                            <div key={dateString} className="text-center my-4">
                                <span className="bg-gray-800 text-gray-400 text-xs font-bold px-3 py-1 rounded-full">{formatDateSeparator(msgDate)}</span>
                            </div>
                        );
                        lastDate = dateString;
                    }
                }
                
                const isUser = msg.sender === firebaseUser.uid;
                messageElements.push(
                    <MessageItem
                      key={msg.id}
                      msg={msg}
                      isUser={isUser}
                      selectedChat={selectedChat}
                      firebaseUser={firebaseUser}
                      isSelected={selectedItems.has(msg.id)}
                      selectionMode={selectionMode}
                      onLongPress={() => { setSelectionMode('messages'); setSelectedItems(new Set([msg.id])); }}
                      onClick={() => {
                        if (selectionMode === 'messages') {
                            const newSelection = new Set(selectedItems);
                            if (newSelection.has(msg.id)) {
                                newSelection.delete(msg.id);
                            } else {
                                newSelection.add(msg.id);
                            }
                            setSelectedItems(newSelection);
                            if (newSelection.size === 0) {
                                setSelectionMode(null);
                            }
                        }
                      }}
                      onShowEmojiPicker={setShowEmojiPicker}
                      showEmojiPicker={showEmojiPicker}
                      onShowDeleteConfirm={() => {
                        setSelectedItems(new Set([msg.id]));
                        setShowDeleteConfirm(true);
                      }}
                    />
                );
            });
            return messageElements;
    };


     if (showCameraView) {
        return (
            <div className="absolute inset-0 z-20 bg-black flex flex-col items-center justify-center">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"/>
                <canvas ref={canvasRef} className="hidden"></canvas>
                <div className="absolute bottom-4 flex items-center gap-4">
                     <button onClick={() => setShowCameraView(false)} className="p-3 bg-gray-800/70 rounded-full text-white"><X/></button>
                     <button onClick={handleCapture} className="w-20 h-20 rounded-full bg-white border-4 border-gray-400"></button>
                </div>
            </div>
        )
    }

    if (!selectedChat) {
        return <div className="flex h-screen w-full items-center justify-center text-accent-cyan">Loading Chat...</div>
    }

    return (
        <div className="flex-1 flex flex-col bg-black/40 h-full">
            {selectionMode === 'messages' ? (
                 <div className="p-3 border-b border-accent-cyan/10 flex items-center justify-between shrink-0 bg-accent-cyan/10">
                    <button onClick={() => { setSelectionMode(null); setSelectedItems(new Set()); }}><X size={24} /></button>
                    <span className="font-bold">{selectedItems.size} selected</span>
                    <button onClick={() => setShowDeleteConfirm(true)}><Trash2 size={24} /></button>
                </div>
            ) : (
                <div className="flex items-center gap-3 p-3 border-b border-accent-cyan/10 bg-black/60 shadow-md shrink-0">
                    <button onClick={() => router.push('/signal')} className="p-2 rounded-full hover:bg-accent-cyan/10"><ArrowLeft size={20}/></button>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent-pink to-accent-cyan flex items-center justify-center text-white font-bold text-lg overflow-hidden shrink-0">
                    {selectedChat.isGroup ? 
                            (selectedChat.avatar_url ? <img src={selectedChat.avatar_url} alt={selectedChat.name} className="w-full h-full object-cover"/> : <Users/>) :
                            (selectedChat.avatar_url ? <img src={selectedChat.avatar_url} alt="avatar" className="w-full h-full object-cover"/> : <UserCircle/>)
                    }
                    </div>
                    <div className="flex-1 text-left">
                        <h3 className="font-bold text-white">{selectedChat.name || selectedChat.username}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                    {!selectedChat.isGroup && <button className="p-2 rounded-full hover:bg-accent-cyan/10"><Video size={20}/></button>}
                    {!selectedChat.isGroup && <button className="p-2 rounded-full hover:bg-accent-cyan/10"><Phone size={20}/></button>}
                    </div>
                </div>
            )}
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
                {renderMessagesWithSeparators()}
                <div ref={messagesEndRef} />
            </div>

            <div className="shrink-0 p-2 border-t border-accent-cyan/10 bg-black/60 relative">
                 <AnimatePresence>
                 {showAttachmentMenu && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-full left-2 w-48 bg-gray-800 rounded-lg shadow-lg p-2 flex flex-col gap-1"
                    >
                        <button type="button" onClick={() => { setShowAttachmentMenu(false); setShowCameraView(true); }} className="btn-glass text-sm justify-start gap-2 text-white"><Camera/> Take Photo</button>
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-glass text-sm justify-start gap-2 text-white"><ImageIcon/> Upload Image</button>
                    </motion.div>
                )}
                </AnimatePresence>
                <form onSubmit={handleSend} className="flex items-center gap-2">
                    {!isRecordingLocked && (
                        <div className="flex items-center">
                            <button type="button" onClick={() => setShowAttachmentMenu(v => !v)} className="p-2 text-gray-400 hover:text-accent-cyan shrink-0">
                                <Paperclip size={20}/>
                            </button>
                            <button type="button" className="p-2 text-gray-400 hover:text-accent-cyan shrink-0" onClick={() => {
                                const input = inputRef.current;
                                if (input) {
                                    try {
                                        if('showPicker' in HTMLInputElement.prototype) {
                                            (input as any).showPicker();
                                        }
                                    } catch(e) {
                                        console.warn("Could not programmatically open emoji keyboard.");
                                    }
                                }
                            }}>
                                <Smile size={20}/>
                            </button>
                        </div>
                    )}
                    
                    {isRecordingLocked ? (
                        <div className="flex-1 flex items-center gap-3 bg-gray-700 rounded-full px-4 py-2">
                            <button type="button" onClick={cancelRecording} className="text-red-400">Cancel</button>
                            <div className="flex-1 text-center text-red-400 animate-pulse font-mono">{Math.floor(recordingTime / 60).toString().padStart(2, '0')}:{ (recordingTime % 60).toString().padStart(2, '0')}</div>
                        </div>
                    ) : (
                        <div className="flex-1 relative flex items-center">
                            <input 
                                ref={inputRef}
                                type="text" 
                                value={newMessage} 
                                onChange={handleInputChange} 
                                placeholder={isRecording ? "Recording..." : "Type a message..."} 
                                className="flex-1 bg-gray-700 rounded-full px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent-cyan w-full pr-10"
                            />
                        </div>
                    )}

                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*" />
                    <AnimatePresence mode="wait">
                    {newMessage.trim() === "" && !isRecordingLocked ? (
                        <div className="relative">
                            <motion.div 
                                id="lock-icon"
                                className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 p-2 bg-gray-800 rounded-full pointer-events-none"
                                animate={lockIconControls}
                                initial={{ y: -100, opacity: 0 }}
                            >
                                <Lock size={20} />
                            </motion.div>
                            <motion.button 
                                key="mic"
                                ref={micButtonRef}
                                onTouchStart={handleMicButtonTouchStart}
                                onTouchEnd={handleMicButtonTouchEnd}
                                onTouchMove={handleMicButtonTouchMove}
                                animate={{ scale: isRecording ? 1.2 : 1 }}
                                type="button" 
                                className={`p-3 rounded-full transition-colors shrink-0 ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-accent-pink text-white'}`}
                            >
                                <Mic size={20}/>
                            </motion.button>
                        </div>
                    ) : (
                            <motion.button 
                                key="send"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                                type="button" 
                                className="p-3 rounded-full bg-accent-cyan text-black shrink-0"
                                onClick={isRecordingLocked ? stopRecording : (e) => handleSend(e)}
                            >
                                <Send size={20}/>
                            </motion.button>
                    )}
                    </AnimatePresence>
                </form>
            </div>
             <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Message(s)?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                         <AlertDialogAction
                            onClick={() => handleDeleteMessages('me')}
                            className="bg-yellow-600 hover:bg-yellow-700"
                        >
                            Delete for Me
                        </AlertDialogAction>
                        <AlertDialogAction
                             onClick={() => handleDeleteMessages('everyone')}
                             className="bg-red-600 hover:bg-red-700"
                        >
                            Delete for Everyone
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

function ChatPageWrapper() {
    const params = useParams();
    const chatId = params.id as string;
    const [firebaseUser, setFirebaseUser] = useState<any>(null);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
  
    useEffect(() => {
      const unsub = auth.onAuthStateChanged(async (user) => {
        if (user) {
          setFirebaseUser(user);
          const userDocRef = doc(db, "users", user.uid);
          const unsubProfile = onSnapshot(userDocRef, (userDocSnap) => {
            if (userDocSnap.exists()) {
              setUserProfile({ ...user, ...userDocSnap.data() });
            } else {
              setUserProfile(user);
            }
            setLoading(false);
          });
          return () => unsubProfile();
        } else {
          router.push('/login');
          setLoading(false);
        }
      });
      return () => unsub();
    }, [router]);
    
    if (loading || !firebaseUser || !userProfile) {
      return <div className="flex h-screen items-center justify-center text-accent-cyan"><Loader className="animate-spin" /> Loading Chat...</div>;
    }
    
    return <ChatPage firebaseUser={firebaseUser} userProfile={userProfile} chatId={chatId} />;
  }

export default function SignalChatPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center text-accent-cyan"><Loader className="animate-spin" /> Loading Chat...</div>}>
            <ChatPageWrapper />
        </Suspense>
    )
}
