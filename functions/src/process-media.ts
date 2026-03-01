
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { getStorage } from "firebase-admin/storage";
import * as logger from "firebase-functions/logger";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import * as ffmpeg from "fluent-ffmpeg";
import { path as ffmpegPath } from "@ffmpeg-installer/ffmpeg";

// Set the path for the ffmpeg binary
ffmpeg.setFfmpegPath(ffmpegPath);

const storage = getStorage();

export const processVideoPost = onDocumentCreated({
    document: "posts/{postId}",
    region: "asia-south1",
    cpu: 2,
    timeoutSeconds: 300,
    memory: "1GiB"
}, async (event) => {
    logger.log("Function triggered by post creation.");

    const snapshot = event.data;
    if (!snapshot) {
        logger.log("No data associated with the event. Exiting.");
        return;
    }

    const postData = snapshot.data();
    const postId = event.params.postId;

    // 1. Validate the Post Data
    if (postData.mediaType !== 'video' || !postData.rawMediaUrl || postData.processingComplete) {
        logger.log(`Post ${postId} is not a new video post requiring processing. Exiting.`);
        return;
    }

    logger.log(`Starting video processing for post: ${postId}`);

    const rawUrl = postData.rawMediaUrl[0]; // Assuming rawMediaUrl is an array
    const bucket = storage.bucket();

    // 2. Extract File Path from URL
    let originalFilePath: string;
    try {
        const url = new URL(rawUrl);
        originalFilePath = decodeURIComponent(url.pathname.split('/o/')[1]);
    } catch (e) {
        logger.error("Invalid rawMediaUrl:", rawUrl, e);
        await snapshot.ref.update({ processingComplete: true, processingError: "Invalid URL" });
        return;
    }

    const originalFile = bucket.file(originalFilePath);
    const tempFilePath = path.join(os.tmpdir(), path.basename(originalFilePath));
    const processedFileName = `processed_${path.basename(originalFilePath)}`;
    const tempProcessedPath = path.join(os.tmpdir(), processedFileName);

    try {
        // 3. Download the original file
        await originalFile.download({ destination: tempFilePath });
        logger.log(`Downloaded file to: ${tempFilePath}`);

        // 4. Process the video with ffmpeg
        await new Promise<void>((resolve, reject) => {
            ffmpeg(tempFilePath)
                .outputOptions([
                    "-vcodec libx264",
                    "-crf 28",
                    "-preset slow",
                    "-vf", "scale=1080:-2",
                    "-acodec aac",
                    "-b:a 128k",
                    "-movflags +faststart"
                ])
                .on("start", (cmd: string) => logger.log("FFmpeg command:", cmd))
                .on("error", (err: any, stdout: any, stderr: any) => {
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

        // 5. Upload the processed file
        const processedFilePath = path.join(path.dirname(originalFilePath), processedFileName);
        const [uploadedFile] = await bucket.upload(tempProcessedPath, {
            destination: processedFilePath,
            metadata: { contentType: "video/mp4" },
        });
        logger.log(`Uploaded processed file to: ${processedFilePath}`);

        // 6. Generate a long-lived signed URL
        const [signedUrl] = await uploadedFile.getSignedUrl({
            action: "read",
            expires: "01-01-3024", // ~1000 years
        });
        logger.log("Generated signed URL successfully.");

        // 7. Update the Firestore document
        await snapshot.ref.update({
            mediaUrl: [signedUrl],
            processingComplete: true
        });
        logger.log(`Successfully updated Firestore document ${postId}.`);

        // 8. Delete the original large file
        await originalFile.delete();
        logger.log(`Deleted original file: ${originalFilePath}`);

    } catch (error) {
        logger.error(`Media processing failed for post ${postId}:`, error);
        await snapshot.ref.update({
            processingComplete: true,
            processingError: "Processing failed. Please see function logs."
        });
    } finally {
        // 9. Clean up temporary files
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        if (fs.existsSync(tempProcessedPath)) fs.unlinkSync(tempProcessedPath);
        logger.log("Cleaned up temporary files.");
    }
});
