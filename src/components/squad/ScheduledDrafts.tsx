"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, FileText, Loader2, Save, Trash2, Zap } from "lucide-react";
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, getStorage, ref } from "firebase/storage";
import { app } from "@/utils/firebaseClient";
import { deletePostDraft } from "@/lib/postDrafts";

const db = getFirestore(app);
const storage = getStorage(app);

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
  collectionName: "posts" | "flashes" | "drafts";
  title: string;
  mediaUrl?: string | null;
  type?: string;
  isVideo?: boolean;
  publishAt?: any;
  savedAt?: any;
  status?: string;
  storageMode: "local" | "firestore";
};

export function ScheduledDrafts({ userId }: { userId: string }) {
  const [items, setItems] = useState<ScheduledItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [draftDates, setDraftDates] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const fetchScheduled = async () => {
      setLoading(true);
      setError(null);
      try {
        const [postsSnap, flashesSnap, draftsSnap] = await Promise.all([
          getDocs(query(collection(db, "posts"), where("userId", "==", userId), orderBy("publishAt", "desc"), limit(60))),
          getDocs(query(collection(db, "flashes"), where("userId", "==", userId), orderBy("publishAt", "desc"), limit(60))),
          getDocs(query(collection(db, "users", userId, "drafts"), orderBy("updatedAt", "desc"), limit(60))),
        ]);

        const now = Date.now();
        const publicItems: ScheduledItem[] = [
          ...postsSnap.docs.map((snapshot) => ({ id: snapshot.id, collectionName: "posts" as const, ...snapshot.data() })),
          ...flashesSnap.docs.map((snapshot) => ({ id: snapshot.id, collectionName: "flashes" as const, ...snapshot.data() })),
        ]
          .filter((item: any) => {
            const publishDate = toDate(item.publishAt);
            return item.status === "draft" || (publishDate && publishDate.getTime() > now);
          })
          .map((item: any) => ({
            id: item.id,
            collectionName: item.collectionName,
            title: item.caption || item.content || item.question || "Untitled post",
            mediaUrl: Array.isArray(item.mediaUrl) ? item.mediaUrl[0] : item.mediaUrl || item.thumbnailUrl || null,
            type: item.type,
            isVideo: item.isVideo,
            publishAt: item.publishAt,
            status: item.status || "scheduled",
            storageMode: "firestore" as const,
          }));

        const privateItems: ScheduledItem[] = await Promise.all(draftsSnap.docs
          .filter((snapshot) => ["draft", "scheduled"].includes(snapshot.data().status))
          .map(async (snapshot) => {
            const draft = snapshot.data();
            const assets = draft.assets || {};
            const previewAsset = assets.thumbnailFile || assets.files_0 || assets.mediaFiles_0 || assets.clip_0;
            let mediaUrl: string | null = null;
            if (previewAsset?.path) {
              try {
                mediaUrl = await getDownloadURL(ref(storage, previewAsset.path));
              } catch (previewError) {
                console.error(`Could not load preview for draft ${snapshot.id}:`, previewError);
              }
            }
            return {
              id: snapshot.id,
              collectionName: "drafts",
              title: draft.title || "Untitled draft",
              mediaUrl,
              type: draft.postType,
              isVideo: Boolean(previewAsset?.type?.startsWith("video/")),
              publishAt: draft.publishAt,
              savedAt: draft.updatedAt,
              status: draft.status,
              storageMode: "firestore" as const,
            };
          }));

        let localDrafts: ScheduledItem[] = [];
        if (typeof window !== "undefined") {
          try {
            const rawLocalDrafts = window.localStorage.getItem("flixtrend:drafts");
            if (rawLocalDrafts) {
              const parsed = JSON.parse(rawLocalDrafts) as any[];
              localDrafts = parsed
                .filter((draft) => draft.userId === userId)
                .map((draft) => ({
                  id: draft.id,
                  collectionName: "drafts",
                  title: draft.title || draft.content || "Legacy local draft",
                  type: "draft",
                  publishAt: draft.updatedAt || draft.createdAt,
                  status: "draft",
                  storageMode: "local",
                }));
            }
          } catch (localError) {
            console.error("Error loading legacy local drafts:", localError);
          }
        }

        const nextItems = [...privateItems, ...publicItems, ...localDrafts].sort((a, b) => {
          if (a.status === "scheduled" && b.status !== "scheduled") return -1;
          if (b.status === "scheduled" && a.status !== "scheduled") return 1;
          if (a.status === "scheduled" && b.status === "scheduled") {
            return (toDate(a.publishAt)?.getTime() ?? 0) - (toDate(b.publishAt)?.getTime() ?? 0);
          }
          return (toDate(b.publishAt)?.getTime() ?? 0) - (toDate(a.publishAt)?.getTime() ?? 0);
        });
        const nextDates = nextItems.reduce<Record<string, string>>((acc, item) => {
          const publishDate = toDate(item.publishAt);
          if (publishDate) acc[`${item.collectionName}:${item.id}`] = toDateTimeLocalValue(publishDate);
          return acc;
        }, {});

        if (!cancelled) {
          setItems(nextItems);
          setDraftDates(nextDates);
        }
      } catch (err) {
        console.error("Error loading scheduled drafts:", err);
        if (!cancelled) setError("Could not load drafts and scheduled posts.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchScheduled();
    return () => {
      cancelled = true;
    };
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
      const publishAt = Timestamp.fromDate(nextPublishAt);
      if (item.collectionName === "drafts" && item.storageMode === "firestore") {
        await updateDoc(doc(db, "users", userId, "drafts", item.id), {
          publishAt,
          status: "scheduled",
          updatedAt: Timestamp.now(),
        });
      } else {
        const updateData: Record<string, any> = { publishAt };
        if (item.collectionName === "flashes") {
          updateData.expiresAt = Timestamp.fromDate(new Date(nextPublishAt.getTime() + 24 * 60 * 60 * 1000));
        }
        await updateDoc(doc(db, item.collectionName, item.id), updateData);
      }
      setItems((current) => current.map((existing) => existing.id === item.id && existing.collectionName === item.collectionName
        ? { ...existing, publishAt, status: "scheduled" }
        : existing
      ));
    } catch (err) {
      console.error("Error updating scheduled item:", err);
      setError("Could not update the schedule.");
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (item: ScheduledItem) => {
    if (!window.confirm("Delete this draft and its saved media? This cannot be undone.")) return;
    setDeletingId(item.id);
    setError(null);
    try {
      if (item.storageMode === "local") {
        const currentDrafts = JSON.parse(window.localStorage.getItem("flixtrend:drafts") || "[]") as any[];
        window.localStorage.setItem("flixtrend:drafts", JSON.stringify(currentDrafts.filter((draft) => draft.id !== item.id)));
      } else {
        const failures = await deletePostDraft(userId, item.id);
        if (failures.length) setError("Draft deleted, but some media could not be removed from storage.");
      }
      setItems((current) => current.filter((existing) => existing.id !== item.id || existing.collectionName !== item.collectionName));
    } catch (deleteError) {
      console.error("Error deleting draft:", deleteError);
      setError("Could not delete this draft.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center mt-20 text-accent-cyan"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="w-full max-w-xl flex flex-col gap-4">
      {error && <div role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
      {items.length === 0 ? (
        <div className="text-muted-foreground text-center mt-16 flex flex-col items-center">
          <CalendarClock className="mb-4 text-accent-cyan" size={40} />
          <div className="text-lg font-semibold mb-2">No drafts or scheduled posts</div>
          <p className="text-sm mb-6">Your private drafts and scheduled posts will appear here.</p>
          <Link href="/create" className="btn btn-primary btn-cta">Create something</Link>
        </div>
      ) : items.map((item) => {
        const key = `${item.collectionName}:${item.id}`;
        const publishDate = toDate(item.status === "draft" ? item.savedAt || item.publishAt : item.publishAt);
        const isPrivateDraft = item.collectionName === "drafts";
        const isLegacyLocal = item.storageMode === "local";
        return (
          <div key={key} className="glass-card p-4 flex gap-4 items-center">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-black/30 shrink-0 flex items-center justify-center">
              {item.mediaUrl ? item.isVideo ? (
                <video src={item.mediaUrl} muted playsInline className="w-full h-full object-cover" />
              ) : (
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
              {publishDate && (
                <p className="text-xs text-muted-foreground mt-1">
                  {item.status === "draft" ? "Saved " : "Target date "}
                  {publishDate.toLocaleString()}
                </p>
              )}
              {isPrivateDraft && (
                <p className="mt-1 text-xs text-amber-300">
                  Private to you. Scheduled posts require you to publish manually; they will not auto-publish.
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {isLegacyLocal ? (
                  <>
                    <Link href={`/create?type=draft&draftId=${encodeURIComponent(item.id)}`} className="btn-glass text-sm">
                      Resume local project
                    </Link>
                    <span className="text-xs text-muted-foreground">Source files must be selected again.</span>
                  </>
                ) : isPrivateDraft ? (
                  <Link href={`/create?draftId=${encodeURIComponent(item.id)}`} className="btn-glass text-sm">
                    Edit / publish manually
                  </Link>
                ) : null}

                {isLegacyLocal ? (
                  <button
                    onClick={() => void handleDelete(item)}
                    disabled={deletingId === item.id}
                    className="btn-glass text-red-300"
                    aria-label="Delete local draft"
                  >
                    {deletingId === item.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                  </button>
                ) : (
                  <button
                    onClick={() => void handleDelete(item)}
                    disabled={deletingId === item.id || !isPrivateDraft}
                    className="btn-glass text-red-300 disabled:opacity-40"
                    aria-label="Delete private draft"
                  >
                    {deletingId === item.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                  </button>
                )}
              </div>

              {!isLegacyLocal && (
                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                  <input
                    type="datetime-local"
                    min={toDateTimeLocalValue(new Date(Date.now() + 60 * 1000))}
                    value={draftDates[key] || ""}
                    onChange={(event) => setDraftDates((previous) => ({ ...previous, [key]: event.target.value }))}
                    className="input-glass text-sm flex-1"
                  />
                  <button
                    onClick={() => void handleSave(item)}
                    disabled={savingId === key}
                    className="btn-glass flex items-center justify-center gap-2 text-sm"
                  >
                    {savingId === key ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                    {item.status === "draft" ? "Schedule" : "Save time"}
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
