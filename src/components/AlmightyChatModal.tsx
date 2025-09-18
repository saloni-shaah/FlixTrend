
"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, X, Bot, User, Brain, Heart, Palette, TrendingUp, Sparkles } from "lucide-react";
import { almightyChat } from "@/ai/flows/almighty-chat-flow";
import { AlmightyLogo } from "./AlmightyLogo";

const aiModels = [
    { id: 'vibe-check', name: 'Vibe Check', icon: <TrendingUp/>, color: 'text-accent-pink' },
    { id: 'brainwave', name: 'Brainwave', icon: <Brain/>, color: 'text-accent-cyan' },
    { id: 'creator', name: 'Creator', icon: <Palette/>, color: 'text-accent-purple' },
    { id: 'zenith', name: 'Zenith', icon: <Heart/>, color: 'text-accent-green' },
    { id: 'epoch', name: 'Epoch', icon: <Sparkles/>, color: 'text-brand-gold' },
];

export function AlmightyChatModal({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'model' | 'system', content: { text: string }[] }[]>([
      { role: 'system', content: [{ text: "Hey! I'm Almighty, your creative sidekick. What's the vibe? You can switch my personality at the top."}]}
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeModel, setActiveModel] = useState(aiModels[0].id);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user' as const, content: [{ text: input }] };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Filter out system messages from history before sending to the flow
      const chatHistory = messages.filter(m => m.role !== 'system');
      
      const response = await almightyChat({
        personality: activeModel,
        history: chatHistory,
        prompt: input
      });
      
      const modelMessage = { role: 'model' as const, content: [{ text: response }] };
      setMessages(prev => [...prev, modelMessage]);

    } catch (error) {
      console.error("AI chat error:", error);
      const errorMessage = { role: 'system' as const, content: [{ text: "Oops! Something went wrong. The AI might be taking a quick nap." }] };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center md:items-center md:justify-center bg-black/60" onClick={onClose}>
        <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
            className="w-full max-w-2xl h-[90vh] md:h-auto md:max-h-[80vh] bg-background/80 backdrop-blur-2xl rounded-t-3xl md:rounded-2xl flex flex-col overflow-hidden glass-card"
            onClick={e => e.stopPropagation()}
        >
            <header className="p-4 border-b border-glass-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <AlmightyLogo size={32} />
                    <h2 className="text-xl font-headline font-bold text-accent-cyan">Almighty AI</h2>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><X size={20} /></button>
            </header>
            
            <div className="p-4 border-b border-glass-border shrink-0">
                <div className="flex justify-center items-center gap-2 overflow-x-auto">
                    {aiModels.map(model => (
                        <button key={model.id} onClick={() => setActiveModel(model.id)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${activeModel === model.id ? `${model.color.replace('text-', 'bg-')} bg-opacity-20 ${model.color}` : 'bg-transparent text-gray-400 hover:bg-white/5'}`}>
                            {model.icon}
                            {model.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 max-w-[85%] ${msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-accent-pink' : 'bg-accent-purple'}`}>
                            {msg.role === 'user' ? <User size={16}/> : <Bot size={16}/>}
                        </div>
                        <div className={`px-4 py-2 rounded-2xl font-body ${msg.role === 'user' ? 'bg-accent-pink/20 rounded-br-none' : msg.role === 'model' ? 'bg-accent-purple/20 rounded-bl-none' : 'bg-gray-700 text-center self-center w-full'}`}>
                            {msg.content[0].text}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="self-start flex items-center gap-2 text-gray-400">
                        <Bot size={20}/>
                        <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        >
                            Typing...
                        </motion.div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <footer className="p-4 border-t border-glass-border shrink-0">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                        placeholder="Message Almighty..."
                        className="input-glass w-full pr-12"
                        disabled={isLoading}
                    />
                    <button onClick={handleSend} disabled={isLoading || !input.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-accent-cyan text-black disabled:opacity-50">
                        <Send size={20} />
                    </button>
                </div>
            </footer>
        </motion.div>
    </div>
  );
}
