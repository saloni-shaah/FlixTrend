'use client';

import { useEffect, useState } from 'react';
import { signOut } from 'firebase/auth';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { formatDistanceToNow } from 'date-fns';
import { Monitor, Smartphone, LogOut } from 'lucide-react';
import { auth, db, functions } from '@/utils/firebaseClient';
import { type DeviceSession, getDeviceSessionId } from '@/lib/deviceSessions';
import { useRouter } from 'next/navigation';

export function DeviceSessions({ userId }: { userId: string }) {
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState('');
  const [loading, setLoading] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    setCurrentSessionId(getDeviceSessionId());
  }, []);

  useEffect(() => {
    const sessionsQuery = query(
      collection(db, 'users', userId, 'activeSessions'),
      orderBy('lastSeen', 'desc')
    );

    return onSnapshot(sessionsQuery, (snapshot) => {
      setSessions(snapshot.docs.map((session) => ({
        id: session.id,
        ...session.data(),
      } as DeviceSession)));
      setLoading(false);
    }, (snapshotError) => {
      console.error('Could not load signed-in devices:', snapshotError);
      setError('Could not load signed-in devices. Please try again later.');
      setLoading(false);
    });
  }, [userId]);

  const handleRevokeAll = async () => {
    setIsRevoking(true);
    setError('');
    try {
      const revokeAllSessions = httpsCallable(functions, 'revokeAllSessions');
      await revokeAllSessions();
      await signOut(auth);
      router.replace('/login');
    } catch (revokeError) {
      console.error('Could not log out all devices:', revokeError);
      setError('Could not log out all devices. Please try again.');
      setIsRevoking(false);
      setShowConfirmation(false);
    }
  };

  const formatLastSeen = (value: DeviceSession['lastSeen']) => {
    if (!value?.toDate) return 'Recently active';
    return `${formatDistanceToNow(value.toDate(), { addSuffix: true })}`;
  };

  return (
    <section className="bg-white/20 rounded-xl p-4">
      <h3 className="flex items-center gap-2 mb-2 font-bold text-accent-cyan">
        <Monitor /> Signed-in devices ({sessions.length})
      </h3>
      <p className="text-sm text-white/70 mb-3">
        Devices are listed after they open FlixTrend with this feature deployed. Last active times help identify older sessions.
      </p>

      {loading ? (
        <p className="text-sm text-white/60">Loading devices...</p>
      ) : sessions.length ? (
        <ul className="divide-y divide-white/10">
          {sessions.map((session) => {
            const isCurrentDevice = session.id === currentSessionId;
            const isMobile = /Android|iPhone|iPad|iPod/i.test(session.userAgent || '');
            const DeviceIcon = isMobile ? Smartphone : Monitor;
            return (
              <li key={session.id} className="flex items-center gap-3 py-3">
                <DeviceIcon className="shrink-0 text-accent-cyan" size={20} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">
                    {session.label || 'Web browser'}
                    {isCurrentDevice && <span className="ml-2 text-xs text-accent-green">This device</span>}
                  </p>
                  <p className="text-xs text-white/60">Last active {formatLastSeen(session.lastSeen)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-white/60">No device sessions are registered yet.</p>
      )}

      {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}

      <button
        type="button"
        className="btn-glass mt-4 w-full bg-red-500/15 text-red-300 hover:bg-red-500/30 disabled:opacity-50"
        disabled={loading || sessions.length === 0 || isRevoking}
        onClick={() => setShowConfirmation(true)}
      >
        <LogOut className="inline-block mr-2" />
        {isRevoking ? 'Logging out devices...' : 'Log Out All Devices'}
      </button>

      {showConfirmation && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-devices-title"
            className="glass-card w-full max-w-md rounded-2xl p-6"
          >
            <h4 id="logout-devices-title" className="text-lg font-bold text-white">
              Log out all devices?
            </h4>
            <p className="mt-2 text-sm text-white/70">
              This will sign out every registered device, including this one. You will need to log in again.
              Devices that are offline will be signed out when they reconnect.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                className="btn-glass"
                disabled={isRevoking}
                onClick={() => setShowConfirmation(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-glass bg-red-500/30 text-red-200"
                disabled={isRevoking}
                onClick={() => void handleRevokeAll()}
              >
                {isRevoking ? 'Logging out...' : 'Log out all'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
