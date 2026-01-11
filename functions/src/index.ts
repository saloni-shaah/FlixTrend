
import { initializeApp } from "firebase-admin/app";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import * as admin from "firebase-admin";
import * as v1 from "firebase-functions/v1";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { getStorage } from "firebase-admin/storage";

// Initialize Firebase Admin SDK
initializeApp();
const db = admin.firestore();
const storage = getStorage();

// --- V1 Cloud Functions ---

export const onNewUserCreate = v1.auth.user().onCreate(async (user) => {
    const userRef = db.collection('users').doc(user.uid);
    try {
        const postSnap = await db.collection('posts').where('userId', '==', user.uid).limit(1).get();
        const accolades = [];
        if(!postSnap.empty) {
            accolades.push('vibe_starter');
        }

        const premiumUntil = new Date();
        premiumUntil.setMonth(premiumUntil.getMonth() + 1);

        await userRef.set({
            createdAt: FieldValue.serverTimestamp(),
            profileComplete: false,
            accolades: accolades,
            isPremium: true,
            premiumUntil: Timestamp.fromDate(premiumUntil)
        }, { merge: true });
        
        const appStatusRef = db.collection('app_status').doc('user_stats');
        await appStatusRef.set({ totalUsers: FieldValue.increment(1) }, { merge: true });

        logger.info(`User document created for ${user.uid}`);
    } catch (error) {
        logger.error(`Error processing new user ${user.uid}:`, error);
    }
});

export const onUserDelete = v1.auth.user().onDelete(async (user) => {
    logger.info(`User ${user.uid} is being deleted. Cleaning up data.`);
    const userRef = db.collection('users').doc(user.uid);
    await userRef.delete();
});

export const sendNotification = v1.firestore
  .document('users/{userId}/notifications/{notificationId}')
  .onCreate(async (snapshot, context) => {
    const { userId, notificationId } = context.params;
    const notification = snapshot.data();
    if (!notification) {
      logger.log('No notification data found for', notificationId);
      return;
    }

    const { type, fromUsername, postContent, fromAvatarUrl } = notification;
   
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      logger.log('User not found:', userId);
      return;
    }
    const fcmToken = userDoc.data()?.fcmToken;

    if (!fcmToken) {
      logger.log(`FCM token not found for user ${userId}. Cannot send push notification.`);
      return;
    }

    let notificationTitle = "You have a new notification";
    let notificationBody = "Someone interacted with you on FlixTrend!";

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
        icon: fromAvatarUrl || '/icon-192x192.png',
        click_action: 'https://flixtrend.in/home', 
      },
    };

    try {
      await admin.messaging().sendToDevice(fcmToken, payload);
      logger.info('Successfully sent notification to user:', userId);
    } catch (error) {
      logger.error('Error sending notification:', error);
    }
  });

export const onCallCreated = v1.firestore
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
        
        const userDoc = await db.collection('users').doc(calleeId).get();
        
        if (!userDoc.exists) {
            logger.log('Callee user document not found');
            return;
        }

        const fcmToken = userDoc.data()?.fcmToken;
        if (!fcmToken) {
            logger.log(`FCM token not found for callee ${calleeId}. Cannot send push notification.`);
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
            logger.info('Successfully sent call notification');
        } catch (error) {
            logger.error('Error sending call notification:', error);
        }
    });

export const onChatDelete = v1.firestore
  .document('users/{userId}/deletedChats/{chatId}')
  .onCreate(async (snap, context) => {
    const { chatId } = context.params;
    const chatData = snap.data();
    const participants = chatData.participants || [];

    if (participants.length === 0) {
      logger.info(`Chat ${chatId} has no participants listed. Skipping cleanup.`);
      return;
    }

    const allDeletedChecks = participants.map(async (pId: string) => {
        const deletedDocRef = db.collection('users').doc(pId).collection('deletedChats').doc(chatId);
        const docSnap = await deletedDocRef.get();
        return docSnap.exists;
    });

    const allDeletedResults = await Promise.all(allDeletedChecks);

    if (allDeletedResults.every(Boolean)) {
      logger.info(`All participants have deleted chat ${chatId}. Purging messages.`);
      
      const chatMessagesRef = db.collection('chats').doc(chatId).collection('messages');
      const messagesSnap = await chatMessagesRef.get();

      const batch = db.batch();
      messagesSnap.forEach(doc => batch.delete(doc.ref));
      
      await batch.commit();
      logger.info(`Successfully purged messages for chat ${chatId}.`);
    } else {
      logger.info(`Chat ${chatId} still active for some participants. Not purging.`);
    }
  });


export const cleanupExpiredFlashes = v1.pubsub.schedule('every 1 hours').onRun(async (context) => {
    logger.info('Running expired flashes cleanup job.');
    const now = Timestamp.now();
    
    const expiredFlashesQuery = db.collection('flashes').where('expiresAt', '<=', now);
    const expiredFlashesSnap = await expiredFlashesQuery.get();

    if (expiredFlashesSnap.empty) {
        logger.info('No expired flashes to clean up.');
        return null;
    }

    const batch = db.batch();
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

export const sendScheduledPostNotifications = v1.pubsub.schedule('every 1 minutes').onRun(async (context) => {
    const now = Timestamp.now();
    const fiveMinutesFromNow = Timestamp.fromMillis(now.toMillis() + 5 * 60 * 1000);

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

        if (creatorDoc.exists && creatorDoc.data()?.fcmToken) {
            const notifRef = db.collection('users').doc(creatorId).collection('notifications');
            await notifRef.add({
                type: 'schedule_reminder',
                fromUsername: 'FlixTrend',
                postTitle: post.title,
                createdAt: FieldValue.serverTimestamp(),
                read: false,
            });
        }

        const followersSnap = await db.collection('users').doc(creatorId).collection('followers').get();
        
        followersSnap.forEach(async followerDoc => {
             const notifRef = db.collection('users').doc(followerDoc.id).collection('notifications');
             await notifRef.add({
                type: 'live_starting',
                fromUsername: creatorUsername,
                fromAvatarUrl: post.avatar_url,
                postTitle: post.title,
                postId: postDoc.id,
                createdAt: FieldValue.serverTimestamp(),
                read: false,
             });
        });
        
        batch.update(postDoc.ref, { notificationSent: true });
    }

    await batch.commit();
    logger.info(`Sent notifications for ${scheduledPostsSnap.size} scheduled posts.`);
    return null;
});

export const updateAccolades = v1.pubsub.schedule('every 1 hours').onRun(async (context) => {
    logger.info('Running accolades update job.');

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
                    accolades: FieldValue.arrayRemove('top_1_follower', 'top_2_follower', 'top_3_follower')
                });
            }
        }

        if (top3[0]) await db.collection('users').doc(top3[0].id).update({ accolades: FieldValue.arrayUnion('top_1_follower') });
        if (top3[1]) await db.collection('users').doc(top3[1].id).update({ accolades: FieldValue.arrayUnion('top_2_follower') });
        if (top3[2]) await db.collection('users').doc(top3[2].id).update({ accolades: FieldValue.arrayUnion('top_3_follower') });

        for (const user of usersWithFollowerCount) {
            const userRef = db.collection('users').doc(user.id);
            const currentAccolades = user.data.accolades || [];

            if (user.followerCount >= 50 && !currentAccolades.includes('social_butterfly')) {
                await userRef.update({ accolades: FieldValue.arrayUnion('social_butterfly') });
            }
        }

        logger.info('Accolades update complete.');
        return null;

    } catch (error) {
        logger.error("Error updating accolades:", error);
        return null;
    }
});


// --- V2 Callable Functions ---

export const checkUsername = onCall(async (request) => {
    const { username } = request.data;
    const snapshot = await db.collection('users').where('username', '==', username).get();
    return { exists: !snapshot.empty };
});

export const deleteUserAccount = onCall(async (request) => {
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError("unauthenticated", "Authentication is required to delete an account.");
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
    
    batch.delete(db.collection('users').doc(uid));
    await batch.commit();
    await admin.auth().deleteUser(uid);
    
    logger.info(`Successfully deleted account and all data for user ${uid}.`);
    return { success: true, message: 'Account deleted successfully.' };

  } catch (error) {
    logger.error(`Error deleting user account ${uid}:`, error);
    throw new HttpsError("internal", "Failed to delete account. Please try again later.");
  }
});

export const deletePost = onCall(async (request) => {
    const { postId } = request.data;
    const uid = request.auth?.uid;

    if (!uid) {
        throw new HttpsError("unauthenticated", "You must be logged in to delete a post.");
    }
    
    const postRef = db.collection("posts").doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
        throw new HttpsError("not-found", "Post not found.");
    }

    const postData = postDoc.data()!;
    const isOwner = postData.userId === uid;

    const adminUserDoc = await db.collection('users').doc(uid).get();
    const adminUserData = adminUserDoc.data();
    let isAdmin = false;
    if (adminUserData && adminUserData.role) {
        const userRole = adminUserData.role;
        if (typeof userRole === 'string') {
            isAdmin = userRole === 'founder';
        } else if (Array.isArray(userRole)) {
            isAdmin = userRole.includes('founder');
        }
    }

    if (!isOwner && !isAdmin) {
        throw new HttpsError("permission-denied", "You do not have permission to delete this post.");
    }

    try {
        const deleteSubcollection = async (collectionRef: admin.firestore.CollectionReference) => {
             const snapshot = await collectionRef.limit(500).get();
             if (snapshot.empty) return;
             const subBatch = db.batch();
             snapshot.docs.forEach(doc => subBatch.delete(doc.ref));
             await subBatch.commit();
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


export const deleteMessage = onCall(async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
        throw new HttpsError("unauthenticated", "You must be logged in.");
    }

    const { chatId, messageId, mode } = request.data;
    if (!chatId || !messageId || !mode) {
        throw new HttpsError("invalid-argument", "Missing required parameters.");
    }

    const messageRef = db.collection('chats').doc(chatId).collection('messages').doc(messageId);

    try {
        if (mode === 'everyone') {
            const messageSnap = await messageRef.get();
            if (messageSnap.exists && messageSnap.data()?.sender === uid) {
                await messageRef.delete();
                return { success: true, message: 'Message deleted for everyone.' };
            } else {
                throw new HttpsError("permission-denied", "You can only delete your own messages for everyone.");
            }
        } else if (mode === 'me') {
            await messageRef.update({
                deletedFor: FieldValue.arrayUnion(uid)
            });
            return { success: true, message: 'Message deleted for you.' };
        } else {
            throw new HttpsError("invalid-argument", "Invalid deletion mode specified.");
        }
    } catch(error: any) {
        logger.error("Error deleting message:", error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError("internal", "Could not delete message.");
    }
});


export const updatePost = onCall(async (request) => {
    const uid = request.auth?.uid;
    const { postId, newData } = request.data;
    if (!uid) throw new HttpsError("unauthenticated", "Authentication required.");

    const postRef = db.collection("posts").doc(postId);
    const postDoc = await postRef.get();
    if (!postDoc.exists || postDoc.data()?.userId !== uid) {
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

export const deleteComment = onCall(async (request) => {
    const uid = request.auth?.uid;
    const { postId, commentId } = request.data;

    if (!uid) {
        throw new HttpsError("unauthenticated", "You must be logged in to delete a comment.");
    }

    const postRef = db.collection("posts").doc(postId);
    const commentRef = postRef.collection("comments").doc(commentId);
    
    const commentDoc = await commentRef.get();

    if (!commentDoc.exists) {
        throw new HttpsError("not-found", "Comment not found.");
    }

    const commentData = commentDoc.data()!;
    
    if (uid !== commentData.userId) {
        throw new HttpsError("permission-denied", "You do not have permission to delete this comment.");
    }

    await commentRef.delete();
    await postRef.update({ commentCount: FieldValue.increment(-1) });

    return { success: true, message: "Comment deleted successfully." };
});

export const updateComment = onCall(async (request) => {
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

    return { success: true, message: "Comment updated. Thank you!" };
});

export const backfillPostCategories = onCall(async (request) => {
    // Optional: Add admin check for security
    const uid = request.auth?.uid;
    if (!uid) {
        throw new HttpsError("unauthenticated", "Authentication is required.");
    }
    // const adminUser = await admin.auth().getUser(uid);
    // if (!adminUser.customClaims?.admin) {
    //     throw new HttpsError("permission-denied", "You must be an admin to run this function.");
    // }

    const creatorCategoryMap: { [key: string]: string } = {
        'vlogs': 'daily', 'moments': 'daily', 'travel': 'daily', 'self': 'daily',
        'art': 'creative', 'photos': 'creative', 'design': 'creative', 'writing': 'creative',
        'gaming': 'play', 'challenges': 'play', 'comedy': 'play', 'reactions': 'play',
        'tips': 'learn', 'tech': 'learn', 'study': 'learn', 'explainers': 'learn',
        'music': 'culture', 'movies': 'culture', 'trends': 'culture', 'community': 'culture'
    };

    try {
        const postsRef = db.collection('posts');
        const snapshot = await postsRef.get();
        
        if (snapshot.empty) {
            logger.info("No posts found to backfill.");
            return { success: true, message: "No posts to process." };
        }
        
        const batchSize = 100;
        let batch = db.batch();
        let writeCount = 0;
        let processedCount = 0;

        for (const postDoc of snapshot.docs) {
            const postData = postDoc.data();

            // Skip if category already exists
            if (postData.category) {
                processedCount++;
                continue;
            }

            const userId = postData.userId;
            if (!userId) {
                processedCount++;
                continue;
            }

            const userDoc = await db.collection('users').doc(userId).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                const creatorType = userData?.creatorType;
                const mainCategory = creatorCategoryMap[creatorType] || null;

                if (mainCategory) {
                    batch.update(postDoc.ref, { category: mainCategory });
                    writeCount++;
                }
            }

            processedCount++;

            if (writeCount >= batchSize) {
                await batch.commit();
                logger.info(`Committed batch of ${writeCount} updates.`);
                batch = db.batch();
                writeCount = 0;
            }
        }

        // Commit any remaining writes
        if (writeCount > 0) {
            await batch.commit();
            logger.info(`Committed final batch of ${writeCount} updates.`);
        }

        logger.info(`Backfill complete. Processed ${processedCount} posts.`);
        return { success: true, message: `Successfully processed ${processedCount} posts.` };

    } catch (error) {
        logger.error("Error during post category backfill:", error);
        throw new HttpsError("internal", "An error occurred during the backfill process.");
    }
});

    