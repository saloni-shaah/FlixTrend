'use client';
import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Smile, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getFirestore, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { app } from '@/utils/firebaseClient';

const db = getFirestore(app);


// --- HELPER FUNCTIONS ---

const anonymousNames = ["Ram", "Shyam", "Sita", "Mohan", "Krishna", "Radha", "Anchal", "Anaya", "Advik", "Diya", "Rohan", "Priya", "Arjun", "Saanvi", "Kabir"];
const generateAnonymousName = (userId: string, chatId: string) => {
    const hash = (str: string) => {
        let h = 0;
        for (let i = 0; i < str.length; i++) {
            h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
        }
        return h;
    };
    const nameIndex = Math.abs(hash(userId + chatId)) % anonymousNames.length;
    const num = Math.abs(hash(chatId + userId)) % 900 + 100;
    return `${anonymousNames[nameIndex]}${num}`;
};

const useLongPress = (callback: () => void, ms = 300) => {
    const timerRef = React.useRef<NodeJS.Timeout>();
    const onTouchStart = () => { timerRef.current = setTimeout(callback, ms); };
    const onTouchEnd = () => { if (timerRef.current) clearTimeout(timerRef.current); };
    return { onTouchStart, onTouchEnd, onMouseDown: onTouchStart, onMouseUp: onTouchEnd, onMouseLeave: onTouchEnd };
};

// --- COMPONENT DEFINITION ---

export const MessageItem = React.memo(({ msg, isUser, selectedChat, firebaseUser, isSelected, onLongPress, onClick, onShowEmojiPicker, showEmojiPicker, onShowDeleteConfirm, selectionMode }: any) => {
    const longPressProps = useLongPress(() => {
        if (selectionMode) {
            onClick();
        } else {
            onLongPress();
        }
    });

    const senderInfo = selectedChat.isGroup ? (selectedChat.groupType === 'simple' ? selectedChat.memberInfo?.[msg.sender] : null) : selectedChat;
    const displayName = selectedChat.groupType === 'anonymous' ? generateAnonymousName(msg.sender, selectedChat.id) : selectedChat.groupType === 'pseudonymous' ? selectedChat.pseudonyms?.[msg.sender] || 'Anon' : senderInfo?.name || "User";
    const defaultReactions = ["👍", "❤️", "😂", "😢", "😮", "🙏"];

    const handleReact = async (emoji: string) => {
        if (!firebaseUser) return;
        const messageRef = doc(db, 'chats', selectedChat.id, 'messages', msg.id);
        const currentReactions = msg.reactions || {};
        let newReactions = { ...currentReactions };
        let userHasReacted = false;
        let previousEmoji = '';

        // Check if user has already reacted and with which emoji
        for (const [e, uids] of Object.entries(newReactions)) {
            if (Array.isArray(uids) && uids.includes(firebaseUser.uid)) {
                userHasReacted = true;
                previousEmoji = e;
                break;
            }
        }

        // If user is re-reacting with the same emoji, remove it
        if (userHasReacted && previousEmoji === emoji) {
            newReactions[previousEmoji] = newReactions[previousEmoji].filter((uid: string) => uid !== firebaseUser.uid);
            if (newReactions[previousEmoji].length === 0) {
                delete newReactions[previousEmoji];
            }
        } else {
            // If user had a previous reaction, remove it
            if (userHasReacted) {
                newReactions[previousEmoji] = newReactions[previousEmoji].filter((uid: string) => uid !== firebaseUser.uid);
                 if (newReactions[previousEmoji].length === 0) {
                    delete newReactions[previousEmoji];
                }
            }
            // Add new reaction
            if (!newReactions[emoji]) {
                newReactions[emoji] = [];
            }
            newReactions[emoji].push(firebaseUser.uid);
        }

        await updateDoc(messageRef, { reactions: newReactions });
        onShowEmojiPicker(null);
    };

    const getSeenStatus = () => {
        if (!isUser || msg.sender === 'system') return 'none';
        const otherParticipantIds = selectedChat.isGroup
            ? selectedChat.members.filter((id: string) => id !== firebaseUser.uid)
            : [selectedChat.id];
        
        const readers = msg.readBy || [];
        const allOthersHaveRead = otherParticipantIds.every((id: string) => readers.includes(id));
        
        if (allOthersHaveRead) return 'all_seen';
        if (readers.length > 1) return 'delivered'; // Delivered to at least one other person
        return 'sent'; // Only sent by user
    };

    const seenStatus = getSeenStatus();

    return (
        <div 
            key={msg.id} 
            onClick={onClick}
            {...longPressProps}
            className={cn("group flex w-full items-end gap-2", isUser ? "justify-end" : msg.sender === 'system' ? 'justify-center' : "justify-start", selectionMode === 'messages' && "cursor-pointer")}
        >
        <div className={cn("flex items-end gap-2 max-w-[80%] md:max-w-[70%]", isSelected && "bg-accent-cyan/20 rounded-xl")}>
            <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div className={`relative px-4 py-2 rounded-2xl transition-all duration-300 ${isUser ? "bg-accent-cyan text-white rounded-br-none" : msg.sender === 'system' ? "bg-gray-800 text-gray-400 text-xs italic" : "bg-gray-700 text-white rounded-bl-none"}`}>
                    {!isUser && msg.sender !== 'system' && (
                        <div className="font-bold text-sm text-accent-pink">{displayName}</div>
                    )}
                    {msg.type === 'image' && <img src={msg.mediaUrl} alt={msg.text || "image"} className="rounded-lg max-w-xs mt-1" />}
                    {msg.type === 'video' && <video src={msg.mediaUrl} controls className="rounded-lg max-w-xs" />}
                    {msg.type === 'audio' && <audio src={msg.mediaUrl} controls />}
                    {msg.text && <p className="mt-1 break-words">{msg.text}</p>}
                    
                    <div className={`text-xs mt-1 flex items-center gap-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
                        <span>{msg.createdAt?.toDate?.().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ""}</span>
                         {seenStatus !== 'none' && (
                             <span className="relative flex items-center">
                                <Eye size={14} className={cn('transition-colors', seenStatus === 'all_seen' ? 'text-blue-400' : 'text-gray-500')} />
                                {seenStatus === 'all_seen' && <Eye size={14} className="absolute -right-1 text-blue-400" />}
                             </span>
                         )}
                    </div>
                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div className="absolute -bottom-4 -right-1 flex gap-1">
                            {Object.entries(msg.reactions).map(([emoji, uids]: [string, any]) => (
                                <div key={emoji} className="bg-gray-600 px-1.5 py-0.5 rounded-full text-xs flex items-center gap-1">
                                    <span>{emoji}</span>
                                    <span className="font-bold text-xs">{Array.isArray(uids) ? uids.length : 0}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className={`relative hidden group-hover:flex items-center gap-1 mt-1 ${isUser ? "flex-row-reverse" : ""}`}>
                {msg.sender !== 'system' && 
                    <>
                        <div className="relative">
                        <button onClick={() => onShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)} className="p-1 rounded-full bg-gray-600 hover:bg-gray-500"><Smile size={16}/></button>
                            <AnimatePresence>
                            {showEmojiPicker === msg.id && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute z-10 -top-10 bg-gray-800 rounded-full p-2 flex gap-1 shadow-lg"
                                >
                                    {defaultReactions.map(emoji => (
                                        <button key={emoji} onClick={() => handleReact(emoji)} className="text-xl hover:scale-125 transition-transform">{emoji}</button>
                                    ))}
                                </motion.div>
                            )}
                            </AnimatePresence>
                        </div>
                    </>
                }
                {isUser && <button onClick={onShowDeleteConfirm} className="p-1 rounded-full bg-gray-600 hover:bg-red-500"><Trash2 size={16}/></button>}
                </div>
            </div>
            </div>
        </div>
    );
});
MessageItem.displayName = 'MessageItem';
