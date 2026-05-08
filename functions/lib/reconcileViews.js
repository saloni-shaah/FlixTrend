"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reconcileViews = void 0;
const functions = __importStar(require("firebase-functions/v2/scheduler"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
exports.reconcileViews = functions.onSchedule("every 25 minutes", async () => {
    console.log("[reconcileViews] Starting reconciliation job for video posts.");
    const oneDayAgo = admin.firestore.Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
    const posts = await db.collection("posts")
        .where("isVideo", "==", true)
        .where("updatedAt", ">=", oneDayAgo)
        .get();
    if (posts.empty) {
        console.log("[reconcileViews] No video posts updated in the last 24 hours. Exiting.");
        return;
    }
    // Process in chunks of 400 to stay under the 500-write batch limit
    const chunks = [];
    for (let i = 0; i < posts.docs.length; i += 400) {
        chunks.push(posts.docs.slice(i, i + 400));
    }
    console.log(`[reconcileViews] Processing ${posts.docs.length} video posts in ${chunks.length} chunks.`);
    for (const [index, chunk] of chunks.entries()) {
        const batch = db.batch();
        await Promise.all(chunk.map(async (postDoc) => {
            const shards = await postDoc.ref.collection("viewShards").get();
            if (shards.empty)
                return;
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
//# sourceMappingURL=reconcileViews.js.map