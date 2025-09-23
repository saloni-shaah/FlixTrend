
"use server";

import { chatWithAlmighty } from "almighty/src/ai/flows/ai-chatbot-impersonation";
import type { ChatWithAlmightyInput } from "almighty/src/ai/flows/ai-chatbot-impersonation";
import { remixImage } from "almighty/src/ai/flows/remix-image-flow";
import {
  RemixImageInput,
  RemixImageInputSchema,
} from 'almighty/src/ai/schemas/remix-image-schema';
import { Storage } from '@google-cloud/storage';

let storage: Storage | undefined;
let bucket: any;

function initializeStorage() {
  if (storage) return;

  const projectId = process.env.GCP_PROJECT_ID;
  const keyJson = process.env.GCP_SERVICE_ACCOUNT_KEY_JSON;
  const bucketName = process.env.GCS_BUCKET_NAME;

  if (!projectId || !keyJson || !bucketName) {
    throw new Error("Google Cloud Storage environment variables are not properly configured.");
  }

  storage = new Storage({
    projectId: projectId,
    credentials: JSON.parse(keyJson),
  });

  bucket = storage.bucket(bucketName);
}


export async function uploadFileToGCS(formData: FormData) {
  try {
    initializeStorage();
  } catch (error: any) {
    console.error(error.message);
    return { failure: "Server is not configured for file uploads. Please set up Google Cloud Storage environment variables." };
  }

  const file = formData.get('file') as File;

  if (!file) {
    return { failure: 'No file found in form data.' };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = `${Date.now()}-${file.name.replace(/ /g, '_')}`;
  const blob = bucket.file(fileName);

  const blobStream = blob.createWriteStream({
    resumable: false,
    contentType: file.type,
  });

  return new Promise((resolve, reject) => {
    blobStream.on('error', (err) => {
      console.error(err);
      resolve({ failure: 'Could not upload file.' });
    });

    blobStream.on('finish', () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
      resolve({ success: { url: publicUrl } });
    });

    blobStream.end(buffer);
  });
}

export async function getAlmightyResponse(input: ChatWithAlmightyInput) {
  try {
    const output = await chatWithAlmighty(input);
    return { success: output };
  } catch (error) {
    console.error(error);
    return { failure: "An error occurred while communicating with the AI." };
  }
}

export async function remixImageAction(input: RemixImageInput) {
  const parsedInput = RemixImageInputSchema.safeParse(input);
  if (!parsedInput.success) {
    return { failure: "Invalid input" };
  }

  try {
    const output = await remixImage(parsedInput.data);
    return { success: output };
  } catch (error) {
    console.error(error);
    return { failure: "An error occurred while remixing the image." };
  }
}
