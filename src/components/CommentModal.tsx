
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { getFirestore, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, app } from '@/utils/firebaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, ThumbsUp } from 'lucide-react';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const db = getFirestore(app);

// --- TYPE DEFINITIONS ---
interface Comment {
    id: string;
    userId: string;
    username: string;
    avatar_url: string;
    text: string;
    createdAt: any;
    likes?: string[];
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

// --- COMPONENT: Single Comment ---
const CommentComponent = ({ comment, postId, currentUser, collectionName }: { comment: Comment, postId: string, currentUser: any, collectionName: string }) => {

    const handleLikeComment = async () => {
        if (!currentUser) return;
        const commentRef = doc(db, collectionName, postId, "comments", comment.id);
        const commentDoc = await getDoc(commentRef);
        const commentData = commentDoc.data();
        if (!commentData) return;
        
        const currentLikes = commentData.likes || [];
        let newLikes;
        if (currentLikes.includes(currentUser.uid)) {
            newLikes = currentLikes.filter((uid: string) => uid !== currentUser.uid);
        } else {
            newLikes = [...currentLikes, currentUser.uid];
        }

        try {
            await updateDoc(commentRef, { likes: newLikes });
        } catch (error) {
            console.error("Error liking comment (check firestore rules for update permissions):", error);
        }
    };

    const hasLiked = (comment.likes || []).includes(currentUser?.uid || '');
    const likeCount = (comment.likes || []).length;

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
                </div>

                <div className="flex items-center gap-2 pl-3 text-muted-foreground text-xs mt-1">
                    <button 
                        className={`font-semibold hover:underline ${hasLiked ? 'text-accent-pink' : ''}`}
                        onClick={handleLikeComment}
                    >
                        Like
                    </button>
                     <span className="text-xs">&#8226;</span>
                    <span>{formatTimestamp(comment.createdAt)}</span>
                     {likeCount > 0 && <span className="flex items-center gap-1"><ThumbsUp size={12} className="text-accent-pink"/> {likeCount}</span>}
                </div>
            </div>
        </div>
    )
}

// --- MAIN MODAL COMPONENT ---
export function CommentModal({ postId, postAuthorId, onClose, post, collectionName }: { postId: string, postAuthorId: string, onClose: () => void, post: any, collectionName: string }) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const currentUser = auth.currentUser;
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Fetch comments in real-time
    useEffect(() => {
        if (!postId || !collectionName) return;

        const q = query(collection(db, collectionName, postId, "comments"), orderBy("createdAt", "asc"));
        
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const commentsData = await Promise.all(snapshot.docs.map(async (commentDoc) => {
                const commentData = commentDoc.data();
                // The username/avatar are now stored on the comment, but we keep this for backwards compatibility
                const username = commentData.displayName || (await getDoc(doc(db, 'users', commentData.userId))).data()?.username || 'anonymous';
                const avatar_url = commentData.avatar_url || (await getDoc(doc(db, 'users', commentData.userId))).data()?.avatar_url || '';
                return {
                    id: commentDoc.id,
                    ...commentData,
                    username,
                    avatar_url
                } as Comment;
            }));
            setComments(commentsData);
        }, (error) => {
            console.error("Error fetching comments. This is likely a Firestore permissions issue.", error);
        });

        return () => unsubscribe();
    }, [postId, collectionName]);


    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !currentUser) return;
        setIsSubmitting(true);

        const commentPayload = {
            userId: currentUser.uid,
            text: newComment,
            createdAt: serverTimestamp(),
            likes: [],
            displayName: currentUser.displayName,
            avatar_url: currentUser.photoURL
        };

        try {
            // The onNewComment cloud function will handle incrementing the comment count.
            const commentsColRef = collection(db, collectionName, postId, "comments");
            await addDoc(commentsColRef, commentPayload);
            setNewComment('');
        } catch (error) {
            console.error("Error submitting comment:", error);
            alert("Failed to post comment. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end" onClick={onClose}>
                <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="glass-card w-full max-w-md h-full flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
                    <div className="p-4 border-b border-glass-border flex items-center justify-between shrink-0">
                        <h2 className="text-xl font-bold">Comments ({post.commentCount || comments.length})</h2>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><X size={24} /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {comments.map((comment) => (
                            <CommentComponent key={comment.id} comment={comment} postId={postId} currentUser={currentUser} collectionName={collectionName} />
                        ))}
                    </div>

                    <div className="p-3 border-t border-glass-border shrink-0 bg-neutral-900/50">
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
