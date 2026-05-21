'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getFirestore, doc, runTransaction } from 'firebase/firestore';
import { app } from '@/utils/firebaseClient';
import { AudioPlayer } from './AudioPlayer';
import { GENZ_REACTIONS } from '@/lib/quick-drop-data';
import { Eye, Check, Video, Mic, ImageIcon, Music2, Star, Share } from 'lucide-react';
import { Camera } from 'lucide-react';

const db = getFirestore(app);

const LinkifiedText = React.memo(({ text }: { text: string }) => {
    if (!text) return null;

    const combinedRegex = /(\b(?:https?:\/\/|www\.)[^\s<>"{}|\\^`[\]]+)|(\b(?:\+\d{1,3}\s*)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}\b)/gi;

    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;

    while ((match = combinedRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.substring(lastIndex, match.index));
        }

        const matchedText = match[0];
        
        if (match[1]) { // It's a URL
             const href = matchedText.startsWith('www.') ? `http://${matchedText}` : matchedText;
             parts.push(
                <a href={href} key={match.index} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline" onClick={e => e.stopPropagation()}>
                    {matchedText}
                </a>
            );
        } 
        else if (match[2]) { // It's a phone number
             parts.push(
                <a href={`tel:${matchedText.replace(/\D/g, '')}`} key={match.index} className="text-cyan-400 hover:underline" onClick={e => e.stopPropagation()}>
                    {matchedText}
                </a>
            );
        }

        lastIndex = combinedRegex.lastIndex;
    }

    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }

    return <p className="break-words whitespace-pre-wrap">{parts.map((part, i) => <React.Fragment key={i}>{part}</React.Fragment>)}</p>;
});
LinkifiedText.displayName = 'LinkifiedText';

const ANON = ['Ram','Shyam','Sita','Mohan','Krishna','Radha','Anchal','Anaya','Advik','Diya','Rohan','Priya','Arjun','Saanvi','Kabir'];
const genAnon = (uid: string, chatId: string) => {
  const h = (s: string) => { let v = 0; for (let i = 0; i < s.length; i++) v = (Math.imul(31, v) + s.charCodeAt(i)) | 0; return v; };
  return `${ANON[Math.abs(h(uid + chatId)) % ANON.length]}${Math.abs(h(chatId + uid)) % 900 + 100}`;
};

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

const REPLY_ACCENTS = [
  { bar: '#b1f2ff', name: '#b1f2ff', bg: 'rgba(177,242,255,0.08)' },
  { bar: '#f9a8d4', name: '#f9a8d4', bg: 'rgba(249,168,212,0.08)' },
  { bar: '#86efac', name: '#86efac', bg: 'rgba(134,239,172,0.08)' },
  { bar: '#fde68a', name: '#fde68a', bg: 'rgba(253,230,138,0.08)' },
  { bar: '#c4b5fd', name: '#c4b5fd', bg: 'rgba(196,181,253,0.08)' },
];
const getAccent = (sender: string) => {
  let h = 0;
  for (let i = 0; i < sender.length; i++) h = (Math.imul(31, h) + sender.charCodeAt(i)) | 0;
  return REPLY_ACCENTS[Math.abs(h) % REPLY_ACCENTS.length];
};

const scrollToAndFlash = (id: string) => {
  const el = document.getElementById(`message-${id}`);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const bubble = el.querySelector('.message-bubble-content') as HTMLElement | null;
  if (!bubble) return;
  bubble.style.transition = 'none';
  bubble.style.outline = '2px solid rgba(177,242,255,0.6)';
  bubble.style.boxShadow = '0 0 18px 4px rgba(177,242,255,0.18)';
  requestAnimationFrame(() => {
    bubble.style.transition = 'outline 0.7s ease, box-shadow 0.7s ease';
    setTimeout(() => {
      bubble.style.outline = '2px solid transparent';
      bubble.style.boxShadow = 'none';
      setTimeout(() => { bubble.style.transition = ''; bubble.style.outline = ''; bubble.style.boxShadow = ''; }, 750);
    }, 950);
  });
};

const getTimestamp = (ts: any): number | null => {
    if (!ts) return null;
    if (typeof ts.toDate === 'function') { // Firestore Timestamp
        return ts.toDate().getTime();
    }
    if (ts instanceof Date) { // Javascript Date
        return ts.getTime();
    }
    return null;
};

interface Props {
  msg:            any;
  isUser:         boolean;
  selectedChat:   any;
  firebaseUser:   any;
  isSelected:     boolean;
  selectionMode:  boolean;
  isStarred:      boolean;
  onLongPress:    (e: React.MouseEvent | React.TouchEvent, id: string) => void;
  onContextMenu:  (e: React.MouseEvent | React.TouchEvent, id: string) => void;
  onClick:        (id: string) => void;
  onShowEmojiPicker: (id: string | null) => void;
  showEmojiPicker:   string | null;
  setFullScreenImage: (url: string) => void;
  chatId: string;
  onReply: (message: any) => void;
  messages: any[];
  readReceipts: Record<string, Date>;
}

export const MessageItem = React.memo(({
  msg: rawMsg, isUser, selectedChat, firebaseUser, isSelected, selectionMode, isStarred,
  onLongPress, onContextMenu, onClick,
  onShowEmojiPicker, showEmojiPicker, setFullScreenImage, chatId, onReply, messages,
  readReceipts
}: Props) => {

  const isForwarded = rawMsg.type === 'forward';
  const msg = isForwarded ? rawMsg.originalMessage : rawMsg;

  const lp = useLongPress(e => {
    if (selectionMode) onClick(msg.id);
    else onLongPress(e, msg.id);
  });

  const repliedToMessage = msg.replyTo ? messages.find(m => m.id === msg.replyTo) : null;

  const repliedToDisplayName = React.useMemo(() => {
    if (!repliedToMessage) return '';
    if (repliedToMessage.sender === firebaseUser?.uid) return 'You';
    if (selectedChat.groupType === 'anonymous')    return genAnon(repliedToMessage.sender, selectedChat.id);
    if (selectedChat.groupType === 'pseudonymous') return selectedChat.pseudonyms?.[repliedToMessage.sender] || 'Anon';
    if (selectedChat.isGroup) return selectedChat.memberInfo?.[repliedToMessage.sender]?.name || selectedChat.memberInfo?.[repliedToMessage.sender]?.username || 'Member';
    return selectedChat.name || selectedChat.username || 'User';
  }, [repliedToMessage, selectedChat, firebaseUser]);

  const displayName = React.useMemo(() => {
    if (selectedChat.groupType === 'anonymous')   return genAnon(msg.sender, selectedChat.id);
    if (selectedChat.groupType === 'pseudonymous') return selectedChat.pseudonyms?.[msg.sender] || 'Anon';
    if (selectedChat.isGroup) return selectedChat.memberInfo?.[msg.sender]?.name || selectedChat.memberInfo?.[msg.sender]?.username || 'Member';
    return selectedChat.name || selectedChat.username || 'User';
  }, [msg.sender, selectedChat]);

  const handleReact = async (emoji: string) => {
    if (!firebaseUser?.uid || !msg.id) return;
    const msgRef = doc(db, 'chats', chatId, 'messages', msg.id);
    try {
      await runTransaction(db, async tx => {
        const snap = await tx.get(msgRef);
        if (!snap.exists()) return;

        const reactions = snap.data().reactions ? { ...snap.data().reactions } : {};
        const userId = firebaseUser.uid;

        Object.keys(reactions).forEach(key => {
          if (Array.isArray(reactions[key])) {
            reactions[key] = reactions[key].filter((uid: string) => uid !== userId);
            if (reactions[key].length === 0) delete reactions[key];
          }
        });

        if (!Array.isArray(reactions[emoji])) reactions[emoji] = [];
        if (!reactions[emoji].includes(userId)) reactions[emoji].push(userId);

        tx.update(msgRef, { reactions });
      });
      onShowEmojiPicker(null);
    } catch (e) {
      console.error('Reaction failed', e);
    }
  };

  const getSeenStatus = () => {
    if (!isUser || msg.pending || msg.sender === 'system') return 'none';

    const msgTime = getTimestamp(msg.createdAt);
    if (!msgTime) return 'sent';

    const otherParticipants = (selectedChat?.members || []).filter(
        (id: string) => id !== firebaseUser?.uid
    );

    if (otherParticipants.length === 0) return 'sent';

    const seenByCount = otherParticipants.filter(id => {
        const receiptTime = getTimestamp(readReceipts[id]);
        return receiptTime && receiptTime >= msgTime;
    }).length;

    if (seenByCount === 0) return 'sent';
    if (seenByCount === otherParticipants.length) return 'all_seen';
    if (seenByCount > 0) return 'delivered';

    return 'sent';
  };

  const seenStatus = getSeenStatus();

  const getSeenTooltipText = () => {
    if (seenStatus === 'none') return null;
    if (seenStatus === 'sent') return 'Sent';
    if (seenStatus === 'delivered') return 'Delivered';

    if (selectedChat.isGroup) {
        const allMembers = selectedChat.members || [];
        const others = allMembers.filter((id: string) => id !== firebaseUser?.uid);
        const msgTime = getTimestamp(msg.createdAt) ?? 0;

        const seenByIds = others.filter(id => {
            const receiptTime = getTimestamp(readReceipts[id]);
            return receiptTime && receiptTime >= msgTime;
        });

        const seenByNames = seenByIds.map((id: string) =>
            selectedChat.memberInfo?.[id]?.name ||
            selectedChat.memberInfo?.[id]?.username ||
            'A member'
        );

        if (seenStatus === 'all_seen') {
            return 'Seen by everyone';
        }

        return seenByNames.length > 0
            ? `Seen by ${seenByNames.join(', ')}`
            : 'Delivered';
    }

    return 'Seen';
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

  const ReplyPreview = repliedToMessage ? (() => {
    const accent = getAccent(repliedToMessage.sender);
    const isMedia = ['image', 'gif', 'video', 'audio'].includes(repliedToMessage.type);
    
    return (
      <motion.div
        initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.15 }}
        onClick={e => { e.stopPropagation(); scrollToAndFlash(repliedToMessage.id); }}
        className="cursor-pointer mb-2 rounded-xl overflow-hidden bg-white/5 border border-white/10 backdrop-blur-sm"
        whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-stretch">
          <div className="w-1 flex-shrink-0" style={{ background: accent.bar }} />
          <div className="flex items-center gap-2 p-2 min-w-0">
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold block mb-0.5" style={{ color: accent.name }}>{repliedToDisplayName}</span>
              <p className="text-xs leading-tight line-clamp-2 text-white/70 truncate">
                {repliedToMessage.text || 
                  (isMedia && <span className="flex items-center gap-1.5 italic"><ImageIcon size={12}/>Photo</span>)}
              </p>
            </div>
            {repliedToMessage.mediaUrl && ['image', 'gif'].includes(repliedToMessage.type) && (
              <img src={repliedToMessage.mediaUrl} alt="" className="w-9 h-9 rounded-md object-cover flex-shrink-0"/>
            )}
          </div>
        </div>
      </motion.div>
    );
  })() : null;

  return (
    <motion.div
      id={`message-${msg.id}`}
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
      <AnimatePresence>
        {selectionMode && (
          <motion.div initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.4 }} className={cn('flex-shrink-0 mb-2', isUser ? 'order-last ml-1' : 'order-first mr-1')}>
            <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all', isSelected ? 'bg-accent-cyan border-accent-cyan' : 'border-white/25')}>
              {isSelected && <span className="text-black text-xs font-black">✓</span>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={cn('flex flex-col max-w-[78%] md:max-w-[65%] relative', isUser ? 'items-end' : 'items-start')}>
        {!isUser && selectedChat.isGroup && (
          <span className="text-xs font-semibold text-accent-pink px-1 mb-0.5">{displayName}</span>
        )}

        {isForwarded && (
            <div className="flex items-center gap-1.5 text-xs text-white/70 mb-1 px-1">
                <Share size={12} />
                <span>Forwarded</span>
            </div>
        )}

        <div className={cn('message-bubble-content relative px-3 py-2 rounded-2xl text-[15px] leading-relaxed transition-all', isUser ? 'bg-gradient-to-br from-accent-pink/80 to-purple-700/80 text-white' : 'bg-gray-700 text-white', messageFont, msg.pending && 'opacity-60')}>

          {ReplyPreview}

          {(msg.type === 'image' || msg.type === 'gif') && <motion.img src={msg.mediaUrl} alt="" className="rounded-lg max-w-full h-auto cursor-pointer mb-1 block" style={{ maxHeight: 300 }} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ scale: 1.02 }} onClick={e => { e.stopPropagation(); setFullScreenImage(msg.mediaUrl); }}/>}
          {msg.type === 'video' && <video src={msg.mediaUrl} controls className="rounded-lg max-w-full h-auto mb-1 block" style={{ maxHeight: 300 }} onClick={e => e.stopPropagation()}/>}
          {msg.type === 'audio' && <div className="mb-1" onClick={e => e.stopPropagation()}><AudioPlayer src={msg.mediaUrl} isUser={isUser} /></div>}

          {msg.text && <LinkifiedText text={msg.text} />}

          <div className={cn('flex items-center gap-1.5 mt-1', isUser ? 'justify-end' : 'justify-start')}>
            {isStarred && <Star size={12} className="text-yellow-400"/>}
            <span className={cn('text-xs', isUser ? 'text-white/60' : 'text-white/60')}>{timeStr}</span>
            {isUser && seenStatus !== 'none' && (
              <div className="relative" title={getSeenTooltipText() ?? ''}>
                {seenStatus === 'sent' && <Check size={16} className="text-white/60" />}
                {seenStatus === 'delivered' && <Check size={16} className="text-blue-400" />}
                {seenStatus === 'all_seen' && <Eye size={16} className="text-blue-400" />}
              </div>
            )}
            {msg.pending && <span className="text-xs opacity-50">⏳</span>}
          </div>
        </div>

        {hasReactions && (
          <div className={cn('flex flex-wrap gap-1 mt-1', isUser ? 'justify-end' : 'justify-start')}>
            {Object.entries(msg.reactions).map(([emoji, uids]: [string, any]) =>
              uids?.length > 0 && (
                <motion.button key={emoji} whileTap={{ scale: 0.82 }} onClick={e => { e.stopPropagation(); handleReact(emoji); }} className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all', (uids as string[]).includes(firebaseUser.uid) ? 'bg-accent-cyan/20 border-accent-cyan/40 text-accent-cyan' : 'border-white/10 text-gray-300 hover:bg-white/10', )}>
                  <span>{emoji}</span>
                  <span className="font-bold text-xs">{uids.length}</span>
                </motion.button>
              )
            )}
          </div>
        )}

        <AnimatePresence>
          {showEmojiPicker === msg.id && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.88 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.88 }} transition={{ type: 'spring', damping: 22, stiffness: 320 }}
              className={cn('absolute z-20 bottom-full mb-2 bg-black/70 backdrop-blur-2xl border border-white/10 rounded-3xl px-2 py-2 flex gap-0.5 shadow-2xl', isUser ? 'right-0' : 'left-0')}
              onClick={e => e.stopPropagation()}
            >
              {GENZ_REACTIONS.map(emoji => (
                <motion.button key={emoji} whileTap={{ scale: 0.68 }} onClick={() => handleReact(emoji)} className="text-2xl p-1 rounded-full hover:bg-white/10 transition-all leading-none">
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
