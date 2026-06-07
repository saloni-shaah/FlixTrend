'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, Video, Phone } from 'lucide-react';
import { FullScreenImageViewer } from '@/components/FullScreenImageViewer';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const fmtLastSeen = (ts: any) => {
  if (!ts) return null;
  const diff = (Date.now() - ts.toDate().getTime()) / 1000;
  if (diff < 60)     return 'just now';
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return ts.toDate().toLocaleDateString();
};

export function ChatHeader({
  selectedChat,
  onOpenDetails,
  onBack,
}: {
  selectedChat: any;
  onOpenDetails?: () => void;
  onBack?: () => void;
}) {
  const router = useRouter();
  const [imgUrl,       setImgUrl]       = useState<string | null>(null);
  const [showAppPrompt, setShowAppPrompt] = useState(false);

  const initial = (selectedChat?.name?.[0] || selectedChat?.username?.[0] || '?').toUpperCase();

  if (!selectedChat) {
    return (
      <header className="fixed top-0 left-0 right-0 z-10 flex items-center gap-3 px-4 h-16 bg-black/40 backdrop-blur-2xl border-b borfer-white/[0.06]">
        <Users className="text-gray-500" size={20} />
        <h3 className="font-semibold text-gray-400">Select a conversation</h3>
      </header>
    );
  }

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-10 flex items-center gap-3 px-4 h-16 bg-black/40 backdrop-blur-2xl border-b borfer-white/[0.06] ${onOpenDetails ? 'cursor-pointer' : ''}`}
        onClick={() => {
          onOpenDetails?.();
        }}
      >

        {/* Back */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBack?.();
            router.push('/signal');
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="p-2 rounded-full hover:bg-white/[0.08] transition-colors flex-shrink-0"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Avatar */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (selectedChat.avatar_url) setImgUrl(selectedChat.avatar_url);
          }}
          className={`relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-tr from-accent-pink to-accent-cyan flex items-center justify-center font-bold text-white ${selectedChat.avatar_url ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
        >
          {selectedChat.avatar_url
            ? <img src={selectedChat.avatar_url} className="w-full h-full object-cover" alt="" />
            : selectedChat.isGroup
              ? <Users size={18} />
              : <span className="text-sm">{initial}</span>
          }
          {!selectedChat.isGroup && selectedChat.status === 'online' && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-background" />
          )}
        </div>

        {/* Name + status */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white truncate text-[15px]">
            {selectedChat.name || selectedChat.username}
          </h3>
          {!selectedChat.isGroup && (
            <p className="text-[12px] leading-tight mt-0.5">
              {selectedChat.status === 'online'
                ? <span className="text-green-400">online</span>
                : <span className="text-gray-500">{fmtLastSeen(selectedChat.lastSeen) ?? 'offline'}</span>
              }
            </p>
          )}
          {selectedChat.isGroup && (
            <p className="text-[12px] text-gray-500 leading-tight mt-0.5">
              {selectedChat.members?.length ?? 0} members
            </p>
          )}
        </div>

        {/* Call buttons (1:1 only) */}
        {!selectedChat.isGroup && (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setShowAppPrompt(true); }}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-2 rounded-full hover:bg-white/[0.08] transition-colors text-gray-500"
            >
              <Phone size={18} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setShowAppPrompt(true); }}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-2 rounded-full hover:bg-white/[0.08] transition-colors text-gray-500"
            >
              <Video size={18} />
            </button>
          </div>
        )}
      </header>

      <FullScreenImageViewer imageUrl={imgUrl} onClose={() => setImgUrl(null)} />

      <AlertDialog open={showAppPrompt} onOpenChange={setShowAppPrompt}>
        <AlertDialogContent className="bg-black/80 backdrop-blur-2xl border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Calling is smoother on the app 🚀</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Download the FlixTrend app for the best call quality and real-time sync.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10">Not Now</AlertDialogCancel>
            <AlertDialogAction onClick={() => setShowAppPrompt(false)}>Got it</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
