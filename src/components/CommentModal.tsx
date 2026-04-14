
"use client";
import React, { useState, useEffect, useRef } from 'react';
import { getFirestore, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, getDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { auth, app } from '@/utils/firebaseClient';
import { useAppState } from '@/utils/AppStateContext';
import { motion } from 'framer-motion';
import { X, Send, ThumbsUp, MoreVertical, Edit, Trash, MessageCircle, User } from 'lucide-react';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
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

const db = getFirestore(app);
const functions = getFunctions(app);

interface Comment {
    id: string;
    userId: string;
    text: string;
    createdAt: any;
    likes?: string[];
}

interface UserProfile {
    username: string;
    avatar_url: string;
}

const formatTimestamp = (ts: any) => {
    if (!ts?.toDate) return '';
    const date = ts.toDate();
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSeconds < 10) return "now";
    if (diffSeconds < 60) return `${diffSeconds}s`;
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
};

const EditCommentDialog = ({ comment, postId, collectionName, onOpenChange, onFinish }: { comment: Comment, postId: string, collectionName: string, onOpenChange: (open: boolean) => void, onFinish: () => void }) => {
    const [newText, setNewText] = useState(comment.text);
    const [isSaving, setIsSaving] = useState(false);
    const updateCommentCallable = httpsCallable(functions, 'updateComment');

    const handleSave = async () => {
        if (!newText.trim() || newText.trim() === comment.text) {
            onFinish();
            return;
        }
        setIsSaving(true);
        try {
            await updateCommentCallable({ postId, commentId: comment.id, newText: newText.trim() });
            onFinish();
        } catch (error) {
            console.error("Error updating comment:", error);
            alert("Failed to save comment. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AlertDialog open={true} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Edit Comment</AlertDialogTitle>
                    <AlertDialogDescription>Make changes to your comment below.</AlertDialogDescription>
                </AlertDialogHeader>
                <Textarea value={newText} onChange={(e) => setNewText(e.target.value)} className="my-4" rows={4}/>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onFinish}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSave} disabled={isSaving}>{isSaving ? "Saving..." : "Save"}</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export const CommentComponent = ({ comment, postId, currentUser, collectionName, onEdit }: { comment: Comment, postId: string, currentUser: any, collectionName: string, onEdit: () => void }) => {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const userRef = doc(db, 'users', comment.userId);
        const unsubscribe = onSnapshot(userRef, (doc) => {
            if (doc.exists()) {
                setUserProfile(doc.data() as UserProfile);
            } else {
                setUserProfile(null);
            }
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [comment.userId]);

    const deleteCommentCallable = httpsCallable(functions, 'deleteComment');

    const handleLikeComment = async () => {
        if (!currentUser) return;
        const commentRef = doc(db, collectionName, postId, "comments", comment.id);
        const newLikes = (comment.likes || []).includes(currentUser.uid) 
            ? (comment.likes || []).filter(uid => uid !== currentUser.uid)
            : [...(comment.likes || []), currentUser.uid];
        await updateDoc(commentRef, { likes: newLikes }).catch(e => console.error("Error liking comment:", e));
    };

    const handleDeleteComment = async () => {
        if (window.confirm("Are you sure you want to delete this comment?")) {
            try {
                await deleteCommentCallable({ postId, commentId: comment.id });
            } catch (error) {
                console.error("Error deleting comment:", error);
                alert("Failed to delete comment.");
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-start gap-3 group py-3 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-neutral-700 flex-shrink-0"></div>
                <div className="flex-1">
                    <div className="w-2/4 h-4 bg-neutral-700 rounded"></div>
                    <div className="w-3/4 h-4 bg-neutral-700 rounded mt-2"></div>
                </div>
            </div>
        );
    }

    if (!userProfile) {
        return (
             <div className="flex items-start gap-3 group py-3 text-muted-foreground">
                <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center"><User size={20}/></div>
                <div className="flex-1">
                    <p className="text-sm font-semibold">[Deleted User]</p>
                    <p className="text-base whitespace-pre-wrap mt-1 text-neutral-400">{comment.text}</p>
                </div>
            </div>
        );
    }

    const isOwner = comment.userId === currentUser?.uid;
    const hasLiked = (comment.likes || []).includes(currentUser?.uid || '');
    const likeCount = (comment.likes || []).length;

    return (
        <div className="flex items-start gap-3 group py-3">
            <Link href={`/squad/${userProfile.username}`} className="flex-shrink-0">
                <img src={userProfile.avatar_url || '/img/default-avatar.png'} alt={userProfile.username} className="w-10 h-10 rounded-full object-cover" />
            </Link>
            <div className="flex-1">
                <div className="flex items-start justify-between">
                    <div>
                        <Link href={`/squad/${userProfile.username}`} className="font-bold text-sm hover:underline">@{userProfile.username}</Link>
                        <p className="text-base whitespace-pre-wrap mt-1">{comment.text}</p>
                    </div>
                    {isOwner && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical size={16}/></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={onEdit}><Edit size={14} className="mr-2"/> Edit</DropdownMenuItem>
                                <DropdownMenuItem onClick={handleDeleteComment} className="text-red-500"><Trash size={14} className="mr-2"/> Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
                <div className="flex items-center gap-3 text-muted-foreground text-xs mt-1.5">
                    <span>{formatTimestamp(comment.createdAt)}</span>
                    <button className={`flex items-center gap-1 font-semibold ${hasLiked ? 'text-accent-pink' : 'hover:text-white'}`} onClick={handleLikeComment}>
                        <ThumbsUp size={12} /> {likeCount > 0 ? likeCount : ''}
                    </button>
                </div>
            </div>
        </div>
    )
}

export function CommentModal({ postId, postAuthorId, onClose, post, collectionName }: { postId: string, postAuthorId: string, onClose: () => void, post: any, collectionName: string }) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingComment, setEditingComment] = useState<Comment | null>(null);
    const { currentUserProfile } = useAppState();
    const currentUser = auth.currentUser;
    const bottomOfList = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!postId || !collectionName) return;
        const q = query(collection(db, collectionName, postId, "comments"), orderBy("createdAt", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const commentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
            setComments(commentsData);
        }, (error) => {
            console.error("Error fetching comments:", error);
        });
        return () => unsubscribe();
    }, [postId, collectionName]);

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !currentUser) return;
        setIsSubmitting(true);

        const commentPayload = {
            userId: currentUser.uid,
            text: newComment.trim(),
            createdAt: serverTimestamp(),
            likes: [],
        };

        try {
            await addDoc(collection(db, collectionName, postId, "comments"), commentPayload);
            setNewComment('');
            bottomOfList.current?.scrollIntoView({ behavior: "smooth" });
        } catch (error) {
            console.error("Error submitting comment:", error);
            alert("Failed to post comment. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed top-0 right-0 h-full w-full max-w-md bg-background z-50 flex flex-col shadow-2xl glass-card"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4 border-b border-glass-border flex items-center justify-between shrink-0">
                    <h2 className="text-xl font-bold">Comments ({post.commentCount || 0})</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><X size={24} /></button>
                </div>

                {comments.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
                        <MessageCircle size={48} className="mb-4"/>
                        <h3 className="font-bold text-lg">No comments yet</h3>
                        <p className="text-sm">Be the first one to share your thoughts!</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-4">
                        {comments.map((comment) => (
                            <CommentComponent key={comment.id} comment={comment} postId={postId} currentUser={currentUser} collectionName={collectionName} onEdit={() => setEditingComment(comment)} />
                        ))}
                         <div ref={bottomOfList} />
                    </div>
                )}

                <div className="p-3 border-t border-glass-border shrink-0 bg-background/50">
                    <form onSubmit={handleCommentSubmit} className="flex items-start gap-2">
                       <img src={currentUserProfile?.avatar_url || '/img/default-avatar.png'} alt="Your avatar" className="w-9 h-9 rounded-full object-cover mt-1" />
                       <div className="flex-1 relative">
                           <Textarea 
                                value={newComment} 
                                onChange={(e) => setNewComment(e.target.value)} 
                                placeholder="Add a comment..." 
                                className="bg-neutral-800 border-neutral-700 rounded-xl w-full pr-12 resize-none text-base py-2 px-4"
                                rows={1}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleCommentSubmit(e as any);
                                    }
                                }}
                            />
                            <Button type="submit" size="icon" disabled={isSubmitting || !newComment.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-accent-green hover:bg-accent-green/80">
                                <Send size={16} />
                            </Button>
                        </div>
                    </form>
                </div>
            </motion.div>
            {editingComment && (
                 <EditCommentDialog 
                    comment={editingComment} 
                    postId={postId} 
                    collectionName={collectionName} 
                    onOpenChange={(open) => !open && setEditingComment(null)} 
                    onFinish={() => setEditingComment(null)} 
                />
            )}
        </>
    );
}
