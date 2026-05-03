import * as v1 from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { logger } from "firebase-functions";

const db = admin.firestore();

const leaderboardAccolades = [
    'top_1_follower', 'top_2_follower', 'top_3_follower',
    'top_4_follower', 'top_5_follower'
];

export const updateAccolades = v1.pubsub
    .schedule('36 23 * * *')
    .timeZone('Asia/Kolkata')
    .onRun(async () => {
    logger.info('Starting daily leaderboard update.');

    try {
        const batch = db.batch();
        const leaderboardRef = db.collection('system').doc('leaderboard');

        // 1. Fetch previous top 5 and new top 5 in parallel
        const [leaderboardDoc, newTopUsersSnap] = await Promise.all([
            leaderboardRef.get(),
            db.collection('users').orderBy('Follower_Count', 'desc').limit(5).get()
        ]);

        const oldTopUserIds: string[] = leaderboardDoc.exists
            ? leaderboardDoc.data()?.ids ?? []
            : [];
        const newTopUserIds = newTopUsersSnap.docs.map(doc => doc.id);

        // 2. Demote users who fell out of top 5
        const usersToDemote = oldTopUserIds.filter(id => !newTopUserIds.includes(id));
        for (const userId of usersToDemote) {
            logger.info(`Demoting ${userId} — no longer in top 5.`);
            batch.update(db.collection('users').doc(userId), {
                accolades: admin.firestore.FieldValue.arrayRemove(...leaderboardAccolades)
            });
        }

        // 3. Assign correct badge to new top 5, skip if already correct (saves writes)
        for (let i = 0; i < newTopUsersSnap.docs.length; i++) {
            const userDoc   = newTopUsersSnap.docs[i];
            const userId    = userDoc.id;
            const newBadge  = leaderboardAccolades[i];
            const currentAccolades: string[] = userDoc.data()?.accolades ?? [];

            const alreadyHasCorrectBadge = currentAccolades.includes(newBadge);
            const hasStaleLeaderboardBadge = leaderboardAccolades
                .filter(a => a !== newBadge)
                .some(a => currentAccolades.includes(a));

            if (alreadyHasCorrectBadge && !hasStaleLeaderboardBadge) {
                logger.info(`User ${userId} already has correct badge ${newBadge}. Skipping.`);
                continue;
            }

            logger.info(`Assigning ${newBadge} to ${userId}.`);
            const userRef = db.collection('users').doc(userId);
            // Remove any stale leaderboard badge and add the correct one in one atomic batch
            const staleOnes = leaderboardAccolades.filter(a => a !== newBadge);
            batch.update(userRef, {
                accolades: admin.firestore.FieldValue.arrayRemove(...staleOnes)
            });
            batch.update(userRef, {
                accolades: admin.firestore.FieldValue.arrayUnion(newBadge)
            });
        }

        // 4. Persist new top 5 list
        batch.set(leaderboardRef, { ids: newTopUserIds });

        await batch.commit();
        logger.info('Daily leaderboard update complete.');
        return null;

    } catch (error) {
        logger.error('Error in leaderboard update:', error);
        return null;
    }
});