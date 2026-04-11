'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { MediaViewer } from '@/components/drop/MediaViewer';

interface ViewerState {
  posts: any[];
  currentPostIndex: number;
  currentMediaIndex: number;
  isOpen: boolean;
}

interface MediaViewerContextType {
  openViewer: (posts: any[], postIndex: number, mediaIndex?: number) => void;
  closeViewer: () => void;
  next: () => void;
  prev: () => void;
}

const MediaViewerContext = createContext<MediaViewerContextType | undefined>(undefined);

export const useMediaViewer = () => {
  const context = useContext(MediaViewerContext);
  if (!context) {
    throw new Error('useMediaViewer must be used within a MediaViewerProvider');
  }
  return context;
};

export const MediaViewerProvider = ({ children }: { children: ReactNode }) => {
  const [viewerState, setViewerState] = useState<ViewerState>({
    posts: [],
    currentPostIndex: 0,
    currentMediaIndex: 0,
    isOpen: false,
  });

  const openViewer = useCallback((posts: any[], postIndex: number, mediaIndex: number = 0) => {
    document.body.style.overflow = 'hidden';
    setViewerState({ posts, currentPostIndex: postIndex, currentMediaIndex: mediaIndex, isOpen: true });
  }, []);

  const closeViewer = useCallback(() => {
    document.body.style.overflow = 'auto';
    setViewerState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const next = useCallback(() => {
    setViewerState(prev => {
      const currentPost = prev.posts[prev.currentPostIndex];
      const media = Array.isArray(currentPost.mediaUrl) ? currentPost.mediaUrl : [currentPost.mediaUrl];
      
      if (prev.currentMediaIndex < media.length - 1) {
        return { ...prev, currentMediaIndex: prev.currentMediaIndex + 1 };
      } else if (prev.currentPostIndex < prev.posts.length - 1) {
        return { ...prev, currentPostIndex: prev.currentPostIndex + 1, currentMediaIndex: 0 };
      }

      return prev; // Stay on the last media item of the last post
    });
  }, []);

  const prev = useCallback(() => {
    setViewerState(prev => {
      if (prev.currentMediaIndex > 0) {
        return { ...prev, currentMediaIndex: prev.currentMediaIndex - 1 };
      }
      
      if (prev.currentPostIndex > 0) {
        const prevPostIndex = prev.currentPostIndex - 1;
        const prevPost = prev.posts[prevPostIndex];
        const prevMedia = Array.isArray(prevPost.mediaUrl) ? prevPost.mediaUrl : [prevPost.mediaUrl];
        return { ...prev, currentPostIndex: prevPostIndex, currentMediaIndex: prevMedia.length - 1 };
      }

      return prev; // Stay on the first media item of the first post
    });
  }, []);

  const { isOpen, posts, currentPostIndex, currentMediaIndex } = viewerState;
  const currentPost = isOpen ? posts[currentPostIndex] : null;

  return (
    <MediaViewerContext.Provider value={{ openViewer, closeViewer, next, prev }}>
      {children}
      {isOpen && currentPost && (
        <MediaViewer
          post={currentPost}
          media={(Array.isArray(currentPost.mediaUrl) ? currentPost.mediaUrl : [currentPost.mediaUrl])}
          currentMediaIndex={currentMediaIndex}
          onClose={closeViewer}
          onNext={next}
          onPrev={prev}
        />
      )}
    </MediaViewerContext.Provider>
  );
};
