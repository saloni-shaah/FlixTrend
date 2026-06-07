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
exports.onCallCreated = exports.onNewDropPromptNotification = exports.onNewMessageNotification = exports.onNewFollowerNotification = exports.sendNotification = void 0;
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const firebase_functions_1 = require("firebase-functions");
const v1 = __importStar(require("firebase-functions/v1"));
const db = admin.firestore();
const messaging = admin.messaging();
const ASIA_SOUTH1 = v1.region('asia-south1');
const RATE_LIMIT_SECONDS = 60;
const rateLimitCache = new Map();
async function isPushRateLimited(userId, key) {
    var _a, _b, _c;
    const cacheKey = `${userId}:${key}`;
    const cached = rateLimitCache.get(cacheKey);
    const now = Date.now();
    if (cached && now - cached < RATE_LIMIT_SECONDS * 1000)
        return true;
    const ref = db
        .collection('users')
        .doc(userId)
        .collection('_notifRateLimit')
        .doc(key);
    const snap = await ref.get();
    if (snap.exists) {
        const lastSent = (_c = (_b = (_a = snap.data().lastSent) === null || _a === void 0 ? void 0 : _a.toMillis) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : 0;
        if (lastSent > now - RATE_LIMIT_SECONDS * 1000) {
            rateLimitCache.set(cacheKey, now);
            return true;
        }
        await ref.delete().catch(() => undefined);
    }
    rateLimitCache.set(cacheKey, now);
    await ref.set({
        lastSent: admin.firestore.Timestamp.now(),
        expiresAt: admin.firestore.Timestamp.fromMillis(now + RATE_LIMIT_SECONDS * 1000),
    }, { merge: true });
    return false;
}
function buildNotificationDeepLink(type, data) {
    if (data.link)
        return data.link;
    if (type === 'message' && data.targetId) {
        return `/signal/${data.targetId}`;
    }
    if (type === 'profile') {
        const username = data.targetUsername || data.username || data.targetId;
        return username ? `/squad/${username}` : '/squad';
    }
    if (type === 'drop' && data.targetId) {
        return `/drop/${data.targetId}`;
    }
    if (type === 'comment' && data.targetId) {
        return `/post/${data.targetId}`;
    }
    return data.targetId ? `/${data.targetId}` : '/';
}
async function sendNotification(userId, title, body, data, options = {}) {
    var _a, _b, _c;
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();
        if (!userData) {
            firebase_functions_1.logger.warn(`User doc not found for ${userId} — skipping notification`);
            return;
        }
        const isOnline = String((_a = userData.status) !== null && _a !== void 0 ? _a : '').toLowerCase() === 'online';
        const settings = (_b = userData.notificationSettings) !== null && _b !== void 0 ? _b : {};
        const typeMap = {
            message: 'messages',
            profile: 'follows',
            drop: 'drops',
            comment: 'comments',
        };
        const settingKey = typeMap[data.type];
        if (!settingKey && data.type !== 'accolade') {
            firebase_functions_1.logger.warn(`Unknown notification type: ${data.type}`);
        }
        if (settingKey && settings[settingKey] === false) {
            firebase_functions_1.logger.info(`User ${userId} muted '${data.type}' notifications. Skipping.`);
            return;
        }
        const expiresAt = firestore_1.Timestamp.fromMillis(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const notifCollection = db.collection('users').doc(userId).collection('notifications');
        const notifRef = options.dedupId ? notifCollection.doc(options.dedupId) : notifCollection.doc();
        const deepLink = buildNotificationDeepLink(data.type, data);
        await notifRef.set({
            title,
            body,
            data,
            link: deepLink,
            actions: {
                open: deepLink,
                read: true,
                reply: data.type === 'message',
                markAsRead: true,
            },
            isRead: false,
            createdAt: firestore_1.FieldValue.serverTimestamp(),
            expiresAt,
        }, { merge: true });
        if (isOnline) {
            firebase_functions_1.logger.info(`User ${userId} is online; saved notification only.`);
            return;
        }
        const fcmTokens = (_c = userData.fcmTokens) !== null && _c !== void 0 ? _c : (userData.fcmToken ? [userData.fcmToken] : []);
        if (fcmTokens.length === 0) {
            firebase_functions_1.logger.info(`No FCM tokens for user ${userId}. Notification saved to Firestore only.`);
            return;
        }
        if (options.rateLimitKey) {
            const limited = await isPushRateLimited(userId, options.rateLimitKey);
            if (limited) {
                firebase_functions_1.logger.info(`Push rate-limited for user ${userId}, key: ${options.rateLimitKey}`);
                return;
            }
        }
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
        if (response.successCount === 0) {
            firebase_functions_1.logger.error(`All FCM sends failed for user ${userId}`, response.responses.map(r => { var _a; return (_a = r.error) === null || _a === void 0 ? void 0 : _a.code; }));
        }
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
exports.onNewFollowerNotification = ASIA_SOUTH1.firestore
    .document('users/{userId}/followers/{followerId}')
    .onCreate(async (snap, context) => {
    var _a, _b, _c, _d;
    const { userId, followerId } = context.params;
    const followerSnap = await db.collection('users').doc(followerId).get();
    const followerName = ((_a = followerSnap.data()) === null || _a === void 0 ? void 0 : _a.name) || 'Someone';
    await sendNotification(userId, 'New Follower!', `${followerName} is now following your squad.`, {
        type: 'profile',
        targetId: followerId,
        targetUsername: ((_b = followerSnap.data()) === null || _b === void 0 ? void 0 : _b.username) || ((_c = followerSnap.data()) === null || _c === void 0 ? void 0 : _c.name) || followerId,
        link: ((_d = followerSnap.data()) === null || _d === void 0 ? void 0 : _d.username) ? `/squad/${followerSnap.data().username}` : `/squad/${followerId}`,
    }, {
        dedupId: `follow_${followerId}`,
        rateLimitKey: `follow_${followerId}`,
    });
});
exports.onNewMessageNotification = ASIA_SOUTH1.firestore
    .document('chats/{chatId}/messages/{messageId}')
    .onCreate(async (snap, context) => {
    var _a, _b, _c;
    const message = snap.data();
    const { chatId, messageId } = context.params;
    const senderId = message.sender;
    const chatDoc = await db.collection('chats').doc(chatId).get();
    const participants = (_b = (_a = chatDoc.data()) === null || _a === void 0 ? void 0 : _a.participants) !== null && _b !== void 0 ? _b : [];
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
    await Promise.all(recipientIds.map((recipientId) => sendNotification(recipientId, senderName, body, {
        type: 'message',
        targetId: chatId,
        replyToId: messageId,
        messageId,
        link: `/signal/${chatId}`,
    }, {
        dedupId: `message_${messageId}`,
        rateLimitKey: `chat_${chatId}`,
    })));
});
exports.onNewDropPromptNotification = ASIA_SOUTH1.firestore
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
exports.onCallCreated = ASIA_SOUTH1.firestore
    .document('calls/{callId}')
    .onCreate(async (snap, context) => {
    var _a, _b;
    const callData = snap.data();
    const { callId } = context.params;
    const { callerId, receiverId, type } = callData;
    const callerSnap = await admin.firestore().collection('users').doc(callerId).get();
    const callerName = ((_a = callerSnap.data()) === null || _a === void 0 ? void 0 : _a.name) || 'Someone';
    const isVideo = type === 'video';
    const receiverDoc = await admin.firestore().collection('users').doc(receiverId).get();
    const receiverData = receiverDoc.data();
    if (!receiverData) {
        firebase_functions_1.logger.warn(`Receiver ${receiverId} not found for call ${callId}`);
        return;
    }
    const fcmTokens = (_b = receiverData.fcmTokens) !== null && _b !== void 0 ? _b : (receiverData.fcmToken ? [receiverData.fcmToken] : []);
    if (fcmTokens.length === 0) {
        firebase_functions_1.logger.info(`No FCM tokens for receiver ${receiverId}. Call notification skipped.`);
        return;
    }
    const message = {
        tokens: fcmTokens,
        data: {
            type: 'call',
            callId,
            callerName,
            isVideo: String(isVideo),
            title: isVideo ? 'Incoming Video Call' : 'Incoming Voice Call',
            body: `${callerName} is calling you...`,
        },
        android: {
            priority: 'high',
        },
        apns: {
            payload: {
                aps: {
                    alert: {
                        title: isVideo ? 'Incoming Video Call' : 'Incoming Voice Call',
                        body: `${callerName} is calling you...`,
                    },
                    sound: 'default',
                    category: 'CALL_CATEGORY',
                },
            },
        },
    };
    try {
        const response = await messaging.sendEachForMulticast(message);
        firebase_functions_1.logger.info(`Call notification sent to ${receiverId}: ${response.successCount}/${fcmTokens.length} devices`);
    }
    catch (error) {
        firebase_functions_1.logger.error(`Error sending call notification to ${receiverId}:`, error);
    }
});
//# sourceMappingURL=notifications.js.map