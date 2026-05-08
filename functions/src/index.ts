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

async function deleteSubcollection(collectionRef: admin.firestore.CollectionReference) {
    const snapshot = await collectionRef.limit(500).get();
    if (snapshot.empty) {
        return;
    }
    const batch = collectionRef.firestore.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    if (snapshot.size === 500) {
        await deleteSubcollection(collectionRef);
    }
}

// --- V1 Cloud Functions ---

export const onCommentCreate = v1.firestore
    .document('posts/{postId}/comments/{commentId}')
    .onCreate(async (snap, context) => {
        const { postId } = context.params;
        const postRef = db.collection('posts').doc(postId);
        try {
            await postRef.update({ 
                commentCount: FieldValue.increment(1),
                updatedAt: FieldValue.serverTimestamp()
            });
            logger.info(`Incremented comment count and updated timestamp for post ${postId}`);
        } catch (error) {
            logger.error(`Error updating post ${postId} on new comment:`, error);
        }
    });

export const onNewMessage = v1.firestore
    .document('chats/{chatId}/messages/{messageId}')
    .onCreate(async (snap, context) => {
        const message = snap.data();
        const { chatId } = context.params;
        const senderId = message.sender;

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
      await deleteSubcollection(chatMessagesRef);
      logger.info(`Successfully purged messages for chat ${chatId}.`);
    } else {
      logger.info(`Chat ${chatId} still active for some participants. Not purging.`);
    }
  });

export const cleanupExpiredFlashes = v1.pubsub.schedule('every 2 hours').onRun(async (context) => {
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
        const flashData = docSnap.data();
        batch.delete(docSnap.ref);

        if (flashData.mediaUrl) {
            try {
                const fileUrl = new URL(flashData.mediaUrl);
                const filePath = decodeURIComponent(fileUrl.pathname.split('/').pop() || '');
                if (filePath) {
                    const fileRef = storage.bucket().file(filePath);
                    deletePromises.push(fileRef.delete().catch(err => logger.error(`Failed to delete storage file ${filePath}:`, err)));
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

export const selectNextPrompt = v1.pubsub.schedule('0 23 * * *').timeZone('Asia/Kolkata').onRun(async (context) => {
    logger.info("Running daily prompt selection function.");

    const now = admin.firestore.Timestamp.now();
    const yesterday = new admin.firestore.Timestamp(now.seconds - 86400, now.nanoseconds);

    const activePromptQuery = db.collection('dropPrompts').where('expiresAt', '>', yesterday).orderBy('expiresAt', 'desc').limit(1);
    const activePromptSnap = await activePromptQuery.get();

    if (activePromptSnap.empty) {
        logger.info("No active prompt found. Cannot determine poll to process.");
        return;
    }

    const activePrompt = activePromptSnap.docs[0];
    const pollQuery = db.collection('drop_polls').where('promptId', '==', activePrompt.id).limit(1);
    const pollSnap = await pollQuery.get();

    if (pollSnap.empty) {
        logger.warn("No poll found for the active prompt. No new prompt will be created.");
        return;
    }

    const pollDoc = pollSnap.docs[0];
    const poll = pollDoc.data();
    const votesSnap = await pollDoc.ref.collection('votes').get();

    let winnerText = poll.options[0].text; // Default to first option

    if (!votesSnap.empty) {
        const voteCounts = new Map<number, number>();
        votesSnap.forEach(voteDoc => {
            const vote = voteDoc.data();
            voteCounts.set(vote.optionIdx, (voteCounts.get(vote.optionIdx) || 0) + 1);
        });

        const winnerIdx = [...voteCounts.entries()].reduce((a, e) => e[1] > a[1] ? e : a)[0];
        winnerText = poll.options[winnerIdx].text;
    }

    await createNewPrompt(winnerText);

    logger.info(`Cleaning up poll ${pollDoc.id} and its votes.`);
    await deleteSubcollection(pollDoc.ref.collection('votes'));

    const batch = db.batch();
    batch.delete(activePrompt.ref);
    batch.delete(pollDoc.ref);
    await batch.commit();

    logger.info("Successfully selected new prompt and cleaned up old documents.");
});

async function createNewPrompt(text: string) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    await db.collection('dropPrompts').add({
        text: text,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
    });
    logger.info(`New prompt created: "${text}"`);
}

export const cleanupOldDrops = v1.pubsub.schedule('0 23 * * *').timeZone('Asia/Kolkata').onRun(async (context) => {
    logger.info("Running weekly cleanup of old drops.");

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const timestamp = admin.firestore.Timestamp.fromDate(sevenDaysAgo);

    const oldDropsQuery = db.collection('drops').where('createdAt', '<=', timestamp);
    const oldDropsSnap = await oldDropsQuery.get();

    if (oldDropsSnap.empty) {
        logger.info("No old drops to clean up.");
        return;
    }

    const bucket = storage.bucket();
    const deletePromises: Promise<any>[] = [];

    oldDropsSnap.forEach(doc => {
        const drop = doc.data();
        if (drop.mediaUrl && Array.isArray(drop.mediaUrl)) {
            drop.mediaUrl.forEach((url: string) => {
                try {
                    const filePath = new URL(url).pathname.split('/').pop()?.split('?')[0];
                    if (filePath) {
                         deletePromises.push(bucket.file(decodeURIComponent(filePath)).delete().catch(err => logger.error("Failed to delete storage file:", err)));
                    }
                } catch(e) {
                    logger.warn(`Could not parse or delete storage URL ${url}:`, e);
                }
            });
        }
        deletePromises.push(doc.ref.delete());
    });

    await Promise.all(deletePromises);
    logger.info(`Cleanup complete. Deleted ${oldDropsSnap.size} old drops.`);
});

export const cleanupStaleDocuments = v1.pubsub.schedule('30 23 * * *').timeZone('Asia/Kolkata').onRun(async (context) => {
    logger.info("Running cleanup for documents older than 48 hours.");

    const fortyEightHoursAgo = new Date();
    fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);
    const timestamp = admin.firestore.Timestamp.fromDate(fortyEightHoursAgo);

    // Cleanup old drop prompts
    const oldPromptsQuery = db.collection('dropPrompts').where('createdAt', '<=', timestamp);
    const oldPromptsSnap = await oldPromptsQuery.get();
    if (!oldPromptsSnap.empty) {
        const batch = db.batch();
        oldPromptsSnap.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        logger.info(`Deleted ${oldPromptsSnap.size} old drop prompts.`);
    }

    // Cleanup old drop polls
    const oldPollsQuery = db.collection('drop_polls').where('createdAt', '<=', timestamp);
    const oldPollsSnap = await oldPollsQuery.get();
    if (!oldPollsSnap.empty) {
        const deletePromises = oldPollsSnap.docs.map(doc => deleteSubcollection(doc.ref.collection('votes')));
        await Promise.all(deletePromises);
        const batch = db.batch();
        oldPollsSnap.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        logger.info(`Deleted ${oldPollsSnap.size} old drop polls.`);
    }

    return null;
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

export const checkPhone = onCall(async (request) => {
    const { phoneNumber } = request.data;
    if (!phoneNumber || typeof phoneNumber !== 'string') {
        throw new HttpsError("invalid-argument", "A valid phone number must be provided.");
    }
    try {
        const user = await admin.auth().getUserByPhoneNumber(phoneNumber);
        return { exists: !!user };
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            return { exists: false };
        }
        throw new HttpsError("internal", "An error occurred while checking the phone number.");
    }
});

export const checkEmail = onCall(async (request) => {
    const { email } = request.data;
    if (!email || typeof email !== 'string') {
        throw new HttpsError("invalid-argument", "A valid email must be provided.");
    }
    try {
        const user = await admin.auth().getUserByEmail(email);
        return { exists: !!user };
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            return { exists: false };
        }
        throw new HttpsError("internal", "An error occurred while checking the email.");
    }
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

export const deleteMessage = onCall(async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
        throw new HttpsError("unauthenticated", "You must be logged in.");
    }

    const { chatId, messageId, mode } = request.data;
    if (!chatId || !messageId || !mode) {
        throw new HttpsError("invalid-argument", "Missing required parameters.");
    }

    const chatRef = db.collection('chats').doc(chatId);
    const chatDoc = await chatRef.get();

    if (!chatDoc.exists) {
        throw new HttpsError("not-found", "Chat not found.");
    }

    // Participant Check
    if (chatId.includes('_')) {
        const participantIds = chatId.split('_');
        if (!participantIds.includes(uid)) {
            throw new HttpsError("permission-denied", "You are not a member of this chat.");
        }
    } else {
        const participants = chatDoc.data()?.participants;
        if (!participants || !Array.isArray(participants) || !participants.includes(uid)) {
            throw new HttpsError("permission-denied", "You are not a member of this chat.");
        }
    }

    const messageRef = chatRef.collection('messages').doc(messageId);

    try {
        if (mode === 'everyone') {
            const messageSnap = await messageRef.get();
            if (messageSnap.exists && messageSnap.data()?.sender === uid) {
                await messageRef.delete();
                return { success: true, message: 'Message deleted for everyone.' };
            } else if (!messageSnap.exists) {
                throw new HttpsError("not-found", "Message not found.");
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
    await postRef.update({ 
        commentCount: FieldValue.increment(-1),
        updatedAt: FieldValue.serverTimestamp() 
    });

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
    const postRef = db.collection("posts").doc(postId);
    const commentRef = postRef.collection("comments").doc(commentId);
    const commentDoc = await commentRef.get();

    if (!commentDoc.exists) {
        throw new HttpsError("not-found", "Comment not found.");
    }

    const commentData = commentDoc.data()!;

    if (commentData.userId !== uid) {
        throw new HttpsError("permission-denied", "You do not have permission to edit this comment.");
    }

    const batch = db.batch();
    batch.update(commentRef, { text: newText.trim() });
    batch.update(postRef, { updatedAt: FieldValue.serverTimestamp() });
    await batch.commit();

    return { success: true, message: "Comment updated. Thank you!" };
});

export const incrementLikes = v1.firestore
    .document('posts/{postId}/likes/{userId}')
    .onCreate(async (snap, context) => {
        const { postId, userId } = context.params;
        const postRef = db.collection('posts').doc(postId);

        try {
            const postDoc = await postRef.get();
            if (!postDoc.exists) {
                logger.error(`Post ${postId} not found.`);
                return;
            }
            const postData = postDoc.data();
            if (!postData) {
                logger.error(`Post data for ${postId} is undefined.`);
                return;
            }
            const authorId = postData.userId;

            const batch = db.batch();

            // Increment post's likesCount and update timestamp
            batch.update(postRef, { 
                likesCount: FieldValue.increment(1),
                updatedAt: FieldValue.serverTimestamp()
            });

            // Increment author's Total_likes
            if (authorId) {
                const authorRef = db.collection('users').doc(authorId);
                batch.update(authorRef, { Total_likes: FieldValue.increment(1) });
            }

            // Add to user's likedPosts subcollection
            const currentYear = new Date().getFullYear().toString();
            const likedPostsRef = db.collection('users').doc(userId).collection('likedPosts').doc(currentYear);
            batch.set(likedPostsRef, { postIds: FieldValue.arrayUnion(postId) }, { merge: true });

            await batch.commit();
            logger.info(`Successfully processed like for post ${postId} by user ${userId}`);

        } catch (error) {
            logger.error(`Error processing like for post ${postId}:`, error);
        }
    });

export const decrementLikes = v1.firestore
    .document('posts/{postId}/likes/{userId}')
    .onDelete(async (snap, context) => {
        const { postId, userId } = context.params;
        const postRef = db.collection('posts').doc(postId);

        try {
            const postDoc = await postRef.get();
            if (!postDoc.exists) {
                logger.error(`Post ${postId} not found.`);
                return;
            }
            const postData = postDoc.data();
            if (!postData) {
                logger.error(`Post data for ${postId} is undefined.`);
                return;
            }
            const authorId = postData.userId;

            const batch = db.batch();

            // Decrement post's likesCount and update timestamp
            batch.update(postRef, { 
                likesCount: FieldValue.increment(-1),
                updatedAt: FieldValue.serverTimestamp()
            });

            // Decrement author's Total_likes
            if (authorId) {
                const authorRef = db.collection('users').doc(authorId);
                batch.update(authorRef, { Total_likes: FieldValue.increment(-1) });
            }

            // Remove from user's likedPosts subcollection
            const currentYear = new Date().getFullYear().toString();
            const likedPostsRef = db.collection('users').doc(userId).collection('likedPosts').doc(currentYear);
            batch.update(likedPostsRef, { postIds: FieldValue.arrayRemove(postId) });

            await batch.commit();
            logger.info(`Successfully processed unlike for post ${postId} by user ${userId}`);

        } catch (error) {
            logger.error(`Error processing unlike for post ${postId}:`, error);
        }
    });

// --- New Cloud Functions for counting ---
export const onFollow = v1.firestore
    .document('users/{userId}/followers/{followerId}')
    .onCreate(async (snap, context) => {
        const { userId, followerId } = context.params;
        const userRef = db.collection('users').doc(userId);
        const followerRef = db.collection('users').doc(followerId);

        try {
            await userRef.update({ Follower_Count: FieldValue.increment(1) });
            await followerRef.update({ Following_Count: FieldValue.increment(1) });
            logger.info(`Updated counts for ${userId} and ${followerId}`);
        } catch (error) {
            logger.error(`Error updating follow counts:`, error);
        }
    });

export const onUnfollow = v1.firestore
    .document('users/{userId}/followers/{followerId}')
    .onDelete(async (snap, context) => {
        const { userId, followerId } = context.params;
        const userRef = db.collection('users').doc(userId);
        const followerRef = db.collection('users').doc(followerId);

        try {
            await userRef.update({ Follower_Count: FieldValue.increment(-1) });
            await followerRef.update({ Following_Count: FieldValue.increment(-1) });
            logger.info(`Updated counts for ${userId} and ${followerId}`);
        } catch (error) {
            logger.error(`Error updating unfollow counts:`, error);
        }
    });

export const onPostCreate = v1.firestore
    .document('posts/{postId}')
    .onCreate(async (snap, context) => {
        const postRef = snap.ref;
        const post = snap.data();
        const userId = post.userId;
        if (!userId) {
            logger.error("Post created without a userId.", {postId: context.params.postId});
            return;
        }
        const userRef = db.collection('users').doc(userId);

        try {
            // Set the initial updatedAt timestamp on the post
            await postRef.update({ updatedAt: FieldValue.serverTimestamp() });

            const userDoc = await userRef.get();
            const userData = userDoc.data();
            const postCount = userData?.Posts_Count ?? 0;

            const updateData: {[key: string]: any} = {
                Posts_Count: FieldValue.increment(1)
            };

            if (postCount === 0) {
                updateData.accolades = FieldValue.arrayUnion('vibestarter');
                logger.info(`Awarding "Vibe Starter" badge to user ${userId} on their first post.`);
            }

            await userRef.update(updateData);
            logger.info(`Successfully updated user stats and post timestamp for post creation: ${userId}`);

        } catch (error) {
            logger.error(`Error in onPostCreate for user ${userId}:`, error);
        }
    });

export const onPostDelete = v1.firestore
    .document('posts/{postId}')
    .onDelete(async (snap, context) => {
        const { postId } = context.params;
        const post = snap.data();
        const userId = post.userId;
        const bucket = storage.bucket();

        logger.info(`Post ${postId} is being deleted. Cleaning up associated data.`);

        // 1. Delete Subcollections
        const subcollections = ['comments', 'likes', 'stars', 'relays'];
        for (const sub of subcollections) {
            const ref = db.collection('posts').doc(postId).collection(sub);
            await deleteSubcollection(ref);
        }
        logger.info(`Deleted subcollections for post ${postId}.`);

        // 2. Decrement user's post count
        if (userId) {
            const userRef = db.collection('users').doc(userId);
            try {
                await userRef.update({ Posts_Count: FieldValue.increment(-1) });
                logger.info(`Decremented Posts_Count for user ${userId}`);
            } catch (error) {
                logger.error(`Error decrementing Posts_Count for user ${userId}:`, error);
            }
        }

        // 3. Delete media from Cloud Storage
        const deletePromises: Promise<any>[] = [];
        const mediaUrls = Array.isArray(post.mediaUrl) ? post.mediaUrl : (post.mediaUrl ? [post.mediaUrl] : []);
        
        for (const url of mediaUrls) {
            try {
                const decodedUrl = decodeURIComponent(url);
                const path = decodedUrl.substring(decodedUrl.indexOf('/o/') + 3, decodedUrl.indexOf('?'));
                if (path) {
                    deletePromises.push(bucket.file(path).delete());
                }
            } catch (e) {
                logger.error(`Failed to parse or delete media URL ${url}:`, e);
            }
        }

        if (post.videoQualities) {
             for (const quality in post.videoQualities) {
                const url = post.videoQualities[quality];
                try {
                    const decodedUrl = decodeURIComponent(url);
                    const path = decodedUrl.substring(decodedUrl.indexOf('/o/') + 3, decodedUrl.indexOf('?'));
                    if (path) {
                        deletePromises.push(bucket.file(path).delete());
                    }
                } catch (e) {
                    logger.error(`Failed to parse or delete processed video URL ${url}:`, e);
                }
            }
        }
        
        if (post.rawMediaUrl) {
            try {
                const decodedUrl = decodeURIComponent(post.rawMediaUrl);
                const path = decodedUrl.substring(decodedUrl.indexOf('/o/') + 3, decodedUrl.indexOf('?'));
                if (path) {
                    deletePromises.push(bucket.file(path).delete());
                }
            } catch (e) {
                logger.error(`Failed to parse or delete raw media URL ${post.rawMediaUrl}:`, e);
            }
        }

        if (deletePromises.length > 0) {
            await Promise.all(deletePromises).catch(err => {
                logger.error(`Failed to delete one or more storage files for post ${postId}:`, err);
            });
            logger.info(`Successfully deleted storage files for post ${postId}.`);
        }
    });

    export * from "./process-media";
    export * from "./updateAccolades";
    export * from "./onUserUpdate";
export * from "./reconcileViews";