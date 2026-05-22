'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { getFirestore, collection, query, where, orderBy, limit, getDocs, doc, updateDoc } from 'firebase/firestore';
import { auth, app } from '@/utils/firebaseClient';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Sparkles, Clock, CircleDollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { DropCard } from '@/components/drop/DropCard';
import { DropPollCard } from '@/components/drop/DropPollCard';
import { VibeSpaceLoader } from '@/components/VibeSpaceLoader';
import { subscribeToPush } from '@/utils/pushNotifications';

const db = getFirestore(app);

function CountdownTimer({ expiryDate }: { expiryDate: Date }) {
  const [timeLeft, setTimeLeft] = useState(expiryDate.getTime() - Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = expiryDate.getTime() - Date.now();
      if (newTimeLeft <= 0) {
        clearInterval(timer);
      }
      setTimeLeft(newTimeLeft);
    }, 1000);

    return () => clearInterval(timer);
  }, [expiryDate]);

  if (timeLeft <= 0) {
    return <span className="font-mono text-red-500">Prompt Expired</span>;
  }

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return (
    <div className="flex items-center gap-2 text-sm text-gray-400">
      <Clock size={16} />
      <span className="font-mono">{`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`}</span>
    </div>
  );
}

function DropPageContent() {
  const [prompt, setPrompt] = useState<{ id: string; text: string; expiresAt: Date } | null>(null);
  const [drops, setDrops] = useState<any[]>([]);
  const [poll, setPoll] = useState<any | null>(null);
  const [userHasPosted, setUserHasPosted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notificationStatus, setNotificationStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [notificationMessage, setNotificationMessage] = useState<string>('');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [browserPushSupported, setBrowserPushSupported] = useState(false);
  
  const [user, authLoading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBrowserPushSupported('serviceWorker' in navigator && 'Notification' in window);
      setNotificationPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
        router.replace('/login');
        return;
    }

    const fetchPromptAndDrops = async () => {
        setLoading(true);
        const now = new Date();
        const q = query(
            collection(db, "dropPrompts"),
            where("expiresAt", ">", now),
            orderBy("expiresAt", "desc"),
            limit(1)
        );
        const promptSnapshot = await getDocs(q);

        if (!promptSnapshot.empty) {
            const promptDoc = promptSnapshot.docs[0];
            const data = promptDoc.data();
            const currentPrompt = { 
                id: promptDoc.id, 
                text: data.text, 
                expiresAt: data.expiresAt.toDate() 
            };
            setPrompt(currentPrompt);

            // Check for a poll for this prompt
            const pollQuery = query(collection(db, 'drop_polls'), where('promptId', '==', currentPrompt.id), limit(1));
            const pollSnap = await getDocs(pollQuery);
            if (!pollSnap.empty) {
                setPoll({ id: pollSnap.docs[0].id, ...pollSnap.docs[0].data() });
            } else {
                setPoll(null);
            }

            // Check if user has posted
            const dropQuery = query(
                collection(db, 'drops'), 
                where('userId', '==', user.uid),
                where('promptId', '==', currentPrompt.id)
            );
            const dropSnap = await getDocs(dropQuery);
            setUserHasPosted(!dropSnap.empty);
            
            // Fetch all drops
            const allDropsQuery = query(
                collection(db, 'drops'), 
                where('promptId', '==', currentPrompt.id),
                orderBy('createdAt', 'desc')
            );
            const allDropsSnap = await getDocs(allDropsQuery);
            setDrops(allDropsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            
        } else {
            setPrompt(null);
        }
        setLoading(false);
    };

    fetchPromptAndDrops();

  }, [user, authLoading, router]);

  const handleEnableNotifications = async () => {
    if (!user) return;
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotificationStatus('error');
      setNotificationMessage('Browser notifications are not supported.');
      return;
    }

    setNotificationStatus('pending');
    setNotificationMessage('Requesting permission...');

    const token = await subscribeToPush(user.uid);
    const newPermission = Notification.permission;
    setNotificationPermission(newPermission);

    if (token) {
      setNotificationStatus('success');
      setNotificationMessage('Notifications enabled! You will now receive drop alerts.');
      return;
    }

    if (newPermission === 'denied') {
      await updateDoc(doc(db, 'users', user.uid), { 'settings.pushNotifications': false }).catch(() => null);
      setNotificationStatus('error');
      setNotificationMessage('Notification permission was denied. Enable it in browser settings to receive alerts.');
      return;
    }

    setNotificationStatus('error');
    setNotificationMessage('Could not enable notifications. Please try again later.');
  };

  const handleCreateDrop = () => {
    if (prompt) {
      router.push(`/drop/create?promptId=${prompt.id}`);
    }
  };

  if (loading || authLoading) {
    return <VibeSpaceLoader />;
  }

  if (!prompt) {
     return (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]"
        >
            <div className="text-center glass-card p-8">
              <h1 className="text-2xl font-bold mb-4">No active drop right now.</h1>
              <p className="text-gray-400 mb-6">Check back later for the next daily prompt!</p>
            </div>
        </motion.div>
      );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
        <div className="w-full glass-card p-6 mb-8 flex flex-col items-center text-center">
            <div className="flex items-center gap-3 text-lg font-bold text-gray-400 mb-3">
                <Sparkles className="h-6 w-6" />
                <h1 className="font-headline">Daily Drop</h1>
            </div>
            <p className="text-gray-500 text-xl">{prompt.text}</p>
            <CountdownTimer expiryDate={prompt.expiresAt} />
        </div>

        {browserPushSupported && notificationPermission !== 'granted' && (
          <div className="mb-6 rounded-3xl border border-accent-cyan/20 bg-white/10 p-4 text-left text-sm text-white">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold text-accent-cyan">Get instant drop alerts</p>
                <p className="text-gray-300">
                  {notificationPermission === 'denied'
                    ? 'Your browser has blocked notifications. Enable them in browser settings to receive drop alerts.'
                    : 'Enable push notifications to get notified when new drops and polls are live.'}
                </p>
              </div>
              {notificationPermission === 'default' ? (
                <button
                  onClick={handleEnableNotifications}
                  disabled={notificationStatus === 'pending'}
                  className="btn-glass bg-accent-cyan text-black px-5 py-2 font-semibold rounded-full hover:bg-accent-cyan/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {notificationStatus === 'pending' ? 'Waiting…' : 'Enable Notifications'}
                </button>
              ) : (
                <span className="text-yellow-300">Notifications blocked</span>
              )}
            </div>
            {notificationMessage && (
              <p className={`mt-3 text-sm ${notificationStatus === 'error' ? 'text-yellow-400' : 'text-green-300'}`}>
                {notificationMessage}
              </p>
            )}
          </div>
        )}

        {userHasPosted ? (
            <>
                {poll && (
                    <div className="mb-6">
                        <DropPollCard poll={poll} />
                    </div>
                )}
                <div className="flex flex-col gap-6">
                    {!poll && (
                        <div className="mb-6 text-center">
                             <button
                                onClick={() => router.push(`/drop/create?promptId=${prompt.id}&type=poll`)}
                                className="btn-glass bg-accent-green/90 font-bold py-3 px-8 rounded-full transition-transform hover:scale-105 text-lg flex items-center gap-2 mx-auto"
                             >
                                <CircleDollarSign size={20}/> Conduct Tomorrow's Poll
                             </button>
                        </div>
                    )}
                    {drops.length > 0 ? (
                        drops.map(drop => <DropCard key={drop.id} post={drop} />)
                    ) : (
                         <div className="text-center text-gray-400 p-8 glass-card">
                            <p>No drops have been submitted yet.</p>
                        </div>
                    )}
                </div>
            </>
        ) : (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
            >
                <button
                    onClick={handleCreateDrop}
                    className="btn-glass bg-accent-pink/90 font-bold py-3 px-8 rounded-full transition-transform hover:scale-105 mt-6 text-lg"
                >
                    Create Your Drop
                </button>
            </motion.div>
        )}
    </div>
  );
}


export default function DropPage() {
    return (
        <Suspense fallback={<VibeSpaceLoader />}>
            <DropPageContent />
        </Suspense>
    )
}
