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
const firestore_1 = require("firebase-admin/firestore");
const firebase_functions_1 = require("firebase-functions");
const db = admin.firestore();
const VALID_DURATIONS = [1, 7, 21, 30, 90];
const DEFAULT_DURATION_DAYS = 90;
async function getUserDuration(uid) {
    var _a;
    try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists)
            return DEFAULT_DURATION_DAYS;
        const settings = (_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.settings;
        const duration = Number(settings === null || settings === void 0 ? void 0 : settings.disappearingMessages);
        return VALID_DURATIONS.includes(duration) ? duration : DEFAULT_DURATION_DAYS;
    }
    catch (error) {
        firebase_functions_1.logger.error(`Error fetching user settings for ${uid}:`, error);
        return DEFAULT_DURATION_DAYS;
    }
}
async function deleteOldMessages(chatRef, cutoffTimestamp) {
    const oldMessagesQuery = chatRef
        .collection('messages')
        .where('createdAt', '<', cutoffTimestamp)
        .orderBy('createdAt');
    let deletedCount = 0;
    let lastDoc = null;
    while (true) {
        let query = oldMessagesQuery.limit(500);
        if (lastDoc)
            query = query.startAfter(lastDoc);
        const snap = await query.get();
        if (snap.empty)
            break;
        const nextCursor = snap.docs[snap.docs.length - 1];
        const batch = db.batch();
        let ops = 0;
        snap.forEach(msgDoc => {
            if (msgDoc.data().isStarred !== true) {
                batch.delete(msgDoc.ref);
                ops++;
                deletedCount++;
            }
        });
        if (ops > 0) {
            await batch.commit();
            firebase_functions_1.logger.info(`Chat ${chatRef.id} | batch committed: ${ops} deletions`);
        }
        lastDoc = nextCursor;
        if (snap.size < 500)
            break;
    }
    return deletedCount;
}
exports.cleanupDisappearingMessages = v1
    .runWith({ timeoutSeconds: 540, memory: '512MB' })
    .pubsub.schedule('50 18 * * *')
    .timeZone('Asia/Kolkata')
    .onRun(async () => {
    var _a, _b, _c, _d;
    firebase_functions_1.logger.info('Starting scheduled cleanup of disappearing messages.');
    const durationCache = new Map();
    async function getCachedDuration(uid) {
        if (durationCache.has(uid))
            return durationCache.get(uid);
        const d = await getUserDuration(uid);
        durationCache.set(uid, d);
        return d;
    }
    let totalDeletedCount = 0;
    // ── DM chats ──────────────────────────────────────────────────────
    const allChatsSnap = await db.collection('chats').get();
    const dmDocs = allChatsSnap.docs.filter(doc => !doc.data().isGroup);
    firebase_functions_1.logger.info(`DM chats found: ${dmDocs.length}`);
    for (const chatDoc of dmDocs) {
        try {
            const participants = (_b = (_a = chatDoc.data()) === null || _a === void 0 ? void 0 : _a.participants) !== null && _b !== void 0 ? _b : [];
            if (!participants.length) {
                firebase_functions_1.logger.warn(`DM ${chatDoc.id} | no participants, skipping.`);
                continue;
            }
            const durations = await Promise.all(participants.map(getCachedDuration));
            const shortestDurationDays = Math.min(...durations);
            const cutoffTimestamp = firestore_1.Timestamp.fromMillis(Date.now() - shortestDurationDays * 86400000);
            firebase_functions_1.logger.info(`DM ${chatDoc.id} | shortest: ${shortestDurationDays}d | cutoff: ${cutoffTimestamp.toDate().toISOString()}`);
            const deleted = await deleteOldMessages(chatDoc.ref, cutoffTimestamp);
            if (deleted > 0) {
                firebase_functions_1.logger.info(`DM ${chatDoc.id} | total deleted: ${deleted}`);
                totalDeletedCount += deleted;
            }
        }
        catch (error) {
            firebase_functions_1.logger.error(`Failed to process DM ${chatDoc.id}:`, error);
        }
    }
    // ── Group chats ───────────────────────────────────────────────────
    const groupsSnap = await db.collection('groups').get();
    firebase_functions_1.logger.info(`Group chats found: ${groupsSnap.size}`);
    for (const groupDoc of groupsSnap.docs) {
        try {
            const members = (_d = (_c = groupDoc.data()) === null || _c === void 0 ? void 0 : _c.members) !== null && _d !== void 0 ? _d : [];
            if (!members.length) {
                firebase_functions_1.logger.warn(`Group ${groupDoc.id} | no members, skipping.`);
                continue;
            }
            const durations = await Promise.all(members.map(getCachedDuration));
            const shortestDurationDays = Math.min(...durations);
            const cutoffTimestamp = firestore_1.Timestamp.fromMillis(Date.now() - shortestDurationDays * 86400000);
            firebase_functions_1.logger.info(`Group ${groupDoc.id} | members: ${members.length} | shortest: ${shortestDurationDays}d | cutoff: ${cutoffTimestamp.toDate().toISOString()}`);
            const chatRef = db.collection('chats').doc(groupDoc.id);
            const deleted = await deleteOldMessages(chatRef, cutoffTimestamp);
            if (deleted > 0) {
                firebase_functions_1.logger.info(`Group ${groupDoc.id} | total deleted: ${deleted}`);
                totalDeletedCount += deleted;
            }
        }
        catch (error) {
            firebase_functions_1.logger.error(`Failed to process group ${groupDoc.id}:`, error);
        }
    }
    firebase_functions_1.logger.info(`Cleanup complete. Total deleted across all chats: ${totalDeletedCount}`);
    return null;
});
//# sourceMappingURL=disappearingMessages.js.map