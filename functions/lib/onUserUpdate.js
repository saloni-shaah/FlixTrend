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
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
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
exports.onUserUpdate = functions
    .firestore
    .document("users/{userId}")
    .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (!before || !after)
        return null;
    if (before.Follower_Count === after.Follower_Count &&
        before.Total_likes === after.Total_likes) {
        return null;
    }
    const currentAccolades = Array.isArray(after.accolades)
        ? after.accolades
        : [];
    const foundAccolades = [];
    const beforeFollowers = before.Follower_Count || 0;
    const afterFollowers = after.Follower_Count || 0;
    if (afterFollowers > beforeFollowers) {
        for (const tier of followerTiers) {
            if (beforeFollowers < tier.count &&
                afterFollowers >= tier.count &&
                !currentAccolades.includes(tier.name)) {
                foundAccolades.push(tier.name);
            }
        }
    }
    const beforeLikes = before.Total_likes || 0;
    const afterLikes = after.Total_likes || 0;
    if (afterLikes > beforeLikes) {
        for (const tier of likeTiers) {
            if (beforeLikes < tier.count &&
                afterLikes >= tier.count &&
                !currentAccolades.includes(tier.name)) {
                foundAccolades.push(tier.name);
            }
        }
    }
    const newAccolades = [...new Set(foundAccolades)];
    if (newAccolades.length === 0)
        return null;
    functions.logger.info(`Awarding accolades to ${context.params.userId}`, newAccolades);
    await change.after.ref.update({
        accolades: admin.firestore.FieldValue.arrayUnion(...newAccolades),
    });
    return null;
});
//# sourceMappingURL=onUserUpdate.js.map