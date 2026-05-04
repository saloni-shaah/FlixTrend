'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, UserCircle, Video, Phone, MessageSquarePlus } from 'lucide-react';
import { FullScreenImageViewer } from '@/components/FullScreenImageViewer';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface ChatUser {
  id: string;
  name?: string;
  username?: string;
  avatar_url?: string;
  isGroup?: boolean;
  status?: 'online' | 'offline';
  lastSeen?: any;
}

interface ChatHeaderProps {
    selectedChat: ChatUser;
}

const formatLastSeen = (timestamp: any) => {
    if (!timestamp) return null;
    const date = timestamp.toDate();
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 2) return "just now";
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
};

export function ChatHeader({ selectedChat }: ChatHeaderProps) {
    const router = useRouter();
    const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
    const [showDownloadPrompt, setShowDownloadPrompt] = useState(false);

    if (!selectedChat) {
        return (
            <header className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between p-3 bg-black/70 backdrop-blur-md border-b border-white/10">
                <div className="flex items-center gap-3">
                    <Users className="text-white" />
                    <h3 className="font-bold text-white">Welcome to Signal</h3>
                </div>
                <button onClick={() => router.push('/signal/new')} className="p-2 rounded-full bg-accent-cyan text-black">
                    <MessageSquarePlus size={20} />
                </button>
            </header>
        );
    }

    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-10 flex items-center gap-3 p-3 bg-black/70 backdrop-blur-md border-b border-white/10">
                <button onClick={() => router.push('/signal')} className="p-2 rounded-full hover:bg-accent-cyan/10"><ArrowLeft size={20}/></button>
                
                <div 
                  onClick={() => setFullScreenImage(selectedChat.avatar_url)} 
                  className="cursor-pointer w-10 h-10 rounded-full bg-gradient-to-tr from-accent-pink to-accent-cyan flex items-center justify-center text-white font-bold text-lg overflow-hidden shrink-0 
                             hover:scale-105 active:scale-95 transition-transform duration-200"
                >
                {selectedChat.isGroup ? 
                        (selectedChat.avatar_url ? <img src={selectedChat.avatar_url} alt={selectedChat.name} className="w-full h-full object-cover"/> : <Users/>) :
                        (selectedChat.avatar_url ? <img src={selectedChat.avatar_url} alt="avatar" className="w-full h-full object-cover"/> : <UserCircle/>)
                }
                </div>
                <div className="flex-1 text-left">
                    <h3 className="font-bold text-white">{selectedChat.name || selectedChat.username}</h3>
                    {!selectedChat.isGroup && (
                        <div className="text-sm">
                            {selectedChat.status === 'online' ? 
                              <span className="text-green-400 flex items-center gap-1.5"><span className="w-2 h-2 bg-green-400 rounded-full"></span>online</span> : 
                              <span className="text-gray-400">{formatLastSeen(selectedChat.lastSeen)}</span>
                            }
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                  {!selectedChat.isGroup && <button 
                      onClick={() => setShowDownloadPrompt(true)} 
                      className="p-2 rounded-full hover:bg-accent-cyan/10 opacity-80 hover:opacity-100 transition"
                      title="Available on app"
                    ><Video size={20}/></button>}
                  {!selectedChat.isGroup && <button 
                      onClick={() => setShowDownloadPrompt(true)} 
                      className="p-2 rounded-full hover:bg-accent-cyan/10 opacity-80 hover:opacity-100 transition"
                      title="Available on app"
                    ><Phone size={20}/></button>}
                </div>
            </header>
            <FullScreenImageViewer imageUrl={fullScreenImage} onClose={() => setFullScreenImage(null)} />
            <AlertDialog open={showDownloadPrompt} onOpenChange={setShowDownloadPrompt}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Calling is smoother on the FlixTrend app 🚀</AlertDialogTitle>
                        <AlertDialogDescription>
                            Get faster connections, better quality, and real-time sync. Download the app to get the best experience.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Not Now</AlertDialogCancel>
                        <AlertDialogAction onClick={() => setShowDownloadPrompt(false)}>Got it!</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
