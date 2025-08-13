"use client";
import React, { useState, useEffect, useRef } from "react";
import CreatePostModal from "./CreatePostModal";
import { getFirestore, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, updateDoc, doc as fsDoc, setDoc, getDoc, doc, runTransaction } from "firebase/firestore";
import { FaSearch, FaPlay, FaBell, FaRegComment, FaEye, FaRegBookmark, FaBookmark, FaShare, FaExclamationTriangle, FaVolumeMute, FaUserSlash, FaLink, FaEllipsisV, FaChevronLeft, FaChevronRight, FaMusic } from "react-icons/fa";
import { Repeat2, Bookmark, Plus } from "lucide-react";
import { auth } from "@/utils/firebaseClient";
import Link from "next/link";
import { almightyChat, AlmighyChatRequest, ChatMessage } from "@/ai/flows/almighty-chat-flow";
import { useAppState } from "@/utils/AppStateContext";

const db = getFirestore();

export default function HomePage() {
  const [showModal, setShowModal] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [flashes, setFlashes] = useState<any[]>([]);
  const [selectedFlashUser, setSelectedFlashUser] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAlmighty, setShowAlmighty] = useState(false);
  const [chat, setChat] = useState<ChatMessage[]>([
    { role: "model", parts: [{ text: "Hey! I'm Almighty AI. Ask me anything about FlixTrend, or just say hi!" }] }
  ]);
  const [input, setInput] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [isAlmightyLoading, setIsAlmightyLoading] = useState(false);
  const { setCallTarget, setIsCalling } = useAppState();
  const currentUser = auth.currentUser;


  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "flashes"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setFlashes(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  // Group flashes by user
  const groupedFlashes = flashes.reduce((acc, flash) => {
    if (!acc[flash.userId]) {
      acc[flash.userId] = {
        userId: flash.userId,
        username: flash.username,
        avatar_url: flash.avatar_url,
        flashes: []
      };
    }
    acc[flash.userId].flashes.push(flash);
    return acc;
  }, {});

  const flashUsers = Object.values(groupedFlashes);

  // Filtered posts for search
  const filteredPosts = searchTerm.trim()
    ? posts.filter(
        (post) =>
          (post.content && post.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (post.username && post.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (post.hashtags && post.hashtags.some((h: string) => h.toLowerCase().includes(searchTerm.toLowerCase())))
      )
    : posts;

  const handleAlmightySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isAlmightyLoading) return;

    const userMessage: ChatMessage = { role: "user", parts: [{ text: input }] };
    const newChatHistory = [...chat, userMessage];
    setChat(newChatHistory);
    setInput("");
    setIsAlmightyLoading(true);

    try {
      const request: AlmighyChatRequest = {
        history: newChatHistory,
        userId: currentUser?.uid || 'anonymous',
        displayName: currentUser?.displayName || 'Guest',
      };
      const response = await almightyChat(request);

      // Handle tool responses
      if (response.toolResponse) {
        if (response.toolResponse.name === 'initiateCall' && response.toolResponse.output) {
            const callTargetUser = response.toolResponse.output;
            setCallTarget(callTargetUser);
            setIsCalling(true);
            setChat(prev => [...prev, { role: 'model', parts: [{ text: `Sure, I'm calling ${callTargetUser.name} for you now!` }] }]);
        } else {
            setChat(prev => [...prev, { role: 'model', parts: [{ text: response.textResponse || "Done!" }] }]);
        }
      } else if (response.textResponse) {
        setChat(prev => [...prev, { role: 'model', parts: [{ text: response.textResponse }] }]);
      }
    } catch (error) {
      console.error("Almighty AI Error:", error);
      setChat(prev => [...prev, { role: 'model', parts: [{ text: "Sorry, I ran into a problem. Please try again." }] }]);
    } finally {
      setIsAlmightyLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen pt-6 pb-24 px-2 md:px-8 bg-white transition-colors">
      {/* Centered, prominent search bar */}
      <div className="flex justify-center items-center mb-6 w-full">
        <div className="relative w-full max-w-2xl bg-pink-100 rounded-2xl shadow-lg py-2">
          <input
            type="text"
            className="w-full pl-12 pr-4 py-3 rounded-full border border-accent-cyan/30 focus:outline-none focus:ring-2 focus:ring-accent-cyan bg-white/90 dark:bg-card/90 text-gray-900 dark:text-white text-lg shadow font-body"
            placeholder="Search posts or users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus={false}
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-accent-cyan dark:text-accent-cyan pointer-events-none">
            <FaSearch />
          </span>
          {searchTerm && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-accent-cyan text-xl"
              onClick={() => setSearchTerm("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>
      {/* Flashes/Stories Section */}
      <section className="mb-6 bg-yellow-100 rounded-2xl shadow-lg p-4">
        <h2 className="text-lg font-headline bg-gradient-to-r from-pink-500 via-yellow-400 to-blue-400 bg-clip-text text-transparent mb-2">Flashes</h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {flashUsers.length === 0 && (
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-accent-pink to-accent-cyan flex items-center justify-center text-3xl text-white opacity-60 border-4 border-accent-cyan/40 animate-bounce-slow">
              +
            </div>
          )}
          {flashUsers.map((userFlashes: any) => (
            <button
              key={userFlashes.userId}
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-accent-pink to-accent-cyan border-4 border-accent-cyan/40 flex items-center justify-center overflow-hidden focus:outline-none"
              onClick={() => setSelectedFlashUser(userFlashes)}
              title={userFlashes.username || "Flash"}
            >
              {userFlashes.avatar_url ? (
                  <img src={userFlashes.avatar_url} alt="flash" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl text-white">⚡</span>
              )}
            </button>
          ))}
        </div>
      </section>
      {/* Feed Section */}
      <section className="flex-1 flex flex-col items-center bg-blue-100 rounded-2xl shadow-lg p-4 mt-4">
        {filteredPosts.length === 0 ? (
          <div className="text-gray-400 text-center mt-16 animate-fade-in">
            <div className="text-4xl mb-2">🪐</div>
            <div className="text-lg font-semibold">No posts yet</div>
            <div className="text-sm">When users join, their photos, videos, and vibes will appear here!</div>
          </div>
        ) : (
          <div className="w-full max-w-xl flex flex-col gap-6">
            {filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>
      
      {/* Top Right FABs */}
      <div className="fixed top-4 right-4 z-50 flex gap-3">
        <button
          className="rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 p-4 shadow-fab-glow hover:scale-105 transition-all duration-200 focus:outline-none glass"
          title="Notifications"
          onClick={() => setShowNotifications(true)}
          aria-label="Notifications"
        >
          <FaBell className="text-xl text-white" />
        </button>
        <button
          className="rounded-full bg-gradient-to-tr from-accent-pink to-accent-cyan p-4 shadow-fab-glow hover:scale-105 transition-all duration-200 focus:outline-none glass"
          title="Create Post"
          onClick={() => setShowModal(true)}
          aria-label="Create Post"
        >
          <Plus className="text-xl text-white" />
        </button>
      </div>

      <div className="fixed inset-0 z-50" style={{ pointerEvents: showModal || selectedFlashUser || showNotifications ? 'auto' : 'none' }}>
        {showModal && <div className="absolute inset-0 bg-orange-200/80" />}
        <CreatePostModal open={showModal} onClose={() => setShowModal(false)} />
        
        {selectedFlashUser && <div className="absolute inset-0 bg-orange-200/80" />}
        {selectedFlashUser && <FlashModal userFlashes={selectedFlashUser} onClose={() => setSelectedFlashUser(null)} />}
        
        {showNotifications && <div className="absolute inset-0 bg-black/30" />}
        {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
      </div>
      
      {/* Almighty AI FAB (bottom right) */}
      <button
        className="fixed bottom-8 right-8 z-50 bg-purple-400 text-white p-5 rounded-full shadow-fab-glow hover:scale-110 transition-all duration-200 animate-bounce-slow"
        aria-label="Almighty AI"
        onClick={() => setShowAlmighty(true)}
      >
        <span className="text-3xl">🤖</span>
      </button>

      {/* Almighty AI Chat Modal */}
      {showAlmighty && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 bg-black/30 backdrop-blur-sm">
          <div className="w-full max-w-xs sm:max-w-sm bg-gradient-to-br from-secondary via-primary to-accent-cyan/30 rounded-2xl shadow-fab-glow border-2 border-accent-cyan/40 p-4 flex flex-col animate-slide-in">
            <div className="flex items-center justify-between mb-2">
              <span className="font-headline text-accent-pink text-lg">Almighty AI</span>
              <button onClick={() => setShowAlmighty(false)} className="text-accent-cyan hover:text-accent-pink text-xl font-bold">×</button>
            </div>
            <div className="flex-1 overflow-y-auto max-h-60 mb-2 space-y-2 scrollbar-hide">
              {chat.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`rounded-xl px-3 py-2 max-w-[80%] ${msg.role === "model" ? "bg-accent-cyan/10 text-accent-cyan" : "bg-accent-pink/20 text-accent-pink"}`}>{msg.parts[0].text}</div>
                </div>
              ))}
              {isAlmightyLoading && (
                  <div className="flex justify-start">
                      <div className="rounded-xl px-3 py-2 bg-accent-cyan/10 text-accent-cyan animate-pulse">...</div>
                  </div>
              )}
            </div>
            <form
              onSubmit={handleAlmightySubmit}
              className="flex gap-2 mt-2"
            >
              <input
                className="flex-1 rounded-full px-4 py-2 border border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-cyan bg-white dark:bg-card text-black dark:text-white"
                placeholder="Ask Almighty..."
                value={input}
                onChange={e => setInput(e.target.value)}
                autoFocus
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-full bg-accent-cyan text-primary font-bold hover:bg-accent-pink hover:text-white transition-all disabled:opacity-50"
                disabled={!input.trim() || isAlmightyLoading}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function PostCard({ post }: { post: any }) {
  const [isStarred, setIsStarred] = useState(false);
  const [starCount, setStarCount] = useState(post.starCount || 0);
  const [relayCount, setRelayCount] = useState(post.relayCount || 0);
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editContent, setEditContent] = useState(post.content || "");
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const currentUser = auth.currentUser;
  const [pollVotes, setPollVotes] = useState<{ [optionIdx: number]: { count: number, voters: string[] } }>({});
  const [userPollVote, setUserPollVote] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);


  useEffect(() => {
    if (!currentUser) return;

    const unsubscribes: (() => void)[] = [];

    // Starred post check
    const starredDocRef = fsDoc(db, "users", currentUser.uid, "starredPosts", post.id);
    const unsubStarred = onSnapshot(starredDocRef, (docSnap) => {
        setIsStarred(docSnap.exists());
    });
    unsubscribes.push(unsubStarred);

    // Counts
    const unsubStars = onSnapshot(collection(db, "posts", post.id, "stars"), (snap) => setStarCount(snap.size));
    unsubscribes.push(unsubStars);
    const unsubRelays = onSnapshot(collection(db, "posts", post.id, "relays"), (snap) => setRelayCount(snap.size));
    unsubscribes.push(unsubRelays);
    const unsubComments = onSnapshot(collection(db, "posts", post.id, "comments"), (snap) => setCommentCount(snap.size));
    unsubscribes.push(unsubComments);

    // Polls
    if (post.type === "poll" && post.pollOptions) {
      const unsubPollVotes = onSnapshot(collection(db, "posts", post.id, "pollVotes"), (snap) => {
        const votes: { [optionIdx: number]: { count: number, voters: string[] } } = {};
        post.pollOptions.forEach((_:any, index:number) => {
            votes[index] = { count: 0, voters: [] };
        });

        let userVote: number | null = null;
        snap.forEach(doc => {
          const { optionIdx, userId } = doc.data();
          if (votes[optionIdx]) {
              votes[optionIdx].count++;
              votes[optionIdx].voters.push(userId);
          }
          if (userId === currentUser.uid) userVote = optionIdx;
        });
        setPollVotes(votes);
        setUserPollVote(userVote);
      });
      unsubscribes.push(unsubPollVotes);
    }
    
    return () => unsubscribes.forEach(unsub => unsub());
  }, [post.id, currentUser, post.type, post.pollOptions]);

  const handleStar = async () => {
    if (!currentUser) return;
    const starredDocRef = fsDoc(db, "users", currentUser.uid, "starredPosts", post.id);
    const postStarRef = fsDoc(db, "posts", post.id, "stars", currentUser.uid);
    if (isStarred) {
        await deleteDoc(starredDocRef);
        await deleteDoc(postStarRef);
    } else {
        await setDoc(starredDocRef, { ...post, starredAt: serverTimestamp() });
        await setDoc(postStarRef, { userId: currentUser.uid, starredAt: serverTimestamp() });
        // Create notification for post author
        if (post.userId !== currentUser.uid) {
            const notifRef = collection(db, "notifications", post.userId, "user_notifications");
            await addDoc(notifRef, {
                type: 'like',
                fromUserId: currentUser.uid,
                fromUsername: currentUser.displayName,
                fromAvatarUrl: currentUser.photoURL,
                postId: post.id,
                postContent: (post.content || "").substring(0, 50),
                createdAt: serverTimestamp(),
                read: false,
            });
        }
    }
  };

  const handleRelay = async () => {
      // Relay logic to be implemented
      alert("Relay functionality coming soon!");
  };

  const handleDelete = async () => {
    if (window.confirm("Delete this post?")) await deleteDoc(fsDoc(db, "posts", post.id));
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateDoc(fsDoc(db, "posts", post.id), { content: editContent });
    setShowEdit(false);
  };

  const handlePollVote = async (optionIdx: number) => {
    if (!currentUser || userPollVote !== null) return;
    await setDoc(fsDoc(db, "posts", post.id, "pollVotes", currentUser.uid), { userId: currentUser.uid, optionIdx, createdAt: serverTimestamp() });
  };
  
  const handlePlayVideo = () => {
      if (videoRef.current) {
          setIsPlaying(true);
          videoRef.current.play();
      }
  };

  const handleCopyLink = () => {
    const postUrl = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(postUrl);
    alert("Link copied to clipboard!");
    setShowMoreMenu(false);
  };
  
  useEffect(() => {
    if (post.song && post.song.preview_url) {
        const audio = new Audio(post.song.preview_url);
        audioRef.current = audio;
    }
    return () => {
        audioRef.current?.pause();
    }
  }, [post.song]);
  
  const toggleSong = () => {
      if (audioRef.current) {
          if (audioRef.current.paused) {
              audioRef.current.play();
          } else {
              audioRef.current.pause();
          }
      }
  }


  const initials = post.displayName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || post.username?.slice(0, 2).toUpperCase() || "U";

  return (
    <div className="bg-cyan-100 dark:bg-card rounded-2xl p-5 shadow-lg border border-gray-100 dark:border-accent-cyan/20 flex flex-col gap-3 animate-pop transition-all relative">
      <div className="flex items-center gap-3 mb-2">
        <Link href={`/squad/${post.userId}`} className="flex items-center gap-2 group cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accentPink to-accentCyan flex items-center justify-center text-white font-bold text-lg overflow-hidden border-2 border-accent-cyan group-hover:scale-105 transition-transform">
            {post.avatar_url ? <img src={post.avatar_url} alt="avatar" className="w-full h-full object-cover" /> : initials}
          </div>
          <span className="font-headline text-accent-cyan text-sm group-hover:underline">@{post.username || "user"}</span>
        </Link>
        <div className="ml-auto flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1"><FaEye /> {post.viewCount || 0}</span>
            <span>{post.createdAt?.toDate?.().toLocaleString?.() || "Just now"}</span>
        </div>
        <div className="relative">
          <button onClick={() => setShowMoreMenu(!showMoreMenu)} className="text-gray-400 hover:text-accent-cyan">
            <FaEllipsisV />
          </button>
          {showMoreMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-card rounded-xl shadow-lg border border-accent-cyan/20 z-50 animate-fade-in">
              <button className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-accent-cyan/10" onClick={handleCopyLink}><FaLink /> Copy Link</button>
              <div className="border-t border-accent-cyan/10 my-1" />
              <button className="w-full flex items-center gap-2 px-4 py-2 text-left text-red-400 hover:bg-red-400/10" onClick={() => { alert('Reported!'); setShowMoreMenu(false); }}><FaExclamationTriangle /> Report Post</button>
              <button className="w-full flex items-center gap-2 px-4 py-2 text-left text-gray-400 hover:bg-accent-cyan/10" onClick={() => { alert('Creator muted!'); setShowMoreMenu(false); }}><FaVolumeMute /> Don't recommend this creator</button>
              <button className="w-full flex items-center gap-2 px-4 py-2 text-left text-gray-400 hover:bg-accent-cyan/10" onClick={() => { alert('User blocked!'); setShowMoreMenu(false); }}><FaUserSlash /> Block @{post.username}</button>
            </div>
          )}
        </div>
      </div>

      {currentUser?.uid === post.userId && (
        <div className="absolute top-3 right-12 flex gap-2 z-10">
          <button className="text-xs px-2 py-1 rounded bg-accent-cyan/20 text-accent-cyan font-bold hover:bg-accent-cyan/40" onClick={() => setShowEdit(true)}>Edit</button>
          <button className="text-xs px-2 py-1 rounded bg-accent-pink/20 text-accent-pink font-bold hover:bg-accent-pink/40" onClick={handleDelete}>Delete</button>
        </div>
      )}
      
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <form onSubmit={handleEdit} className="bg-white dark:bg-card rounded-2xl p-6 w-full max-w-md relative">
            <h3 className="text-xl font-headline font-bold mb-2 text-accent-cyan">Edit Post</h3>
            <textarea
              className="w-full rounded-xl p-3 bg-black/60 text-[#E0E0E0] border-2 border-accent-cyan"
              value={editContent} onChange={e => setEditContent(e.target.value)} rows={4} required
            />
            <div className="flex gap-2 justify-end mt-4">
              <button type="button" className="px-4 py-2 rounded bg-gray-200 dark:bg-black/40 text-gray-700 dark:text-white font-bold" onClick={() => setShowEdit(false)}>Cancel</button>
              <button type="submit" className="px-4 py-2 rounded bg-accent-cyan text-primary font-bold">Save</button>
            </div>
          </form>
        </div>
      )}

      {post.content && (post.type !== 'poll' || (post.type === 'poll' && !post.pollOptions)) && (
        <div className="post-text-bg text-[1.15rem] font-body whitespace-pre-line mb-2 px-4 py-3 rounded-xl" style={{ backgroundColor: post.backgroundColor || 'transparent', color: post.backgroundColor && post.backgroundColor !== '#ffffff' ? '#000000' : 'inherit' }}>
          {post.content}
        </div>
      )}

      {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2">
              {post.hashtags.map((tag:string) => <Link href={`/tags/${tag}`} key={tag} className="text-accent-cyan font-bold text-sm hover:underline">#{tag}</Link>)}
          </div>
      )}
      
      {(post.type === "media" || post.type === "audio") && post.mediaUrl && (
        <div className="w-full rounded-xl overflow-hidden relative">
          {post.mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
            <>
              <video ref={videoRef} src={post.mediaUrl} controls={isPlaying} className="w-full rounded-xl" onEnded={() => setIsPlaying(false)} />
              {!isPlaying && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer" onClick={handlePlayVideo}>
                    {post.thumbnailUrl && <img src={post.thumbnailUrl} alt="thumbnail" className="w-full h-full object-cover"/>}
                    <div className="absolute">
                        <FaPlay className="text-white text-6xl opacity-80"/>
                    </div>
                </div>
              )}
            </>
          ) : post.mediaUrl.match(/\.(mp3|wav|oga|m4a)$/i) || post.type === 'audio' ? (
            <audio src={post.mediaUrl} controls className="w-full" />
          ) : (
            <img src={post.mediaUrl} alt="media" className="w-full rounded-xl" />
          )}
        </div>
      )}
      
      {post.type === "poll" && post.pollOptions && (
        <div className="flex flex-col gap-2 animate-fade-in bg-black/70 rounded-xl p-4">
          <div className="font-bold text-accent-cyan mb-3">{post.content}</div>
          {post.pollOptions.map((opt: string, idx: number) => {
            const voteData = pollVotes[idx] || { count: 0, voters: [] };
            const totalVotes = Object.values(pollVotes).reduce((sum, current) => sum + current.count, 0);
            const percent = totalVotes > 0 ? Math.round((voteData.count / totalVotes) * 100) : 0;
            return (
              <button key={idx} className={`w-full px-4 py-2 rounded-full font-bold transition-all relative overflow-hidden ${userPollVote !== null ? 'cursor-default' : 'hover:bg-accent-cyan/40'}`}
                onClick={() => handlePollVote(idx)} disabled={userPollVote !== null}>
                {userPollVote !== null && <div className="absolute left-0 top-0 h-full bg-accent-cyan/50" style={{width: `${percent}%`}}/>}
                <div className="relative flex justify-between z-10">
                  <span>{opt}</span>
                  {userPollVote !== null && <span>{percent}% ({voteData.count})</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {post.song && (
        <div className="mt-2 p-3 rounded-xl bg-black/20 flex items-center gap-4 border border-accent-cyan/20">
            <img src={post.song.albumArt} alt={post.song.album} className="w-12 h-12 rounded-lg"/>
            <div className="flex-1">
                <div className="font-bold text-accent-cyan text-base line-clamp-1">{post.song.name}</div>
                <div className="text-xs text-gray-400 mb-1 line-clamp-1">{post.song.artists.join(", ")}</div>
            </div>
            <button onClick={toggleSong} className="p-3 rounded-full bg-accent-cyan text-primary shadow-lg hover:scale-110 transition-transform">
                <FaMusic />
            </button>
        </div>
      )}

      <div className="flex items-center justify-between gap-6 mt-2">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-1 text-lg font-bold text-gray-400 hover:text-accent-cyan transition-all" onClick={() => setShowComments(true)}>
            <FaRegComment /> <span>{commentCount}</span>
          </button>
          <button className="flex items-center gap-1 text-lg font-bold text-gray-400 hover:text-accent-cyan transition-all" onClick={handleRelay}>
            <Repeat2 /> <span>{relayCount}</span>
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button className={`flex items-center gap-1 text-lg font-bold transition-all ${isStarred ? "text-yellow-400" : "text-gray-400 hover:text-yellow-400"}`} onClick={handleStar}>
            <Bookmark fill={isStarred ? "currentColor" : "none"} /> <span>{starCount}</span>
          </button>
        </div>
      </div>
      {showComments && <CommentModal postId={post.id} postAuthorId={post.userId} onClose={() => setShowComments(false)} />}
    </div>
  );
}

function CommentModal({ postId, postAuthorId, onClose }: { postId: string; postAuthorId: string; onClose: () => void }) {
  const [comments, setComments] = useState<any[]>([]);
  const [replyTo, setReplyTo] = useState<string | null>(null); // State to track which comment is being replied to

  useEffect(() => {
    const q = query(collection(db, "posts", postId, "comments"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const allComments = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const threadedComments = allComments.filter(c => !c.parentId);
      threadedComments.forEach(p => {
        p.replies = allComments.filter(r => r.parentId === p.id);
      });
      setComments(threadedComments);
    });
    return () => unsub();
  }, [postId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white dark:bg-card rounded-2xl p-6 w-full max-w-md relative animate-pop shadow-xl border border-accent-cyan/20">
        <button onClick={onClose} className="absolute top-2 right-2 text-accent-pink text-2xl">&times;</button>
        <h3 className="text-xl font-headline font-bold mb-4 text-accent-cyan">Comments</h3>
        <div className="flex flex-col gap-3 max-h-60 overflow-y-auto mb-4 p-2">
          {comments.length === 0 ? (
            <div className="text-gray-400 text-center">No comments yet. Be the first!</div>
          ) : (
            comments.map((comment) => (
              <CommentThread key={comment.id} comment={comment} postId={postId} postAuthorId={postAuthorId} replyTo={replyTo} setReplyTo={setReplyTo} />
            ))
          )}
        </div>
        <CommentForm postId={postId} postAuthorId={postAuthorId} parentId={null} onCommentPosted={() => setReplyTo(null)} />
      </div>
    </div>
  );
}

function CommentThread({ comment, postId, postAuthorId, replyTo, setReplyTo }: { comment: any; postId: string; postAuthorId: string; replyTo: string | null; setReplyTo: (id: string | null) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <Comment comment={comment} onReply={() => setReplyTo(comment.id)} />
      {replyTo === comment.id && (
        <div className="ml-8">
          <CommentForm postId={postId} postAuthorId={postAuthorId} parentId={comment.id} onCommentPosted={() => setReplyTo(null)} isReply />
        </div>
      )}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-8 border-l-2 border-accent-cyan/20 pl-4 flex flex-col gap-3">
          {comment.replies.map((reply: any) => (
            <CommentThread key={reply.id} comment={reply} postId={postId} postAuthorId={postAuthorId} replyTo={replyTo} setReplyTo={setReplyTo} />
          ))}
        </div>
      )}
    </div>
  );
}

function Comment({ comment, onReply }: { comment: any; onReply: () => void }) {
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    async function fetchUserData() {
      if (comment.username && comment.avatar_url) {
        setUserData({ username: comment.username, avatar_url: comment.avatar_url, displayName: comment.displayName });
      } else {
        const userDoc = await getDoc(doc(db, "users", comment.userId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData({
            username: data.username,
            avatar_url: data.avatar_url,
            displayName: data.name,
          });
        }
      }
    }
    fetchUserData();
  }, [comment.userId, comment.username, comment.avatar_url, comment.displayName]);

  const initials = userData?.displayName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || userData?.username?.slice(0, 2).toUpperCase() || "U";
  
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accentPink to-accentCyan flex items-center justify-center text-white font-bold text-sm overflow-hidden shrink-0">
          {userData?.avatar_url ? <img src={userData.avatar_url} alt="avatar" className="w-full h-full object-cover" /> : initials}
      </div>
      <div className="flex-1">
        <div className="bg-black/60 rounded-xl px-3 py-2 text-[#E0E0E0] font-body">
          <div className="flex items-center gap-2">
            <Link href={`/squad/${comment.userId}`} className="font-bold text-accent-cyan text-sm hover:underline">@{userData?.username || 'user'}</Link>
            <span className="text-xs text-gray-400">{comment.createdAt?.toDate?.().toLocaleString?.() || ""}</span>
          </div>
          <p className="text-base">{comment.text}</p>
        </div>
        <button onClick={onReply} className="text-xs text-accent-cyan font-bold mt-1 hover:underline">Reply</button>
      </div>
    </div>
  );
}

function CommentForm({ postId, postAuthorId, parentId, onCommentPosted, isReply = false }: { postId: string; postAuthorId: string; parentId: string | null; onCommentPosted: () => void; isReply?: boolean }) {
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const user = auth.currentUser;

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    setLoading(true);

    // Fetch full user profile to embed in comment
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userData = userDoc.data() || { name: user.displayName, username: user.displayName, avatar_url: user.photoURL };

    const commentData: any = {
      text: newComment,
      userId: user.uid,
      displayName: userData.name || user.displayName,
      username: userData.username || user.displayName,
      avatar_url: userData.avatar_url || user.photoURL,
      createdAt: serverTimestamp(),
      parentId: parentId,
    };

    await addDoc(collection(db, "posts", postId, "comments"), commentData);

    if (postAuthorId !== user.uid) {
      const notifRef = collection(db, "notifications", postAuthorId, "user_notifications");
      await addDoc(notifRef, {
        type: 'comment',
        fromUserId: user.uid,
        fromUsername: userData.username || user.displayName,
        fromAvatarUrl: userData.avatar_url || user.photoURL,
        postId: postId,
        postContent: newComment.substring(0, 50),
        createdAt: serverTimestamp(),
        read: false,
      });
    }

    setNewComment("");
    setLoading(false);
    onCommentPosted();
  };
  
  return (
    <form onSubmit={handleAddComment} className="flex gap-2">
      <input
        type="text"
        className="flex-1 rounded-full px-4 py-2 border border-accent-cyan bg-white dark:bg-card text-black dark:text-white"
        placeholder={isReply ? "Add a reply..." : "Add a comment..."}
        value={newComment}
        onChange={e => setNewComment(e.target.value)}
        disabled={loading}
      />
      <button
        type="submit"
        className="px-4 py-2 rounded-full bg-accent-cyan text-primary font-bold disabled:opacity-60"
        disabled={loading || !newComment.trim()}
      >
        Post
      </button>
    </form>
  )
}

function FlashModal({ userFlashes, onClose }: { userFlashes: any; onClose: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const goToNext = () => setCurrentIndex(i => (i + 1) % userFlashes.flashes.length);
  const goToPrev = () => setCurrentIndex(i => (i - 1 + userFlashes.flashes.length) % userFlashes.flashes.length);

  useEffect(() => {
    const flash = userFlashes.flashes[currentIndex];
    const isVideo = flash.mediaUrl && flash.mediaUrl.match(/\.(mp4|webm|ogg)$/i);
    setProgress(0);
    
    if (timerRef.current) clearInterval(timerRef.current);
    
    if (!isVideo) {
      timerRef.current = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            goToNext();
            return 0;
          }
          return p + (100 / 50); // 5 seconds duration
        });
      }, 100);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, userFlashes]);

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    }
  };
  const handleVideoEnded = () => {
      goToNext();
  };

  const currentFlash = userFlashes.flashes[currentIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={onClose}>
      <div className="relative w-full max-w-lg h-[90vh] flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-2 right-2 text-white text-3xl z-20">&times;</button>
        {/* Progress Bars */}
        <div className="absolute top-4 left-2 right-2 flex gap-1 z-20">
            {userFlashes.flashes.map((_:any, idx:number) => (
                <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full">
                    <div className="h-full bg-white rounded-full" style={{ width: `${idx === currentIndex ? progress : (idx < currentIndex ? 100 : 0)}%` }}/>
                </div>
            ))}
        </div>
        
        <div className="w-full h-full relative">
            {currentFlash.mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                <video
                    ref={videoRef}
                    src={currentFlash.mediaUrl}
                    className="w-full h-full object-contain"
                    autoPlay
                    onTimeUpdate={handleVideoTimeUpdate}
                    onEnded={handleVideoEnded}
                />
            ) : (
                <img src={currentFlash.mediaUrl} alt="flash" className="w-full h-full object-contain" />
            )}
            
            {/* Navigation */}
            <button onClick={goToPrev} className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/20 text-white p-2 rounded-full"><FaChevronLeft/></button>
            <button onClick={goToNext} className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/20 text-white p-2 rounded-full"><FaChevronRight/></button>
        </div>

        {currentFlash.caption && (
          <div className="absolute bottom-10 left-4 right-4 text-white text-center font-semibold p-2 bg-black/50 rounded-lg">
            {currentFlash.caption}
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationPanel({ onClose }: { onClose: () => void }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "notifications", currentUser.uid, "user_notifications"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [currentUser]);

  const getNotificationMessage = (notif: any) => {
    switch (notif.type) {
      case 'like':
        return <><span className="font-bold">{notif.fromUsername}</span> liked your post: "{notif.postContent}"</>;
      case 'comment':
        return <><span className="font-bold">{notif.fromUsername}</span> commented on your post: "{notif.postContent}"</>;
      case 'follow':
        return <><span className="font-bold">{notif.fromUsername}</span> started following you.</>;
      default:
        return 'New notification';
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white dark:bg-card shadow-lg animate-slide-in-right border-l border-accent-cyan/20">
      <div className="flex items-center justify-between p-4 border-b border-accent-cyan/20">
        <h3 className="text-xl font-headline font-bold text-accent-cyan">Notifications</h3>
        <button onClick={onClose} className="text-accent-pink text-2xl">&times;</button>
      </div>
      <div className="flex flex-col gap-2 p-4 overflow-y-auto h-full pb-20">
        {notifications.length === 0 ? (
          <div className="text-gray-400 text-center mt-16">No new notifications.</div>
        ) : (
          notifications.map(notif => (
            <div key={notif.id} className="flex items-center gap-3 p-3 rounded-xl bg-black/60 hover:bg-accent-cyan/10 transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent-pink to-accent-cyan overflow-hidden">
                {notif.fromAvatarUrl && <img src={notif.fromAvatarUrl} alt="avatar" className="w-full h-full object-cover"/>}
              </div>
              <div className="flex-1 text-sm text-[#E0E0E0]">
                {getNotificationMessage(notif)}
                <div className="text-xs text-gray-400 mt-1">{notif.createdAt?.toDate().toLocaleString()}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
