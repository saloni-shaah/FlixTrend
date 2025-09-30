
"use server";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from '@/utils/firebaseClient';
import { ai } from '@/ai/ai';
import { z } from 'genkit';
import { contentModerationFlow } from "@/ai/flows/content-moderation-flow";

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

const RemixImageInputSchema = z.object({
  photoDataUri: z.string().describe(
      "A photo as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
  prompt: z.string().describe(
      'A text prompt describing the desired style transformation (e.g., "turn this into an anime character").'
  ),
});

const RemixImageOutputSchema = z.object({
  remixedPhotoDataUri: z.string().describe('The remixed image as a data URI.'),
});

export async function remixImageAction(input: z.infer<typeof RemixImageInputSchema>): Promise<{success: z.infer<typeof RemixImageOutputSchema> | null, failure: string | null}> {
    try {
        const { media } = await ai.generate({
            model: 'googleai/gemini-2.5-flash-image-preview',
            prompt: [{ media: { url: input.photoDataUri } }, { text: input.prompt }],
            config: {
                responseModalities: ['TEXT', 'IMAGE'],
            },
        });

        if (!media?.url) {
            throw new Error('Image generation failed to produce an image.');
        }

        return { success: { remixedPhotoDataUri: media.url }, failure: null };

    } catch(err: any) {
        console.error("Remix image action error:", err);
        return { success: null, failure: err.message || 'An unknown error occurred during image remixing.' };
    }
}

// CORRECTED: Server Action to wrap the content moderation flow.
const ModerationInputSchema = z.object({
  text: z.string().optional(),
  media: z.array(z.object({ url: z.string() })).optional(),
});

export async function runContentModerationAction(input: z.infer<typeof ModerationInputSchema>) {
    try {
        // Now running the flow securely on the server.
        const result = await contentModerationFlow.run(input);
        return { success: result, failure: null };
    } catch (error: any) {
        console.error("Content moderation action error:", error);
        return { success: null, failure: error.message || "An unknown error occurred during moderation." };
    }
}
