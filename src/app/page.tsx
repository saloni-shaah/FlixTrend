
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Head from "next/head";
import { auth } from "@/utils/firebaseClient";
import { FlixTrendLogo } from "@/components/FlixTrendLogo";
import { motion } from "framer-motion";
import { Play, Volume2, VolumeX } from "lucide-react";

// ─── Asset registry ────────────────────────────────────────────────────────────
const A = {
  avatarBhaskar:
    "https://res.cloudinary.com/drrzvi2jp/image/upload/v1778157083/avatar-1775660688573_whyrag.jpg",
  avatarSasuke:
    "https://res.cloudinary.com/drrzvi2jp/image/upload/v1778157322/SDkxWlqBsBbMhYoFbvqpy5Tfwbf1-1761121071679-1000156730_fctjcr.jpg",
  avatarLordPain:
    "https://res.cloudinary.com/drrzvi2jp/image/upload/v1778157384/avatar-1775192512273_yl9wxb.png",
  avatarKrishnam:
    "https://res.cloudinary.com/drrzvi2jp/image/upload/v1778163511/avatar-1777737580328_ppd2ns.png",
  avatarNaz:
    "https://res.cloudinary.com/drrzvi2jp/image/upload/v1778163884/avatar-1764248094857_p9sux5.jpg",
  avatarTripti:
    "https://res.cloudinary.com/drrzvi2jp/image/upload/v1778164065/hqXCxEzM3uMjafbdOhjXc6DqaP63-1765967286841-1000013245_hcrbho.jpg",
  avatarRitesh:
    "https://res.cloudinary.com/drrzvi2jp/image/upload/v1778164101/avatar-1775215600205_vjf4rb.jpg",
  avatarFalak:
    "https://res.cloudinary.com/drrzvi2jp/image/upload/v1778164243/v2jGz3orUURUPbjHBYBAZxXRKKF2-1764609622563-33394_bx9tf1.jpg",
  avatarSaloni:
    "https://res.cloudinary.com/drrzvi2jp/image/upload/v1778164291/avatar-1777026858879_vtistj.jpg",
  videoRelatable:
    "https://firebasestorage.googleapis.com/v0/b/flixtrend-24072025.firebasestorage.app/o/posts%2Fx04gu2AkBFVX4y6Iho6J713cJOy2%2Fprocessed_1777119154410_vidssave.com%20Really%20needed%20that%20%241%20%23sofimanassyan%20%23relatable%20%23funny%20720P_720p.mp4?alt=media&token=f6233518-7998-4bae-9ea2-802c0b5408fd",
  videoThunder:
    "https://firebasestorage.googleapis.com/v0/b/flixtrend-24072025.firebasestorage.app/o/posts%2Fx04gu2AkBFVX4y6Iho6J713cJOy2%2Fprocessed_1775662034161__shortsfeed_familyguy_viral_funny_clips_stewiegriffin_trendingshorts_comedy_memes_720P_720p.mp4?alt=media&token=1656a901-381c-4511-9e5e-418028417e7f",
  videoCanYouRelate:
    "https://firebasestorage.googleapis.com/v0/b/flixtrend-24072025.firebasestorage.app/o/posts%2Fx04gu2AkBFVX4y6Iho6J713cJOy2%2Fx04gu2AkBFVX4y6Iho6J713cJOy2-1771791542458-can_you_relate_720P.mp4?alt=media&token=c9a14eec-4ef9-4a32-8a64-0117162269d2",
  imageSasuke:
    "https://res.cloudinary.com/drrzvi2jp/image/upload/v1778164333/1777475977460_IMG_20260429_204809_340_jysgh8.webp",
  imageSJS:
    "https://res.cloudinary.com/drrzvi2jp/image/upload/v1778164370/1775992932350_1000021690_wgnfzd.jpg",
  imageWelcome:
    "https://res.cloudinary.com/drrzvi2jp/image/upload/v1778165706/8p4s3yjnyfr21_qevsva.jpg",

  imageBanner1: "https://firebasestorage.googleapis.com/v0/b/flixtrend-24072025.firebasestorage.app/o/user_uploads%2Fx04gu2AkBFVX4y6Iho6J713cJOy2%2Fbanner-1777737584802?alt=media&token=1ac20c1e-d539-4ef2-9f4a-61a01858427a",
  
  imageBanner2: "https://firebasestorage.googleapis.com/v0/b/flixtrend-24072025.firebasestorage.app/o/user_uploads%2Fx04gu2AkBFVX4y6Iho6J713cJOy2%2Fbanner-1775660691734?alt=media&token=d412c65e-ab83-4158-a89b-02e989d5ffcb",
  
  dropEminem:
    "https://res.cloudinary.com/drrzvi2jp/image/upload/v1778164988/Eminem_-_Mockingbird_Official_Music_Video_-_YouTube_-_Google_Chrome_24-04-2026_13_00_59_mgu4gy.png",
  
    dropLordPain:
    "https://res.cloudinary.com/drrzvi2jp/image/upload/v1778164449/drop_1777174892308_1000027703_k0klic.jpg",
};

// ─── Animated counter (slow live feel) ────────────────────────────────────────
function LiveCount({ base }: { base: number }) {
    const [n, setN] = useState(base);
    useEffect(() => {
        const t = setInterval(() => {
            if (Math.random() > 0.6) setN(c => c + Math.floor(Math.random() * 10));
        }, 2800 + Math.random() * 1400);
        return () => clearInterval(t);
    }, [base]);

    // Format number to be more readable, e.g., 100k
    const formatNumber = (num: number) => {
        if (num >= 100000) {
            return (num / 1000).toFixed(0) + 'k';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'k';
        }
        return num;
    }

    return <>{formatNumber(n)}</>;
}

// ─── Spotlight Video Player ──────────────────────────────────────────────────
function SpotlightVideoPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true); // Autoplay initially
  const [isMuted, setIsMuted] = useState(true);

  // Autoplay with intersection observer
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {}); // Autoplay might be blocked
        } else {
          video.pause();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);


  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  return (
    <div className="relative w-full h-full rounded-lg" onClick={togglePlay}>
      <video
        ref={videoRef}
        src={src}
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-full rounded-lg"
      />
      {!isPlaying && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 pointer-events-none">
          <Play size={60} className="text-white opacity-80" />
        </div>
      )}
      <button
        onClick={toggleMute}
        className="absolute bottom-4 right-4 z-20 bg-black/60 p-3 rounded-full text-white backdrop-blur-md hover:bg-black/80 transition"
      >
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>
    </div>
  );
}

// ─── Reusable fade-up variant ──────────────────────────────────────────────────
const fu = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as number[] } },
};

// ─── Feed post card ────────────────────────────────────────────────────────────
function PostCard({
  avatar, user, content, media, isVideo, stars, tag, size = 'normal', sound = false
}: {
  avatar: string; user: string; content: string;
  media: string; isVideo?: boolean; stars: number; tag?: string; size?: 'normal' | 'small', sound?: boolean
}) {
  const aspectClass = isVideo || size === 'small' ? "aspect-video" : "aspect-[4/5]";

  const sizeClass = {
    normal: "min-w-[240px] md:min-w-[272px]",
    small: "w-[200px]", // Increased size for better visibility
  }[size];

  return (
    <motion.div
      whileHover={{ scale: 1.025, boxShadow: "0 0 0 1px rgba(139,92,246,0.22)" }}
      transition={{ duration: 0.18 }}
      className={`snap-start ${sizeClass} rounded-2xl border border-zinc-800/60 bg-zinc-900/60 backdrop-blur-sm overflow-hidden flex-shrink-0`}
    >
      <div className={`relative w-full ${aspectClass} bg-zinc-800`}>
        {isVideo
          ? <video src={media} autoPlay muted={!sound} loop playsInline className="w-full h-full object-cover" />
          : <img src={media} alt="" className="w-full h-full object-cover" />}
        {tag && (
          <span className="absolute top-2 left-2 text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-violet-600/80 text-white backdrop-blur-sm">
            {tag}
          </span>
        )}
      </div>
      <div className="p-3.5">
        <div className="flex items-center gap-2 mb-2">
          <img src={avatar} alt="" className="w-6 h-6 rounded-full object-cover border border-zinc-700" />
          <span className="text-zinc-300 text-xs font-medium truncate">{user}</span>
        </div>
        {content ? <p className="text-zinc-500 text-xs leading-relaxed line-clamp-2 mb-2">{content}</p> : null}
        <div className="flex items-center gap-1">
          <span className="text-yellow-400 text-xs">⭐</span>
          <span className="text-zinc-400 text-xs"><LiveCount base={stars} /></span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        router.push('/vibespace');
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return <div className="min-h-screen bg-[#0b0b0c]" />;
  }

  return (
    <>
      <Head>
        <title>Don't follow trends. Create them. — FlixTrend</title>
        <meta name="description" content="FlixTrend — a social system built for creators. Every Drop can shape what the world sees." />
      </Head>

      {/* Grain overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-50 opacity-[0.03] mix-blend-overlay"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }}
      />

      <main className="min-h-screen bg-[#0b0b0c] text-zinc-200 flex flex-col overflow-x-hidden">
        
        <div className="w-full pt-16 pb-8 flex flex-col items-center justify-center z-10">
            <FlixTrendLogo size={90} />
            <h2 className="text-violet-400 text-xl font-semibold mt-4 tracking-wider">The clean side of the internet.</h2>
        </div>

        {/* ══════════════════════════════════════════════════
            S1 — HERO
        ══════════════════════════════════════════════════ */}
        <section className="relative flex items-center px-6 md:px-16 lg:px-24 py-20 overflow-hidden">

          {/* ambient glows */}
          <div className="absolute top-1/3 right-1/4 w-[480px] h-[480px] rounded-full bg-violet-600/8 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-[280px] h-[280px] rounded-full bg-violet-500/5 blur-[80px] pointer-events-none" />

          <div className="relative max-w-6xl mx-auto w-full grid md:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Left: copy */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-8 text-center md:text-left order-2 md:order-1"
            >
              <h1 className="text-[40px] md:text-[56px] lg:text-[66px] font-light tracking-tight text-zinc-100 leading-[1.06]">
                Don't follow<br />trends.<br />
                <span className="text-violet-400">Create them —</span><br />
                <span className="text-[26px] md:text-[34px] text-zinc-400">and control how they spread.</span>
              </h1>

              <p className="text-base md:text-lg text-zinc-400 leading-relaxed max-w-md mx-auto md:mx-0">
                Turn ideas into trends — backed by systems, not luck.{" "}
                <span className="text-zinc-500">
                  Built around <span className="text-violet-400 font-medium">Drops</span> — a new way to create and shape trends.
                </span>
              </p>

              <div className="flex flex-col items-center md:items-start gap-4">
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <Link
                    href="/signup"
                    className="px-7 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-violet-500/20"
                  >
                    Get early access
                  </Link>
                  <Link
                    href="/guest"
                    className="px-7 py-3.5 rounded-xl border border-zinc-700/80 text-zinc-300 text-sm hover:border-violet-500/50 hover:text-violet-300 transition-all duration-200"
                  >
                    See how it works
                  </Link>
                   <Link
                    href="/login"
                    className="px-7 py-3.5 rounded-xl border border-zinc-700/80 text-zinc-300 text-sm hover:border-zinc-500 transition-all duration-200"
                  >
                    Log in
                  </Link>
                </div>
                <p className="text-xs text-zinc-600">Early access rolling out · Be among the first creators</p>
              </div>

              {/* mini proof */}
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <div className="flex -space-x-2.5">
                  {[A.avatarBhaskar, A.avatarSasuke, A.avatarLordPain, A.avatarKrishnam, A.avatarNaz, A.avatarTripti, A.avatarRitesh, A.avatarFalak, A.avatarSaloni].map((src, i) => (
                    <img key={i} src={src} alt="" className="w-8 h-8 rounded-full border-2 border-[#0b0b0c] object-cover" />
                  ))}
                  <div className="w-8 h-8 rounded-full border-2 border-[#0b0b0c] bg-zinc-800 flex items-center justify-center">
                    <span className="text-[9px] text-zinc-400">+775</span>
                  </div>
                </div>
                <span className="text-xs text-zinc-500">780+ users vibin'</span>
              </div>
            </motion.div>

            {/* Right: floating product cards */}
            <div className="relative flex justify-center items-center h-[340px] md:h-[460px] order-1 md:order-2">

              {/* center — portrait video */}
              <motion.div
                initial={{ opacity: 0, y: 32, rotate: -4 }}
                animate={{ opacity: 1, y: 0, rotate: -4 }}
                transition={{ duration: 0.85, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-20 w-[148px] md:w-[172px] rounded-[20px] overflow-hidden border border-zinc-700/60 shadow-2xl shadow-black/60"
                style={{ aspectRatio: "9/16" }}
              >
                <video src={A.videoRelatable} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <img src={A.avatarRitesh} alt="" className="w-5 h-5 rounded-full border border-zinc-600 object-cover" />
                    <span className="text-white text-[10px] font-medium truncate">Ritesh</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-400 text-[11px]">⭐</span>
                    <span className="text-white text-[10px]"><LiveCount base={483123} /></span>
                  </div>
                </div>
              </motion.div>

              {/* back-right — image card */}
              <motion.div
                initial={{ opacity: 0, y: 32, rotate: 5 }}
                animate={{ opacity: 1, y: 16, rotate: 5 }}
                transition={{ duration: 0.85, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="absolute right-3 md:right-1 bottom-4 z-10 w-[116px] md:w-[144px] rounded-[20px] overflow-hidden border border-zinc-700/60 shadow-2xl shadow-black/60"
                style={{ aspectRatio: "4/5" }}
              >
                <img src={A.imageSasuke} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-2.5 right-2.5 flex items-center gap-1">
                  <img src={A.avatarSasuke} alt="" className="w-4 h-4 rounded-full object-cover" />
                  <span className="text-white text-[9px] truncate">TP Sasuke !!</span>
                </div>
              </motion.div>

              {/* floating drop card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.75, ease: [0.22, 1, 0.36, 1] }}
                className="absolute -top-4 right-2 md:-right-1 z-30 w-[128px] rounded-xl border border-violet-500/30 bg-[#111113]/95 backdrop-blur-md p-2.5 shadow-xl shadow-violet-500/10"
              >
                <p className="text-[9px] text-violet-400 font-medium mb-1.5 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-violet-400 animate-pulse inline-block" />
                  Drop · 24h left
                </p>
                <img src={A.dropEminem} alt="" className="w-full h-14 rounded-lg object-cover mb-2" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <img src={A.avatarFalak} alt="" className="w-4 h-4 rounded-full object-cover" />
                    <span className="text-zinc-500 text-[9px] truncate">Falak</span>
                  </div>
                  <span className="text-[11px]">😢 1</span>
                </div>
              </motion.div>

              {/* SJS image instead of signal chip */}
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.0, duration: 0.55 }}
                className="absolute left-0 top-16 w-[128px] rounded-xl border border-zinc-800/60 bg-[#111113]/90 backdrop-blur-sm z-30 overflow-hidden hidden md:block"
              >
                <img src={A.imageSJS} alt="" className="w-full h-auto" />
              </motion.div>

              {/* Krishnam avatar instead of stars chip */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.15, duration: 0.55 }}
                className="absolute left-2 bottom-14 w-[128px] rounded-xl border border-zinc-800/60 bg-[#111113]/90 backdrop-blur-sm z-30 overflow-hidden hidden md:block"
              >
                  <img src={A.avatarKrishnam} alt="" className="w-full h-auto" />
              </motion.div>
            </div>

          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            S2 — LIVE FEED PREVIEW
        ══════════════════════════════════════════════════ */}
        <section className="py-20 border-t border-zinc-800/40 overflow-hidden">
          <motion.div
            variants={fu} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="px-6 md:px-16 mb-8"
          >
            <div className="flex items-center gap-2.5 mb-2">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
              <span className="text-[11px] text-violet-400 uppercase tracking-widest font-medium">Live on FlixTrend</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-light text-zinc-100">What's happening right now</h2>
          </motion.div>

          <div
            className="grid grid-flow-col auto-cols-max md:grid-flow-row md:grid-cols-3 gap-4 px-6 md:px-16 overflow-x-auto pb-4 snap-x snap-mandatory"
            style={{ scrollbarWidth: "none" }}
          >
            <PostCard avatar={A.avatarSaloni} user="Saloni"
              content="the Iconic one of GoT "
              media={A.imageWelcome} stars={483123} tag="GoT" size="small"/>
            <PostCard avatar={A.avatarSasuke} user="Bhaskar's Princess !!"
              content="New pfp ✨!"
              media={A.imageBanner1} stars={320000} tag="Marvel" size="small"/>
            <PostCard avatar={A.avatarFalak} user="Palak"
              content="The best Trio of all✨!"
              media={A.imageBanner2} stars={280000} tag="Harry Potter" size="small" className="hidden md:flex"/>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            S2.5 — CREATOR SPOTLIGHT
        ══════════════════════════════════════════════════ */}
        <section className="py-20 border-t border-zinc-800/40 overflow-hidden">
            <motion.div
                variants={fu} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="px-6 md:px-16 mb-8 max-w-4xl mx-auto"
            >
                <div className="flex items-center gap-2.5 mb-2">
                    <span className="text-[11px] text-violet-400 uppercase tracking-widest font-medium">Creator Spotlight</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-light text-zinc-100">FlixTrend's Finest</h2>
                
                <div className="mt-8 rounded-2xl border border-zinc-800/60 bg-zinc-900/60 p-4">
                    <SpotlightVideoPlayer src={A.videoCanYouRelate} />
                    <div className="p-3.5">
                        <div className="flex items-center gap-2 mb-2">
                            <img src={A.avatarTripti} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-zinc-700" />
                            <span className="text-zinc-300 text-sm font-medium truncate">Tripti</span>
                        </div>
                        <p className="text-zinc-400 text-sm leading-relaxed mb-2">Can you relate?</p>
                        <div className="flex items-center gap-1">
                            <span className="text-yellow-400 text-lg">⭐</span>
                            <span className="text-zinc-400 text-sm"><LiveCount base={234567} /></span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </section>


         {/* ══════════════════════════════════════════════════
            S2.6 — COMMUNITY FAVORITES
        ══════════════════════════════════════════════════ */}
        <section className="py-20 border-t border-zinc-800/40 overflow-hidden">
            <motion.div
                variants={fu} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="px-6 md:px-16 mb-8 max-w-4xl mx-auto"
            >
                <div className="flex items-center gap-2.5 mb-2">
                    <span className="text-[11px] text-violet-400 uppercase tracking-widest font-medium">Community Favorites</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-light text-zinc-100">Trending Now</h2>
                
                <div className="mt-8 rounded-2xl border border-zinc-800/60 bg-zinc-900/60 p-4">
                    <SpotlightVideoPlayer src={A.videoThunder} />
                    <div className="p-3.5">
                        <div className="flex items-center gap-2 mb-2">
                            <img src={A.avatarNaz} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-zinc-700" />
                            <span className="text-zinc-300 text-sm font-medium truncate">Naz</span>
                        </div>
                        <p className="text-zinc-400 text-sm leading-relaxed mb-2">Thunder had tolerated too much 😅</p>
                        <div className="flex items-center gap-1">
                            <span className="text-yellow-400 text-lg">⭐</span>
                            <span className="text-zinc-400 text-sm"><LiveCount base={398123} /></span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </section>


        {/* ══════════════════════════════════════════════════
            S3 — DROPS SYSTEM
        ══════════════════════════════════════════════════ */}
        <section className="py-32 px-6 md:px-16 border-t border-zinc-800/40">
          <div className="max-w-5xl mx-auto">
            <motion.div
              variants={fu} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="mb-14 text-center"
            >
              <span className="text-[11px] text-violet-400 uppercase tracking-widest font-medium">Core feature</span>
              <h2 className="text-3xl md:text-4xl font-light text-zinc-100 mt-3">Drops</h2>
              <p className="text-zinc-400 mt-4 max-w-lg mx-auto text-base leading-relaxed">
                Quick posts that disappear in 24 hours — but if people engage,{" "}
                <span className="text-zinc-200">they don't just vanish. They grow into trends.</span>
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-5">

              <motion.div
                variants={fu} initial="hidden" whileInView="visible" viewport={{ once: true }}
                transition={{ delay: 0.05 }}
                className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5 space-y-4"
              >
                <p className="text-[10px] text-zinc-600 uppercase tracking-widest">01 · Prompt drops</p>
                <div className="rounded-xl bg-zinc-800/50 p-4">
                  <p className="text-sm text-zinc-200 leading-relaxed">
                    🎧 What are you listening to right now? Drop a screenshot 🔥
                  </p>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  A daily prompt goes live. Anyone can respond with a Drop — photo, screen recording, or poll.
                </p>
              </motion.div>

              <motion.div
                variants={fu} initial="hidden" whileInView="visible" viewport={{ once: true }}
                transition={{ delay: 0.12 }}
                className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5 space-y-4"
              >
                <p className="text-[10px] text-zinc-600 uppercase tracking-widest">02 · People react</p>
                <div className="space-y-2.5">
                  {[
                    { av: A.avatarSaloni, user: "Saloni", img: A.dropEminem, rx: "😢1" },
                    { av: A.avatarLordPain, user: "lord_pain", img: A.dropLordPain, rx: "🔥 1" },
                  ].map((d, i) => (
                    <div key={i} className="flex items-center gap-2.5 rounded-xl bg-zinc-800/40 p-2.5">
                      <img src={d.av} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                      <img src={d.img} alt="" className="w-14 h-9 rounded-lg object-cover flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-zinc-500 truncate">{d.user}</p>
                        <p className="text-xs text-zinc-300 mt-0.5">{d.rx}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-zinc-500">Reactions are signals. Signals have weight.</p>
              </motion.div>

              <motion.div
                variants={fu} initial="hidden" whileInView="visible" viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border border-violet-500/25 bg-zinc-900/40 p-5 space-y-4 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600/8 to-transparent pointer-events-none" />
                <p className="text-[10px] text-violet-400 uppercase tracking-widest relative">03 · Trend rises</p>
                <div className="rounded-xl bg-zinc-800/40 p-3.5 flex items-center gap-3 relative">
                  <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-200 font-medium">Signal growing</p>
                    <p className="text-[10px] text-zinc-500 truncate">What are you listening to?</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm text-violet-400 font-medium">+18</p>
                    <p className="text-[10px] text-zinc-600">reactions</p>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 relative leading-relaxed">
                  The poll with the most engagement doesn't disappear — it becomes a trend. You started it.
                </p>
                <div className="rounded-lg bg-violet-500/10 border border-violet-500/20 px-3 py-2 relative">
                  <p className="text-[11px] text-violet-300">🏆 Highest voted poll → you set the trend</p>
                </div>
              </motion.div>

            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            S4 — HOW IT WORKS
        ══════════════════════════════════════════════════ */}
        <section className="py-24 px-6 md:px-16 border-t border-zinc-800/40 bg-zinc-900/20">
          <div className="max-w-5xl mx-auto">
            <motion.div
              variants={fu} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="text-center mb-14"
            >
              <span className="text-[11px] text-violet-400 uppercase tracking-widest font-medium">The system</span>
              <h2 className="text-3xl md:text-4xl font-light text-zinc-100 mt-3">How a trend is created</h2>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { n: "01", icon: "💧", title: "Drop something", body: "Share a photo, thought, or poll. No algorithm to appease." },
                { n: "02", icon: "⚡", title: "People react", body: "Stars, reactions, comments — every action stacks as signal." },
                { n: "03", icon: "📡", title: "Signals build", body: "Real interactions — not random boosts from a black box." },
                { n: "04", icon: "🔥", title: "It rises", body: "Your idea becomes what the world sees. You built that." },
              ].map((item, i) => (
                <motion.div
                  key={item.n}
                  variants={fu} initial="hidden" whileInView="visible" viewport={{ once: true }}
                  transition={{ delay: i * 0.09 }}
                  whileHover={{ scale: 1.025 }}
                  className="p-5 rounded-2xl border border-zinc-800/50 bg-zinc-900/40 space-y-3"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <p className="text-[9px] text-zinc-700 uppercase tracking-widest">{item.n}</p>
                  <h3 className="text-sm font-medium text-zinc-100">{item.title}</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">{item.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            S5 — CONTROL / CHECKS
        ══════════════════════════════════════════════════ */}
        <section className="py-32 px-6 md:px-16 border-t border-zinc-800/40">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">

            <motion.div
              variants={fu} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="space-y-6"
            >
              <span className="text-[11px] text-violet-400 uppercase tracking-widest font-medium">The difference</span>
              <h2 className="text-3xl md:text-4xl font-light text-zinc-100 leading-snug">
                Algorithms don't decide<br />what wins here.<br />
                <span className="text-violet-400">Actions do.</span>
              </h2>
              <p className="text-zinc-400 text-base leading-relaxed max-w-sm">
                Every post is evaluated by real signals. What spreads is what people actually respond to — not what's pushed.
              </p>
            </motion.div>

            <div className="space-y-3">
              {[
                { icon: "✔", label: "Checked", sub: "Real signal verified", lit: true },
                { icon: "📡", label: "Signal rising", sub: "Interaction threshold met", lit: true },
                { icon: "⭐", label: "875 stars", sub: "Community endorsed", lit: true },
                { icon: "🔒", label: "Secure signal", sub: "Signal protocol active", lit: false },
              ].map((row, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${row.lit
                    ? "border-violet-500/20 bg-violet-500/5"
                    : "border-zinc-800/50 bg-zinc-900/30"
                  }`}
                >
                  <span className={`text-base flex-shrink-0 ${!row.lit ? "opacity-30" : ""}`}>{row.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-200 font-medium">{row.label}</p>
                    <p className="text-xs text-zinc-500">{row.sub}</p>
                  </div>
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${row.lit ? "bg-violet-400 animate-pulse" : "bg-zinc-700"}`} />
                </motion.div>
              ))}\
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            S6 — SOCIAL PROOF
        ══════════════════════════════════════════════════ */}
        <section className="py-24 px-6 md:px-16 border-t border-zinc-800/40 bg-zinc-900/20">
          <motion.div
            variants={fu} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center space-y-10"
          >
            <h2 className="text-2xl md:text-3xl font-light text-zinc-100">Already creating</h2>

            <div className="flex justify-center gap-12 flex-wrap">
              {[
                { val: "780+", label: "Active Users" },
                { val: "500k ⭐", label: "Stars on top post" },
                { val: "India", label: "Launching first" },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-3xl md:text-4xl font-light text-violet-400">{s.val}</p>
                  <p className="text-sm text-zinc-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-center -space-x-3">
              {[A.avatarBhaskar, A.avatarSasuke, A.avatarLordPain, A.avatarKrishnam, A.avatarNaz, A.avatarTripti, A.avatarRitesh, A.avatarFalak, A.avatarSaloni].map((src, i) => (
                <img key={i} src={src} alt="" className="w-11 h-11 rounded-full border-2 border-[#0b0b0c] object-cover" />
              ))}
              <div className="w-11 h-11 rounded-full border-2 border-[#0b0b0c] bg-zinc-800 flex items-center justify-center">
                <span className="text-[9px] text-zinc-400">+771</span>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════════
            S7 — VISION
        ══════════════════════════════════════════════════ */}
        <section className="py-40 px-6 border-t border-zinc-800/40 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[600px] h-[280px] rounded-full bg-violet-600/6 blur-[100px]" />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative max-w-3xl mx-auto text-center space-y-6"
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-zinc-100 leading-tight">
              The future of social<br />is built —<br />
              <span className="text-violet-400">not fed to you.</span>
            </h2>
            <p className="text-lg md:text-xl text-zinc-400 font-light">And it starts with creators.</p>
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════════
            S8 — FINAL CTA
        ══════════════════════════════════════════════════ */}
        <section className="py-32 px-6 border-t border-zinc-800/40">
          <motion.div
            variants={fu} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="max-w-lg mx-auto text-center space-y-8"
          >
            <div className="flex justify-center"><FlixTrendLogo size={48} /></div>
            <h2 className="text-3xl md:text-4xl font-light text-zinc-100">Ready to create?</h2>
            <p className="text-zinc-400 leading-relaxed">Join the creators building the next wave of social.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/signup"
                className="px-8 py-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-violet-500/20"
              >
                Get early access
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 rounded-xl border border-zinc-700/80 text-zinc-300 text-sm hover:border-zinc-500 transition"
              >
                Log in
              </Link>
            </div>
          </motion.div>
        </section>

        {/* ── Footer ── */}
        <footer className="py-10 px-6 border-t border-zinc-800/40">
          <div className="max-w-6xl mx-auto flex flex-col items-center gap-4">
            <p className="text-xs text-zinc-700">© {new Date().getFullYear()} FlixTrend · Built with intention.</p>
            <div className="flex gap-6 text-xs text-zinc-600">
              <Link href="/about" className="hover:text-zinc-300 transition">About</Link>
              <Link href="/privacy" className="hover:text-zinc-300 transition">Privacy & Safety</Link>
              <Link href="/terms" className="hover:text-zinc-300 transition">Terms</Link>
              <Link href="/contact" className="hover:text-zinc-300 transition">Contact</Link>
            </div>
          </div>
        </footer>

      </main>
    </>
  );
}
