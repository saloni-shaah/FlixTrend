import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_ZOOM = 1;
const MAX_ZOOM = 8;
const ZOOM_STEP = 1.4;
const DBL_TAP_ZOOM = 2.5;
const DBL_TAP_MS = 300;
const DBL_TAP_PX = 40;
const SWIPE_CLOSE_OFFSET = 80;
const SWIPE_CLOSE_VEL = 100;

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function getPinchDist(t: React.TouchList) {
  return Math.hypot(t[1].clientX - t[0].clientX, t[1].clientY - t[0].clientY);
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  imageUrl: string | null;
  onClose: () => void;
  alt?: string;
  caption?: string;
  imageUrls?: string[];
  captions?: string[];
  initialIndex?: number;
}

type Status = 'loading' | 'loaded' | 'error';

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
  backdrop: {
    position: 'fixed' as const,
    inset: 0,
    zIndex: 9999,
    background: 'rgba(0,0,0,0.95)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overscrollBehavior: 'contain' as const,
    userSelect: 'none' as const,
    WebkitUserSelect: 'none' as const,
  },
  imageContainer: {
    position: 'absolute' as const,
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    touchAction: 'none' as const,
  },
  img: {
    display: 'block',
    maxWidth: 'calc(100vw - 24px)',
    maxHeight: 'calc(100dvh - 120px)',
    width: 'auto',
    height: 'auto',
    objectFit: 'contain' as const,
    pointerEvents: 'none' as const,
    userSelect: 'none' as const,
    WebkitUserSelect: 'none' as const,
  },
  controls: {
    position: 'absolute' as const,
    top: 'max(12px, env(safe-area-inset-top))',
    right: 'max(12px, env(safe-area-inset-right))',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    zIndex: 10,
  },
  zoomBadge: (active: boolean): React.CSSProperties => ({
    background: 'rgba(0,0,0,0.55)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 20,
    height: 36,
    padding: '0 10px',
    fontSize: 12,
    fontFamily: 'monospace',
    cursor: 'pointer',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    minWidth: 52,
    letterSpacing: '0.03em',
    color: active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
    transition: 'color 0.15s',
  }),
  meta: {
    position: 'absolute' as const,
    top: 'max(60px, calc(env(safe-area-inset-top) + 48px))',
    left: 'max(12px, env(safe-area-inset-left))',
    pointerEvents: 'none' as const,
    color: 'rgba(255,255,255,0.28)',
    fontSize: 11,
    fontFamily: 'monospace',
    letterSpacing: '0.04em',
    background: 'rgba(0,0,0,0.35)',
    borderRadius: 10,
    padding: '3px 10px',
    whiteSpace: 'nowrap' as const,
  },
  hint: {
    position: 'absolute' as const,
    bottom: 76,
    left: 0,
    right: 0,
    textAlign: 'center' as const,
    fontSize: 11,
    color: 'rgba(255,255,255,0.22)',
    pointerEvents: 'none' as const,
    letterSpacing: '0.05em',
  },
  loaderWrap: {
    position: 'absolute' as const,
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none' as const,
  },
  caption: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    padding: '36px 20px max(20px, env(safe-area-inset-bottom))',
    boxSizing: 'border-box' as const,
    maxHeight: '45dvh',
    overflowY: 'auto' as const,
    color: '#fff',
    background: 'linear-gradient(transparent, rgba(0,0,0,0.82) 30%)',
    pointerEvents: 'auto' as const,
  },
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const FullScreenImageViewer: React.FC<Props> = ({
  imageUrl,
  onClose,
  alt = 'Full screen view',
  caption = '',
  imageUrls,
  captions,
  initialIndex = 0,
}) => {
  const [status, setStatus] = useState<Status>('loading');
  const [zoomPct, setZoomPct] = useState(100);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const naturalSize = useRef({ w: 0, h: 0 });
  const renderedSize = useRef({ w: 0, h: 0 });
  const containerSize = useRef({ w: 0, h: 0 });

  const scale = useMotionValue(1);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastTapTime = useRef(0);
  const lastTapPos = useRef({ x: 0, y: 0 });
  const pinchRef = useRef<{ dist: number; zoom: number; mx: number; my: number } | null>(null);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const gallery = useMemo(
    () => imageUrls?.length ? imageUrls : imageUrl ? [imageUrl] : [],
    [imageUrls, imageUrl]
  );
  const currentImageUrl = gallery[currentIndex] ?? imageUrl;
  const currentCaption = captions?.[currentIndex] ?? caption;

  const showImage = useCallback((index: number) => {
    if (index < 0 || index >= gallery.length || index === currentIndex) return;
    setCurrentIndex(index);
    scale.set(1);
    x.set(0);
    y.set(0);
    setZoomPct(100);
    setCaptionExpanded(false);
    setStatus('loading');
    naturalSize.current = { w: 0, h: 0 };
  }, [currentIndex, gallery.length, scale, x, y]);

  const showPrevious = useCallback(() => showImage(currentIndex - 1), [currentIndex, showImage]);
  const showNext = useCallback(() => showImage(currentIndex + 1), [currentIndex, showImage]);

  // ── Reset on new image ──────────────────────────────────────────────────────
  useEffect(() => {
    const firstIndex = clamp(initialIndex, 0, Math.max(gallery.length - 1, 0));
    setCurrentIndex(firstIndex);
    scale.set(1);
    x.set(0);
    y.set(0);
    setZoomPct(100);
    setCaptionExpanded(false);
    const firstImageUrl = gallery[firstIndex] ?? imageUrl;
    setStatus(firstImageUrl ? 'loading' : 'error');
    naturalSize.current = { w: 0, h: 0 };
    if (firstImageUrl) {
      const img = new Image();
      img.src = firstImageUrl;
    }
  }, [imageUrl, initialIndex, gallery, scale, x, y]);

  // ── Lock body scroll ────────────────────────────────────────────────────────
  useEffect(() => {
    if (currentImageUrl) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [currentImageUrl]);

  // ── Measure sizes ───────────────────────────────────────────────────────────
  const measureSizes = useCallback(() => {
    if (containerRef.current) {
      const r = containerRef.current.getBoundingClientRect();
      containerSize.current = { w: r.width, h: r.height };
    }
    if (imgRef.current) {
      const r = imgRef.current.getBoundingClientRect();
      const z = scale.get();
      renderedSize.current = { w: r.width / z, h: r.height / z };
    }
  }, [scale]);

  // ── Pan constraints using actual rendered image size ────────────────────────
  const getConstraints = useCallback((zoom: number) => {
    const { w: iw, h: ih } = renderedSize.current;
    const { w: cw, h: ch } = containerSize.current;
    const maxX = Math.max((iw * zoom - cw) / 2, 0);
    const maxY = Math.max((ih * zoom - ch) / 2, 0);
    return { maxX, maxY };
  }, []);

  const clampPan = useCallback((zoom: number) => {
    const { maxX, maxY } = getConstraints(zoom);
    x.set(clamp(x.get(), -maxX, maxX));
    y.set(clamp(y.get(), -maxY, maxY));
  }, [getConstraints, x, y]);

  // ── Core zoom — zooms toward focal point ────────────────────────────────────
  const applyZoom = useCallback((nextZoom: number, focalX?: number, focalY?: number) => {
    nextZoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
    const prevZoom = scale.get();

    if (focalX !== undefined && focalY !== undefined && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const fx = focalX - rect.left - cx;
      const fy = focalY - rect.top - cy;
      x.set(x.get() + fx * (1 - nextZoom / prevZoom));
      y.set(y.get() + fy * (1 - nextZoom / prevZoom));
    }

    if (nextZoom <= MIN_ZOOM) {
      x.set(0);
      y.set(0);
    } else {
      clampPan(nextZoom);
    }

    scale.set(nextZoom);
    setZoomPct(Math.round(nextZoom * 100));
  }, [scale, x, y, clampPan]);

  // ── Keyboard ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowLeft') showPrevious();
      if (e.key === 'ArrowRight') showNext();
      if (e.key === '+' || e.key === '=') applyZoom(scale.get() * ZOOM_STEP);
      if (e.key === '-') applyZoom(scale.get() / ZOOM_STEP);
      if (e.key === '0') applyZoom(1);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose, applyZoom, scale, showPrevious, showNext]);

  // ── Scroll wheel zoom toward cursor ─────────────────────────────────────────
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    measureSizes();
    const delta = e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
    applyZoom(scale.get() * delta, e.clientX, e.clientY);
  }, [applyZoom, scale, measureSizes]);

  // ── Double-click ─────────────────────────────────────────────────────────────
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    measureSizes();
    if (scale.get() > 1) applyZoom(1);
    else applyZoom(DBL_TAP_ZOOM, e.clientX, e.clientY);
  }, [applyZoom, scale, measureSizes]);

  const isZoomed = zoomPct > 100;

  // ── Touch ─────────────────────────────────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      swipeStart.current = null;
      measureSizes();
      const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      pinchRef.current = { dist: getPinchDist(e.touches), zoom: scale.get(), mx, my };
      return;
    }
    if (e.touches.length === 1) {
      const now = Date.now();
      const t = e.touches[0];
      swipeStart.current = { x: t.clientX, y: t.clientY };
      if (
        now - lastTapTime.current < DBL_TAP_MS &&
        Math.abs(t.clientX - lastTapPos.current.x) < DBL_TAP_PX &&
        Math.abs(t.clientY - lastTapPos.current.y) < DBL_TAP_PX
      ) {
        measureSizes();
        if (scale.get() > 1) applyZoom(1);
        else applyZoom(DBL_TAP_ZOOM, t.clientX, t.clientY);
        lastTapTime.current = 0; // prevent re-trigger
      }
      lastTapTime.current = now;
      lastTapPos.current = { x: t.clientX, y: t.clientY };
    }
  }, [applyZoom, scale, measureSizes]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault();
      const dist = getPinchDist(e.touches);
      const nextZoom = clamp(pinchRef.current.zoom * (dist / pinchRef.current.dist), MIN_ZOOM, MAX_ZOOM);
      applyZoom(nextZoom, pinchRef.current.mx, pinchRef.current.my);
    }
  }, [applyZoom]);

  const handleTouchEnd = useCallback(() => { pinchRef.current = null; }, []);
  const handleSwipeEnd = useCallback((e: React.TouchEvent) => {
    const start = swipeStart.current;
    const end = e.changedTouches[0];
    swipeStart.current = null;
    if (!start || !end || isZoomed) return;
    const deltaX = end.clientX - start.x;
    const deltaY = end.clientY - start.y;
    if (Math.abs(deltaX) < 60 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return;
    if (deltaX < 0) showNext();
    else showPrevious();
  }, [isZoomed, showNext, showPrevious]);

  // ── Swipe down to close ───────────────────────────────────────────────────────
  const handleDragEnd = useCallback((_: unknown, info: PanInfo) => {
    if (scale.get() === 1 && info.offset.y > SWIPE_CLOSE_OFFSET && info.velocity.y > SWIPE_CLOSE_VEL) {
      onClose();
    } else {
      clampPan(scale.get());
    }
  }, [scale, onClose, clampPan]);

  const getDragConstraints = useCallback(() => {
    const { maxX, maxY } = getConstraints(scale.get());
    return { left: -maxX, right: maxX, top: -maxY, bottom: maxY };
  }, [getConstraints, scale]);
  
  return (
    <AnimatePresence>
      {currentImageUrl && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={() => { if (!isDragging.current) onClose(); }}
          onContextMenu={(e) => e.preventDefault()}
          onWheel={handleWheel}
          style={{ ...S.backdrop, touchAction: 'pan-y' }}
        >
          {status === 'loading' && (
            <div style={S.loaderWrap}><Spinner /></div>
          )}
          {status === 'error' && (
            <div style={{ color: 'rgba(255,100,100,0.8)', textAlign: 'center', pointerEvents: 'none' }}>
              <div style={{ fontSize: 32 }}>⚠️</div>
              <div style={{ fontSize: 14, marginTop: 8 }}>Failed to load image</div>
            </div>
          )}
          <div
            ref={containerRef}
            style={S.imageContainer}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            onTouchEndCapture={handleSwipeEnd}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.93 }}
              animate={{ opacity: status === 'loaded' ? 1 : 0, scale: status === 'loaded' ? 1 : 0.93 }}
              transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={handleDoubleClick}
              drag={isZoomed ? true : 'y'}
              dragConstraints={getDragConstraints()}
              dragElastic={isZoomed ? 0.04 : 0.28}
              dragMomentum={true}
              style={{
                x,
                y,
                scale,
                cursor: isZoomed ? 'grab' : 'default',
                transformOrigin: 'center center',
                willChange: 'transform',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              whileDrag={{ cursor: 'grabbing' }}
              onDragStart={() => { isDragging.current = true; }}
              onDragEnd={(e, info) => {
                handleDragEnd(e, info);
                setTimeout(() => { isDragging.current = false; }, 50);
              }}
            >
              <img
                ref={imgRef}
                src={currentImageUrl}
                alt={alt}
                style={S.img}
                draggable={false}
                onLoad={(e) => {
                  const img = e.currentTarget;
                  naturalSize.current = { w: img.naturalWidth, h: img.naturalHeight };
                  setStatus('loaded');
                  requestAnimationFrame(measureSizes);
                }}
                onError={() => setStatus('error')}
              />
            </motion.div>
            {gallery.length > 1 && (
              <>
                <div
                  className="absolute top-4 left-4 z-10 rounded-full bg-black/55 px-3 py-1.5 text-sm text-white/90"
                  onClick={(e) => e.stopPropagation()}
                >
                  {currentIndex + 1} / {gallery.length}
                </div>
                <div className="absolute left-3 top-1/2 z-10 hidden -translate-y-1/2 md:block" onClick={(e) => e.stopPropagation()}>
                  <ControlBtn onClick={showPrevious} title="Previous image (←)" disabled={currentIndex === 0}>
                    <ChevronLeft size={22} />
                  </ControlBtn>
                </div>
                <div className="absolute right-3 top-1/2 z-10 hidden -translate-y-1/2 md:block" onClick={(e) => e.stopPropagation()}>
                  <ControlBtn onClick={showNext} title="Next image (→)" disabled={currentIndex === gallery.length - 1}>
                    <ChevronRight size={22} />
                  </ControlBtn>
                </div>
              </>
            )}
          </div>
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.2 }}
            style={S.controls}
            onClick={(e) => e.stopPropagation()}
          >
            <ControlBtn onClick={() => applyZoom(scale.get() * ZOOM_STEP)} title="Zoom in (=)" disabled={zoomPct >= MAX_ZOOM * 100}>
              <ZoomIn size={18} />
            </ControlBtn>
            <button style={S.zoomBadge(isZoomed)} title="Reset zoom (0)" onClick={() => applyZoom(1)}>
              {zoomPct}%
            </button>
            <ControlBtn onClick={() => applyZoom(scale.get() / ZOOM_STEP)} title="Zoom out (-)" disabled={!isZoomed}>
              <ZoomOut size={18} />
            </ControlBtn>
            <ControlBtn onClick={() => applyZoom(1)} title="Reset (0)" disabled={!isZoomed}>
              <RotateCcw size={16} />
            </ControlBtn>
            <ControlBtn onClick={onClose} title="Close (Esc)" variant="close">
              <X size={20} />
            </ControlBtn>
          </motion.div>
          {status === 'loaded' && naturalSize.current.w > 0 && (
            <div style={S.meta}>
              {naturalSize.current.w} × {naturalSize.current.h}
            </div>
          )}
          {!currentCaption && !isZoomed && status === 'loaded' && (
            <p style={S.hint} className="md:hidden">
              Double-tap to zoom · Swipe down to close
            </p>
          )}
          {currentCaption && (
            <div
              style={S.caption}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ maxWidth: 720, margin: '0 auto' }}>
                <button
                  type="button"
                  onClick={() => setCaptionExpanded((expanded) => !expanded)}
                  className="block w-full text-left"
                  aria-expanded={captionExpanded}
                  aria-label={captionExpanded ? 'Collapse image caption' : 'Expand image caption'}
                >
                  <span className={captionExpanded ? 'whitespace-pre-line break-words text-sm sm:text-base' : 'line-clamp-2 whitespace-pre-line break-words text-sm sm:text-base'}>
                    {currentCaption}
                  </span>
                  {(currentCaption.length > 100 || currentCaption.includes('\n')) && (
                    <span className="mt-1 block text-sm font-semibold text-white/80">
                      {captionExpanded ? 'See less' : 'See more'}
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};


const ControlBtn: React.FC<{
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
  variant?: 'default' | 'close';
}> = ({ onClick, title, children, disabled = false, variant = 'default' }) => {
  const isClose = variant === 'close';
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        background: isClose ? 'rgba(160,30,30,0.5)' : 'rgba(0,0,0,0.55)',
        border: `1px solid ${isClose ? 'rgba(255,80,80,0.2)' : 'rgba(255,255,255,0.12)'}`,
        borderRadius: '50%',
        width: 36,
        height: 36,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: disabled ? 'rgba(255,255,255,0.2)' : '#fff',
        cursor: disabled ? 'not-allowed' : 'pointer',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        transition: 'background 0.15s',
        opacity: disabled ? 0.45 : 1,
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        if (!disabled)
          (e.currentTarget as HTMLButtonElement).style.background =
            isClose ? 'rgba(200,40,40,0.7)' : 'rgba(255,255,255,0.15)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background =
          isClose ? 'rgba(160,30,30,0.5)' : 'rgba(0,0,0,0.55)';
      }}
    >
      {children}
    </button>
  );
};

const Spinner: React.FC = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" style={{ animation: 'spin 0.8s linear infinite' }}>
    <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    <circle cx="16" cy="16" r="12" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2.5" />
    <path d="M16 4 A12 12 0 0 1 28 16" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);
