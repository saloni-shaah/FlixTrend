'use server';

import { v2 as cloudinary } from 'cloudinary';

/**
 * Uploads a file to Cloudinary after ensuring the environment is configured.
 * This is a robust Next.js Server Action.
 * @param formData The FormData object containing the file to upload.
 * @returns A promise that resolves to an object with success status and either a URL or an error message.
 */
export async function uploadToCloudinary(formData: FormData): Promise<{ success: boolean; url?: string; error?: string }> {

  // --- Step 1: Load and Validate Credentials ---
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    const errorMessage = "Server Configuration Error: Cloudinary environment variables are not set. Please ensure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are in your .env.local file and that you have restarted the server.";
    console.error(errorMessage);
    return { success: false, error: errorMessage };
  }

  // --- Step 2: Configure Cloudinary for this specific call ---
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  // --- Step 3: Process the File from FormData ---
  const file = formData.get('file') as File;
  if (!file) {
    return { success: false, error: "No file was found in the form data." };
  }

  // --- Step 4: Upload the File ---
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const url = await new Promise<string>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary Upload Callback Error:', error);
            return reject(new Error(error.message));
          }
          if (result) {
            return resolve(result.secure_url);
          }
          return reject(new Error('Cloudinary upload finished without a result or an error.'));
        }
      );
      uploadStream.end(buffer);
    });

    // --- Step 5: Return Success ---
    return { success: true, url };

  } catch (error) {
    // --- Step 6: Handle Errors Gracefully ---
    const errorMessage = (error instanceof Error) ? error.message : "An unknown error occurred during the upload process.";
    console.error("Error in uploadToCloudinary action:", errorMessage);
    return { success: false, error: errorMessage };
  }
}
