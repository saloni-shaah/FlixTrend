'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getFirestore, doc, runTransaction } from 'firebase/firestore';
import { app } from '@/utils/firebaseClient';
import { AudioPlayer } from './AudioPlayer';
import { GENZ_REACTIONS } from '@/lib/quick-drop-data';
import { Eye, Check } from 'lucide-react';

const db = getFirestore(app);

// ── Anonymous name generator ────────────────────────────────────────────────
const ANON = ['Ram','Shyam','Sita','Mohan','Krishna','Radha','Anchal','Anaya','Advik','Diya','Rohan','Priya','Arjun','Saanvi','Kabir'];
const genAnon = (uid: string, chatId: string) => {
  const h = (s: string) => { let v = 0; for (let i = 0; i < s.length; i++) v = (Math.imul(31, v) + s.charCodeAt(i)) | 0; return v; };
  return `${ANON[Math.abs(h(uid + chatId)) % ANON.length]}${Math.abs(h(chatId + uid)) % 900 + 100}`;
};

// ── Long-press hook ──────────────────────────────────────────────────────────
const useLongPress = (cb: (e: React.MouseEvent | React.TouchEvent) => void, ms = 420) => {
  const t  = React.useRef<ReturnType<typeof setTimeout>>();
  const ev = React.useRef<any>(null);
  const mv = React.useRef(false);
  const start = (e: React.MouseEvent | React.TouchEvent) => {
    mv.current = false; ev.current = e;
    t.current = setTimeout(() => { if (!mv.current) cb(ev.current!); }, ms);
  };
  const move = () => { mv.current = true; clearTimeout(t.current); };
  const end  = () => clearTimeout(t.current);
  return { onTouchStart: start, onTouchMove: move, onTouchEnd: end, onMouseDown: start, onMouseMove: move, onMouseUp: end, onMouseLeave: end };
};

interface Props {
  msg:            any;
  isUser:         boolean;
  selectedChat:   any;
  firebaseUser:   any;
  isSelected:     boolean;
  selectionMode:  boolean;
  onLongPress:    (e: React.MouseEvent | React.TouchEvent, id: string) => void;
  onContextMenu:  (e: React.MouseEvent | React.TouchEvent, id: string) => void;
  onClick:        (id: string) => void;
  onShowEmojiPicker: (id: string | null) => void;
  showEmojiPicker:   string | null;
  setFullScreenImage: (url: string) => void;
  chatId: string;
}

export const MessageItem = React.memo(({
  msg, isUser, selectedChat, firebaseUser, isSelected, selectionMode,
  onLongPress, onContextMenu, onClick,
  onShowEmojiPicker, showEmojiPicker, setFullScreenImage, chatId,
}: Props) => {

  const lp = useLongPress(e => {
    if (selectionMode) onClick(msg.id);
    else onLongPress(e, msg.id);
  });

  const displayName = React.useMemo(() => {
    if (selectedChat.groupType === 'anonymous')   return genAnon(msg.sender, selectedChat.id);
    if (selectedChat.groupType === 'pseudonymous') return selectedChat.pseudonyms?.[msg.sender] || 'Anon';
    if (selectedChat.isGroup) return selectedChat.memberInfo?.[msg.sender]?.name || selectedChat.memberInfo?.[msg.sender]?.username || 'Member';
    return selectedChat.name || selectedChat.username || 'User';
  }, [msg.sender, selectedChat]);


  const handleReact = async (emoji: string) => {
    if (!firebaseUser?.uid || !msg.id) return;

    // Construct the correct chat ID inside the function to avoid dependency on props.
    const resolvedChatId = selectedChat.isGroup
      ? selectedChat.id
      : [firebaseUser.uid, selectedChat.id].sort().join('_');

    if (!resolvedChatId) {
      console.error("Could not resolve chat ID for reaction.");
      return;
    }
    
    const msgRef = doc(db, 'chats', resolvedChatId, 'messages', msg.id);
    
    try {
      await runTransaction(db, async tx => {
        const snap = await tx.get(msgRef);
        if (!snap.exists()) return;

        const reactions = snap.data().reactions ? { ...snap.data().reactions } : {};
        const userId = firebaseUser.uid;

        const existingReaction = Object.keys(reactions).find(
          key => Array.isArray(reactions[key]) && reactions[key].includes(userId)
        );

        if (existingReaction === emoji) {
          // Toggle off: Remove user from the existing reaction array
          if (Array.isArray(reactions[emoji])) {
            reactions[emoji] = reactions[emoji].filter((uid: string) => uid !== userId);
            if (reactions[emoji].length === 0) {
              delete reactions[emoji];
            }
          }
        } else {
          // Change reaction or add a new one
          // First, remove the old reaction if there was one
          if (existingReaction && Array.isArray(reactions[existingReaction])) {
            reactions[existingReaction] = reactions[existingReaction].filter((uid: string) => uid !== userId);
            if (reactions[existingReaction].length === 0) {
              delete reactions[existingReaction];
            }
          }
          // Now, add the new reaction
          if (!Array.isArray(reactions[emoji])) {
            reactions[emoji] = [];
          }
          reactions[emoji].push(userId);
        }

        tx.update(msgRef, { reactions });
      });
      onShowEmojiPicker(null);
    } catch (e) {
      console.error('Reaction failed', e);
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

  const getSeenTooltipText = () => {
    switch (seenStatus) {
      case 'all_seen':
        return 'Seen by everyone';
      case 'delivered':
        return 'Delivered';
      case 'sent':
        return 'Sent';
      default:
        return '';
    }
  };

  const hasReactions = msg.reactions && Object.values(msg.reactions).some((u: any) => u?.length > 0);
  const isSystem     = msg.sender === 'system';
  const timeStr      = msg.createdAt?.toDate?.().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) ?? '';
  const messageFont = isUser ? 'font-handlee' : 'font-patrick-hand';

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="bg-gray-800 text-gray-400 text-xs px-3 py-1 rounded-full italic">
          {msg.text}
        </span>
      </div>
    );
  }

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.16 }}
      onContextMenu={e => { e.preventDefault(); onContextMenu(e as any, msg.id); }}
      onClick={() => onClick(msg.id)}
      {...lp}
      className={cn(
        'flex w-full items-end gap-2 px-3 py-0.5 select-none',
        isUser ? 'justify-end' : 'justify-start',
        isSelected && 'bg-accent-cyan/20 rounded-xl',
      )}
    >
      {/* Selection dot */}
      <AnimatePresence>
        {selectionMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.4 }}
            className={cn('flex-shrink-0 mb-2', isUser ? 'order-last ml-1' : 'order-first mr-1')}
          >
            <div className={cn(
              'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
              isSelected ? 'bg-accent-cyan border-accent-cyan' : 'border-white/25',
            )}>
              {isSelected && <span className="text-black text-[9px] font-black leading-none">✓</span>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bubble column */}
      <div className={cn('flex flex-col max-w-[78%] md:max-w-[65%] relative', isUser ? 'items-end' : 'items-start')}>

        {/* Group sender name */}
        {!isUser && selectedChat.isGroup && (
          <span className="text-[11px] font-semibold text-accent-pink px-1 mb-0.5">
            {displayName}
          </span>
        )}

        {/* Bubble */}
        <div className={cn(
          'relative px-3.5 py-2.5 rounded-2xl text-[14.5px] leading-relaxed transition-all',
          isUser
            ? 'bg-gradient-to-br from-accent-pink/75 to-purple-700/75 text-black'
            : 'bg-gray-700 text-white',
          messageFont,
          msg.pending && 'opacity-55',
        )}>

          {/* ── Media ─────────────────────────────────────────────────── */}
          {(msg.type === 'image' || msg.type === 'gif') && (
            <motion.img
              src={msg.mediaUrl} alt=""
              className="rounded-xl max-w-full h-auto cursor-pointer mb-1 block"
              style={{ maxHeight: 280 }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              onClick={e => { e.stopPropagation(); setFullScreenImage(msg.mediaUrl); }}
            />
          )}
          {msg.type === 'video' && (
            <video
              src={msg.mediaUrl} controls
              className="rounded-xl max-w-full h-auto mb-1 block"
              style={{ maxHeight: 280 }}
              onClick={e => e.stopPropagation()}
            />
          )}
          {msg.type === 'audio' && (
            <div className="mb-1" onClick={e => e.stopPropagation()}>
              <AudioPlayer src={msg.mediaUrl} isUser={isUser} />
            </div>
          )}

          {msg.text && <p className="break-words whitespace-pre-wrap">{msg.text}</p>}

          {/* ── Time + Seen Status ─────────────────────────────────────── */}
          <div className={cn('flex items-center gap-1.5 mt-1.5', isUser ? 'justify-end' : 'justify-start')}>
            <span className={cn('text-[10px]', isUser ? 'text-black/50' : 'text-white/50')}>{timeStr}</span>
            {isUser && seenStatus !== 'none' && (
              <div className="relative vb" data-tip={getSeenTooltipText()}>
                <div className="flex items-center">
                  {seenStatus === 'sent' && (
                    <Check size={16} className="text-gray-500" />
                  )}
                  {seenStatus === 'delivered' && (
                    <Check size={16} className="text-blue-400" />
                  )}
                  {seenStatus === 'all_seen' && (
                    <Eye size={15} className="text-blue-500" />
                  )}
                </div>
              </div>
            )}
            {msg.pending && <span className="text-[10px] opacity-40">⏳</span>}
          </div>
        </div>

        {/* ── Reactions ───────────────────────────────────────────────── */}
        {hasReactions && (
          <div className={cn('flex flex-wrap gap-1 mt-1', isUser ? 'justify-end' : 'justify-start')}>
            {Object.entries(msg.reactions).map(([emoji, uids]: [string, any]) =>
              uids?.length > 0 && (
                <motion.button
                  key={emoji}
                  whileTap={{ scale: 0.82 }}
                  onClick={e => { e.stopPropagation(); handleReact(emoji); }}
                  className={cn(
                    'flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs border transition-all bg-gray-600',
                    (uids as string[]).includes(firebaseUser.uid)
                      ? 'bg-accent-cyan/20 border-accent-cyan/40 text-accent-cyan'
                      : 'border-white/[0.09] text-gray-300 hover:bg-gray-500',
                  )}
                >
                  <span>{emoji}</span>
                  <span className="font-bold text-[11px]">{uids.length}</span>
                </motion.button>
              )
            )}
          </div>
        )}

        {/* ── Inline emoji picker ─────────────────────────────────────── */}
        <AnimatePresence>
          {showEmojiPicker === msg.id && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.88 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.88 }}
              transition={{ type: 'spring', damping: 22, stiffness: 320 }}
              className={cn(
                'absolute z-20 bottom-full mb-2 bg-black/70 backdrop-blur-2xl border border-white/10 rounded-3xl px-2 py-2 flex gap-0.5 shadow-2xl',
                isUser ? 'right-0' : 'left-0',
              )}
              onClick={e => e.stopPropagation()}
            >
              {GENZ_REACTIONS.map(emoji => (
                <motion.button
                  key={emoji}
                  whileTap={{ scale: 0.68 }}
                  onClick={() => handleReact(emoji)}
                  className="text-[22px] p-1.5 rounded-full bg-gray-600 hover:bg-gray-500 hover:scale-125 transition-all leading-none"
                >
                  {emoji}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});
MessageItem.displayName = 'MessageItem';
