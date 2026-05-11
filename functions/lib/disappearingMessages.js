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
exports.cleanupDisappearingMessages = void 0;
const v1 = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const firebase_functions_1 = require("firebase-functions");
const db = admin.firestore();
// Valid disappearing message durations in days
const VALID_DURATIONS = [1, 7, 21, 30, 90];
const DEFAULT_DURATION_DAYS = 90;
exports.cleanupDisappearingMessages = v1.pubsub
    .schedule('0 3 * * *') // 3:00 AM daily
    .timeZone('Asia/Kolkata')
    .onRun(async () => {
    var _a;
    firebase_functions_1.logger.info('Starting disappearing messages cleanup.');
    const chatsSnap = await db.collection('chats').get();
    if (chatsSnap.empty) {
        firebase_functions_1.logger.info('No chats found.');
        return null;
    }
    let totalDeleted = 0;
    for (const chatDoc of chatsSnap.docs) {
        try {
            const chatData = chatDoc.data();
            // Read duration in days — fallback to 90 if missing or invalid
            const rawDuration = (_a = chatData === null || chatData === void 0 ? void 0 : chatData.disappearingMessages) === null || _a === void 0 ? void 0 : _a.duration;
            const durationDays = typeof rawDuration === 'number' && VALID_DURATIONS.includes(rawDuration)
                ? rawDuration
                : DEFAULT_DURATION_DAYS;
            // Calculate cutoff timestamp
            const cutoffMs = Date.now() - durationDays * 24 * 60 * 60 * 1000;
            const cutoff = admin.firestore.Timestamp.fromMillis(cutoffMs);
            // Query messages older than cutoff, excluding starred ones
            // Firestore can't do != on a field that may not exist,
            // so we fetch expired messages and filter isStarred client-side
            const messagesRef = chatDoc.ref.collection('messages');
            let lastDoc = null;
            let batchCount = 0;
            // Paginate in chunks of 500 to stay within batch limits
            while (true) {
                let query = messagesRef
                    .where('createdAt', '<', cutoff)
                    .orderBy('createdAt', 'asc')
                    .limit(500);
                if (lastDoc) {
                    query = query.startAfter(lastDoc);
                }
                const snap = await query.get();
                if (snap.empty)
                    break;
                const batch = db.batch();
                let deleteCount = 0;
                snap.docs.forEach(msgDoc => {
                    var _a;
                    // Skip starred messages — user explicitly saved them
                    if (((_a = msgDoc.data()) === null || _a === void 0 ? void 0 : _a.isStarred) === true)
                        return;
                    batch.delete(msgDoc.ref);
                    deleteCount++;
                });
                if (deleteCount > 0) {
                    await batch.commit();
                    totalDeleted += deleteCount;
                    batchCount++;
                }
                // If we got less than 500, we've reached the end
                if (snap.size < 500)
                    break;
                lastDoc = snap.docs[snap.docs.length - 1];
            }
            if (batchCount > 0) {
                firebase_functions_1.logger.info(`Chat ${chatDoc.id}: deleted messages older than ${durationDays} days (${batchCount} batch(es)).`);
            }
        }
        catch (error) {
            // One chat failing won't stop others
            firebase_functions_1.logger.error(`Error processing chat ${chatDoc.id}:`, error);
        }
    }
    firebase_functions_1.logger.info(`Cleanup complete. Total messages deleted: ${totalDeleted}.`);
    return null;
});
//# sourceMappingURL=disappearingMessages.js.map