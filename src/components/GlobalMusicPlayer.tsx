
"use client";

import React, {
  useState, useRef, useCallback, useMemo, useEffect,
} from 'react';
import { useMusicPlayer } from '@/utils/MusicPlayerContext';
import {
  Play, Pause, SkipBack, SkipForward,
  Shuffle, Repeat, Repeat1, ChevronDown,
  ListMusic, Music2,
} from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Song } from '@/types/music';

const fmt = (t: number) => {
  if (!t || isNaN(t)) return '0:00';
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const NOISE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

const lightColors = [
  'rgba(173, 216, 230, 0.5)', 
  'rgba(144, 238, 144, 0.5)', 
  'rgba(255, 255, 224, 0.5)', 
  'rgba(255, 182, 193, 0.5)', 
  'rgba(221, 160, 221, 0.5)', 
  'rgba(240, 128, 128, 0.5)', 
  'rgba(135, 206, 250, 0.5)', 
  'rgba(255, 218, 185, 0.5)', 
];

export function GlobalMusicPlayer() {
  const {
    activeSong,
    isPlaying,
    toggleSong,
    playNext,
    playPrevious,
    playSongFromPlaylist,
    currentPlaylist,
    currentTime,
    duration,
    seek,
    isShuffle,
    toggleShuffle,
    repeatMode,
    setRepeatMode,
  } = useMusicPlayer();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showQueue,  setShowQueue]  = useState(false);
  const [isSeeking,  setIsSeeking]  = useState(false);
  const progressRef                 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeSong) return;
    try {
      localStorage.setItem('flixtrend_player', JSON.stringify({
        activeSongId: activeSong.id,
        currentTime,
      }));
    } catch {}
  }, [activeSong, currentTime]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const colorIndex = useMemo(() => {
    if (!activeSong) return 0;
    const hash = activeSong.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return hash % lightColors.length;
  }, [activeSong]);

  const dynamicBackgroundColor = lightColors[colorIndex];

  const upNext = useMemo<Song[]>(() => {
    if (!activeSong || currentPlaylist.length === 0) return [];
    const idx = currentPlaylist.findIndex(s => s?.id === activeSong.id);
    if (idx === -1) return [];
    return currentPlaylist.slice(idx + 1, idx + 11); // Limit to 10 songs
}, [activeSong, currentPlaylist]);

  const computeSeek = useCallback((clientX: number) => {
    if (!progressRef.current || !duration) return;
    const { left, width } = progressRef.current.getBoundingClientRect();
    seek(Math.max(0, Math.min(1, (clientX - left) / width)) * duration);
  }, [duration, seek]);

  const onMouseDown  = (e: React.MouseEvent)  => { setIsSeeking(true);  computeSeek(e.clientX); };
  const onMouseMove  = (e: React.MouseEvent)  => { if (isSeeking) computeSeek(e.clientX); };
  const onMouseUp    = ()                      =>   setIsSeeking(false);
  const onTouchStart = (e: React.TouchEvent)  => { setIsSeeking(true);  computeSeek(e.touches[0].clientX); };
  const onTouchMove  = (e: React.TouchEvent)  => { if (isSeeking) computeSeek(e.touches[0].clientX); };
  const onTouchEnd   = ()                      =>   setIsSeeking(false);

  const onDragEnd = useCallback((_: unknown, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 400) setIsExpanded(false);
  }, []);

  const onAlbumSwipe = useCallback((_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) < 60) return;
    info.offset.x < 0 ? playNext() : playPrevious();
  }, [playNext, playPrevious]);

  const cycleRepeat = useCallback(() => {
    const modes: ('none' | 'all' | 'one')[] = ['none', 'all', 'one'];
    setRepeatMode(modes[(modes.indexOf(repeatMode) + 1) % modes.length]);
  }, [repeatMode, setRepeatMode]);

  if (!activeSong) return null;

  return (
    <>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            key="expanded"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 32 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 300 }}
            dragElastic={0.2}
            onDragEnd={onDragEnd}
            className="fixed inset-0 z-[100] overflow-hidden"
            style={{ 
              backgroundColor: dynamicBackgroundColor, 
              touchAction: 'none' 
            }}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          >
            <div className="absolute inset-0 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeSong.id + '-bg'}
                  src={activeSong.albumArtUrl}
                  initial={{ opacity: 0, scale: 1.15 }}
                  animate={{ opacity: 1,  scale: 1.1  }}
                  exit={{ opacity: 0,     scale: 1.05 }}
                  transition={{ duration: 0.55 }}
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  style={{ filter: 'blur(55px) saturate(1.5) brightness(0.6)' }}
                />
              </AnimatePresence>
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.7) 100%)',
                }}
              />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ backgroundImage: NOISE, opacity: 0.045, mixBlendMode: 'overlay' }}
              />
            </div>

            <div className="relative z-10 h-full flex flex-col max-w-lg mx-auto px-6">

              <div className="flex items-center justify-between pt-14 pb-4">
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => setIsExpanded(false)}
                  className="p-2 -ml-2 text-white/50 hover:text-white transition-colors"
                >
                  <ChevronDown size={28} />
                </motion.button>
                <p
                  className="font-bold uppercase"
                  style={{ fontSize: 10, letterSpacing: '0.24em', color: 'rgba(0,229,255,.55)' }}
                >
                  Now Playing
                </p>
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => setShowQueue(q => !q)}
                  className={`p-2 -mr-2 transition-colors ${showQueue ? 'text-cyan-400' : 'text-white/40 hover:text-white'}`}
                >
                  <ListMusic size={22} />
                </motion.button>
              </div>

              <div className="relative flex-1 overflow-hidden">
                <AnimatePresence mode="wait" initial={false}>

                  {!showQueue && (
                    <motion.div
                      key="player"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.22 }}
                      className="absolute inset-0 flex flex-col"
                    >
                      <div className="flex-1 flex items-center justify-center">
                        <motion.div
                          drag="x"
                          dragConstraints={{ left: 0, right: 0 }}
                          dragElastic={0.12}
                          onDragEnd={onAlbumSwipe}
                          className="relative cursor-grab active:cursor-grabbing select-none"
                        >
                          {isPlaying && [0, 1, 2].map(i => (
                            <motion.div
                              key={i}
                              className="absolute inset-0 rounded-full pointer-events-none"
                              style={{ border: '1px solid rgba(0,229,255,.22)' }}
                              animate={{ scale: [1, 1.45 + i * 0.12], opacity: [0.55, 0] }}
                              transition={{
                                duration: 2.6, repeat: Infinity,
                                delay: i * 0.6, ease: 'easeOut',
                              }}
                            />
                          ))}

                          <AnimatePresence mode="wait">
                            <motion.div
                              key={activeSong.id + '-disc'}
                              initial={{ scale: 0.85, opacity: 0 }}
                              animate={{ scale: 1,    opacity: 1 }}
                              exit={{ scale: 0.85,    opacity: 0 }}
                              transition={{ duration: 0.35 }}
                            >
                              <motion.div
                                animate={isPlaying ? { rotate: 360 } : {}}
                                transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                                className="w-64 h-64 sm:w-72 sm:h-72 rounded-full overflow-hidden"
                                style={{
                                  boxShadow:
                                    '0 0 80px rgba(0,229,255,.2),0 40px 90px rgba(0,0,0,.75)',
                                }}
                              >
                                <img
                                  src={activeSong.albumArtUrl}
                                  alt={activeSong.title}
                                  className="w-full h-full object-cover pointer-events-none"
                                  draggable={false}
                                />
                              </motion.div>
                            </motion.div>
                          </AnimatePresence>

                          <div
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 pointer-events-none"
                            style={{ background: 'rgba(0,0,0,.9)', borderColor: 'rgba(0,229,255,.35)' }}
                          />
                        </motion.div>
                      </div>

                      <p
                        className="text-center mb-2"
                        style={{ fontSize: 10, color: 'rgba(255,255,255,.18)', letterSpacing: '0.1em' }}
                      >
                        ← swipe vinyl to skip →
                      </p>

                      <AnimatePresence mode="wait">
                        <motion.div
                          key={activeSong.id + '-meta'}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="text-center mb-5"
                        >
                          <h1 className="text-2xl font-black text-white tracking-tight truncate">
                            {activeSong.title}
                          </h1>
                          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,.45)' }}>
                            {activeSong.artist}
                            {activeSong.album && (
                              <span style={{ color: 'rgba(255,255,255,.22)' }}>
                                {' · '}{activeSong.album}
                              </span>
                            )}
                          </p>
                        </motion.div>
                      </AnimatePresence>

                      <div className="mb-5 select-none">
                        <div
                          ref={progressRef}
                          onMouseDown={onMouseDown}
                          onMouseMove={onMouseMove}
                          onTouchStart={onTouchStart}
                          onTouchMove={onTouchMove}
                          onTouchEnd={onTouchEnd}
                          className="relative h-1.5 rounded-full cursor-pointer"
                          style={{ background: 'rgba(255,255,255,.1)', touchAction: 'none' }}
                        >
                          <div
                            className="absolute top-0 left-0 h-full rounded-full"
                            style={{
                              width: `${progress}%`,
                              background: 'linear-gradient(90deg, #E6E6FA 0%, #BF00FF 100%)',
                              transition: isSeeking ? 'none' : 'width 0.22s linear',
                            }}
                          />
                          <motion.div
                            className="absolute top-1/2 -translate-y-1/2 rounded-full bg-white shadow-lg"
                            style={{ left: `calc(${progress}% - 8px)`, width: 16, height: 16 }}
                            animate={{ scale: isSeeking ? 1.5 : 1, opacity: isSeeking ? 1 : 0 }}
                            whileHover={{ opacity: 1 }}
                            transition={{ duration: 0.1 }}
                          />
                        </div>
                        <div
                          className="flex justify-between mt-1.5"
                          style={{ fontSize: 11, color: 'rgba(255,255,255,.28)' }}
                        >
                          <span>{fmt(currentTime)}</span>
                          <span>{fmt(duration)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-12">
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={toggleShuffle}
                          className="p-2 transition-colors"
                          style={{ color: isShuffle ? '#00E5FF' : 'rgba(255,255,255,.28)' }}
                        >
                          <Shuffle size={20} />
                        </motion.button>

                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={playPrevious}
                          className="p-3 hover:text-white transition-colors"
                          style={{ color: 'rgba(255,255,255,.7)' }}
                        >
                          <SkipBack size={28} fill="currentColor" />
                        </motion.button>

                        <motion.button
                          onClick={toggleSong}
                          whileTap={{ scale: 0.84 }}
                          animate={isPlaying ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                          transition={
                            isPlaying
                              ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }
                              : { duration: 0.18 }
                          }
                          className="w-[70px] h-[70px] rounded-full flex items-center justify-center text-black"
                          style={{
                            background: 'linear-gradient(135deg,#00E5FF 0%,#00FF88 100%)',
                            boxShadow:  '0 0 40px rgba(0,229,255,.38)',
                          }}
                        >
                          {isPlaying
                            ? <Pause size={30} fill="currentColor" />
                            : <Play  size={30} fill="currentColor" className="ml-1" />
                          }
                        </motion.button>

                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={playNext}
                          className="p-3 hover:text-white transition-colors"
                          style={{ color: 'rgba(255,255,255,.7)' }}
                        >
                          <SkipForward size={28} fill="currentColor" />
                        </motion.button>

                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={cycleRepeat}
                          className="p-2 transition-colors"
                          style={{ color: repeatMode !== 'none' ? '#00E5FF' : 'rgba(255,255,255,.28)' }}
                        >
                          {repeatMode === 'one'
                            ? <Repeat1 size={20} />
                            : <Repeat  size={20} />
                          }
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {showQueue && (
                    <motion.div
                      key="queue"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.22 }}
                      className="absolute inset-0 flex flex-col overflow-y-auto pb-12"
                    >
                      <div className="mb-6">
                        <p
                          className="font-bold uppercase mb-3"
                          style={{ fontSize: 10, letterSpacing: '0.22em', color: 'rgba(0,229,255,.45)' }}
                        >
                          Currently Playing
                        </p>
                        <div
                          className="flex items-center gap-4 p-3 rounded-xl"
                          style={{
                            background: 'rgba(0,229,255,.06)',
                            border:     '1px solid rgba(0,229,255,.13)',
                          }}
                        >
                          <div className="relative flex-shrink-0">
                            <img
                              src={activeSong.albumArtUrl}
                              alt={activeSong.title}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            {isPlaying && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                                <BarsAnimation />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-cyan-400 truncate">{activeSong.title}</p>
                            <p className="text-sm truncate" style={{ color: 'rgba(255,255,255,.38)' }}>
                              {activeSong.artist}
                            </p>
                          </div>
                        </div>
                      </div>

                      <p
                        className="font-bold uppercase mb-3"
                        style={{ fontSize: 10, letterSpacing: '0.2em', color: 'rgba(255,255,255,.22)' }}
                      >
                        Up Next · {upNext.length} songs
                      </p>

                      {upNext.length === 0 ? (
                        <div
                          className="flex flex-col items-center justify-center gap-3 mt-16"
                          style={{ color: 'rgba(255,255,255,.18)' }}
                        >
                          <Music2 size={36} />
                          <p className="text-sm">Queue is empty</p>
                        </div>
                      ) : (
                        <ul className="flex flex-col gap-1">
                          {upNext.map((s, i) => (
                            <motion.li
                              key={s.id}
                              initial={{ opacity: 0, x: 16 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.04 }}
                              onClick={() => playSongFromPlaylist(s)}
                              className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors hover:bg-white/5 active:bg-white/10"
                            >
                              <span
                                className="text-xs w-5 text-right flex-shrink-0"
                                style={{ color: 'rgba(255,255,255,.18)' }}
                              >
                                {i + 1}
                              </span>
                              <img
                                src={s.albumArtUrl}
                                alt={s.title}
                                className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-white truncate text-sm">{s.title}</p>
                                <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,.38)' }}>
                                  {s.artist}
                                </p>
                              </div>
                            </motion.li>
                          ))}
                        </ul>
                      )}
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            key="mini"
            initial={{ y: 120 }}
            animate={{ y: 0 }}
            exit={{ y: 120 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-28 md:bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50"
          >
            <div
              onClick={() => setIsExpanded(true)}
              className="relative flex items-center gap-3 px-3 py-2.5 rounded-2xl cursor-pointer overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.07)',
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
                border: '1px solid rgba(0,229,255,.1)',
                boxShadow: '0 8px 40px rgba(0,0,0,.55)',
              }}
            >
              <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeSong.id + '-mini-bg'}
                    src={activeSong.albumArtUrl}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.18 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ filter: 'blur(18px) saturate(2.2)', transform: 'scale(1.3)' }}
                  />
                </AnimatePresence>
              </div>

              <div
                className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,.04)' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width:      `${progress}%`,
                    background: 'linear-gradient(90deg, #E6E6FA 0%, #BF00FF 100%)',
                    transition: 'width 0.5s linear',
                  }}
                />
              </div>

              <motion.img
                key={activeSong.id + '-thumb'}
                animate={isPlaying ? { rotate: 360 } : {}}
                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                src={activeSong.albumArtUrl}
                alt={activeSong.title}
                className="relative z-10 w-11 h-11 rounded-full object-cover flex-shrink-0"
                style={{ boxShadow: '0 0 14px rgba(0,229,255,.32)' }}
              />

              <div className="relative z-10 flex-1 min-w-0">
                <p className="font-bold text-white truncate text-sm leading-tight">{activeSong.title}</p>
                <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,.42)' }}>
                  {activeSong.artist}
                </p>
              </div>

              <div className="relative z-10 flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                <motion.button
                  whileTap={{ scale: 0.84 }}
                  onClick={playPrevious}
                  className="p-2 hover:text-white transition-colors"
                  style={{ color: 'rgba(255,255,255,.38)' }}
                >
                  <SkipBack size={18} />
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.84 }}
                  onClick={toggleSong}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-black flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#00E5FF 0%,#00FF88 100%)' }}
                >
                  {isPlaying
                    ? <Pause size={16} fill="currentColor" />
                    : <Play  size={16} fill="currentColor" className="ml-0.5" />
                  }
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.84 }}
                  onClick={playNext}
                  className="p-2 hover:text-white transition-colors"
                  style={{ color: 'rgba(255,255,255,.38)' }}
                >
                  <SkipForward size={18} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function BarsAnimation() {
  return (
    <div className="flex items-end gap-[2px] h-4">
      {[0, 0.15, 0.3].map((delay, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-cyan-400"
          animate={{ scaleY: [0.3, 1, 0.3] }}
          transition={{ duration: 0.85, repeat: Infinity, delay, ease: 'easeInOut' }}
          style={{ originY: 1 }}
        />
      ))}
    </div>
  );
}
