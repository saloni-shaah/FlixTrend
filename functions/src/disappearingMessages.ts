
import * as v1 from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { logger } from "firebase-functions";

const db = admin.firestore();

// These should match the values offered in the client-side settings
const VALID_DURATIONS = [1, 7, 21, 30, 90];
const DEFAULT_DURATION_DAYS = 90;

/**
 * Fetches a user's preferred message duration from their settings.
 * @param {string} uid The user's ID.
 * @returns {Promise<number>} The duration in days.
 */
async function getUserDuration(uid: string): Promise<number> {
    try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            return DEFAULT_DURATION_DAYS;
        }
        const settings = userDoc.data()?.settings;
        const duration = settings?.disappearingMessages;

        // Ensure the value from the database is a valid, recognized duration
        return VALID_DURATIONS.includes(duration) ? duration : DEFAULT_DURATION_DAYS;
    } catch (error) {
        logger.error(`Error fetching user settings for ${uid}:`, error);
        // Fail safely by returning the longest duration
        return DEFAULT_DURATION_DAYS;
    }
}

export const cleanupDisappearingMessages = v1.pubsub
    .schedule('0 3 * * *') // Runs daily at 3:00 AM
    .timeZone('Asia/Kolkata') // Set to your target timezone
    .onRun(async () => {
        logger.info('Starting scheduled cleanup of disappearing messages.');

        const chatsSnap = await db.collection('chats').get();
        if (chatsSnap.empty) {
            logger.info('No chats found to process.');
            return null;
        }

        let totalDeletedCount = 0;

        // Process each chat individually
        for (const chatDoc of chatsSnap.docs) {
            try {
                const chatData = chatDoc.data();
                const participants: string[] = chatData?.participants ?? [];

                if (participants.length === 0) {
                    continue; // Skip chats with no participants
                }

                // Fetch all participant settings concurrently to find the most aggressive (shortest) duration
                const durations = await Promise.all(participants.map(uid => getUserDuration(uid)));
                const shortestDurationDays = Math.min(...durations);

                // Calculate the deletion cutoff timestamp
                const cutoffMs = Date.now() - shortestDurationDays * 24 * 60 * 60 * 1000;
                const cutoffTimestamp = admin.firestore.Timestamp.fromMillis(cutoffMs);

                const messagesRef = chatDoc.ref.collection('messages');
                
                // Query for messages older than the cutoff that are not starred
                const oldMessagesQuery = messagesRef
                    .where('createdAt', '<', cutoffTimestamp)
                    .where('isStarred', '==', false); // Efficiently exclude starred messages
                
                // Use pagination to delete in batches, avoiding memory issues
                let deletedInChat = 0;
                while (true) {
                    const snap = await oldMessagesQuery.limit(500).get();
                    if (snap.empty) {
                        break; // No more messages to delete
                    }

                    const batch = db.batch();
                    snap.forEach(msgDoc => {
                        batch.delete(msgDoc.ref);
                        deletedInChat++;
                    });

                    await batch.commit();

                    if (snap.size < 500) {
                        break; // Last batch
                    }
                }

                if (deletedInChat > 0) {
                    logger.info(`Chat ${chatDoc.id}: Applied ${shortestDurationDays}-day rule. Deleted ${deletedInChat} messages.`);
                    totalDeletedCount += deletedInChat;
                }

            } catch (error) {
                logger.error(`Failed to process chat ${chatDoc.id}:`, error);
            }
        }

        logger.info(`Cleanup complete. Deleted a total of ${totalDeletedCount} messages across all chats.`);
        return null;
    });
