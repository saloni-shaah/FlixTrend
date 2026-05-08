import { getFirestore } from "@/utils/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { redis } from "@/utils/redis";

const NUM_SHARDS = 20;
const DEDUP_TTL_SECONDS = 1800; // 30 minutes

async function isDuplicate(videoId: string, userId: string): Promise<boolean> {
  const key = `view:${videoId}:${userId}`;
  const result = await redis.set(key, 1, { nx: true, ex: DEDUP_TTL_SECONDS });
  return result === null;
}

export async function processView(videoId: string, userId: string): Promise<void> {
  if (await isDuplicate(videoId, userId)) return;

  const adminDb = getFirestore();
  const shardId = Math.floor(Math.random() * NUM_SHARDS).toString();
  const shardRef = adminDb
    .collection("posts")
    .doc(videoId)
    .collection("viewShards")
    .doc(shardId);

  try {
    await shardRef.set({ count: FieldValue.increment(1) }, { merge: true });
  } catch (error) {
    console.error(`[viewProcessor] Failed to increment shard for video ${videoId}:`, error);
  }
}
