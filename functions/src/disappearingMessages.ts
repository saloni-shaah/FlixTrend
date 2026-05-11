import * as v1 from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { logger } from "firebase-functions";

const db = admin.firestore();

// Valid disappearing message durations in days
const VALID_DURATIONS = [1, 7, 21, 30, 90];
const DEFAULT_DURATION_DAYS = 90;

export const cleanupDisappearingMessages = v1.pubsub
    .schedule('0 3 * * *') // 3:00 AM daily
    .timeZone('Asia/Kolkata')
    .onRun(async () => {
        logger.info('Starting disappearing messages cleanup.');

        const chatsSnap = await db.collection('chats').get();

        if (chatsSnap.empty) {
            logger.info('No chats found.');
            return null;
        }

        let totalDeleted = 0;

        for (const chatDoc of chatsSnap.docs) {
            try {
                const chatData = chatDoc.data();

                // Read duration in days — fallback to 90 if missing or invalid
                const rawDuration = chatData?.disappearingMessages?.duration;
                const durationDays: number =
                    typeof rawDuration === 'number' && VALID_DURATIONS.includes(rawDuration)
                        ? rawDuration
                        : DEFAULT_DURATION_DAYS;

                // Calculate cutoff timestamp
                const cutoffMs = Date.now() - durationDays * 24 * 60 * 60 * 1000;
                const cutoff = admin.firestore.Timestamp.fromMillis(cutoffMs);

                // Query messages older than cutoff, excluding starred ones
                // Firestore can't do != on a field that may not exist,
                // so we fetch expired messages and filter isStarred client-side
                const messagesRef = chatDoc.ref.collection('messages');

                let lastDoc: admin.firestore.QueryDocumentSnapshot | null = null;
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
                    if (snap.empty) break;

                    const batch = db.batch();
                    let deleteCount = 0;

                    snap.docs.forEach(msgDoc => {
                        // Skip starred messages — user explicitly saved them
                        if (msgDoc.data()?.isStarred === true) return;
                        batch.delete(msgDoc.ref);
                        deleteCount++;
                    });

                    if (deleteCount > 0) {
                        await batch.commit();
                        totalDeleted += deleteCount;
                        batchCount++;
                    }

                    // If we got less than 500, we've reached the end
                    if (snap.size < 500) break;
                    lastDoc = snap.docs[snap.docs.length - 1];
                }

                if (batchCount > 0) {
                    logger.info(`Chat ${chatDoc.id}: deleted messages older than ${durationDays} days (${batchCount} batch(es)).`);
                }

            } catch (error) {
                // One chat failing won't stop others
                logger.error(`Error processing chat ${chatDoc.id}:`, error);
            }
        }

        logger.info(`Cleanup complete. Total messages deleted: ${totalDeleted}.`);
        return null;
    });