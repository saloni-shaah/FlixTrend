'use server';

import { v2 as cloudinary } from 'cloudinary';
import { revalidatePath } from 'next/cache';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { v4 as uuidv4 } from 'uuid';

// --- Cloudinary Configuration & Upload ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadToCloudinary(formData: FormData) {
  const file = formData.get('file') as File;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  try {
    const results: any = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }).end(buffer);
    });
    return { success: true, url: results.secure_url };
  } catch (error) {
    console.error('Cloudinary upload failed:', error);
    return { success: false, error: 'Upload failed' };
  }
}

// --- Firebase Admin Configuration & Upload ---
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  });
}

export async function uploadFileToFirebaseStorage(formData: FormData) {
  const file = formData.get('file') as File;
  const userId = formData.get('userId') as string;

  if (!file || !userId) {
    return { failure: 'File or user ID is missing.' };
  }
  
  const bucket = getStorage().bucket();
  const fileExtension = file.name.split('.').pop();
  const fileName = `${userId}/${uuidv4()}.${fileExtension}`;
  const blob = bucket.file(fileName);
  
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  try {
    await new Promise((resolve, reject) => {
      const blobStream = blob.createWriteStream({
        metadata: {
          contentType: file.type,
        },
      });

      blobStream.on('error', (err) => {
        console.error('Firebase upload stream error:', err);
        reject(err);
      });

      blobStream.on('finish', () => {
        // The public URL can be constructed like this.
        // You might want to make it a signed URL for private files.
        const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileName)}?alt=media`;
        resolve(publicUrl);
      });

      blobStream.end(buffer);
    });

    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileName)}?alt=media`;
    return { success: { url: publicUrl } };

  } catch (error) {
    console.error('Firebase upload failed:', error);
    return { failure: 'Firebase upload process failed.' };
  }
}
