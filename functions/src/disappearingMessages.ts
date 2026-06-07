import * as v1 from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions";

const db = admin.firestore();

const VALID_DURATIONS = [1, 7, 21, 30, 90];
const DEFAULT_DURATION_DAYS = 90;

async function getUserDuration(uid: string): Promise<number> {
    try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) return DEFAULT_DURATION_DAYS;
        const settings = userDoc.data()?.settings;
        const duration = Number(settings?.disappearingMessages);
        return VALID_DURATIONS.includes(duration) ? duration : DEFAULT_DURATION_DAYS;
    } catch (error) {
        logger.error(`Error fetching user settings for ${uid}:`, error);
        return DEFAULT_DURATION_DAYS;
    }
}

async function deleteOldMessages(
    chatRef: admin.firestore.DocumentReference,
    cutoffTimestamp: Timestamp
): Promise<number> {
    const oldMessagesQuery = chatRef
        .collection('messages')
        .where('createdAt', '<', cutoffTimestamp)
        .orderBy('createdAt');

    let deletedCount = 0;
    let lastDoc: admin.firestore.QueryDocumentSnapshot | null = null;

    while (true) {
        let query = oldMessagesQuery.limit(500);
        if (lastDoc) query = query.startAfter(lastDoc);

        const snap = await query.get();
        if (snap.empty) break;

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
            logger.info(`Chat ${chatRef.id} | batch committed: ${ops} deletions`);
        }

        lastDoc = nextCursor;
        if (snap.size < 500) break;
    }

    return deletedCount;
}

export const cleanupDisappearingMessages = v1
    .runWith({ timeoutSeconds: 540, memory: '512MB' })
    .pubsub.schedule('50 18 * * *')
    .timeZone('Asia/Kolkata')
    .onRun(async () => {
        logger.info('Starting scheduled cleanup of disappearing messages.');

        const durationCache = new Map<string, number>();

        async function getCachedDuration(uid: string): Promise<number> {
            if (durationCache.has(uid)) return durationCache.get(uid)!;
            const d = await getUserDuration(uid);
            durationCache.set(uid, d);
            return d;
        }

        let totalDeletedCount = 0;

        // ── DM chats ──────────────────────────────────────────────────────
        const allChatsSnap = await db.collection('chats').get();
        const dmDocs = allChatsSnap.docs.filter(doc => !doc.data().isGroup);

        logger.info(`DM chats found: ${dmDocs.length}`);

        for (const chatDoc of dmDocs) {
            try {
                const participants: string[] = chatDoc.data()?.participants ?? [];
                if (!participants.length) {
                    logger.warn(`DM ${chatDoc.id} | no participants, skipping.`);
                    continue;
                }

                const durations = await Promise.all(participants.map(getCachedDuration));
                const shortestDurationDays = Math.min(...durations);
                const cutoffTimestamp = Timestamp.fromMillis(
                    Date.now() - shortestDurationDays * 86400000
                );

                logger.info(`DM ${chatDoc.id} | shortest: ${shortestDurationDays}d | cutoff: ${cutoffTimestamp.toDate().toISOString()}`);

                const deleted = await deleteOldMessages(chatDoc.ref, cutoffTimestamp);
                if (deleted > 0) {
                    logger.info(`DM ${chatDoc.id} | total deleted: ${deleted}`);
                    totalDeletedCount += deleted;
                }
            } catch (error) {
                logger.error(`Failed to process DM ${chatDoc.id}:`, error);
            }
        }

        // ── Group chats ───────────────────────────────────────────────────
        const groupsSnap = await db.collection('groups').get();
        logger.info(`Group chats found: ${groupsSnap.size}`);

        for (const groupDoc of groupsSnap.docs) {
            try {
                const members: string[] = groupDoc.data()?.members ?? [];
                if (!members.length) {
                    logger.warn(`Group ${groupDoc.id} | no members, skipping.`);
                    continue;
                }

                const durations = await Promise.all(members.map(getCachedDuration));
                const shortestDurationDays = Math.min(...durations);
                const cutoffTimestamp = Timestamp.fromMillis(
                    Date.now() - shortestDurationDays * 86400000
                );

                logger.info(`Group ${groupDoc.id} | members: ${members.length} | shortest: ${shortestDurationDays}d | cutoff: ${cutoffTimestamp.toDate().toISOString()}`);

                const chatRef = db.collection('chats').doc(groupDoc.id);
                const deleted = await deleteOldMessages(chatRef, cutoffTimestamp);
                if (deleted > 0) {
                    logger.info(`Group ${groupDoc.id} | total deleted: ${deleted}`);
                    totalDeletedCount += deleted;
                }
            } catch (error) {
                logger.error(`Failed to process group ${groupDoc.id}:`, error);
            }
        }

        logger.info(`Cleanup complete. Total deleted across all chats: ${totalDeletedCount}`);
        return null;
    });