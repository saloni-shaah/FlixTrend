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
exports.cleanupOnlineGameRooms = void 0;
const admin = __importStar(require("firebase-admin"));
const scheduler = __importStar(require("firebase-functions/v2/scheduler"));
const db = admin.firestore();
const ROOM_COLLECTION = "online_game_rooms";
const ROOM_RETENTION_DAYS = 30;
const MAX_ROOMS_PER_RUN = 400;
const MAX_CONCURRENT_DELETIONS = 20;
exports.cleanupOnlineGameRooms = scheduler.onSchedule({ schedule: "every 48 hours", timeZone: "Etc/UTC", region: "asia-south1", maxInstances: 1 }, async () => {
    const cutoff = admin.firestore.Timestamp.fromMillis(Date.now() - ROOM_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const staleRooms = await db.collection(ROOM_COLLECTION)
        .where("updatedAt", "<", cutoff)
        .orderBy("updatedAt")
        .limit(MAX_ROOMS_PER_RUN)
        .get();
    let deleted = 0;
    for (let start = 0; start < staleRooms.docs.length; start += MAX_CONCURRENT_DELETIONS) {
        const batch = staleRooms.docs.slice(start, start + MAX_CONCURRENT_DELETIONS);
        await Promise.all(batch.map(room => db.runTransaction(async (transaction) => {
            const latest = await transaction.get(room.ref);
            const updatedAt = latest.get("updatedAt");
            if (!latest.exists || !(updatedAt instanceof admin.firestore.Timestamp) ||
                updatedAt.toMillis() >= cutoff.toMillis())
                return;
            transaction.delete(room.ref);
            deleted++;
        })));
    }
    console.log(`Deleted ${deleted} online game rooms inactive for at least ${ROOM_RETENTION_DAYS} days.`);
});
//# sourceMappingURL=cleanupOnlineGameRooms.js.map