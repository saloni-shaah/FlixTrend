
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp, doc, collection, query, where, getDocs, limit, writeBatch, setDoc, updateDoc, arrayUnion, arrayRemove, deleteField } from "firebase-admin/firestore";
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
 * Sets the creation timestamp and initial accolades for a new user.
 */
export const onNewUserCreate = functions.auth.user().onCreate(async (user) => {
    const userRef = doc(db, 'users', user.uid);
    try {
        const postSnap = await getDocs(query(collection(db, 'posts'), where('userId', '==', user.uid), limit(1)));
        const accolades = [];
        if(!postSnap.empty) {
            accolades.push('vibe_starter');
        }

        await setDoc(userRef, {
            createdAt: FieldValue.serverTimestamp(),
            profileComplete: false,
            accolades: accolades
        }, { merge: true });
        logger.info(`User document created for ${user.uid}`);
    } catch (error) {
        logger.error(`Error processing new user ${user.uid}:`, error);
    }
});


/**
 * A generic function to send notifications.
 */
export const sendNotification = functions.firestore
  .document('users/{userId}/notifications/{notificationId}')
  .onCreate(async (snapshot, context) => {
    const { userId, notificationId } = context.params;
    const notification = snapshot.data();
    if (!notification) {
      logger.log('No notification data found for', notificationId);
      return;
    }

    const { type, fromUsername, postContent } = notification;
   
    // Fetch the user's FCM token
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      logger.log('User not found:', userId);
      return;
    }
    const fcmToken = userDoc.data()?.fcmToken;

    if (!fcmToken) {
      logger.log('FCM token not found for user', userId);
      return;
    }

    let notificationTitle = "You have a new notification";
    let notificationBody = "Someone interacted with you on FlixTrend!";

    // Customize notification messages based on type
    switch(type) {
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
        icon: '/icon-192x192.png',
        click_action: 'https://flixtrend-v2.web.app/home', 
      },
    };

    try {
      await getMessaging().sendToDevice(fcmToken, payload);
      logger.info('Successfully sent notification to user:', userId);
    } catch (error) {
      logger.error('Error sending notification:', error);
    }
  });


/**
 * Deletes a user's account and all associated data.
 */
export const deleteUserAccount = onCall(async (request) => {
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError("unauthenticated", "Authentication is required to delete an account.");
  }

  try {
    const bucket = storage.bucket();

    // 1. Delete user's posts and their subcollections
    const postsQuery = admin.firestore().collection('posts').where('userId', '==', uid);
    const postsSnap = await postsQuery.get();
    const batch = admin.firestore().batch();
    for (const postDoc of postsSnap.docs) {
      // Also delete associated storage files if any
      const postData = postDoc.data();
      if (postData.mediaUrl) {
          const urls = Array.isArray(postData.mediaUrl) ? postData.mediaUrl : [postData.mediaUrl];
          for (const url of urls) {
              try {
                  const filePath = new URL(url).pathname.split('/').pop()?.split('?')[0];
                  if (filePath) {
                      await bucket.file(`user_uploads/${decodeURIComponent(filePath)}`).delete().catch(err => logger.warn(`Could not delete storage file ${filePath}:`, err));
                  }
              } catch(e) {
                  logger.warn(`Could not parse or delete storage URL ${url}:`, e);
              }
          }
      }
      batch.delete(postDoc.ref);
    }
    
    // 2. Delete user's profile document and other root-level data
    batch.delete(admin.firestore().collection('users').doc(uid));

    // Commit batched Firestore deletions
    await batch.commit();

    // 3. Delete from Firebase Authentication
    await admin.auth().deleteUser(uid);
    
    logger.info(`Successfully deleted account and all data for user ${uid}.`);
    return { success: true, message: 'Account deleted successfully.' };

  } catch (error) {
    logger.error(`Error deleting user account ${uid}:`, error);
    throw new HttpsError("internal", "Failed to delete account. Please try again later.");
  }
});


/**
 * When a call is created, this function sends a push notification to the callee.
 * The notification payload includes the callId, which the client uses to join the call.
 */
export const onCallCreated = functions.firestore
    .document('calls/{callId}')
    .onCreate(async (snap) => {
        const callData = snap.data();
        if (!callData) {
            logger.log('No call data found');
            return;
        }

        const { calleeId, callerName } = callData;

        if (!calleeId) {
            logger.log('calleeId is missing');
            return;
        }
        
        const userDocRef = doc(db, 'users', calleeId);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
            logger.log('Callee user document not found');
            return;
        }

        const fcmToken = userDoc.data()?.fcmToken;
        if (!fcmToken) {
            logger.log(`FCM token not found for callee ${calleeId}. Cannot send push notification.`);
            return;
        }
        
        // Payload now contains the callId for the client to handle
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
            apns: {
                headers: {
                    'apns-priority': '10',
                },
                payload: {
                    aps: {
                        sound: 'ringtone.mp3',
                        'content-available': 1,
                    },
                },
            },
            android: {
                priority: 'high',
                notification: {
                    sound: 'ringtone',
                    channel_id: 'incoming_calls',
                },
            },
        };

        try {
            // @ts-ignore
            await getMessaging().send(payload);
            logger.info('Successfully sent call notification');
        } catch (error) {
            logger.error('Error sending call notification:', error);
        }
    });


/**
 * Deletes a post and all its associated subcollections (comments, stars, relays).
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
 * Triggered when a user marks a chat for deletion. If all participants have
 * deleted it, the entire chat history is purged.
 */
export const onChatDelete = functions.firestore
  .document('users/{userId}/deletedChats/{chatId}')
  .onCreate(async (snap, context) => {
    const { chatId } = context.params;
    const chatData = snap.data();
    const participants = chatData.participants || [];

    if (participants.length === 0) {
      logger.info(`Chat ${chatId} has no participants listed. Skipping cleanup.`);
      return;
    }

    // Check if all participants have marked this chat as deleted
    const allDeletedChecks = participants.map(async (pId: string) => {
        const deletedDocRef = doc(db, `users/${pId}/deletedChats/${chatId}`);
        const docSnap = await getDoc(deletedDocRef);
        return docSnap.exists();
    });

    const allDeletedResults = await Promise.all(allDeletedChecks);

    if (allDeletedResults.every(Boolean)) {
      logger.info(`All participants have deleted chat ${chatId}. Purging messages.`);
      
      const chatMessagesRef = collection(db, 'chats', chatId, 'messages');
      const messagesSnap = await getDocs(chatMessagesRef);

      const batch = writeBatch(db);
      messagesSnap.forEach(doc => batch.delete(doc.ref));
      
      await batch.commit();
      logger.info(`Successfully purged messages for chat ${chatId}.`);
    } else {
      logger.info(`Chat ${chatId} still active for some participants. Not purging.`);
    }
  });


/**
 * Automatically cleans up expired flashes from Firestore and Firebase Storage.
 */
export const cleanupExpiredFlashes = functions.pubsub.schedule('every 1 hours').onRun(async (context) => {
    logger.info('Running expired flashes cleanup job.');
    const now = Timestamp.now();
    
    const expiredFlashesQuery = query(collection(db, 'flashes'), where('expiresAt', '<=', now));
    const expiredFlashesSnap = await getDocs(expiredFlashesQuery);

    if (expiredFlashesSnap.empty) {
        logger.info('No expired flashes to clean up.');
        return null;
    }

    const batch = writeBatch(db);
    const deletePromises: Promise<any>[] = [];

    expiredFlashesSnap.forEach(docSnap => {
        logger.info(`Processing expired flash: ${docSnap.id}`);
        const flashData = docSnap.data();

        batch.delete(docSnap.ref);

        if (flashData.mediaUrl) {
            try {
                const fileUrl = new URL(flashData.mediaUrl);
                const filePath = decodeURIComponent(fileUrl.pathname.split('/').pop() || '');
                if (filePath) {
                    const fileRef = storage.bucket().file(filePath);
                    deletePromises.push(fileRef.delete().catch(err => {
                        logger.error(`Failed to delete storage file ${filePath} for flash ${docSnap.id}:`, err);
                    }));
                }
            } catch (error) {
                 logger.error(`Invalid mediaUrl for flash ${docSnap.id}: ${flashData.mediaUrl}`, error);
            }
        }
    });

    deletePromises.push(batch.commit());
    
    await Promise.all(deletePromises);
    
    logger.info(`Cleanup complete. Deleted ${expiredFlashesSnap.size} expired flashes.`);
    return null;
});

/**
 * Checks for scheduled posts and sends notifications.
 */
export const sendScheduledPostNotifications = functions.pubsub.schedule('every 1 minutes').onRun(async (context) => {
    const now = Timestamp.now();
    const fiveMinutesFromNow = Timestamp.fromMillis(now.toMillis() + 5 * 60 * 1000);

    const q = query(
        collection(db, 'posts'),
        where('publishAt', '<=', fiveMinutesFromNow),
        where('publishAt', '>', now),
        where('notificationSent', '==', false)
    );

    const scheduledPostsSnap = await getDocs(q);

    if (scheduledPostsSnap.empty) {
        return null;
    }

    const notificationPromises: Promise<any>[] = [];
    const batch = writeBatch(db);

    for (const postDoc of scheduledPostsSnap.docs) {
        const post = postDoc.data();
        const creatorId = post.userId;
        const creatorUsername = post.username;

        const creatorDoc = await getDoc(doc(db, 'users', creatorId));
        if (creatorDoc.exists() && creatorDoc.data()?.fcmToken) {
            const notifRef = collection(db, 'users', creatorId, 'notifications');
            notificationPromises.push(addDoc(notifRef, {
                type: 'schedule_reminder',
                fromUsername: 'FlixTrend',
                postTitle: post.title,
                createdAt: serverTimestamp(),
                read: false,
            }));
        }

        const followersRef = collection(db, 'users', creatorId, 'followers');
        const followersSnap = await getDocs(followersRef);
        
        followersSnap.forEach(followerDoc => {
             const notifRef = collection(db, 'users', followerDoc.id, 'notifications');
             notificationPromises.push(addDoc(notifRef, {
                type: 'live_starting',
                fromUsername: creatorUsername,
                fromAvatarUrl: post.avatar_url,
                postTitle: post.title,
                postId: postDoc.id,
                createdAt: serverTimestamp(),
                read: false,
             }));
        });
        
        batch.update(postDoc.ref, { notificationSent: true });
    }

    notificationPromises.push(batch.commit());
    await Promise.all(notificationPromises);
    
    logger.info(`Sent notifications for ${scheduledPostsSnap.size} scheduled posts.`);
    return null;
});

/**
 * Periodically updates user accolades based on follower counts and other metrics.
 */
export const updateAccolades = functions.pubsub.schedule('every 1 hours').onRun(async (context) => {
    logger.info('Running accolades update job.');

    try {
        const usersRef = collection(db, 'users');
        const usersSnap = await getDocs(usersRef);

        const usersWithFollowerCount = await Promise.all(usersSnap.docs.map(async (userDoc) => {
            const followersSnap = await getDocs(collection(userDoc.ref, 'followers'));
            return {
                id: userDoc.id,
                ...userDoc.data(),
                followerCount: followersSnap.size,
            };
        }));

        // --- Top Follower Accolades ---
        usersWithFollowerCount.sort((a, b) => b.followerCount - a.followerCount);
        const top3 = usersWithFollowerCount.slice(0, 3);
        const topIds = top3.map(u => u.id);

        // Remove old top follower badges
        const oldTopUsersQuery = query(usersRef, where('accolades', 'array-contains-any', ['top_1_follower', 'top_2_follower', 'top_3_follower']));
        const oldTopUsersSnap = await getDocs(oldTopUsersQuery);
        for (const userDoc of oldTopUsersSnap.docs) {
            if (!topIds.includes(userDoc.id)) {
                await updateDoc(userDoc.ref, {
                    accolades: arrayRemove('top_1_follower', 'top_2_follower', 'top_3_follower')
                });
            }
        }

        // Award new top follower badges
        if (top3[0]) await updateDoc(doc(db, 'users', top3[0].id), { accolades: arrayUnion('top_1_follower') });
        if (top3[1]) await updateDoc(doc(db, 'users', top3[1].id), { accolades: arrayUnion('top_2_follower') });
        if (top3[2]) await updateDoc(doc(db, 'users', top3[2].id), { accolades: arrayUnion('top_3_follower') });

        // --- Milestone Accolades ---
        for (const user of usersWithFollowerCount) {
            const userRef = doc(db, 'users', user.id);
            const currentAccolades = user.accolades || [];

            // Social Butterfly
            if (user.followerCount >= 50 && !currentAccolades.includes('social_butterfly')) {
                await updateDoc(userRef, { accolades: arrayUnion('social_butterfly') });
            }
        }

        logger.info('Accolades update complete.');
        return null;

    } catch (error) {
        logger.error("Error updating accolades:", error);
        return null;
    }
});

/**
 * Toggles a user's account between enabled and disabled.
 */
export const toggleAccountStatus = onCall(async (request) => {
    const callingUid = request.auth?.uid;
    if (!callingUid) {
        throw new HttpsError("unauthenticated", "Authentication is required.");
    }
    
    // Check if the caller is an admin
    const adminUserDoc = await admin.firestore().collection('users').doc(callingUid).get();
    const adminUserData = adminUserDoc.data();
    const isAdmin = adminUserData?.role?.includes('founder') || adminUserData?.role?.includes('developer');

    // Or if the user is disabling their own account
    const isSelf = callingUid === request.data.uid;

    if (!isAdmin && !isSelf) {
        throw new HttpsError("permission-denied", "You do not have permission to perform this action.");
    }

    const { uid, disable } = request.data;
    if (!uid || typeof disable !== 'boolean') {
        throw new HttpsError("invalid-argument", "Missing uid or disable status.");
    }

    try {
        await admin.auth().updateUser(uid, { disabled: disable });
        logger.info(`Successfully ${disable ? 'disabled' : 'enabled'} account for user ${uid} by ${callingUid}.`);
        return { success: true, message: `Account has been ${disable ? 'disabled' : 'enabled'}.` };
    } catch (error) {
        logger.error(`Error toggling account status for ${uid}:`, error);
        throw new HttpsError("internal", "Failed to update account status.");
    }
});

/**
 * Deletes a chat message, either for everyone or just for the calling user.
 */
export const deleteMessage = onCall(async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
        throw new HttpsError("unauthenticated", "You must be logged in.");
    }

    const { chatId, messageId, mode } = request.data;
    if (!chatId || !messageId || !mode) {
        throw new HttpsError("invalid-argument", "Missing required parameters.");
    }

    const messageRef = doc(db, `chats/${chatId}/messages/${messageId}`);

    try {
        if (mode === 'everyone') {
            // Check if user is the sender to allow "delete for everyone"
            const messageSnap = await getDoc(messageRef);
            if (messageSnap.exists() && messageSnap.data().sender === uid) {
                await deleteDoc(messageRef);
                return { success: true, message: 'Message deleted for everyone.' };
            } else {
                throw new HttpsError("permission-denied", "You can only delete your own messages for everyone.");
            }
        } else if (mode === 'me') {
            await updateDoc(messageRef, {
                deletedFor: arrayUnion(uid)
            });
            return { success: true, message: 'Message deleted for you.' };
        } else {
            throw new HttpsError("invalid-argument", "Invalid deletion mode specified.");
        }
    } catch(error) {
        logger.error("Error deleting message:", error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError("internal", "Could not delete message.");
    }
});
