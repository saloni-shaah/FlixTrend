import { onObjectFinalized } from "firebase-functions/v2/storage";
import { getStorage } from "firebase-admin/storage";
import { getFirestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import { path as ffmpegPath } from "@ffmpeg-installer/ffmpeg";
import { path as ffprobePath } from "@ffprobe-installer/ffprobe";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const db = getFirestore();
const storage = getStorage();

async function findPostToUpdate(storagePath: string) {
  const postsRef = db.collection("posts");
  const q = postsRef.where("storagePath", "==", storagePath).limit(1);
  const snapshot = await q.get();
  if (snapshot.empty) return null;
  return snapshot.docs[0];
}

function getMetadata(filePath: string): Promise<ffmpeg.FfprobeData> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err: Error, metadata: ffmpeg.FfprobeData) => {
      if (err) reject(err);
      else resolve(metadata);
    });
  });
}

function encodeVideo(
  inputPath: string,
  outputPath: string,
  height: number,
  crf: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
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

async function encodeWithRetry(
  inputPath: string,
  outputPath: string,
  height: number,
  crf: number,
  retries = 2
): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      await encodeVideo(inputPath, outputPath, height, crf);
      return;
    } catch (err) {
      logger.warn(`Encode attempt ${attempt} failed for ${height}p`, err);
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
}

function extractAudio(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
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

async function extractAudioWithRetry(
  inputPath: string,
  outputPath: string,
  retries = 2
): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      await extractAudio(inputPath, outputPath);
      return;
    } catch (err) {
      logger.warn(`Audio extract attempt ${attempt} failed`, err);
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
}

function extractFrame(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions(["-vframes", "1", "-ss", "00:00:01", "-vf", "scale=200:-1"])
      .on("end", () => resolve())
      .on("error", (err) => reject(new Error(`Frame extract error: ${err.message}`)))
      .save(outputPath);
  });
}

async function getDominantColor(imagePath: string): Promise<string> {
  const { dominant } = await sharp(imagePath).stats();
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(dominant.r)}${toHex(dominant.g)}${toHex(dominant.b)}`;
}

export const processMedia = onObjectFinalized(
  {
    region: "asia-south1",
    cpu: 2,
    memory: "2GiB",
    timeoutSeconds: 540,
  },
  async (event) => {
    const { bucket, name, contentType } = event.data;

    if (
      !name ||
      !contentType?.startsWith("video/") ||
      !name.startsWith("posts/") ||
      path.basename(name).startsWith("processed_")
    ) {
      return;
    }

    const bucketRef = storage.bucket(bucket);
    const originalFile = bucketRef.file(name);
    const tempOriginalPath = path.join(os.tmpdir(), path.basename(name));
    const tempFiles: string[] = [tempOriginalPath];

    // Idempotency: bail if already processed
    const existingDoc = await findPostToUpdate(name);
    if (existingDoc?.data()?.processingComplete === true) {
      logger.info(`Already processed, skipping: ${name}`);
      return;
    }

    // Track uploads per stage for precise rollback
    const encodingUploads: string[] = [];
    let firestoreUpdated = false;

    try {
      await originalFile.download({ destination: tempOriginalPath });

      const metadata = await getMetadata(tempOriginalPath);
      const duration = metadata.format.duration || 0;
      const videoStream = metadata.streams.find(
        (s: ffmpeg.FfprobeStream) => s.codec_type === "video"
      );
      const audioStream = metadata.streams.find(
        (s: ffmpeg.FfprobeStream) => s.codec_type === "audio"
      );

      if (!videoStream?.width || !videoStream?.height) {
        throw new Error("Invalid video stream.");
      }

      const originalHeight = videoStream.height;
      const originalWidth = videoStream.width;
      const isPortrait = originalHeight > originalWidth;
      const isFlow = duration <= 240 && isPortrait;
      const hasAudio = !!audioStream;

      logger.info(`Analyzed: duration=${duration}s portrait=${isPortrait} flow=${isFlow} hasAudio=${hasAudio}`);

      const qualities: { label: string; height: number; crf: number }[] = isFlow
        ? [
            { label: "720p", height: 720, crf: 26 },
            { label: "480p", height: 480, crf: 28 },
          ]
        : [
            { label: "1080p", height: 1080, crf: 23 },
            { label: "720p", height: 720, crf: 25 },
          ];

      // ── Stage 1: Encoding (fatal, rollback on failure) ──────────────────
      const videoQualities: Record<string, string> = {};

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
        const token = uuidv4();

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
      let audioUrl: string | undefined;
      if (isFlow && hasAudio) {
        try {
          const audioName = `audio_${path.basename(name, path.extname(name))}.m4a`;
          const tempAudioPath = path.join(os.tmpdir(), audioName);
          tempFiles.push(tempAudioPath);

          await extractAudioWithRetry(tempOriginalPath, tempAudioPath);

          const audioDestPath = path.join(path.dirname(name), audioName);
          const audioToken = uuidv4();

          await bucketRef.upload(tempAudioPath, {
            destination: audioDestPath,
            metadata: {
              contentType: "audio/mp4",
              metadata: { firebaseStorageDownloadTokens: audioToken },
            },
          });

          audioUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(audioDestPath)}?alt=media&token=${audioToken}`;
          logger.info(`Audio extracted: ${audioDestPath}`);
        } catch (audioErr) {
          logger.error(`Audio extraction failed, skipping.`, audioErr);
        }
      }

      // ── Stage 3: Dominant color (non-fatal, no rollback) ────────────────
      let dominantColor: string | undefined;
      try {
        const frameName = `frame_${path.basename(name, path.extname(name))}.png`;
        const tempFramePath = path.join(os.tmpdir(), frameName);
        tempFiles.push(tempFramePath);
        await extractFrame(tempOriginalPath, tempFramePath);
        dominantColor = await getDominantColor(tempFramePath);
        logger.info(`Dominant color: ${dominantColor}`);
      } catch (colorErr) {
        logger.error(`Dominant color extraction failed, skipping.`, colorErr);
      }

      // ── Stage 4: Firestore update ────────────────────────────────────────
      const postDoc = await findPostToUpdate(name);
      if (!postDoc) throw new Error("No matching Firestore document found.");

      const originalMediaUrl = postDoc.data().mediaUrl as string | undefined;
      const newMediaUrl = isFlow
        ? videoQualities["720p"] || videoQualities["480p"]
        : videoQualities["1080p"] || videoQualities["720p"];

      if (!newMediaUrl) logger.warn(`Could not determine new mediaUrl for ${name}.`);

      await postDoc.ref.update({
        videoQualities,
        isFlow,
        isPortrait,
        processingComplete: true,
        mediaUrl: newMediaUrl || originalMediaUrl,
        rawMediaUrl: originalMediaUrl,
        ...(audioUrl && { audioUrl }),
        ...(dominantColor && { dominantColor }),
      });

      firestoreUpdated = true;

      // ── Stage 5: Delete original (only after confirmed Firestore write) ──
      await originalFile.delete();

      logger.info(`Processing completed for ${name}`);
    } catch (error) {
      logger.error(`Processing failed for ${name}`, error);

      try {
        const postDoc = await findPostToUpdate(name);
        if (postDoc) {
          await postDoc.ref.update({
            processingError: error instanceof Error ? error.message : "Unknown error",
          });
        }
      } catch (dbErr) {
        logger.error(`Failed to write error to Firestore`, dbErr);
      }

      // Only roll back encoding uploads — never audio/color, never original
      if (!firestoreUpdated) {
        for (const filePath of encodingUploads) {
          await bucketRef.file(filePath).delete().catch(() => {});
        }
        logger.warn(`Original file retained at ${name} due to encoding failure.`);
      }
    } finally {
      for (const file of tempFiles) {
        if (fs.existsSync(file)) fs.unlinkSync(file);
      }
    }
  }
);