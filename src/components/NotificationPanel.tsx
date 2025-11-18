
"use client";

import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { auth, app } from '@/utils/firebaseClient';
import Link from 'next/link';

const db = getFirestore(app);

// This new sub-component handles fetching and rendering for each notification
function NotificationItem({ notification }: { notification: any }) {
  const [fromUser, setFromUser] = useState<any>(null);

  useEffect(() => {
    // Fetch the user data for the user who triggered the notification
    const fetchUserData = async () => {
      if (notification.fromUserId) {
        const userRef = doc(db, "users", notification.fromUserId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setFromUser(userSnap.data());
        }
      }
    };

    fetchUserData();
  }, [notification.fromUserId]);

  const getNotificationDetails = (notif: any) => {
    // Use the fresh username, fall back to the one stored in the notification
    const username = fromUser?.username || notif.fromUsername;
    let message: React.ReactNode;
    let linkPath = '/'; // Default link

    switch (notif.type) {
      case 'like':
        message = <><span className="font-bold">{username}</span> liked your post.</>;
        if(notif.postId) linkPath = `/post/${notif.postId}`;
        break;
      case 'comment':
        message = <><span className="font-bold">{username}</span> commented: "{notif.postContent}"</>;
        if(notif.postId) linkPath = `/post/${notif.postId}`;
        break;
      case 'follow':
        message = <><span className="font-bold">{username}</span> started following you.</>;
        if(notif.fromUserId) linkPath = `/squad/${notif.fromUserId}`;
        break;
      case 'missed_call':
        message = <><span className="font-bold">{username}</span> tried to call you.</>;
        if(notif.fromUserId) linkPath = `/squad/${notif.fromUserId}`;
        break;
      default:
        message = 'New notification';
        break;
    }
    return { message, linkPath };
  };

  const { message, linkPath } = getNotificationDetails(notification);
  // Always use the fresh avatar URL from the fetched user profile
  const avatarUrl = fromUser?.avatar_url;
  const initials = fromUser?.name?.charAt(0) || fromUser?.username?.charAt(0) || '?';

  return (
    <Link href={linkPath} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent-pink to-accent-green overflow-hidden flex-shrink-0 flex items-center justify-center">
        {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
        ) : (
            <span className="font-bold text-white">{initials.toUpperCase()}</span>
        )}
        </div>
        <div className="flex-1 text-sm">
        {message}
        <div className="text-xs text-muted-foreground mt-1">{notification.createdAt?.toDate().toLocaleString()}</div>
        </div>
    </Link>
  );
}

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
            <NotificationItem key={notif.id} notification={notif} />
          ))
        )}
      </div>
    </div>
  );
}
