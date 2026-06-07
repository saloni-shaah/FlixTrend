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
const followerTiers = [
    { name: "legend", count: 10000000 },
    { name: "icon", count: 1000000 },
    { name: "force", count: 100000 },
    { name: "storm", count: 10000 },
    { name: "hype", count: 1000 },
    { name: "wave", count: 100 },
    { name: "buzz", count: 50 },
    { name: "spark", count: 10 },
];
const likeTiers = [
    { name: "phenomenon", count: 1000000 },
    { name: "sensation", count: 100000 },
    { name: "viral", count: 10000 },
    { name: "adored", count: 1000 },
    { name: "liked", count: 100 },
];
const leaderboardAccolades = [
    "top_1_follower",
    "top_2_follower",
    "top_3_follower",
    "top_4_follower",
    "top_5_follower",
];
function getThresholdAccolades(userData) {
    var _a, _b;
    const followerCount = Number((_a = userData.Follower_Count) !== null && _a !== void 0 ? _a : 0);
    const totalLikes = Number((_b = userData.Total_likes) !== null && _b !== void 0 ? _b : 0);
    return [
        ...followerTiers.filter(tier => followerCount >= tier.count).map(tier => tier.name),
        ...likeTiers.filter(tier => totalLikes >= tier.count).map(tier => tier.name),
    ];
}
exports.updateAccolades = v1.pubsub
    .schedule("36 23 * * *")
    .timeZone("Asia/Kolkata")
    .onRun(async () => {
    firebase_functions_1.logger.info("Starting scheduled accolade reconciliation.");
    try {
        const [topUsersSnap, usersSnap] = await Promise.all([
            db.collection("users").orderBy("Follower_Count", "desc").limit(5).get(),
            db.collection("users").get(),
        ]);
        const leaderboardMap = new Map();
        topUsersSnap.docs.forEach((doc, index) => {
            leaderboardMap.set(doc.id, leaderboardAccolades[index]);
        });
        const batchSize = 450;
        let batch = db.batch();
        let writes = 0;
        let updatedUsers = 0;
        const flushBatch = async () => {
            if (writes === 0)
                return;
            await batch.commit();
            batch = db.batch();
            writes = 0;
        };
        for (const userDoc of usersSnap.docs) {
            const userData = userDoc.data();
            const currentAccolades = Array.isArray(userData.accolades) ? userData.accolades : [];
            const thresholdAccolades = getThresholdAccolades(userData);
            const nonLeaderboardAccolades = currentAccolades.filter(badge => !leaderboardAccolades.includes(badge));
            const desiredAccolades = new Set([
                ...nonLeaderboardAccolades,
                ...thresholdAccolades,
            ]);
            const leaderboardBadge = leaderboardMap.get(userDoc.id);
            if (leaderboardBadge) {
                desiredAccolades.add(leaderboardBadge);
            }
            const nextAccolades = [...desiredAccolades].sort();
            const currentSorted = [...currentAccolades].sort();
            const needsUpdate = nextAccolades.length !== currentSorted.length
                || nextAccolades.some((badge, index) => badge !== currentSorted[index]);
            if (!needsUpdate)
                continue;
            batch.update(userDoc.ref, {
                accolades: nextAccolades,
            });
            writes += 1;
            updatedUsers += 1;
            if (writes >= batchSize) {
                await flushBatch();
            }
        }
        await flushBatch();
        firebase_functions_1.logger.info(`Scheduled accolade reconciliation complete. Updated ${updatedUsers} users.`);
        return null;
    }
    catch (error) {
        firebase_functions_1.logger.error("Error in scheduled accolade reconciliation:", error);
        return null;
    }
});
//# sourceMappingURL=updateAccolades.js.map