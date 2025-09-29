
"use server";

import { chatWithAlmighty } from "almighty/src/ai/flows/ai-chatbot-impersonation";
import type { ChatWithAlmightyInput } from "almighty/src/ai/flows/ai-chatbot-impersonation";
import { remixImage } from "almighty/src/ai/flows/remix-image-flow";
import {
  RemixImageInput,
  RemixImageInputSchema,
} from 'almighty/src/ai/schemas/remix-image-schema';
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

    