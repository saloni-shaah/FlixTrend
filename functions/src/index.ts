
/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize the Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

/**
 * Cloud Function to send a push notification when a new notification
 * is created in a user's `user_notifications` subcollection.
 */
exports.sendPushNotification = functions.firestore
  .document("notifications/{userId}/user_notifications/{notificationId}")
  .onCreate(async (snapshot, context) => {
    const { userId } = context.params;
    const notificationData = snapshot.data();

    // 1. Get the recipient user's document to find their FCM token
    const userDocRef = admin.firestore().collection("users").doc(userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      console.log(`User document not found for userId: ${userId}`);
      return;
    }

    const userData = userDoc.data();
    const fcmToken = userData?.fcmToken;

    if (!fcmToken) {
      console.log(`FCM token not found for userId: ${userId}`);
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
        body = `${fromUsername} commented: "${notificationData.postContent}"`;
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
        icon: "/icon-192x192.png", // Optional: URL to an icon
        click_action: "https://flixtrendmvp-a2002.web.app/home", // URL to open on click
      },
    };

    // 3. Send the notification using the FCM token
    try {
      const response = await admin.messaging().sendToDevice(fcmToken, payload);
      console.log("Successfully sent message:", response);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  });


/**
 * Deletes all data associated with a user when they delete their account.
 * This is an HTTPS Callable function, meaning it must be triggered by the client app.
 */
exports.deleteUserAccount = functions.https.onCall(async (data, context) => {
  // Check if the user is authenticated.
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const uid = context.auth.uid;

  try {
    // 1. Delete user from Firebase Authentication
    await admin.auth().deleteUser(uid);
    console.log(`Successfully deleted auth user: ${uid}`);

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

  } catch (error) {
    console.error("Error deleting user:", error);
    throw new functions.https.HttpsError(
      "internal",
      "An error occurred while deleting the user account."
    );
  }
});


/**
 * Cloud Function to send a push notification for an incoming call.
 */
exports.sendCallNotification = functions.firestore
  .document('calls/{callId}')
  .onCreate(async (snapshot, context) => {
    const callData = snapshot.data();
    if (!callData) {
      console.log('No data associated with the call event.');
      return;
    }

    const { calleeId, callerName } = callData;

    // Get the callee's user document to find their FCM token
    const userDocRef = admin.firestore().collection('users').doc(calleeId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      console.log(`User document not found for calleeId: ${calleeId}`);
      return;
    }

    const userData = userDoc.data();
    const fcmToken = userData?.fcmToken;

    if (!fcmToken) {
      console.log(`FCM token not found for calleeId: ${calleeId}`);
      return;
    }

    // Construct the notification message payload for the call
    const payload = {
      notification: {
        title: 'Incoming Call',
        body: `${callerName || 'Someone'} is calling you on FlixTrend!`,
        icon: '/icon-192x192.png', // Or a specific call URL
        click_action: 'https://flixtrendmvp-a2002.web.app/signal', // Or a specific call URL
      },
    };

    // Send the notification using the FCM token
    try {
      const response = await admin.messaging().sendToDevice(fcmToken, payload);
      console.log('Successfully sent call notification:', response);
    } catch (error) {
      console.error('Error sending call notification:', error);
    }
  });


/**
 * Deletes a post and all its associated subcollections (comments, stars, relays).
 * This is an HTTPS Callable function.
 */
exports.deletePost = functions.https.onCall(async (data, context) => {
  const { postId } = data;
  const uid = context.auth?.uid;

  if (!uid) {
    throw new functions.https.HttpsError("unauthenticated", "You must be logged in to delete a post.");
  }

  const postRef = db.collection("posts").doc(postId);

  try {
    const postDoc = await postRef.get();
    if (!postDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Post not found.");
    }

    const postData = postDoc.data();
    if (postData?.userId !== uid) {
      throw new functions.https.HttpsError("permission-denied", "You can only delete your own posts.");
    }
    
    // Using a recursive delete utility for subcollections
    // This is a more robust way to handle subcollection deletion
    const deleteSubcollection = async (collectionRef: admin.firestore.CollectionReference) => {
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
      } catch (error) {
        // If the subcollection doesn't exist, we can safely ignore the error.
        if ((error as any).code === 'NOT_FOUND' || (error as any).code === 5) {
             console.log(`Subcollection not found, skipping: ${collectionRef.path}`);
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

  } catch (error) {
    console.error("Error deleting post:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError("internal", "An error occurred while deleting the post.");
  }
});
