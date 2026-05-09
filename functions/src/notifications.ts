import * as admin from "firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import * as v1 from "firebase-functions/v1";

const db = admin.firestore();
const messaging = admin.messaging();

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface NotificationData {
    type: string;
    targetId: string;
    [key: string]: string;
}

interface NotificationSettings {
    messages?: boolean;
    follows?: boolean;
    drops?: boolean;
    comments?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Rate limiting
// Pushes with the same rateLimitKey are throttled to 1 per 60 seconds.
// The Firestore notification doc is ALWAYS written — only FCM push is throttled.
// ─────────────────────────────────────────────────────────────────────────────

const RATE_LIMIT_SECONDS = 60;

async function isPushRateLimited(userId: string, key: string): Promise<boolean> {
    const ref = db
        .collection('users')
        .doc(userId)
        .collection('_notifRateLimit')
        .doc(key);

    const now = Timestamp.now();
    const cutoff = Timestamp.fromMillis(now.toMillis() - RATE_LIMIT_SECONDS * 1000);
    const snap = await ref.get();

    if (snap.exists && snap.data()!.lastSent.toMillis() > cutoff.toMillis()) {
        return true;
    }

    await ref.set({ lastSent: now });
    return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Core sender
// ─────────────────────────────────────────────────────────────────────────────

export async function sendNotification(
    userId: string,
    title: string,
    body: string,
    data: NotificationData,
    options: {
        /** Deterministic doc ID prevents duplicate notifications on retries */
        dedupId?: string;
        /** Pushes with the same key are throttled to 1 per 60s */
        rateLimitKey?: string;
    } = {}
) {
    try {
        // 1. Load user + check notification preferences
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();
        if (!userData) return;

        const settings: NotificationSettings = userData.notificationSettings ?? {};
        const typeMap: Record<string, keyof NotificationSettings> = {
            message: 'messages',
            profile: 'follows',
            drop:    'drops',
            comment: 'comments',
        };
        const settingKey = typeMap[data.type];
        if (settingKey && settings[settingKey] === false) {
            logger.info(`User ${userId} muted '${data.type}' notifications. Skipping.`);
            return;
        }

        // 2. Write to Firestore subcollection (always written, with dedup support)
        // expiresAt: 30 days — also set a Firestore TTL policy on this field
        // in Firebase Console → Firestore → TTL policies → collection group: notifications
        const expiresAt = Timestamp.fromMillis(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const notifCollection = db.collection('users').doc(userId).collection('notifications');
        const notifRef = options.dedupId ? notifCollection.doc(options.dedupId) : notifCollection.doc();

        await notifRef.set({
            title,
            body,
            data,
            isRead: false,
            createdAt: FieldValue.serverTimestamp(),
            expiresAt,
        }, { merge: true }); // merge: true so dedup rewrites cleanly without error

        // 3. Resolve FCM tokens (multi-device: fcmTokens[] with fcmToken fallback)
        const fcmTokens: string[] = userData.fcmTokens ?? (userData.fcmToken ? [userData.fcmToken] : []);
        if (fcmTokens.length === 0) {
            logger.info(`No FCM tokens for user ${userId}. Notification saved to Firestore only.`);
            return;
        }

        // 4. Rate limit check (only throttles push, Firestore write already done above)
        if (options.rateLimitKey) {
            const limited = await isPushRateLimited(userId, options.rateLimitKey);
            if (limited) {
                logger.info(`Push rate-limited for user ${userId}, key: ${options.rateLimitKey}`);
                return;
            }
        }

        // 5. Send to all devices
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

        // 6. Remove stale/invalid tokens automatically
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

// ─────────────────────────────────────────────────────────────────────────────
// Triggers
// ─────────────────────────────────────────────────────────────────────────────

// FOLLOW
// dedupId: "follow_{followerId}" — retries and double-follow edge cases won't
// create duplicate notification docs
export const onNewFollowerNotification = v1.firestore
    .document('users/{userId}/followers/{followerId}')
    .onCreate(async (snap, context) => {
        const { userId, followerId } = context.params;
        const followerSnap = await db.collection('users').doc(followerId).get();
        const followerName = followerSnap.data()?.name || 'Someone';

        await sendNotification(
            userId,
            'New Follower!',
            `${followerName} is now following your squad.`,
            { type: 'profile', targetId: followerId },
            {
                dedupId: `follow_${followerId}`,
                rateLimitKey: `follow_${followerId}`,
            }
        );
    });

// MESSAGE
// Reads participants[] from chat doc — works for 1:1 AND group chats
// Falls back to splitting the chatId for legacy format
// Rate-limited per chat: 100 rapid messages = 1 push per 60s
export const onNewMessageNotification = v1.firestore
    .document('chats/{chatId}/messages/{messageId}')
    .onCreate(async (snap, context) => {
        const message = snap.data();
        const { chatId, messageId } = context.params;
        const senderId: string = message.sender;

        const chatDoc = await db.collection('chats').doc(chatId).get();
        const participants: string[] = chatDoc.data()?.participants ?? [];

        // Fallback for legacy "uid1_uid2" IDs
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
                    { type: 'message', targetId: chatId },
                    {
                        dedupId: `message_${messageId}`,
                        rateLimitKey: `chat_${chatId}`,
                    }
                )
            )
        );
    });

// DROP PROMPT
// Uses FCM topic instead of loading all users — scales to millions for free.
//
// To subscribe users to this topic, call this when they save their FCM token:
//   await messaging.subscribeToTopic(token, 'drop_prompts');
// And unsubscribe on logout:
//   await messaging.unsubscribeFromTopic(token, 'drop_prompts');
export const onNewDropPromptNotification = v1.firestore
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