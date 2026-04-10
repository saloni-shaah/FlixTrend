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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decrementLikes = exports.incrementLikes = exports.updateComment = exports.deleteComment = exports.updatePost = exports.deleteMessage = exports.deletePost = exports.deleteUserAccount = exports.checkEmail = exports.checkPhone = exports.checkUsername = exports.cleanupStaleDocuments = exports.cleanupOldDrops = exports.selectNextPrompt = exports.updateAccolades = exports.cleanupExpiredFlashes = exports.onChatDelete = exports.onUserDelete = exports.onNewDropPrompt = exports.onNewFollower = exports.onNewMessage = exports.onCommentCreate = exports.onNewUserCreate = void 0;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const admin = __importStar(require("firebase-admin"));
const v1 = __importStar(require("firebase-functions/v1"));
const https_1 = require("firebase-functions/v2/https");
const firebase_functions_1 = require("firebase-functions");
const storage_1 = require("firebase-admin/storage");
// Initialize Firebase Admin SDK
(0, app_1.initializeApp)();
const db = admin.firestore();
const storage = (0, storage_1.getStorage)();
const messaging = admin.messaging();
// --- Helper Functions ---
async function sendPushNotification(userId, title, body, data = {}) {
    var _a;
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        const fcmToken = (_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.fcmToken;
        if (!fcmToken) {
            firebase_functions_1.logger.info(`No FCM token found for user ${userId}. Skipping notification.`);
            return;
        }
        const message = {
            token: fcmToken,
            notification: { title, body },
            data: Object.assign(Object.assign({}, data), { click_action: "FLIXTREND_NOTIFICATION_CLICK" }),
            android: {
                priority: "high",
                notification: {
                    channelId: "flixtrend_general",
                    clickAction: "FLIXTREND_NOTIFICATION_CLICK",
                }
            }
        };
        await messaging.send(message);
        firebase_functions_1.logger.info(`Notification sent to user ${userId}`);
    }
    catch (error) {
        firebase_functions_1.logger.error(`Error sending notification to user ${userId}:`, error);
    }
}
async function deleteSubcollection(collectionRef) {
    const snapshot = await collectionRef.limit(500).get();
    if (snapshot.empty) {
        return;
    }
    const batch = collectionRef.firestore.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    if (snapshot.size === 500) {
        await deleteSubcollection(collectionRef);
    }
}
// --- V1 Cloud Functions ---
exports.onNewUserCreate = v1.auth.user().onCreate(async (user) => {
    const userRef = db.collection('users').doc(user.uid);
    try {
        const postSnap = await db.collection('posts').where('userId', '==', user.uid).limit(1).get();
        const accolades = [];
        if (!postSnap.empty) {
            accolades.push('vibe_starter');
        }
        const premiumUntil = new Date();
        premiumUntil.setMonth(premiumUntil.getMonth() + 1);
        await userRef.set({
            createdAt: firestore_1.FieldValue.serverTimestamp(),
            profileComplete: false,
            accolades: accolades,
            isPremium: true,
            premiumUntil: firestore_1.Timestamp.fromDate(premiumUntil)
        }, { merge: true });
        const appStatusRef = db.collection('app_status').doc('user_stats');
        await appStatusRef.set({ totalUsers: firestore_1.FieldValue.increment(1) }, { merge: true });
        firebase_functions_1.logger.info(`User document created for ${user.uid}`);
    }
    catch (error) {
        firebase_functions_1.logger.error(`Error processing new user ${user.uid}:`, error);
    }
});
exports.onCommentCreate = v1.firestore
    .document('posts/{postId}/comments/{commentId}')
    .onCreate(async (snap, context) => {
    const { postId } = context.params;
    const postRef = db.collection('posts').doc(postId);
    try {
        await postRef.update({ commentCount: firestore_1.FieldValue.increment(1) });
        firebase_functions_1.logger.info(`Incremented comment count for post ${postId}`);
    }
    catch (error) {
        firebase_functions_1.logger.error(`Error incrementing comment count for post ${postId}:`, error);
    }
});
exports.onNewMessage = v1.firestore
    .document('chats/{chatId}/messages/{messageId}')
    .onCreate(async (snap, context) => {
    var _a;
    const message = snap.data();
    const { chatId } = context.params;
    const senderId = message.sender;
    if (chatId.includes('_')) {
        const recipientId = chatId.split('_').find(id => id !== senderId);
        if (recipientId) {
            const senderSnap = await db.collection('users').doc(senderId).get();
            const senderName = ((_a = senderSnap.data()) === null || _a === void 0 ? void 0 : _a.name) || "Someone";
            let body = message.text || "Sent a media message";
            if (message.type === 'audio')
                body = "🎙️ Sent a voice message";
            if (message.type === 'image')
                body = "📷 Sent an image";
            await sendPushNotification(recipientId, senderName, body, { type: 'message', targetId: chatId });
        }
    }
});
exports.onNewFollower = v1.firestore
    .document('users/{userId}/followers/{followerId}')
    .onCreate(async (snap, context) => {
    var _a;
    const { userId, followerId } = context.params;
    const followerSnap = await db.collection('users').doc(followerId).get();
    const followerName = ((_a = followerSnap.data()) === null || _a === void 0 ? void 0 : _a.name) || "Someone";
    await sendPushNotification(userId, "New Follower!", `${followerName} is now following your squad.`, { type: 'profile', targetId: followerId });
});
exports.onNewDropPrompt = v1.firestore
    .document('dropPrompts/{promptId}')
    .onCreate(async (snap, context) => {
    const prompt = snap.data();
    const usersSnap = await db.collection('users').where('fcmToken', '!=', null).get();
    const notifications = usersSnap.docs.map(userDoc => sendPushNotification(userDoc.id, "New Drop Challenge!", prompt.text, { type: 'drop', targetId: context.params.promptId }));
    await Promise.all(notifications);
});
exports.onUserDelete = v1.auth.user().onDelete(async (user) => {
    firebase_functions_1.logger.info(`User ${user.uid} is being deleted. Cleaning up data.`);
    const userRef = db.collection('users').doc(user.uid);
    await userRef.delete();
});
exports.onChatDelete = v1.firestore
    .document('users/{userId}/deletedChats/{chatId}')
    .onCreate(async (snap, context) => {
    const { chatId } = context.params;
    const chatData = snap.data();
    const participants = chatData.participants || [];
    if (participants.length === 0) {
        firebase_functions_1.logger.info(`Chat ${chatId} has no participants listed. Skipping cleanup.`);
        return;
    }
    const allDeletedChecks = participants.map(async (pId) => {
        const deletedDocRef = db.collection('users').doc(pId).collection('deletedChats').doc(chatId);
        const docSnap = await deletedDocRef.get();
        return docSnap.exists;
    });
    const allDeletedResults = await Promise.all(allDeletedChecks);
    if (allDeletedResults.every(Boolean)) {
        firebase_functions_1.logger.info(`All participants have deleted chat ${chatId}. Purging messages.`);
        const chatMessagesRef = db.collection('chats').doc(chatId).collection('messages');
        await deleteSubcollection(chatMessagesRef);
        firebase_functions_1.logger.info(`Successfully purged messages for chat ${chatId}.`);
    }
    else {
        firebase_functions_1.logger.info(`Chat ${chatId} still active for some participants. Not purging.`);
    }
});
exports.cleanupExpiredFlashes = v1.pubsub.schedule('every 1 hours').onRun(async (context) => {
    firebase_functions_1.logger.info('Running expired flashes cleanup job.');
    const now = firestore_1.Timestamp.now();
    const expiredFlashesQuery = db.collection('flashes').where('expiresAt', '<=', now);
    const expiredFlashesSnap = await expiredFlashesQuery.get();
    if (expiredFlashesSnap.empty) {
        firebase_functions_1.logger.info('No expired flashes to clean up.');
        return null;
    }
    const batch = db.batch();
    const deletePromises = [];
    expiredFlashesSnap.forEach(docSnap => {
        const flashData = docSnap.data();
        batch.delete(docSnap.ref);
        if (flashData.mediaUrl) {
            try {
                const fileUrl = new URL(flashData.mediaUrl);
                const filePath = decodeURIComponent(fileUrl.pathname.split('/').pop() || '');
                if (filePath) {
                    const fileRef = storage.bucket().file(filePath);
                    deletePromises.push(fileRef.delete().catch(err => firebase_functions_1.logger.error(`Failed to delete storage file ${filePath}:`, err)));
                }
            }
            catch (error) {
                firebase_functions_1.logger.error(`Invalid mediaUrl for flash ${docSnap.id}: ${flashData.mediaUrl}`, error);
            }
        }
    });
    deletePromises.push(batch.commit());
    await Promise.all(deletePromises);
    firebase_functions_1.logger.info(`Cleanup complete. Deleted ${expiredFlashesSnap.size} expired flashes.`);
    return null;
});
exports.updateAccolades = v1.pubsub.schedule('every 1 hours').onRun(async (context) => {
    firebase_functions_1.logger.info('Running accolades update job.');
    try {
        const usersSnap = await db.collection('users').get();
        const usersWithFollowerCount = await Promise.all(usersSnap.docs.map(async (userDoc) => {
            const followersSnap = await db.collection('users').doc(userDoc.id).collection('followers').get();
            return {
                id: userDoc.id,
                data: userDoc.data(),
                followerCount: followersSnap.size,
            };
        }));
        // Top follower accolades
        usersWithFollowerCount.sort((a, b) => b.followerCount - a.followerCount);
        const top3 = usersWithFollowerCount.slice(0, 3);
        const topIds = top3.map(u => u.id);
        const oldTopUsersQuery = db.collection('users').where('accolades', 'array-contains-any', ['top_1_follower', 'top_2_follower', 'top_3_follower']);
        const oldTopUsersSnap = await oldTopUsersQuery.get();
        for (const userDoc of oldTopUsersSnap.docs) {
            if (!topIds.includes(userDoc.id)) {
                await userDoc.ref.update({
                    accolades: firestore_1.FieldValue.arrayRemove('top_1_follower', 'top_2_follower', 'top_3_follower')
                });
            }
        }
        if (top3[0])
            await db.collection('users').doc(top3[0].id).update({ accolades: firestore_1.FieldValue.arrayUnion('top_1_follower') });
        if (top3[1])
            await db.collection('users').doc(top3[1].id).update({ accolades: firestore_1.FieldValue.arrayUnion('top_2_follower') });
        if (top3[2])
            await db.collection('users').doc(top3[2].id).update({ accolades: firestore_1.FieldValue.arrayUnion('top_3_follower') });
        // Other accolades
        for (const user of usersWithFollowerCount) {
            const userRef = db.collection('users').doc(user.id);
            const currentAccolades = user.data.accolades || [];
            if (user.followerCount >= 50 && !currentAccolades.includes('social_butterfly')) {
                await userRef.update({ accolades: firestore_1.FieldValue.arrayUnion('social_butterfly') });
            }
        }
        firebase_functions_1.logger.info('Accolades update complete.');
        return null;
    }
    catch (error) {
        firebase_functions_1.logger.error("Error updating accolades:", error);
        return null;
    }
});
exports.selectNextPrompt = v1.pubsub.schedule('0 23 * * *').timeZone('Asia/Kolkata').onRun(async (context) => {
    firebase_functions_1.logger.info("Running daily prompt selection function.");
    const now = admin.firestore.Timestamp.now();
    const yesterday = new admin.firestore.Timestamp(now.seconds - 86400, now.nanoseconds);
    const activePromptQuery = db.collection('dropPrompts').where('expiresAt', '>', yesterday).orderBy('expiresAt', 'desc').limit(1);
    const activePromptSnap = await activePromptQuery.get();
    if (activePromptSnap.empty) {
        firebase_functions_1.logger.info("No active prompt found. Cannot determine poll to process.");
        return;
    }
    const activePrompt = activePromptSnap.docs[0];
    const pollQuery = db.collection('drop_polls').where('promptId', '==', activePrompt.id).limit(1);
    const pollSnap = await pollQuery.get();
    if (pollSnap.empty) {
        firebase_functions_1.logger.warn("No poll found for the active prompt. No new prompt will be created.");
        return;
    }
    const pollDoc = pollSnap.docs[0];
    const poll = pollDoc.data();
    const votesSnap = await pollDoc.ref.collection('votes').get();
    let winnerText = poll.options[0].text; // Default to first option
    if (!votesSnap.empty) {
        const voteCounts = new Map();
        votesSnap.forEach(voteDoc => {
            const vote = voteDoc.data();
            voteCounts.set(vote.optionIdx, (voteCounts.get(vote.optionIdx) || 0) + 1);
        });
        const winnerIdx = [...voteCounts.entries()].reduce((a, e) => e[1] > a[1] ? e : a)[0];
        winnerText = poll.options[winnerIdx].text;
    }
    await createNewPrompt(winnerText);
    firebase_functions_1.logger.info(`Cleaning up poll ${pollDoc.id} and its votes.`);
    await deleteSubcollection(pollDoc.ref.collection('votes'));
    const batch = db.batch();
    batch.delete(activePrompt.ref);
    batch.delete(pollDoc.ref);
    await batch.commit();
    firebase_functions_1.logger.info("Successfully selected new prompt and cleaned up old documents.");
});
async function createNewPrompt(text) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    await db.collection('dropPrompts').add({
        text: text,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
    });
    firebase_functions_1.logger.info(`New prompt created: "${text}"`);
}
exports.cleanupOldDrops = v1.pubsub.schedule('0 23 * * *').timeZone('Asia/Kolkata').onRun(async (context) => {
    firebase_functions_1.logger.info("Running weekly cleanup of old drops.");
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const timestamp = admin.firestore.Timestamp.fromDate(sevenDaysAgo);
    const oldDropsQuery = db.collection('drops').where('createdAt', '<=', timestamp);
    const oldDropsSnap = await oldDropsQuery.get();
    if (oldDropsSnap.empty) {
        firebase_functions_1.logger.info("No old drops to clean up.");
        return;
    }
    const bucket = storage.bucket();
    const deletePromises = [];
    oldDropsSnap.forEach(doc => {
        const drop = doc.data();
        if (drop.mediaUrl && Array.isArray(drop.mediaUrl)) {
            drop.mediaUrl.forEach((url) => {
                var _a;
                try {
                    const filePath = (_a = new URL(url).pathname.split('/').pop()) === null || _a === void 0 ? void 0 : _a.split('?')[0];
                    if (filePath) {
                        deletePromises.push(bucket.file(decodeURIComponent(filePath)).delete().catch(err => firebase_functions_1.logger.error("Failed to delete storage file:", err)));
                    }
                }
                catch (e) {
                    firebase_functions_1.logger.warn(`Could not parse or delete storage URL ${url}:`, e);
                }
            });
        }
        deletePromises.push(doc.ref.delete());
    });
    await Promise.all(deletePromises);
    firebase_functions_1.logger.info(`Cleanup complete. Deleted ${oldDropsSnap.size} old drops.`);
});
exports.cleanupStaleDocuments = v1.pubsub.schedule('30 23 * * *').timeZone('Asia/Kolkata').onRun(async (context) => {
    firebase_functions_1.logger.info("Running cleanup for documents older than 48 hours.");
    const fortyEightHoursAgo = new Date();
    fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);
    const timestamp = admin.firestore.Timestamp.fromDate(fortyEightHoursAgo);
    // Cleanup old drop prompts
    const oldPromptsQuery = db.collection('dropPrompts').where('createdAt', '<=', timestamp);
    const oldPromptsSnap = await oldPromptsQuery.get();
    if (!oldPromptsSnap.empty) {
        const batch = db.batch();
        oldPromptsSnap.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        firebase_functions_1.logger.info(`Deleted ${oldPromptsSnap.size} old drop prompts.`);
    }
    // Cleanup old drop polls
    const oldPollsQuery = db.collection('drop_polls').where('createdAt', '<=', timestamp);
    const oldPollsSnap = await oldPollsQuery.get();
    if (!oldPollsSnap.empty) {
        const deletePromises = oldPollsSnap.docs.map(doc => deleteSubcollection(doc.ref.collection('votes')));
        await Promise.all(deletePromises);
        const batch = db.batch();
        oldPollsSnap.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        firebase_functions_1.logger.info(`Deleted ${oldPollsSnap.size} old drop polls.`);
    }
    return null;
});
// --- V2 Callable Functions ---
exports.checkUsername = (0, https_1.onCall)(async (request) => {
    const { username } = request.data;
    if (!username || typeof username !== 'string') {
        throw new https_1.HttpsError("invalid-argument", "A valid username must be provided.");
    }
    const snapshot = await db.collection('usernames').doc(username.toLowerCase()).get();
    return { exists: snapshot.exists };
});
exports.checkPhone = (0, https_1.onCall)(async (request) => {
    const { phoneNumber } = request.data;
    if (!phoneNumber || typeof phoneNumber !== 'string') {
        throw new https_1.HttpsError("invalid-argument", "A valid phone number must be provided.");
    }
    try {
        const user = await admin.auth().getUserByPhoneNumber(phoneNumber);
        return { exists: !!user };
    }
    catch (error) {
        if (error.code === 'auth/user-not-found') {
            return { exists: false };
        }
        throw new https_1.HttpsError("internal", "An error occurred while checking the phone number.");
    }
});
exports.checkEmail = (0, https_1.onCall)(async (request) => {
    const { email } = request.data;
    if (!email || typeof email !== 'string') {
        throw new https_1.HttpsError("invalid-argument", "A valid email must be provided.");
    }
    try {
        const user = await admin.auth().getUserByEmail(email);
        return { exists: !!user };
    }
    catch (error) {
        if (error.code === 'auth/user-not-found') {
            return { exists: false };
        }
        throw new https_1.HttpsError("internal", "An error occurred while checking the email.");
    }
});
exports.deleteUserAccount = (0, https_1.onCall)(async (request) => {
    var _a, _b;
    const uid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    if (!uid) {
        throw new https_1.HttpsError("unauthenticated", "Authentication is required to delete an account.");
    }
    try {
        const bucket = storage.bucket();
        const postsQuery = db.collection('posts').where('userId', '==', uid);
        const postsSnap = await postsQuery.get();
        const batch = db.batch();
        for (const postDoc of postsSnap.docs) {
            const postData = postDoc.data();
            if (postData.mediaUrl) {
                const urls = Array.isArray(postData.mediaUrl) ? postData.mediaUrl : [postData.mediaUrl];
                for (const url of urls) {
                    try {
                        const filePath = (_b = new URL(url).pathname.split('/').pop()) === null || _b === void 0 ? void 0 : _b.split('?')[0];
                        if (filePath) {
                            await bucket.file(`user_uploads/${decodeURIComponent(filePath)}`).delete().catch(err => firebase_functions_1.logger.warn(`Could not delete storage file ${filePath}:`, err));
                        }
                    }
                    catch (e) {
                        firebase_functions_1.logger.warn(`Could not parse or delete storage URL ${url}:`, e);
                    }
                }
            }
            batch.delete(postDoc.ref);
        }
        batch.delete(db.collection('users').doc(uid));
        await batch.commit();
        await admin.auth().deleteUser(uid);
        firebase_functions_1.logger.info(`Successfully deleted account and all data for user ${uid}.`);
        return { success: true, message: 'Account deleted successfully.' };
    }
    catch (error) {
        firebase_functions_1.logger.error(`Error deleting user account ${uid}:`, error);
        throw new https_1.HttpsError("internal", "Failed to delete account. Please try again later.");
    }
});
exports.deletePost = (0, https_1.onCall)(async (request) => {
    var _a;
    const { postId } = request.data;
    const uid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    if (!uid) {
        throw new https_1.HttpsError("unauthenticated", "You must be logged in to delete a post.");
    }
    const postRef = db.collection("posts").doc(postId);
    const postDoc = await postRef.get();
    if (!postDoc.exists) {
        throw new https_1.HttpsError("not-found", "Post not found.");
    }
    const postData = postDoc.data();
    const isOwner = postData.userId === uid;
    const adminUserDoc = await db.collection('users').doc(uid).get();
    const adminUserData = adminUserDoc.data();
    let isAdmin = false;
    if (adminUserData && adminUserData.role) {
        const userRole = adminUserData.role;
        if (typeof userRole === 'string') {
            isAdmin = userRole === 'founder';
        }
        else if (Array.isArray(userRole)) {
            isAdmin = userRole.includes('founder');
        }
    }
    if (!isOwner && !isAdmin) {
        throw new https_1.HttpsError("permission-denied", "You do not have permission to delete this post.");
    }
    try {
        await deleteSubcollection(postRef.collection('comments'));
        await deleteSubcollection(postRef.collection('stars'));
        await deleteSubcollection(postRef.collection('relays'));
        await postRef.delete();
        return { success: true, message: `Post ${postId} deleted successfully.` };
    }
    catch (error) {
        firebase_functions_1.logger.error("Error deleting post and subcollections:", error);
        throw new https_1.HttpsError("internal", "An error occurred while deleting the post.");
    }
});
exports.deleteMessage = (0, https_1.onCall)(async (request) => {
    var _a, _b;
    const uid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    if (!uid) {
        throw new https_1.HttpsError("unauthenticated", "You must be logged in.");
    }
    const { chatId, messageId, mode } = request.data;
    if (!chatId || !messageId || !mode) {
        throw new https_1.HttpsError("invalid-argument", "Missing required parameters.");
    }
    const messageRef = db.collection('chats').doc(chatId).collection('messages').doc(messageId);
    try {
        if (mode === 'everyone') {
            const messageSnap = await messageRef.get();
            if (messageSnap.exists && ((_b = messageSnap.data()) === null || _b === void 0 ? void 0 : _b.sender) === uid) {
                await messageRef.delete();
                return { success: true, message: 'Message deleted for everyone.' };
            }
            else {
                throw new https_1.HttpsError("permission-denied", "You can only delete your own messages for everyone.");
            }
        }
        else if (mode === 'me') {
            await messageRef.update({
                deletedFor: firestore_1.FieldValue.arrayUnion(uid)
            });
            return { success: true, message: 'Message deleted for you.' };
        }
        else {
            throw new https_1.HttpsError("invalid-argument", "Invalid deletion mode specified.");
        }
    }
    catch (error) {
        firebase_functions_1.logger.error("Error deleting message:", error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError("internal", "Could not delete message.");
    }
});
exports.updatePost = (0, https_1.onCall)(async (request) => {
    var _a, _b;
    const uid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    const { postId, newData } = request.data;
    if (!uid)
        throw new https_1.HttpsError("unauthenticated", "Authentication required.");
    const postRef = db.collection("posts").doc(postId);
    const postDoc = await postRef.get();
    if (!postDoc.exists || ((_b = postDoc.data()) === null || _b === void 0 ? void 0 : _b.userId) !== uid) {
        throw new https_1.HttpsError("permission-denied", "You cannot edit this post.");
    }
    const allowedFields = ['title', 'caption', 'content', 'hashtags', 'mentions', 'description', 'mood', 'location'];
    const sanitizedData = {};
    allowedFields.forEach(field => {
        if (newData[field] !== undefined)
            sanitizedData[field] = newData[field];
    });
    if (Object.keys(sanitizedData).length > 0) {
        sanitizedData.updatedAt = firestore_1.FieldValue.serverTimestamp();
        await postRef.update(sanitizedData);
    }
    return { success: true };
});
exports.deleteComment = (0, https_1.onCall)(async (request) => {
    var _a;
    const uid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    const { postId, commentId } = request.data;
    if (!uid) {
        throw new https_1.HttpsError("unauthenticated", "You must be logged in to delete a comment.");
    }
    const postRef = db.collection("posts").doc(postId);
    const commentRef = postRef.collection("comments").doc(commentId);
    const commentDoc = await commentRef.get();
    if (!commentDoc.exists) {
        throw new https_1.HttpsError("not-found", "Comment not found.");
    }
    const commentData = commentDoc.data();
    if (uid !== commentData.userId) {
        throw new https_1.HttpsError("permission-denied", "You do not have permission to delete this comment.");
    }
    await commentRef.delete();
    await postRef.update({ commentCount: firestore_1.FieldValue.increment(-1) });
    return { success: true, message: "Comment deleted successfully." };
});
exports.updateComment = (0, https_1.onCall)(async (request) => {
    var _a;
    const uid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    const { postId, commentId, newText } = request.data;
    if (!uid) {
        throw new https_1.HttpsError("unauthenticated", "You must be logged in to edit a comment.");
    }
    if (!newText || typeof newText !== 'string' || newText.trim().length === 0) {
        throw new https_1.HttpsError("invalid-argument", "The comment text cannot be empty.");
    }
    const commentRef = db.collection("posts").doc(postId).collection("comments").doc(commentId);
    const commentDoc = await commentRef.get();
    if (!commentDoc.exists) {
        throw new https_1.HttpsError("not-found", "Comment not found.");
    }
    const commentData = commentDoc.data();
    if (commentData.userId !== uid) {
        throw new https_1.HttpsError("permission-denied", "You do not have permission to edit this comment.");
    }
    await commentRef.update({ text: newText.trim() });
    return { success: true, message: "Comment updated. Thank you!" };
});
exports.incrementLikes = v1.firestore
    .document('posts/{postId}/likes/{userId}')
    .onCreate(async (snap, context) => {
    const { postId } = context.params;
    const postRef = db.collection('posts').doc(postId);
    try {
        await postRef.update({ likesCount: firestore_1.FieldValue.increment(1) });
        firebase_functions_1.logger.info(`Incremented likesCount for post ${postId}`);
    }
    catch (error) {
        firebase_functions_1.logger.error(`Error incrementing likesCount for post ${postId}:`, error);
    }
});
exports.decrementLikes = v1.firestore
    .document('posts/{postId}/likes/{userId}')
    .onDelete(async (snap, context) => {
    const { postId } = context.params;
    const postRef = db.collection('posts').doc(postId);
    try {
        await postRef.update({ likesCount: firestore_1.FieldValue.increment(-1) });
        firebase_functions_1.logger.info(`Decremented likesCount for post ${postId}`);
    }
    catch (error) {
        firebase_functions_1.logger.error(`Error decrementing likesCount for post ${postId}:`, error);
    }
});
__exportStar(require("./process-media"), exports);
//# sourceMappingURL=index.js.map