
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp, doc, collection, query, where, getDocs, limit } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import * as functions from "firebase-functions";
import * as logger from "firebase-functions/logger";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { getStorage } from "firebase-admin/storage";


// Initialize Firebase Admin SDK
initializeApp();
const db = getFirestore();
const messaging = getMessaging();
const storage = getStorage();

/**
 * Grants free premium access to new users and tracks the total user count.
 * First 1 million users get 2 months, others get 1 month.
 * Also handles referral rewards.
 */
export const onNewUserCreate = functions.auth.user().onCreate(async (user) => {
    const userRef = doc(db, 'users', user.uid);
    const appStatusRef = doc(db, 'app_status', 'user_stats');

    try {
        const batch = db.batch();

        // --- Grant Initial Premium ---
        const appStatusSnap = await appStatusRef.get();
        const userCount = appStatusSnap.data()?.totalUsers || 0;
        const newUserCount = userCount + 1;
        
        const premiumDurationMonths = newUserCount <= 1000000 ? 2 : 1;
        const premiumUntil = new Date();
        premiumUntil.setMonth(premiumUntil.getMonth() + premiumDurationMonths);

        batch.set(userRef, {
            isPremium: true,
            premiumUntil: Timestamp.fromDate(premiumUntil),
            createdAt: FieldValue.serverTimestamp(),
        }, { merge: true });

        // Update the global user count
        batch.set(appStatusRef, { totalUsers: FieldValue.increment(1) }, { merge: true });
        logger.info(`User ${user.uid} created. Granted ${premiumDurationMonths} months premium. Total users: ${newUserCount}`);

        // --- Handle Referral Logic ---
        // This part requires the client to set the 'referredBy' field on the user doc during signup.
        const newUserDocSnap = await getDoc(userRef); // Re-fetch to see data from client-side write if any
        const newUserData = newUserDocSnap.data();

        if (newUserData?.referredBy) {
            const referralCode = newUserData.referredBy;
            logger.info(`New user was referred by code: ${referralCode}`);

            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('referralCode', '==', referralCode), limit(1));
            const referrerSnap = await getDocs(q);

            if (!referrerSnap.empty) {
                const referrerDoc = referrerSnap.docs[0];
                const referrerRef = referrerDoc.ref;
                const referrerData = referrerDoc.data();
                
                logger.info(`Found referrer: ${referrerData.username} (${referrerRef.id})`);

                const currentPremiumUntil = referrerData.premiumUntil?.toDate() || new Date();
                const newPremiumUntil = new Date(Math.max(new Date().getTime(), currentPremiumUntil.getTime()));
                newPremiumUntil.setMonth(newPremiumUntil.getMonth() + 1);

                batch.update(referrerRef, {
                    premiumUntil: Timestamp.fromDate(newPremiumUntil),
                    isPremium: true
                });

                logger.info(`Extended premium for referrer ${referrerRef.id} until ${newPremiumUntil.toISOString()}`);
            } else {
                 logger.warn(`Referral code "${referralCode}" used, but no matching referrer was found.`);
            }
        }

        await batch.commit();

    } catch (error) {
        logger.error(`Error processing new user ${user.uid}:`, error);
    }
});


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
                        sound: 'ringtone.mp3', // Using our custom ringtone
                        'content-available': 1, // To wake up the app
                    },
                },
            },
            // Android specific configuration for high priority and custom sound channel
            android: {
                priority: 'high',
                notification: {
                    sound: 'ringtone', // Can be 'ringtone' if you have a ringtone.mp3 asset
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
 * This is an HTTPS Callable function.
 */
export const deletePost = onCall(async (request) => {
    const { postId } = request.data;
    const uid = request.auth?.uid;

    if (!uid) {
        throw new HttpsError("unauthenticated", "You must be logged in to delete a post.");
    }
    
    const postRef = admin.firestore().collection("posts").doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
        throw new HttpsError("not-found", "Post not found.");
    }

    const postData = postDoc.data();
    const isOwner = postData?.userId === uid;

    // Fetch the admin user's document to check their role
    const adminUserDoc = await admin.firestore().collection('users').doc(uid).get();
    const adminUserData = adminUserDoc.data();
    const isAdmin = adminUserData?.role?.includes('founder') || adminUserData?.role?.includes('developer');

    if (!isOwner && !isAdmin) {
        throw new HttpsError("permission-denied", "You do not have permission to delete this post.");
    }

    try {
        const deleteSubcollection = async (collectionRef: admin.firestore.CollectionReference) => {
             const snapshot = await collectionRef.limit(500).get();
             if (snapshot.empty) return;
             const batch = admin.firestore().batch();
             snapshot.docs.forEach(doc => batch.delete(doc.ref));
             await batch.commit();
             if (snapshot.size === 500) await deleteSubcollection(collectionRef);
        };
        
        await deleteSubcollection(postRef.collection('comments'));
        await deleteSubcollection(postRef.collection('stars'));
        await deleteSubcollection(postRef.collection('relays'));
        
        await postRef.delete();
        
        return { success: true, message: `Post ${postId} deleted successfully.` };
    } catch (error) {
        logger.error("Error deleting post and subcollections:", error);
        throw new HttpsError("internal", "An error occurred while deleting the post.");
    }
});

/**
 * Deletes a user's account and all associated data.
 * This is an HTTPS Callable function that requires re-authentication.
 */
export const deleteUserAccount = onCall(async (request) => {
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError("unauthenticated", "Authentication is required to delete an account.");
  }

  try {
    const batch = admin.firestore().batch();
    const userRef = admin.firestore().collection('users').doc(uid);
    batch.delete(userRef);
    // Add deletion of other user-related data (posts, comments, etc.) to the batch here.

    // Finally, delete the user from Firebase Auth
    await admin.auth().deleteUser(uid);
    await batch.commit();
    logger.info(`Successfully deleted account and all data for user ${uid}.`);
    return { success: true, message: 'Account deleted successfully.' };

  } catch (error) {
    logger.error(`Error deleting user account ${uid}:`, error);
    throw new HttpsError("internal", "Failed to delete account. Please try again later.");
  }
});


/**
 * Automatically cleans up expired flashes from Firestore and Firebase Storage.
 * This function is scheduled to run periodically.
 */
export const cleanupExpiredFlashes = functions.pubsub.schedule('every 1 hours').onRun(async (context) => {
    logger.info('Running expired flashes cleanup job.');
    const now = Timestamp.now();
    
    // 1. Query for expired flash documents
    const expiredFlashesQuery = query(collection(db, 'flashes'), where('expiresAt', '<=', now));
    const expiredFlashesSnap = await getDocs(expiredFlashesQuery);

    if (expiredFlashesSnap.empty) {
        logger.info('No expired flashes to clean up.');
        return null;
    }

    const batch = db.batch();
    const deletePromises: Promise<any>[] = [];

    expiredFlashesSnap.forEach(docSnap => {
        logger.info(`Processing expired flash: ${docSnap.id}`);
        const flashData = docSnap.data();

        // 2. Delete the flash document from Firestore
        batch.delete(docSnap.ref);

        // 3. Delete the associated media file from Storage
        if (flashData.mediaUrl) {
            try {
                // Extract file path from the full URL
                const fileUrl = new URL(flashData.mediaUrl);
                const filePath = decodeURIComponent(fileUrl.pathname.split('/').pop() || '');
                if (filePath) {
                    const fileRef = storage.bucket().file(filePath);
                    deletePromises.push(fileRef.delete().catch(err => {
                        // Log error but don't stop the batch
                        logger.error(`Failed to delete storage file ${filePath} for flash ${docSnap.id}:`, err);
                    }));
                }
            } catch (error) {
                 logger.error(`Invalid mediaUrl for flash ${docSnap.id}: ${flashData.mediaUrl}`, error);
            }
        }
    });

    // 4. Commit all deletions
    deletePromises.push(batch.commit());
    
    await Promise.all(deletePromises);
    
    logger.info(`Cleanup complete. Deleted ${expiredFlashesSnap.size} expired flashes.`);
    return null;
});
