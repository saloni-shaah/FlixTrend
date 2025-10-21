"use client";

import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { auth, app } from '@/utils/firebaseClient';

const db = getFirestore(app);

export default function NotificationPanel({ onClose }: { onClose: () => void }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "users", currentUser.uid, "notifications"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [currentUser]);

  const getNotificationMessage = (notif: any) => {
    switch (notif.type) {
      case 'like':
        return <><span className="font-bold">{notif.fromUsername}</span> liked your post.</>;
      case 'comment':
        return <><span className="font-bold">{notif.fromUsername}</span> commented: "{notif.postContent}"</>;
      case 'follow':
        return <><span className="font-bold">{notif.fromUsername}</span> started following you.</>;
      case 'missed_call':
        return <><span className="font-bold">{notif.fromUsername}</span> tried to call you.</>;
      default:
        return 'New notification';
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm glass-card animate-slide-in-right">
      <div className="flex items-center justify-between p-4 border-b border-glass-border">
        <h3 className="text-xl font-headline font-bold text-brand-gold">Notifications</h3>
        <button onClick={onClose} className="text-accent-pink text-2xl">&times;</button>
      </div>
      <div className="flex flex-col gap-2 p-4 overflow-y-auto h-full pb-20">
        {notifications.length === 0 ? (
          <div className="text-muted-foreground text-center mt-16">No new notifications.</div>
        ) : (
          notifications.map(notif => (
            <div key={notif.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent-pink to-accent-green overflow-hidden">
                {notif.fromAvatarUrl && <img src={notif.fromAvatarUrl} alt="avatar" className="w-full h-full object-cover"/>}
              </div>
              <div className="flex-1 text-sm">
                {getNotificationMessage(notif)}
                <div className="text-xs text-muted-foreground mt-1">{notif.createdAt?.toDate().toLocaleString()}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
