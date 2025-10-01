
"use server";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from '@/utils/firebaseClient';
import { z } from 'genkit';
import { contentModerationFlow } from "@/ai/flows/content-moderation-flow";
import { remixImageFlow } from "@/ai/flows/remix-image-flow";
import { RemixImageInputSchema, RemixImageOutputSchema } from "@/ai/schemas/remix-image-schema";

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

export async function remixImageAction(input: z.infer<typeof RemixImageInputSchema>): Promise<{success: z.infer<typeof RemixImageOutputSchema> | null, failure: string | null}> {
    try {
        const result = await remixImageFlow(input);
        return { success: result, failure: null };
    } catch(err: any) {
        console.error("Remix image action error:", err);
        return { success: null, failure: err.message || 'An unknown error occurred during image remixing.' };
    }
}

const ModerationInputSchema = z.object({
  text: z.string().optional(),
  media: z.array(z.object({ url: z.string() })).optional(),
});

export async function runContentModerationAction(input: z.infer<typeof ModerationInputSchema>) {
    try {
        const result = await contentModerationFlow(input);
        return { success: result, failure: null };
    } catch (error: any) {
        console.error("Content moderation action error:", error);
        return { success: null, failure: error.message || "An unknown error occurred during moderation." };
    }
}

export { contentModerationFlow };

