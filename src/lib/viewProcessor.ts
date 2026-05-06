import {
  doc,
  updateDoc,
  increment,
  setDoc,
  getFirestore,
  getDoc,
} from "firebase/firestore";
import { app } from "@/utils/firebaseClient";

const db = getFirestore(app);

// In-memory dedup window: key → expiry timestamp
const recentViews = new Map<string, number>();
const DEDUP_WINDOW_MS = 30 * 60 * 1000; // 30 minutes
const NUM_SHARDS = 10;

function cleanExpiredKeys() {
  const now = Date.now();
  for (const [key, expiry] of recentViews.entries()) {
    if (now > expiry) recentViews.delete(key);
  }
}

export async function processQueue(
  queue: Array<{ videoId: string; userId: string; timestamp: number }>
) {
  if (queue.length === 0) return;

  // Drain queue
  const batch = queue.splice(0, queue.length);

  cleanExpiredKeys();

  // Deduplicate and count
  const grouped: Record<string, number> = {};

  for (const event of batch) {
    const key = `${event.videoId}::${event.userId}`;
    if (recentViews.has(key)) continue;

    recentViews.set(key, Date.now() + DEDUP_WINDOW_MS);

    grouped[event.videoId] = (grouped[event.videoId] || 0) + 1;
  }

  // Write to Firestore: shard + cached total
  const writes = Object.entries(grouped).map(async ([videoId, count]) => {
    const shardId = Math.floor(Math.random() * NUM_SHARDS);

    // Write to random shard
    const shardRef = doc(db, "posts", videoId, "viewShards", String(shardId));
    await setDoc(shardRef, { count: increment(count) }, { merge: true });

    // Update cached total on the post document (avoids summing shards in UI)
    const postRef = doc(db, "posts", videoId);
    await updateDoc(postRef, { viewCount: increment(count) }).catch(() => {
      // Post may not exist yet, ignore
    });
  });

  await Promise.allSettled(writes);
}

// ─── Interval runner (server-side singleton) ───────────────────────────────
// Only start the interval once per server process.
let processorStarted = false;

export function startViewProcessor(
  queue: Array<{ videoId: string; userId: string; timestamp: number }>
) {
  if (processorStarted) return;
  processorStarted = true;

  setInterval(() => {
    processQueue(queue).catch((e) =>
      console.error("[ViewProcessor] Error:", e)
    );
  }, 5000);
}

// ─── Client-side helper ────────────────────────────────────────────────────
// Call this from the player after 7 seconds of watch time.
export async function trackView(videoId: string, userId?: string) {
  if (!videoId || typeof window === "undefined") return;

  try {
    await fetch("/api/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId, userId: userId || "anon" }),
      keepalive: true,
    });
  } catch {
    // Fire-and-forget — never block the UI
  }
}
