"use client";
import React, { useState, useEffect } from "react";
import { getFirestore, collection, query, orderBy, onSnapshot, getDocs, where } from "firebase/firestore";
import { app, auth } from "@/utils/firebaseClient";
import { Crown, CheckCircle, Fire, User, Music, Film, Book, Laptop, Globe, Star, Heart, MessageCircle, MoreVertical, Search } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { PostCard } from "../home/page";

const db = getFirestore(app);

function LikeCommentMore({ post }: { post: any }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);
  const [showMenu, setShowMenu] = useState(false);
  
  useEffect(() => {
    setLikeCount(post.likeCount || 0);
    setCommentCount(post.commentCount || 0);
  }, [post.likeCount, post.commentCount]);

  return (
    <div className="flex gap-4 items-center">
      <button className={`flex items-center gap-1 text-lg font-bold transition-all ${liked ? "text-red-500" : "text-white hover:text-red-400"}`} onClick={() => setLiked(l => !l)} aria-label="Like">
        <Heart /> <span>{likeCount}</span>
      </button>
      <button className="flex items-center gap-1 text-lg font-bold text-white hover:text-accent-cyan transition-all" aria-label="Comment">
        <MessageCircle /> <span>{commentCount}</span>
      </button>
      <div className="relative">
        <button className="flex items-center text-white hover:text-accent-cyan" onClick={() => setShowMenu(m => !m)} aria-label="More">
          <MoreVertical />
        </button>
        {showMenu && (
          <div className="absolute right-0 bottom-full mb-2 w-32 glass-card p-1 z-50">
            <button className="w-full px-4 py-2 text-left text-red-500 hover:bg-white/10 rounded-lg" onClick={() => { setShowMenu(false); alert('Reported!'); }}>Report</button>
            <button className="w-full px-4 py-2 text-left hover:bg-white/10 rounded-lg" onClick={() => setShowMenu(false)}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}

function TaggedPostsModal({ tag, posts, onClose }: { tag: string; posts: any[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-card p-6 w-full max-w-2xl relative flex flex-col">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white z-10">&times;</button>
        <h2 className="text-2xl font-headline font-bold mb-4 text-accent-cyan">#{tag}</h2>
        <div className="flex-1 overflow-y-auto max-h-[80vh] pr-2">
            {posts.length === 0 ? (
                 <div className="text-gray-400 text-center mt-16">
                    <div className="text-4xl mb-2">🔭</div>
                    <div className="text-lg font-semibold">No posts found for this tag</div>
                 </div>
            ) : (
                <div className="w-full flex flex-col gap-6">
                    {posts.map(post => <PostCard key={post.id} post={post} />)}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}


export default function ScopePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [shortVibes, setShortVibes] = useState<any[]>([]);
  const [trendingTags, setTrendingTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [taggedPosts, setTaggedPosts] = useState<any[]>([]);
  const [starredPosts, setStarredPosts] = useState<any[]>([]);
  const [interests] = useState([
    { icon: <Music />, label: "Music", color: "from-pink-500 to-yellow-400" },
    { icon: <Film />, label: "Movies", color: "from-blue-500 to-purple-500" },
    { icon: <Laptop />, label: "Tech", color: "from-green-400 to-blue-500" },
    { icon: <Book />, label: "Learning", color: "from-orange-400 to-pink-500" },
    { icon: <Globe />, label: "World", color: "from-cyan-400 to-blue-400" },
    { icon: <Star />, label: "Culture", color: "from-yellow-400 to-pink-400" },
    { icon: <User />, label: "Games", color: "from-purple-500 to-green-400" },
    { icon: <Crown />, label: "Politics", color: "from-red-400 to-yellow-400" },
    { icon: <Fire />, label: "Memes", color: "from-pink-400 to-green-400" },
  ]);
  const [activeShortIndex, setActiveShortIndex] = useState(0);
  const videoRefs = useRef<any[]>([]);
  const currentUser = auth.currentUser;

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const all = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) }));
      setAllPosts(all);
      setShortVibes(all.filter((p: any) => p.type === "media" && p.mediaUrl && p.mediaUrl.match(/\.(mp4|webm|ogg)$/i)));
      const hashtags: Record<string, number> = {};
      all.forEach((post: any) => {
        if (post.hashtags && Array.isArray(post.hashtags)) {
          post.hashtags.forEach((tag: string) => {
            const cleanTag = tag.toLowerCase().replace(/#/g, '');
            hashtags[cleanTag] = (hashtags[cleanTag] || 0) + 1;
          });
        }
      });
      setTrendingTags(Object.entries(hashtags).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([tag]) => tag));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, "users", currentUser.uid, "starredPosts"), orderBy("starredAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setStarredPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [currentUser]);

  const handleTagClick = (tag: string) => {
    const lowerCaseTag = tag.toLowerCase();
    const filtered = allPosts.filter(post => 
        post.hashtags && Array.isArray(post.hashtags) && post.hashtags.some((h: string) => h.toLowerCase() === lowerCaseTag)
    );
    setTaggedPosts(filtered);
    setSelectedTag(lowerCaseTag);
  };


  return (
    <div className="min-h-screen font-sans relative pb-24">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md py-4 px-4 flex flex-col gap-2 shadow-lg">
        <div className="relative w-full max-w-xl mx-auto">
          <input
            type="text"
            placeholder="Search users, hashtags, or keywords..."
            className="input-glass w-full pl-12"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>
      
      {starredPosts.length > 0 && (
        <section className="py-8 px-4">
            <h3 className="text-xl font-headline text-yellow-400 mb-4 flex items-center gap-2"><Star /> Your Starred Posts</h3>
            <motion.div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
                {starredPosts.map((post) => (
                    <motion.div key={post.id} className="min-w-[300px] w-[300px]" whileHover={{ y: -5 }}>
                        <PostCard post={post} />
                    </motion.div>
                ))}
            </motion.div>
        </section>
      )}

      <div className="py-8 px-4 grid grid-cols-2 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {interests.map((interest) => (
          <motion.div 
            key={interest.label} 
            className={`rounded-2xl p-6 text-white font-bold text-xl flex flex-col items-center justify-center shadow-lg cursor-pointer bg-gradient-to-tr ${interest.color}`} 
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleTagClick(interest.label)}
            >
            <span className="text-3xl mb-2">{interest.icon}</span>
            {interest.label}
          </motion.div>
        ))}
      </div>

      <div className="py-4">
        <h3 className="text-xl font-headline text-accent-cyan mb-4 px-4">Trending Tags</h3>
        <motion.div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4" >
          {trendingTags.map((tag) => (
            <motion.button
              key={tag}
              className="btn-glass flex-shrink-0 flex items-center gap-2"
              whileHover={{ scale: 1.1 }}
              onClick={() => handleTagClick(tag)}
            >
              <Fire className="text-red-400" /> #{tag}
            </motion.button>
          ))}
        </motion.div>
      </div>
      
      <div className="w-full flex flex-col items-center py-8 min-h-[80vh]">
        <h2 className="text-2xl font-headline text-accent-cyan mb-4">🎥 Short Vibes</h2>
        <div className="w-full max-w-xs sm:max-w-sm md:max-w-md flex flex-col items-center relative" style={{ height: '70vh' }}>
          {shortVibes.length === 0 ? (
            <div className="text-gray-400 text-center mt-16">
              <div className="text-4xl mb-2">🎬</div>
              <div className="text-lg font-semibold">No shorts yet</div>
            </div>
          ) : (
            shortVibes.map((short, idx) => (
              <motion.div
                key={short.id}
                className="absolute top-0 left-0 w-full h-full"
                style={{ pointerEvents: idx === activeShortIndex ? "auto" : "none" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: idx === activeShortIndex ? 1 : 0, y: idx === activeShortIndex ? 0 : 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative w-full h-full flex flex-col items-center justify-end">
                  <video
                    ref={el => { videoRefs.current[idx] = el || undefined; }}
                    src={short.mediaUrl}
                    className="w-full h-full object-cover rounded-2xl shadow-2xl border-4 border-accent-cyan/50"
                    autoPlay
                    loop
                    muted
                    playsInline
                    style={{ maxHeight: "70vh" }}
                  />
                  <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/80 via-black/30 to-transparent rounded-b-2xl flex justify-between items-end">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push(`/squad/${short.userId}`)}>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent-pink to-accent-cyan flex items-center justify-center text-white font-bold text-base overflow-hidden">
                          {short.avatar_url ? <img src={short.avatar_url} alt="avatar"/> : short.displayName?.[0] || 'U'}
                        </div>
                        <span className="font-headline text-accent-cyan text-sm">@{short.username || "user"}</span>
                      </div>
                      <p className="text-white text-base font-body line-clamp-2" style={{ textShadow: "0 2px 8px #000" }}>{short.content || short.caption}</p>
                    </div>
                    <div className="flex flex-col gap-4">
                        <LikeCommentMore post={short} />
                    </div>
                  </div>
                </div>
                {/* Scroll buttons */}
                <button className="absolute top-1/2 -translate-y-1/2 -left-12 btn-glass-icon" onClick={() => setActiveShortIndex(i => Math.max(0, i-1))} disabled={idx === 0}>&uarr;</button>
                <button className="absolute top-1/2 -translate-y-1/2 -right-12 btn-glass-icon" onClick={() => setActiveShortIndex(i => Math.min(shortVibes.length - 1, i+1))} disabled={idx === shortVibes.length - 1}>&darr;</button>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <motion.div className="max-w-2xl mx-auto my-8 p-6 glass-card flex flex-col items-center text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h3 className="text-xl font-headline text-accent-cyan mb-2">🧠 Powered by Almighty</h3>
        <p className="text-lg text-white font-semibold mb-2">Trending content just for you, based on your vibes and interests.</p>
      </motion.div>
      <motion.div className="max-w-2xl mx-auto my-8 p-6 glass-card flex flex-col items-center text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h3 className="text-xl font-headline text-neon-green mb-2 flex items-center gap-2"><CheckCircle /> FlixTrend Verified</h3>
        <p className="text-lg text-white font-semibold mb-2">Trending posts that are AI-fact-checked and verified for authenticity.</p>
      </motion.div>
      
      {selectedTag && <TaggedPostsModal tag={selectedTag} posts={taggedPosts} onClose={() => setSelectedTag(null)} />}
    </div>
  );
}
