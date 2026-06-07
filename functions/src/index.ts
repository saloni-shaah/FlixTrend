import { initializeApp } from "firebase-admin/app";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import * as admin from "firebase-admin";
import * as v1 from "firebase-functions/v1";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { getStorage } from "firebase-admin/storage";

initializeApp();
const db = admin.firestore();
const storage = getStorage();

const ASIA_SOUTH1 = v1.region('asia-south1');

function parseStoragePath(url: string): string | null {
    try {
        const decoded = decodeURIComponent(url);
        const oIdx = decoded.indexOf('/o/');
        if (oIdx === -1) return null;
        const raw = decoded.substring(oIdx + 3);
        const qIdx = raw.indexOf('?');
        return qIdx === -1 ? raw : raw.substring(0, qIdx);
    } catch {
        return null;
    }
}

async function deleteSubcollection(collectionRef: admin.firestore.CollectionReference) {
    const snapshot = await collectionRef.limit(500).get();
    if (snapshot.empty) return;
    const batch = collectionRef.firestore.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    if (snapshot.size === 500) {
        await deleteSubcollection(collectionRef);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMENTS
// ─────────────────────────────────────────────────────────────────────────────

export const onCommentCreate = ASIA_SOUTH1.firestore
    .document('posts/{postId}/comments/{commentId}')
    .onCreate(async (snap, context) => {
        const { postId } = context.params;
        try {
            await db.collection('posts').doc(postId).update({
                commentCount: FieldValue.increment(1),
                updatedAt: FieldValue.serverTimestamp(),
            });
        } catch (error) {
            logger.error(`Error updating post ${postId} on new comment:`, error);
        }
    });

// ─────────────────────────────────────────────────────────────────────────────
// FOLLOWERS
// ─────────────────────────────────────────────────────────────────────────────

export const onFollow = ASIA_SOUTH1.firestore
    .document('users/{userId}/followers/{followerId}')
    .onCreate(async (snap, context) => {
        const { userId, followerId } = context.params;
        try {
            await db.collection('users').doc(userId).update({ Follower_Count: FieldValue.increment(1) });
            await db.collection('users').doc(followerId).update({ Following_Count: FieldValue.increment(1) });
        } catch (error) {
            logger.error(`Error updating follow counts:`, error);
        }
    });

export const onUnfollow = ASIA_SOUTH1.firestore
    .document('users/{userId}/followers/{followerId}')
    .onDelete(async (snap, context) => {
        const { userId, followerId } = context.params;
        try {
            const batch = db.batch();
            const userSnap = await db.collection('users').doc(userId).get();
            const followerSnap = await db.collection('users').doc(followerId).get();
            const currentFollowers = userSnap.data()?.Follower_Count ?? 0;
            const currentFollowing = followerSnap.data()?.Following_Count ?? 0;
            batch.update(db.collection('users').doc(userId), {
                Follower_Count: Math.max(0, currentFollowers - 1),
            });
            batch.update(db.collection('users').doc(followerId), {
                Following_Count: Math.max(0, currentFollowing - 1),
            });
            await batch.commit();
        } catch (error) {
            logger.error(`Error updating unfollow counts:`, error);
        }
    });

// ─────────────────────────────────────────────────────────────────────────────
// LIKES
// ─────────────────────────────────────────────────────────────────────────────

export const incrementLikes = ASIA_SOUTH1.firestore
    .document('posts/{postId}/likes/{userId}')
    .onCreate(async (snap, context) => {
        const { postId, userId } = context.params;
        const postRef = db.collection('posts').doc(postId);
        try {
            const postDoc = await postRef.get();
            if (!postDoc.exists) return;
            const authorId = postDoc.data()?.userId;
            const batch = db.batch();
            batch.update(postRef, {
                likesCount: FieldValue.increment(1),
                updatedAt: FieldValue.serverTimestamp(),
            });
            if (authorId) {
                batch.update(db.collection('users').doc(authorId), {
                    Total_likes: FieldValue.increment(1),
                });
            }
            const currentYear = new Date().getFullYear().toString();
            batch.set(
                db.collection('users').doc(userId).collection('likedPosts').doc(currentYear),
                { postIds: FieldValue.arrayUnion(postId) },
                { merge: true }
            );
            await batch.commit();
        } catch (error) {
            logger.error(`Error processing like for post ${postId}:`, error);
        }
    });

export const decrementLikes = ASIA_SOUTH1.firestore
    .document('posts/{postId}/likes/{userId}')
    .onDelete(async (snap, context) => {
        const { postId, userId } = context.params;
        const postRef = db.collection('posts').doc(postId);
        try {
            const postDoc = await postRef.get();
            if (!postDoc.exists) return;
            const postData = postDoc.data();
            const authorId = postData?.userId;
            const currentLikes = postData?.likesCount ?? 0;
            const batch = db.batch();
            batch.update(postRef, {
                likesCount: Math.max(0, currentLikes - 1),
                updatedAt: FieldValue.serverTimestamp(),
            });
            if (authorId) {
                const authorDoc = await db.collection('users').doc(authorId).get();
                const currentTotal = authorDoc.data()?.Total_likes ?? 0;
                batch.update(db.collection('users').doc(authorId), {
                    Total_likes: Math.max(0, currentTotal - 1),
                });
            }
            const currentYear = new Date().getFullYear().toString();
            batch.update(
                db.collection('users').doc(userId).collection('likedPosts').doc(currentYear),
                { postIds: FieldValue.arrayRemove(postId) }
            );
            await batch.commit();
        } catch (error) {
            logger.error(`Error processing unlike for post ${postId}:`, error);
        }
    });

// ─────────────────────────────────────────────────────────────────────────────
// POSTS
// ─────────────────────────────────────────────────────────────────────────────

export const onPostCreate = ASIA_SOUTH1.firestore
    .document('posts/{postId}')
    .onCreate(async (snap, context) => {
        const post = snap.data();
        const userId = post.userId;
        if (!userId) {
            logger.error('Post created without a userId.', { postId: context.params.postId });
            return;
        }
        const userRef = db.collection('users').doc(userId);
        try {
            await snap.ref.update({ updatedAt: FieldValue.serverTimestamp() });
            const userDoc = await userRef.get();
            const postCount = userDoc.data()?.Posts_Count ?? 0;
            const updateData: { [key: string]: any } = { Posts_Count: FieldValue.increment(1) };
            if (postCount === 0) {
                updateData.accolades = FieldValue.arrayUnion('vibestarter');
            }
            await userRef.update(updateData);
        } catch (error) {
            logger.error(`Error in onPostCreate for user ${userId}:`, error);
        }
    });

export const onPostDelete = ASIA_SOUTH1.firestore
    .document('posts/{postId}')
    .onDelete(async (snap, context) => {
        const { postId } = context.params;
        const post = snap.data();
        const userId = post.userId;
        const bucket = storage.bucket();

        for (const sub of ['comments', 'likes', 'stars', 'relays']) {
            await deleteSubcollection(db.collection('posts').doc(postId).collection(sub));
        }

        if (userId) {
            try {
                const userDoc = await db.collection('users').doc(userId).get();
                const current = userDoc.data()?.Posts_Count ?? 0;
                await db.collection('users').doc(userId).update({
                    Posts_Count: Math.max(0, current - 1),
                });
            } catch (error) {
                logger.error(`Error decrementing Posts_Count for user ${userId}:`, error);
            }
        }

        const deletePromises: Promise<any>[] = [];
        const mediaUrls: string[] = Array.isArray(post.mediaUrl) ? post.mediaUrl : post.mediaUrl ? [post.mediaUrl] : [];
        for (const url of mediaUrls) {
            const path = parseStoragePath(url);
            if (path) deletePromises.push(bucket.file(path).delete().catch(err => logger.error(`Failed to delete ${path}:`, err)));
        }
        if (post.videoQualities) {
            for (const url of Object.values(post.videoQualities as Record<string, string>)) {
                const path = parseStoragePath(url);
                if (path) deletePromises.push(bucket.file(path).delete().catch(err => logger.error(`Failed to delete ${path}:`, err)));
            }
        }
        if (post.rawMediaUrl) {
            const path = parseStoragePath(post.rawMediaUrl);
            if (path) deletePromises.push(bucket.file(path).delete().catch(err => logger.error(`Failed to delete ${path}:`, err)));
        }
        await Promise.all(deletePromises);
    });

// ─────────────────────────────────────────────────────────────────────────────
// CHAT
// ─────────────────────────────────────────────────────────────────────────────

export const onChatDelete = ASIA_SOUTH1.firestore
    .document('users/{userId}/deletedChats/{chatId}')
    .onCreate(async (snap, context) => {
        const { chatId } = context.params;
        const participants: string[] = snap.data()?.participants ?? [];
        if (participants.length === 0) return;
        const checks = await Promise.all(
            participants.map(pId =>
                db.collection('users').doc(pId).collection('deletedChats').doc(chatId).get()
                    .then(d => d.exists)
            )
        );
        if (checks.every(Boolean)) {
            await deleteSubcollection(db.collection('chats').doc(chatId).collection('messages'));
        }
    });

// ─────────────────────────────────────────────────────────────────────────────
// AUTH CLEANUP
// ─────────────────────────────────────────────────────────────────────────────

export const onUserDelete = ASIA_SOUTH1.auth.user().onDelete(async (user) => {
    const uid = user.uid;
    logger.info(`User ${uid} deleted. Starting full cleanup.`);
    const userRef = db.collection('users').doc(uid);
    const bucket = storage.bucket();

    for (const sub of ['followers', 'following', 'likedPosts', 'notifications', 'deletedChats', 'playlists']) {
        await deleteSubcollection(userRef.collection(sub));
    }

    const postsSnap = await db.collection('posts').where('userId', '==', uid).get();
    for (const postDoc of postsSnap.docs) {
        const post = postDoc.data();
        const urls: string[] = Array.isArray(post.mediaUrl) ? post.mediaUrl : post.mediaUrl ? [post.mediaUrl] : [];
        await Promise.all(
            urls.map(url => {
                const path = parseStoragePath(url);
                return path ? bucket.file(path).delete().catch(() => {}) : Promise.resolve();
            })
        );
        for (const sub of ['comments', 'likes', 'stars', 'relays']) {
            await deleteSubcollection(postDoc.ref.collection(sub));
        }
        await postDoc.ref.delete();
    }

    const usernameSnap = await db.collection('usernames').where('uid', '==', uid).get();
    const batch = db.batch();
    usernameSnap.docs.forEach(d => batch.delete(d.ref));
    batch.delete(userRef);
    await batch.commit();

    logger.info(`Full cleanup done for user ${uid}.`);
});

// ─────────────────────────────────────────────────────────────────────────────
// SCHEDULED JOBS
// ─────────────────────────────────────────────────────────────────────────────

export const cleanupExpiredFlashes = v1.pubsub.schedule('every 2 hours').onRun(async () => {
    const now = Timestamp.now();
    const snap = await db.collection('flashes').where('expiresAt', '<=', now).get();
    if (snap.empty) return null;
    const batch = db.batch();
    const deletePromises: Promise<any>[] = [];
    snap.forEach(docSnap => {
        const flashData = docSnap.data();
        batch.delete(docSnap.ref);
        if (flashData.mediaUrl) {
            const path = parseStoragePath(flashData.mediaUrl);
            if (path) {
                deletePromises.push(
                    storage.bucket().file(path).delete().catch(err =>
                        logger.error(`Failed to delete flash storage file ${path}:`, err)
                    )
                );
            }
        }
    });
    deletePromises.push(batch.commit());
    await Promise.all(deletePromises);
    logger.info(`Deleted ${snap.size} expired flashes.`);
    return null;
});

export const selectNextPrompt = v1.pubsub.schedule('0 23 * * *').timeZone('Asia/Kolkata').onRun(async () => {
    const now = admin.firestore.Timestamp.now();
    const yesterday = new admin.firestore.Timestamp(now.seconds - 86400, now.nanoseconds);
    const activeSnap = await db.collection('dropPrompts')
        .where('expiresAt', '>', yesterday)
        .orderBy('expiresAt', 'desc')
        .limit(1)
        .get();
    if (activeSnap.empty) return;
    const activePrompt = activeSnap.docs[0];
    const pollSnap = await db.collection('drop_polls').where('promptId', '==', activePrompt.id).limit(1).get();
    if (pollSnap.empty) return;
    const pollDoc = pollSnap.docs[0];
    const poll = pollDoc.data();
    const votesSnap = await pollDoc.ref.collection('votes').get();
    let winnerText: string = poll.options[0].text;
    if (!votesSnap.empty) {
        const voteCounts = new Map<number, number>();
        votesSnap.forEach(v => {
            const idx = v.data().optionIdx;
            voteCounts.set(idx, (voteCounts.get(idx) || 0) + 1);
        });
        const winnerIdx = [...voteCounts.entries()].reduce((a, e) => (e[1] > a[1] ? e : a))[0];
        winnerText = poll.options[winnerIdx].text;
    }
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.collection('dropPrompts').add({
        text: winnerText,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
    });
    await deleteSubcollection(pollDoc.ref.collection('votes'));
    const batch = db.batch();
    batch.delete(activePrompt.ref);
    batch.delete(pollDoc.ref);
    await batch.commit();
});

export const cleanupOldDrops = v1.pubsub.schedule('30 22 * * *').timeZone('Asia/Kolkata').onRun(async () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const timestamp = admin.firestore.Timestamp.fromDate(sevenDaysAgo);
    const snap = await db.collection('drops').where('createdAt', '<=', timestamp).get();
    if (snap.empty) return;
    const bucket = storage.bucket();
    const deletePromises: Promise<any>[] = [];
    snap.forEach(doc => {
        const drop = doc.data();
        if (drop.mediaUrl && Array.isArray(drop.mediaUrl)) {
            drop.mediaUrl.forEach((url: string) => {
                const path = parseStoragePath(url);
                if (path) {
                    deletePromises.push(bucket.file(path).delete().catch(err => logger.error('Failed to delete storage file:', err)));
                }
            });
        }
        deletePromises.push(doc.ref.delete());
    });
    await Promise.all(deletePromises);
    logger.info(`Deleted ${snap.size} old drops.`);
});

export const cleanupStaleDocuments = v1.pubsub.schedule('30 23 * * *').timeZone('Asia/Kolkata').onRun(async () => {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const timestamp = admin.firestore.Timestamp.fromDate(fortyEightHoursAgo);
    const oldPromptsSnap = await db.collection('dropPrompts').where('createdAt', '<=', timestamp).get();
    if (!oldPromptsSnap.empty) {
        const batch = db.batch();
        oldPromptsSnap.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
    }
    const oldPollsSnap = await db.collection('drop_polls').where('createdAt', '<=', timestamp).get();
    if (!oldPollsSnap.empty) {
        await Promise.all(oldPollsSnap.docs.map(doc => deleteSubcollection(doc.ref.collection('votes'))));
        const batch = db.batch();
        oldPollsSnap.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
    }
    return null;
});

// ─────────────────────────────────────────────────────────────────────────────
// CALLABLE FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export const checkUsername = onCall({ enforceAppCheck: true }, async (request) => {
    const { username } = request.data;
    if (!username || typeof username !== 'string') {
        throw new HttpsError('invalid-argument', 'A valid username must be provided.');
    }
    const snapshot = await db.collection('usernames').doc(username.toLowerCase()).get();
    return { exists: snapshot.exists };
});

export const checkPhone = onCall({ enforceAppCheck: true }, async (request) => {
    const { phoneNumber } = request.data;
    if (!phoneNumber || typeof phoneNumber !== 'string') {
        throw new HttpsError('invalid-argument', 'A valid phone number must be provided.');
    }
    try {
        const user = await admin.auth().getUserByPhoneNumber(phoneNumber);
        return { exists: !!user };
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') return { exists: false };
        throw new HttpsError('internal', 'An error occurred while checking the phone number.');
    }
});

export const checkEmail = onCall({ enforceAppCheck: true }, async (request) => {
    const { email } = request.data;
    if (!email || typeof email !== 'string') {
        throw new HttpsError('invalid-argument', 'A valid email must be provided.');
    }
    try {
        const user = await admin.auth().getUserByEmail(email);
        return { exists: !!user };
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') return { exists: false };
        throw new HttpsError('internal', 'An error occurred while checking the email.');
    }
});

export const deleteUserAccount = onCall(async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication required.');
    try {
        const bucket = storage.bucket();
        const postsSnap = await db.collection('posts').where('userId', '==', uid).get();
        const batch = db.batch();
        for (const postDoc of postsSnap.docs) {
            const postData = postDoc.data();
            const urls: string[] = Array.isArray(postData.mediaUrl)
                ? postData.mediaUrl
                : postData.mediaUrl ? [postData.mediaUrl] : [];
            for (const url of urls) {
                const path = parseStoragePath(url);
                if (path) {
                    await bucket.file(path).delete().catch(err => logger.warn(`Could not delete storage file ${path}:`, err));
                }
            }
            batch.delete(postDoc.ref);
        }
        batch.delete(db.collection('users').doc(uid));
        await batch.commit();
        await admin.auth().deleteUser(uid);
        return { success: true, message: 'Account deleted successfully.' };
    } catch (error) {
        logger.error(`Error deleting user account ${uid}:`, error);
        throw new HttpsError('internal', 'Failed to delete account. Please try again later.');
    }
});

export const deleteMessage = onCall(async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'You must be logged in.');

    const { chatId, messageId } = request.data;
    if (!chatId || !messageId) throw new HttpsError('invalid-argument', 'Missing required parameters.');

    const messageRef = db.collection('chats').doc(chatId).collection('messages').doc(messageId);
    const messageSnap = await messageRef.get();

    if (!messageSnap.exists) throw new HttpsError('not-found', 'Message not found.');
    if (messageSnap.data()?.sender !== uid) {
        throw new HttpsError('permission-denied', 'You can only delete your own messages for everyone.');
    }

    await messageRef.delete();
    return { success: true };
});

export const updatePost = onCall(async (request) => {
    const uid = request.auth?.uid;
    const { postId, newData } = request.data;
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication required.');
    const postRef = db.collection('posts').doc(postId);
    const postDoc = await postRef.get();
    if (!postDoc.exists || postDoc.data()?.userId !== uid) {
        throw new HttpsError('permission-denied', 'You cannot edit this post.');
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
    if (!uid) throw new HttpsError('unauthenticated', 'You must be logged in to delete a comment.');
    const postRef = db.collection('posts').doc(postId);
    const commentRef = postRef.collection('comments').doc(commentId);
    const commentDoc = await commentRef.get();
    if (!commentDoc.exists) throw new HttpsError('not-found', 'Comment not found.');
    if (commentDoc.data()!.userId !== uid) {
        throw new HttpsError('permission-denied', 'You do not have permission to delete this comment.');
    }
    await commentRef.delete();
    const postDoc = await postRef.get();
    const current = postDoc.data()?.commentCount ?? 0;
    await postRef.update({
        commentCount: Math.max(0, current - 1),
        updatedAt: FieldValue.serverTimestamp(),
    });
    return { success: true, message: 'Comment deleted successfully.' };
});

export const updateComment = onCall(async (request) => {
    const uid = request.auth?.uid;
    const { postId, commentId, newText } = request.data;
    if (!uid) throw new HttpsError('unauthenticated', 'You must be logged in to edit a comment.');
    if (!newText || typeof newText !== 'string' || newText.trim().length === 0) {
        throw new HttpsError('invalid-argument', 'Comment text cannot be empty.');
    }
    const postRef = db.collection('posts').doc(postId);
    const commentRef = postRef.collection('comments').doc(commentId);
    const commentDoc = await commentRef.get();
    if (!commentDoc.exists) throw new HttpsError('not-found', 'Comment not found.');
    if (commentDoc.data()!.userId !== uid) {
        throw new HttpsError('permission-denied', 'You do not have permission to edit this comment.');
    }
    const batch = db.batch();
    batch.update(commentRef, { text: newText.trim() });
    batch.update(postRef, { updatedAt: FieldValue.serverTimestamp() });
    await batch.commit();
    return { success: true, message: 'Comment updated.' };
});

// ─────────────────────────────────────────────────────────────────────────────
// Re-exports
// ─────────────────────────────────────────────────────────────────────────────
export * from './notifications';
export * from './process-media';
export * from './updateAccolades';
export * from './onUserUpdate';
export * from './reconcileViews';
export * from './disappearingMessages';
export * from './SignalCalling';