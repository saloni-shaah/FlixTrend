'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, UserCircle, Video, Phone } from 'lucide-react';

interface ChatHeaderProps {
    selectedChat: any;
}

export function ChatHeader({ selectedChat }: ChatHeaderProps) {
    const router = useRouter();

    if (!selectedChat) return null; // Or a loading state

    return (
        <header className="flex items-center gap-3 p-3 border-b border-accent-cyan/10 bg-black/60 shadow-md shrink-0">
            <button onClick={() => router.push('/signal')} className="p-2 rounded-full hover:bg-accent-cyan/10"><ArrowLeft size={20}/></button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent-pink to-accent-cyan flex items-center justify-center text-white font-bold text-lg overflow-hidden shrink-0">
            {selectedChat.isGroup ? 
                    (selectedChat.avatar_url ? <img src={selectedChat.avatar_url} alt={selectedChat.name} className="w-full h-full object-cover"/> : <Users/>) :
                    (selectedChat.avatar_url ? <img src={selectedChat.avatar_url} alt="avatar" className="w-full h-full object-cover"/> : <UserCircle/>)
            }
            </div>
            <div className="flex-1 text-left">
                <h3 className="font-bold text-white">{selectedChat.name || selectedChat.username}</h3>
            </div>
            <div className="flex items-center gap-2">
            {!selectedChat.isGroup && <button className="p-2 rounded-full hover:bg-accent-cyan/10"><Video size={20}/></button>}
            {!selectedChat.isGroup && <button className="p-2 rounded-full hover:bg-accent-cyan/10"><Phone size={20}/></button>}
            </div>
        </header>
    );
}
