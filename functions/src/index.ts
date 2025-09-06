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
