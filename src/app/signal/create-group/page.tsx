'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  getFirestore, collection, getDocs, doc,
  addDoc, serverTimestamp, getDoc,
} from 'firebase/firestore';
import {
  getStorage, ref as storageRef,
  uploadBytes, getDownloadURL,
} from 'firebase/storage';
import { auth, app } from '@/utils/firebaseClient';
import { useAuthState } from 'react-firebase-hooks/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Camera, Check, Search, Users, X, Loader } from 'lucide-react';
import Link from 'next/link';
import imageCompression from 'browser-image-compression';

const db      = getFirestore(app);
const storage = getStorage(app);

// DiceBear fallback — generates a unique avatar SVG from the group name
const dicebearUrl = (seed: string) =>
  `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(seed)}&backgroundColor=0a0b14&radius=50`;

export default function CreateGroupPage() {
  const [user, authLoading] = useAuthState(auth);
  const router = useRouter();

  // ── Step state ─────────────────────────────────────────────────────────────
  const [step, setStep] = useState<'members' | 'details'>('members');

  // ── Connections ────────────────────────────────────────────────────────────
  const [connections,    setConnections]    = useState<any[]>([]);
  const [connectLoading, setConnectLoading] = useState(true);
  const [searchTerm,     setSearchTerm]     = useState('');
  const [selectedIds,    setSelectedIds]    = useState<string[]>([]);

  // ── Group details ──────────────────────────────────────────────────────────
  const [groupName,    setGroupName]    = useState('');
  const [description,  setDescription]  = useState('');
  const [avatarFile,   setAvatarFile]   = useState<File | null>(null);
  const [avatarPreview,setAvatarPreview]= useState<string | null>(null);
  const [isCompressing,setIsCompressing]= useState(false);
  const [isCreating,   setIsCreating]   = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch connections ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    (async () => {
      setConnectLoading(true);
      const [fSnap, frSnap] = await Promise.all([
        getDocs(collection(db, 'users', user.uid, 'following')),
        getDocs(collection(db, 'users', user.uid, 'followers')),
      ]);
      const allIds = Array.from(new Set([
        ...fSnap.docs.map(d => d.id),
        ...frSnap.docs.map(d => d.id),
      ]));
      const profiles = (await Promise.all(allIds.map(async uid => {
        const snap = await getDoc(doc(db, 'users', uid));
        return snap.exists() ? { id: snap.id, ...snap.data() } : null;
      }))).filter(Boolean);
      setConnections(profiles as any[]);
      setConnectLoading(false);
    })();
  }, [user]);

  // ── Avatar picker ──────────────────────────────────────────────────────────
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please pick an image file.'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Avatar must be under 5 MB.'); return; }
    setError(null);
    setIsCompressing(true);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.4,
        maxWidthOrHeight: 400,
        useWebWorker: true,
      });
      setAvatarFile(compressed);
      setAvatarPreview(URL.createObjectURL(compressed));
    } catch {
      setError('Could not process image. Try another one.');
    } finally {
      setIsCompressing(false);
      if (e.target) e.target.value = '';
    }
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  // ── Toggle member ──────────────────────────────────────────────────────────
  const toggleMember = (uid: string) =>
    setSelectedIds(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );

  // ── Create group ───────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!user || !groupName.trim() || selectedIds.length === 0) return;
    setIsCreating(true);
    setError(null);
    try {
      let avatar_url: string | null = null;

      if (avatarFile) {
        // Upload to group_avatars/{tempId}/{filename}
        const tempId  = `${user.uid}_${Date.now()}`;
        const fileRef = storageRef(storage, `group_avatars/${tempId}/${avatarFile.name}`);
        await uploadBytes(fileRef, avatarFile);
        avatar_url = await getDownloadURL(fileRef);
      }
      // If no avatar, use DiceBear — stored as null, rendered client-side
      // (saves storage writes; DiceBear is free & deterministic from groupId)

      const groupRef = await addDoc(collection(db, 'groups'), {
        name:        groupName.trim(),
        description: description.trim() || null,
        members:     [user.uid, ...selectedIds],
        admins:      [user.uid],
        createdBy:   user.uid,
        createdAt:   serverTimestamp(),
        isGroup:     true,
        avatar_url,          // null → DiceBear rendered from groupId
      });

      // Update storage path to use real group ID
      // (optional: re-upload with correct groupId path — skipped for MVP)

      router.push(`/signal/${groupRef.id}`);
    } catch (e) {
      console.error(e);
      setError('Failed to create group. Please try again.');
      setIsCreating(false);
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const filtered = connections.filter(c =>
    c.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const selectedProfiles = connections.filter(c => selectedIds.includes(c.id));
  const canProceed       = selectedIds.length > 0;
  const canCreate        = groupName.trim().length > 0 && !isCreating;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (authLoading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-transparent">
      <div className="w-8 h-8 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="fixed inset-0 flex flex-col text-white bg-transparent overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-black/40 backdrop-blur-2xl border-b border-white/[0.06] flex-shrink-0">
        <div className="flex items-center gap-3 px-4 h-16">
          {step === 'details' ? (
            <button
              onClick={() => setStep('members')}
              className="p-2 rounded-full hover:bg-white/[0.08] transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
          ) : (
            <Link href="/signal">
              <span className="p-2 rounded-full hover:bg-white/[0.08] transition-colors block">
                <ArrowLeft size={20} />
              </span>
            </Link>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-base">
              {step === 'members' ? 'Add Members' : 'Group Details'}
            </h1>
            <p className="text-xs text-gray-500">
              {step === 'members'
                ? `${selectedIds.length} selected`
                : `${selectedIds.length + 1} members`
              }
            </p>
          </div>

          {step === 'members' && canProceed && (
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setStep('details')}
              className="px-4 py-2 bg-accent-cyan text-black font-bold text-sm rounded-full"
            >
              Next
            </motion.button>
          )}

          {step === 'details' && (
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={handleCreate}
              disabled={!canCreate}
              className="px-4 py-2 bg-gradient-to-r from-accent-pink to-purple-600 text-white font-bold text-sm rounded-full disabled:opacity-40 transition-opacity shadow-lg shadow-accent-pink/20"
            >
              {isCreating ? <Loader size={16} className="animate-spin" /> : 'Create'}
            </motion.button>
          )}
        </div>
      </div>

      {/* ── Error banner ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-red-500/20 border-b border-red-500/30 px-4 py-2.5 text-red-300 text-sm flex items-center justify-between"
          >
            <span>{error}</span>
            <button onClick={() => setError(null)}><X size={14} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════════
          STEP 1 — SELECT MEMBERS
      ══════════════════════════════════════════════════════════════════════ */}
      {step === 'members' && (
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Selected chips */}
          <AnimatePresence>
            {selectedProfiles.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-b border-white/[0.05]"
              >
                <div className="flex gap-3 px-4 py-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                  {selectedProfiles.map(p => (
                    <motion.button
                      key={p.id}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      onClick={() => toggleMember(p.id)}
                      className="flex flex-col items-center gap-1 flex-shrink-0"
                    >
                      <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-tr from-accent-pink to-accent-cyan">
                        {p.avatar_url
                          ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center font-bold text-white">{p.name?.[0]}</div>
                        }
                        {/* Remove overlay */}
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <X size={14} className="text-white" />
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400 truncate max-w-[48px]">{p.username}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search */}
          <div className="px-4 py-3 border-b border-white/[0.05]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={15} />
              <input
                type="text"
                placeholder="Search connections…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/[0.06] border border-white/[0.06] text-sm placeholder-gray-600 focus:outline-none focus:border-accent-cyan/30 transition-all"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto pb-16" style={{ scrollbarWidth: 'none' }}>
            {connectLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-7 h-7 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-600 text-sm">
                <Users size={32} strokeWidth={1.5} className="mb-3 text-gray-700" />
                {connections.length === 0 ? 'Follow some creators first!' : 'No results found.'}
              </div>
            ) : (
              filtered.map(conn => {
                const isSelected = selectedIds.includes(conn.id);
                return (
                  <motion.div
                    key={conn.id}
                    onClick={() => toggleMember(conn.id)}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] active:bg-white/[0.06] cursor-pointer transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-tr from-accent-pink to-accent-cyan flex-shrink-0 flex items-center justify-center font-bold text-white">
                      {conn.avatar_url
                        ? <img src={conn.avatar_url} alt="" className="w-full h-full object-cover" />
                        : <span>{conn.name?.[0]?.toUpperCase()}</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[14.5px] truncate">{conn.name}</p>
                      <p className="text-sm text-gray-500 truncate">@{conn.username}</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? 'bg-accent-cyan border-accent-cyan' : 'border-white/20'}`}>
                      {isSelected && <Check size={14} className="text-black" strokeWidth={3} />}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          STEP 2 — GROUP DETAILS
      ══════════════════════════════════════════════════════════════════════ */}
      {step === 'details' && (
        <div className="flex-1 overflow-y-auto pb-16" style={{ scrollbarWidth: 'none' }}>
          <div className="max-w-md mx-auto px-6 py-8 flex flex-col gap-6">

            {/* Avatar picker */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div
                  className="w-24 h-24 rounded-full overflow-hidden bg-black/40 border-2 border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:border-accent-cyan/50 transition-colors"
                  onClick={() => !isCompressing && fileInputRef.current?.click()}
                >
                  {isCompressing ? (
                    <Loader size={28} className="text-gray-400 animate-spin" />
                  ) : avatarPreview ? (
                    <img src={avatarPreview} alt="Group avatar" className="w-full h-full object-cover" />
                  ) : groupName ? (
                    // DiceBear preview
                    <img
                      src={dicebearUrl(groupName)}
                      alt="Generated avatar"
                      className="w-full h-full object-cover opacity-60"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-gray-500">
                      <Camera size={24} />
                      <span className="text-[10px]">Photo</span>
                    </div>
                  )}
                </div>

                {/* Remove avatar button */}
                {avatarPreview && (
                  <button
                    onClick={removeAvatar}
                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shadow-lg"
                  >
                    <X size={12} className="text-white" />
                  </button>
                )}

                {/* Edit icon */}
                <button
                  onClick={() => !isCompressing && fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-accent-cyan flex items-center justify-center shadow-lg"
                >
                  <Camera size={13} className="text-black" />
                </button>
              </div>

              <p className="text-xs text-gray-600 text-center">
                {avatarPreview ? 'Tap × to remove' : 'Optional — we\'ll auto-generate one if you skip'}
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            {/* Group name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">Group Name *</label>
              <input
                type="text"
                placeholder="e.g. The Crew 🔥"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                maxLength={50}
                autoFocus
                className="bg-black/30 backdrop-blur border border-white/[0.08] rounded-2xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent-cyan/40 transition-all text-[15px]"
              />
              <span className="text-[11px] text-gray-700 text-right px-1">{groupName.length}/50</span>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">Description</label>
              <textarea
                placeholder="What's this group about? (optional)"
                value={description}
                onChange={e => setDescription(e.target.value)}
                maxLength={200}
                rows={3}
                className="bg-black/30 backdrop-blur border border-white/[0.08] rounded-2xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent-cyan/40 transition-all text-[14px] resize-none"
              />
              <span className="text-[11px] text-gray-700 text-right px-1">{description.length}/200</span>
            </div>

            {/* Members preview */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">
                {selectedIds.length + 1} Members
              </p>
              <div className="bg-black/30 backdrop-blur border border-white/[0.06] rounded-2xl overflow-hidden">
                {/* You */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04]">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-accent-pink to-accent-cyan flex items-center justify-center text-xs font-bold flex-shrink-0">
                    You
                  </div>
                  <div>
                    <p className="text-sm font-semibold">You</p>
                    <p className="text-[11px] text-accent-cyan">Admin</p>
                  </div>
                </div>
                {/* Selected */}
                {selectedProfiles.map((p, i) => (
                  <div
                    key={p.id}
                    className={`flex items-center gap-3 px-4 py-3 ${i < selectedProfiles.length - 1 ? 'border-b border-white/[0.04]' : ''}`}
                  >
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-tr from-accent-pink to-accent-cyan flex-shrink-0 flex items-center justify-center font-bold text-sm text-white">
                      {p.avatar_url
                        ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                        : p.name?.[0]?.toUpperCase()
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-[11px] text-gray-500 truncate">@{p.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Create button (also in header, but useful on scroll) */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleCreate}
              disabled={!canCreate}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-accent-pink to-purple-600 text-white font-bold text-[15px] disabled:opacity-40 transition-opacity shadow-lg shadow-accent-pink/20 flex items-center justify-center gap-2"
            >
              {isCreating
                ? <><Loader size={18} className="animate-spin" /> Creating…</>
                : <><Users size={18} /> Create Group</>
              }
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}