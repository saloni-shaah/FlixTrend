"use client";

import React, { useState, useEffect, useRef } from "react";
import { getFirestore, collection, query, onSnapshot, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/utils/firebaseClient";
import { Send, Bot, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getAlmightyResponse } from "@/app/actions";
import './Chat.css';

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
    const messagesEndRef = useRef<HTMLDivElement>(null);

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
            setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [currentUser]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isAlmightyLoading]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUser) return;

        const textToSend = newMessage;
        setNewMessage("");

        const chatId = `almighty-chat_${currentUser.uid}`;
        const userMessage = {
            sender: currentUser.uid,
            text: textToSend,
            createdAt: serverTimestamp(),
            type: 'text'
        };
        await addDoc(collection(db, "chats", chatId, "messages"), userMessage);

        setIsAlmightyLoading(true);

        const currentContext = messages.map(m => `${m.sender === currentUser.uid ? 'User' : 'Almighty'}: ${m.text}`).join('\n');
        
        try {
            const response = await getAlmightyResponse({
                userName: currentUser.displayName || 'User',
                message: textToSend,
                context: currentContext,
            });

            if (response.success) {
                const assistantMessage = {
                    sender: 'almighty-bot',
                    text: response.success.response,
                    createdAt: serverTimestamp(),
                    type: 'text'
                };
                await addDoc(collection(db, "chats", chatId, "messages"), assistantMessage);
            } else {
                throw new Error(response.failure || "Unknown AI error");
            }
        } catch (error) {
            console.error("AI Response Error:", error);
            const errorMessage = {
                sender: 'almighty-bot',
                text: "Yikes, my brain just glitched. Try that again? 😅",
                createdAt: serverTimestamp(),
                type: 'text'
            };
            await addDoc(collection(db, "chats", chatId, "messages"), errorMessage);
        } finally {
            setIsAlmightyLoading(false);
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
                                    {msg.text}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                {isAlmightyLoading && <ChatMessageLoading />}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSend} className="chat-input-form">
                <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Ask Almighty anything..."
                    className="chat-input"
                />
                <button type="submit" className="chat-send-button" disabled={!newMessage.trim() || isAlmightyLoading}>
                    <Send />
                </button>
            </form>
        </div>
    );
}
