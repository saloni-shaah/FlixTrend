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
exports.onUserUpdate = void 0;
const v1 = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const firebase_functions_1 = require("firebase-functions");
const followerTiers = [
    { name: 'legend', count: 10000000 },
    { name: 'icon', count: 1000000 },
    { name: 'force', count: 100000 },
    { name: 'storm', count: 10000 },
    { name: 'hype', count: 1000 },
    { name: 'wave', count: 100 },
    { name: 'buzz', count: 50 },
    { name: 'spark', count: 10 },
];
const likeTiers = [
    { name: 'phenomenon', count: 1000000 },
    { name: 'sensation', count: 100000 },
    { name: 'viral', count: 10000 },
    { name: 'adored', count: 1000 },
    { name: 'liked', count: 100 },
];
exports.onUserUpdate = v1.firestore
    .document('users/{userId}')
    .onUpdate(async (change, context) => {
    var _a, _b, _c, _d, _e;
    const before = change.before.data();
    const after = change.after.data();
    if (!before || !after) {
        firebase_functions_1.logger.info("User data is missing, skipping update.");
        return null;
    }
    const accoladesToAward = [];
    // 1. Check Follower_Count changes
    const beforeFollowers = (_a = before.Follower_Count) !== null && _a !== void 0 ? _a : 0;
    const afterFollowers = (_b = after.Follower_Count) !== null && _b !== void 0 ? _b : 0;
    if (beforeFollowers !== afterFollowers) {
        firebase_functions_1.logger.info(`Follower count changed for ${context.params.userId}.`);
        followerTiers
            .filter(tier => afterFollowers >= tier.count)
            .forEach(tier => accoladesToAward.push(tier.name));
    }
    // 2. Check Total_likes changes
    const beforeLikes = (_c = before.Total_likes) !== null && _c !== void 0 ? _c : 0;
    const afterLikes = (_d = after.Total_likes) !== null && _d !== void 0 ? _d : 0;
    if (beforeLikes !== afterLikes) {
        firebase_functions_1.logger.info(`Total likes changed for ${context.params.userId}.`);
        likeTiers
            .filter(tier => afterLikes >= tier.count)
            .forEach(tier => accoladesToAward.push(tier.name));
    }
    if (accoladesToAward.length === 0)
        return null;
    // 3. KEY FIX: Only write if there are actually NEW accolades not already on the doc.
    //    This prevents the infinite re-trigger loop from the accolades write itself.
    const currentAccolades = (_e = after.accolades) !== null && _e !== void 0 ? _e : [];
    const newAccolades = accoladesToAward.filter(a => !currentAccolades.includes(a));
    if (newAccolades.length === 0) {
        firebase_functions_1.logger.info(`No new accolades to award for ${context.params.userId}. Skipping write.`);
        return null;
    }
    firebase_functions_1.logger.info(`Awarding ${newAccolades.length} new accolades to ${context.params.userId}: ${newAccolades.join(', ')}`);
    return change.after.ref.update({
        accolades: admin.firestore.FieldValue.arrayUnion(...newAccolades)
    });
});
//# sourceMappingURL=onUserUpdate.js.map