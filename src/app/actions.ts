
"use server";

import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from '@/utils/firebaseClient';

export async function uploadFileToFirebaseStorage(formData: FormData) {
  const file = formData.get('file') as File;

  if (!file) {
    return { failure: 'No file found in form data.' };
  }

  try {
    const storage = getStorage(app);
    const fileName = `${Date.now()}-${file.name.replace(/ /g, '_')}`;
    const storageRef = ref(storage, fileName);

    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return { success: { url: downloadURL } };
  } catch (error) {
    console.error("Firebase Storage upload error:", error);
    return { failure: 'Could not upload file to Firebase Storage.' };
  }
}
