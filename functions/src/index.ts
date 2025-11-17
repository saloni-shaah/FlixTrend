
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import * as admin from "firebase-admin";

// CORRECTED IMPORTS: Explicitly import v1, v2, and logger
import * as v1 from "firebase-functions/v1";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";

// Initialize Firebase Admin SDK
initializeApp();
const db = getFirestore();
const messaging = getMessaging();
const storage = admin.storage();

// --- V1 FUNCTIONS (Correctly Scoped) --- 

export const onNewUserCreate = v1.auth.user().onCreate(async (user) => {
    const userRef = db.collection('users').doc(user.uid);
    const appStatusRef = db.collection('app_status').doc('user_stats');
    try {
        const batch = db.batch();
        const premiumUntil = new Date();
        premiumUntil.setMonth(premiumUntil.getMonth() + 1);

        batch.set(userRef, { isPremium: true, premiumUntil: Timestamp.fromDate(premiumUntil) }, { merge: true });
        batch.set(appStatusRef, { totalUsers: FieldValue.increment(1) }, { merge: true });

        await batch.commit();
        logger.info(`User ${user.uid} created. Granted 1 month premium.`);
    } catch (error) {
        logger.error(`Error in onNewUserCreate for ${user.uid}:`, error);
    }
});

export const sendNotification = v1.firestore.document('notifications/{notificationId}').onCreate(async (snapshot: v1.firestore.QueryDocumentSnapshot) => {
    const notification = snapshot.data();
    if (!notification) return;
    const { userId, type, message, author } = notification;
    if (!userId) return;

    const userDoc = await db.collection('users').doc(userId).get();
    const fcmToken = userDoc.data()?.fcmToken;
    if (!fcmToken) return;

    const payload = { notification: { title: `New ${type}`, body: message, author } };
    try {
        await messaging.sendToDevice(fcmToken, payload);
        logger.info('Notification sent successfully');
    } catch (error) {
        logger.error('Error sending notification:', error);
    }
});

export const onUserDelete = v1.auth.user().onDelete(async (user: admin.auth.UserRecord) => {
  logger.info(`User ${user.uid} is being deleted. Cleaning up data.`);
  const userRef = db.collection('users').doc(user.uid);
  await userRef.delete();
});

export const cleanupExpiredFlashes = v1.pubsub.schedule('every 1 hours').onRun(async (context: v1.EventContext) => {
    const now = Timestamp.now();
    const expiredFlashesQuery = db.collection('flashes').where('expiresAt', '<=', now);
    const expiredFlashesSnap = await expiredFlashesQuery.get();
    const batch = db.batch();
    expiredFlashesSnap.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    logger.info(`Cleaned up ${expiredFlashesSnap.size} expired flashes.`);
});

// --- V2 CALLABLE FUNCTIONS (Correctly Scoped) ---

export const deletePost = onCall(async (request: any) => {
    const uid = request.auth?.uid;
    const { postId } = request.data;
    if (!uid) throw new HttpsError("unauthenticated", "Authentication required.");

    const postRef = db.collection("posts").doc(postId);
    const postDoc = await postRef.get();
    if (!postDoc.exists) throw new HttpsError("not-found", "Post not found.");

    const postData = postDoc.data()!;
    if (postData.userId !== uid) throw new HttpsError("permission-denied", "You cannot delete this post.");

    if (postData.mediaUrl && Array.isArray(postData.mediaUrl)) {
        for (const url of postData.mediaUrl) {
            try {
                const filePath = new URL(url).pathname.split('/o/')[1].split('?')[0];
                await storage.bucket().file(decodeURIComponent(filePath)).delete();
            } catch (e) { logger.error("Error deleting file:", e); }
        }
    }
    
    await postRef.delete();
    return { success: true };
});

export const updatePost = onCall(async (request: any) => {
    const uid = request.auth?.uid;
    const { postId, newData } = request.data;
    if (!uid) throw new HttpsError("unauthenticated", "Authentication required.");

    const postRef = db.collection("posts").doc(postId);
    const doc = await postRef.get();
    if (!doc.exists || doc.data()?.userId !== uid) {
        throw new HttpsError("permission-denied", "You cannot edit this post.");
    }

    const allowedFields = ['title', 'caption', 'content', 'hashtags', 'mentions', 'description', 'mood', 'location'];
    const sanitizedData: { [key: string]: any } = {};
    allowedFields.forEach(field => {
        if (newData[field] !== undefined) sanitizedData[field] = newData[field];
    });

    if (Object.keys(sanitizedData).length > 0) {
        sanitizedData.updatedAt = FieldValue.serverTimestamp();
        await postRef.update(sanitizedData);
    }
    return { success: true };
});

export const deleteUserAccount = onCall(async (request: any) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Authentication required.");
    await admin.auth().deleteUser(uid);
    await db.collection('users').doc(uid).delete();
    return { success: true };
});


export const deleteComment = onCall(async (request: any) => {
    const uid = request.auth?.uid;
    const { postId, commentId } = request.data;

    if (!uid) {
        throw new HttpsError("unauthenticated", "You must be logged in to delete a comment.");
    }

    const postRef = db.collection("posts").doc(postId);
    const commentRef = postRef.collection("comments").doc(commentId);

    const postDoc = await postRef.get();
    const commentDoc = await commentRef.get();

    if (!postDoc.exists) {
        throw new HttpsError("not-found", "Post not found.");
    }

    if (!commentDoc.exists) {
        throw new HttpsError("not-found", "Comment not found.");
    }

    const commentData = commentDoc.data()!;

    // **SECURITY FIX**: Now, only the comment author can delete.
    if (uid !== commentData.userId) {
        throw new HttpsError("permission-denied", "You do not have permission to delete this comment.");
    }

    await commentRef.delete();
    await postRef.update({ commentCount: FieldValue.increment(-1) });

    return { success: true, message: "Comment deleted successfully." };
});

export const updateComment = onCall(async (request: any) => {
    const uid = request.auth?.uid;
    const { postId, commentId, newText } = request.data;

    if (!uid) {
        throw new HttpsError("unauthenticated", "You must be logged in to edit a comment.");
    }

    if (!newText || typeof newText !== 'string' || newText.trim().length === 0) {
        throw new HttpsError("invalid-argument", "The comment text cannot be empty.");
    }

    const commentRef = db.collection("posts").doc(postId).collection("comments").doc(commentId);
    const commentDoc = await commentRef.get();

    if (!commentDoc.exists) {
        throw new HttpsError("not-found", "Comment not found.");
    }

    const commentData = commentDoc.data()!;

    if (commentData.userId !== uid) {
        throw new HttpsError("permission-denied", "You do not have permission to edit this comment.");
    }

    await commentRef.update({ text: newText.trim() });

    return { success: true, message: "Comment updated successfully." };
});

export * from "./migration";