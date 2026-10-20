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
  setFullScreenImage: (url: string, imageUrls?: string[], initialIndex?: number, captions?: string[]) => void;
  bottomRef:      React.RefObject<HTMLDivElement | null>;
  loadMoreMessages: () => void;
  loadingMore:    boolean;
  hasMoreToLoad:  boolean;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
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

  const renderMessage = (msg: any, index: number) => (
    <MessageItem
      key={msg.id ?? `tmp-${index}`}
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

  for (let i = 0; i < visible.length; i++) {
    const msg = visible[i];
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
      continue;
    }

    if (msg.type === 'image' && msg.mediaGroupId) {
      const group = [msg];
      while (
        i + 1 < visible.length &&
        visible[i + 1].type === 'image' &&
        visible[i + 1].mediaGroupId === msg.mediaGroupId &&
        visible[i + 1].sender === msg.sender
      ) {
        i++;
        group.push(visible[i]);
      }
      if (group.length > 1) {
        nodes.push(
          <div
            key={`media-group-${msg.mediaGroupId}`}
            className="my-1 max-h-[72dvh] w-full overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-black/20 py-1 [scrollbar-width:thin] md:max-w-3xl md:self-center"
            aria-label={`Photo gallery with ${group.length} images`}
          >
            {group.map((item, groupIndex) => renderMessage(item, i - group.length + 1 + groupIndex))}
          </div>
        );
        continue;
      }
    }
    nodes.push(renderMessage(msg, i));
  }

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
