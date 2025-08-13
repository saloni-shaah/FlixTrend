"use client";
import React, { useState, useEffect } from "react";
import { getFirestore, collection, query, orderBy, onSnapshot, getDocs, where } from "firebase/firestore";
import { app, auth } from "@/utils/firebaseClient";
import { FaPlus, FaBell, FaCrown, FaCheckCircle, FaFire, FaUser, FaMusic, FaFilm, FaBook, FaLaptop, FaGlobe, FaStar, FaRegHeart, FaRegComment, FaEllipsisV } from "react-icons/fa";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { PostCard } from "../home/page";

const db = getFirestore(app);

// Like/Comment/More component for video posts
function LikeCommentMore({ post }: { post: any }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);
  const [showMenu, setShowMenu] = useState(false);
  useEffect(() => {
    // TODO: Use Firestore listeners for real-time like/comment count if needed
    setLikeCount(post.likeCount || 0);
    setCommentCount(post.commentCount || 0);
  }, [post.likeCount, post.commentCount]);
  return (
    <div className="flex gap-4 items-center">
      <button className={`flex items-center gap-1 text-lg font-bold transition-all ${liked ? "text-yellow-400" : "text-gray-400 hover:text-yellow-400"}`} onClick={() => setLiked(l => !l)} aria-label="Like">
        <FaRegHeart /> <span>{likeCount}</span>
      </button>
      <button className="flex items-center gap-1 text-lg font-bold text-gray-400 hover:text-accent-cyan transition-all" aria-label="Comment">
        <FaRegComment /> <span>{commentCount}</span>
      </button>
      <div className="relative">
        <button className="flex items-center text-gray-400 hover:text-accent-cyan" onClick={() => setShowMenu(m => !m)} aria-label="More">
          <FaEllipsisV />
        </button>
        {showMenu && (
          <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-black rounded-xl shadow-lg border border-accent-cyan/20 z-50">
            <button className="w-full px-4 py-2 text-left text-red-500 hover:bg-accent-cyan/10 rounded-t-xl" onClick={() => { setShowMenu(false); alert('Reported!'); }}>Report</button>
            <button className="w-full px-4 py-2 text-left hover:bg-accent-cyan/10 rounded-b-xl" onClick={() => setShowMenu(false)}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}

function TaggedPostsModal({ tag, posts, onClose }: { tag: string; posts: any[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-card rounded-2xl p-6 w-full max-w-2xl relative animate-pop shadow-xl border border-gray-100 dark:border-accent-cyan/20 flex flex-col">
        <button onClick={onClose} className="absolute top-2 right-2 text-accent-pink text-2xl z-10">&times;</button>
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
  const [suggestedCreators, setSuggestedCreators] = useState<any[]>([]);
  const [trendingTags, setTrendingTags] = useState<string[]>([]);
  const [trendRows, setTrendRows] = useState<any[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [taggedPosts, setTaggedPosts] = useState<any[]>([]);
  const [starredPosts, setStarredPosts] = useState<any[]>([]);
  const [interests] = useState([
    { icon: <FaMusic />, label: "Music", color: "bg-gradient-to-tr from-pink-500 to-yellow-400" },
    { icon: <FaFilm />, label: "Movies", color: "bg-gradient-to-tr from-blue-500 to-purple-500" },
    { icon: <FaLaptop />, label: "Tech", color: "bg-gradient-to-tr from-green-400 to-blue-500" },
    { icon: <FaBook />, label: "Learning", color: "bg-gradient-to-tr from-orange-400 to-pink-500" },
    { icon: <FaGlobe />, label: "World", color: "bg-gradient-to-tr from-cyan-400 to-blue-400" },
    { icon: <FaStar />, label: "Culture", color: "bg-gradient-to-tr from-yellow-400 to-pink-400" },
    { icon: <FaUser />, label: "Games", color: "bg-gradient-to-tr from-purple-500 to-green-400" },
    { icon: <FaCrown />, label: "Politics", color: "bg-gradient-to-tr from-red-400 to-yellow-400" },
    { icon: <FaFire />, label: "Memes", color: "bg-gradient-to-tr from-pink-400 to-green-400" },
  ]);
  const [activeShortIndex, setActiveShortIndex] = useState(0);
  const videoRefs = useRef<any[]>([]);
  const currentUser = auth.currentUser;

  // Fetch real video posts for Short Vibes Reel
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const all = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) }));
      setAllPosts(all);
      setShortVibes(all.filter((p: any) => p.type === "media" && p.mediaUrl && p.mediaUrl.match(/\.(mp4|webm|ogg)$/i)));
      // Extract hashtags for trending
      const hashtags: Record<string, number> = {};
      all.forEach((post: any) => {
        if (post.hashtags && Array.isArray(post.hashtags)) {
          post.hashtags.forEach((tag: string) => {
            const cleanTag = tag.startsWith('#') ? tag : `#${tag}`;
            hashtags[cleanTag] = (hashtags[cleanTag] || 0) + 1;
          });
        }
      });
      setTrendingTags(Object.entries(hashtags).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([tag]) => tag));
      // Trend rows (example: viral = most liked, fresh = most recent)
      setTrendRows([
        { title: "Today’s Viral", items: all.sort((a: any, b: any) => (b.likeCount || 0) - (a.likeCount || 0)).slice(0, 5).map((p: any) => p.content || p.caption || "") },
        { title: "Fresh Drops", items: all.slice(0, 5).map((p: any) => p.content || p.caption || "") },
      ]);
    });
    return () => unsub();
  }, []);

  // Fetch starred posts
  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, "users", currentUser.uid, "starredPosts"), orderBy("starredAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setStarredPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [currentUser]);

  // Fetch real users for Suggested Creators
  useEffect(() => {
    async function fetchCreators() {
      const currentUser = auth.currentUser;
      
      // 1. Get all user IDs from posts to find active creators
      const postsSnap = await getDocs(query(collection(db, "posts")));
      const activeUserIds = [...new Set(postsSnap.docs.map(doc => doc.data().userId))];
      
      if (activeUserIds.length === 0) {
        setSuggestedCreators([]);
        return;
      }
      
      // 2. Filter out the current user
      const suggestableUserIds = activeUserIds.filter(uid => uid !== currentUser?.uid);
      
      if (suggestableUserIds.length === 0) {
        setSuggestedCreators([]);
        return;
      }

      // 3. Fetch profiles for the active and suggestable users
      // Note: Firestore 'in' query is limited to 30 items. For more users, this needs pagination or a different approach.
      const usersQuery = query(collection(db, "users"), where("userId", "in", suggestableUserIds.slice(0, 10)));
      const usersSnap = await getDocs(usersQuery);
      
      const users = usersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
      setSuggestedCreators(users);
    }
    fetchCreators();
  }, []);

  const handleTagClick = (tag: string) => {
    const lowerCaseTag = tag.toLowerCase();
    const filtered = allPosts.filter(post => 
        post.hashtags && Array.isArray(post.hashtags) && post.hashtags.some((h: string) => h.toLowerCase() === lowerCaseTag)
    );
    setTaggedPosts(filtered);
    setSelectedTag(lowerCaseTag);
  };


  return (
    <div className="min-h-screen bg-gradient-to-b from-primary via-secondary to-accent-cyan/10 font-sans relative">
      {/* Sticky Search Bar */}
      <div className="sticky top-0 z-30 bg-black/60 backdrop-blur-md py-4 px-4 flex flex-col gap-2 shadow-lg">
        <input
          type="text"
          placeholder="Search users, hashtags, or keywords..."
          className="w-full max-w-xl mx-auto px-6 py-3 rounded-full bg-black/70 text-white border-2 border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-pink text-lg font-semibold shadow-fab-glow"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      {/* Your Starred Posts Section */}
      {starredPosts.length > 0 && (
        <section className="py-8 px-4">
            <h3 className="text-xl font-headline text-yellow-400 mb-4 flex items-center gap-2"><FaStar /> Your Starred Posts</h3>
            <motion.div className="flex gap-4 overflow-x-auto scrollbar-hide">
                {starredPosts.map((post) => (
                    <motion.div key={post.id} className="min-w-[300px] w-[300px]" whileHover={{ scale: 1.02 }}>
                        <PostCard post={post} />
                    </motion.div>
                ))}
            </motion.div>
        </section>
      )}
      {/* Interest Tiles Grid (moved up, more colorful) */}
      <div className="py-8 px-4 grid grid-cols-2 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {interests.map((interest, i) => (
          <motion.div 
            key={interest.label} 
            className={`rounded-2xl p-6 text-white font-bold text-xl flex flex-col items-center justify-center shadow-fab-glow cursor-pointer hover:scale-105 transition-all ${interest.color}`} 
            whileTap={{ scale: 0.95 }}
            onClick={() => handleTagClick(interest.label)}
            >
            <span className="text-3xl mb-2 animate-pulse">{interest.icon}</span>
            {interest.label}
          </motion.div>
        ))}
      </div>
      {/* Trending Hashtag Strip (moved down) */}
      <motion.div className="flex gap-3 overflow-x-auto py-3 px-4 scrollbar-hide neon-glow" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {trendingTags.map((tag, i) => (
          <motion.span
            key={tag}
            className="px-4 py-2 rounded-full bg-pink-500/80 text-white font-bold text-base shadow-fab-glow hover:scale-110 transition-all cursor-pointer border-2 border-accent-cyan animate-pulse"
            whileHover={{ scale: 1.15 }}
            style={{ textShadow: "0 0 8px #ff3cac" }}
            onClick={() => handleTagClick(tag.replace('#', ''))}
          >
            <FaFire className="inline mr-1 animate-bounce" /> {tag}
          </motion.span>
        ))}
      </motion.div>
      {/* Short Vibes Reel (YouTube Shorts style, scrollable, with like/comment/more) */}
      <div className="w-full flex flex-col items-center bg-gradient-to-br from-pink-400 via-yellow-300 to-blue-400 py-8 min-h-[80vh]">
        <h2 className="text-2xl font-headline text-accent-cyan mb-4">🎥 Short Vibes</h2>
        <div className="w-full max-w-xs sm:max-w-sm md:max-w-md flex flex-col items-center relative" style={{ height: '70vh' }}>
          {shortVibes.length === 0 ? (
            <div className="text-gray-400 text-center mt-16">
              <div className="text-4xl mb-2">🎬</div>
              <div className="text-lg font-semibold">No shorts yet</div>
              <div className="text-sm">When users post videos, their shorts will appear here!</div>
            </div>
          ) : (
            shortVibes.map((short, idx) => (
              <motion.div
                key={short.id}
                className={`absolute top-0 left-0 w-full h-full transition-all duration-500 ${idx === activeShortIndex ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"}`}
                style={{ pointerEvents: idx === activeShortIndex ? "auto" : "none" }}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: idx === activeShortIndex ? 1 : 0, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <div className="relative w-full h-full flex flex-col items-center justify-end">
                  <video
                    ref={el => { videoRefs.current[idx] = el || undefined; }}
                    src={short.mediaUrl}
                    className="w-full h-full object-cover rounded-2xl shadow-2xl border-4 border-accent-cyan"
                    autoPlay
                    loop
                    muted
                    playsInline
                    style={{ maxHeight: "70vh" }}
                    onClick={() => router.push(`/squad/${short.userId}`)}
                  />
                  {/* Overlay */}
                  <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/80 via-black/30 to-transparent rounded-b-2xl flex flex-col gap-2">
                    <div className="flex items-center gap-2 mb-1 cursor-pointer" onClick={() => router.push(`/squad/${short.userId}`)}>
                      <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-accentPink to-accentCyan flex items-center justify-center text-white font-bold text-base">
                        {short.displayName ? short.displayName[0] : short.username?.[0] || "U"}
                      </span>
                      <span className="font-headline text-accent-cyan text-sm">@{short.username || (short.displayName ? short.displayName.replace(/\s+/g, "").toLowerCase() : "user")}</span>
                    </div>
                    <div className="text-white text-base font-body mb-1 line-clamp-3" style={{ textShadow: "0 2px 8px #000" }}>{short.content || short.caption}</div>
                    <div className="flex gap-4 items-center">
                      <LikeCommentMore post={short} />
                    </div>
                  </div>
                </div>
                {/* Up/Down scroll navigation */}
                <div className="absolute top-1/2 left-0 w-full flex justify-between items-center pointer-events-none">
                  {idx > 0 && (
                    <button className="pointer-events-auto absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-2 shadow hover:bg-accent-cyan/80" onClick={() => setActiveShortIndex(idx - 1)}>&uarr;</button>
                  )}
                  {idx < shortVibes.length - 1 && (
                    <button className="pointer-events-auto absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-2 shadow hover:bg-accent-cyan/80" onClick={() => setActiveShortIndex(idx + 1)}>&darr;</button>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
      {/* AI For You Section */}
      <motion.div className="max-w-2xl mx-auto my-8 p-6 rounded-2xl bg-gradient-to-tr from-accent-cyan/30 to-accent-pink/20 shadow-fab-glow border-2 border-accent-cyan/40 flex flex-col items-center text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h3 className="text-xl font-headline text-accent-cyan mb-2">🧠 Powered by Almighty</h3>
        <p className="text-lg text-white font-semibold mb-2 animate-pulse">Trending content just for you, based on your vibes and interests.</p>
        <div className="text-accent-cyan text-base font-mono animate-typewriter">#AI #Music #Movies #Tech</div>
      </motion.div>
      {/* FastCheck Spotlight */}
      <motion.div className="max-w-2xl mx-auto my-8 p-6 rounded-2xl bg-gradient-to-tr from-neon-green/30 to-accent-cyan/10 shadow-fab-glow border-2 border-neon-green/40 flex flex-col items-center text-center animate-pulse" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h3 className="text-xl font-headline text-neon-green mb-2 flex items-center gap-2"><FaCheckCircle className="animate-bounce" /> FlixTrend Verified</h3>
        <p className="text-lg text-white font-semibold mb-2">Trending posts that are AI-fact-checked and verified for authenticity.</p>
      </motion.div>
      {/* Swipeable Trend Rows (remove Fresh Drops) */}
      <div className="max-w-4xl mx-auto py-8 flex flex-col gap-8">
        {trendRows.filter((row: any) => row.title !== "Fresh Drops").map((row: any, i: number) => (
          <div key={row.title} className="mb-2">
            <h4 className="text-lg font-headline text-accent-cyan mb-2">{row.title}</h4>
            <motion.div className="flex gap-4 overflow-x-auto scrollbar-hide" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {row.items.map((item: any, j: number) => (
                <motion.div key={item} className="min-w-[120px] rounded-xl bg-black/60 text-white px-4 py-3 font-bold text-center shadow-fab-glow border border-accent-cyan/20 hover:scale-105 transition-all cursor-pointer" whileHover={{ scale: 1.1 }}>
                  {item}
                </motion.div>
              ))}
            </motion.div>
          </div>
        ))}
      </div>
      {/* Suggested Creators */}
      <div className="max-w-2xl mx-auto py-8">
        <h4 className="text-lg font-headline text-accent-cyan mb-4">Suggested Creators</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {suggestedCreators.map((creator: any, i: number) => (
            <motion.div key={creator.uid} className="flex items-center gap-4 bg-black/80 rounded-xl p-4 shadow-fab-glow border border-accent-cyan/10 hover:bg-accent-cyan/10 transition-all cursor-pointer" whileHover={{ scale: 1.05 }} onClick={() => router.push(`/squad/${creator.uid}`)}>
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-accentPink to-accentCyan flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                {creator.avatar_url ? <img src={creator.avatar_url} alt="avatar" className="w-full h-full object-cover rounded-full" /> : creator.name ? creator.name[0] : "U"}
              </div>
              <div className="flex-1">
                <div className="font-headline text-accent-cyan">{creator.name}</div>
                <div className="text-xs text-gray-500">@{creator.username}</div>
                <p className="text-xs text-gray-400 line-clamp-1 mt-1">{creator.bio}</p>
              </div>
              <button className="px-4 py-2 rounded-full bg-accent-cyan text-primary font-bold text-xs">Follow</button>
            </motion.div>
          ))}
        </div>
      </div>

      {selectedTag && <TaggedPostsModal tag={selectedTag} posts={taggedPosts} onClose={() => setSelectedTag(null)} />}
    </div>
  );
}
