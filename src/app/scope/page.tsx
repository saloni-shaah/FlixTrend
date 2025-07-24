"use client";
import React, { useEffect, useState } from "react";
import { getFirestore as _getFirestore, collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { FaRegHeart, FaRegComment, FaCrown } from "react-icons/fa";
import { app } from "@/utils/firebaseClient";

const db = _getFirestore(app);

export default function ScopePage() {
  const [shorts, setShorts] = useState<any[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("videos");

  useEffect(() => {
    // Fetch only video posts
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const all = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setShorts(all.filter((p) => p.type === "media" && p.mediaUrl && p.mediaUrl.match(/\.(mp4|webm|ogg)$/i)));
    });
    return () => unsub();
  }, []);

  // Filter shorts by search
  const filteredShorts = shorts.filter(
    (s) =>
      (!search || s.content?.toLowerCase().includes(search.toLowerCase()) || s.username?.toLowerCase().includes(search.toLowerCase()))
  );

  // Handle swipe/scroll (basic up/down navigation)
  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY > 0 && activeIndex < filteredShorts.length - 1) setActiveIndex((i) => i + 1);
    if (e.deltaY < 0 && activeIndex > 0) setActiveIndex((i) => i - 1);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-primary via-secondary to-accent-cyan/10">
      {/* Premium Features Bar */}
      <div className="flex flex-col gap-2 items-center py-4">
        <div className="flex gap-2 flex-wrap mb-2">
          {["#trending", "#vibes", "#flash", "#ai", "#music", "#premium", "#shorts"].map(tag => (
            <span key={tag} className="px-3 py-1 rounded-full bg-accent-cyan/20 text-accent-cyan text-xs font-bold flex items-center gap-1">
              {tag === "#premium" && <FaCrown className="text-accent-pink" />} {tag}
            </span>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search shorts or users..."
          className="w-full max-w-xs px-4 py-2 rounded-full bg-black/40 text-white border-2 border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-pink"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex gap-2 mt-2">
          <button className={`px-3 py-1 rounded-full text-xs font-bold ${filter === "all" ? "bg-accent-pink text-white" : "bg-accent-pink/20 text-accent-pink"}`} onClick={() => setFilter("all")}>All</button>
          <button className={`px-3 py-1 rounded-full text-xs font-bold ${filter === "videos" ? "bg-accent-pink text-white" : "bg-accent-pink/20 text-accent-pink"}`} onClick={() => setFilter("videos")}>Videos</button>
        </div>
      </div>
      {/* Shorts Feed */}
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden" onWheel={handleWheel} style={{ minHeight: "60vh" }}>
        {filteredShorts.length === 0 ? (
          <div className="text-gray-400 text-center mt-16">
            <div className="text-4xl mb-2">🎬</div>
            <div className="text-lg font-semibold">No shorts yet</div>
            <div className="text-sm">When users post videos, their shorts will appear here!</div>
          </div>
        ) : (
          <div className="w-full h-[70vh] max-w-xs sm:max-w-sm md:max-w-md flex items-center justify-center relative">
            {filteredShorts.map((short, idx) => (
              <div
                key={short.id}
                className={`absolute top-0 left-0 w-full h-full transition-all duration-500 ${idx === activeIndex ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"}`}
                style={{ pointerEvents: idx === activeIndex ? "auto" : "none" }}
              >
                <div className="relative w-full h-full flex flex-col items-center justify-end">
                  <video
                    src={short.mediaUrl}
                    className="w-full h-full object-cover rounded-2xl shadow-2xl border-4 border-accent-cyan"
                    autoPlay
                    loop
                    muted
                    playsInline
                    style={{ maxHeight: "70vh" }}
                  />
                  {/* Overlay */}
                  <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/80 via-black/30 to-transparent rounded-b-2xl flex flex-col gap-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-accentPink to-accentCyan flex items-center justify-center text-white font-bold text-base">
                        {short.displayName ? short.displayName[0] : short.username?.[0] || "U"}
                      </span>
                      <span className="font-headline text-accent-cyan text-sm">@{short.username || (short.displayName ? short.displayName.replace(/\s+/g, "").toLowerCase() : "user")}</span>
                      <span className="ml-auto text-xs text-accent-pink flex items-center gap-1"><FaCrown /> Premium</span>
                    </div>
                    <div className="text-white text-base font-body mb-1 line-clamp-3" style={{ textShadow: "0 2px 8px #000" }}>{short.content}</div>
                    <div className="flex gap-4">
                      <button className="flex items-center gap-1 text-lg font-bold text-gray-200 hover:text-accent-pink transition-all">
                        <FaRegHeart /> <span>{short.likeCount || 0}</span>
                      </button>
                      <button className="flex items-center gap-1 text-lg font-bold text-gray-200 hover:text-accent-cyan transition-all">
                        <FaRegComment /> <span>{short.commentCount || 0}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Navigation Dots */}
      {filteredShorts.length > 1 && (
        <div className="flex justify-center gap-2 py-4">
          {filteredShorts.map((_, idx) => (
            <button
              key={idx}
              className={`w-3 h-3 rounded-full ${idx === activeIndex ? "bg-accent-pink" : "bg-accent-cyan/30"}`}
              onClick={() => setActiveIndex(idx)}
              aria-label={`Go to short ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
} 