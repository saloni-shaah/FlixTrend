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
const sharp_1 = __importDefault(require("sharp"));
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
function encodeVideo(inputPath, outputPath, height, crf) {
    return new Promise((resolve, reject) => {
        (0, fluent_ffmpeg_1.default)(inputPath)
            .outputOptions([
            "-vcodec", "libx264",
            "-preset", "veryfast",
            "-crf", crf.toString(),
            "-pix_fmt", "yuv420p",
            "-movflags", "+faststart",
            "-acodec", "aac",
            "-b:a", "128k",
            "-maxrate", "3M",
            "-bufsize", "6M",
            "-vf", `scale=-2:${height}`,
        ])
            .on("end", () => resolve())
            .on("error", (err) => reject(new Error(`FFmpeg error: ${err.message}`)))
            .save(outputPath);
    });
}
async function encodeWithRetry(inputPath, outputPath, height, crf, retries = 2) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            if (fs.existsSync(outputPath))
                fs.unlinkSync(outputPath);
            await encodeVideo(inputPath, outputPath, height, crf);
            return;
        }
        catch (err) {
            logger.warn(`Encode attempt ${attempt} failed for ${height}p`, err);
            if (attempt === retries)
                throw err;
            await new Promise((r) => setTimeout(r, 2000 * attempt));
        }
    }
}
function extractAudio(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        (0, fluent_ffmpeg_1.default)(inputPath)
            .outputOptions([
            "-vn",
            "-acodec", "aac",
            "-q:a", "3",
            "-ar", "44100",
            "-ac", "2",
            "-movflags", "+faststart",
        ])
            .on("end", () => resolve())
            .on("error", (err) => reject(new Error(`Audio extract error: ${err.message}`)))
            .save(outputPath);
    });
}
async function extractAudioWithRetry(inputPath, outputPath, retries = 2) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            if (fs.existsSync(outputPath))
                fs.unlinkSync(outputPath);
            await extractAudio(inputPath, outputPath);
            return;
        }
        catch (err) {
            logger.warn(`Audio extract attempt ${attempt} failed`, err);
            if (attempt === retries)
                throw err;
            await new Promise((r) => setTimeout(r, 2000 * attempt));
        }
    }
}
function extractFrame(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        (0, fluent_ffmpeg_1.default)(inputPath)
            .outputOptions(["-vframes", "1", "-ss", "00:00:01", "-vf", "scale=200:-1"])
            .on("end", () => resolve())
            .on("error", (err) => reject(new Error(`Frame extract error: ${err.message}`)))
            .save(outputPath);
    });
}
async function getDominantColor(imagePath) {
    const { dominant } = await (0, sharp_1.default)(imagePath).stats();
    const toHex = (n) => n.toString(16).padStart(2, "0");
    return `#${toHex(dominant.r)}${toHex(dominant.g)}${toHex(dominant.b)}`;
}
exports.processMedia = (0, storage_1.onObjectFinalized)({
    region: "asia-south1",
    cpu: 2,
    memory: "2GiB",
    timeoutSeconds: 540,
}, async (event) => {
    var _a;
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
    // Idempotency: bail if already processed
    const existingDoc = await findPostToUpdate(name);
    if (((_a = existingDoc === null || existingDoc === void 0 ? void 0 : existingDoc.data()) === null || _a === void 0 ? void 0 : _a.processingComplete) === true) {
        logger.info(`Already processed, skipping: ${name}`);
        return;
    }
    // Track uploads per stage for precise rollback
    const encodingUploads = [];
    let firestoreUpdated = false;
    try {
        await originalFile.download({ destination: tempOriginalPath });
        const metadata = await getMetadata(tempOriginalPath);
        const duration = metadata.format.duration || 0;
        const videoStream = metadata.streams.find((s) => s.codec_type === "video");
        const audioStream = metadata.streams.find((s) => s.codec_type === "audio");
        if (!(videoStream === null || videoStream === void 0 ? void 0 : videoStream.width) || !(videoStream === null || videoStream === void 0 ? void 0 : videoStream.height)) {
            throw new Error("Invalid video stream.");
        }
        const originalHeight = videoStream.height;
        const originalWidth = videoStream.width;
        const isPortrait = originalHeight > originalWidth;
        const isFlow = duration <= 240 && isPortrait;
        const hasAudio = !!audioStream;
        logger.info(`Analyzed: duration=${duration}s portrait=${isPortrait} flow=${isFlow} hasAudio=${hasAudio}`);
        const qualities = isFlow
            ? [
                { label: "720p", height: 720, crf: 26 },
                { label: "480p", height: 480, crf: 28 },
            ]
            : [
                { label: "1080p", height: 1080, crf: 23 },
                { label: "720p", height: 720, crf: 25 },
            ];
        // ── Stage 1: Encoding (fatal, rollback on failure) ──────────────────
        const videoQualities = {};
        for (const q of qualities) {
            if (originalHeight < q.height) {
                logger.info(`Skipping ${q.label} (would upscale).`);
                continue;
            }
            const outputName = `processed_${path.basename(name, path.extname(name))}_${q.label}.mp4`;
            const tempOutputPath = path.join(os.tmpdir(), outputName);
            tempFiles.push(tempOutputPath);
            await encodeWithRetry(tempOriginalPath, tempOutputPath, q.height, q.crf);
            const destPath = path.join(path.dirname(name), outputName);
            const token = (0, uuid_1.v4)();
            await bucketRef.upload(tempOutputPath, {
                destination: destPath,
                metadata: {
                    contentType: "video/mp4",
                    metadata: { firebaseStorageDownloadTokens: token },
                },
            });
            encodingUploads.push(destPath);
            videoQualities[q.label] =
                `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(destPath)}?alt=media&token=${token}`;
        }
        // ── Stage 2: Audio extraction (non-fatal, no rollback) ──────────────
        let audioUrl;
        if (isFlow && hasAudio) {
            try {
                const audioName = `audio_${path.basename(name, path.extname(name))}.m4a`;
                const tempAudioPath = path.join(os.tmpdir(), audioName);
                tempFiles.push(tempAudioPath);
                await extractAudioWithRetry(tempOriginalPath, tempAudioPath);
                const audioDestPath = path.join(path.dirname(name), audioName);
                const audioToken = (0, uuid_1.v4)();
                await bucketRef.upload(tempAudioPath, {
                    destination: audioDestPath,
                    metadata: {
                        contentType: "audio/mp4",
                        metadata: { firebaseStorageDownloadTokens: audioToken },
                    },
                });
                audioUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(audioDestPath)}?alt=media&token=${audioToken}`;
                logger.info(`Audio extracted: ${audioDestPath}`);
            }
            catch (audioErr) {
                logger.error(`Audio extraction failed, skipping.`, audioErr);
            }
        }
        // ── Stage 3: Dominant color (non-fatal, no rollback) ────────────────
        let dominantColor;
        try {
            const frameName = `frame_${path.basename(name, path.extname(name))}.png`;
            const tempFramePath = path.join(os.tmpdir(), frameName);
            tempFiles.push(tempFramePath);
            await extractFrame(tempOriginalPath, tempFramePath);
            dominantColor = await getDominantColor(tempFramePath);
            logger.info(`Dominant color: ${dominantColor}`);
        }
        catch (colorErr) {
            logger.error(`Dominant color extraction failed, skipping.`, colorErr);
        }
        // ── Stage 4: Firestore update ────────────────────────────────────────
        const postDoc = await findPostToUpdate(name);
        if (!postDoc)
            throw new Error("No matching Firestore document found.");
        const originalMediaUrl = postDoc.data().mediaUrl;
        const newMediaUrl = isFlow
            ? videoQualities["720p"] || videoQualities["480p"]
            : videoQualities["1080p"] || videoQualities["720p"];
        if (!newMediaUrl)
            logger.warn(`Could not determine new mediaUrl for ${name}.`);
        await postDoc.ref.update(Object.assign(Object.assign({ videoQualities,
            isFlow,
            isPortrait, processingComplete: true, mediaUrl: newMediaUrl || originalMediaUrl, rawMediaUrl: originalMediaUrl }, (audioUrl && { audioUrl })), (dominantColor && { dominantColor })));
        firestoreUpdated = true;
        // ── Stage 5: Delete original (only after confirmed Firestore write) ──
        await originalFile.delete();
        logger.info(`Processing completed for ${name}`);
    }
    catch (error) {
        logger.error(`Processing failed for ${name}`, error);
        try {
            const postDoc = await findPostToUpdate(name);
            if (postDoc) {
                await postDoc.ref.update({
                    processingError: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }
        catch (dbErr) {
            logger.error(`Failed to write error to Firestore`, dbErr);
        }
        // Only roll back encoding uploads — never audio/color, never original
        if (!firestoreUpdated) {
            for (const filePath of encodingUploads) {
                await bucketRef.file(filePath).delete().catch(() => { });
            }
            logger.warn(`Original file retained at ${name} due to encoding failure.`);
        }
    }
    finally {
        for (const file of tempFiles) {
            if (fs.existsSync(file))
                fs.unlinkSync(file);
        }
    }
});
//# sourceMappingURL=process-media.js.map