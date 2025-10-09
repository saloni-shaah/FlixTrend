
"use server";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from '@/utils/firebaseClient'; // Import app for storage initialization

// Client-side action to upload files using Base64
export async function uploadFileToFirebaseStorage(
    { base64, contentType, fileName, userId }: { base64: string; contentType: string; fileName: string; userId: string; }
): Promise<{ success: { url: string } | null; failure: string | null }> {
    if (!userId || !base64 || !contentType || !fileName) {
        return { success: null, failure: 'Authentication or file data is missing.' };
    }

    try {
        const storageInstance = getStorage(app);
        const uniqueFileName = `${userId}-${Date.now()}-${fileName}`;
        const storageRef = ref(storageInstance, `user_uploads/${uniqueFileName}`);
        
        // Convert base64 to buffer
        const buffer = Buffer.from(base64, 'base64');
        
        const snapshot = await uploadBytes(storageRef, buffer, { contentType });
        const downloadURL = await getDownloadURL(snapshot.ref);
        return { success: { url: downloadURL }, failure: null };
    } catch (error: any) {
        console.error('Upload failed:', error);
        return { success: null, failure: error.message || 'File upload failed.' };
    }
}
