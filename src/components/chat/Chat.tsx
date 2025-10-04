
"use client";

import React, { useState, useEffect, useRef } from "react";
import { getFirestore, collection, query, onSnapshot, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, app } from "@/utils/firebaseClient";
import { Send, Bot, User, UploadCloud, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getAlmightyResponse, remixImageAction, generateImageAction } from "@/app/actions";
import './Chat.css';

const storage = getStorage(app);

// This function now runs on the client!
async function uploadFileToFirebaseStorageClient(file: File, user: any) {
    if (!user || !file) {
        throw new Error('Authentication or file is missing for upload.');
    }
    const fileName = `${user.uid}-${Date.now()}-${file.name}`;
    const storageRef = ref(storage, `ai_generated_remix/${fileName}`); // Use a different folder for clarity
    const snapshot = await uploadBytes(storageRef, file, { contentType: file.type });
    return await getDownloadURL(snapshot.ref);
}

// Helper to convert File to Data URI
const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};


function ChatMessageLoading() {
  return (
    <div className="flex items-start gap-3 animate-fade-in p-2 self-start">
      <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
        <Bot className="h-5 w-5 text-accent-purple" />
      </div>
      <div className="chat-bubble bot-bubble">
        <div className="flex items-center justify-center space-x-1">
            <span className="sr-only">Loading...</span>
            <div className="h-2 w-2 animate-pulse rounded-full bg-accent-cyan [animation-delay:-0.3s]" />
            <div className="h-2 w-2 animate-pulse rounded-full bg-accent-cyan [animation-delay:-0.15s]" />
            <div className="h-2 w-2 animate-pulse rounded-full bg-accent-cyan" />
        </div>
      </div>
    </div>
  );
}

export function Chat() {
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isAlmightyLoading, setIsAlmightyLoading] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!currentUser) return;
        const chatId = `almighty-chat_${currentUser.uid}`;
        const q = query(
            collection(db, "chats", chatId, "messages"),
            orderBy("createdAt", "asc")
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            if (fetchedMessages.length === 0) {
                 setMessages([{
                    id: 'initial',
                    sender: 'almighty-bot',
                    text: "Hi! I'm Almighty, your AI companion. Ask me anything, or try `/imagine a futuristic city` to generate an image!",
                    createdAt: { toDate: () => new Date() } // Mock date for sorting
                }]);
            } else {
                setMessages(fetchedMessages);
            }
        });
        return () => unsubscribe();
    }, [currentUser]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isAlmightyLoading]);
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if(file.type.startsWith('image/')) {
                setImageFile(file);
                setImagePreview(URL.createObjectURL(file));
            } else {
                alert("Only image files are supported for remixing.");
            }
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !imageFile) || !currentUser) return;

        const textToSend = newMessage;
        const fileToSend = imageFile;

        setNewMessage("");
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";

        if(messages.length === 1 && messages[0].id === 'initial') {
            setMessages([]);
        }

        const chatId = `almighty-chat_${currentUser.uid}`;
        
        // --- TEXT TO IMAGE GENERATION ---
        if (textToSend.toLowerCase().startsWith('/imagine ')) {
            const prompt = textToSend.substring(8).trim();
            const userMessage = { sender: currentUser.uid, text: textToSend, createdAt: serverTimestamp(), type: 'text' };
            await addDoc(collection(db, "chats", chatId, "messages"), userMessage);
            setIsAlmightyLoading(true);
            try {
                const response = await generateImageAction({ prompt });
                if (response.success?.imageUrl) {
                    const aiImageMessage = { sender: 'almighty-bot', text: `Here's your image for: "${prompt}"`, imageUrl: response.success.imageUrl, createdAt: serverTimestamp(), type: 'image' };
                    await addDoc(collection(db, "chats", chatId, "messages"), aiImageMessage);
                } else {
                    throw new Error(response.failure || "The AI couldn't generate an image for that prompt.");
                }
            } catch (error: any) {
                const errorMessage = { sender: 'almighty-bot', text: `Sorry, I hit a snag: ${error.message}`, createdAt: serverTimestamp(), type: 'text' };
                await addDoc(collection(db, "chats", chatId, "messages"), errorMessage);
            } finally {
                setIsAlmightyLoading(false);
            }
        // --- IMAGE REMIXING ---
        } else if (fileToSend) {
            setIsAlmightyLoading(true);
            try {
                // First, save the user's message with the local preview
                const userMessage = { sender: currentUser.uid, text: textToSend, imageUrl: imagePreview, createdAt: serverTimestamp(), type: 'image' };
                await addDoc(collection(db, "chats", chatId, "messages"), userMessage);
                
                // Convert file to data URI for the AI
                const photoDataUri = await fileToDataUri(fileToSend);

                const remixResponse = await remixImageAction({ photoDataUri, prompt: textToSend });
                
                if (remixResponse.success?.remixedPhotoDataUri) {
                    // Upload the AI's remixed image (which is a data URI) to storage
                    const remixedBlob = await (await fetch(remixResponse.success.remixedPhotoDataUri)).blob();
                    const remixedFile = new File([remixedBlob], `remix-${Date.now()}.png`, { type: remixedBlob.type });
                    const finalImageUrl = await uploadFileToFirebaseStorageClient(remixedFile, currentUser);

                    const aiImageMessage = { sender: 'almighty-bot', text: 'Here is your remixed image!', imageUrl: finalImageUrl, createdAt: serverTimestamp(), type: 'image' };
                    await addDoc(collection(db, "chats", chatId, "messages"), aiImageMessage);
                } else {
                    throw new Error(remixResponse.failure || "The AI couldn't remix the image.");
                }

            } catch (error: any) {
                const errorMessage = { sender: 'almighty-bot', text: `Sorry, I hit a snag while remixing: ${error.message}`, createdAt: serverTimestamp(), type: 'text' };
                await addDoc(collection(db, "chats", chatId, "messages"), errorMessage);
            } finally {
                setIsAlmightyLoading(false);
            }
        // --- REGULAR CHAT ---
        } else {
            const userMessage = { sender: currentUser.uid, text: textToSend, createdAt: serverTimestamp(), type: 'text' };
            await addDoc(collection(db, "chats", chatId, "messages"), userMessage);
            setIsAlmightyLoading(true);
            const currentContext = messages.map(m => `${m.sender === currentUser.uid ? 'User' : 'Almighty'}: ${m.text}`).join('\n');
            
            try {
                const response = await getAlmightyResponse({
                    userName: currentUser.displayName || 'User',
                    message: textToSend,
                    context: currentContext,
                });

                if (!response) {
                    throw new Error("The AI service returned an unexpected error.");
                }
                
                if (response.success?.response) {
                    const assistantMessage = { sender: 'almighty-bot', text: response.success.response, createdAt: serverTimestamp(), type: 'text' };
                    await addDoc(collection(db, "chats", chatId, "messages"), assistantMessage);
                } else {
                    throw new Error(response.failure || "The AI didn't provide a response.");
                }
            } catch (error: any) {
                console.error("AI Response Error:", error);
                const errorMessage = { sender: 'almighty-bot', text: "Yikes, my brain just glitched. Try that again? 😅", createdAt: serverTimestamp(), type: 'text' };
                await addDoc(collection(db, "chats", chatId, "messages"), errorMessage);
            } finally {
                setIsAlmightyLoading(false);
            }
        }
    };

    return (
        <div className="chat-container">
            <div className="chat-header">
                <Bot className="text-accent-purple" />
                <h2 className="text-xl font-headline font-bold text-accent-cyan">Almighty AI</h2>
                <p className="text-xs text-gray-400">Your Gen-Z AI Companion</p>
            </div>
            <div className="chat-messages">
                <AnimatePresence>
                    {messages.map(msg => {
                        const isUser = msg.sender === currentUser?.uid;
                        return (
                            <motion.div
                                key={msg.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`chat-message-wrapper ${isUser ? 'user-message' : 'bot-message'}`}
                            >
                                <div className="avatar">
                                    {isUser ? <User /> : <Bot />}
                                </div>
                                <div className={`chat-bubble ${isUser ? 'user-bubble' : 'bot-bubble'}`}>
                                    {msg.text && <p>{msg.text}</p>}
                                    {msg.imageUrl && (
                                        <img src={msg.imageUrl} alt="chat content" className="mt-2 rounded-lg max-w-xs" />
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                {isAlmightyLoading && <ChatMessageLoading />}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSend} className="chat-input-form flex-col">
                {imagePreview && (
                    <div className="relative w-24 h-24 mb-2">
                        <img src={imagePreview} alt="upload preview" className="w-full h-full object-cover rounded-lg"/>
                        <button 
                            type="button" 
                            onClick={() => { setImageFile(null); setImagePreview(null); if(fileInputRef.current) fileInputRef.current.value = ""; }} 
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}
                <div className="flex w-full gap-2 items-center">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                     <button type="button" onClick={() => fileInputRef.current?.click()} className="chat-send-button !bg-gray-600">
                        <UploadCloud />
                    </button>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder={imageFile ? "Add a prompt to remix your image..." : "Ask or try '/imagine an astronaut...'"}
                        className="chat-input"
                    />
                    <button type="submit" className="chat-send-button" disabled={(!newMessage.trim() && !imageFile) || isAlmightyLoading}>
                        <Send />
                    </button>
                </div>
            </form>
        </div>
    );
}
