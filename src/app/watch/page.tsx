"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { doc, getDoc, getFirestore, collection, query, where, getDocs, limit, orderBy, onSnapshot, runTransaction, arrayUnion, arrayRemove } from 'firebase/firestore';
import { app, auth } from '@/utils/firebaseClient';
import Link from 'next/link';
import { InFeedVideoPlayer } from '@/components/video/InFeedVideoPlayer';
import { PostActions } from '@/components/PostActions';
import { CommentModal } from '@/components/CommentModal';
import { VideoThumbnail } from '@/components/video/VideoThumbnail';
import { Home, Search, UserPlus, UserCheck, Mic } from 'lucide-react';

const db = getFirestore(app);

export default function WatchPage() {
    const searchParams = useSearchParams();
    const videoId = searchParams.get('v');
    const [post, setPost] = useState<any>(null);
    const [author, setAuthor] = useState<any>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [recommended, setRecommended] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                const userRef = doc(db, "users", user.uid);
                const unsub = onSnapshot(userRef, (doc) => {
                    if (doc.exists()) {
                        setCurrentUser(user);
                        setCurrentUserProfile({ uid: user.uid, ...doc.data() });
                    } 
                });
                return () => unsub();
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        setLoading(true);
        if (!videoId) {
            setError("No video ID provided.");
            setLoading(false);
            return;
        }

        let postUnsub: (() => void) | undefined;
        let authorUnsub: (() => void) | undefined;
        let commentsUnsub: (() => void) | undefined;

        const fetchPostData = async () => {
            try {
                postUnsub = onSnapshot(doc(db, 'posts', videoId), async (postSnap) => {
                    if (postSnap.exists()) {
                        const postData = { id: postSnap.id, ...postSnap.data() };
                        setPost(postData);

                        if (postData.userId) {
                            if(authorUnsub) authorUnsub(); // Unsubscribe from old author listener
                            authorUnsub = onSnapshot(doc(db, 'users', postData.userId), (userSnap) => {
                                if (userSnap.exists()) {
                                    const userData = userSnap.data();
                                    setAuthor(userData);
                                    if (currentUser) {
                                        setIsFollowing(userData.followers?.includes(currentUser.uid));
                                    }
                                }
                            });
                        }

                        if(commentsUnsub) commentsUnsub();
                        const commentsQuery = query(collection(db, 'posts', videoId, 'comments'), orderBy('createdAt', 'desc'), limit(20));
                        commentsUnsub = onSnapshot(commentsQuery, (snapshot) => setComments(snapshot.docs.map(d => ({id: d.id, ...d.data()}))));

                        const recommendQuery = query(collection(db, 'posts'), where('__name__', '!=', videoId), limit(15));
                        const recommendSnap = await getDocs(recommendQuery);
                        const videoPosts = recommendSnap.docs
                            .map(d => ({id: d.id, ...d.data()}))
                            .filter(p => getFirstVideoUrl(p.mediaUrl))
                            .slice(0, 5);
                        setRecommended(videoPosts);

                    } else {
                        setError("Video not found.");
                    }
                    setLoading(false);
                });
            } catch (err: any) {
                console.error("Error fetching post data:", err);
                setError("Failed to load video and its details.");
                setLoading(false);
            }
        };

        fetchPostData();
        return () => {
            postUnsub && postUnsub();
            authorUnsub && authorUnsub();
            commentsUnsub && commentsUnsub();
        };
    }, [videoId, currentUser?.uid]);

    const handleFollow = async () => {
        if (!currentUser || !author || !post.userId) return;
        const userToFollowRef = doc(db, "users", post.userId);
        const currentUserRef = doc(db, "users", currentUser.uid);
        await runTransaction(db, async (t) => {
            const userToFollowDoc = await t.get(userToFollowRef);
            if (!userToFollowDoc.exists()) return;
            if (isFollowing) {
                t.update(userToFollowRef, { followers: arrayRemove(currentUser.uid) });
                t.update(currentUserRef, { following: arrayRemove(post.userId) });
            } else {
                t.update(userToFollowRef, { followers: arrayUnion(currentUser.uid) });
                t.update(currentUserRef, { following: arrayUnion(post.userId) });
            }
        });
    };
    
    const handleMicClick = () => {
        alert("Voice search is coming soon!");
    };

    const getFirstVideoUrl = (mediaUrl: any): string => {
        const url = Array.isArray(mediaUrl) ? mediaUrl.find(u => u.includes('.mp4') || u.includes('.webm')) : mediaUrl;
        return typeof url === 'string' && (url.includes('.mp4') || url.includes('.webm')) ? url : '';
    }

    if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-accent-cyan"></div></div>;
    if (error) return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
    if (!post) return <div className="flex justify-center items-center h-screen">Video not found.</div>;

    return (
        <div className="bg-background text-foreground min-h-screen pb-20"> {/* Add padding to bottom */}
            <header className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-md z-50 p-4 flex items-center justify-between gap-4">
                 <Link href="/vibespace" className="flex items-center gap-2 text-2xl font-bold text-accent-cyan hover:text-accent-green transition-colors font-logo">
                    Vibespace
                </Link>
                <div className="flex-1 flex justify-center px-4">
                    <div className="w-full max-w-lg relative">
                         <input type="text" placeholder="Search..." className="input-glass w-full pl-4 pr-10" />
                         <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                     <button onClick={handleMicClick} className="btn-glass ml-2 p-2"><Mic /></button>
                </div>
                 <div>
                    {currentUserProfile ? (
                        <Link href={`/squad/${currentUser.uid}`}>
                            <img src={currentUserProfile.avatar_url || 'https://via.placeholder.com/40'} alt="My Profile" className="w-10 h-10 rounded-full object-cover" />
                        </Link>
                    ) : (
                         <Link href="/login"><button className="btn-glass">Login</button></Link>
                    )}
                </div>
            </header>

            <main className="container mx-auto mt-24 p-4">
                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="flex-grow">
                        <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg">
                            <InFeedVideoPlayer mediaUrls={Array.isArray(post.mediaUrl) ? post.mediaUrl : [post.mediaUrl]} post={post} />
                        </div>
                         <div className="mt-4 flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div>
                                <h1 className="text-2xl font-bold font-headline text-accent-pink">{post.title || 'Post'}</h1>
                                {author && (
                                    <div className="flex items-center gap-3 mt-2">
                                        <Link href={`/squad/${post.userId}`}>
                                            <img src={author.avatar_url || 'https://via.placeholder.com/40'} alt={author.username} className="w-10 h-10 rounded-full object-cover" />
                                        </Link>
                                        <div>
                                            <Link href={`/squad/${post.userId}`} className="font-bold hover:underline">{author.username || 'User'}</Link>
                                            <p className="text-sm text-gray-400">{author.followers?.length || 0} Followers</p>
                                        </div>
                                         {currentUser && currentUser.uid !== post.userId && (
                                            <button onClick={handleFollow} className={`btn-glass flex items-center gap-2 ${isFollowing ? 'bg-accent-green/20 text-accent-green' : 'bg-accent-cyan text-black'}`}>
                                                {isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}
                                                {isFollowing ? 'Following' : 'Follow'}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="shrink-0">
                                <PostActions post={post} onCommentClick={() => setShowCommentModal(true)} />
                            </div>
                        </div>
                        <div className="mt-4 p-4 rounded-lg bg-black/20">
                            <h2 className="font-bold mb-2">Description</h2>
                            <p className="text-gray-300 whitespace-pre-line">{post.content || "No description provided."}</p>
                        </div>
                        <div className="mt-8">
                             <h2 className="text-xl font-bold mb-4">Comments ({post.commentCount || comments.length})</h2>
                             <div className="flex flex-col gap-4">
                                {comments.map(comment => (
                                    <div key={comment.id} className="flex items-start gap-3">
                                        <img src={comment.authorAvatar || 'https://via.placeholder.com/32'} alt="commenter avatar" className="w-8 h-8 rounded-full"/>
                                        <div>
                                            <p className="text-sm font-bold">@{comment.authorName || 'user'}</p>
                                            <p>{comment.text}</p>
                                        </div>
                                    </div>
                                ))}
                                 <button onClick={() => setShowCommentModal(true)} className="btn-glass mt-4">View all comments</button>
                            </div>
                        </div>
                    </div>
                    <aside className="lg:w-[450px] w-full shrink-0">
                        <h2 className="text-xl font-bold mb-4">Up Next</h2>
                        <div className="flex flex-col gap-4">
                            {recommended.map(recPost => (
                                <Link href={`/watch?v=${recPost.id}`} key={recPost.id} className="flex gap-4 hover:bg-white/10 p-2 rounded-lg transition-colors">
                                    <div className="w-48 h-28 bg-black rounded-lg overflow-hidden shrink-0">
                                        <VideoThumbnail src={getFirstVideoUrl(recPost.mediaUrl)} alt={recPost.title || 'Video Post'} />
                                    </div>
                                    <div className="flex-grow">
                                        <h3 className="font-bold text-base line-clamp-2 text-accent-green">{recPost.title || 'Video Post'}</h3>
                                        <p className="text-sm text-gray-400">@{recPost.username}</p>
                                         <p className="text-xs text-gray-500 mt-1">{recPost.viewCount || 0} views</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </aside>
                </div>
            </main>
            {showCommentModal && currentUser && videoId && <CommentModal postId={videoId} postAuthorId={post.userId} onClose={() => setShowCommentModal(false)} post={post} collectionName="posts" />}
        </div>
    );
}
