
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import * as functions from "firebase-functions";
import * as logger from "firebase-functions/logger";

// Initialize Firebase Admin SDK
initializeApp();
const db = getFirestore();
const messaging = getMessaging();

/**
 * A generic function to send notifications.
 * This can be triggered by creating a new document in a 'notifications' collection.
 */
export const sendNotification = functions.firestore
  .document('notifications/{notificationId}')
  .onCreate(async (snapshot) => {
    const notification = snapshot.data();
    if (!notification) {
      logger.log('No notification data found');
      return;
    }

    const { userId, type, message, author } = notification;
    if (!userId) {
      logger.log('User ID is missing');
      return;
    }

    // Fetch the user's FCM token
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      logger.log('User not found');
      return;
    }
    const fcmToken = userDoc.data()?.fcmToken;

    if (!fcmToken) {
      logger.log('FCM token not found for user', userId);
      return;
    }

    let notificationTitle = "You have a new notification";
    let notificationBody = message;

    // Customize notification messages based on type
    switch(type) {
        case 'like':
            notificationTitle = `New Like!`;
            notificationBody = `${author || 'Someone'} liked your post.`;
            break;
        case 'comment':
            notificationTitle = `New Comment!`;
            notificationBody = `${author || 'Someone'} commented on your post.`;
            break;
        case 'follow':
            notificationTitle = `New Follower!`;
            notificationBody = `${author || 'Someone'} started following you.`;
            break;
        case 'missed_call':
            notificationTitle = `Missed Call`;
            notificationBody = `You missed a call from ${author || 'Someone'}.`;
            break;
    }

    const payload = {
      notification: {
        title: notificationTitle,
        body: notificationBody,
        icon: '/icon-192x192.png',
        click_action: 'https://flixtrend.com/notifications', // Generic link, can be customized
      },
    };

    try {
      await messaging.sendToDevice(fcmToken, payload);
      logger.info('Successfully sent notification to user:', userId);
    } catch (error) {
      logger.error('Error sending notification:', error);
    }
  });


/**
 * Cloud Function to delete a user's data upon account deletion.
 * This cleans up Firestore and other related user data.
 */
export const onUserDelete = functions.auth.user().onDelete(async (user) => {
  logger.info(`User ${user.uid} is being deleted. Cleaning up data.`);
  const batch = db.batch();

  // Delete user document from 'users' collection
  const userRef = db.collection('users').doc(user.uid);
  batch.delete(userRef);

  // Here you can add more cleanup logic as your app grows. For example:
  // - Delete user's posts
  // - Delete user's comments
  // - Invalidate sessions

  try {
    await batch.commit();
    logger.info(`Successfully cleaned up data for user ${user.uid}.`);
  } catch (error) {
    logger.error(`Error cleaning up data for user ${user.uid}:`, error);
  }
});


/**
 * Sends a push notification to the callee when a new call document is created.
 * This is triggered whenever a call is initiated.
 */
export const onCallCreated = functions.firestore
    .document('calls/{callId}')
    .onCreate(async (snap) => {
        const callData = snap.data();
        if (!callData) {
            logger.log('No call data found in document');
            return;
        }

        const { calleeId, callerName } = callData;

        if (!calleeId) {
            logger.log('calleeId is missing from call document');
            return;
        }

        // Get the callee's user document to find their FCM token
        const userDocRef = db.collection('users').doc(calleeId);
        const userDoc = await userDocRef.get();
    
        if (!userDoc.exists) {
            logger.log(`User document not found for calleeId: ${calleeId}`);
            return;
        }
    
        const userData = userDoc.data();
        const fcmToken = userData?.fcmToken;
    
        if (!fcmToken) {
            logger.log(`FCM token not found for calleeId: ${calleeId}`);
            return;
        }
    
        // Construct a data-heavy payload for a ringtone effect
        const payload = {
            token: fcmToken,
            // Send all info in the data payload for the service worker to handle
            data: {
                type: 'incoming_call',
                title: 'Incoming Call',
                body: `${callerName || 'Someone'} is calling you on FlixTrend!`,
                icon: '/icon-192x192.png',
                click_action: 'https://flixtrend.com/signal',
            },
            // APNs (Apple) specific configuration for a critical alert with sound
            apns: {
                headers: {
                    'apns-push-type': 'alert', // Use 'alert' for web, 'voip' for native iOS
                    'apns-priority': '10', // Highest priority
                },
                payload: {
                    aps: {
                        sound: 'default', // Using a default sound, can be a custom file like 'ringtone.caf'
                        'content-available': 1, // To wake up the app
                    },
                },
            },
            // Android specific configuration for high priority and custom sound channel
            android: {
                priority: 'high',
                notification: {
                    sound: 'default', // Can be 'ringtone' if you have a ringtone.mp3 asset
                    channel_id: 'incoming_calls', // Requires a Notification Channel on the client
                },
            },
        };

        // Send the notification using the generic send method
        try {
            // @ts-ignore
            const response = await getMessaging().send(payload);
            logger.info('Successfully sent call notification:', response);
        } catch (error) {
            logger.error('Error sending call notification:', error);
        }
    });


/**
 * Deletes a post and all its associated subcollections (comments, stars, relays).
 * This ensures data integrity when a post is removed.
 */
export const onDeletePost = functions.firestore
    .document('posts/{postId}')
    .onDelete(async (snapshot, context) => {
        const { postId } = context.params;
        logger.info(`Post ${postId} is being deleted. Deleting subcollections.`);

        const subcollections = ['comments', 'stars', 'relays'];
        const batch = db.batch();

        for (const subcollection of subcollections) {
            const collectionRef = db.collection('posts').doc(postId).collection(subcollection);
            const documents = await collectionRef.get();
            documents.forEach(doc => {
                batch.delete(doc.ref);
            });
        }

        try {
            await batch.commit();
            logger.info(`Successfully deleted subcollections for post ${postId}.`);
        } catch (error) {
            logger.error(`Error deleting subcollections for post ${postId}:`, error);
        }
    });
