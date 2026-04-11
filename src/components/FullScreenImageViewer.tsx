import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, PanInfo, useMotionValue } from 'framer-motion';
import { X, ZoomIn, ZoomOut } from 'lucide-react';

interface FullScreenImageViewerProps {
  imageUrl: string | null;
  onClose: () => void;
}

export const FullScreenImageViewer: React.FC<FullScreenImageViewerProps> = ({
  imageUrl,
  onClose,
}) => {
  const [zoom, setZoom] = useState(1);
  const isDragging = useRef(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  useEffect(() => {
    setZoom(1);
    x.set(0);
    y.set(0);
  }, [imageUrl, x, y]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const zoomIn = () => setZoom((z) => Math.min(z * 1.4, 5));
  const zoomOut = () => {
    setZoom((z) => {
      const next = Math.max(z / 1.4, 1);
      if (next <= 1) {
        x.set(0);
        y.set(0);
        return 1;
      }
      return next;
    });
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (zoom === 1 && info.offset.y > 100 && info.velocity.y > 150) {
      onClose();
    }
  };

  const getDragConstraints = () => {
    if (zoom <= 1 || !imgRef.current) {
      return { top: 0, bottom: 0, left: 0, right: 0 };
    }
    const { width, height } = imgRef.current.getBoundingClientRect();
    const overflowX = Math.max((width * zoom - width) / 2, 0);
    const overflowY = Math.max((height * zoom - height) / 2, 0);
    return {
      left: -overflowX,
      right: overflowX,
      top: -overflowY,
      bottom: overflowY,
    };
  };

  const handleBackdropClick = () => {
    if (!isDragging.current) onClose();
  };

  if (!imageUrl) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={handleBackdropClick}
        onContextMenu={(e) => e.preventDefault()} // Prevent right-click context menu
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 200,
          background: 'rgba(0,0,0,0.92)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          touchAction: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Image wrapper */}
        <motion.div
          onClick={(e) => e.stopPropagation()}
          drag={zoom > 1 ? true : 'y'}
          dragConstraints={getDragConstraints()}
          dragElastic={zoom > 1 ? 0.05 : 0.3}
          dragMomentum={false}
          style={{
            x,
            y,
            scale: zoom,
            cursor: zoom > 1 ? 'grab' : 'default',
            maxWidth: '100vw',
            maxHeight: '100dvh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          whileDrag={{ cursor: 'grabbing' }}
          onDragStart={() => {
            isDragging.current = true;
          }}
          onDragEnd={(e, info) => {
            handleDragEnd(e, info);
            setTimeout(() => {
              isDragging.current = false;
            }, 50);
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <img
            ref={imgRef}
            src={imageUrl}
            alt="Full screen view"
            draggable={false}
            style={{
              display: 'block',
              maxWidth: '100vw',
              maxHeight: '100dvh',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              pointerEvents: 'none', // Prevent direct interaction with the img element
            }}
          />
        </motion.div>

        {/* Controls */}
        <div
          className="absolute top-4 right-4 flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <ControlBtn onClick={zoomIn} title="Zoom in">
            <ZoomIn size={20} />
          </ControlBtn>
          <ControlBtn onClick={zoomOut} title="Zoom out">
            <ZoomOut size={20} />
          </ControlBtn>
          <ControlBtn onClick={onClose} title="Close">
            <X size={22} />
          </ControlBtn>
        </div>

        {zoom === 1 && (
          <p
            className="absolute bottom-6 left-0 right-0 text-center text-xs pointer-events-none select-none md:hidden"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            Swipe down to close
          </p>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

const ControlBtn: React.FC<{
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ onClick, title, children }) => (
  <button
    title={title}
    onClick={onClick}
    style={{
      background: 'rgba(0,0,0,0.55)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: '50%',
      width: 40,
      height: 40,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      cursor: 'pointer',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      transition: 'background 0.15s',
    }}
    onMouseEnter={(e) =>
      ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.8)')
    }
    onMouseLeave={(e) =>
      ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.55)')
    }
  >
    {children}
  </button>
);