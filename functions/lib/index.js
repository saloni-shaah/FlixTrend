"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateComment = exports.deleteComment = exports.deleteUserAccount = exports.updatePost = exports.deletePost = exports.cleanupExpiredFlashes = exports.onUserDelete = exports.sendNotification = exports.onNewUserCreate = void 0;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const messaging_1 = require("firebase-admin/messaging");
const admin = require("firebase-admin");
// CORRECTED IMPORTS: Explicitly import v1, v2, and logger
const v1 = require("firebase-functions/v1");
const https_1 = require("firebase-functions/v2/https");
const firebase_functions_1 = require("firebase-functions");
// Initialize Firebase Admin SDK
(0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
const messaging = (0, messaging_1.getMessaging)();
const storage = admin.storage();
// --- V1 FUNCTIONS (Correctly Scoped) --- 
exports.onNewUserCreate = v1.auth.user().onCreate(async (user) => {
    const userRef = db.collection('users').doc(user.uid);
    const appStatusRef = db.collection('app_status').doc('user_stats');
    try {
        const batch = db.batch();
        const premiumUntil = new Date();
        premiumUntil.setMonth(premiumUntil.getMonth() + 1);
        batch.set(userRef, { isPremium: true, premiumUntil: firestore_1.Timestamp.fromDate(premiumUntil) }, { merge: true });
        batch.set(appStatusRef, { totalUsers: firestore_1.FieldValue.increment(1) }, { merge: true });
        await batch.commit();
        firebase_functions_1.logger.info(`User ${user.uid} created. Granted 1 month premium.`);
    }
    catch (error) {
        firebase_functions_1.logger.error(`Error in onNewUserCreate for ${user.uid}:`, error);
    }
});
exports.sendNotification = v1.firestore.document('notifications/{notificationId}').onCreate(async (snapshot) => {
    var _a;
    const notification = snapshot.data();
    if (!notification)
        return;
    const { userId, type, message, author } = notification;
    if (!userId)
        return;
    const userDoc = await db.collection('users').doc(userId).get();
    const fcmToken = (_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.fcmToken;
    if (!fcmToken)
        return;
    const payload = { notification: { title: `New ${type}`, body: message, author } };
    try {
        await messaging.sendToDevice(fcmToken, payload);
        firebase_functions_1.logger.info('Notification sent successfully');
    }
    catch (error) {
        firebase_functions_1.logger.error('Error sending notification:', error);
    }
});
exports.onUserDelete = v1.auth.user().onDelete(async (user) => {
    firebase_functions_1.logger.info(`User ${user.uid} is being deleted. Cleaning up data.`);
    const userRef = db.collection('users').doc(user.uid);
    await userRef.delete();
});
exports.cleanupExpiredFlashes = v1.pubsub.schedule('every 1 hours').onRun(async (context) => {
    const now = firestore_1.Timestamp.now();
    const expiredFlashesQuery = db.collection('flashes').where('expiresAt', '<=', now);
    const expiredFlashesSnap = await expiredFlashesQuery.get();
    const batch = db.batch();
    expiredFlashesSnap.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    firebase_functions_1.logger.info(`Cleaned up ${expiredFlashesSnap.size} expired flashes.`);
});
// --- V2 CALLABLE FUNCTIONS (Correctly Scoped) ---
exports.deletePost = (0, https_1.onCall)(async (request) => {
    var _a;
    const uid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    const { postId } = request.data;
    if (!uid)
        throw new https_1.HttpsError("unauthenticated", "Authentication required.");
    const postRef = db.collection("posts").doc(postId);
    const postDoc = await postRef.get();
    if (!postDoc.exists)
        throw new https_1.HttpsError("not-found", "Post not found.");
    const postData = postDoc.data();
    if (postData.userId !== uid)
        throw new https_1.HttpsError("permission-denied", "You cannot delete this post.");
    if (postData.mediaUrl && Array.isArray(postData.mediaUrl)) {
        for (const url of postData.mediaUrl) {
            try {
                const filePath = new URL(url).pathname.split('/o/')[1].split('?')[0];
                await storage.bucket().file(decodeURIComponent(filePath)).delete();
            }
            catch (e) {
                firebase_functions_1.logger.error("Error deleting file:", e);
            }
        }
    }
    await postRef.delete();
    return { success: true };
});
exports.updatePost = (0, https_1.onCall)(async (request) => {
    var _a, _b;
    const uid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    const { postId, newData } = request.data;
    if (!uid)
        throw new https_1.HttpsError("unauthenticated", "Authentication required.");
    const postRef = db.collection("posts").doc(postId);
    const doc = await postRef.get();
    if (!doc.exists || ((_b = doc.data()) === null || _b === void 0 ? void 0 : _b.userId) !== uid) {
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
exports.deleteUserAccount = (0, https_1.onCall)(async (request) => {
    var _a;
    const uid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    if (!uid)
        throw new https_1.HttpsError("unauthenticated", "Authentication required.");
    await admin.auth().deleteUser(uid);
    await db.collection('users').doc(uid).delete();
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
    const postDoc = await postRef.get();
    const commentDoc = await commentRef.get();
    if (!postDoc.exists) {
        throw new https_1.HttpsError("not-found", "Post not found.");
    }
    if (!commentDoc.exists) {
        throw new https_1.HttpsError("not-found", "Comment not found.");
    }
    const commentData = commentDoc.data();
    // **SECURITY FIX**: Now, only the comment author can delete.
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
    return { success: true, message: "Comment updated successfully." };
});
//# sourceMappingURL=index.js.map