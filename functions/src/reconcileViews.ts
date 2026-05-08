import * as functions from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";

const db = admin.firestore();

export const reconcileViews = functions.onSchedule("every 25 minutes", async () => {
  console.log("[reconcileViews] Starting reconciliation job for video posts.");

  const oneDayAgo = admin.firestore.Timestamp.fromDate(
    new Date(Date.now() - 24 * 60 * 60 * 1000)
  );

  const posts = await db.collection("posts")
    .where("isVideo", "==", true)
    .where("updatedAt", ">=", oneDayAgo)
    .get();

  if (posts.empty) {
    console.log("[reconcileViews] No video posts updated in the last 24 hours. Exiting.");
    return;
  }

  // Process in chunks of 400 to stay under the 500-write batch limit
  const chunks: admin.firestore.QueryDocumentSnapshot[][] = [];
  for (let i = 0; i < posts.docs.length; i += 400) {
    chunks.push(posts.docs.slice(i, i + 400));
  }

  console.log(`[reconcileViews] Processing ${posts.docs.length} video posts in ${chunks.length} chunks.`);

  for (const [index, chunk] of chunks.entries()) {
    const batch = db.batch();

    await Promise.all(chunk.map(async (postDoc) => {
      const shards = await postDoc.ref.collection("viewShards").get();
      if (shards.empty) return;

      // Sum the counts from all shards
      const total = shards.docs.reduce((sum, s) => sum + (s.data().count || 0), 0);
      
      // Update the main post's viewCount with the aggregated total
      batch.update(postDoc.ref, { viewCount: total });
    }));

    await batch.commit();
    console.log(`[reconcileViews] Committed batch ${index + 1}/${chunks.length}.`);
  }

  console.log(`[reconcileViews] Done. Reconciled ${posts.docs.length} video posts.`);
});
