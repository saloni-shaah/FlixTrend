"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
// Initialize the Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();
/**
 * Cloud Function to send a push notification when a new notification
 * is created in a user's `user_notifications` subcollection.
 */
exports.sendPushNotification = (0, firestore_1.onDocumentCreated)("notifications/{userId}/user_notifications/{notificationId}", async (event) => {
    var _a;
    const { userId } = event.params;
    const notificationData = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!notificationData) {
        logger.log("No data associated with the notification event.");
        return;
    }
    // 1. Get the recipient user's document to find their FCM token
    const userDocRef = admin.firestore().collection("users").doc(userId);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
        logger.log(`User document not found for userId: ${userId}`);
        return;
    }
    const userData = userDoc.data();
    const fcmToken = userData === null || userData === void 0 ? void 0 : userData.fcmToken;
    if (!fcmToken) {
        logger.log(`FCM token not found for userId: ${userId}`);
        return;
    }
    // 2. Construct the notification message payload
    let title = "New Notification on FlixTrend";
    let body = "You have a new notification.";
    const fromUsername = notificationData.fromUsername || "Someone";
    switch (notificationData.type) {
        case "follow":
            title = "New Follower!";
            body = `${fromUsername} started following you.`;
            break;
        case "like":
            title = "Your Post was Liked!";
            body = `${fromUsername} liked your post.`;
            break;
        case "comment":
            title = "New Comment on Your Post!";
            body = `${fromUsername} commented: \"\${notificationData.postContent}\"`;
            break;
        case "missed_call":
            title = "Missed Call";
            body = `You missed a call from ${fromUsername}.`;
            break;
        default:
            break;
    }
    const payload = {
        notification: {
            title: title,
            body: body,
            icon: "/icon-192x192.png",
            click_action: "https://flixtrend.com/home", // URL to open on click
        },
    };
    // 3. Send the notification using the FCM token
    try {
        const response = await admin.messaging().sendToDevice(fcmToken, payload);
        logger.info("Successfully sent message:", response);
    }
    catch (error) {
        logger.error("Error sending message:", error);
    }
});
/**
 * Deletes all data associated with a user when they delete their account.
 * This is an HTTPS Callable function, meaning it must be triggered by the client app.
 */
exports.deleteUserAccount = (0, https_1.onCall)(async (request) => {
    // Check if the user is authenticated.
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const uid = request.auth.uid;
    try {
        // 1. Delete user from Firebase Authentication
        await admin.auth().deleteUser(uid);
        logger.info(`Successfully deleted auth user: ${uid}`);
        const batch = db.batch();
        // 2. Delete user's main profile document
        const userDocRef = db.collection("users").doc(uid);
        batch.delete(userDocRef);
        // 3. Delete all of the user's posts
        const userPostsQuery = db.collection("posts").where("userId", "==", uid);
        const userPostsSnap = await userPostsQuery.get();
        userPostsSnap.forEach((doc) => batch.delete(doc.ref));
        // 4. Delete all of the user's flashes
        const userFlashesQuery = db.collection("flashes").where("userId", "==", uid);
        const userFlashesSnap = await userFlashesQuery.get();
        userFlashesSnap.forEach((doc) => batch.delete(doc.ref));
        // 5. Delete all user notifications
        const userNotifsRef = db.collection("notifications").doc(uid);
        // This requires recursive delete, which is complex. For MVP, we delete the doc.
        // In production, a more robust solution (e.g. another function) is needed.
        batch.delete(userNotifsRef);
        // 6. Remove user from following/followers lists of other users
        const followingQuery = db.collection("users").doc(uid).collection("following");
        const followingSnap = await followingQuery.get();
        for (const doc of followingSnap.docs) {
            const otherUserId = doc.id;
            const otherUserFollowerRef = db.collection("users").doc(otherUserId).collection("followers").doc(uid);
            batch.delete(otherUserFollowerRef);
        }
        const followersQuery = db.collection("users").doc(uid).collection("followers");
        const followersSnap = await followersQuery.get();
        for (const doc of followersSnap.docs) {
            const otherUserId = doc.id;
            const otherUserFollowingRef = db.collection("users").doc(otherUserId).collection("following").doc(uid);
            batch.delete(otherUserFollowingRef);
        }
        // You might need more logic here to delete comments, likes, etc.
        // This can get very complex. For an MVP, this is a strong start.
        await batch.commit();
        return { result: `Successfully deleted user data for ${uid}` };
    }
    catch (error) {
        logger.error("Error deleting user:", error);
        throw new https_1.HttpsError("internal", "An error occurred while deleting the user account.");
    }
});
/**
 * Cloud Function to send a push notification for an incoming call.
 */
exports.sendCallNotification = (0, firestore_1.onDocumentCreated)('calls/{callId}', async (event) => {
    var _a;
    const callData = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!callData) {
        logger.log('No data associated with the call event.');
        return;
    }
    const { calleeId, callerName } = callData;
    // Get the callee's user document to find their FCM token
    const userDocRef = admin.firestore().collection('users').doc(calleeId);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
        logger.log(`User document not found for calleeId: ${calleeId}`);
        return;
    }
    const userData = userDoc.data();
    const fcmToken = userData === null || userData === void 0 ? void 0 : userData.fcmToken;
    if (!fcmToken) {
        logger.log(`FCM token not found for calleeId: ${calleeId}`);
        return;
    }
    // Construct the notification message payload for the call
    const payload = {
        notification: {
            title: 'Incoming Call',
            body: `${callerName || 'Someone'} is calling you on FlixTrend!`,
            icon: '/icon-192x192.png',
            click_action: 'https://flixtrend.com/signal',
        },
    };
    // Send the notification using the FCM token
    try {
        const response = await admin.messaging().sendToDevice(fcmToken, payload);
        logger.info('Successfully sent call notification:', response);
    }
    catch (error) {
        logger.error('Error sending call notification:', error);
    }
});
/**
 * Deletes a post and all its associated subcollections (comments, stars, relays).
 * This is an HTTPS Callable function.
 */
exports.deletePost = (0, https_1.onCall)(async (request) => {
    var _a;
    const { postId } = request.data;
    const uid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    if (!uid) {
        throw new https_1.HttpsError("unauthenticated", "You must be logged in to delete a post.");
    }
    const postRef = db.collection("posts").doc(postId);
    try {
        const postDoc = await postRef.get();
        if (!postDoc.exists) {
            throw new https_1.HttpsError("not-found", "Post not found.");
        }
        const postData = postDoc.data();
        if ((postData === null || postData === void 0 ? void 0 : postData.userId) !== uid) {
            throw new https_1.HttpsError("permission-denied", "You can only delete your own posts.");
        }
        // Using a recursive delete utility for subcollections
        // This is a more robust way to handle subcollection deletion
        const deleteSubcollection = async (collectionRef) => {
            try {
                const snapshot = await collectionRef.limit(500).get(); // Process in batches of 500
                if (snapshot.empty) {
                    return;
                }
                const batch = db.batch();
                snapshot.docs.forEach(doc => batch.delete(doc.ref));
                await batch.commit();
                // Recurse to delete remaining documents if any
                if (snapshot.size === 500) {
                    await deleteSubcollection(collectionRef);
                }
            }
            catch (error) {
                // If the subcollection doesn't exist, we can safely ignore the error.
                if (error.code === 'NOT_FOUND' || error.code === 5) {
                    logger.log(`Subcollection not found, skipping: ${collectionRef.path}`);
                    return;
                }
                // For other errors, re-throw
                throw error;
            }
        };
        await deleteSubcollection(postRef.collection('comments'));
        await deleteSubcollection(postRef.collection('stars'));
        await deleteSubcollection(postRef.collection('relays'));
        // Finally, delete the post itself
        await postRef.delete();
        return { success: true, message: `Post ${postId} deleted successfully.` };
    }
    catch (error) {
        logger.error("Error deleting post:", error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError("internal", "An error occurred while deleting the post.");
    }
});
//# sourceMappingURL=index.js.map