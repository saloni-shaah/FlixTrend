"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Bot } from 'lucide-react';
import { almightyChat, ChatMessage } from '@/ai/flows/almighty-chat-flow';
import { auth, db } from '@/utils/firebaseClient';
import { doc, getDoc } from 'firebase/firestore';
import { AlmightyLogo } from './AlmightyLogo';

export function AlmightyChatModal({ onClose }: { onClose: () => void }) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const unsub = auth.onAuthStateChanged(async user => {
            if (user) {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                setCurrentUser({
                    uid: user.uid,
                    displayName: user.displayName,
                    ...(userDoc.exists() ? userDoc.data() : {})
                });
            } else {
                setCurrentUser({ uid: 'guest', displayName: 'Guest' });
            }
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim() || !currentUser) return;

        const userMessage: ChatMessage = {
            role: 'user',
            parts: [{ text: input }],
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await almightyChat({
                history: [...messages, userMessage],
                userId: currentUser.uid,
                displayName: currentUser.displayName,
            });

            if (response.toolResponse) {
                // For now, just display a generic message about tool use.
                // In a real app, you'd handle the specific tool output (e.g., show a "call started" UI).
                const toolMessage: ChatMessage = {
                    role: 'model',
                    parts: [{ text: `Okay, I've actioned that for you! Here's the result: ${JSON.stringify(response.toolResponse.output)}` }],
                };
                 setMessages(prev => [...prev, toolMessage]);
            } else if (response.textResponse) {
                const modelMessage: ChatMessage = {
                    role: 'model',
                    parts: [{ text: response.textResponse }],
                };
                setMessages(prev => [...prev, modelMessage]);
            }

        } catch (error) {
            console.error("Almighty Chat Error:", error);
            const errorMessage: ChatMessage = {
                role: 'model',
                parts: [{ text: "Oops! Something went wrong on my end. Please try again." }],
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="glass-card p-0 w-full max-w-lg h-[80vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-glass-border">
                    <div className="flex items-center gap-3">
                        <AlmightyLogo size={32} />
                        <h2 className="text-xl font-headline font-bold text-accent-purple">Almighty AI</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 max-w-[85%] ${msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}>
                            {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-accent-purple flex items-center justify-center shrink-0 mt-1"><Bot size={20}/></div>}
                            <div className={`px-4 py-2 rounded-2xl font-body ${msg.role === 'user' ? 'bg-accent-cyan text-black rounded-br-none' : 'bg-gray-700 text-white rounded-bl-none'}`}>
                                {msg.parts[0].text}
                            </div>
                        </div>
                    ))}
                     {loading && (
                        <div className="self-start flex items-start gap-3">
                             <div className="w-8 h-8 rounded-full bg-accent-purple flex items-center justify-center shrink-0 mt-1"><Bot size={20}/></div>
                             <div className="px-4 py-2 rounded-2xl bg-gray-700 flex items-center gap-2">
                                <motion.div className="w-2 h-2 bg-white rounded-full" animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.8, repeat: Infinity }}/>
                                <motion.div className="w-2 h-2 bg-white rounded-full" animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.8, delay: 0.2, repeat: Infinity }}/>
                                <motion.div className="w-2 h-2 bg-white rounded-full" animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.8, delay: 0.4, repeat: Infinity }}/>
                             </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSend} className="flex items-center gap-2 p-4 border-t border-glass-border">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Ask Almighty anything..."
                        className="input-glass flex-1"
                        disabled={loading}
                    />
                    <button type="submit" className="btn-glass-icon w-12 h-12 bg-accent-cyan" disabled={loading || !input.trim()}>
                        <Send />
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
