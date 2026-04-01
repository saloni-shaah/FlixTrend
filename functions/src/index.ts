
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
const messaging = admin.messaging();

// --- Helper Functions ---

async function sendPushNotification(userId: string, title: string, body: string, data: any = {}) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        const fcmToken = userDoc.data()?.fcmToken;

        if (!fcmToken) {
            logger.info(`No FCM token found for user ${userId}. Skipping notification.`);
            return;
        }

        const message = {
            token: fcmToken,
            notification: { title, body },
            data: { ...data, click_action: "FLIXTREND_NOTIFICATION_CLICK" },
            android: {
                priority: "high" as const,
                notification: {
                    channelId: "flixtrend_general",
                    clickAction: "FLIXTREND_NOTIFICATION_CLICK",
                }
            }
        };

        await messaging.send(message);
        logger.info(`Notification sent to user ${userId}`);
    } catch (error) {
        logger.error(`Error sending notification to user ${userId}:`, error);
    }
}

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

// Trigger: Update post comment count when a new comment is added
export const onCommentCreate = v1.firestore
    .document('posts/{postId}/comments/{commentId}')
    .onCreate(async (snap, context) => {
        const { postId } = context.params;
        const postRef = db.collection('posts').doc(postId);
        try {
            await postRef.update({ commentCount: FieldValue.increment(1) });
            logger.info(`Incremented comment count for post ${postId}`);
        } catch (error) {
            logger.error(`Error incrementing comment count for post ${postId}:`, error);
        }
    });

// Trigger: New message in a chat
export const onNewMessage = v1.firestore
    .document('chats/{chatId}/messages/{messageId}')
    .onCreate(async (snap, context) => {
        const message = snap.data();
        const { chatId } = context.params;
        const senderId = message.sender;

        // For DMs, find the other participant
        if (chatId.includes('_')) {
            const recipientId = chatId.split('_').find(id => id !== senderId);
            if (recipientId) {
                const senderSnap = await db.collection('users').doc(senderId).get();
                const senderName = senderSnap.data()?.name || "Someone";

                let body = message.text || "Sent a media message";
                if (message.type === 'audio') body = "🎙️ Sent a voice message";
                if (message.type === 'image') body = "📷 Sent an image";

                await sendPushNotification(
                    recipientId,
                    senderName,
                    body,
                    { type: 'message', targetId: chatId }
                );
            }
        }
    });

// Trigger: New follower
export const onNewFollower = v1.firestore
    .document('users/{userId}/followers/{followerId}')
    .onCreate(async (snap, context) => {
        const { userId, followerId } = context.params;

        const followerSnap = await db.collection('users').doc(followerId).get();
        const followerName = followerSnap.data()?.name || "Someone";

        await sendPushNotification(
            userId,
            "New Follower!",
            `${followerName} is now following your squad.`,
            { type: 'profile', targetId: followerId }
        );
    });

// Trigger: New Drop Prompt
export const onNewDropPrompt = v1.firestore
    .document('dropPrompts/{promptId}')
    .onCreate(async (snap, context) => {
        const prompt = snap.data();

        const usersSnap = await db.collection('users').where('fcmToken', '!=', null).get();

        const notifications = usersSnap.docs.map(userDoc =>
            sendPushNotification(
                userDoc.id,
                "New Drop Challenge!",
                prompt.text,
                { type: 'drop', targetId: context.params.promptId }
            )
        );

        await Promise.all(notifications);
    });

export const onUserDelete = v1.auth.user().onDelete(async (user) => {
    logger.info(`User ${user.uid} is being deleted. Cleaning up data.`);
    const userRef = db.collection('users').doc(user.uid);
    await userRef.delete();
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
    if (!username || typeof username !== 'string') {
        throw new HttpsError("invalid-argument", "A valid username must be provided.");
    }
    const snapshot = await db.collection('usernames').doc(username.toLowerCase()).get();
    return { exists: snapshot.exists };
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

export * from "./process-media";
