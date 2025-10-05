
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  getFirestore,
  collection,
  query,
  onSnapshot,
  orderBy,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  writeBatch,
  increment,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { auth, db } from '@/utils/firebaseClient';
import { Send, Bot, User, UploadCloud, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getAlmightyResponse,
  generateImageAction,
} from '@/app/actions';
import './Chat.css';

const storage = getStorage(db.app);

const USAGE_LIMITS = {
    text: { free: 30, premium: 90 },
    image: { free: 0, premium: 10 },
    search: { free: 1, premium: 5 }, // Example limit for search
};
type UsageType = keyof typeof USAGE_LIMITS;


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
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAlmightyLoading, setIsAlmightyLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const chatId = `almighty-chat_${currentUser.uid}`;
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      if (fetchedMessages.length === 0) {
        setMessages([
          {
            id: 'initial',
            sender: 'almighty-bot',
            text: "Hi! I'm Almighty, your AI companion. Ask me anything, or try `imagine a futuristic city` to generate an image!",
            createdAt: { toDate: () => new Date() }, // Mock date for sorting
          },
        ]);
      } else {
        setMessages(fetchedMessages);
      }
    });
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAlmightyLoading]);


  /**
   * Client-side function to check usage limits before calling a server action.
   */
  const checkAndIncrementUsage = async (userId: string, type: UsageType): Promise<{ allowed: boolean; message: string }> => {
    const userDocRef = doc(db, 'users', userId);

    try {
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        throw new Error("User profile not found.");
      }

      const userData = userDoc.data();
      const isPremium = userData.isPremium && (!userData.premiumUntil || userData.premiumUntil.toDate() > new Date());
      const userTier = isPremium ? 'premium' : 'free';

      const now = new Date();
      const usage = userData.aiUsage || {};
      const lastReset = usage.lastReset?.toDate() || new Date(0);
      
      const needsReset = now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear();
      
      const currentCount = needsReset ? 0 : (usage[`${type}Count`] || 0);
      const limit = USAGE_LIMITS[type][userTier];
      
      if (limit === 0) {
          return { allowed: false, message: `This feature is for Premium users only. Please upgrade to unlock.` };
      }

      if (currentCount >= limit) {
        return { allowed: false, message: `You have reached your monthly limit of ${limit} ${type} generations. Please upgrade to Premium for more.` };
      }

      // Increment the count in a transaction
      const batch = writeBatch(db);
      const newUsageData = needsReset ? {
          textCount: 0,
          imageCount: 0,
          searchCount: 0,
          [`${type}Count`]: 1,
          lastReset: serverTimestamp()
      } : {
          ...usage,
          [`${type}Count`]: increment(1),
      };
      batch.set(userDocRef, { aiUsage: newUsageData }, { merge: true });
      await batch.commit();

      return { allowed: true, message: "Usage allowed." };

    } catch (error: any) {
        console.error("Error in checkAndIncrementUsage:", error);
        return { allowed: false, message: error.message || "Could not verify usage limits." };
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    const textToSend = newMessage;
    setNewMessage('');
    
    if (messages.length === 1 && messages[0].id === 'initial') {
        setMessages([]);
    }

    const chatId = `almighty-chat_${currentUser.uid}`;
    
    const imagePromptMatch = textToSend.toLowerCase().match(/^(?:imagine|generate an image of)\s+(.*)/);
    
    // --- TEXT TO IMAGE GENERATION ---
    if (imagePromptMatch && imagePromptMatch[1]) {
        const usageCheck = await checkAndIncrementUsage(currentUser.uid, 'image');
        if (!usageCheck.allowed) {
            await addDoc(collection(db, 'chats', chatId, 'messages'), { sender: 'almighty-bot', text: usageCheck.message, createdAt: serverTimestamp(), type: 'text' });
            return;
        }

        await addDoc(collection(db, 'chats', chatId, 'messages'), { sender: currentUser.uid, text: textToSend, createdAt: serverTimestamp(), type: 'text' });
        setIsAlmightyLoading(true);
        try {
            const prompt = imagePromptMatch[1].trim();
            const response = await generateImageAction({ prompt, userId: currentUser.uid });
            if (response.success?.imageUrl) {
                await addDoc(collection(db, 'chats', chatId, 'messages'), { sender: 'almighty-bot', text: `Here's your image for: "${prompt}"`, imageUrl: response.success.imageUrl, createdAt: serverTimestamp(), type: 'image' });
            } else {
                throw new Error(response.failure || "The AI couldn't generate an image for that prompt.");
            }
        } catch (error: any) {
             await addDoc(collection(db, 'chats', chatId, 'messages'), { sender: 'almighty-bot', text: `Sorry, I hit a snag: ${error.message}`, createdAt: serverTimestamp(), type: 'text' });
        } finally {
            setIsAlmightyLoading(false);
        }

    // --- REGULAR CHAT ---
    } else {
        const searchPromptMatch = textToSend.toLowerCase().match(/^(?:search for|what is|who is)\s+(.*)/);
        const usageType = searchPromptMatch ? 'search' : 'text';

        const usageCheck = await checkAndIncrementUsage(currentUser.uid, usageType);
        if (!usageCheck.allowed) {
            await addDoc(collection(db, 'chats', chatId, 'messages'), { sender: 'almighty-bot', text: usageCheck.message, createdAt: serverTimestamp(), type: 'text' });
            return;
        }

        await addDoc(collection(db, 'chats', chatId, 'messages'), { sender: currentUser.uid, text: textToSend, createdAt: serverTimestamp(), type: 'text' });
        setIsAlmightyLoading(true);
        const currentContext = messages.map((m) => `${m.sender === currentUser.uid ? 'User' : 'Almighty'}: ${m.text}`).join('\n');
        
        try {
            const response = await getAlmightyResponse({ userName: currentUser.displayName || 'User', message: textToSend, context: currentContext, userId: currentUser.uid });
            if (response.failure) {
              throw new Error(response.failure);
            }

            if (response.success?.response) {
                await addDoc(collection(db, 'chats', chatId, 'messages'), { sender: 'almighty-bot', text: response.success.response, createdAt: serverTimestamp(), type: 'text' });
            } else {
                throw new Error("The AI didn't provide a response.");
            }
        } catch (error: any) {
            await addDoc(collection(db, 'chats', chatId, 'messages'), { sender: 'almighty-bot', text: `Yikes, my brain just glitched. Try that again? 😅 Error: ${error.message}`, createdAt: serverTimestamp(), type: 'text' });
        } finally {
            setIsAlmightyLoading(false);
        }
    }
  };


  return (
    <div className="chat-container">
      <div className="chat-header">
        <Bot className="text-accent-purple" />
        <h2 className="text-xl font-headline font-bold text-accent-cyan">
          Almighty AI
        </h2>
        <p className="text-xs text-gray-400">Your Gen-Z AI Companion</p>
      </div>
      <div className="chat-messages">
        <AnimatePresence>
          {messages.map((msg) => {
            const isUser = msg.sender === currentUser?.uid;
            const isBot = msg.sender === 'almighty-bot';
            return (
              <motion.div
                key={msg.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`chat-message-wrapper ${
                  isUser ? 'user-message' : 'bot-message'
                }`}
              >
                <div className="avatar">{isUser ? <User /> : <Bot />}</div>
                <div
                  className={`chat-bubble ${
                    isUser ? 'user-bubble' : 'bot-bubble'
                  }`}
                >
                  {msg.text && <p>{msg.text}</p>}
                  {msg.imageUrl && (
                    <div className="relative group mt-2">
                      <img
                        src={msg.imageUrl}
                        alt="chat content"
                        className="rounded-lg max-w-xs"
                      />
                      {isBot && (
                        <Link
                          href={`/create?type=media&imageUrl=${encodeURIComponent(
                            msg.imageUrl
                          )}`}
                        >
                          <div className="absolute top-2 right-2 bg-black/50 p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <UploadCloud size={20} />
                          </div>
                        </Link>
                      )}
                    </div>
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
        <div className="flex w-full gap-2 items-center">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder='Ask or `imagine an astronaut...`'
            className="chat-input"
          />
          <button
            type="submit"
            className="chat-send-button"
            disabled={!newMessage.trim() || isAlmightyLoading}
          >
            <Send />
          </button>
        </div>
      </form>
    </div>
  );
}
