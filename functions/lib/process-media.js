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
ffmpeg.setFfmpegPath(ffmpeg_1.path);
const db = (0, firestore_1.getFirestore)();
const storage = (0, storage_2.getStorage)();
exports.processMedia = (0, storage_1.onObjectFinalized)({ region: "asia-south1", cpu: 2, timeoutSeconds: 300, memory: "1GiB" }, async (event) => {
    const { bucket, name, contentType } = event.data;
    if (!name || !contentType) {
        logger.log("Missing name or contentType.");
        return;
    }
    if (path.basename(name).startsWith("processed_")) {
        logger.log(`File ${name} is already processed. Skipping.`);
        return;
    }
    const storageBucket = storage.bucket(bucket);
    const originalFile = storageBucket.file(name);
    const tempFilePath = path.join(os.tmpdir(), path.basename(name));
    const processedFileName = `processed_${path.basename(name)}`;
    const tempProcessedPath = path.join(os.tmpdir(), processedFileName);
    try {
        await originalFile.download({ destination: tempFilePath });
        logger.log(`Downloaded file to: ${tempFilePath}`);
        let command = ffmpeg(tempFilePath);
        let newContentType = contentType;
        let newFileName = processedFileName;
        if (contentType.startsWith("video/")) {
            newContentType = "video/mp4";
            newFileName = newFileName.replace(/(\.[^/.]+)$/, ".mp4");
            if (name.startsWith("posts/")) {
                logger.log("Processing as 'post' video.");
                command.outputOptions([
                    "-vcodec libx264", "-crf 23", "-preset medium",
                    "-vf", "scale=1080:-2", "-acodec aac", "-b:a 128k",
                    "-movflags +faststart"
                ]);
            }
            else if (name.startsWith("flashes/") || name.startsWith("chat_media/")) {
                logger.log("Processing as 'flash' or 'chat' video.");
                command.outputOptions([
                    "-vf", "scale=720:-2", "-crf 28", "-preset fast",
                    "-r 30", "-movflags +faststart"
                ]);
            }
        }
        else if (contentType.startsWith("audio/") || name.startsWith("voice_messages/")) {
            logger.log("Processing as 'audio' or 'voice' message.");
            newContentType = "audio/opus";
            newFileName = newFileName.replace(/(\.[^/.]+)$/, ".opus");
            command.outputOptions(["-c:a libopus", "-b:a 32k"]);
        }
        else if (contentType.startsWith("image/")) {
            logger.log("Processing as 'image'.");
            newContentType = "image/webp";
            newFileName = newFileName.replace(/(\.[^/.]+)$/, ".webp");
            command.outputOptions(["-c:v libwebp", "-quality 75"]);
        }
        else {
            logger.log(`Unsupported content type: ${contentType}. Skipping.`);
            fs.unlinkSync(tempFilePath);
            return;
        }
        await new Promise((resolve, reject) => {
            command
                .on("start", (cmd) => logger.log("FFmpeg command:", cmd))
                .on("error", (err, stdout, stderr) => {
                logger.error("FFmpeg error:", err.message);
                logger.error("FFmpeg stderr:", stderr);
                reject(err);
            })
                .on("end", () => {
                logger.log("FFmpeg processing finished successfully.");
                resolve();
            })
                .save(tempProcessedPath);
        });
        const processedFilePath = path.join(path.dirname(name), newFileName);
        const [uploadedFile] = await storageBucket.upload(tempProcessedPath, {
            destination: processedFilePath,
            metadata: { contentType: newContentType },
        });
        logger.log(`Uploaded processed file to: ${processedFilePath}`);
        const publicUrl = uploadedFile.publicUrl();
        const pathParts = name.split("/");
        const collectionName = pathParts[0];
        const userId = pathParts[1];
        if (['posts', 'flashes', 'drops'].includes(collectionName)) {
            const collectionRef = db.collection(collectionName);
            const q = collectionRef
                .where("userId", "==", userId)
                .where("processingComplete", "==", false);
            const querySnapshot = await q.get();
            let docToUpdate;
            querySnapshot.forEach(doc => {
                const data = doc.data();
                const rawUrls = Array.isArray(data.rawMediaUrl) ? data.rawMediaUrl : [data.rawMediaUrl];
                const searchPath = encodeURIComponent(name);
                if (rawUrls.some(url => url && url.includes(searchPath))) {
                    docToUpdate = doc;
                }
            });
            if (docToUpdate) {
                logger.log(`Found matching document ${docToUpdate.id} to update.`);
                const data = docToUpdate.data();
                let newMediaUrl = publicUrl;
                if (Array.isArray(data.rawMediaUrl)) {
                    newMediaUrl = [publicUrl];
                }
                await docToUpdate.ref.update({
                    mediaUrl: newMediaUrl,
                    processingComplete: true
                });
                logger.log(`Successfully updated Firestore document ${docToUpdate.id}.`);
            }
            else {
                logger.warn(`Could not find a Firestore document to update for file: ${name}`);
            }
        }
        else if (collectionName === 'user_uploads') {
            const userRef = db.collection('users').doc(userId);
            const doc = await userRef.get();
            if (doc.exists) {
                const updateData = {};
                if (path.basename(name).startsWith('avatar')) {
                    updateData.avatarUrl = publicUrl;
                }
                else if (path.basename(name).startsWith('banner')) {
                    updateData.bannerUrl = publicUrl;
                }
                await userRef.update(updateData);
                logger.log(`Successfully updated user profile for ${userId}.`);
            }
        }
        else if (['chat_media', 'voice_messages'].includes(collectionName)) {
            const chatsRef = db.collectionGroup('messages');
            const q = chatsRef.where('processingComplete', '==', false);
            const querySnapshot = await q.get();
            let docToUpdate;
            querySnapshot.forEach(doc => {
                const data = doc.data();
                const searchPath = encodeURIComponent(name);
                if (data.mediaUrl && data.mediaUrl.includes(searchPath)) {
                    docToUpdate = doc;
                }
            });
            if (docToUpdate) {
                logger.log(`Found matching message ${docToUpdate.id} to update.`);
                await docToUpdate.ref.update({
                    mediaUrl: publicUrl,
                    processingComplete: true
                });
                logger.log(`Successfully updated message ${docToUpdate.id}.`);
            }
        }
        else {
            logger.log(`File path ${name} does not match a known media collection.`);
        }
        await originalFile.delete();
        logger.log(`Deleted original file: ${name}`);
    }
    catch (error) {
        logger.error(`Media processing failed for ${name}:`, error);
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