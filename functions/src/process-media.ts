
import { onObjectFinalized } from "firebase-functions/v2/storage";
import { getStorage } from "firebase-admin/storage";
import { getFirestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import * as ffmpeg from "fluent-ffmpeg";
import { path as ffmpegPath } from "@ffmpeg-installer/ffmpeg";

ffmpeg.setFfmpegPath(ffmpegPath);

const db = getFirestore();
const storage = getStorage();

export const processMedia = onObjectFinalized({ region: "asia-south1", cpu: 2, timeoutSeconds: 300, memory: "1GiB" }, async (event) => {
    const { bucket, name, contentType } = event.data;

    if (!name || !contentType) {
        logger.log("Missing name or contentType.");
        return;
    }

    if (path.basename(name).startsWith("processed_")) {
        logger.log(`File ${name} is already processed. Skipping.`);
        return;
    }

    if (!name.startsWith("posts/") || !contentType.startsWith("video/")) {
        logger.log(`File ${name} is not a video post. Skipping.`);
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

        await new Promise<void>((resolve, reject) => {
            ffmpeg(tempFilePath)
                .outputOptions([
                    "-vcodec libx264",
                    "-crf 28",         // More aggressive compression for smaller file size
                    "-preset slow",      // Slower preset for better compression efficiency
                    "-vf", "scale=1080:-2", // Scale to 1080p width, maintaining aspect ratio
                    "-acodec aac",
                    "-b:a 128k",       // Standard audio bitrate
                    "-movflags +faststart" // Optimize for web streaming
                ])
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

        const newContentType = "video/mp4";
        const newFileName = `processed_${path.basename(name, path.extname(name))}.mp4`;
        const processedFilePath = path.join(path.dirname(name), newFileName);

        const [uploadedFile] = await storageBucket.upload(tempProcessedPath, {
            destination: processedFilePath,
            metadata: { contentType: newContentType },
        });
        logger.log(`Uploaded processed file to: ${processedFilePath}`);

        const [signedUrl] = await uploadedFile.getSignedUrl({
            action: "read",
            expires: "01-01-3024", // Set expiration date 1000 years in the future
        });
        logger.log(`Generated signed URL: ${signedUrl}`);

        const pathParts = name.split("/");
        const collectionName = pathParts[0];
        const userId = pathParts[1];

        if (collectionName === 'posts') {
            const collectionRef = db.collection(collectionName);
            const q = collectionRef
                .where("userId", "==", userId)
                .where("processingComplete", "==", false);

            const querySnapshot = await q.get();
            let docToUpdate: FirebaseFirestore.QueryDocumentSnapshot | undefined;

            querySnapshot.forEach(doc => {
                const data = doc.data();
                const searchPath = encodeURIComponent(name);
                if (data.rawMediaUrl) {
                    const rawUrls = Array.isArray(data.rawMediaUrl) ? data.rawMediaUrl : [data.rawMediaUrl];
                    if (rawUrls.some(url => url && url.includes(searchPath))) {
                        docToUpdate = doc;
                    }
                }
            });

            if (docToUpdate) {
                logger.log(`Found matching document ${docToUpdate.id} to update.`);
                const data = docToUpdate.data();
                let newMediaUrl: string | string[] = signedUrl;

                if (Array.isArray(data.mediaUrl)) {
                    newMediaUrl = [signedUrl];
                }

                await docToUpdate.ref.update({
                    mediaUrl: newMediaUrl,
                    processingComplete: true,
                });
                logger.log(`Successfully updated Firestore document ${docToUpdate.id}.`);
            } else {
                logger.warn(`Could not find a Firestore document to update for file: ${name}`);
            }
        }

        await originalFile.delete();
        logger.log(`Deleted original file: ${name}`);

    } catch (error) {
        logger.error(`Media processing failed for ${name}:`, error);
    } finally {
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        if (fs.existsSync(tempProcessedPath)) fs.unlinkSync(tempProcessedPath);
        logger.log(`Cleaned up temporary files for ${name}.`);
    }
});
