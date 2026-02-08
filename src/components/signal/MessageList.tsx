'use client';
import React, { useRef, useEffect } from 'react';
import { MessageItem } from './MessageItem';

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
    onLongPress: (msgId: string) => void;
    onClick: (msgId: string) => void;
    onShowEmojiPicker: (msgId: string | null) => void;
    showEmojiPicker: string | null;
    onShowDeleteConfirm: (msgId: string) => void;
}

export function MessageList({ 
    messages, 
    firebaseUser, 
    selectedChat, 
    selectedItems, 
    selectionMode, 
    onLongPress, 
    onClick, 
    onShowEmojiPicker, 
    showEmojiPicker, 
    onShowDeleteConfirm 
}: MessageListProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

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
                      onLongPress={() => onLongPress(msg.id)}
                      onClick={() => onClick(msg.id)}
                      onShowEmojiPicker={onShowEmojiPicker}
                      showEmojiPicker={showEmojiPicker}
                      onShowDeleteConfirm={() => onShowDeleteConfirm(msg.id)}
                    />
                );
            });
            return messageElements;
    };

    return (
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
            {renderMessagesWithSeparators()}
            <div ref={messagesEndRef} />
        </div>
    );
}
