"use server";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from '@/utils/firebaseClient'; // Import app for storage initialization

const storage = getStorage(app);

export async function uploadFileToFirebaseStorage(formData: FormData) {
  const file = formData.get('file') as File;
  const userId = formData.get('userId') as string;

  if (!file || !userId) {
    return { failure: "File or user ID missing." };
  }

  try {
    const fileName = `${userId}-${Date.now()}-${file.name}`;
    const storageRef = ref(storage, `user_uploads/${fileName}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return { success: { url: downloadURL } };
  } catch (error: any) {
    console.error("Upload failed:", error);
    return { failure: error.message };
  }
}
