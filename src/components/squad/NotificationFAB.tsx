'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, UserPlus, MessageSquare, Award, MessageCircle, Star, X } from 'lucide-react';
import { getFirestore, collection, query, onSnapshot, orderBy, limit, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { app } from '@/utils/firebaseClient';
import { useRouter } from 'next/navigation';

const db = getFirestore(app);

interface NotificationData {
    type: string;
    targetId: string;
}

interface Notification {
  id: string;
  title: string;
  body: string;
  createdAt: any;
  isRead: boolean;
  data: NotificationData;
}

const getNotificationInfo = (notif: Notification) => {
    const { data } = notif;
    switch (data.type) {
        case 'profile':
            return { icon: UserPlus, link: `/squad/${data.targetId}` };
        case 'message':
            return { icon: MessageSquare, link: `/signal/${data.targetId}` };
        case 'drop':
            return { icon: Award, link: `/drop/prompt/${data.targetId}` };
        case 'comment':
            return { icon: MessageCircle, link: `/post/${data.targetId}` };
        case 'accolade':
            return { icon: Star, link: '' };
        default:
            return { icon: Bell, link: '' };
    }
};

const NotificationItem = ({ notif, userId, closeModal }: { notif: Notification; userId: string; closeModal: () => void; }) => {
    const router = useRouter();
    const { icon: Icon, link } = getNotificationInfo(notif);

    const handleItemClick = async () => {
        if (!notif.isRead) {
            const notifRef = doc(db, 'users', userId, 'notifications', notif.id);
            await updateDoc(notifRef, { isRead: true });
        }
        if (link) {
            router.push(link);
            closeModal();
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            onClick={handleItemClick}
            className={`p-3 rounded-lg cursor-pointer transition-colors ${notif.isRead ? 'bg-white/5 hover:bg-white/10' : 'bg-accent-cyan/20 hover:bg-accent-cyan/30'}`}>
            <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-accent-cyan/20 flex-shrink-0 mt-1">
                    <Icon className="text-accent-cyan" size={18} />
                </div>
                <div>
                    <p className="font-bold text-white">{notif.title}</p>
                    <p className="text-sm text-gray-300">{notif.body}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {notif.createdAt?.seconds ? new Date(notif.createdAt.seconds * 1000).toLocaleString() : 'Just now'}
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export function NotificationFAB({ user }: { user: any }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (isModalOpen) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'auto';
    }
    return () => {
        document.body.style.overflow = 'auto';
    };
  }, [isModalOpen]);

  useEffect(() => {
    if (!user?.uid) return;

    const notifsRef = collection(db, 'users', user.uid, 'notifications');
    const q = query(notifsRef, orderBy('createdAt', 'desc'), limit(50));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const markAllAsRead = async () => {
    if (!user?.uid) return;
    const batch = writeBatch(db);
    const notifsRef = collection(db, 'users', user.uid, 'notifications');
    notifications.forEach(notif => {
        if (!notif.isRead) {
            batch.update(doc(notifsRef, notif.id), { isRead: true });
        }
    });
    await batch.commit();
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (!user) return null;

  return (
    <>
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.6 }}
        whileHover={{ scale: 1.1, rotate: [0, 10, -10, 10, -10, 0] }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsModalOpen(true)}
        className="fixed top-4 left-4 z-[999] btn-glass-icon bg-accent-cyan/50 text-white"
        aria-label="Notifications"
      >
        <Bell />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-md"
          >
            {unreadCount}
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {isModalOpen && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[1000] flex items-center justify-center p-4"
                onClick={() => setIsModalOpen(false)}
            >
              <motion.div 
                  initial={{y: -30, opacity: 0, scale: 0.95}} 
                  animate={{y: 0, opacity: 1, scale: 1}}
                  exit={{y: 30, opacity: 0, scale: 0.95}}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="bg-background-dark p-6 rounded-2xl shadow-2xl w-full max-w-md border border-white/10 relative"
                  onClick={e => e.stopPropagation()}
              >
                  <div className="flex justify-between items-center mb-5 pb-4 border-b border-white/10">
                      <h2 className="text-xl font-bold">Notifications</h2>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && 
                            <button onClick={markAllAsRead} className="text-xs text-accent-cyan hover:underline">Mark all as read</button>
                        }
                        <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                      </div>
                  </div>
                  <div className="flex flex-col gap-2 max-h-[70vh] overflow-y-auto pr-2 -mr-2">
                      {notifications.length > 0 ? (
                           <AnimatePresence>
                            {notifications.map(notif => (
                               <NotificationItem key={notif.id} notif={notif} userId={user.uid} closeModal={() => setIsModalOpen(false)} />
                            ))}
                           </AnimatePresence>
                      ) : (
                          <div className="text-center text-muted-foreground py-16">
                              <Bell size={40} className="mx-auto mb-4 text-gray-500"/>
                              <p className="font-semibold">No notifications yet.</p>
                              <p className="text-xs mt-1">When you have updates, they'll appear here.</p>
                          </div>
                      )}
                  </div>
              </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
