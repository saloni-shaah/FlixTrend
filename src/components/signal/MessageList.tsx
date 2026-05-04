'use client';
import React from 'react';
import { MessageItem } from './MessageItem';
import { Loader } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { Timestamp } from 'firebase/firestore';

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

interface MessageListProps {
    messages: any[];
    firebaseUser: any;
    selectedChat: any;
    selectedItems: Set<string>;
    selectionMode: 'messages' | null;
    handleLongPress: (event: React.MouseEvent | React.TouchEvent, msgId: string) => void;
    onContextMenu: (event: React.MouseEvent | React.TouchEvent, msgId: string) => void;
    handleMessageClick: (msgId: string) => void;
    setShowEmojiPicker: (msgId: string | null) => void;
    showEmojiPicker: string | null;
    openDeleteConfirmation: (msgId?: string) => void;
    setFullScreenImage: (imageUrl: string | null) => void;
    bottomRef: React.RefObject<HTMLDivElement>;
    loadMoreMessages: () => void;
    loadingMore: boolean;
    hasMoreToLoad: boolean;
    scrollContainerRef: React.RefObject<HTMLDivElement>;
    lastReadTimestamps: { [key: string]: Timestamp };
}

export function MessageList({ 
    messages, 
    firebaseUser, 
    selectedChat, 
    selectedItems, 
    selectionMode, 
    handleLongPress, 
    onContextMenu,
    handleMessageClick, 
    setShowEmojiPicker, 
    showEmojiPicker, 
    openDeleteConfirmation, 
    setFullScreenImage,
    bottomRef,
    loadMoreMessages,
    loadingMore,
    hasMoreToLoad,
    scrollContainerRef,
    lastReadTimestamps
}: MessageListProps) {

    const renderMessagesWithSeparators = () => {
        let lastDate: string | null = null;
        const messageElements: React.ReactNode[] = [];

        messages
            .filter(msg => !(msg.deletedFor || []).includes(firebaseUser.uid))
            .forEach((msg, index) => {
                const msgDate = msg.createdAt?.toDate();
                if (msgDate) {
                    const dateString = msgDate.toDateString();
                    if (dateString !== lastDate) {
                        messageElements.push(
                            <div key={`date-${dateString}`} className="text-center my-4">
                                <span className="bg-gray-800 text-gray-400 text-xs font-bold px-3 py-1 rounded-full">{formatDateSeparator(msgDate)}</span>
                            </div>
                        );
                        lastDate = dateString;
                    }
                }
                
                if (msg.type === 'deleted') {
                    messageElements.push(
                        <div key={msg.id || `msg-${index}`} className="flex justify-center">
                            <i className="text-gray-500 text-sm">Message deleted</i>
                        </div>
                    );
                    return;
                }

                const isUser = msg.sender === firebaseUser.uid;
                messageElements.push(
                    <MessageItem
                      key={msg.id || `msg-${index}`}
                      msg={msg}
                      isUser={isUser}
                      selectedChat={selectedChat}
                      firebaseUser={firebaseUser}
                      isSelected={selectedItems.has(msg.id)}
                      selectionMode={selectionMode}
                      onLongPress={handleLongPress}
                      onContextMenu={onContextMenu}
                      onClick={handleMessageClick}
                      onShowEmojiPicker={setShowEmojiPicker}
                      showEmojiPicker={showEmojiPicker}
                      onShowDeleteConfirm={openDeleteConfirmation}
                      setFullScreenImage={setFullScreenImage}
                      lastReadTimestamps={lastReadTimestamps}
                    />
                );
            });
            return messageElements;
    };

    return (
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {hasMoreToLoad && (
                <div className="text-center">
                    <button onClick={loadMoreMessages} disabled={loadingMore} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-full text-sm">
                        {loadingMore ? <Loader className='animate-spin inline-block' /> : "Load More"}
                    </button>
                </div>
            )}
            <AnimatePresence>
                {renderMessagesWithSeparators()}
            </AnimatePresence>
            <div ref={bottomRef} />
        </div>
    );
}
