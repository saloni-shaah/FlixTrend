import * as admin from "firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import * as v1 from "firebase-functions/v1";

const db = admin.firestore();
const messaging = admin.messaging();

const ASIA_SOUTH1 = v1.region('asia-south1');

interface NotificationData {
    type: string;
    targetId: string;
    [key: string]: string | boolean | null | undefined;
}

interface NotificationSettings {
    messages?: boolean;
    follows?: boolean;
    drops?: boolean;
    comments?: boolean;
}

const RATE_LIMIT_SECONDS = 60;
const rateLimitCache = new Map<string, number>();

async function isPushRateLimited(userId: string, key: string): Promise<boolean> {
    const cacheKey = `${userId}:${key}`;
    const cached = rateLimitCache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached < RATE_LIMIT_SECONDS * 1000) return true;

    const ref = db
        .collection('users')
        .doc(userId)
        .collection('_notifRateLimit')
        .doc(key);
    const snap = await ref.get();

    if (snap.exists) {
        const lastSent = snap.data()!.lastSent?.toMillis?.() ?? 0;
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

function buildNotificationDeepLink(type: string, data: NotificationData) {
    if (data.link) return data.link;

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

export async function sendNotification(
    userId: string,
    title: string,
    body: string,
    data: NotificationData,
    options: {
        dedupId?: string;
        rateLimitKey?: string;
    } = {}
) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();
        if (!userData) {
            logger.warn(`User doc not found for ${userId} — skipping notification`);
            return;
        }

        const isOnline = String(userData.status ?? '').toLowerCase() === 'online';
        const settings: NotificationSettings = userData.notificationSettings ?? {};
        const typeMap: Record<string, keyof NotificationSettings> = {
            message: 'messages',
            profile: 'follows',
            drop:    'drops',
            comment: 'comments',
        };
        const settingKey = typeMap[data.type];
        if (!settingKey && data.type !== 'accolade') {
            logger.warn(`Unknown notification type: ${data.type}`);
        }
        if (settingKey && settings[settingKey] === false) {
            logger.info(`User ${userId} muted '${data.type}' notifications. Skipping.`);
            return;
        }

        const expiresAt = Timestamp.fromMillis(Date.now() + 30 * 24 * 60 * 60 * 1000);
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
            createdAt: FieldValue.serverTimestamp(),
            expiresAt,
        }, { merge: true });

        if (isOnline) {
            logger.info(`User ${userId} is online; saved notification only.`);
            return;
        }

        const fcmTokens: string[] = userData.fcmTokens ?? (userData.fcmToken ? [userData.fcmToken] : []);
        if (fcmTokens.length === 0) {
            logger.info(`No FCM tokens for user ${userId}. Notification saved to Firestore only.`);
            return;
        }

        if (options.rateLimitKey) {
            const limited = await isPushRateLimited(userId, options.rateLimitKey);
            if (limited) {
                logger.info(`Push rate-limited for user ${userId}, key: ${options.rateLimitKey}`);
                return;
            }
        }

        const message: admin.messaging.MulticastMessage = {
            tokens: fcmTokens,
            notification: { title, body },
            data: { ...data, click_action: 'FLIXTREND_NOTIFICATION_CLICK' },
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
            logger.error(`All FCM sends failed for user ${userId}`, 
            response.responses.map(r => r.error?.code));
        }

        const staleTokens = fcmTokens.filter((_, idx) => {
            const err = response.responses[idx]?.error?.code;
            return (
                err === 'messaging/registration-token-not-registered' ||
                err === 'messaging/invalid-registration-token'
            );
        });

        if (staleTokens.length > 0) {
            await db.collection('users').doc(userId).update({
                fcmTokens: FieldValue.arrayRemove(...staleTokens),
            });
            logger.info(`Removed ${staleTokens.length} stale tokens for user ${userId}`);
        }

        logger.info(`Notification sent to ${userId}: ${response.successCount}/${fcmTokens.length} devices`);
    } catch (error) {
        logger.error(`Error sending notification to user ${userId}:`, error);
    }
}

export const onNewFollowerNotification = ASIA_SOUTH1.firestore
    .document('users/{userId}/followers/{followerId}')
    .onCreate(async (snap, context) => {
        const { userId, followerId } = context.params;
        const followerSnap = await db.collection('users').doc(followerId).get();
        const followerName = followerSnap.data()?.name || 'Someone';

        await sendNotification(
            userId,
            'New Follower!',
            `${followerName} is now following your squad.`,
            {
                type: 'profile',
                targetId: followerId,
                targetUsername: followerSnap.data()?.username || followerSnap.data()?.name || followerId,
                link: followerSnap.data()?.username ? `/squad/${followerSnap.data()!.username}` : `/squad/${followerId}`,
            },
            {
                dedupId: `follow_${followerId}`,
                rateLimitKey: `follow_${followerId}`,
            }
        );
    });

export const onNewMessageNotification = ASIA_SOUTH1.firestore
    .document('chats/{chatId}/messages/{messageId}')
    .onCreate(async (snap, context) => {
        const message = snap.data();
        const { chatId, messageId } = context.params;
        const senderId: string = message.sender;

        const chatDoc = await db.collection('chats').doc(chatId).get();
        const participants: string[] = chatDoc.data()?.participants ?? [];

        const resolved = participants.length > 0
            ? participants
            : chatId.includes('_') ? chatId.split('_') : [];

        const recipientIds = resolved.filter((id: string) => id !== senderId);
        if (recipientIds.length === 0) return;

        const senderSnap = await db.collection('users').doc(senderId).get();
        const senderName = senderSnap.data()?.name || 'Someone';

        let body = message.text || 'Sent a media message';
        if (message.type === 'audio') body = '🎙️ Sent a voice message';
        if (message.type === 'image') body = '📷 Sent an image';
        if (message.type === 'video') body = '🎥 Sent a video';

        await Promise.all(
            recipientIds.map((recipientId: string) =>
                sendNotification(
                    recipientId,
                    senderName,
                    body,
                    {
                        type: 'message',
                        targetId: chatId,
                        replyToId: messageId,
                        messageId,
                        link: `/signal/${chatId}`,
                    },
                    {
                        dedupId: `message_${messageId}`,
                        rateLimitKey: `chat_${chatId}`,
                    }
                )
            )
        );
    });

export const onNewDropPromptNotification = ASIA_SOUTH1.firestore
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

        logger.info(`Drop prompt notification sent via topic for prompt ${promptId}`);
    });

export const onCallCreated = ASIA_SOUTH1.firestore
    .document('calls/{callId}')
    .onCreate(async (snap, context) => {
        const callData = snap.data();
        const { callId } = context.params;
        const { callerId, receiverId, type } = callData;

        const callerSnap = await admin.firestore().collection('users').doc(callerId).get();
        const callerName = callerSnap.data()?.name || 'Someone';
        const isVideo = type === 'video';

        const receiverDoc = await admin.firestore().collection('users').doc(receiverId).get();
        const receiverData = receiverDoc.data();
        if (!receiverData) {
            logger.warn(`Receiver ${receiverId} not found for call ${callId}`);
            return;
        }

        const fcmTokens: string[] = receiverData.fcmTokens ?? (receiverData.fcmToken ? [receiverData.fcmToken] : []);
        if (fcmTokens.length === 0) {
            logger.info(`No FCM tokens for receiver ${receiverId}. Call notification skipped.`);
            return;
        }

        const message: admin.messaging.MulticastMessage = {
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
            logger.info(`Call notification sent to ${receiverId}: ${response.successCount}/${fcmTokens.length} devices`);
        } catch (error) {
            logger.error(`Error sending call notification to ${receiverId}:`, error);
        }
    });