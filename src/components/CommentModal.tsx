"use client";
import React, { useState, useEffect, useRef } from 'react';
import { getFirestore, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { auth, app } from '@/utils/firebaseClient';
import { useAppState } from '@/utils/AppStateContext';
import { motion } from 'framer-motion';
import { X, Send, ThumbsUp, MoreVertical, Edit, Trash, MessageCircle, Smile, CornerDownRight, Clock, Pin, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import Picker from 'emoji-picker-react';
import { GiphyPicker } from '@/components/signal/GiphyPicker';
import { IGif } from '@giphy/js-types';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { isAbusive } from '@/utils/moderation';
import { cn } from '@/lib/utils';

const db = getFirestore(app);
const functions = getFunctions(app);
const COMMENT_MAX_LENGTH = 2400;

// Avatar width = w-9 = 36px. Thread line aligns to its horizontal centre.
const AVATAR_CENTER = 17; // px from left (half of 36 minus 1 for border width)
const AVATAR_W = 36;
const AVATAR_GAP = 12; // gap-3

interface Comment {
    id: string;
    userId: string;
    text: string;
    createdAt: any;
    likes?: string[];
    type?: 'text' | 'gif';
    parentId?: string | null;
    replies?: Comment[];
    replyCount?: number;
}

interface UserProfile {
    username: string;
    avatar_url: string;
}

const formatTimestamp = (ts: any) => {
    if (!ts?.toDate) return '';
    const d = ts.toDate();
    const diffS = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diffS < 10) return 'now';
    if (diffS < 60) return `${diffS}s`;
    const diffM = Math.floor(diffS / 60);
    if (diffM < 60) return `${diffM}m`;
    const diffH = Math.floor(diffM / 60);
    if (diffH < 24) return `${diffH}h`;
    return `${Math.floor(diffH / 24)}d`;
};

// Splits comment text into plain-string and timestamp-token parts
const parseTimestamps = (text: string) => {
    const re = /\b(?:(\d+):)?(\d{1,2}):(\d{2})\b/g;
    const out: (string | { type: 'ts'; text: string; time: number })[] = [];
    let last = 0, m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
        if (m.index > last) out.push(text.slice(last, m.index));
        out.push({
            type: 'ts',
            text: m[0],
            time: (parseInt(m[1] || '0') * 3600) + (parseInt(m[2]) * 60) + parseInt(m[3]),
        });
        last = m.index + m[0].length;
    }
    if (last < text.length) out.push(text.slice(last));
    return out;
};

// ─── EditCommentDialog ────────────────────────────────────────────────────────

const EditCommentDialog = ({ comment, postId, collectionName, onOpenChange, onFinish }: {
    comment: Comment; postId: string; collectionName: string;
    onOpenChange: (o: boolean) => void; onFinish: () => void;
}) => {
    const [text, setText] = useState(comment.text);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');
    const updateFn = httpsCallable(functions, 'updateComment');

    const save = async () => {
        if (!text.trim() || text.trim() === comment.text) { onFinish(); return; }
        if (text.length > COMMENT_MAX_LENGTH) { setErr(`Max ${COMMENT_MAX_LENGTH} characters.`); return; }
        if (isAbusive(text)) { setErr('Contains abusive language.'); return; }
        setSaving(true); setErr('');
        try { await updateFn({ postId, commentId: comment.id, newText: text.trim() }); onFinish(); }
        catch { alert('Failed to save. Try again.'); }
        finally { setSaving(false); }
    };

    return (
        <AlertDialog open onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Edit Comment</AlertDialogTitle>
                    <AlertDialogDescription>Make changes to your comment below.</AlertDialogDescription>
                </AlertDialogHeader>
                <Textarea value={text} onChange={(e) => setText(e.target.value)} className="my-4" rows={4} maxLength={COMMENT_MAX_LENGTH} />
                <p className="text-xs text-muted-foreground -mt-2 mb-1">{text.length} / {COMMENT_MAX_LENGTH}</p>
                {err && <p className="text-red-500 text-sm">{err}</p>}
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onFinish}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

// ─── CommentComponent ─────────────────────────────────────────────────────────

interface CommentComponentProps {
    comment: Comment;
    postId: string;
    currentUser: any;
    collectionName: string;
    onEdit: (c: Comment) => void;
    onReply: (c: Comment, username?: string) => void;
    onTimestampClick?: (time: number) => void;
    isPostOwner?: boolean;
    onPin?: (id: string | null) => void;
    isPinned?: boolean;
    postAuthorUsername?: string;
    isReply?: boolean;
}

export const CommentComponent = ({
    comment, postId, currentUser, collectionName,
    onEdit, onReply, onTimestampClick,
    isPostOwner, onPin, isPinned, postAuthorUsername, isReply = false,
}: CommentComponentProps) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAll, setShowAll] = useState(false);
    const deleteFn = httpsCallable(functions, 'deleteComment');

    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'users', comment.userId), (s) => {
            setProfile(s.exists() ? (s.data() as UserProfile) : null);
            setLoading(false);
        });
        return () => unsub();
    }, [comment.userId]);

    const handleLike = async () => {
        if (!currentUser) return;
        const ref = doc(db, collectionName, postId, 'comments', comment.id);
        const next = (comment.likes || []).includes(currentUser.uid)
            ? (comment.likes || []).filter((u) => u !== currentUser.uid)
            : [...(comment.likes || []), currentUser.uid];
        await updateDoc(ref, { likes: next }).catch(console.error);
    };

    const handleDelete = async () => {
        if (!window.confirm('Delete this comment?')) return;
        try { await deleteFn({ postId, commentId: comment.id }); }
        catch { alert('Failed to delete comment.'); }
    };

    const replies = comment.replies || [];
    const hasReplies = replies.length > 0;
    const visible = showAll ? replies : replies.slice(0, 1);
    const hidden = replies.length - 1;
    const liked = comment.likes?.includes(currentUser?.uid);
    const likeCount = (comment.likes || []).length;
    const isOwner = comment.userId === currentUser?.uid;
    const showMenu = isPostOwner || isOwner;
    const hasTs = comment.type !== 'gif' && /\b(?:(\d+):)?(\d{1,2}):(\d{2})\b/.test(comment.text);

    // Indent values for reply connector geometry
    // Vertical line sits at x = AVATAR_CENTER from the comment's left edge
    // Reply wrapper left-padding = AVATAR_CENTER + AVATAR_GAP = 29px
    const REPLY_INDENT = AVATAR_CENTER + AVATAR_GAP; // 29px
    // Curved L width: from line centre to reply avatar left edge
    const CURVE_W = REPLY_INDENT - 2; // ~27px

    if (loading) {
        return (
            <div className="flex items-start gap-3 animate-pulse py-1">
                <div className="w-9 h-9 rounded-full bg-white/10 flex-shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                    <div className="h-2.5 bg-white/10 rounded w-1/4" />
                    <div className="h-2.5 bg-white/10 rounded w-3/4" />
                </div>
            </div>
        );
    }

    return (
        <div className="relative">
            {/*
             * ── VERTICAL THREAD LINE ──────────────────────────────────────────
             * Runs from just below the avatar down to where the replies end.
             * Positioned at the horizontal centre of the avatar.
             */}
            {hasReplies && (
                <div
                    className="absolute top-9 bottom-0 w-px rounded-full pointer-events-none"
                    style={{
                        left: `${AVATAR_CENTER}px`,
                        background: 'linear-gradient(to bottom, rgba(255,255,255,0.15), rgba(255,255,255,0.04))',
                    }}
                />
            )}

            {/* ── MAIN COMMENT ROW ─────────────────────────────────────────────── */}
            <div className={cn(
                'flex items-start gap-3 group',
                hasTs && !isPinned && 'bg-sky-950/30 border border-sky-800/25 rounded-xl p-2 -mx-2'
            )}>
                {/* Avatar — z-10 so it sits above the thread line */}
                <Link href={`/squad/${profile?.username}`} className="flex-shrink-0 relative z-10">
                    <img
                        src={profile?.avatar_url || '/img/default-avatar.png'}
                        alt={profile?.username || 'User'}
                        className="w-9 h-9 rounded-full object-cover ring-1 ring-white/10 hover:ring-white/25 transition"
                    />
                </Link>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {isPinned && (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1">
                            <Pin className="w-3 h-3 text-yellow-400" />
                            Pinned by <span className="text-yellow-400">@{postAuthorUsername || 'creator'}</span>
                        </div>
                    )}

                    <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0 flex-1">
                            <Link href={`/squad/${profile?.username}`} className="font-bold text-sm hover:underline">
                                @{profile?.username || 'deleteduser'}
                            </Link>

                            {comment.type === 'gif' ? (
                                <img src={comment.text} alt="GIF" className="mt-2 rounded-xl max-w-[220px]" />
                            ) : (
                                <p className="text-base whitespace-pre-wrap mt-0.5 leading-snug">
                                    {parseTimestamps(comment.text).map((part, i) =>
                                        typeof part === 'string' ? (
                                            <React.Fragment key={i}>{part}</React.Fragment>
                                        ) : (
                                            <button
                                                key={i}
                                                className="inline-flex items-center gap-0.5 text-accent-cyan font-semibold bg-accent-cyan/10 hover:bg-accent-cyan/20 px-1.5 py-0.5 rounded text-sm mx-0.5 transition-colors"
                                                onClick={(e) => { e.stopPropagation(); onTimestampClick?.(part.time); }}
                                            >
                                                <Clock className="w-3 h-3 flex-shrink-0" />
                                                {part.text}
                                            </button>
                                        )
                                    )}
                                </p>
                            )}
                        </div>

                        {showMenu && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 -mt-0.5 text-muted-foreground">
                                        <MoreVertical size={14} />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {isPostOwner && onPin && (
                                        isPinned
                                            ? <DropdownMenuItem onClick={() => onPin(null)}><Pin className="mr-2 h-4 w-4" />Unpin</DropdownMenuItem>
                                            : <DropdownMenuItem onClick={() => onPin(comment.id)}><Pin className="mr-2 h-4 w-4" />Pin</DropdownMenuItem>
                                    )}
                                    {isOwner && isPostOwner && <DropdownMenuSeparator />}
                                    {isOwner && comment.type === 'text' && (
                                        <DropdownMenuItem onClick={() => onEdit(comment)}><Edit size={14} className="mr-2" />Edit</DropdownMenuItem>
                                    )}
                                    {isOwner && (
                                        <DropdownMenuItem onClick={handleDelete} className="text-red-500 focus:text-red-500">
                                            <Trash size={14} className="mr-2" />Delete
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>

                    {/* Actions row */}
                    <div className="flex items-center gap-4 text-muted-foreground text-xs mt-1.5">
                        <span>{formatTimestamp(comment.createdAt)}</span>
                        <button
                            className={cn('flex items-center gap-1 font-semibold transition-colors', liked ? 'text-accent-pink' : 'hover:text-white')}
                            onClick={handleLike}
                        >
                            <ThumbsUp size={12} />
                            {likeCount > 0 && likeCount}
                        </button>
                        <button
                            className="font-semibold hover:text-white transition-colors"
                            onClick={() => onReply(comment, profile?.username)}
                        >
                            Reply
                        </button>
                    </div>
                </div>
            </div>

            {/* ── REPLIES ──────────────────────────────────────────────────────── */}
            {hasReplies && (
                <div className="mt-2 space-y-3" style={{ paddingLeft: `${REPLY_INDENT}px` }}>
                    {visible.map((reply) => (
                        <div key={reply.id} className="relative" style={{ paddingLeft: `${CURVE_W + 4}px` }}>
                            {/*
                             * Curved L connector
                             * ─ The left border aligns with the vertical thread line above
                             * ─ The bottom border + rounded-bl creates the curved elbow
                             */}
                            <div
                                className="absolute top-0 border-l-2 border-b-2 border-white/[0.12] rounded-bl-xl pointer-events-none"
                                style={{ left: 0, width: `${CURVE_W}px`, height: '22px' }}
                            />
                            <CommentComponent
                                comment={reply}
                                postId={postId}
                                currentUser={currentUser}
                                collectionName={collectionName}
                                onEdit={onEdit}
                                onReply={onReply}
                                onTimestampClick={onTimestampClick}
                                isPostOwner={isPostOwner}
                                onPin={onPin}
                                postAuthorUsername={postAuthorUsername}
                                isReply
                            />
                        </div>
                    ))}

                    {/* Show / hide more replies */}
                    {replies.length > 1 && (
                        <div className="relative" style={{ paddingLeft: `${CURVE_W + 4}px` }}>
                            {/* Short L for the button row */}
                            <div
                                className="absolute top-0 border-l-2 border-b-2 border-white/[0.12] rounded-bl-xl pointer-events-none"
                                style={{ left: 0, width: `${CURVE_W}px`, height: '16px' }}
                            />
                            <button
                                onClick={() => setShowAll(!showAll)}
                                className="flex items-center gap-1.5 text-xs font-semibold text-accent-cyan hover:text-accent-cyan/80 bg-accent-cyan/10 hover:bg-accent-cyan/15 rounded-full px-3 py-1 transition-all mt-0.5"
                            >
                                {showAll
                                    ? <><ChevronUp size={11} />Hide replies</>
                                    : <><ChevronDown size={11} />{hidden} more {hidden === 1 ? 'reply' : 'replies'}</>
                                }
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── nestComments ─────────────────────────────────────────────────────────────

const nestComments = (comments: Comment[]): Comment[] => {
    if (!comments.length) return [];
    const map: Record<string, Comment> = {};
    comments.forEach((c) => { map[c.id] = { ...c, replies: [] }; });
    const root: Comment[] = [];
    comments.forEach((c) => {
        if (c.parentId && map[c.parentId]) map[c.parentId].replies!.push(map[c.id]);
        else root.push(map[c.id]);
    });
    return root;
};

// ─── CommentModal ─────────────────────────────────────────────────────────────

export function CommentModal({
    postId, postAuthorId, postAuthorUsername, onClose, post, collectionName,
    isOpen, isOverlay = true, videoCurrentTime, onTimestampClick, isPostOwner,
}: {
    postId: string;
    postAuthorId: string;
    postAuthorUsername?: string;
    onClose: () => void;
    post: any;
    collectionName: string;
    isOpen?: boolean;
    isOverlay?: boolean;
    videoCurrentTime?: number;
    onTimestampClick?: (time: number) => void;
    isPostOwner?: boolean;
}) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [editingComment, setEditingComment] = useState<Comment | null>(null);
    const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
    const [replyingToUsername, setReplyingToUsername] = useState<string | null>(null);
    const [modErr, setModErr] = useState('');
    const [showEmoji, setShowEmoji] = useState(false);
    const [showGiphy, setShowGiphy] = useState(false);
    const { currentUserProfile } = useAppState();
    const currentUser = auth.currentUser;
    const listRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const open = isOpen === undefined ? true : isOpen;

    useEffect(() => {
        if (!postId || !collectionName || !open) return;
        const q = query(collection(db, collectionName, postId, 'comments'), orderBy('createdAt', 'asc'));
        const unsub = onSnapshot(q, (s) => setComments(s.docs.map((d) => ({ id: d.id, ...d.data() } as Comment))), console.error);
        return () => unsub();
    }, [postId, collectionName, open]);

    const handleReply = (c: Comment, username?: string) => {
        setReplyingTo(c);
        setReplyingToUsername(username ?? null);
        setTimeout(() => textareaRef.current?.focus(), 50);
    };

    const cancelReply = () => { setReplyingTo(null); setReplyingToUsername(null); };

    const fmtTime = (t: number) => {
        const h = Math.floor(t / 3600);
        const m = String(Math.floor((t % 3600) / 60)).padStart(2, '0');
        const s = String(Math.floor(t % 60)).padStart(2, '0');
        return h > 0 ? `${String(h).padStart(2, '0')}:${m}:${s}` : `${m}:${s}`;
    };

    const addTimestamp = () => {
        if (videoCurrentTime !== undefined) {
            setNewComment((p) => `${p} ${fmtTime(videoCurrentTime)} `);
            textareaRef.current?.focus();
        }
    };

    const submitComment = async (text: string, type: 'text' | 'gif') => {
        if (!currentUser) return;
        setSubmitting(true); setModErr('');
        try {
            await addDoc(collection(db, collectionName, postId, 'comments'), {
                userId: currentUser.uid, text, type,
                createdAt: serverTimestamp(), likes: [],
                parentId: replyingTo?.id ?? null,
            });
            setNewComment(''); setReplyingTo(null); setReplyingToUsername(null); setShowGiphy(false);
            setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }), 200);
        } catch {
            alert('Failed to post. Try again.');
        } finally { setSubmitting(false); }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const t = newComment.trim();
        if (!t) return;
        if (t.length > COMMENT_MAX_LENGTH) { setModErr(`Max ${COMMENT_MAX_LENGTH} characters.`); return; }
        if (isAbusive(t)) { setModErr('Your comment contains inappropriate language.'); return; }
        submitComment(t, 'text');
    };

    const handlePin = async (id: string | null) => {
        if (!isPostOwner) return;
        try { await updateDoc(doc(db, collectionName, postId), { pinnedCommentId: id }); }
        catch { alert('Failed to update pin.'); }
    };

    // Timestamp click: fire seek first, only close overlay panels
    const handleTimestampClick = (time: number) => {
        onTimestampClick?.(time);
        if (isOverlay) onClose();
    };

    if (!open) return null;

    const pinnedComment = post.pinnedCommentId ? comments.find((c) => c.id === post.pinnedCommentId) : undefined;
    const nested = nestComments(comments.filter((c) => c.id !== post.pinnedCommentId));

    const over = newComment.length > COMMENT_MAX_LENGTH;
    const warn = newComment.length > COMMENT_MAX_LENGTH * 0.85;

    const commentProps = (c: Comment) => ({
        comment: c, postId, currentUser, collectionName,
        onEdit: setEditingComment, onReply: handleReply,
        onTimestampClick: handleTimestampClick,
        isPostOwner, onPin: handlePin, postAuthorUsername,
    });

    const content = (
        <div className="h-full w-full bg-background flex flex-col glass-card">

            {/* Header */}
            <div className="p-4 border-b border-glass-border flex items-center justify-between shrink-0">
                <h2 className="text-xl font-bold">
                    Comments{' '}
                    {(post.commentCount || comments.length) > 0 && (
                        <span className="text-muted-foreground font-normal text-base">
                            ({post.commentCount || comments.length})
                        </span>
                    )}
                </h2>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                    <X size={24} />
                </button>
            </div>

            {/* List */}
            {comments.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 gap-3">
                    <MessageCircle size={48} className="opacity-25" />
                    <div className="text-center">
                        <h3 className="font-bold text-lg">No comments yet</h3>
                        <p className="text-sm">Be the first one to share your thoughts!</p>
                    </div>
                </div>
            ) : (
                <div
                    ref={listRef}
                    className="flex-1 overflow-y-auto p-4 space-y-6"
                    style={{
                        /* Thin, subtle scrollbar matching the glass theme */
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'rgba(255,255,255,0.12) transparent',
                    }}
                >
                    {pinnedComment && (
                        <div className="bg-neutral-900/50 rounded-xl p-3 border border-yellow-800/20">
                            <CommentComponent {...commentProps(pinnedComment)} isPinned />
                        </div>
                    )}
                    {nested.map((c) => <CommentComponent key={c.id} {...commentProps(c)} />)}
                    <div className="h-1" />
                </div>
            )}

            {/* Input area */}
            <div className="p-3 border-t border-glass-border shrink-0 bg-background/50 relative">

                {showEmoji && (
                    <div className="absolute bottom-full right-0 z-20 w-full sm:w-auto sm:right-2">
                        <Picker
                            onEmojiClick={(obj) => {
                                setNewComment((p) => p + obj.emoji);
                                setShowEmoji(false);
                                textareaRef.current?.focus();
                            }}
                            pickerStyle={{ backgroundColor: '#0d0f1a', border: 'none' }}
                        />
                        <button onClick={() => setShowEmoji(false)} className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-muted-foreground"><X size={14} /></button>
                    </div>
                )}

                {showGiphy && (
                    <div className="absolute bottom-full left-0 right-0 z-20 max-h-[60vh] overflow-y-auto">
                        <GiphyPicker onGifClick={(gif: IGif) => submitComment(gif.images.original.url, 'gif')} />
                        <button onClick={() => setShowGiphy(false)} className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-muted-foreground hover:text-white"><X size={16} /></button>
                    </div>
                )}

                {/* Replying-to banner */}
                {replyingTo && (
                    <div className="bg-black/30 px-3 py-2.5 text-sm text-muted-foreground flex justify-between items-center rounded-t-lg border-b border-white/[0.06]">
                        <div className="flex items-center gap-3 min-w-0">
                            <CornerDownRight size={16} className="text-accent-cyan flex-shrink-0" />
                            <p className="text-sm overflow-hidden">
                                Replying to{' '}
                                <span className="font-semibold text-accent-cyan">
                                    @{replyingToUsername || replyingTo.userId}
                                </span>
                            </p>
                        </div>
                        <button onClick={cancelReply} className="p-1.5 rounded-full hover:bg-white/10 flex-shrink-0"><X size={16} /></button>
                    </div>
                )}

                {/* Composer */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                    <div className="flex items-start gap-2 pt-2">
                        <img
                            src={currentUserProfile?.avatar_url || '/img/default-avatar.png'}
                            alt="Your avatar"
                            className="w-9 h-9 rounded-full object-cover mt-1"
                        />
                        <div className="flex-1 relative">
                            <Textarea
                                ref={textareaRef}
                                value={newComment}
                                onChange={(e) => { setNewComment(e.target.value); if (modErr) setModErr(''); }}
                                placeholder="Vibe check ✨ Be kind & respectful 🙏"
                                className="bg-transparent border-border rounded-xl w-full resize-none text-base py-2 pl-4 pr-28"
                                rows={1}
                                maxLength={COMMENT_MAX_LENGTH}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e as any); }
                                }}
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                                {videoCurrentTime !== undefined && (
                                    <Button type="button" size="icon" onClick={addTimestamp} className="w-9 h-9 rounded-full bg-transparent hover:bg-white/10" title="Insert timestamp">
                                        <Clock size={20} />
                                    </Button>
                                )}
                                <Button type="button" size="icon" onClick={() => { setShowEmoji(!showEmoji); setShowGiphy(false); }} className="w-9 h-9 rounded-full bg-transparent hover:bg-white/10">
                                    <Smile size={20} />
                                </Button>
                                <Button type="button" onClick={() => { setShowGiphy(!showGiphy); setShowEmoji(false); }} className="h-9 px-2 rounded-full bg-transparent hover:bg-white/10 text-sm font-bold">
                                    GIF
                                </Button>
                                <Button
                                    type="submit"
                                    size="icon"
                                    disabled={submitting || !newComment.trim() || over}
                                    className="w-9 h-9 rounded-full bg-accent-green hover:bg-accent-green/80 disabled:opacity-40"
                                >
                                    <Send size={16} />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Char counter (only visible near limit) + error */}
                    <div className="flex items-center justify-between ml-11">
                        {modErr
                            ? <p className="text-red-500 text-sm">{modErr}</p>
                            : <span />
                        }
                        {warn && (
                            <p className={cn('text-xs', over ? 'text-red-500' : 'text-muted-foreground')}>
                                {newComment.length} / {COMMENT_MAX_LENGTH}
                            </p>
                        )}
                    </div>
                </form>
            </div>

            {editingComment && (
                <EditCommentDialog
                    comment={editingComment}
                    postId={postId}
                    collectionName={collectionName}
                    onOpenChange={(o) => !o && setEditingComment(null)}
                    onFinish={() => setEditingComment(null)}
                />
            )}
        </div>
    );

    if (isOverlay) {
        return (
            <>
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    onClick={onClose}
                />
                <motion.div
                    initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="fixed top-12 right-0 bottom-0 w-full max-w-lg z-50 sm:top-0 rounded-t-xl sm:rounded-none"
                    onClick={(e) => e.stopPropagation()}
                >
                    {content}
                </motion.div>
            </>
        );
    }

    return <div className="h-full w-full">{content}</div>;
}