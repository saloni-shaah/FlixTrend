
import { redis } from "@/utils/redis";
import { getFirestore } from "@/utils/firebaseAdmin";
import admin from 'firebase-admin';

const VIEW_TTL_SECONDS = 3600; // 1 hour

export async function processSongView(songId: string, viewerId: string) {
  const viewKey = `song:view:${songId}:${viewerId}`;
  const isNewView = await redis.set(viewKey, "1", { ex: VIEW_TTL_SECONDS, nx: true });

  if (isNewView) {
    const db = getFirestore();
    await db.collection("songs").doc(songId).set(
      { playCount: admin.firestore.FieldValue.increment(1) },
      { merge: true },
    );
  }
}
