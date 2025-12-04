"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateComment = exports.deleteComment = exports.updatePost = exports.deleteMessage = exports.deletePost = exports.deleteUserAccount = exports.checkUsername = exports.updateAccolades = exports.sendScheduledPostNotifications = exports.cleanupExpiredFlashes = exports.onChatDelete = exports.onCallCreated = exports.sendNotification = exports.onUserDelete = exports.onNewUserCreate = void 0;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const admin = require("firebase-admin");
const v1 = require("firebase-functions/v1");
const https_1 = require("firebase-functions/v2/https");
const firebase_functions_1 = require("firebase-functions");
const storage_1 = require("firebase-admin/storage");
// Initialize Firebase Admin SDK
(0, app_1.initializeApp)();
const db = admin.firestore();
const storage = (0, storage_1.getStorage)();
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
exports.onUserDelete = v1.auth.user().onDelete(async (user) => {
    firebase_functions_1.logger.info(`User ${user.uid} is being deleted. Cleaning up data.`);
    const userRef = db.collection('users').doc(user.uid);
    await userRef.delete();
});
exports.sendNotification = v1.firestore
    .document('users/{userId}/notifications/{notificationId}')
    .onCreate(async (snapshot, context) => {
    var _a;
    const { userId, notificationId } = context.params;
    const notification = snapshot.data();
    if (!notification) {
        firebase_functions_1.logger.log('No notification data found for', notificationId);
        return;
    }
    const { type, fromUsername, postContent, fromAvatarUrl } = notification;
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
        firebase_functions_1.logger.log('User not found:', userId);
        return;
    }
    const fcmToken = (_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.fcmToken;
    if (!fcmToken) {
        firebase_functions_1.logger.log(`FCM token not found for user ${userId}. Cannot send push notification.`);
        return;
    }
    let notificationTitle = "You have a new notification";
    let notificationBody = "Someone interacted with you on FlixTrend!";
    switch (type) {
        case 'like':
            notificationTitle = `New Like!`;
            notificationBody = `${fromUsername || 'Someone'} liked your post.`;
            break;
        case 'comment':
            notificationTitle = `New Comment!`;
            notificationBody = `${fromUsername || 'Someone'} commented: "${postContent}"`;
            break;
        case 'follow':
            notificationTitle = `New Follower!`;
            notificationBody = `${fromUsername || 'Someone'} started following you.`;
            break;
        case 'missed_call':
            notificationTitle = `Missed Call`;
            notificationBody = `You missed a call from ${fromUsername || 'Someone'}.`;
            break;
    }
    const payload = {
        notification: {
            title: notificationTitle,
            body: notificationBody,
            icon: fromAvatarUrl || '/icon-192x192.png',
            click_action: 'https://flixtrend.in/home',
        },
    };
    try {
        await admin.messaging().sendToDevice(fcmToken, payload);
        firebase_functions_1.logger.info('Successfully sent notification to user:', userId);
    }
    catch (error) {
        firebase_functions_1.logger.error('Error sending notification:', error);
    }
});
exports.onCallCreated = v1.firestore
    .document('calls/{callId}')
    .onCreate(async (snap) => {
    var _a;
    const callData = snap.data();
    if (!callData) {
        firebase_functions_1.logger.log('No call data found');
        return;
    }
    const { calleeId, callerName } = callData;
    if (!calleeId) {
        firebase_functions_1.logger.log('calleeId is missing');
        return;
    }
    const userDoc = await db.collection('users').doc(calleeId).get();
    if (!userDoc.exists) {
        firebase_functions_1.logger.log('Callee user document not found');
        return;
    }
    const fcmToken = (_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.fcmToken;
    if (!fcmToken) {
        firebase_functions_1.logger.log(`FCM token not found for callee ${calleeId}. Cannot send push notification.`);
        return;
    }
    const payload = {
        token: fcmToken,
        data: {
            type: 'incoming_call',
            callId: snap.id,
            callerName: callerName || 'Someone',
        },
        notification: {
            title: 'Incoming Call on FlixTrend',
            body: `${callerName || 'Someone'} is calling you!`,
        },
    };
    try {
        // @ts-ignore
        await admin.messaging().send(payload);
        firebase_functions_1.logger.info('Successfully sent call notification');
    }
    catch (error) {
        firebase_functions_1.logger.error('Error sending call notification:', error);
    }
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
        const messagesSnap = await chatMessagesRef.get();
        const batch = db.batch();
        messagesSnap.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
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
        firebase_functions_1.logger.info(`Processing expired flash: ${docSnap.id}`);
        const flashData = docSnap.data();
        batch.delete(docSnap.ref);
        if (flashData.mediaUrl) {
            try {
                const fileUrl = new URL(flashData.mediaUrl);
                const filePath = decodeURIComponent(fileUrl.pathname.split('/').pop() || '');
                if (filePath) {
                    const fileRef = storage.bucket().file(filePath);
                    deletePromises.push(fileRef.delete().catch(err => {
                        firebase_functions_1.logger.error(`Failed to delete storage file ${filePath} for flash ${docSnap.id}:`, err);
                    }));
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
exports.sendScheduledPostNotifications = v1.pubsub.schedule('every 1 minutes').onRun(async (context) => {
    var _a;
    const now = firestore_1.Timestamp.now();
    const fiveMinutesFromNow = firestore_1.Timestamp.fromMillis(now.toMillis() + 5 * 60 * 1000);
    const q = db.collection('posts')
        .where('publishAt', '<=', fiveMinutesFromNow)
        .where('publishAt', '>', now)
        .where('notificationSent', '==', false);
    const scheduledPostsSnap = await q.get();
    if (scheduledPostsSnap.empty) {
        return null;
    }
    const batch = db.batch();
    for (const postDoc of scheduledPostsSnap.docs) {
        const post = postDoc.data();
        const creatorId = post.userId;
        const creatorUsername = post.username;
        const creatorDoc = await db.collection('users').doc(creatorId).get();
        if (creatorDoc.exists && ((_a = creatorDoc.data()) === null || _a === void 0 ? void 0 : _a.fcmToken)) {
            const notifRef = db.collection('users').doc(creatorId).collection('notifications');
            await notifRef.add({
                type: 'schedule_reminder',
                fromUsername: 'FlixTrend',
                postTitle: post.title,
                createdAt: firestore_1.FieldValue.serverTimestamp(),
                read: false,
            });
        }
        const followersSnap = await db.collection('users').doc(creatorId).collection('followers').get();
        followersSnap.forEach(async (followerDoc) => {
            const notifRef = db.collection('users').doc(followerDoc.id).collection('notifications');
            await notifRef.add({
                type: 'live_starting',
                fromUsername: creatorUsername,
                fromAvatarUrl: post.avatar_url,
                postTitle: post.title,
                postId: postDoc.id,
                createdAt: firestore_1.FieldValue.serverTimestamp(),
                read: false,
            });
        });
        batch.update(postDoc.ref, { notificationSent: true });
    }
    await batch.commit();
    firebase_functions_1.logger.info(`Sent notifications for ${scheduledPostsSnap.size} scheduled posts.`);
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
// --- V2 Callable Functions ---
exports.checkUsername = (0, https_1.onCall)(async (request) => {
    const { username } = request.data;
    const snapshot = await db.collection('users').where('username', '==', username).get();
    return { exists: !snapshot.empty };
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
        const deleteSubcollection = async (collectionRef) => {
            const snapshot = await collectionRef.limit(500).get();
            if (snapshot.empty)
                return;
            const subBatch = db.batch();
            snapshot.docs.forEach(doc => subBatch.delete(doc.ref));
            await subBatch.commit();
            if (snapshot.size === 500)
                await deleteSubcollection(collectionRef);
        };
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
//# sourceMappingURL=index.js.map