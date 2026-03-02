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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processMedia = void 0;
const storage_1 = require("firebase-functions/v2/storage");
const storage_2 = require("firebase-admin/storage");
const firestore_1 = require("firebase-admin/firestore");
const logger = __importStar(require("firebase-functions/logger"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const fs = __importStar(require("fs"));
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const ffmpeg_1 = require("@ffmpeg-installer/ffmpeg");
const ffprobe_1 = require("@ffprobe-installer/ffprobe");
const uuid_1 = require("uuid");
fluent_ffmpeg_1.default.setFfmpegPath(ffmpeg_1.path);
fluent_ffmpeg_1.default.setFfprobePath(ffprobe_1.path);
const db = (0, firestore_1.getFirestore)();
const storage = (0, storage_2.getStorage)();
async function findPostToUpdate(storagePath) {
    const postsRef = db.collection("posts");
    const q = postsRef.where("storagePath", "==", storagePath).limit(1);
    const snapshot = await q.get();
    if (snapshot.empty)
        return null;
    return snapshot.docs[0];
}
function getMetadata(filePath) {
    return new Promise((resolve, reject) => {
        fluent_ffmpeg_1.default.ffprobe(filePath, (err, metadata) => {
            if (err)
                reject(err);
            else
                resolve(metadata);
        });
    });
}
exports.processMedia = (0, storage_1.onObjectFinalized)({
    region: "asia-south1",
    cpu: 2,
    memory: "2GiB",
    timeoutSeconds: 540,
}, async (event) => {
    const { bucket, name, contentType } = event.data;
    if (!name ||
        !(contentType === null || contentType === void 0 ? void 0 : contentType.startsWith("video/")) ||
        !name.startsWith("posts/") ||
        path.basename(name).startsWith("processed_")) {
        return;
    }
    const bucketRef = storage.bucket(bucket);
    const originalFile = bucketRef.file(name);
    const tempOriginalPath = path.join(os.tmpdir(), path.basename(name));
    const tempFiles = [tempOriginalPath];
    const uploadedPaths = [];
    try {
        await originalFile.download({ destination: tempOriginalPath });
        const metadata = await getMetadata(tempOriginalPath);
        const duration = metadata.format.duration || 0;
        const videoStream = metadata.streams.find((s) => s.codec_type === "video");
        if (!(videoStream === null || videoStream === void 0 ? void 0 : videoStream.width) || !(videoStream === null || videoStream === void 0 ? void 0 : videoStream.height)) {
            throw new Error("Invalid video stream.");
        }
        const originalWidth = videoStream.width;
        const originalHeight = videoStream.height;
        const isPortrait = originalHeight > originalWidth;
        const isFlow = duration <= 240 && isPortrait;
        logger.info(`Analyzed: duration=${duration}s portrait=${isPortrait} flow=${isFlow}`);
        const qualities = [];
        if (isFlow) {
            qualities.push({ label: "720p", height: 720, crf: 28 }, { label: "480p", height: 480, crf: 30 });
        }
        else {
            qualities.push({ label: "1080p", height: 1080, crf: 24 }, { label: "720p", height: 720, crf: 26 });
        }
        const videoQualities = {};
        for (const q of qualities) {
            if (originalHeight < q.height) {
                logger.info(`Skipping ${q.label} (would upscale).`);
                continue;
            }
            const outputName = `processed_${path.basename(name, path.extname(name))}_${q.label}.mp4`;
            const tempOutputPath = path.join(os.tmpdir(), outputName);
            tempFiles.push(tempOutputPath);
            await new Promise((resolve, reject) => {
                (0, fluent_ffmpeg_1.default)(tempOriginalPath)
                    .outputOptions([
                    "-vcodec", "libx264",
                    "-preset", "veryfast",
                    "-crf", q.crf.toString(),
                    "-pix_fmt", "yuv420p",
                    "-movflags", "+faststart",
                    "-acodec", "aac",
                    "-b:a", "128k",
                    "-maxrate", "3M",
                    "-bufsize", "6M",
                    "-vf", `scale=-2:${q.height}`,
                    "-threads", "1",
                ])
                    .on("end", () => resolve())
                    .on("error", (err) => reject(new Error(`FFmpeg error on ${q.label}: ${err.message}`)))
                    .save(tempOutputPath);
            });
            const destPath = path.join(path.dirname(name), outputName);
            const token = (0, uuid_1.v4)();
            await bucketRef.upload(tempOutputPath, {
                destination: destPath,
                metadata: {
                    contentType: "video/mp4",
                    metadata: {
                        firebaseStorageDownloadTokens: token,
                    },
                },
            });
            uploadedPaths.push(destPath);
            videoQualities[q.label] =
                `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(destPath)}?alt=media&token=${token}`;
        }
        const postDoc = await findPostToUpdate(name);
        if (!postDoc) {
            throw new Error("No matching Firestore document found.");
        }
        const originalMediaUrl = postDoc.data().mediaUrl;
        let newMediaUrl;
        if (isFlow) {
            newMediaUrl = videoQualities["720p"] || videoQualities["480p"];
        }
        else {
            newMediaUrl = videoQualities["1080p"] || videoQualities["720p"];
        }
        if (!newMediaUrl) {
            logger.warn(`Could not determine new mediaUrl for ${name}.`);
        }
        await postDoc.ref.update({
            videoQualities,
            isFlow,
            isPortrait,
            processingComplete: true,
            mediaUrl: newMediaUrl || originalMediaUrl,
            rawMediaUrl: originalMediaUrl,
        });
        await originalFile.delete();
        logger.info(`Processing completed for ${name}`);
    }
    catch (error) {
        logger.error(`Processing failed for ${name}`, error);
        const postDoc = await findPostToUpdate(name);
        if (postDoc) {
            await postDoc.ref.update({
                processingError: error instanceof Error ? error.message : "Unknown error",
            });
        }
        for (const filePath of uploadedPaths) {
            await bucketRef.file(filePath).delete().catch(() => { });
        }
    }
    finally {
        for (const file of tempFiles) {
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
            }
        }
    }
});
//# sourceMappingURL=process-media.js.map