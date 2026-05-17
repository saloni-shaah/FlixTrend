
import { getFirestore } from "@/utils/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { redis } from "@/utils/redis";

// Deduplicate views for the same drop/user for 24 hours.
const DEDUP_TTL_SECONDS = 86400; // 24 hours

async function isDuplicate(dropId: string, userId: string): Promise<boolean> {
  const key = `view:drop:${dropId}:${userId}`;
  const result = await redis.set(key, "1", { nx: true, ex: DEDUP_TTL_SECONDS });
  return result === null;
}

export async function processDropView(dropId: string, userId: string): Promise<void> {
  if (await isDuplicate(dropId, userId)) {
    return;
  }

  const adminDb = getFirestore();
  const dropRef = adminDb.collection("drops").doc(dropId);

  try {
    await dropRef.update({ viewCount: FieldValue.increment(1) });
  } catch (error) {
    console.error(`[VIEW_PROCESSOR] Failed to increment view count for drop ${dropId}:`, error);
    // On failure, remove the Redis key to allow a retry.
    const key = `view:drop:${dropId}:${userId}`;
    await redis.del(key);
    throw error;
  }
}
