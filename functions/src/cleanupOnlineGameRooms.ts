import * as admin from "firebase-admin";
import * as scheduler from "firebase-functions/v2/scheduler";

const db = admin.firestore();
const ROOM_COLLECTION = "online_game_rooms";
const ROOM_RETENTION_DAYS = 30;
const MAX_ROOMS_PER_RUN = 400;
const MAX_CONCURRENT_DELETIONS = 20;

export const cleanupOnlineGameRooms = scheduler.onSchedule(
  { schedule: "every 48 hours", timeZone: "Etc/UTC", region: "asia-south1", maxInstances: 1 },
  async () => {
    const cutoff = admin.firestore.Timestamp.fromMillis(
      Date.now() - ROOM_RETENTION_DAYS * 24 * 60 * 60 * 1000,
    );
    const staleRooms = await db.collection(ROOM_COLLECTION)
      .where("updatedAt", "<", cutoff)
      .orderBy("updatedAt")
      .limit(MAX_ROOMS_PER_RUN)
      .get();

    let deleted = 0;
    for (let start = 0; start < staleRooms.docs.length; start += MAX_CONCURRENT_DELETIONS) {
      const batch = staleRooms.docs.slice(start, start + MAX_CONCURRENT_DELETIONS);
      await Promise.all(batch.map(room => db.runTransaction(async transaction => {
        const latest = await transaction.get(room.ref);
        const updatedAt = latest.get("updatedAt");
        if (!latest.exists || !(updatedAt instanceof admin.firestore.Timestamp) ||
          updatedAt.toMillis() >= cutoff.toMillis()) return;
        transaction.delete(room.ref);
        deleted++;
      })));
    }

    console.log(`Deleted ${deleted} online game rooms inactive for at least ${ROOM_RETENTION_DAYS} days.`);
  },
);
