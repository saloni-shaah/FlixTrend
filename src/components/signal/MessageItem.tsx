'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Smile, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getFirestore, doc, runTransaction, Timestamp } from 'firebase/firestore';
import { app } from '@/utils/firebaseClient';
import { AudioPlayer } from './AudioPlayer';

const db = getFirestore(app);

const anonymousNames = ["Ram", "Shyam", "Sita", "Mohan", "Krishna", "Radha", "Anchal", "Anaya", "Advik", "Diya", "Rohan", "Priya", "Arjun", "Saanvi", "Kabir"];
const generateAnonymousName = (userId: string, chatId: string) => {
    const hash = (str: string) => {
        let h = 0;
        for (let i = 0; i < str.length; i++) { h = (Math.imul(31, h) + str.charCodeAt(i)) | 0; }
        return h;
    };
    const nameIndex = Math.abs(hash(userId + chatId)) % anonymousNames.length;
    const num = Math.abs(hash(chatId + userId)) % 900 + 100;
    return `${anonymousNames[nameIndex]}${num}`;
};

const useLongPress = (callback: (event: React.MouseEvent | React.TouchEvent) => void, ms = 300) => {
    const timerRef = React.useRef<NodeJS.Timeout>();
    const eventRef = React.useRef<React.MouseEvent | React.TouchEvent | null>(null);

    const start = (event: React.MouseEvent | React.TouchEvent) => {
        event.persist(); 
        eventRef.current = event;
        timerRef.current = setTimeout(() => callback(eventRef.current!), ms);
    };

    const end = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
    };

    return { onTouchStart: start, onTouchEnd: end, onMouseDown: start, onMouseUp: end, onMouseLeave: end };
};

interface MessageItemProps {
    msg: any;
    isUser: boolean;
    selectedChat: any;
    firebaseUser: any;
    isSelected: boolean;
    onLongPress: (event: React.MouseEvent | React.TouchEvent, msgId: string) => void;
    onContextMenu: (event: React.MouseEvent | React.TouchEvent, msgId: string) => void;
    onClick: (msgId: string) => void;
    onShowEmojiPicker: (msgId: string | null) => void;
    showEmojiPicker: string | null;
    onShowDeleteConfirm: (msgId: string) => void;
    selectionMode: 'messages' | null;
    setFullScreenImage: (url: string) => void;
}

export const MessageItem = React.memo(({ msg, isUser, selectedChat, firebaseUser, isSelected, onLongPress, onContextMenu, onClick, onShowEmojiPicker, showEmojiPicker, onShowDeleteConfirm, selectionMode, setFullScreenImage }: MessageItemProps) => {
    const longPressProps = useLongPress((event) => {
        onLongPress(event, msg.id);
    });

    const senderInfo = selectedChat.isGroup ? (selectedChat.groupType === 'simple' ? selectedChat.memberInfo?.[msg.sender] : null) : selectedChat;
    const displayName = selectedChat.groupType === 'anonymous' ? generateAnonymousName(msg.sender, selectedChat.id) : selectedChat.groupType === 'pseudonymous' ? selectedChat.pseudonyms?.[msg.sender] || 'Anon' : senderInfo?.name || "User";
    const defaultReactions = ["👍", "❤️", "😂", "😢", "😮", "🙏"];

    const handleReact = async (emoji: string) => {
        if (!firebaseUser?.uid) return;
        const correctChatId = selectedChat.isGroup ? selectedChat.id : [firebaseUser.uid, selectedChat.id].sort().join('_');
        const messageRef = doc(db, 'chats', correctChatId, 'messages', msg.id);

        try {
            await runTransaction(db, async (transaction) => {
                const messageDoc = await transaction.get(messageRef);
                if (!messageDoc.exists()) throw "Message does not exist!";

                const newReactions = { ...(messageDoc.data().reactions || {}) };
                const myReaction = Object.keys(newReactions).find(e => newReactions[e].includes(firebaseUser.uid));

                if (myReaction) {
                    newReactions[myReaction] = newReactions[myReaction].filter((uid: string) => uid !== firebaseUser.uid);
                    if (newReactions[myReaction].length === 0) delete newReactions[myReaction];
                }

                if (myReaction !== emoji) {
                    if (!newReactions[emoji]) newReactions[emoji] = [];
                    newReactions[emoji].push(firebaseUser.uid);
                }

                transaction.update(messageRef, { reactions: newReactions });
            });
            onShowEmojiPicker(null);
        } catch (error) {
            console.error("Reaction failed: ", error);
        }
    };

    const getSeenStatus = () => {
        if (!isUser || msg.sender === 'system' || !msg.createdAt) return 'none';

        const readers = msg.readBy || [];

        const otherParticipants = selectedChat.isGroup 
            ? selectedChat.members.filter((id: string) => id !== firebaseUser.uid)
            : [selectedChat.id];

        if (otherParticipants.every((id: string) => readers.includes(id))) {
            return 'all_seen';
        }

        if (readers.length > 0) return 'delivered';

        return 'sent';
    };
    
    const seenStatus = getSeenStatus();

    const messageFont = isUser ? 'font-handlee' : 'font-patrick-hand';
    const variants = {
        initial: { opacity: 0, y: 20, scale: 0.95 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, scale: 0.9 }
    };

    const mediaVariants = {
        initial: { opacity: 0, scale: 0.8 },
        animate: { opacity: 1, scale: 1 },
        hover: { scale: 1.05 }
    };

    return (
        <motion.div 
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            layout
            onContextMenu={(e) => onContextMenu(e, msg.id)} 
            onClick={() => onClick(msg.id)} 
            {...longPressProps} 
            className={cn("group flex w-full items-end gap-2", isUser ? "justify-end" : msg.sender === 'system' ? 'justify-center' : "justify-start", selectionMode === 'messages' && "cursor-pointer")}
        >
            <div className={cn("flex items-end gap-2 max-w-[80%] md:max-w-[70%]", isSelected && "bg-accent-cyan/20 rounded-xl")}>
                <div className={`relative flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                    <div className={cn(`px-3 py-2 rounded-2xl transition-all duration-300 ${isUser ? "bg-[#bdb2ff] text-black rounded-br-none" : msg.sender === 'system' ? "bg-gray-800 text-gray-400 text-xs italic" : "bg-gray-700 text-white rounded-bl-none"}`, messageFont)}>
                        {!isUser && msg.sender !== 'system' && <div className="font-bold text-sm text-accent-pink px-1">{displayName}</div>}
                        
                        {(msg.type === 'image' || msg.type === 'gif') && 
                            <motion.img 
                                src={msg.mediaUrl} 
                                alt={msg.text || "image"} 
                                className="rounded-lg max-w-full h-auto mt-1 cursor-pointer"
                                variants={mediaVariants}
                                initial="initial"
                                animate="animate"
                                whileHover="hover"
                                onClick={(e) => { e.stopPropagation(); setFullScreenImage(msg.mediaUrl);}}
                            />}
                        {msg.type === 'video' && 
                            <motion.video 
                                src={msg.mediaUrl} 
                                controls 
                                className="rounded-lg max-w-full h-auto"
                                variants={mediaVariants}
                                initial="initial"
                                animate="animate"
                            />}
                        {msg.type === 'audio' && <div className="mt-1"><AudioPlayer src={msg.mediaUrl} isUser={isUser} /></div>}
                        {msg.text && <p className="mt-1 break-words px-1">{msg.text}</p>}

                        <div className={`text-xs mt-1 flex items-center gap-1 px-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
                            <span>{msg.createdAt?.toDate?.().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ""}</span>
                            {seenStatus !== 'none' && (
                                <span className="relative flex items-center">
                                    <Eye size={14} className={cn('transition-colors', seenStatus === 'all_seen' ? 'text-blue-400' : 'text-gray-500')} />
                                    {(seenStatus === 'all_seen' || seenStatus === 'delivered') && <Eye size={14} className={cn("absolute -right-1.5 transition-colors", seenStatus === 'all_seen' ? 'text-blue-400' : 'text-gray-500')} />}
                                </span>
                            )}
                        </div>

                        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                            <div className={`absolute flex gap-1 ${isUser ? 'left-0 -bottom-4' : 'right-0 -bottom-4'}`}>
                                {Object.entries(msg.reactions).map(([emoji, uids]: [string, any]) => (
                                    uids.length > 0 && (
                                        <div key={emoji} className="bg-gray-600 px-1.5 py-0.5 rounded-full text-xs flex items-center gap-1">
                                            <span>{emoji}</span>
                                            <span className="font-bold text-xs">{uids.length}</span>
                                        </div>
                                    )
                                ))}
                            </div>
                        )}
                    </div>
                    <div className={cn("absolute -bottom-8 items-center gap-1", isUser ? "left-0 flex" : "right-0 hidden group-hover:flex")}>
                         <div className="relative">
                            <button onClick={(e) => { e.stopPropagation(); onShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id); }} className="p-1 rounded-full bg-gray-600 hover:bg-gray-500"><Smile size={16}/></button>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute z-10 -top-10 bg-gray-800 rounded-full p-2 flex gap-1 shadow-lg"
                                style={{ display: showEmojiPicker === msg.id ? 'flex' : 'none' }}
                            >
                                {defaultReactions.map(emoji => (
                                    <button key={emoji} onClick={(e) => { e.stopPropagation(); handleReact(emoji); }} className="text-xl hover:scale-125 transition-transform">{emoji}</button>
                                ))}
                            </motion.div>
                        </div>
                        {isUser && <button onClick={(e) => { e.stopPropagation(); onShowDeleteConfirm(msg.id);}} className="p-1 rounded-full bg-gray-600 hover:bg-red-500"><Trash2 size={16}/></button>}
                    </div>
                </div>
            </div>
        </motion.div>
    );
});
MessageItem.displayName = 'MessageItem';
