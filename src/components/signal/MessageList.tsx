'use client';
import React from 'react';
import { MessageItem } from './MessageItem';
import { Loader } from 'lucide-react';

const fmtSep = (d: Date) => {
  const now = new Date();
  const ts  = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  if (ts(d) === ts(now))              return 'Today';
  if (ts(now) - ts(d) === 86400000)   return 'Yesterday';
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
};

interface Props {
  messages:       any[];
  firebaseUser:   any;
  selectedChat:   any;
  selectedItems:  Set<string>;
  selectionMode:  boolean;
  handleLongPress:  (e: any, id: string) => void;
  onContextMenu:    (e: any, id: string) => void;
  handleMessageClick: (id: string) => void;
  setShowEmojiPicker: (id: string | null) => void;
  showEmojiPicker:    string | null;
  setFullScreenImage: (url: string | null) => void;
  bottomRef:      React.RefObject<HTMLDivElement>;
  loadMoreMessages: () => void;
  loadingMore:    boolean;
  hasMoreToLoad:  boolean;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  chatId: string;
  onReply: (message: any) => void;
  readReceipts: Record<string, Date>;
}

export function MessageList({
  messages, firebaseUser, selectedChat, selectedItems, selectionMode,
  handleLongPress, onContextMenu, handleMessageClick,
  setShowEmojiPicker, showEmojiPicker, setFullScreenImage,
  bottomRef, loadMoreMessages, loadingMore, hasMoreToLoad,
  scrollContainerRef, chatId, onReply,
  readReceipts
}: Props) {

  const visible = messages.filter(m => !(m.deletedFor ?? []).includes(firebaseUser.uid));

  const nodes: React.ReactNode[] = [];
  let lastDate: string | null = null;

  visible.forEach((msg, i) => {
    const msgDate = msg.createdAt?.toDate?.() ?? (msg.pending ? msg.createdAt : null);
    if (msgDate) {
      const ds = msgDate.toDateString();
      if (ds !== lastDate) {
        nodes.push(
          <div key={`sep-${ds}`} className="flex items-center justify-center my-4">
            <span className="bg-black/30 backdrop-blur-sm text-white/35 text-[11px] font-medium px-3 py-1 rounded-full border border-white/[0.06]">
              {fmtSep(msgDate)}
            </span>
          </div>
        );
        lastDate = ds;
      }
    }

    if (msg.type === 'deleted') {
      nodes.push(
        <div key={msg.id ?? `del-${i}`} className="flex justify-center my-1">
          <span className="text-gray-600 text-xs italic">Message deleted</span>
        </div>
      );
      return;
    }

    nodes.push(
      <MessageItem
        key={msg.id ?? `tmp-${i}`}
        msg={msg}
        isUser={msg.sender === firebaseUser.uid}
        selectedChat={selectedChat}
        firebaseUser={firebaseUser}
        isSelected={selectedItems.has(msg.id)}
        selectionMode={selectionMode}
        isStarred={(msg.starredBy || []).includes(firebaseUser.uid)}
        onLongPress={handleLongPress}
        onContextMenu={onContextMenu}
        onClick={handleMessageClick}
        onShowEmojiPicker={setShowEmojiPicker}
        showEmojiPicker={showEmojiPicker}
        setFullScreenImage={setFullScreenImage}
        chatId={chatId}
        onReply={onReply}
        messages={messages}
        readReceipts={readReceipts}
      />
    );
  });

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto px-4 flex flex-col gap-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {hasMoreToLoad && (
        <div className="flex justify-center py-3">
          <button
            onClick={loadMoreMessages}
            disabled={loadingMore}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/30 backdrop-blur hover:bg-black/50 text-white/35 text-xs font-medium border border-white/[0.06] transition-colors"
          >
            {loadingMore
              ? <><Loader size={12} className="animate-spin mr-1" />Loading...</>
              : 'Load older messages'
            }
          </button>
        </div>
      )}

      {nodes}

      <div ref={bottomRef} className="h-1" />
    </div>
  );
}
