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
exports.onNewDropPromptNotification = exports.onNewMessageNotification = exports.onNewFollowerNotification = exports.sendNotification = void 0;
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const firebase_functions_1 = require("firebase-functions");
const v1 = __importStar(require("firebase-functions/v1"));
const db = admin.firestore();
const messaging = admin.messaging();
// ─────────────────────────────────────────────────────────────────────────────
// Rate limiting
// Pushes with the same rateLimitKey are throttled to 1 per 60 seconds.
// The Firestore notification doc is ALWAYS written — only FCM push is throttled.
// ─────────────────────────────────────────────────────────────────────────────
const RATE_LIMIT_SECONDS = 60;
async function isPushRateLimited(userId, key) {
    const ref = db
        .collection('users')
        .doc(userId)
        .collection('_notifRateLimit')
        .doc(key);
    const now = firestore_1.Timestamp.now();
    const cutoff = firestore_1.Timestamp.fromMillis(now.toMillis() - RATE_LIMIT_SECONDS * 1000);
    const snap = await ref.get();
    if (snap.exists && snap.data().lastSent.toMillis() > cutoff.toMillis()) {
        return true;
    }
    await ref.set({ lastSent: now });
    return false;
}
// ─────────────────────────────────────────────────────────────────────────────
// Core sender
// ─────────────────────────────────────────────────────────────────────────────
async function sendNotification(userId, title, body, data, options = {}) {
    var _a, _b;
    try {
        // 1. Load user + check notification preferences
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();
        if (!userData)
            return;
        const settings = (_a = userData.notificationSettings) !== null && _a !== void 0 ? _a : {};
        const typeMap = {
            message: 'messages',
            profile: 'follows',
            drop: 'drops',
            comment: 'comments',
        };
        const settingKey = typeMap[data.type];
        if (settingKey && settings[settingKey] === false) {
            firebase_functions_1.logger.info(`User ${userId} muted '${data.type}' notifications. Skipping.`);
            return;
        }
        // 2. Write to Firestore subcollection (always written, with dedup support)
        // expiresAt: 30 days — also set a Firestore TTL policy on this field
        // in Firebase Console → Firestore → TTL policies → collection group: notifications
        const expiresAt = firestore_1.Timestamp.fromMillis(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const notifCollection = db.collection('users').doc(userId).collection('notifications');
        const notifRef = options.dedupId ? notifCollection.doc(options.dedupId) : notifCollection.doc();
        await notifRef.set({
            title,
            body,
            data,
            isRead: false,
            createdAt: firestore_1.FieldValue.serverTimestamp(),
            expiresAt,
        }, { merge: true }); // merge: true so dedup rewrites cleanly without error
        // 3. Resolve FCM tokens (multi-device: fcmTokens[] with fcmToken fallback)
        const fcmTokens = (_b = userData.fcmTokens) !== null && _b !== void 0 ? _b : (userData.fcmToken ? [userData.fcmToken] : []);
        if (fcmTokens.length === 0) {
            firebase_functions_1.logger.info(`No FCM tokens for user ${userId}. Notification saved to Firestore only.`);
            return;
        }
        // 4. Rate limit check (only throttles push, Firestore write already done above)
        if (options.rateLimitKey) {
            const limited = await isPushRateLimited(userId, options.rateLimitKey);
            if (limited) {
                firebase_functions_1.logger.info(`Push rate-limited for user ${userId}, key: ${options.rateLimitKey}`);
                return;
            }
        }
        // 5. Send to all devices
        const message = {
            tokens: fcmTokens,
            notification: { title, body },
            data: Object.assign(Object.assign({}, data), { click_action: 'FLIXTREND_NOTIFICATION_CLICK' }),
            android: {
                priority: 'high',
                notification: {
                    channelId: 'flixtrend_general',
                    clickAction: 'FLIXTREND_NOTIFICATION_CLICK',
                },
            },
            apns: {
                payload: { aps: { sound: 'default' } },
            },
        };
        const response = await messaging.sendEachForMulticast(message);
        // 6. Remove stale/invalid tokens automatically
        const staleTokens = fcmTokens.filter((_, idx) => {
            var _a, _b;
            const err = (_b = (_a = response.responses[idx]) === null || _a === void 0 ? void 0 : _a.error) === null || _b === void 0 ? void 0 : _b.code;
            return (err === 'messaging/registration-token-not-registered' ||
                err === 'messaging/invalid-registration-token');
        });
        if (staleTokens.length > 0) {
            await db.collection('users').doc(userId).update({
                fcmTokens: firestore_1.FieldValue.arrayRemove(...staleTokens),
            });
            firebase_functions_1.logger.info(`Removed ${staleTokens.length} stale tokens for user ${userId}`);
        }
        firebase_functions_1.logger.info(`Notification sent to ${userId}: ${response.successCount}/${fcmTokens.length} devices`);
    }
    catch (error) {
        firebase_functions_1.logger.error(`Error sending notification to user ${userId}:`, error);
    }
}
exports.sendNotification = sendNotification;
// ─────────────────────────────────────────────────────────────────────────────
// Triggers
// ─────────────────────────────────────────────────────────────────────────────
// FOLLOW
// dedupId: "follow_{followerId}" — retries and double-follow edge cases won't
// create duplicate notification docs
exports.onNewFollowerNotification = v1.firestore
    .document('users/{userId}/followers/{followerId}')
    .onCreate(async (snap, context) => {
    var _a;
    const { userId, followerId } = context.params;
    const followerSnap = await db.collection('users').doc(followerId).get();
    const followerName = ((_a = followerSnap.data()) === null || _a === void 0 ? void 0 : _a.name) || 'Someone';
    await sendNotification(userId, 'New Follower!', `${followerName} is now following your squad.`, { type: 'profile', targetId: followerId }, {
        dedupId: `follow_${followerId}`,
        rateLimitKey: `follow_${followerId}`,
    });
});
// MESSAGE
// Reads participants[] from chat doc — works for 1:1 AND group chats
// Falls back to splitting the chatId for legacy format
// Rate-limited per chat: 100 rapid messages = 1 push per 60s
exports.onNewMessageNotification = v1.firestore
    .document('chats/{chatId}/messages/{messageId}')
    .onCreate(async (snap, context) => {
    var _a, _b, _c;
    const message = snap.data();
    const { chatId, messageId } = context.params;
    const senderId = message.sender;
    const chatDoc = await db.collection('chats').doc(chatId).get();
    const participants = (_b = (_a = chatDoc.data()) === null || _a === void 0 ? void 0 : _a.participants) !== null && _b !== void 0 ? _b : [];
    // Fallback for legacy "uid1_uid2" IDs
    const resolved = participants.length > 0
        ? participants
        : chatId.includes('_') ? chatId.split('_') : [];
    const recipientIds = resolved.filter((id) => id !== senderId);
    if (recipientIds.length === 0)
        return;
    const senderSnap = await db.collection('users').doc(senderId).get();
    const senderName = ((_c = senderSnap.data()) === null || _c === void 0 ? void 0 : _c.name) || 'Someone';
    let body = message.text || 'Sent a media message';
    if (message.type === 'audio')
        body = '🎙️ Sent a voice message';
    if (message.type === 'image')
        body = '📷 Sent an image';
    if (message.type === 'video')
        body = '🎥 Sent a video';
    await Promise.all(recipientIds.map((recipientId) => sendNotification(recipientId, senderName, body, { type: 'message', targetId: chatId }, {
        dedupId: `message_${messageId}`,
        rateLimitKey: `chat_${chatId}`,
    })));
});
// DROP PROMPT
// Uses FCM topic instead of loading all users — scales to millions for free.
//
// To subscribe users to this topic, call this when they save their FCM token:
//   await messaging.subscribeToTopic(token, 'drop_prompts');
// And unsubscribe on logout:
//   await messaging.unsubscribeFromTopic(token, 'drop_prompts');
exports.onNewDropPromptNotification = v1.firestore
    .document('dropPrompts/{promptId}')
    .onCreate(async (snap, context) => {
    const prompt = snap.data();
    const promptId = context.params.promptId;
    await messaging.send({
        topic: 'drop_prompts',
        notification: {
            title: 'New Drop Challenge!',
            body: prompt.text,
        },
        data: {
            type: 'drop',
            targetId: promptId,
            click_action: 'FLIXTREND_NOTIFICATION_CLICK',
        },
        android: {
            priority: 'high',
            notification: {
                channelId: 'flixtrend_general',
                clickAction: 'FLIXTREND_NOTIFICATION_CLICK',
            },
        },
        apns: {
            payload: { aps: { sound: 'default' } },
        },
    });
    firebase_functions_1.logger.info(`Drop prompt notification sent via topic for prompt ${promptId}`);
});
//# sourceMappingURL=notifications.js.map