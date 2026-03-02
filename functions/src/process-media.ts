
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
    const uploadedPaths: string[] = [];

    try {
      await originalFile.download({ destination: tempOriginalPath });

      const metadata = await getMetadata(tempOriginalPath);
      const duration = metadata.format.duration || 0;
      const videoStream = metadata.streams.find(
        (s: ffmpeg.FfprobeStream) => s.codec_type === "video"
      );

      if (!videoStream?.width || !videoStream?.height) {
        throw new Error("Invalid video stream.");
      }

      const originalWidth = videoStream.width;
      const originalHeight = videoStream.height;

      const isPortrait = originalHeight > originalWidth;
      const isFlow = duration <= 240 && isPortrait;

      logger.info(
        `Analyzed: duration=${duration}s portrait=${isPortrait} flow=${isFlow}`
      );

      const qualities: { label: string; height: number; crf: number }[] = [];

      if (isFlow) {
        qualities.push(
          { label: "720p", height: 720, crf: 28 },
          { label: "480p", height: 480, crf: 30 }
        );
      } else {
        qualities.push(
          { label: "1080p", height: 1080, crf: 24 },
          { label: "720p", height: 720, crf: 26 }
        );
      }

      const videoQualities: Record<string, string> = {};

      for (const q of qualities) {
        if (originalHeight < q.height) {
          logger.info(`Skipping ${q.label} (would upscale).`);
          continue;
        }

        const outputName = `processed_${path.basename(
          name,
          path.extname(name)
        )}_${q.label}.mp4`;

        const tempOutputPath = path.join(os.tmpdir(), outputName);
        tempFiles.push(tempOutputPath);

        await new Promise<void>((resolve, reject) => {
          ffmpeg(tempOriginalPath)
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
        const token = uuidv4();

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

      const originalMediaUrl = postDoc.data().mediaUrl as string | undefined;

      let newMediaUrl: string | undefined;
      if (isFlow) {
        newMediaUrl = videoQualities["720p"] || videoQualities["480p"];
      } else {
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
    } catch (error) {
      logger.error(`Processing failed for ${name}`, error);

      const postDoc = await findPostToUpdate(name);
      if (postDoc) {
        await postDoc.ref.update({
          processingError:
            error instanceof Error ? error.message : "Unknown error",
        });
      }

      for (const filePath of uploadedPaths) {
        await bucketRef.file(filePath).delete().catch(() => {});
      }
    } finally {
      for (const file of tempFiles) {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      }
    }
  }
);