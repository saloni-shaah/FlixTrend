"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, Loader2, Save, Zap, FileText } from "lucide-react";
import { getFirestore, collection, getDocs, limit, orderBy, query, Timestamp, updateDoc, where, doc } from "firebase/firestore";
import { app } from "@/utils/firebaseClient";

const db = getFirestore(app);

const toDate = (value: any): Date | null => {
  if (!value) return null;
  if (value.toDate) return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toDateTimeLocalValue = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

type ScheduledItem = {
  id: string;
  collectionName: "posts" | "flashes";
  title: string;
  mediaUrl?: string | null;
  type?: string;
  isVideo?: boolean;
  publishAt?: any;
  status?: string;
};

export function ScheduledDrafts({ userId }: { userId: string }) {
  const [items, setItems] = useState<ScheduledItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [draftDates, setDraftDates] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchScheduled = async () => {
      setLoading(true);
      setError(null);
      try {
        const [postsSnap, flashesSnap] = await Promise.all([
          getDocs(query(collection(db, "posts"), where("userId", "==", userId), orderBy("publishAt", "desc"), limit(60))),
          getDocs(query(collection(db, "flashes"), where("userId", "==", userId), orderBy("publishAt", "desc"), limit(60))),
        ]);

        const now = Date.now();
        const nextItems: ScheduledItem[] = [
          ...postsSnap.docs.map(d => ({ id: d.id, collectionName: "posts" as const, ...d.data() })),
          ...flashesSnap.docs.map(d => ({ id: d.id, collectionName: "flashes" as const, ...d.data() })),
        ]
          .filter((item: any) => {
            const publishDate = toDate(item.publishAt);
            return item.status === "draft" || (publishDate && publishDate.getTime() > now);
          })
          .map((item: any) => ({
            id: item.id,
            collectionName: item.collectionName,
            title: item.caption || item.content || item.question || "Untitled draft",
            mediaUrl: Array.isArray(item.mediaUrl) ? item.mediaUrl[0] : item.mediaUrl || item.thumbnailUrl || null,
            type: item.type,
            isVideo: item.isVideo,
            publishAt: item.publishAt,
            status: item.status,
          }))
          .sort((a, b) => (toDate(a.publishAt)?.getTime() ?? 0) - (toDate(b.publishAt)?.getTime() ?? 0));

        const nextDates = nextItems.reduce<Record<string, string>>((acc, item) => {
          const publishDate = toDate(item.publishAt);
          if (publishDate) acc[`${item.collectionName}:${item.id}`] = toDateTimeLocalValue(publishDate);
          return acc;
        }, {});

        setItems(nextItems);
        setDraftDates(nextDates);
      } catch (err: any) {
        console.error("Error loading scheduled drafts:", err);
        setError("Could not load scheduled drafts.");
      } finally {
        setLoading(false);
      }
    };

    fetchScheduled();
  }, [userId]);

  const handleSave = async (item: ScheduledItem) => {
    const key = `${item.collectionName}:${item.id}`;
    const value = draftDates[key];
    const nextPublishAt = value ? new Date(value) : null;

    if (!nextPublishAt || nextPublishAt.getTime() <= Date.now()) {
      setError("Pick a future date and time.");
      return;
    }

    setSavingId(key);
    setError(null);
    try {
      const updateData: any = {
        publishAt: Timestamp.fromDate(nextPublishAt),
      };

      if (item.collectionName === "flashes") {
        updateData.expiresAt = Timestamp.fromDate(new Date(nextPublishAt.getTime() + 24 * 60 * 60 * 1000));
      }

      await updateDoc(doc(db, item.collectionName, item.id), updateData);
      setItems(prev => prev.map(existing => existing.id === item.id && existing.collectionName === item.collectionName
        ? { ...existing, publishAt: updateData.publishAt }
        : existing
      ));
    } catch (err: any) {
      console.error("Error updating scheduled item:", err);
      setError("Could not update the schedule.");
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center mt-20 text-accent-cyan"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="w-full max-w-xl flex flex-col gap-4">
      {error && <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
      {items.length === 0 ? (
        <div className="text-muted-foreground text-center mt-16 flex flex-col items-center">
          <CalendarClock className="mb-4 text-accent-cyan" size={40} />
          <div className="text-lg font-semibold mb-2">No scheduled drafts</div>
          <p className="text-sm mb-6">Scheduled flashes and draft posts will appear here.</p>
          <Link href="/create" className="btn btn-primary btn-cta">Create something</Link>
        </div>
      ) : items.map(item => {
        const key = `${item.collectionName}:${item.id}`;
        const publishDate = toDate(item.publishAt);
        return (
          <div key={key} className="glass-card p-4 flex gap-4 items-center">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-black/30 shrink-0 flex items-center justify-center">
              {item.mediaUrl ? (
                <img src={item.mediaUrl} alt={item.title} className="w-full h-full object-cover" />
              ) : item.collectionName === "flashes" ? (
                <Zap className="text-accent-pink" />
              ) : (
                <FileText className="text-accent-cyan" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <span className="uppercase tracking-wide">{item.collectionName === "flashes" ? "Flash" : item.type || "Post"}</span>
                <span>{item.status === "draft" ? "Draft" : "Scheduled"}</span>
              </div>
              <h3 className="font-bold text-sm line-clamp-2">{item.title}</h3>
              {publishDate && <p className="text-xs text-muted-foreground mt-1">Publishes {publishDate.toLocaleString()}</p>}
              <div className="mt-3 flex flex-col sm:flex-row gap-2">
                <input
                  type="datetime-local"
                  min={toDateTimeLocalValue(new Date(Date.now() + 60 * 1000))}
                  value={draftDates[key] || ""}
                  onChange={(e) => setDraftDates(prev => ({ ...prev, [key]: e.target.value }))}
                  className="input-glass text-sm flex-1"
                />
                <button
                  onClick={() => handleSave(item)}
                  disabled={savingId === key}
                  className="btn-glass flex items-center justify-center gap-2 text-sm"
                >
                  {savingId === key ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  Save
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
