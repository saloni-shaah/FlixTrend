
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { getFirestore, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, getDocs, updateDoc, writeBatch } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { auth, app } from '@/utils/firebaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MoreVertical, Trash, ThumbsUp, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

const db = getFirestore(app);
const functions = getFunctions(app);
const deleteCommentCallable = httpsCallable(functions, 'deleteComment');

// --- TYPE DEFINITIONS ---
interface Reply {
    id: string;
    userId: string;
    username: string;
    avatar_url: string;
    text: string;
    createdAt: any;
    likes: string[];
}

interface Comment extends Reply {
    replies: Reply[];
}

// --- HELPER: Time Formatting ---
const formatTimestamp = (ts: any) => {
    if (!ts?.toDate) return '';
    const date = ts.toDate();
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return `${diffSeconds}s`;
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
};

// --- COMPONENT: Single Reply ---
const ReplyComponent = ({ reply, postId, parentCommentId, currentUser }: { reply: Reply, postId: string, parentCommentId: string, currentUser: any }) => {
    const handleLikeReply = async () => {
        if (!currentUser) return;
        const replyRef = doc(db, "posts", postId, "comments", parentCommentId, "replies", reply.id);
        const replyDoc = await getDoc(replyRef);
        const replyData = replyDoc.data();
        if (!replyData) return;
        
        let newLikes = [...(replyData.likes || [])];
        if (newLikes.includes(currentUser.uid)) {
            newLikes = newLikes.filter(uid => uid !== currentUser.uid);
        } else {
            newLikes.push(currentUser.uid);
        }
        await updateDoc(replyRef, { likes: newLikes });
    }

    return (
        <div className="flex items-start gap-2 pt-2">
            <Link href={`/squad/${reply.userId}`} className="flex-shrink-0">
                 <img src={reply.avatar_url || '/default-avatar.png'} alt={reply.username} className="w-8 h-8 rounded-full object-cover" />
            </Link>
            <div className="flex-1">
                <div className="bg-neutral-800 rounded-xl px-3 py-2">
                    <Link href={`/squad/${reply.userId}`} className="font-bold text-sm hover:underline">@{reply.username}</Link>
                    <p className="text-sm whitespace-pre-wrap mt-1">{reply.text}</p>
                </div>
                <div className="flex items-center gap-2 pl-3 text-muted-foreground text-xs mt-1">
                     <button 
                        className={`font-semibold hover:underline ${reply.likes.includes(currentUser?.uid || '') ? 'text-accent-pink' : ''}`}
                        onClick={handleLikeReply}
                    >
                        Like
                    </button>
                    <span className="text-xs">&#8226;</span>
                    <span>{formatTimestamp(reply.createdAt)}</span>
                    {reply.likes.length > 0 && <span className="flex items-center gap-1"><ThumbsUp size={12} className="text-accent-pink"/> {reply.likes.length}</span>}
                </div>
            </div>
        </div>
    );
}

// --- COMPONENT: Single Comment with Replies ---
const CommentComponent = ({ comment, postId, postAuthorId, onReply, currentUser }: { comment: Comment, postId: string, postAuthorId: string, onReply: (commentId: string, username: string) => void, currentUser: any }) => {

    const handleLikeComment = async () => {
        if (!currentUser) return;
        const commentRef = doc(db, "posts", postId, "comments", comment.id);
        const commentDoc = await getDoc(commentRef);
        const commentData = commentDoc.data();
        if (!commentData) return;
        
        let newLikes = [...(commentData.likes || [])];
        if (newLikes.includes(currentUser.uid)) {
            newLikes = newLikes.filter(uid => uid !== currentUser.uid);
        } else {
            newLikes.push(currentUser.uid);
        }
        await updateDoc(commentRef, { likes: newLikes });
    };

    const handleDeleteComment = async () => {
        if (window.confirm("Are you sure you want to delete this comment?")) {
            try {
                await deleteCommentCallable({ postId, commentId: comment.id });
            } catch (error: any) {
                console.error("Error deleting comment:", error);
                alert(`Error: ${error.message}`);
            }
        }
    };

    return (
        <div className="flex items-start gap-3 group">
            <Link href={`/squad/${comment.userId}`} className="flex-shrink-0">
                <img src={comment.avatar_url || '/default-avatar.png'} alt={comment.username} className="w-10 h-10 rounded-full object-cover" />
            </Link>

            <div className="flex-1">
                 <div className="relative">
                    <div className="bg-neutral-800 rounded-xl px-3 py-2">
                        <Link href={`/squad/${comment.userId}`} className="font-bold text-sm hover:underline">@{comment.username}</Link>
                        <p className="text-base whitespace-pre-wrap mt-1">{comment.text}</p>
                    </div>

                    {currentUser?.uid === comment.userId || currentUser?.uid === postAuthorId ? (
                         <DropdownMenu.Root>
                            <DropdownMenu.Trigger asChild>
                                <button className="absolute top-1 right-1 p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-white/10"><MoreVertical size={16}/></button>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Content align="end" className="glass-card min-w-[120px] z-10 p-1 rounded-lg shadow-lg">
                               <DropdownMenu.Item onSelect={handleDeleteComment} className="flex items-center gap-2 px-2 py-1.5 text-red-400 hover:bg-red-500/20 focus:bg-red-500/20 cursor-pointer rounded-md text-sm">
                                    <Trash size={14}/> Delete
                                </DropdownMenu.Item>
                            </DropdownMenu.Content>
                        </DropdownMenu.Root>
                    ) : null}
                </div>

                <div className="flex items-center gap-2 pl-3 text-muted-foreground text-xs mt-1">
                    <button 
                        className={`font-semibold hover:underline ${comment.likes.includes(currentUser?.uid || '') ? 'text-accent-pink' : ''}`}
                        onClick={handleLikeComment}
                    >
                        Like
                    </button>
                    <span className="text-xs">&#8226;</span>
                     <button className="font-semibold hover:underline" onClick={() => onReply(comment.id, comment.username)}>
                        Reply
                    </button>
                     <span className="text-xs">&#8226;</span>
                    <span>{formatTimestamp(comment.createdAt)}</span>
                     {comment.likes.length > 0 && <span className="flex items-center gap-1"><ThumbsUp size={12} className="text-accent-pink"/> {comment.likes.length}</span>}
                </div>
                
                <div className="pt-1">
                    {comment.replies && comment.replies.map(reply => (
                        <ReplyComponent key={reply.id} reply={reply} postId={postId} parentCommentId={comment.id} currentUser={currentUser} />
                    ))}
                </div>
            </div>
        </div>
    )
}

// --- MAIN MODAL COMPONENT ---
export function CommentModal({ postId, postAuthorId, onClose, post }: { postId: string, postAuthorId: string, onClose: () => void, post: any }) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [replyingTo, setReplyingTo] = useState<{ commentId: string; username: string } | null>(null);
    const currentUser = auth.currentUser;
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Fetch comments and replies in real-time
    useEffect(() => {
        const q = query(collection(db, "posts", postId, "comments"), orderBy("createdAt", "asc"));
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const commentsData = await Promise.all(snapshot.docs.map(async (commentDoc) => {
                const commentData = commentDoc.data();
                const userDoc = await getDoc(doc(db, 'users', commentData.userId));

                const repliesQuery = query(collection(commentDoc.ref, "replies"), orderBy("createdAt", "asc"));
                const repliesSnapshot = await getDocs(repliesQuery);
                const repliesData = await Promise.all(repliesSnapshot.docs.map(async (replyDoc) => {
                    const replyData = replyDoc.data();
                    const replyUserDoc = await getDoc(doc(db, 'users', replyData.userId));
                    return { id: replyDoc.id, ...replyData, username: replyUserDoc.data()?.username || 'anonymous', avatar_url: replyUserDoc.data()?.avatar_url || '' } as Reply;
                }));

                return { id: commentDoc.id, ...commentData, username: userDoc.data()?.username || 'anonymous', avatar_url: userDoc.data()?.avatar_url || '', replies: repliesData } as Comment;
            }));
            setComments(commentsData);
        });
        return () => unsubscribe();
    }, [postId]);

    const handleReply = (commentId: string, username: string) => {
        setReplyingTo({ commentId, username });
        setNewComment(`@${username} `);
        textareaRef.current?.focus();
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !currentUser) return;
        setIsSubmitting(true);

        const commentPayload = { userId: currentUser.uid, text: newComment, createdAt: serverTimestamp(), likes: [] };

        try {
            const batch = writeBatch(db);
            if (replyingTo) {
                const replyRef = doc(collection(db, "posts", postId, "comments", replyingTo.commentId, "replies"));
                batch.set(replyRef, commentPayload);
            } else {
                const commentRef = doc(collection(db, "posts", postId, "comments"));
                batch.set(commentRef, commentPayload);
                const postRef = doc(db, "posts", postId);
                batch.update(postRef, { commentCount: (post.commentCount || 0) + 1 });
            }
            await batch.commit();
            setNewComment('');
            setReplyingTo(null);
        } catch (error) {
            console.error("Error submitting comment/reply:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end" onClick={onClose}>
                <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="glass-card w-full max-w-md h-full flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
                    <div className="p-4 border-b border-glass-border flex items-center justify-between shrink-0">
                        <h2 className="text-xl font-bold">Comments ({post.commentCount || 0})</h2>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><X size={24} /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {comments.map((comment) => (
                            <CommentComponent key={comment.id} comment={comment} postId={postId} postAuthorId={postAuthorId} onReply={handleReply} currentUser={currentUser} />
                        ))}
                    </div>

                    <div className="p-3 border-t border-glass-border shrink-0 bg-neutral-900/50">
                         {replyingTo && (
                            <div className="text-sm text-muted-foreground mb-2 flex justify-between items-center px-1">
                                <span>Replying to @{replyingTo.username}</span>
                                <button onClick={() => { setReplyingTo(null); setNewComment(''); }} className="text-accent-pink hover:underline text-xs">Cancel</button>
                            </div>
                        )}
                        <form onSubmit={handleCommentSubmit} className="flex items-start gap-2">
                           <img src={currentUser?.photoURL || '/default-avatar.png'} alt="Your avatar" className="w-9 h-9 rounded-full object-cover" />
                           <div className="flex-1 relative">
                               <Textarea 
                                    ref={textareaRef} 
                                    value={newComment} 
                                    onChange={(e) => setNewComment(e.target.value)} 
                                    placeholder="Add a comment..." 
                                    className="bg-neutral-800 border-neutral-700 rounded-xl w-full pr-10 resize-none"
                                    rows={1}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleCommentSubmit(e as any);
                                        }
                                    }}
                                />
                                <Button type="submit" size="icon" disabled={isSubmitting || !newComment.trim()} className="absolute right-2 bottom-1.5 w-8 h-8 rounded-full bg-accent-green hover:bg-accent-green/80">
                                    <Send size={16} />
                                </Button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
