import * as v1 from "firebase-functions/v1";
import * as admin from "firebase-admin";
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

export const cleanupDisappearingMessages = v1
    .runWith({ timeoutSeconds: 540, memory: '512MB' })
    .pubsub.schedule('50 18 * * *')
    .timeZone('Asia/Kolkata')
    .onRun(async () => {
        logger.info('Starting scheduled cleanup of disappearing messages.');

        const chatsSnap = await db.collection('chats').get();
        logger.info(`Total chats found: ${chatsSnap.size}`);

        if (chatsSnap.empty) {
            logger.info('No chats found to process.');
            return null;
        }

        const durationCache = new Map<string, number>();

        async function getCachedDuration(uid: string): Promise<number> {
            if (durationCache.has(uid)) return durationCache.get(uid)!;
            const d = await getUserDuration(uid);
            durationCache.set(uid, d);
            return d;
        }

        let totalDeletedCount = 0;

        for (const chatDoc of chatsSnap.docs) {
            try {
                const participants: string[] = chatDoc.data()?.participants ?? [];
                if (!participants.length) continue;

                const durations = await Promise.all(participants.map(getCachedDuration));
                const shortestDurationDays = Math.min(...durations);

                const cutoffTimestamp = admin.firestore.Timestamp.fromMillis(
                    Date.now() - shortestDurationDays * 86400000
                );

                logger.info(`Chat ${chatDoc.id} | participants: ${participants} | durations: ${durations} | shortest: ${shortestDurationDays}d | cutoff: ${cutoffTimestamp.toDate().toISOString()}`);

                const oldMessagesQuery = chatDoc.ref
                    .collection('messages')
                    .where('createdAt', '<', cutoffTimestamp)
                    .orderBy('createdAt');

                let deletedInChat = 0;
                let lastDoc: admin.firestore.QueryDocumentSnapshot | null = null;

                while (true) {
                    let query = oldMessagesQuery.limit(500);
                    if (lastDoc) query = query.startAfter(lastDoc);

                    const snap = await query.get();
                    logger.info(`Chat ${chatDoc.id} | old messages in page: ${snap.size}`);

                    if (snap.empty) break;

                    const nextCursor = snap.docs[snap.docs.length - 1];

                    const batch = db.batch();
                    let ops = 0;

                    snap.forEach(msgDoc => {
                        if (msgDoc.data().isStarred !== true) {
                            batch.delete(msgDoc.ref);
                            ops++;
                            deletedInChat++;
                        }
                    });

                    if (ops === 0) {
                        logger.warn(`Chat ${chatDoc.id} | no deletable messages in page`);
                        break;
                    }

                    await batch.commit();
                    logger.info(`Chat ${chatDoc.id} | batch committed: ${ops} deletions`);

                    lastDoc = nextCursor;

                    if (snap.size < 500) break;
                }

                if (deletedInChat > 0) {
                    logger.info(`Chat ${chatDoc.id} | total deleted: ${deletedInChat}`);
                    totalDeletedCount += deletedInChat;
                }

            } catch (error) {
                logger.error(`Failed to process chat ${chatDoc.id}:`, error);
            }
        }

        logger.info(`Cleanup complete. Total deleted across all chats: ${totalDeletedCount}`);
        return null;
    });