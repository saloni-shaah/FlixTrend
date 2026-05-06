'use client';
import React, { useEffect, useState, useRef, Suspense, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getFirestore, collection, query, onSnapshot, doc,
  addDoc, serverTimestamp, where, getDocs, updateDoc,
  arrayUnion, arrayRemove, getDoc, limit, orderBy,
} from 'firebase/firestore';
import { auth, app } from '@/utils/firebaseClient';
import { Users, Search, X, Compass, Archive, MoreVertical, Star, Plus, MessageSquarePlus, Inbox } from 'lucide-react';
import { useAppState } from '@/utils/AppStateContext';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ChatLobby }    from '@/components/signal/ChatLobby';
import { QuickDropMenu } from '@/components/signal/QuickDropMenu';

const db = getFirestore(app);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtTs = (ts: any) => {
  if (!ts) return '';
  const d = ts.toDate(), now = new Date();
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  if (day(d) === day(now))            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (day(now) - day(d) === 86400000) return 'Yesterday';
  return d.getFullYear() === now.getFullYear()
    ? d.toLocaleDateString([], { month: 'short', day: 'numeric' })
    : d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

function useLongPress(cb: () => void, ms = 430) {
  const t  = useRef<ReturnType<typeof setTimeout>>();
  const mv = useRef(false);
  const start = () => { mv.current = false; t.current = setTimeout(() => { if (!mv.current) cb(); }, ms); };
  const move  = () => { mv.current = true; clearTimeout(t.current); };
  const end   = () => clearTimeout(t.current);
  return { onTouchStart: start, onTouchMove: move, onTouchEnd: end, onMouseDown: start, onMouseMove: move, onMouseUp: end, onMouseLeave: end };
}

// ─── ChatItem ─────────────────────────────────────────────────────────────────
const ChatItem = React.memo(({ chat, selectionMode, isSelected, isStarred, onClick, onArchive, draft, onlineStatus, onLongPress }: any) => {
  const init = (u: any) => (u?.name?.[0] || u?.username?.[0] || 'U').toUpperCase();
  const x = useMotionValue(0);
  // Swipe-left reveals archive (red); swipe-right opens chat (accent-cyan tint)
  const bg  = useTransform(x, [-110,-20,0,20,110], ['rgba(239,68,68,0.85)','rgba(239,68,68,0.15)','rgba(0,0,0,0)','rgba(0,229,255,0.12)','rgba(0,229,255,0.65)']);
  const aOp = useTransform(x, [-110,-35],[1,0]);
  const oOp = useTransform(x, [35,110],[0,1]);
  const lp  = useLongPress(onLongPress);

  const preview = draft ? null
    : chat.lastMessage?.type === 'image' ? '📷 Photo'
    : chat.lastMessage?.type === 'audio' ? '🎵 Voice message'
    : chat.lastMessage?.type === 'video' ? '🎬 Video'
    : chat.lastMessage?.text;

  return (
    <div className="relative overflow-hidden border-b border-white/[0.04]">
      {/* Swipe layer */}
      <motion.div className="absolute inset-0 pointer-events-none flex items-center" style={{ background: bg }}>
        <motion.div style={{ opacity: aOp }} className="absolute right-5 text-white"><Archive size={18} /></motion.div>
        <motion.div style={{ opacity: oOp }} className="absolute left-5 text-accent-cyan"><MessageSquarePlus size={18} /></motion.div>
      </motion.div>

      <motion.div
        drag={selectionMode ? false : 'x'}
        dragConstraints={{ left: -120, right: 120 }}
        dragElastic={0.07}
        onDragEnd={(_: any, i: any) => { if (i.offset.x < -90) onArchive(); else if (i.offset.x > 90) onClick(); }}
        style={{ x }}
        onClick={onClick}
        {...(!selectionMode ? lp : {})}
        className={cn(
          'relative z-10 flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors',
          isSelected ? 'bg-accent-cyan/[0.09]' : 'bg-transparent hover:bg-white/[0.025] active:bg-white/[0.05]',
        )}
      >
        {/* Selection */}
        <AnimatePresence>
          {selectionMode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.4, width: 0 }}
              animate={{ opacity: 1, scale: 1, width: 22 }}
              exit={{ opacity: 0, scale: 0.4, width: 0 }}
              className="flex-shrink-0 overflow-hidden"
            >
              <div className={cn('w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center', isSelected ? 'bg-accent-cyan border-accent-cyan' : 'border-white/25')}>
                {isSelected && <span className="text-black text-[9px] font-black">✓</span>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-accent-pink to-accent-cyan flex items-center justify-center font-bold text-white text-base overflow-hidden">
            {chat.avatar_url
              ? <img src={chat.avatar_url} alt="" className="w-full h-full object-cover" />
              : chat.isGroup ? <Users size={20} /> : <span>{init(chat)}</span>
            }
          </div>
          {onlineStatus && (
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-background shadow-[0_0_8px_rgba(74,222,128,0.9)]" />
          )}
          {chat.unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-accent-pink text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-background px-0.5">
              {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
            </span>
          )}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2 mb-0.5">
            <div className="flex items-center gap-1.5 min-w-0">
              {isStarred && <Star size={11} className="text-yellow-400 fill-yellow-400 flex-shrink-0" />}
              <span className={cn('truncate font-bold text-[14.5px]', chat.unreadCount > 0 ? 'text-white' : 'text-gray-300')}>
                {chat.name || chat.username}
              </span>
            </div>
            <span className={cn('text-[11px] flex-shrink-0', chat.unreadCount > 0 ? 'text-accent-cyan font-semibold' : 'text-gray-600')}>
              {fmtTs(chat.lastMessage?.createdAt)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <p className={cn('text-[13px] truncate flex-1', chat.unreadCount > 0 ? 'text-white/65 font-medium' : 'text-gray-600')}>
              {draft
                ? <span className="text-yellow-400 font-medium">Draft: {draft}</span>
                : preview || <span className="italic opacity-40">Say hi 👋</span>
              }
            </p>
            {chat.unreadCount > 0 && <span className="w-2 h-2 rounded-full bg-accent-cyan flex-shrink-0 shadow-[0_0_6px_rgba(0,229,255,0.8)]" />}
          </div>
        </div>
      </motion.div>
    </div>
  );
});
ChatItem.displayName = 'ChatItem';

// ─── Mobile bottom action sheet ───────────────────────────────────────────────
function ActionSheet({ count, onArchive, onStar, onUnstar, onCancel, canStar, canUnstar }: any) {
  return (
    <motion.div
      initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      onClick={e => e.stopPropagation()}
      // pb-16 clears the bottom nav bar
      className="fixed bottom-0 left-0 right-0 z-50 bg-black/75 backdrop-blur-2xl border-t border-white/[0.08] rounded-t-3xl pb-16 shadow-2xl md:hidden"
    >
      <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-5" />
      <p className="text-center text-sm text-gray-500 mb-4">{count} chat{count !== 1 ? 's' : ''} selected</p>
      <div className="space-y-1 px-4">
        {canStar && (
          <button onClick={onStar} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl active:bg-white/8 text-left">
            <div className="w-9 h-9 rounded-full bg-yellow-400/10 flex items-center justify-center"><Star size={18} className="text-yellow-400" /></div>
            <span className="font-semibold text-[15px]">Star chats</span>
          </button>
        )}
        {canUnstar && (
          <button onClick={onUnstar} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl active:bg-white/8 text-left">
            <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center"><Star size={18} className="text-gray-400" /></div>
            <span className="font-semibold text-[15px]">Unstar chats</span>
          </button>
        )}
        <button onClick={onArchive} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl active:bg-white/8 text-left">
          <div className="w-9 h-9 rounded-full bg-accent-cyan/10 flex items-center justify-center"><Archive size={18} className="text-accent-cyan" /></div>
          <span className="font-semibold text-[15px]">Archive chats</span>
        </button>
        <button onClick={onCancel} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl active:bg-white/8 text-left text-gray-500">
          <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center"><X size={18} /></div>
          <span className="font-semibold text-[15px]">Cancel</span>
        </button>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
function ClientOnlySignalPage({ firebaseUser, userProfile }: { firebaseUser: any; userProfile: any }) {
  const [chats,          setChats]          = useState<any[]>([]);
  const [searchTerm,     setSearchTerm]     = useState('');
  const [selectionMode,  setSelectionMode]  = useState(false);
  const [selectedItems,  setSelectedItems]  = useState<Set<string>>(new Set());
  const [showActionSheet,setShowActionSheet] = useState(false);
  const [onlineStatus,   setOnlineStatus]   = useState<Record<string, boolean>>({});
  const [quickDropChat,  setQuickDropChat]  = useState<any>(null);
  const [showNewMenu,    setShowNewMenu]    = useState(false);
  const router = useRouter();
  const { drafts } = useAppState();
  const onlineUnsubs = useRef<(() => void)[]>([]);

  const getChatId = useCallback((chat: any) =>
    chat?.isGroup ? chat.id : [firebaseUser.uid, chat?.id].sort().join('_'),
  [firebaseUser.uid]);

  const processChatData = useCallback(async (chatDoc: any, isGroup: boolean) => {
    const chatData = { id: chatDoc.id, ...chatDoc.data(), isGroup };
    const chatId   = isGroup ? chatDoc.id : [firebaseUser.uid, chatDoc.id].sort().join('_');
    const [lastSnap, unreadSnap] = await Promise.all([
      getDocs(query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'desc'), limit(1))),
      getDocs(query(collection(db, 'chats', chatId, 'messages'), where('sender', '!=', firebaseUser.uid), orderBy('sender'), orderBy('createdAt', 'desc'), limit(30))),
    ]);
    const lastMessage = lastSnap.empty ? null : lastSnap.docs[0].data();
    const unreadCount = unreadSnap.docs.filter(d => !(d.data().readBy ?? []).includes(firebaseUser.uid)).length;
    return { ...chatData, lastMessage, unreadCount, _chatId: chatId };
  }, [firebaseUser.uid]);

  const sortChats = useCallback((list: any[], starred: string[]) =>
    [...list].sort((a, b) => {
      const as = starred.includes(getChatId(a)), bs = starred.includes(getChatId(b));
      if (as && !bs) return -1; if (!as && bs) return 1;
      return (b.lastMessage?.createdAt?.toDate?.() ?? 0) - (a.lastMessage?.createdAt?.toDate?.() ?? 0);
    }),
  [getChatId]);

  useEffect(() => {
    if (!firebaseUser || !userProfile) return;
    const archived: string[] = userProfile.signalManagement?.archived ?? [];
    const starred:  string[] = userProfile.signalManagement?.starred  ?? [];
    const unsubs: (() => void)[] = [];

    const subOnline = (uid: string, chatId: string) => {
      onlineUnsubs.current.push(
        onSnapshot(doc(db, 'users', uid), snap => {
          setOnlineStatus(p => ({ ...p, [chatId]: snap.data()?.status === 'online' }));
        })
      );
    };

    // Groups live subscription
    unsubs.push(onSnapshot(
      query(collection(db, 'groups'), where('members', 'array-contains', firebaseUser.uid)),
      async snap => {
        const groups = (await Promise.all(snap.docs.map(d => processChatData(d, true)))).filter(c => c && !archived.includes(c.id));
        setChats(prev => sortChats([...prev.filter(c => !c.isGroup), ...groups], starred));
      }
    ));

    // DMs (one-time fetch, cost-saving)
    (async () => {
      const [fSnap, frSnap] = await Promise.all([
        getDocs(collection(db, 'users', firebaseUser.uid, 'following')),
        getDocs(collection(db, 'users', firebaseUser.uid, 'followers')),
      ]);
      const ids = Array.from(new Set([...fSnap.docs.map(d => d.id), ...frSnap.docs.map(d => d.id)]));
      const dms = (await Promise.all(ids.map(async uid => {
        const snap = await getDoc(doc(db, 'users', uid));
        if (!snap.exists()) return null;
        const c = await processChatData(snap, false);
        if (archived.includes(c._chatId)) return null;
        subOnline(uid, c._chatId);
        return c;
      }))).filter(Boolean);
      setChats(prev => sortChats([...prev.filter(c => c.isGroup), ...dms], starred));
    })();

    return () => {
      unsubs.forEach(u => u());
      onlineUnsubs.current.forEach(u => u());
      onlineUnsubs.current = [];
    };
  }, [firebaseUser, userProfile, processChatData, sortChats]);

  const toggleItem  = (id: string) => setSelectedItems(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    if (next.size === 0) setSelectionMode(false);
    return next;
  });
  const cancelSel   = () => { setSelectionMode(false); setSelectedItems(new Set()); setShowActionSheet(false); };

  const archiveSingle = async (chatId: string) => {
    const chat = chats.find(c => c.id === chatId); if (!chat) return;
    await updateDoc(doc(db, 'users', firebaseUser.uid), { 'signalManagement.archived': arrayUnion(getChatId(chat)) });
    setChats(p => p.filter(c => c.id !== chatId));
  };

  const archiveSel = async () => {
    const ids = Array.from(selectedItems).map(id => getChatId(chats.find(c => c.id === id)!));
    await updateDoc(doc(db, 'users', firebaseUser.uid), { 'signalManagement.archived': arrayUnion(...ids) });
    setChats(p => p.filter(c => !selectedItems.has(c.id)));
    cancelSel();
  };

  const handleStar = async () => {
    const cur: string[] = userProfile.signalManagement?.starred ?? [];
    const ids = Array.from(selectedItems).map(id => getChatId(chats.find(c => c.id === id)!));
    if (cur.length + ids.filter(id => !cur.includes(id)).length > 5) { alert('Max 5 starred chats.'); return; }
    await updateDoc(doc(db, 'users', firebaseUser.uid), { 'signalManagement.starred': arrayUnion(...ids) });
    cancelSel();
  };

  const handleUnstar = async () => {
    const ids = Array.from(selectedItems).map(id => getChatId(chats.find(c => c.id === id)!));
    await updateDoc(doc(db, 'users', firebaseUser.uid), { 'signalManagement.starred': arrayRemove(...ids) });
    cancelSel();
  };

  const handleQuickDrop = async (item: string) => {
    if (!quickDropChat) return;
    await addDoc(collection(db, 'chats', getChatId(quickDropChat), 'messages'), {
      sender: firebaseUser.uid, createdAt: serverTimestamp(),
      type: 'text', readBy: [firebaseUser.uid], reactions: {}, deletedFor: [], text: item,
    });
    setQuickDropChat(null);
  };

  const starred   = userProfile.signalManagement?.starred ?? [];
  const selIds    = Array.from(selectedItems).map(id => getChatId(chats.find(c => c.id === id)!));
  const canStar   = selIds.some(id => !starred.includes(id));
  const canUnstar = selIds.some(id =>  starred.includes(id));
  const filtered  = chats.filter(c =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    // bg-transparent → app-level background/gradient shows through
    <div className="fixed inset-0 flex w-full text-white overflow-hidden bg-transparent">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <div className="w-full md:w-[360px] md:flex-shrink-0 flex flex-col relative border-r border-white/[0.05]">

        {/* Glass header */}
        <div className="bg-black/40 backdrop-blur-2xl border-b border-white/[0.06] z-30">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h1 className="text-xl font-headline font-bold text-white">Signal</h1>
            <div className="flex items-center gap-1">
              <Link href="/squad/explore">
                <motion.button whileTap={{ scale: 0.9 }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.07] hover:bg-white/[0.11] text-[13px] text-gray-300 transition-colors border border-white/[0.07]">
                  <Compass size={13} /> Explore
                </motion.button>
              </Link>

              {/* New chat/group dropdown */}
              <div className="relative">
                <motion.button whileTap={{ scale: 0.88 }} onClick={() => setShowNewMenu(v => !v)} className="p-2 rounded-full hover:bg-white/[0.07] transition-colors text-gray-400">
                  <Plus size={20} />
                </motion.button>
                <AnimatePresence>
                  {showNewMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowNewMenu(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.94 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.94 }}
                        transition={{ duration: 0.13 }}
                        className="absolute right-0 top-full mt-2 w-44 bg-black/70 backdrop-blur-2xl border border-white/[0.09] rounded-2xl shadow-2xl py-1.5 z-50"
                      >
                        <button onClick={() => { setShowNewMenu(false); router.push('/signal/create-group'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/[0.07] transition-colors text-left">
                          <Users size={15} className="text-accent-cyan" /> New Group
                        </button>
                        <Link href="/squad/explore" onClick={() => setShowNewMenu(false)}>
                          <div className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/[0.07] transition-colors">
                            <MessageSquarePlus size={15} className="text-accent-pink" /> New Chat
                          </div>
                        </Link>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <motion.button whileTap={{ scale: 0.88 }} onClick={() => { setSelectionMode(v => !v); setSelectedItems(new Set()); }} className="p-2 rounded-full hover:bg-white/[0.07] transition-colors text-gray-500">
                <MoreVertical size={20} />
              </motion.button>
            </div>
          </div>

          {/* Search */}
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={15} />
              <input
                type="text" placeholder="Search chats…" value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-white/[0.06] border border-white/[0.06] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent-cyan/30 focus:bg-white/[0.08] transition-all"
              />
              {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400"><X size={13} /></button>}
            </div>
          </div>

          {/* Selection bar */}
          <AnimatePresence>
            {selectionMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden bg-accent-cyan/[0.05] border-t border-accent-cyan/20"
              >
                <div className="flex items-center justify-between px-4 py-2.5">
                  <button onClick={cancelSel} className="text-gray-500 hover:text-white transition-colors"><X size={18} /></button>
                  <span className="text-sm font-semibold text-gray-200">{selectedItems.size} selected</span>
                  {/* Desktop inline actions */}
                  <div className="hidden md:flex items-center gap-1">
                    {canStar   && <button onClick={handleStar}   className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/8 text-sm text-yellow-400 transition-colors"><Star size={14} />Star</button>}
                    {canUnstar && <button onClick={handleUnstar} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/8 text-sm text-gray-400 transition-colors"><Star size={14} />Unstar</button>}
                    <button onClick={archiveSel} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/8 text-sm text-accent-cyan transition-colors"><Archive size={14} />Archive</button>
                  </div>
                  {/* Mobile: bottom sheet */}
                  <button onClick={() => setShowActionSheet(true)} className="md:hidden p-1.5 rounded-lg text-gray-400 disabled:opacity-30" disabled={selectedItems.size === 0}>
                    <MoreVertical size={18} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Chat list — pb-16 clears bottom nav bar */}
        <div className="flex-1 overflow-y-auto pb-16" style={{ scrollbarWidth: 'none' }}>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-72 px-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.05] flex items-center justify-center mb-4">
                <Inbox size={24} className="text-gray-700" strokeWidth={1.5} />
              </div>
              <p className="font-semibold text-gray-400 mb-1 text-sm">No chats yet</p>
              <p className="text-xs text-gray-700">Explore creators to start chatting</p>
            </div>
          ) : (
            filtered.map(chat => {
              const fullId = getChatId(chat);
              return (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  selectionMode={selectionMode}
                  isSelected={selectedItems.has(chat.id)}
                  isStarred={starred.includes(fullId)}
                  draft={drafts[fullId]}
                  onlineStatus={onlineStatus[fullId]}
                  onClick={() => selectionMode ? toggleItem(chat.id) : router.push(`/signal/${fullId}`)}
                  onArchive={() => archiveSingle(chat.id)}
                  onLongPress={() => { if (!selectionMode) setQuickDropChat(chat); }}
                />
              );
            })
          )}
        </div>
      </div>

      {/* ── Desktop lobby ─────────────────────────────────────────────────── */}
      <div className="hidden md:flex flex-1 items-center justify-center bg-transparent">
        <ChatLobby />
      </div>

      {/* ── Quick Drop ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {quickDropChat && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            // pb-20 so menu clears bottom nav on mobile
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-end md:items-center justify-center pb-20 md:pb-0"
            onClick={() => setQuickDropChat(null)}
          >
            <div className="px-4 w-full md:w-auto">
              <p className="text-center text-xs text-white/30 mb-3">
                Quick drop to <span className="text-white font-semibold">{quickDropChat.name || quickDropChat.username}</span>
              </p>
              <QuickDropMenu onSelect={handleQuickDrop} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mobile action sheet ───────────────────────────────────────────── */}
      <AnimatePresence>
        {showActionSheet && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/50" onClick={() => setShowActionSheet(false)} />
            <ActionSheet
              count={selectedItems.size}
              canStar={canStar} canUnstar={canUnstar}
              onStar={() => { handleStar(); setShowActionSheet(false); }}
              onUnstar={() => { handleUnstar(); setShowActionSheet(false); }}
              onArchive={() => { archiveSel(); setShowActionSheet(false); }}
              onCancel={() => setShowActionSheet(false)}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
function SignalPage() {
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [userProfile,  setUserProfile]  = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(user => {
      if (!user) { router.push('/login'); return; }
      setFirebaseUser(user);
      const up = onSnapshot(doc(db, 'users', user.uid), snap => {
        setUserProfile({ uid: user.uid, ...user, ...(snap.exists() ? snap.data() : {}) });
        setLoading(false);
      });
      return () => up();
    });
    return () => unsub();
  }, [router]);

  if (loading || !firebaseUser || !userProfile) return (
    <div className="fixed inset-0 flex items-center justify-center bg-transparent">
      <div className="w-8 h-8 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
    </div>
  );
  return <ClientOnlySignalPage firebaseUser={firebaseUser} userProfile={userProfile} />;
}

export default function SignalPageWrapper() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 flex items-center justify-center bg-transparent">
        <div className="w-8 h-8 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SignalPage />
    </Suspense>
  );
}