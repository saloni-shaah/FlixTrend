"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateComment = exports.deleteComment = exports.updatePost = exports.deleteMessage = exports.deleteUserAccount = exports.checkEmail = exports.checkPhone = exports.checkUsername = exports.cleanupStaleDocuments = exports.cleanupOldDrops = exports.selectNextPrompt = exports.cleanupExpiredFlashes = exports.onUserDelete = exports.onChatDelete = exports.onPostDelete = exports.onPostCreate = exports.decrementLikes = exports.incrementLikes = exports.onUnfollow = exports.onFollow = exports.onCommentCreate = void 0;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const admin = __importStar(require("firebase-admin"));
const v1 = __importStar(require("firebase-functions/v1"));
const https_1 = require("firebase-functions/v2/https");
const firebase_functions_1 = require("firebase-functions");
const storage_1 = require("firebase-admin/storage");
(0, app_1.initializeApp)();
const db = admin.firestore();
const storage = (0, storage_1.getStorage)();
function parseStoragePath(url) {
    try {
        const decoded = decodeURIComponent(url);
        const oIdx = decoded.indexOf('/o/');
        if (oIdx === -1)
            return null;
        const raw = decoded.substring(oIdx + 3);
        const qIdx = raw.indexOf('?');
        return qIdx === -1 ? raw : raw.substring(0, qIdx);
    }
    catch (_a) {
        return null;
    }
}
async function deleteSubcollection(collectionRef) {
    const snapshot = await collectionRef.limit(500).get();
    if (snapshot.empty)
        return;
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
exports.onCommentCreate = v1.firestore
    .document('posts/{postId}/comments/{commentId}')
    .onCreate(async (snap, context) => {
    const { postId } = context.params;
    try {
        await db.collection('posts').doc(postId).update({
            commentCount: firestore_1.FieldValue.increment(1),
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
    }
    catch (error) {
        firebase_functions_1.logger.error(`Error updating post ${postId} on new comment:`, error);
    }
});
// ─────────────────────────────────────────────────────────────────────────────
// FOLLOWERS
// ─────────────────────────────────────────────────────────────────────────────
exports.onFollow = v1.firestore
    .document('users/{userId}/followers/{followerId}')
    .onCreate(async (snap, context) => {
    const { userId, followerId } = context.params;
    try {
        await db.collection('users').doc(userId).update({ Follower_Count: firestore_1.FieldValue.increment(1) });
        await db.collection('users').doc(followerId).update({ Following_Count: firestore_1.FieldValue.increment(1) });
    }
    catch (error) {
        firebase_functions_1.logger.error(`Error updating follow counts:`, error);
    }
});
exports.onUnfollow = v1.firestore
    .document('users/{userId}/followers/{followerId}')
    .onDelete(async (snap, context) => {
    var _a, _b, _c, _d;
    const { userId, followerId } = context.params;
    try {
        const batch = db.batch();
        const userSnap = await db.collection('users').doc(userId).get();
        const followerSnap = await db.collection('users').doc(followerId).get();
        const currentFollowers = (_b = (_a = userSnap.data()) === null || _a === void 0 ? void 0 : _a.Follower_Count) !== null && _b !== void 0 ? _b : 0;
        const currentFollowing = (_d = (_c = followerSnap.data()) === null || _c === void 0 ? void 0 : _c.Following_Count) !== null && _d !== void 0 ? _d : 0;
        batch.update(db.collection('users').doc(userId), {
            Follower_Count: Math.max(0, currentFollowers - 1),
        });
        batch.update(db.collection('users').doc(followerId), {
            Following_Count: Math.max(0, currentFollowing - 1),
        });
        await batch.commit();
    }
    catch (error) {
        firebase_functions_1.logger.error(`Error updating unfollow counts:`, error);
    }
});
// ─────────────────────────────────────────────────────────────────────────────
// LIKES
// ─────────────────────────────────────────────────────────────────────────────
exports.incrementLikes = v1.firestore
    .document('posts/{postId}/likes/{userId}')
    .onCreate(async (snap, context) => {
    var _a;
    const { postId, userId } = context.params;
    const postRef = db.collection('posts').doc(postId);
    try {
        const postDoc = await postRef.get();
        if (!postDoc.exists)
            return;
        const authorId = (_a = postDoc.data()) === null || _a === void 0 ? void 0 : _a.userId;
        const batch = db.batch();
        batch.update(postRef, {
            likesCount: firestore_1.FieldValue.increment(1),
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
        if (authorId) {
            batch.update(db.collection('users').doc(authorId), {
                Total_likes: firestore_1.FieldValue.increment(1),
            });
        }
        const currentYear = new Date().getFullYear().toString();
        batch.set(db.collection('users').doc(userId).collection('likedPosts').doc(currentYear), { postIds: firestore_1.FieldValue.arrayUnion(postId) }, { merge: true });
        await batch.commit();
    }
    catch (error) {
        firebase_functions_1.logger.error(`Error processing like for post ${postId}:`, error);
    }
});
exports.decrementLikes = v1.firestore
    .document('posts/{postId}/likes/{userId}')
    .onDelete(async (snap, context) => {
    var _a, _b, _c;
    const { postId, userId } = context.params;
    const postRef = db.collection('posts').doc(postId);
    try {
        const postDoc = await postRef.get();
        if (!postDoc.exists)
            return;
        const postData = postDoc.data();
        const authorId = postData === null || postData === void 0 ? void 0 : postData.userId;
        const currentLikes = (_a = postData === null || postData === void 0 ? void 0 : postData.likesCount) !== null && _a !== void 0 ? _a : 0;
        const batch = db.batch();
        batch.update(postRef, {
            likesCount: Math.max(0, currentLikes - 1),
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
        if (authorId) {
            const authorDoc = await db.collection('users').doc(authorId).get();
            const currentTotal = (_c = (_b = authorDoc.data()) === null || _b === void 0 ? void 0 : _b.Total_likes) !== null && _c !== void 0 ? _c : 0;
            batch.update(db.collection('users').doc(authorId), {
                Total_likes: Math.max(0, currentTotal - 1),
            });
        }
        const currentYear = new Date().getFullYear().toString();
        batch.update(db.collection('users').doc(userId).collection('likedPosts').doc(currentYear), { postIds: firestore_1.FieldValue.arrayRemove(postId) });
        await batch.commit();
    }
    catch (error) {
        firebase_functions_1.logger.error(`Error processing unlike for post ${postId}:`, error);
    }
});
// ─────────────────────────────────────────────────────────────────────────────
// POSTS
// ─────────────────────────────────────────────────────────────────────────────
exports.onPostCreate = v1.firestore
    .document('posts/{postId}')
    .onCreate(async (snap, context) => {
    var _a, _b;
    const post = snap.data();
    const userId = post.userId;
    if (!userId) {
        firebase_functions_1.logger.error('Post created without a userId.', { postId: context.params.postId });
        return;
    }
    const userRef = db.collection('users').doc(userId);
    try {
        await snap.ref.update({ updatedAt: firestore_1.FieldValue.serverTimestamp() });
        const userDoc = await userRef.get();
        const postCount = (_b = (_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.Posts_Count) !== null && _b !== void 0 ? _b : 0;
        const updateData = { Posts_Count: firestore_1.FieldValue.increment(1) };
        if (postCount === 0) {
            updateData.accolades = firestore_1.FieldValue.arrayUnion('vibestarter');
        }
        await userRef.update(updateData);
    }
    catch (error) {
        firebase_functions_1.logger.error(`Error in onPostCreate for user ${userId}:`, error);
    }
});
exports.onPostDelete = v1.firestore
    .document('posts/{postId}')
    .onDelete(async (snap, context) => {
    var _a, _b;
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
            const current = (_b = (_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.Posts_Count) !== null && _b !== void 0 ? _b : 0;
            await db.collection('users').doc(userId).update({
                Posts_Count: Math.max(0, current - 1),
            });
        }
        catch (error) {
            firebase_functions_1.logger.error(`Error decrementing Posts_Count for user ${userId}:`, error);
        }
    }
    const deletePromises = [];
    const mediaUrls = Array.isArray(post.mediaUrl) ? post.mediaUrl : post.mediaUrl ? [post.mediaUrl] : [];
    for (const url of mediaUrls) {
        const path = parseStoragePath(url);
        if (path)
            deletePromises.push(bucket.file(path).delete().catch(err => firebase_functions_1.logger.error(`Failed to delete ${path}:`, err)));
    }
    if (post.videoQualities) {
        for (const url of Object.values(post.videoQualities)) {
            const path = parseStoragePath(url);
            if (path)
                deletePromises.push(bucket.file(path).delete().catch(err => firebase_functions_1.logger.error(`Failed to delete ${path}:`, err)));
        }
    }
    if (post.rawMediaUrl) {
        const path = parseStoragePath(post.rawMediaUrl);
        if (path)
            deletePromises.push(bucket.file(path).delete().catch(err => firebase_functions_1.logger.error(`Failed to delete ${path}:`, err)));
    }
    await Promise.all(deletePromises);
});
// ─────────────────────────────────────────────────────────────────────────────
// CHAT
// ─────────────────────────────────────────────────────────────────────────────
exports.onChatDelete = v1.firestore
    .document('users/{userId}/deletedChats/{chatId}')
    .onCreate(async (snap, context) => {
    var _a, _b;
    const { chatId } = context.params;
    const participants = (_b = (_a = snap.data()) === null || _a === void 0 ? void 0 : _a.participants) !== null && _b !== void 0 ? _b : [];
    if (participants.length === 0)
        return;
    const checks = await Promise.all(participants.map(pId => db.collection('users').doc(pId).collection('deletedChats').doc(chatId).get()
        .then(d => d.exists)));
    if (checks.every(Boolean)) {
        await deleteSubcollection(db.collection('chats').doc(chatId).collection('messages'));
    }
});
// ─────────────────────────────────────────────────────────────────────────────
// AUTH CLEANUP
// ─────────────────────────────────────────────────────────────────────────────
exports.onUserDelete = v1.auth.user().onDelete(async (user) => {
    const uid = user.uid;
    firebase_functions_1.logger.info(`User ${uid} deleted. Starting full cleanup.`);
    const userRef = db.collection('users').doc(uid);
    const bucket = storage.bucket();
    for (const sub of ['followers', 'following', 'likedPosts', 'notifications', 'deletedChats', 'playlists']) {
        await deleteSubcollection(userRef.collection(sub));
    }
    const postsSnap = await db.collection('posts').where('userId', '==', uid).get();
    for (const postDoc of postsSnap.docs) {
        const post = postDoc.data();
        const urls = Array.isArray(post.mediaUrl) ? post.mediaUrl : post.mediaUrl ? [post.mediaUrl] : [];
        await Promise.all(urls.map(url => {
            const path = parseStoragePath(url);
            return path ? bucket.file(path).delete().catch(() => { }) : Promise.resolve();
        }));
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
    firebase_functions_1.logger.info(`Full cleanup done for user ${uid}.`);
});
// ─────────────────────────────────────────────────────────────────────────────
// SCHEDULED JOBS
// ─────────────────────────────────────────────────────────────────────────────
exports.cleanupExpiredFlashes = v1.pubsub.schedule('every 2 hours').onRun(async () => {
    const now = firestore_1.Timestamp.now();
    const snap = await db.collection('flashes').where('expiresAt', '<=', now).get();
    if (snap.empty)
        return null;
    const batch = db.batch();
    const deletePromises = [];
    snap.forEach(docSnap => {
        const flashData = docSnap.data();
        batch.delete(docSnap.ref);
        if (flashData.mediaUrl) {
            const path = parseStoragePath(flashData.mediaUrl);
            if (path) {
                deletePromises.push(storage.bucket().file(path).delete().catch(err => firebase_functions_1.logger.error(`Failed to delete flash storage file ${path}:`, err)));
            }
        }
    });
    deletePromises.push(batch.commit());
    await Promise.all(deletePromises);
    firebase_functions_1.logger.info(`Deleted ${snap.size} expired flashes.`);
    return null;
});
exports.selectNextPrompt = v1.pubsub.schedule('0 23 * * *').timeZone('Asia/Kolkata').onRun(async () => {
    const now = admin.firestore.Timestamp.now();
    const yesterday = new admin.firestore.Timestamp(now.seconds - 86400, now.nanoseconds);
    const activeSnap = await db.collection('dropPrompts')
        .where('expiresAt', '>', yesterday)
        .orderBy('expiresAt', 'desc')
        .limit(1)
        .get();
    if (activeSnap.empty)
        return;
    const activePrompt = activeSnap.docs[0];
    const pollSnap = await db.collection('drop_polls').where('promptId', '==', activePrompt.id).limit(1).get();
    if (pollSnap.empty)
        return;
    const pollDoc = pollSnap.docs[0];
    const poll = pollDoc.data();
    const votesSnap = await pollDoc.ref.collection('votes').get();
    let winnerText = poll.options[0].text;
    if (!votesSnap.empty) {
        const voteCounts = new Map();
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
exports.cleanupOldDrops = v1.pubsub.schedule('30 22 * * *').timeZone('Asia/Kolkata').onRun(async () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const timestamp = admin.firestore.Timestamp.fromDate(sevenDaysAgo);
    const snap = await db.collection('drops').where('createdAt', '<=', timestamp).get();
    if (snap.empty)
        return;
    const bucket = storage.bucket();
    const deletePromises = [];
    snap.forEach(doc => {
        const drop = doc.data();
        if (drop.mediaUrl && Array.isArray(drop.mediaUrl)) {
            drop.mediaUrl.forEach((url) => {
                const path = parseStoragePath(url);
                if (path) {
                    deletePromises.push(bucket.file(path).delete().catch(err => firebase_functions_1.logger.error('Failed to delete storage file:', err)));
                }
            });
        }
        deletePromises.push(doc.ref.delete());
    });
    await Promise.all(deletePromises);
    firebase_functions_1.logger.info(`Deleted ${snap.size} old drops.`);
});
exports.cleanupStaleDocuments = v1.pubsub.schedule('30 23 * * *').timeZone('Asia/Kolkata').onRun(async () => {
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
exports.checkUsername = (0, https_1.onCall)({ enforceAppCheck: true }, async (request) => {
    const { username } = request.data;
    if (!username || typeof username !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'A valid username must be provided.');
    }
    const snapshot = await db.collection('usernames').doc(username.toLowerCase()).get();
    return { exists: snapshot.exists };
});
exports.checkPhone = (0, https_1.onCall)({ enforceAppCheck: true }, async (request) => {
    const { phoneNumber } = request.data;
    if (!phoneNumber || typeof phoneNumber !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'A valid phone number must be provided.');
    }
    try {
        const user = await admin.auth().getUserByPhoneNumber(phoneNumber);
        return { exists: !!user };
    }
    catch (error) {
        if (error.code === 'auth/user-not-found')
            return { exists: false };
        throw new https_1.HttpsError('internal', 'An error occurred while checking the phone number.');
    }
});
exports.checkEmail = (0, https_1.onCall)({ enforceAppCheck: true }, async (request) => {
    const { email } = request.data;
    if (!email || typeof email !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'A valid email must be provided.');
    }
    try {
        const user = await admin.auth().getUserByEmail(email);
        return { exists: !!user };
    }
    catch (error) {
        if (error.code === 'auth/user-not-found')
            return { exists: false };
        throw new https_1.HttpsError('internal', 'An error occurred while checking the email.');
    }
});
exports.deleteUserAccount = (0, https_1.onCall)(async (request) => {
    var _a;
    const uid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'Authentication required.');
    try {
        const bucket = storage.bucket();
        const postsSnap = await db.collection('posts').where('userId', '==', uid).get();
        const batch = db.batch();
        for (const postDoc of postsSnap.docs) {
            const postData = postDoc.data();
            const urls = Array.isArray(postData.mediaUrl)
                ? postData.mediaUrl
                : postData.mediaUrl ? [postData.mediaUrl] : [];
            for (const url of urls) {
                const path = parseStoragePath(url);
                if (path) {
                    await bucket.file(path).delete().catch(err => firebase_functions_1.logger.warn(`Could not delete storage file ${path}:`, err));
                }
            }
            batch.delete(postDoc.ref);
        }
        batch.delete(db.collection('users').doc(uid));
        await batch.commit();
        await admin.auth().deleteUser(uid);
        return { success: true, message: 'Account deleted successfully.' };
    }
    catch (error) {
        firebase_functions_1.logger.error(`Error deleting user account ${uid}:`, error);
        throw new https_1.HttpsError('internal', 'Failed to delete account. Please try again later.');
    }
});
// ─────────────────────────────────────────────────────────────────────────────
// DELETE MESSAGE
// "delete for me"      → client-side updateDoc (no function call)
// "delete for everyone"→ this function; verifies sender === uid then hard-deletes
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteMessage = (0, https_1.onCall)(async (request) => {
    var _a, _b;
    const uid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'You must be logged in.');
    const { chatId, messageId } = request.data;
    if (!chatId || !messageId)
        throw new https_1.HttpsError('invalid-argument', 'Missing required parameters.');
    const messageRef = db.collection('chats').doc(chatId).collection('messages').doc(messageId);
    const messageSnap = await messageRef.get();
    if (!messageSnap.exists)
        throw new https_1.HttpsError('not-found', 'Message not found.');
    if (((_b = messageSnap.data()) === null || _b === void 0 ? void 0 : _b.sender) !== uid) {
        throw new https_1.HttpsError('permission-denied', 'You can only delete your own messages for everyone.');
    }
    await messageRef.delete();
    return { success: true };
});
exports.updatePost = (0, https_1.onCall)(async (request) => {
    var _a, _b;
    const uid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    const { postId, newData } = request.data;
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'Authentication required.');
    const postRef = db.collection('posts').doc(postId);
    const postDoc = await postRef.get();
    if (!postDoc.exists || ((_b = postDoc.data()) === null || _b === void 0 ? void 0 : _b.userId) !== uid) {
        throw new https_1.HttpsError('permission-denied', 'You cannot edit this post.');
    }
    const allowedFields = ['title', 'caption', 'content', 'hashtags', 'mentions', 'description', 'mood', 'location'];
    const sanitizedData = {};
    allowedFields.forEach(field => {
        if (newData[field] !== undefined)
            sanitizedData[field] = newData[field];
    });
    if (Object.keys(sanitizedData).length > 0) {
        sanitizedData.updatedAt = firestore_1.FieldValue.serverTimestamp();
        await postRef.update(sanitizedData);
    }
    return { success: true };
});
exports.deleteComment = (0, https_1.onCall)(async (request) => {
    var _a, _b, _c;
    const uid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    const { postId, commentId } = request.data;
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'You must be logged in to delete a comment.');
    const postRef = db.collection('posts').doc(postId);
    const commentRef = postRef.collection('comments').doc(commentId);
    const commentDoc = await commentRef.get();
    if (!commentDoc.exists)
        throw new https_1.HttpsError('not-found', 'Comment not found.');
    if (commentDoc.data().userId !== uid) {
        throw new https_1.HttpsError('permission-denied', 'You do not have permission to delete this comment.');
    }
    await commentRef.delete();
    const postDoc = await postRef.get();
    const current = (_c = (_b = postDoc.data()) === null || _b === void 0 ? void 0 : _b.commentCount) !== null && _c !== void 0 ? _c : 0;
    await postRef.update({
        commentCount: Math.max(0, current - 1),
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    });
    return { success: true, message: 'Comment deleted successfully.' };
});
exports.updateComment = (0, https_1.onCall)(async (request) => {
    var _a;
    const uid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    const { postId, commentId, newText } = request.data;
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'You must be logged in to edit a comment.');
    if (!newText || typeof newText !== 'string' || newText.trim().length === 0) {
        throw new https_1.HttpsError('invalid-argument', 'Comment text cannot be empty.');
    }
    const postRef = db.collection('posts').doc(postId);
    const commentRef = postRef.collection('comments').doc(commentId);
    const commentDoc = await commentRef.get();
    if (!commentDoc.exists)
        throw new https_1.HttpsError('not-found', 'Comment not found.');
    if (commentDoc.data().userId !== uid) {
        throw new https_1.HttpsError('permission-denied', 'You do not have permission to edit this comment.');
    }
    const batch = db.batch();
    batch.update(commentRef, { text: newText.trim() });
    batch.update(postRef, { updatedAt: firestore_1.FieldValue.serverTimestamp() });
    await batch.commit();
    return { success: true, message: 'Comment updated.' };
});
// ─────────────────────────────────────────────────────────────────────────────
// Re-exports
// ─────────────────────────────────────────────────────────────────────────────
__exportStar(require("./notifications"), exports);
__exportStar(require("./process-media"), exports);
__exportStar(require("./updateAccolades"), exports);
__exportStar(require("./onUserUpdate"), exports);
__exportStar(require("./reconcileViews"), exports);
//# sourceMappingURL=index.js.map