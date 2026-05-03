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
exports.updateAccolades = void 0;
const v1 = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const firebase_functions_1 = require("firebase-functions");
const db = admin.firestore();
const leaderboardAccolades = [
    'top_1_follower', 'top_2_follower', 'top_3_follower',
    'top_4_follower', 'top_5_follower'
];
exports.updateAccolades = v1.pubsub
    .schedule('36 23 * * *')
    .timeZone('Asia/Kolkata')
    .onRun(async () => {
    var _a, _b, _c, _d;
    firebase_functions_1.logger.info('Starting daily leaderboard update.');
    try {
        const batch = db.batch();
        const leaderboardRef = db.collection('system').doc('leaderboard');
        // 1. Fetch previous top 5 and new top 5 in parallel
        const [leaderboardDoc, newTopUsersSnap] = await Promise.all([
            leaderboardRef.get(),
            db.collection('users').orderBy('Follower_Count', 'desc').limit(5).get()
        ]);
        const oldTopUserIds = leaderboardDoc.exists
            ? (_b = (_a = leaderboardDoc.data()) === null || _a === void 0 ? void 0 : _a.ids) !== null && _b !== void 0 ? _b : []
            : [];
        const newTopUserIds = newTopUsersSnap.docs.map(doc => doc.id);
        // 2. Demote users who fell out of top 5
        const usersToDemote = oldTopUserIds.filter(id => !newTopUserIds.includes(id));
        for (const userId of usersToDemote) {
            firebase_functions_1.logger.info(`Demoting ${userId} — no longer in top 5.`);
            batch.update(db.collection('users').doc(userId), {
                accolades: admin.firestore.FieldValue.arrayRemove(...leaderboardAccolades)
            });
        }
        // 3. Assign correct badge to new top 5, skip if already correct (saves writes)
        for (let i = 0; i < newTopUsersSnap.docs.length; i++) {
            const userDoc = newTopUsersSnap.docs[i];
            const userId = userDoc.id;
            const newBadge = leaderboardAccolades[i];
            const currentAccolades = (_d = (_c = userDoc.data()) === null || _c === void 0 ? void 0 : _c.accolades) !== null && _d !== void 0 ? _d : [];
            const alreadyHasCorrectBadge = currentAccolades.includes(newBadge);
            const hasStaleLeaderboardBadge = leaderboardAccolades
                .filter(a => a !== newBadge)
                .some(a => currentAccolades.includes(a));
            if (alreadyHasCorrectBadge && !hasStaleLeaderboardBadge) {
                firebase_functions_1.logger.info(`User ${userId} already has correct badge ${newBadge}. Skipping.`);
                continue;
            }
            firebase_functions_1.logger.info(`Assigning ${newBadge} to ${userId}.`);
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
        firebase_functions_1.logger.info('Daily leaderboard update complete.');
        return null;
    }
    catch (error) {
        firebase_functions_1.logger.error('Error in leaderboard update:', error);
        return null;
    }
});
//# sourceMappingURL=updateAccolades.js.map