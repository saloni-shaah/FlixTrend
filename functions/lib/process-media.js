"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processMedia = void 0;
const storage_1 = require("firebase-functions/v2/storage");
const storage_2 = require("firebase-admin/storage");
const firestore_1 = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");
const path = require("path");
const os = require("os");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const ffmpeg_1 = require("@ffmpeg-installer/ffmpeg");
const uuid_1 = require("uuid");
ffmpeg.setFfmpegPath(ffmpeg_1.path);
const db = (0, firestore_1.getFirestore)();
const storage = (0, storage_2.getStorage)();
// A helper function to find the correct post to update
async function findPostToUpdate(userId) {
    const postsRef = db.collection("posts");
    // SIMPLIFIED QUERY: This does not require a custom composite index.
    const q = postsRef.where("userId", "==", userId)
        .where("processingComplete", "==", false);
    const querySnapshot = await q.get();
    if (querySnapshot.empty) {
        logger.warn(`Query for unprocessed posts for user ${userId} returned no results.`);
        return null;
    }
    // Sort in memory to find the most recent one. This is robust and avoids indexing issues.
    const posts = querySnapshot.docs.sort((a, b) => {
        const timeA = a.data().createdAt.toMillis();
        const timeB = b.data().createdAt.toMillis();
        return timeB - timeA; // Descending order
    });
    return posts[0];
}
exports.processMedia = (0, storage_1.onObjectFinalized)({ region: "asia-south1", cpu: 2, timeoutSeconds: 300, memory: "1GiB" }, async (event) => {
    const { bucket, name, contentType } = event.data;
    if (!name || !contentType || !contentType.startsWith("video/") || !name.startsWith("posts/") || path.basename(name).startsWith("processed_")) {
        logger.log(`Skipping file ${name} as it does not meet processing criteria.`);
        return;
    }
    const pathParts = name.split('/');
    if (pathParts.length < 3 || pathParts[0] !== 'posts') {
        logger.error(`Invalid file path structure: ${name}. Could not extract userId.`);
        return;
    }
    const userId = pathParts[1];
    logger.log(`Extracted userId: ${userId} from path: ${name}`);
    const storageBucket = storage.bucket(bucket);
    const originalFile = storageBucket.file(name);
    const tempFilePath = path.join(os.tmpdir(), path.basename(name));
    const tempProcessedPath = path.join(os.tmpdir(), `processed_${path.basename(name)}`);
    let uploadedFile; // Define here to access in catch block
    try {
        await originalFile.download({ destination: tempFilePath });
        logger.log(`Downloaded file to: ${tempFilePath}`);
        await new Promise((resolve, reject) => {
            ffmpeg(tempFilePath)
                .outputOptions([
                "-vcodec libx264", "-crf 28", "-preset veryfast",
                "-profile:v high", "-level 4.0", "-pix_fmt yuv420p",
                "-vf scale=720:-2", "-movflags +faststart",
                "-acodec aac", "-b:a 96k"
            ])
                .on("start", (cmd) => logger.log("FFmpeg command:", cmd))
                .on("error", (err) => { logger.error("FFmpeg error:", err); reject(err); })
                .on("end", () => { logger.log("FFmpeg processing finished successfully."); resolve(); })
                .save(tempProcessedPath);
        });
        const newFileName = `processed_${path.basename(name, path.extname(name))}.mp4`;
        const processedFilePath = path.join(path.dirname(name), newFileName);
        const accessToken = (0, uuid_1.v4)();
        [uploadedFile] = await storageBucket.upload(tempProcessedPath, {
            destination: processedFilePath,
            metadata: {
                contentType: "video/mp4",
                metadata: { firebaseStorageDownloadTokens: accessToken },
            },
        });
        logger.log(`Uploaded processed file to: ${processedFilePath}`);
        const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${storageBucket.name}/o/${encodeURIComponent(processedFilePath)}?alt=media&token=${accessToken}`;
        logger.log(`Generated download URL: ${downloadUrl}`);
        const postDoc = await findPostToUpdate(userId);
        if (!postDoc) {
            logger.error(`FINAL ATTEMPT FAILED: Could not find a matching Firestore document for user ${userId}. Deleting processed file.`);
            await uploadedFile.delete();
            throw new Error("Orphaned processed file deleted due to no matching database entry.");
        }
        logger.log(`Found matching document ${postDoc.id}. Updating...`);
        await postDoc.ref.update({
            mediaUrl: downloadUrl,
            processingComplete: true,
            storagePath: processedFilePath // Also update storage path to processed file
        });
        logger.log(`Successfully updated Firestore document ${postDoc.id}.`);
        await originalFile.delete();
        logger.log(`Deleted original file: ${name}`);
    }
    catch (error) {
        logger.error(`Media processing failed for ${name}:`, error);
        const postDoc = await findPostToUpdate(userId);
        if (postDoc) {
            logger.log(`Marking post ${postDoc.id} as failed.`);
            await postDoc.ref.update({ processingError: "Media processing failed." });
        }
        if (uploadedFile) {
            logger.log(`An error occurred. Deleting potentially orphaned processed file: ${uploadedFile.name}`);
            await uploadedFile.delete();
        }
    }
    finally {
        if (fs.existsSync(tempFilePath))
            fs.unlinkSync(tempFilePath);
        if (fs.existsSync(tempProcessedPath))
            fs.unlinkSync(tempProcessedPath);
        logger.log(`Cleaned up temporary files for ${name}.`);
    }
});
//# sourceMappingURL=process-media.js.map